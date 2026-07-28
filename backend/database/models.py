from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, ForeignKey, DateTime, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database.connection import Base

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="student", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    documents: Mapped[List["UploadedDocument"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    chat_history: Mapped[List["ChatHistory"]] = relationship(back_populates="user", cascade="all, delete-orphan")

class UploadedDocument(Base):
    __tablename__ = "uploaded_documents"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    file_name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    upload_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    document_status: Mapped[str] = mapped_column(String(50), default="Processing", nullable=False)
    
    # Relationships
    user: Mapped[Optional["User"]] = relationship(back_populates="documents")
    chunks: Mapped[List["DocumentChunk"]] = relationship(back_populates="document", cascade="all, delete-orphan")
    chat_history: Mapped[List["ChatHistory"]] = relationship(back_populates="document", cascade="all, delete-orphan")
    summaries: Mapped[List["GeneratedSummary"]] = relationship(back_populates="document", cascade="all, delete-orphan")
    quizzes: Mapped[List["GeneratedQuiz"]] = relationship(back_populates="document", cascade="all, delete-orphan")
    explanations: Mapped[List["TopicExplanation"]] = relationship(back_populates="document", cascade="all, delete-orphan")
    translations: Mapped[List["TranslationHistory"]] = relationship(back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("uploaded_documents.id", ondelete="CASCADE"), index=True, nullable=False)
    chunk_number: Mapped[int] = mapped_column(Integer, nullable=False)
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    page_number: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    
    # Relationships
    document: Mapped["UploadedDocument"] = relationship(back_populates="chunks")

class ChatHistory(Base):
    __tablename__ = "chat_histories"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    document_id: Mapped[Optional[int]] = mapped_column(ForeignKey("uploaded_documents.id", ondelete="SET NULL"), index=True, nullable=True)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user: Mapped[Optional["User"]] = relationship(back_populates="chat_history")
    document: Mapped[Optional["UploadedDocument"]] = relationship(back_populates="chat_history")

class GeneratedSummary(Base):
    __tablename__ = "generated_summaries"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("uploaded_documents.id", ondelete="CASCADE"), index=True, nullable=False)
    summary_type: Mapped[str] = mapped_column(String(50), nullable=False)
    summary_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    document: Mapped["UploadedDocument"] = relationship(back_populates="summaries")

class GeneratedQuiz(Base):
    __tablename__ = "generated_quizzes"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("uploaded_documents.id", ondelete="CASCADE"), index=True, nullable=False)
    quiz_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    document: Mapped["UploadedDocument"] = relationship(back_populates="quizzes")

class TopicExplanation(Base):
    __tablename__ = "topic_explanations"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[Optional[int]] = mapped_column(ForeignKey("uploaded_documents.id", ondelete="SET NULL"), index=True, nullable=True)
    topic: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    document: Mapped[Optional["UploadedDocument"]] = relationship(back_populates="explanations")

class TranslationHistory(Base):
    __tablename__ = "translation_histories"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[Optional[int]] = mapped_column(ForeignKey("uploaded_documents.id", ondelete="SET NULL"), index=True, nullable=True)
    source_language: Mapped[str] = mapped_column(String(50), nullable=False)
    target_language: Mapped[str] = mapped_column(String(50), nullable=False)
    translated_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    document: Mapped[Optional["UploadedDocument"]] = relationship(back_populates="translations")
