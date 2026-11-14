import re
import csv
import json
import io
from typing import List, Dict, Any, Tuple

# Regex patterns for secrets and sensitive PII
SECRET_PATTERNS = [
    (r'(?i)(api[_-]?key|secret|token|password|passwd|auth[_-]?key)\s*[:=]\s*["\']?([a-zA-Z0-9_\-\.]{12,})["\']?', r'\1: [REDACTED_SECRET]'),
    (r'(?i)(bearer\s+[a-zA-Z0-9_\-\.]{20,})', r'Bearer [REDACTED_TOKEN]'),
    (r'(?i)(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59})', r'[REDACTED_GITHUB_KEY]'),
    (r'AIza[0-9A-Za-z-_]{35}', r'[REDACTED_GOOGLE_API_KEY]'),
    (r'AKIA[0-9A-Z]{16}', r'[REDACTED_AWS_KEY]'),
    (r'(?i)-----BEGIN\s+PRIVATE\s+KEY-----[\s\S]+?-----END\s+PRIVATE\s+KEY-----', r'[REDACTED_PRIVATE_KEY]'),
    (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', r'[REDACTED_EMAIL]'),
    (r'(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?', r'[REDACTED_PHONE]'),
]

def redact_secrets_and_pii(text: str) -> Tuple[str, bool]:
    """Redacts passwords, tokens, API keys, emails, and phone numbers from text."""
    redacted = text
    has_redactions = False
    for pattern, replacement in SECRET_PATTERNS:
        new_text, count = re.subn(pattern, replacement, redacted)
        if count > 0:
            has_redactions = True
            redacted = new_text
    return redacted, has_redactions

def parse_markdown_or_text(content: str, source_title: str) -> List[Dict[str, Any]]:
    """Chunks documents by headings and paragraphs, preserving span tracking."""
    lines = content.splitlines()
    chunks = []
    current_block = []
    start_line = 1

    for idx, line in enumerate(lines, start=1):
        if line.startswith("#") or line.strip() == "---":
            if current_block:
                chunk_text = "\n".join(current_block).strip()
                if chunk_text:
                    redacted, has_redaction = redact_secrets_and_pii(chunk_text)
                    sensitivity = "restricted" if "confidential" in chunk_text.lower() or "secret" in chunk_text.lower() else "internal"
                    chunks.append({
                        "original_text": chunk_text,
                        "redacted_text": redacted,
                        "span_identifier": f"{source_title} (L{start_line}-L{idx-1})",
                        "sensitivity_level": sensitivity,
                        "has_redactions": has_redaction
                    })
                current_block = []
            start_line = idx
        current_block.append(line)
        if len(current_block) > 25:
            chunk_text = "\n".join(current_block).strip()
            if chunk_text:
                redacted, has_redaction = redact_secrets_and_pii(chunk_text)
                sensitivity = "restricted" if "confidential" in chunk_text.lower() or "secret" in chunk_text.lower() else "internal"
                chunks.append({
                    "original_text": chunk_text,
                    "redacted_text": redacted,
                    "span_identifier": f"{source_title} (L{start_line}-L{idx})",
                    "sensitivity_level": sensitivity,
                    "has_redactions": has_redaction
                })
            current_block = []
            start_line = idx + 1

    if current_block:
        chunk_text = "\n".join(current_block).strip()
        if chunk_text:
            redacted, has_redaction = redact_secrets_and_pii(chunk_text)
            sensitivity = "restricted" if "confidential" in chunk_text.lower() or "secret" in chunk_text.lower() else "internal"
            chunks.append({
                "original_text": chunk_text,
                "redacted_text": redacted,
                "span_identifier": f"{source_title} (L{start_line}-L{len(lines)})",
                "sensitivity_level": sensitivity,
                "has_redactions": has_redaction
            })

    return chunks

def parse_task_csv(content: str, source_title: str) -> List[Dict[str, Any]]:
    """Parses task board export CSV."""
    chunks = []
    reader = csv.DictReader(io.StringIO(content))
    for row_num, row in enumerate(reader, start=2):
        row_str = " | ".join([f"{k}: {v}" for k, v in row.items() if v])
        if not row_str.strip():
            continue
        redacted, has_redaction = redact_secrets_and_pii(row_str)
        chunks.append({
            "original_text": row_str,
            "redacted_text": redacted,
            "span_identifier": f"{source_title} (Row #{row_num} - {row.get('Title', row.get('Task', 'Item'))})",
            "sensitivity_level": "internal",
            "has_redactions": has_redaction
        })
    return chunks

def parse_chat_export(content: str, source_title: str) -> List[Dict[str, Any]]:
    """Parses chat messages (Slack/Teams JSON or formatted transcripts)."""
    chunks = []
    try:
        data = json.loads(content)
        if isinstance(data, list):
            for idx, msg in enumerate(data, start=1):
                user = msg.get("user") or msg.get("author") or "Team Member"
                text = msg.get("text") or msg.get("message") or ""
                ts = msg.get("timestamp") or msg.get("ts") or f"Msg #{idx}"
                channel = msg.get("channel", "general")
                raw = f"[{ts}] {user} in #{channel}: {text}"
                redacted, has_redaction = redact_secrets_and_pii(raw)
                chunks.append({
                    "original_text": raw,
                    "redacted_text": redacted,
                    "span_identifier": f"#{channel} ({ts}) by {user}",
                    "sensitivity_level": "internal",
                    "has_redactions": has_redaction
                })
            return chunks
    except Exception:
        pass

    # Fallback to line-by-line chat parsing
    lines = content.splitlines()
    for idx, line in enumerate(lines, start=1):
        line = line.strip()
        if not line:
            continue
        redacted, has_redaction = redact_secrets_and_pii(line)
        chunks.append({
            "original_text": line,
            "redacted_text": redacted,
            "span_identifier": f"{source_title} (Msg L{idx})",
            "sensitivity_level": "internal",
            "has_redactions": has_redaction
        })
    return chunks
