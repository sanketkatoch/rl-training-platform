from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas

router = APIRouter(
    prefix="/ratings",
    tags=["ratings"]
)

@router.post("/", response_model=schemas.RatingResponse)
def create_rating(rating: schemas.RatingCreate, db: Session = Depends(get_db)):
    # Check response exists
    response = db.query(models.Response).filter(
        models.Response.id == rating.response_id
    ).first()
    
    if not response:
        raise HTTPException(
            status_code=404,
            detail="Response not found"
        )
    
    # Check annotator exists
    annotator = db.query(models.User).filter(
        models.User.id == rating.annotator_id
    ).first()
    
    if not annotator:
        raise HTTPException(
            status_code=404,
            detail="Annotator not found"
        )
    
    # Check user is an annotator
    if annotator.role != "annotator":
        raise HTTPException(
            status_code=403,
            detail="Only annotators can submit ratings"
        )
    
    # Check score is between 1 and 5
    if rating.score < 1 or rating.score > 5:
        raise HTTPException(
            status_code=400,
            detail="Score must be between 1 and 5"
        )
    
    # Check annotator hasn't already rated this response
    existing_rating = db.query(models.Rating).filter(
        models.Rating.response_id == rating.response_id,
        models.Rating.annotator_id == rating.annotator_id
    ).first()
    
    if existing_rating:
        raise HTTPException(
            status_code=400,
            detail="Annotator has already rated this response"
        )
    
    new_rating = models.Rating(
        response_id=rating.response_id,
        annotator_id=rating.annotator_id,
        score=rating.score,
        feedback=rating.feedback
    )
    
    db.add(new_rating)
    db.commit()
    db.refresh(new_rating)
    
    # Update task status to completed
    task = db.query(models.Task).filter(
        models.Task.id == response.task_id
    ).first()
    task.status = "completed"
    db.commit()
    
    return new_rating


@router.get("/", response_model=list[schemas.RatingResponse])
def get_ratings(db: Session = Depends(get_db)):
    ratings = db.query(models.Rating).all()
    return ratings


@router.get("/response/{response_id}", response_model=list[schemas.RatingResponse])
def get_ratings_for_response(response_id: int, db: Session = Depends(get_db)):
    ratings = db.query(models.Rating).filter(
        models.Rating.response_id == response_id
    ).all()
    
    return ratings


@router.patch("/{rating_id}", response_model=schemas.RatingResponse)
def update_rating(rating_id: int, rating: schemas.RatingUpdate, db: Session = Depends(get_db)):
    # Check rating exists
    existing_rating = db.query(models.Rating).filter(
        models.Rating.id == rating_id
    ).first()
    
    if not existing_rating:
        raise HTTPException(
            status_code=404,
            detail="Rating not found"
        )
    
    # Check the annotator owns this rating
    if existing_rating.annotator_id != rating.annotator_id:
        raise HTTPException(
            status_code=403,
            detail="You can only update your own ratings"
        )
    
    # Update only the fields that were provided
    if rating.score is not None:
        if rating.score < 1 or rating.score > 5:
            raise HTTPException(
                status_code=400,
                detail="Score must be between 1 and 5"
            )
        existing_rating.score = rating.score
    
    if rating.feedback is not None:
        existing_rating.feedback = rating.feedback
    
    db.commit()
    db.refresh(existing_rating)
    
    return existing_rating
