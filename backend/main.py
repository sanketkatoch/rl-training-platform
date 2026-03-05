from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import users, tasks, responses, ratings, stream
from dotenv import load_dotenv

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RL Training Data Platform",
    description="A platform for collecting human feedback to train AI agents",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(tasks.router)
app.include_router(responses.router)
app.include_router(ratings.router)
app.include_router(stream.router)

@app.get("/")
def root():
    return {"message": "RL Training Platform is running"}
