import asyncio
import asyncpg
import os
import sys
from dotenv import load_dotenv

# Ensure the backend directory is in the search path
backend_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_path)
load_dotenv(os.path.join(backend_path, ".env"))

async def create_db():
    DB_USER = os.environ.get("DB_USER", "postgres").strip()
    DB_PASSWORD = os.environ.get("DB_PASSWORD", "postgres").strip()
    DB_HOST = os.environ.get("DB_HOST", "localhost").strip()
    DB_PORT = os.environ.get("DB_PORT", "5432").strip()
    DB_NAME = os.environ.get("DB_NAME", "ai_learning_assistant").strip()
    
    print(f"Checking for database '{DB_NAME}' on {DB_HOST}:{DB_PORT} as user '{DB_USER}'...")
    
    try:
        # Connect to default postgres database to run administration command
        conn = await asyncpg.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT,
            database="postgres"
        )
    except Exception as e:
        print(f"Database server connection failed: {e}")
        sys.exit(1)
        
    try:
        # Check if target database exists
        exists = await conn.fetchval(
            f"SELECT 1 FROM pg_database WHERE datname = $1", DB_NAME
        )
        if not exists:
            # CREATE DATABASE cannot run inside a transaction block, so we execute it outside
            await conn.execute(f"CREATE DATABASE {DB_NAME}")
            print(f"Database '{DB_NAME}' created successfully.")
        else:
            print(f"Database '{DB_NAME}' already exists.")
    except Exception as e:
        print(f"Error creating database: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(create_db())
