import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

def generate_uuid() -> str:
    return str(uuid.uuid4())

def now_iso() -> str:
    return datetime.utcnow().isoformat()
