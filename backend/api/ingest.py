"""
/api/ingest — upload medical documents into local memory store.
No API keys needed — stores directly to SQLite.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

from core.cognee_client import remember, improve
from core.pii_redaction import redact_pii
from core.audit import log_event

router = APIRouter(prefix="/ingest", tags=["ingest"])


@router.post("/document")
async def ingest_document(
    patient_id: str = Form(...),
    source_type: str = Form(...),
    file: UploadFile = File(...),
    is_update: bool = Form(False),
):
    allowed_types = {"application/pdf", "text/plain"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=415, detail="Only PDF and TXT files are supported.")

    raw_bytes = await file.read()

    if file.content_type == "application/pdf":
        try:
            import fitz
            import io
            doc = fitz.open(stream=io.BytesIO(raw_bytes), filetype="pdf")
            raw_text = "\n\n".join(page.get_text("text") for page in doc).strip()
        except Exception:
            raw_text = raw_bytes.decode("utf-8", errors="replace").strip()
    else:
        raw_text = raw_bytes.decode("utf-8", errors="replace").strip()

    if not raw_text.strip():
        raise HTTPException(status_code=422, detail="Could not extract text from file.")

    redacted_text, findings = redact_pii(raw_text)

    if is_update:
        result = await improve(redacted_text, patient_id)
        action = "improve"
    else:
        result = await remember(redacted_text, patient_id, source=source_type)
        action = "remember"

    await log_event(action=action, patient_id=patient_id,
                    detail={"source_type": source_type, "filename": file.filename,
                            "pii_findings_count": len(findings), "char_count": len(redacted_text)})

    return {"status": "ok", "action": action, "patient_id": patient_id,
            "source_type": source_type, "pii_entities_redacted": len(findings)}


class TextIngestRequest(BaseModel):
    patient_id: str
    source_type: str
    content: str
    is_update: bool = False


@router.post("/text")
async def ingest_text(body: TextIngestRequest):
    if not body.content.strip():
        raise HTTPException(status_code=422, detail="Content cannot be empty.")

    redacted_text, findings = redact_pii(body.content)

    if body.is_update:
        result = await improve(redacted_text, body.patient_id)
        action = "improve"
    else:
        result = await remember(redacted_text, body.patient_id, source=body.source_type)
        action = "remember"

    await log_event(action=action, patient_id=body.patient_id,
                    detail={"source_type": body.source_type,
                            "pii_findings_count": len(findings)})

    return {"status": "ok", "action": action, "patient_id": body.patient_id,
            "pii_entities_redacted": len(findings)}