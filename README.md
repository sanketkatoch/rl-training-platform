# RLHF Data Collection Platform

A full-stack platform for collecting human preference data to support Reinforcement Learning from Human Feedback (RLHF) research. Built end-to-end as a solo project — from infrastructure to annotation UI to seeding pipeline.

**Live demo:** [rl-training-platform.vercel.app](https://rl-training-platform.vercel.app)

---

## What it does

The platform runs a prompt against five LLMs simultaneously, streams their responses in real time, and lets human annotators rate each response. The resulting preference pairs form a dataset that can be used to train a reward model and fine-tune a base LLM via PPO.

This directly mirrors how production RLHF pipelines work at AI labs — the difference being scale and the base model used.

---

## Architecture

```
![Architecture](docs/architecture.svg)
```

---

## Key Features

- **Real-time SSE streaming** — model responses stream into the UI the moment each model finishes, sorted by speed with errors at the bottom
- **5 models in parallel** — all models run simultaneously via `ThreadPoolExecutor`, responses saved to DB as they arrive
- **Two-level accordion UI** — click a task to expand model responses, click a model to read and rate
- **Role-based user system** — researchers create tasks, annotators submit ratings
- **Seeding pipeline** — Python script generates 1,500+ annotated preference pairs overnight across 1,000 unique prompts spanning 20 topic categories
- **Production deployment** — fully live on Vercel + Railway, not just local

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, CSS (dark liquid glass theme) |
| Backend | FastAPI, Python, SQLAlchemy, SSE via `StreamingResponse` |
| Database | PostgreSQL (Railway managed) |
| AI APIs | Groq (LLaMA, GPT-OSS), Google Gemini |
| Deployment | Vercel (frontend), Railway (backend + DB) |
| Infrastructure | Docker, docker-compose (local dev) |

---

## Dataset

The seeding script generates structured preference data across 20 categories:

Science · Technology · History · Philosophy · Economics · Health · Environment · Mathematics · Space · Psychology · Law · Politics · Culture · Food & Nutrition · Geography · Literature & Art · Sports · Finance · Architecture · AI & Future

Each record contains: `prompt`, `model`, `response_text`, `response_time_ms`, `rating (1-5)`, `annotator_id`

---

## Running Locally

**Prerequisites:** Docker, Node.js, Python 3.11+

```bash
# Clone the repo
git clone https://github.com/sanketkatoch/rl-training-platform.git
cd rl-training-platform

# Start PostgreSQL and Redis
docker-compose up -d

# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm start
```

Set the following environment variables in a `.env` file in `/backend`:

```
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
DATABASE_URL=postgresql://user:password@localhost:5432/rlhf
```

---

## Seeding the Database

```bash
# Generate 100 tasks with synthetic ratings
python seed_data.py 100

# Monitor progress
tail -f seed_progress.log
```

---

## Roadmap

- [ ] Export endpoint — download preference pairs as Hugging Face dataset (JSON/CSV)
- [ ] Reward model training — scikit-learn / PyTorch on annotated pairs
- [ ] PPO fine-tuning — Hugging Face TRL with flan-t5-small as base model
- [ ] User authentication — replace user picker with proper login

---

## Research Context

This project was built to gain ground-level understanding of the RLHF pipeline. Most implementations focus on the model training side — this focuses on the data collection infrastructure that makes training possible.

Key engineering decisions documented along the way:
- SSE parsing with `iter_content()` instead of `iter_lines()` to correctly handle `\n\n` event delimiters
- FastAPI route ordering — specific named routes must be defined before dynamic `{param}` routes
- Response IDs returned directly from the SSE stream rather than a secondary fetch call

---

## Author

**Sanket Katoch** — [linkedin.com/in/sanket-katoch](https://linkedin.com/in/sanket-katoch) · [GitHub](https://github.com/sanketkatoch)
