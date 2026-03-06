from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# ── USER SCHEMAS ────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    email: str
    role: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── TASK SCHEMAS ────────────────────────────────────────────
class TaskCreate(BaseModel):
    created_by: int
    prompt: str

class TaskResponse(BaseModel):
    id: int
    created_by: int
    prompt: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── RESPONSE SCHEMAS ────────────────────────────────────────
class ResponseCreate(BaseModel):
    task_id: int
    ai_model: str
    response_text: str

class ResponseResponse(BaseModel):
    id: int
    task_id: int
    ai_model: str
    response_text: str
    response_time: float
    created_at: datetime

    class Config:
        from_attributes = True


# ── RATING SCHEMAS ──────────────────────────────────────────
class RatingCreate(BaseModel):
    response_id: int
    annotator_id: int
    score: int
    feedback: str = None

class RatingResponse(BaseModel):
    id: int
    response_id: int
    annotator_id: int
    score: int
    feedback: str = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── RATING UPDATE SCHEMA ────────────────────────────────────
class RatingUpdate(BaseModel):
    annotator_id: int
    score: int = None
    feedback: str = None


# ── RESPONSE UPDATE SCHEMA ──────────────────────────────────
class ResponseUpdate(BaseModel):
    response_text: str = None
    ai_model: str = None
class TaskWithCountResponse(BaseModel):
    id: int
    created_by: int
    prompt: str
    status: str
    created_at: datetime
    response_count: int

    class Config:
        from_attributes = True