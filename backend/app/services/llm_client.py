import os
from openai import OpenAI, RateLimitError
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from app.core.config import settings

def get_groq_client() -> OpenAI:
    """Initialize the OpenAI client pointed at Groq."""
    api_key = (settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")).strip()
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set. Please set it in your environment.")
    
    return OpenAI(
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1"
    )


