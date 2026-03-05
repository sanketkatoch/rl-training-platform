from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, Float
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    role = Column(String(20), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    prompt = Column(Text, nullable=False)
    status = Column(String(20), default="open")
    created_at = Column(TIMESTAMP, server_default=func.now())


class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    ai_model = Column(String(50), nullable=False)
    response_text = Column(Text, nullable=False)
    response_time = Column(Float, default=0)
    created_at = Column(TIMESTAMP, server_default=func.now())


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    response_id = Column(Integer, ForeignKey("responses.id"))
    annotator_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Integer, nullable=False)
    feedback = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
