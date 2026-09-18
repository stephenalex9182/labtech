"""
Talks to a locally-running Ollama instance to extract structured lab values
and generate a plain-language summary. The LLM NEVER decides final priority —
that stays with the deterministic risk engine in utils/risk_rules.py.
"""
import json
import logging

import httpx
from pydantic import ValidationError

from app.config import settings
from app.schemas.triage import OllamaExtraction

logger = logging.getLogger("labtriage.ai")

SYSTEM_PROMPT = """You are a laboratory report parsing assistant. You extract structured
data from raw lab report text. You do NOT diagnose. You do NOT decide clinical priority.
You only extract values and describe findings in cautious, non-definitive language
(e.g. "may indicate", "suggests", "requires professional review" — never "the patient has").

Respond with ONLY valid JSON in exactly this shape, no markdown fences, no commentary:
{
  "patient_name": "string or null",
  "patient_age": number or null,
  "patient_gender": "Male|Female|Other or null",
  "tests": [{"name": "string", "value": number, "unit": "string or null"}],
  "abnormal_findings": [{"test": "string", "severity": "CRITICAL|HIGH|MEDIUM|NORMAL", "explanation": "string"}],
  "summary": "one or two cautious sentences"
}

Supported test names only: Hemoglobin, WBC, Platelets, Creatinine, Blood Glucose, Sodium, Potassium.
"""


async def analyze_report_text(raw_text: str) -> OllamaExtraction | None:
    """
    Calls Ollama's /api/generate (or /api/chat) endpoint. Returns a validated
    OllamaExtraction, or None if Ollama is unavailable / returns invalid JSON —
    callers must fall back to regex-based extraction in that case.
    """
    payload = {
        "model": settings.ollama_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Lab report text:\n\n{raw_text[:6000]}"},
        ],
        "stream": False,
        "format": "json",
    }

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(f"{settings.ollama_base_url}/api/chat", json=payload)
            resp.raise_for_status()
            data = resp.json()
            content = data.get("message", {}).get("content", "")
            parsed = json.loads(content)
            return OllamaExtraction(**parsed)
    except httpx.HTTPError as e:
        logger.warning("Ollama unavailable, falling back to regex extraction: %s", e)
        return None
    except (json.JSONDecodeError, ValidationError) as e:
        logger.warning("Ollama returned invalid JSON, falling back to regex extraction: %s", e)
        return None
