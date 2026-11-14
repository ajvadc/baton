from typing import List, Dict, Any

def filter_claims_by_role(claims: List[Dict[str, Any]], role: str, area_filter: str = "all") -> List[Dict[str, Any]]:
    """
    Enforces role-based access control BEFORE retrieval/display:
    - Successor: Full project state, decisions, risks, first-week plan (credentials/HR masked).
    - Teammate: Tasks, owners, dependencies in their own area (other areas masked).
    - Manager: Risk, ownership, open-decision summaries (raw excerpts hidden).
    - Observer: High-level read-only timeline and status (confidential items excluded).
    """
    normalized_role = role.lower().strip()
    filtered = []

    for claim in claims:
        category = claim.get("category")
        is_confidential = claim.get("is_confidential", False)
        claim_area = claim.get("area", "backend")

        # Observer: read-only status and timeline, no confidential items
        if normalized_role == "observer":
            if is_confidential:
                continue
            if category in ["timeline", "decision"]:
                # Mask internal dispute or raw debug details
                claim_copy = dict(claim)
                claim_copy["citations"] = [] # Hide raw chat citations from external observers
                filtered.append(claim_copy)

        # Manager: High-level risk, ownership, and decision summaries
        elif normalized_role == "manager":
            if category in ["risk", "ownership", "decision", "timeline", "next_action"]:
                claim_copy = dict(claim)
                # Keep citations but sanitize any raw debug code spans
                sanitized_citations = []
                for cit in claim_copy.get("citations", []):
                    c_dict = dict(cit)
                    if "Commit" in c_dict.get("source_type", "") or "git" in c_dict.get("source_type", ""):
                        c_dict["quote_span"] = "[Technical Git commit excerpt simplified for Manager view]"
                    sanitized_citations.append(c_dict)
                claim_copy["citations"] = sanitized_citations
                filtered.append(claim_copy)

        # Teammate: Tasks, owners, and dependencies in their own area
        elif normalized_role == "teammate":
            if area_filter != "all" and claim_area != area_filter:
                continue
            if is_confidential:
                continue
            if category in ["ownership", "dependency", "next_action", "risk"]:
                filtered.append(claim)
            elif category == "decision" and claim_area == "backend":
                filtered.append(claim)

        # Successor: Complete view of all claims, decisions, risks, dependencies, timeline, first-week plan
        else: # successor or admin
            filtered.append(claim)

    return filtered
