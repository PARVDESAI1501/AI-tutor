from pydantic import BaseModel, Field
from typing import Optional


# ─────────────────────────────────────────────
# Ingestion
# ─────────────────────────────────────────────
class IngestRequest(BaseModel):
    source_id: str
    user_id: str


class IngestResponse(BaseModel):
    status: str
    source_id: str
    message: str


class YouTubeIngestRequest(BaseModel):
    url: str
    user_id: str
    title: Optional[str] = None


class YouTubeIngestResponse(BaseModel):
    source_id: str
    status: str
    message: str


# ─────────────────────────────────────────────
# Source Status
# ─────────────────────────────────────────────
class SourceStatusResponse(BaseModel):
    source_id: str
    status: str
    chunk_count: int = 0
    error: Optional[str] = None


# ─────────────────────────────────────────────
# Chat (will be used in Phase 3)
# ─────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    source_id: str
    user_id: str
    conversation_id: Optional[str] = None
    history: list[dict] = Field(default_factory=list)


# ─────────────────────────────────────────────
# Generation (will be used in Phase 4)
# ─────────────────────────────────────────────
class GenerateRequest(BaseModel):
    source_id: str
    user_id: str
    material_type: str  # "summary" | "flashcards" | "quiz"
