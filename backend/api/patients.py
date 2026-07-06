"""
/api/patients — patient management + GDPR forget endpoint.
Uses SQLite for persistence so data survives restarts.
"""

import sqlite3
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.cognee_client import forget
from core.audit import log_event

router = APIRouter(prefix="/patients", tags=["patients"])

DB_PATH = Path("patient_memory.db")


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            patient_id TEXT PRIMARY KEY,
            display_name TEXT NOT NULL,
            date_of_birth_year INTEGER,
            notes TEXT DEFAULT '',
            created_at TEXT,
            memory_active INTEGER DEFAULT 1
        )
    """)
    conn.commit()
    return conn


class PatientCreate(BaseModel):
    patient_id: str
    display_name: str
    date_of_birth_year: int | None = None
    notes: str = ""


@router.get("/")
async def list_patients():
    conn = _get_conn()
    rows = conn.execute("SELECT * FROM patients ORDER BY created_at DESC").fetchall()
    conn.close()
    patients = [
        {"patient_id": r[0], "display_name": r[1], "date_of_birth_year": r[2],
         "notes": r[3], "created_at": r[4], "memory_active": bool(r[5])}
        for r in rows
    ]
    return {"patients": patients}


@router.post("/")
async def create_patient(body: PatientCreate):
    conn = _get_conn()
    existing = conn.execute(
        "SELECT patient_id FROM patients WHERE patient_id = ?", (body.patient_id,)
    ).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=409, detail="Patient ID already exists.")

    created_at = datetime.now(timezone.utc).isoformat()
    conn.execute(
        "INSERT INTO patients VALUES (?, ?, ?, ?, ?, 1)",
        (body.patient_id, body.display_name, body.date_of_birth_year, body.notes, created_at)
    )
    conn.commit()
    conn.close()

    await log_event("register", body.patient_id, detail={"display_name": body.display_name})

    return {"status": "created", "patient": {
        "patient_id": body.patient_id, "display_name": body.display_name,
        "created_at": created_at, "memory_active": True
    }}


@router.get("/{patient_id}")
async def get_patient(patient_id: str):
    conn = _get_conn()
    row = conn.execute(
        "SELECT * FROM patients WHERE patient_id = ?", (patient_id,)
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Patient not found.")
    return {"patient_id": row[0], "display_name": row[1], "memory_active": bool(row[5])}


@router.delete("/{patient_id}/memory")
async def erase_patient_memory(patient_id: str):
    conn = _get_conn()
    row = conn.execute(
        "SELECT patient_id FROM patients WHERE patient_id = ?", (patient_id,)
    ).fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Patient not found.")

    # Delete all medical records for this patient
    result = await forget(patient_id)

    # Mark memory as inactive in patients table
    conn = _get_conn()
    conn.execute(
        "UPDATE patients SET memory_active = 0 WHERE patient_id = ?", (patient_id,)
    )
    conn.commit()
    conn.close()

    await log_event("forget", patient_id, detail={"reason": "gdpr_erasure_request"})

    return {"status": "memory_erased", "patient_id": patient_id,
            "message": "All memory for this patient has been permanently deleted."}