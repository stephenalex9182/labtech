"""
PROTOTYPE TRIAGE RULES — for hackathon demo purposes only.
These are illustrative thresholds, not clinical guidelines. Keep every rule
here so the scoring logic never needs to be duplicated elsewhere in the app.
"""

# Reference ranges shown to the user and used to flag abnormal values.
REFERENCE_RANGES = {
    "Hemoglobin":   {"min": 13.0, "max": 17.0, "unit": "g/dL"},
    "WBC":          {"min": 4000, "max": 11000, "unit": "/uL"},
    "Platelets":    {"min": 150000, "max": 450000, "unit": "/uL"},
    "Creatinine":   {"min": 0.6, "max": 1.3, "unit": "mg/dL"},
    "Blood Glucose": {"min": 70, "max": 140, "unit": "mg/dL"},
    "Sodium":       {"min": 135, "max": 145, "unit": "mmol/L"},
    "Potassium":    {"min": 3.5, "max": 5.1, "unit": "mmol/L"},
}

# Deterministic scoring rules. Each rule: (test_name, condition_fn, points, severity, note)
def _rules(values: dict) -> list[dict]:
    flags = []
    hgb = values.get("Hemoglobin")
    wbc = values.get("WBC")
    plt = values.get("Platelets")
    cr = values.get("Creatinine")
    glu = values.get("Blood Glucose")

    if hgb is not None:
        if hgb < 7:
            flags.append({"test": "Hemoglobin", "points": 40, "severity": "CRITICAL",
                          "explanation": "Severely low hemoglobin — may indicate severe anemia."})
        elif hgb < 9:
            flags.append({"test": "Hemoglobin", "points": 25, "severity": "HIGH",
                          "explanation": "Hemoglobin below the configured reference range."})

    if wbc is not None and wbc > 20000:
        flags.append({"test": "WBC", "points": 25, "severity": "HIGH",
                      "explanation": "Marked leukocytosis — suggests possible infection or inflammation."})

    if plt is not None and plt < 50000:
        flags.append({"test": "Platelets", "points": 30, "severity": "CRITICAL",
                      "explanation": "Low platelet count — suggests increased bleeding risk."})

    if cr is not None and cr > 4:
        flags.append({"test": "Creatinine", "points": 20, "severity": "HIGH",
                      "explanation": "Elevated creatinine — may indicate impaired kidney function."})

    if glu is not None and glu > 300:
        flags.append({"test": "Blood Glucose", "points": 15, "severity": "MEDIUM",
                      "explanation": "Severe hyperglycemia noted."})

    return flags


def priority_from_score(score: int) -> str:
    if score >= 71:
        return "CRITICAL"
    if score >= 46:
        return "HIGH"
    if score >= 21:
        return "MEDIUM"
    return "NORMAL"


def calculate_risk(values: dict) -> dict:
    """
    values: {"Hemoglobin": 6.4, "WBC": 23000, ...}
    Returns: {"score": int, "priority": str, "flags": [...]}
    """
    flags = _rules(values)
    score = min(sum(f["points"] for f in flags), 100)
    return {
        "score": score,
        "priority": priority_from_score(score),
        "flags": flags,
    }


def severity_for_value(test_name: str, value: float) -> str:
    """Used to label any value against reference range, independent of scoring points."""
    ref = REFERENCE_RANGES.get(test_name)
    if not ref:
        return "NORMAL"
    if value < ref["min"] or value > ref["max"]:
        # Rough severity band for display when the value isn't one of the scored critical rules
        deviation = max(ref["min"] - value, value - ref["max"], 0) / max(ref["max"] - ref["min"], 1)
        if deviation > 1.5:
            return "CRITICAL"
        if deviation > 0.75:
            return "HIGH"
        return "MEDIUM"
    return "NORMAL"
