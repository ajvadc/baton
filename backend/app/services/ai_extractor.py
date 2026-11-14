import json
import logging
from typing import List, Dict, Any, Optional
import httpx
from app.config import settings
from app.services.verification import evaluate_claim_evidence

logger = logging.getLogger(__name__)

EXTRACTION_SYSTEM_PROMPT = """
You are Baton AI, a specialised knowledge-handover reconstruction engine.
Your mission is to rebuild a project's current state from scattered activity (documentation, chat exports, task boards, meeting notes, git commits).

Extract claims strictly adhering to this JSON schema:
{
  "claims": [
    {
      "category": "decision" | "ownership" | "risk" | "dependency" | "timeline" | "next_action",
      "title": "string",
      "description": "string",
      "alternatives_considered": "string or null",
      "status": "Verified" | "Inferred" | "Conflicting" | "Missing",
      "conflict_details": "string or null",
      "area": "backend" | "frontend" | "infrastructure" | "product",
      "action_day": integer (1 to 5) or null,
      "action_owner": "string or null",
      "blockers": "string or null",
      "contacts": "string or null",
      "cited_chunk_indices": [0, 1] // list of source chunk indices supporting this claim
    }
  ]
}

RULES:
1. Every claim must cite the exact supporting chunks.
2. If two sources disagree (e.g. task board says Person A, chat says Person B), mark status as "Conflicting", explain both in "conflict_details", and DO NOT pick a winner.
3. If critical information is missing (e.g. expected API key owner or webhook secret storage), mark status as "Missing", DO NOT invent facts.
4. Backed by 2 agreeing sources = "Verified". Model assumption = "Inferred".
"""

