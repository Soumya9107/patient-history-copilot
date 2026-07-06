"""
Local SQLite-based memory store — replaces Cognee for demo.
No API keys needed. Stores and searches patient records locally.
"""

import sqlite3
import os
from pathlib import Path

DB_PATH = Path("patient_memory.db")


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT NOT NULL,
            source TEXT DEFAULT 'note',
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    return conn


async def init_cognee():
    """Initialize local SQLite database."""
    _get_conn().close()
    print("✅ Local SQLite memory store ready.")


async def remember(content: str, patient_id: str, source: str = "document") -> dict:
    """Store medical content in local database."""
    conn = _get_conn()
    conn.execute(
        "INSERT INTO records (patient_id, source, content) VALUES (?, ?, ?)",
        (patient_id, source, content)
    )
    conn.commit()
    conn.close()
    return {"status": "remembered", "patient_id": patient_id, "source": source}


async def recall(query: str, patient_id: str) -> list[dict]:
    """
    Search patient records using keyword matching.
    Splits query into words and finds records containing any of them.
    """
    conn = _get_conn()
    
    # Get all records for this patient
    rows = conn.execute(
        "SELECT content, source FROM records WHERE patient_id = ? ORDER BY created_at DESC",
        (patient_id,)
    ).fetchall()
    conn.close()

    if not rows:
        return []

    # Score each record by how many query words it contains
    query_words = [w.lower() for w in query.split() if len(w) > 2]
    scored = []
    for content, source in rows:
        content_lower = content.lower()
        score = sum(1 for w in query_words if w in content_lower)
        scored.append({"text": f"[{source}]\n{content}", "score": score})

    # Sort by relevance, return top results
    scored.sort(key=lambda x: x["score"], reverse=True)
    return [r for r in scored if r["score"] > 0] or scored[:3]


async def improve(new_content: str, patient_id: str) -> dict:
    """Add new information to patient records."""
    return await remember(new_content, patient_id, source="update")


async def forget(patient_id: str) -> dict:
    """Delete all records for a patient."""
    conn = _get_conn()
    conn.execute("DELETE FROM records WHERE patient_id = ?", (patient_id,))
    conn.commit()
    conn.close()
    return {"status": "forgotten", "patient_id": patient_id}