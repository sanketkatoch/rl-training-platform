from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas

router = APIRouter(
    prefix="/responses",
    tags=["responses"]
)

@router.post("/", response_model=schemas.ResponseResponse)
def create_response(response: schemas.ResponseCreate, db: Session = Depends(get_db)):
    # Check task exists
    task = db.query(models.Task).filter(
        models.Task.id == response.task_id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )
    
    # Check task is still open
    if task.status != "open":
        raise HTTPException(
            status_code=400,
            detail="Task is already completed"
        )
    
    new_response = models.Response(
        task_id=response.task_id,
        ai_model=response.ai_model,
        response_text=response.response_text
    )
    
    db.add(new_response)
    db.commit()
    db.refresh(new_response)
    
    return new_response


@router.get("/", response_model=list[schemas.ResponseResponse])
def get_responses(db: Session = Depends(get_db)):
    responses = db.query(models.Response).all()
    return responses


@router.get("/{response_id}", response_model=schemas.ResponseResponse)
def get_response(response_id: int, db: Session = Depends(get_db)):
    response = db.query(models.Response).filter(
        models.Response.id == response_id
    ).first()
    
    if not response:
        raise HTTPException(
            status_code=404,
            detail="Response not found"
        )
    
    return response


@router.get("/task/{task_id}", response_model=list[schemas.ResponseResponse])
def get_responses_for_task(task_id: int, db: Session = Depends(get_db)):
    responses = db.query(models.Response).filter(
        models.Response.task_id == task_id
    ).all()
    
    return responses


@router.patch("/{response_id}", response_model=schemas.ResponseResponse)
def update_response(response_id: int, response: schemas.ResponseUpdate, db: Session = Depends(get_db)):
    # Check response exists
    existing_response = db.query(models.Response).filter(
        models.Response.id == response_id
    ).first()
    
    if not existing_response:
        raise HTTPException(
            status_code=404,
            detail="Response not found"
        )
    
    # Update only fields that were provided
    if response.response_text is not None:
        existing_response.response_text = response.response_text
    
    if response.ai_model is not None:
        existing_response.ai_model = response.ai_model
    
    db.commit()
    db.refresh(existing_response)
    
    return existing_response
