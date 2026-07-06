from core.config import PII_REDACTION_ENABLED

try:
    from presidio_analyzer import AnalyzerEngine
    from presidio_anonymizer import AnonymizerEngine
    from presidio_anonymizer.entities import OperatorConfig
    _analyzer = AnalyzerEngine()
    _anonymizer = AnonymizerEngine()
    PRESIDIO_AVAILABLE = True
except Exception:
    PRESIDIO_AVAILABLE = False

ENTITIES = ["PERSON", "PHONE_NUMBER", "EMAIL_ADDRESS", "LOCATION", "DATE_TIME", "US_SSN"]


def redact_pii(text: str) -> tuple[str, list]:
    if not PII_REDACTION_ENABLED or not PRESIDIO_AVAILABLE:
        return text, []
    results = _analyzer.analyze(text=text, entities=ENTITIES, language="en")
    anonymized = _anonymizer.anonymize(
        text=text,
        analyzer_results=results,
        operators={"DEFAULT": OperatorConfig("replace", {"new_value": "<REDACTED>"}),
                   "PERSON": OperatorConfig("replace", {"new_value": "<PATIENT>"})}
    )
    return anonymized.text, [{"entity": r.entity_type} for r in results]