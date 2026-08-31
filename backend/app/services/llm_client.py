import os
from groq import Groq, RateLimitError
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from app.core.config import settings


def get_groq_client() -> Groq:
    """Initialize the Groq client."""
    api_key = (settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")).strip()
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set. Please set it in your environment.")

    return Groq(api_key=api_key)
