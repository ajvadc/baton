from typing import List, Dict, Any

def generate_leaver_questions_from_claims(claims: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Implements the 'Gaps become questions' rule from Baton:
    Missing or conflicting facts turn into questions for the leaver to answer before they go.
    """
    questions = []

    for c in claims:
        status = c.get("status")
        title = c.get("title", "")
        category = c.get("category", "")
        conflict_details = c.get("conflict_details", "")

        if status == "Conflicting":
            q_text = f"Conflict detected on '{title}': {conflict_details or c.get('description')}. Who is the definitive owner and what is the agreed procedure?"
            questions.append({
                "claim_id": c.get("id"),
                "context_type": "conflict_resolution",
                "question_text": q_text,
                "urgency": "high"
            })
        elif status == "Missing":
            q_text = f"Information gap identified for '{title}': {c.get('description')}. Where is this resource documented or stored?"
            questions.append({
                "claim_id": c.get("id"),
                "context_type": "missing_fact",
                "question_text": q_text,
                "urgency": "high"
            })
        elif category == "risk" and "burst" in title.lower():
            q_text = f"Operational Risk '{title}': What exact configuration changes or workaround scripts should the successor apply if this occurs?"
            questions.append({
                "claim_id": c.get("id"),
                "context_type": "risk_mitigation",
                "question_text": q_text,
                "urgency": "medium"
            })
        elif category == "dependency" and "trial" in c.get("description", "").lower():
            q_text = f"Personal Account Dependency '{title}': When will this account be migrated away from personal student credentials, and who has the new master billing credentials?"
            questions.append({
                "claim_id": c.get("id"),
                "context_type": "missing_fact",
                "question_text": q_text,
                "urgency": "high"
            })

    return questions

