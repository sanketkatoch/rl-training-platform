from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
import models
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from ai_service import (
    get_llama33_response,
    get_llama31_response,
    get_gpt_oss_120b_response,
    get_gpt_oss_20b_response,
    get_gemini_response
)

router = APIRouter(
    prefix="/stream",
    tags=["stream"]
)

@router.get("/task/{task_id}")
def stream_ai_responses(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        return {"error": "Task not found"}

    prompt = task.prompt

    def generate():
        functions = [
            get_llama33_response,
            get_llama31_response,
            get_gpt_oss_120b_response,
            get_gpt_oss_20b_response,
            get_gemini_response
        ]

        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {executor.submit(fn, prompt): fn for fn in functions}
            for future in as_completed(futures):
                result = future.result()

                # Save to database
                new_response = models.Response(
                    task_id=task_id,
                    ai_model=result["ai_model"],
                    response_text=result["response_text"],
                    response_time=result["response_time"]
                )
                db.add(new_response)
                db.commit()
                db.refresh(new_response)

                # Add db id to result
                result["id"] = new_response.id

                # Stream this result to the frontend immediately
                yield f"data: {json.dumps(result)}\n\n"

        # Signal completion
        yield "data: {\"done\": true}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )
