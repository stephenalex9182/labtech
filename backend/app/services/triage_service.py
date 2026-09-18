"""
Fallback deterministic value extraction (regex) + wraps the risk engine.
Used when Ollama is unreachable, and always used to compute the final
score/priority regardless of what the LLM says.
"""
import re

from app.utils.risk_rules import calculate_risk, REFERENCE_RANGES, severity_for_value

TEST_PATTERNS = {
    "Hemoglobin": r"h(?:a)?emoglobin[^0-9]{0,10}([\d.]+)",
    "WBC": r"\bwbc\b[^0-9]{0,10}([\d,]+)",
    "Platelets": r"platelets?[^0-9]{0,10}([\d,]+)",
    "Creatinine": r"creatinine[^0-9]{0,10}([\d.]+)",
    "Blood Glucose": r"(?:blood\s*glucose|blood\s*sugar|glucose)[^0-9]{0,10}([\d.]+)",
    "Sodium": r"sodium[^0-9]{0,10}([\d.]+)",
    "Potassium": r"potassium[^0-9]{0,10}([\d.]+)",
}


def normalize_gender(value: str | None) -> str | None:
    if not value:
        return None
    v = value.strip().lower()
    if v in ("m", "male", "man"):
        return "Male"
    if v in ("f", "female", "woman"):
        return "Female"
    if v in ("other", "o", "non-binary", "nonbinary"):
        return "Other"
    return value.strip().title()


def extract_patient_demographics_regex(raw_text: str) -> dict:
    """Best-effort extraction of patient name, age, and gender from report text."""
    text = raw_text.replace("\r", "\n")
    name = None
    age = None
    gender = None

    name_patterns = [
        r"(?:patient\s*name|name\s*of\s*patient)[\s:/\-]+([A-Za-z][A-Za-z\s.'\-]{1,58}?)(?:\n|$|[,;|])",
        r"(?:patient)[\s:/\-]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
        r"(?:name)[\s:/\-]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
    ]
    for pattern in name_patterns:
        m = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if m:
            candidate = m.group(1).strip(" .:-")
            if len(candidate) >= 3 and not re.search(r"\d", candidate):
                name = candidate.title()
                break

    age_patterns = [
        r"(?:age|aged)[\s:/\-]*(\d{1,3})\s*(?:years?|yrs?|y\.?o\.?)?",
        r"age\s*/\s*sex[\s:/\-]*(\d{1,3})",
        r"(\d{1,3})\s*(?:years?\s*old|yrs?\s*old)",
    ]
    for pattern in age_patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            try:
                parsed_age = int(m.group(1))
                if 0 < parsed_age <= 120:
                    age = parsed_age
                    break
            except ValueError:
                continue

    gender_patterns = [
        r"(?:gender|sex)[\s:/\-]*(male|female|m|f|other)\b",
        r"age\s*/\s*sex[\s:/\-]*\d{1,3}\s*[/\-]\s*(male|female|m|f)\b",
    ]
    for pattern in gender_patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            gender = normalize_gender(m.group(1))
            break

    return {"name": name, "age": age, "gender": gender}


def extract_values_regex(raw_text: str) -> dict:
    text = raw_text.lower()
    values = {}
    for test, pattern in TEST_PATTERNS.items():
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            try:
                values[test] = float(m.group(1).replace(",", ""))
            except ValueError:
                continue
    return values


def build_lab_results(values: dict) -> list[dict]:
    """Attach reference ranges + severity to each extracted value for storage/display."""
    results = []
    for test, value in values.items():
        ref = REFERENCE_RANGES.get(test, {})
        results.append({
            "test_name": test,
            "value": value,
            "unit": ref.get("unit"),
            "reference_min": ref.get("min"),
            "reference_max": ref.get("max"),
            "severity": severity_for_value(test, value),
        })
    return results


def run_triage(values: dict) -> dict:
    """Single entry point: values in -> {score, priority, flags} out."""
    return calculate_risk(values)


def recommendations_for(priority: str) -> list[str]:
    if priority == "CRITICAL":
        return ["Immediate physician review", "Repeat relevant panel", "Monitor vital signs", "Consider emergency admission"]
    if priority == "HIGH":
        return ["Physician review within 2 hours", "Repeat affected panel", "Monitor vital signs"]
    if priority == "MEDIUM":
        return ["Routine physician review", "Re-test within 1 week"]
    return ["No immediate action required", "Continue routine monitoring"]
