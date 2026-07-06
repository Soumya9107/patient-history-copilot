"""
/api/recall — query patient memory.
No LLM — raw SQLite results returned directly.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from core.cognee_client import recall
from core.audit import log_event

router = APIRouter(prefix="/recall", tags=["recall"])


class AskRequest(BaseModel):
    patient_id: str
    question: str
    top_k: int = 8


class BriefingRequest(BaseModel):
    patient_id: str


@router.post("/ask")
async def ask_question(body: AskRequest):
    chunks = await recall(body.question, body.patient_id)
    top_chunks = chunks[:body.top_k]

    if not top_chunks:
        answer = "No relevant records found. Please ingest some patient data first using the Ingest tab."
    else:
        answer = "\n\n---\n\n".join(
            f"📄 Record {i+1}:\n{chunk['text']}"
            for i, chunk in enumerate(top_chunks)
        )

    await log_event(action="qa", patient_id=body.patient_id,
                    detail={"question": body.question, "chunks_retrieved": len(top_chunks)})

    return {"patient_id": body.patient_id, "question": body.question,
            "answer": answer, "sources_used": len(top_chunks)}


@router.post("/briefing")
async def pre_visit_briefing(body: BriefingRequest):
    # Recall all records for this patient using broad query
    chunks = await recall("conditions medications symptoms allergies diagnosis treatment", body.patient_id)

    if not chunks:
        briefing = "No records found for this patient. Please ingest medical documents first using the Ingest tab."
    else:
        # Build briefing directly from recalled records
        briefing = "📋 Pre-Visit Patient Summary\n"
        briefing += "=" * 40 + "\n\n"
        for i, chunk in enumerate(chunks[:6]):
            briefing += f"📄 Record {i+1}:\n{chunk['text']}\n\n"
            briefing += "-" * 30 + "\n\n"
        briefing += f"Total records found: {len(chunks)}"

    await log_event(action="recall", patient_id=body.patient_id,
                    detail={"type": "pre_visit_briefing", "chunks_retrieved": len(chunks)})

    return {"patient_id": body.patient_id, "briefing": briefing}