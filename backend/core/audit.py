import json
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from core.config import AUDIT_LOG_ENABLED

LOG_FILE = Path("audit.jsonl")


async def log_event(action: str, patient_id: str, actor: str = "system", detail: dict = None):
    if not AUDIT_LOG_ENABLED:
        return
    entry = {"ts": datetime.now(timezone.utc).isoformat(), "action": action,
             "patient_id": patient_id, "actor": actor, "detail": detail or {}}
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, lambda: open(LOG_FILE, "a").write(json.dumps(entry) + "\n"))