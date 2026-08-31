import re
import json
import os
from typing import Dict, Any, List, Optional
from difflib import SequenceMatcher
import logging

logger = logging.getLogger(__name__)

# If true, logs will include the actual leaked text for debugging.
# Default to False for production safety (Zero Data Retention philosophy).
DEBUG_LOG_PII = os.environ.get("DEBUG_LOG_PII", "false").lower() == "true"

class MatchValidationException(Exception):
    """Raised when the generated match briefing fails a safety guardrail check."""
    pass

def check_pii(text: str) -> None:
    """
    Check 6a: Regex scan for email/phone-shaped strings.
    """
    email_regex = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
    if re.search(email_regex, text):
        raise MatchValidationException("PII validation failed: Detected potential email address in output.")
        
    phone_regex = r"(\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}"
    if re.search(phone_regex, text):
        raise MatchValidationException("PII validation failed: Detected potential phone number in output.")

def check_similarity(output_text: str, raw_expectations: Optional[str], max_overlap_chars: int = 30) -> None:
    """
    Check 6b: Substring / high-similarity check against raw Expectations text.
    Uses SequenceMatcher to find the longest exact matching block. If it's longer than ~30 chars 
    (about 5-6 words), it's rejected as a verbatim leak.
    """
    if not raw_expectations or not output_text:
        return
        
    out_norm = re.sub(r'[^\w\s]', '', output_text.lower())
    raw_norm = re.sub(r'[^\w\s]', '', raw_expectations.lower())
    
    matcher = SequenceMatcher(None, out_norm, raw_norm)
    match = matcher.find_longest_match(0, len(out_norm), 0, len(raw_norm))
    
    if match.size > max_overlap_chars:
        if DEBUG_LOG_PII:
            overlap_snippet = out_norm[match.a : match.a + match.size]
            logger.warning(f"Similarity check failed. Overlap snippet: '{overlap_snippet}'")
        else:
            logger.warning(f"Similarity check failed. Match size: {match.size} chars (over threshold of {max_overlap_chars}).")
            
        raise MatchValidationException("Similarity validation failed: Output is too similar to raw private expectations text.")

def check_groundedness(output_text: str, input_tags: Dict[str, str], bio: Optional[str], user_b_name: Optional[str] = None) -> None:
    """
    Check 6c: Lightweight groundedness check.
    Calculates the ratio of significant words (length >= 5) in the output that do NOT appear 
    in the input tags or bio. Flags for manual review if too many words are "invented".
    """
    out_words = set(re.findall(r'\b[A-Za-z]{5,}\b', output_text.lower()))
    if not out_words:
        return
        
    corpus = (bio.lower() + " ") if bio else ""
    if user_b_name:
        corpus += user_b_name.lower() + " "
    for val in input_tags.values():
        if isinstance(val, str):
            corpus += val.lower() + " "
    corpus += " ".join(input_tags.keys())
    
    whitelist = {"value", "values", "style", "living", "alignment", "points", "differences", "discuss", "questions", 
                 "match", "roommate", "potential", "both", "differ", "prefer", "prefers", "suggests", "might", "would"}
    
    corpus_words = set(re.findall(r'\b[A-Za-z]{4,}\b', corpus)) | whitelist
    
    unsupported = out_words - corpus_words
    unsupported_ratio = len(unsupported) / len(out_words)
    if unsupported_ratio > 0.4:
        if DEBUG_LOG_PII:
            logger.warning(f"Groundedness warning: High ratio of unsupported words ({unsupported_ratio:.2f}). Unsupported words: {unsupported}")
        else:
            logger.warning(f"Groundedness warning: High ratio of unsupported words ({unsupported_ratio:.2f}). {len(unsupported)} out of {len(out_words)} significant words missing from input.")

def check_scope_and_length(briefing: Dict[str, Any]) -> None:
    """
    Check 6d: Length/scope check.
    Rejects strings that are too long, ensuring a compact briefing.
    """
    headline = briefing.get("headline", "")
    if len(headline.split()) > 25:
        logger.warning(f"Scope validation failed: Headline is too long ({len(headline.split())} words, max 25).")
        raise MatchValidationException("Scope validation failed: Headline is too long.")
        
    for field in ["what_they_value", "living_style"]:
        val = briefing.get(field, "")
        if len(val.split()) > 60:
            logger.warning(f"Scope validation failed: Field '{field}' is too long ({len(val.split())} words, max 60).")
            raise MatchValidationException(f"Scope validation failed: Field '{field}' is too long.")
            
    for field in ["alignment_points", "differences_to_discuss", "questions_to_ask"]:
        arr = briefing.get(field, [])
        if len(arr) > 6:
            logger.warning(f"Scope validation warning: Too many items in '{field}' ({len(arr)} items). Truncating to 6.")
            briefing[field] = arr[:6]
            arr = briefing[field]
            
        for item in arr:
            if len(item.split()) > 30:
                logger.warning(f"Scope validation failed: Item in '{field}' is too long ({len(item.split())} words, max 30).")
                raise MatchValidationException(f"Scope validation failed: Item in '{field}' is too long.")

def validate_match_briefing(raw_json_str: str, raw_expectations_a: Optional[str], raw_expectations_b: Optional[str], 
                            tags_a: Dict[str, str], tags_b: Dict[str, str], 
                            bio_a: Optional[str], bio_b: Optional[str],
                            user_b_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Runs all 4 deterministic validation checks on the generated LLM output.
    Returns parsed JSON if all pass, raises MatchValidationException if a strict guardrail fails.
    """
    try:
        briefing = json.loads(raw_json_str)
    except json.JSONDecodeError:
        raise MatchValidationException("Validation failed: Output is not valid JSON.")
        
    # Serialize correctly, joining lists properly instead of leaving brackets from str()
    parts = []
    for v in briefing.values():
        if isinstance(v, list):
            parts.extend([str(item) for item in v])
        else:
            parts.append(str(v))
            
    full_output_text = " ".join(parts)
    
    check_pii(full_output_text)
    check_similarity(full_output_text, raw_expectations_a)
    check_similarity(full_output_text, raw_expectations_b)
    
    combined_tags = {**tags_a, **tags_b}
    check_groundedness(full_output_text, combined_tags, (bio_a or "") + " " + (bio_b or ""), user_b_name)
    check_scope_and_length(briefing)
    
    return briefing
