"""
Patient History Copilot — FastAPI entry point.
Run with: uvicorn main:app --reload
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.cognee_client import init_cognee
from api.ingest import router as ingest_router
from api.recall import router as recall_router
from api.patients import router as patients_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🧠 Initialising Cognee...")
    await init_cognee()
    print("✅ Cognee ready.")
    yield
    print("👋 Shutting down.")


app = FastAPI(
    title="Patient History Copilot",
    description="AI-powered persistent medical memory — built with Cognee + Claude",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest_router, prefix="/api")
app.include_router(recall_router, prefix="/api")
app.include_router(patients_router, prefix="/api")


@app.get("/")
async def health():
    return {"status": "ok", "app": "Patient History Copilot"}


@app.get("/api/audit")
async def read_audit_log(limit: int = 50):
    import json
    from pathlib import Path
    log_file = Path("audit.jsonl")
    if not log_file.exists():
        return {"entries": []}
    lines = log_file.read_text().strip().splitlines()
    entries = [json.loads(l) for l in lines[-limit:]]
    return {"entries": list(reversed(entries))}