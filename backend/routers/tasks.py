from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
import models
import schemas

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"]
)

@router.post("/", response_model=schemas.TaskResponse)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.id == task.created_by
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role != "researcher":
        raise HTTPException(status_code=403, detail="Only researchers can create tasks")

    new_task = models.Task(
        created_by=task.created_by,
        prompt=task.prompt,
        status="open"
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return new_task


@router.get("/", response_model=list[schemas.TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    tasks = db.query(models.Task).order_by(desc(models.Task.created_at)).all()
    return tasks


@router.get("/{task_id}", response_model=schemas.TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.delete("/orphaned")
def delete_orphaned_tasks(db: Session = Depends(get_db)):
    tasks = db.query(models.Task).all()
    deleted = 0
    for task in tasks:
        response_count = db.query(models.Response).filter(
            models.Response.task_id == task.id
        ).count()
        if response_count == 0:
            db.delete(task)
            deleted += 1
    db.commit()
    return {"deleted": deleted, "message": f"Cleaned up {deleted} orphaned tasks"}