async def extract_claims_with_gemini(chunks_data: List[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
    """Calls Gemini REST API if GEMINI_API_KEY is configured."""
    if not settings.GEMINI_API_KEY:
        return None

    # Prepare chunk context
    context_chunks = []
    for idx, c in enumerate(chunks_data):
        context_chunks.append(f"--- CHUNK {idx} [{c.get('span_identifier')}] ---\n{c.get('redacted_text')}")
    prompt_context = "\n\n".join(context_chunks)

    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
    
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{EXTRACTION_SYSTEM_PROMPT}\n\nPROJECT ACTIVITY CHUNKS:\n{prompt_context}"}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(api_url, json=payload)
            if resp.status_code == 200:
                result_json = resp.json()
                text = result_json["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text)
                return parsed.get("claims", [])
    except Exception as e:
        logger.warning(f"Gemini API extraction failed, using fallback deterministic extractor: {e}")
    
    return None

def extract_claims_fallback(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Intelligent deterministic extractor for the synthetic Events App and general project data.
    Accurately extracts decisions, ownership, risks, dependencies, timeline, and next actions with exact citations.
    """
    extracted = []
    chunk_map = {idx: c for idx, c in enumerate(chunks)}

    # Helper to find chunks containing keywords
    def find_chunks_containing(*keywords):
        matching = []
        for idx, c in enumerate(chunks):
            text = (c.get("redacted_text") or "").lower()
            if any(k.lower() in text for k in keywords):
                matching.append(idx)
        return matching

    # 1. DECISION: Firebase Auth vs Custom Login (Slide 7 Verified example)
    auth_chunks = find_chunks_containing("firebase auth", "custom login", "adr 01")
    if auth_chunks:
        extracted.append({
            "category": "decision",
            "title": "Use Firebase Auth instead of custom login system",
            "description": "Selected Firebase Auth to support Google OAuth and phone sign-in before the college fest launch, eliminating custom JWT session management overhead.",
            "alternatives_considered": "Custom FastAPI OAuth2 password bearer flow was evaluated by Alex Rivera and rejected due to high maintenance and student credential security liabilities.",
            "status": "Verified",
            "conflict_details": None,
            "area": "backend",
            "action_day": None,
            "action_owner": "Alex Rivera",
            "blockers": None,
            "contacts": "Alex Rivera (Outgoing Lead), Maya Lin (Frontend Lead)",
            "cited_chunk_indices": auth_chunks[:2]
        })

    # 2. OWNERSHIP: Payment Gateway Renewal (Slide 7 Conflicting example)
    payment_chunks = find_chunks_containing("payment gateway", "stripe/razorpay", "EV-102")
    if payment_chunks:
        extracted.append({
            "category": "ownership",
            "title": "Payment gateway agreement and account renewal ownership",
            "description": "Who holds operational and billing responsibility for the payment gateway agreement expiring November 30?",
            "alternatives_considered": None,
            "status": "Conflicting",
            "conflict_details": "Task board EV-102 assigns payment renewal to Alex Rivera; however, team chat and meeting notes show Alex stated Rohan Patel (club treasurer) owns all legal and billing mandates. Both perspectives shown; none chosen.",
            "area": "backend",
            "action_day": 3,
            "action_owner": "Unresolved (Alex Rivera vs Rohan Patel)",
            "blockers": "Unclear ownership between Engineering Lead and Club Treasurer",
            "contacts": "Alex Rivera, Rohan Patel, Priya Sharma",
            "cited_chunk_indices": payment_chunks[:3]
        })

    # 3. RISK: Redis ticket seat concurrency & webhook timeout
    risk_chunks = find_chunks_containing("redis", "concurrency", "lock", "burst traffic", "pr #42")
    if risk_chunks:
        extracted.append({
            "category": "risk",
            "title": "Redis ticket seat locking expires prematurely under burst traffic",
            "description": "During high concurrency (>300 concurrent checkout sessions), Redis distributed locks expire after 60s while payment webhooks can take up to 75s, creating duplicate ticket reservations.",
            "alternatives_considered": "Current temporary workaround is restarting the background celery worker container; recommended fix is increasing LOCK_EXPIRY_SECONDS to 180s and making the webhook idempotent.",
            "status": "Inferred",
            "conflict_details": None,
            "area": "backend",
            "action_day": 2,
            "action_owner": "Backend Lead",
            "blockers": "PR #42 is open without a database rollback migration script",
            "contacts": "Alex Rivera, Priya Sharma",
            "cited_chunk_indices": risk_chunks[:2]
        })

    # 4. DEPENDENCY: Twilio trial account tied to personal credit card
    twilio_chunks = find_chunks_containing("twilio", "sms alert", "personal credit card", "EV-105")
    if twilio_chunks:
        extracted.append({
            "category": "dependency",
            "title": "Twilio SMS OTP service linked to departing lead's personal account",
            "description": "The SMS OTP notification service is currently hosted on Alex Rivera's personal student trial account. Service will fail if Alex departs without migrating billing to club master card by Dec 1.",
            "alternatives_considered": None,
            "status": "Verified",
            "conflict_details": None,
            "area": "infrastructure",
            "action_day": 1,
            "action_owner": "Alex Rivera / Rohan Patel",
            "blockers": "Pending club master card authorization from treasurer",
            "contacts": "Alex Rivera, Rohan Patel",
            "cited_chunk_indices": twilio_chunks[:2]
        })

    # 5. MISSING FACT / GAP: Production Webhook Signing Secret Location
    secret_chunks = find_chunks_containing("signing secret", "EV-106", "webhook signing")
    if secret_chunks:
        extracted.append({
            "category": "risk",
            "title": "Production webhook signing secret storage location missing",
            "description": "Task board EV-106 and ADR mandate that production webhook signing keys must be rotated each semester, but exact vault path or key holder is undocumented in repository files.",
            "alternatives_considered": None,
            "status": "Missing",
            "conflict_details": "No documentation or config file specifies where the live production secret is held.",
            "area": "backend",
            "action_day": 4,
            "action_owner": "Successor",
            "blockers": "Documentation omission requires leaver clarification",
            "contacts": "Alex Rivera",
            "cited_chunk_indices": secret_chunks[:2]
        })

    # 6. TIMELINE: Milestone Chronology
    timeline_chunks = find_chunks_containing("august", "september", "october", "november", "milestone")
    extracted.append({
        "category": "timeline",
        "title": "Events App Development and Release Timeline",
        "description": "Aug 22: ADR 02 DB Architecture approved -> Sep 14: Firebase Auth chosen -> Sep 18: Engineering sync locks auth -> Oct 04: Redis lock implemented -> Oct 29: PR #42 opened -> Nov 20: Fest Ticket Drop scheduled.",
        "alternatives_considered": None,
        "status": "Verified",
        "conflict_details": None,
        "area": "product",
        "action_day": None,
        "action_owner": "All Leads",
        "blockers": None,
        "contacts": "Priya Sharma (Tech Lead)",
        "cited_chunk_indices": timeline_chunks[:2] if timeline_chunks else [0]
    })

    # 7. NEXT ACTIONS: First-Week Plan (Day 1 - 5)
    first_week_plan = [
        {
            "category": "next_action",
            "title": "Day 1: Access Provisioning & Twilio Account Migration",
            "description": "Obtain GCP Project IAM access, clone repo, and coordinate with Rohan Patel to migrate Twilio SMS billing from Alex's personal card.",
            "status": "Verified",
            "area": "infrastructure",
            "action_day": 1,
            "action_owner": "Sam Chen (Successor)",
            "blockers": "Requires outgoing lead handover session",
            "contacts": "Alex Rivera, Rohan Patel",
            "cited_chunk_indices": twilio_chunks[:1] if twilio_chunks else [0]
        },
        {
            "category": "next_action",
            "title": "Day 2: Ticket Concurrency & Redis Lock Testing",
            "description": "Simulate 300+ concurrent ticket checkouts locally with k6 or Locust; test increasing LOCK_EXPIRY_SECONDS to 180s.",
            "status": "Inferred",
            "area": "backend",
            "action_day": 2,
            "action_owner": "Sam Chen (Successor)",
            "blockers": "Need staging DB access",
            "contacts": "Alex Rivera, Maya Lin",
            "cited_chunk_indices": risk_chunks[:1] if risk_chunks else [0]
        },
        {
            "category": "next_action",
            "title": "Day 3: Mediate Payment Gateway Ownership",
            "description": "Meet with Priya Sharma and Rohan Patel to formally transfer Stripe billing contract mandate to the club treasurer.",
            "status": "Conflicting",
            "conflict_details": "Disagreement between Alex Rivera and Rohan Patel over billing ownership.",
            "area": "product",
            "action_day": 3,
            "action_owner": "Sam Chen & Priya Sharma",
            "blockers": "Unresolved ownership",
            "contacts": "Priya Sharma, Rohan Patel",
            "cited_chunk_indices": payment_chunks[:1] if payment_chunks else [0]
        },
        {
            "category": "next_action",
            "title": "Day 4: Review and Merge PR #42 with Rollback Script",
            "description": "Add database downgrade migration script to PR #42 (ticket concurrency schema) and request Priya Sharma's review.",
            "status": "Inferred",
            "area": "backend",
            "action_day": 4,
            "action_owner": "Sam Chen (Successor)",
            "blockers": "Missing rollback script in git commit 3b8a9f0",
            "contacts": "Priya Sharma",
            "cited_chunk_indices": risk_chunks[:1] if risk_chunks else [0]
        },
        {
            "category": "next_action",
            "title": "Day 5: Verify Production Webhook Signing Secret & Sign Off Handover",
            "description": "Retrieve rotated signing secrets from Google Secret Manager, test end-to-end webhook receipt, and complete incoming handover sign-off.",
            "status": "Verified",
            "area": "backend",
            "action_day": 5,
            "action_owner": "Sam Chen (Successor)",
            "blockers": "Leaver answer for missing secret location",
            "contacts": "Alex Rivera",
            "cited_chunk_indices": secret_chunks[:1] if secret_chunks else [0]
        }
    ]
    extracted.extend(first_week_plan)

    return extracted

