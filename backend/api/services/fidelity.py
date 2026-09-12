"""
Fidelity Gatekeeper Service
Evaluates semantic similarity between raw prompt and compiled d-SIR.
Extracts pure semantic values (stripping structural YAML syntax) and compares against raw prompt.
"""

import logging
import math
import re
import yaml
from typing import Tuple, Optional

logger = logging.getLogger(__name__)

# Singleton holder for embedding model
_EMBEDDING_MODEL = None
_MODEL_LOADED = False
FIDELITY_THRESHOLD = 0.85


def get_embedding_model():
    """Lazy-load the lightweight sentence-transformers CPU model once."""
    global _EMBEDDING_MODEL, _MODEL_LOADED
    if not _MODEL_LOADED:
        try:
            from sentence_transformers import SentenceTransformer
            # Lightweight 80MB CPU model, runs quickly with minimal memory footprint
            _EMBEDDING_MODEL = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')
            _MODEL_LOADED = True
            logger.info("Loaded sentence-transformers model 'all-MiniLM-L6-v2' on CPU successfully.")
        except Exception as e:
            logger.warning(f"Could not load sentence-transformers: {e}. Fallback similarity will be used.")
            _EMBEDDING_MODEL = None
            _MODEL_LOADED = True
    return _EMBEDDING_MODEL


def extract_semantic_values_from_sir(sir_yaml: str) -> str:
    """
    Extract only the pure semantic values and instructional phrases from SIR,
    stripping all YAML structural keys (e.g. 'goal:', 'spec:', 'filter:')
    so that structural syntax does not dilute the cosine embedding score.
    """
    semantic_parts = []
    
    try:
        parsed = yaml.safe_load(sir_yaml)
        if isinstance(parsed, dict):
            # Recursively collect string values
            def _collect(val):
                if isinstance(val, str):
                    semantic_parts.append(val)
                elif isinstance(val, list):
                    for item in val:
                        _collect(item)
                elif isinstance(val, dict):
                    for k, v in val.items():
                        _collect(v)

            _collect(parsed)
    except Exception:
        pass

    if semantic_parts:
        return " ".join(semantic_parts)
    
    # Fallback: strip standard YAML keys using regex
    cleaned = re.sub(r'^[a-zA-Z0-9_-]+:\s*', '', sir_yaml, flags=re.MULTILINE)
    return " ".join(cleaned.split())


def fallback_text_similarity(raw_prompt: str, semantic_sir_text: str) -> float:
    """
    Lightweight fallback similarity based on token overlap & key term coverage.
    Evaluates strictly between 0.0 and 1.0 without artificial floor clamping.
    """
    words1 = set(raw_prompt.lower().replace('\n', ' ').split())
    words2 = set(semantic_sir_text.lower().replace('\n', ' ').split())
    if not words1 or not words2:
        return 0.0

    # Key entity coverage
    common = words1.intersection(words2)
    coverage = len(common) / len(words2) if words2 else 0.0
    return round(max(0.0, min(1.0, coverage)), 4)


def evaluate_fidelity(raw_prompt: str, sir_yaml: str) -> Tuple[float, bool]:
    """
    Evaluates semantic fidelity between the raw prompt and compiled SIR.
    Extracts pure semantic values first, embeds via MiniLM on CPU,
    and calculates true cosine similarity from normalized embeddings without artificial floor inflation.
    Returns: (fidelity_score: float [0.0-1.0], fidelity_passed: bool)
    """
    if not raw_prompt.strip() or not sir_yaml.strip():
        return 0.0, False

    # Extract semantic values to remove YAML syntax penalty
    semantic_sir_text = extract_semantic_values_from_sir(sir_yaml)
    if not semantic_sir_text:
        semantic_sir_text = sir_yaml

    model = get_embedding_model()

    try:
        if model is not None:
            # Embed both texts with normalization
            embeddings = model.encode([raw_prompt, semantic_sir_text], normalize_embeddings=True)
            # Calculate true cosine similarity from normalized embeddings: raw_sim = float(embeddings[0] @ embeddings[1])
            raw_sim = float(embeddings[0] @ embeddings[1])
            fidelity_score = round(max(0.0, min(1.0, raw_sim)), 4)
            passed = fidelity_score >= FIDELITY_THRESHOLD
            return fidelity_score, passed
    except Exception as e:
        logger.warning(f"Error computing sentence embeddings: {e}. Using fallback similarity.")

    score = fallback_text_similarity(raw_prompt, semantic_sir_text)
    passed = score >= FIDELITY_THRESHOLD
    return score, passed

