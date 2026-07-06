"""
LLM client — disabled for demo.
Raw Cognee recall results are used directly instead.
"""

def ask_with_context(question: str, context_chunks: list[dict]) -> str:
    """Not used — recall.py returns raw Cognee chunks directly."""
    return ""

def generate_pre_visit_briefing(context_chunks: list[dict]) -> str:
    """Not used — recall.py returns raw Cognee chunks directly."""
    return ""