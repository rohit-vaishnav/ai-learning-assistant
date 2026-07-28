import os
import logging
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

# Set up logging for database transactions
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load local environment variables from backend/.env explicitly and override system environment variables
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path, override=True)

DB_USER = os.environ.get("DB_USER", "postgres").strip()
DB_PASSWORD = os.environ.get("DB_PASSWORD", "postgres").strip()
DB_HOST = os.environ.get("DB_HOST", "").strip()
DB_PORT = os.environ.get("DB_PORT", "5432").strip()
DB_NAME = os.environ.get("DB_NAME", "ai_learning_assistant").strip()

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    if os.environ.get("USE_SQLITE", "").lower() == "true":
        DATABASE_URL = "sqlite+aiosqlite:///./ai_learning_assistant.db"
    elif DB_HOST:
        DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    else:
        DATABASE_URL = "sqlite+aiosqlite:///./ai_learning_assistant.db"

is_sqlite = DATABASE_URL.startswith("sqlite")

logger.info(f"Database connection: Using {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")

try:
    if is_sqlite:
        async_engine = create_async_engine(
            DATABASE_URL,
            echo=False
        )
    else:
        async_engine = create_async_engine(
            DATABASE_URL,
            pool_size=10,
            max_overflow=20,
            pool_timeout=30,
            pool_pre_ping=True,
            echo=False
        )
    
    # Session factory for DB transactions
    async_session = async_sessionmaker(
        bind=async_engine,
        autocommit=False,
        autoflush=False,
        expire_on_commit=False
    )
except Exception as e:
    logger.error(f"Failed to initialize database engine: {e}")
    raise e

class Base(DeclarativeBase):
    """Base declarative class for all SQLAlchemy database models."""
    pass

async def get_db():
    """
    FastAPI dependency injection helper.
    Yields an active database session and ensures proper connection cleanup.
    """
    db = async_session()
    try:
        yield db
    except Exception as e:
        from fastapi import HTTPException
        if not isinstance(e, HTTPException):
            logger.error(f"Database transaction error: {e}")
        await db.rollback()
        raise e
    finally:
        await db.close()
