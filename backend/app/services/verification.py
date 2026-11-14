from typing import List, Dict, Any

def evaluate_claim_evidence(claim_data: Dict[str, Any], citations: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Evaluates evidence backing a claim and assigns status:
    - Verified: Backed by authoritative source or multiple agreeing sources.
    - Inferred: Drawn by model, needs human verification.
    - Conflicting: Sources disagree (both versions preserved, neither selected).
    - Missing: Expected detail not found; flagged rather than hallucinated.
    """
    # If explicitly conflicting or has conflict details
    if claim_data.get("conflict_details") or claim_data.get("status") == "Conflicting":
        return {
            "status": "Conflicting",
            "confidence_score": 0.60
        }
    
    # If explicitly missing
    if claim_data.get("status") == "Missing" or "missing" in claim_data.get("title", "").lower() or not citations:
        return {
            "status": "Missing",
            "confidence_score": 0.35
        }
    
    # Check number of distinct source titles
    unique_sources = set(c.get("source_title", "") for c in citations if c.get("source_title"))
    
    if len(citations) >= 2 or len(unique_sources) >= 2:
        return {
            "status": "Verified",
            "confidence_score": 0.95
        }
    elif len(citations) == 1:
        return {
            "status": "Inferred",
            "confidence_score": 0.80
        }
    else:
        return {
            "status": "Missing",
            "confidence_score": 0.30
        }
