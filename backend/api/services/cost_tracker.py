"""
Cost Tracking & Financial Analytics Engine
Maintains real-world frontier model pricing and calculates token/dollar savings
and enterprise scale projections.
"""

from typing import Dict, Any, List

# Pricing per 1,000,000 tokens (USD)
PRICING_MATRIX: Dict[str, Dict[str, float]] = {
    "gpt-4o": {
        "name": "OpenAI GPT-4o",
        "input_per_1m": 2.50,
        "output_per_1m": 10.00,
        "provider": "OpenAI",
    },
    "claude-3.5-sonnet": {
        "name": "Anthropic Claude 3.5 Sonnet",
        "input_per_1m": 3.00,
        "output_per_1m": 15.00,
        "provider": "Anthropic",
    },
    "gemini-1.5-pro": {
        "name": "Google Gemini 1.5 Pro",
        "input_per_1m": 1.25,
        "output_per_1m": 5.00,
        "provider": "Google",
    },
    "gemini-1.5-flash": {
        "name": "Google Gemini 1.5 Flash",
        "input_per_1m": 0.075,
        "output_per_1m": 0.30,
        "provider": "Google",
    },
}

DEFAULT_MODEL = "gpt-4o"


def get_pricing_for_model(model_name: str) -> Dict[str, Any]:
    """Retrieve pricing info for a model, defaulting to gpt-4o if unknown."""
    normalized = model_name.lower().strip()
    for key, val in PRICING_MATRIX.items():
        if key in normalized or normalized in key:
            return val
    return PRICING_MATRIX[DEFAULT_MODEL]


def calculate_token_cost(tokens: int, rate_per_1m: float) -> float:
    """Calculate USD cost for a given token count at a specified per-1M rate."""
    return (tokens / 1_000_000.0) * rate_per_1m


def compute_request_metrics(
    raw_tokens: int,
    sir_tokens: int,
    target_model: str = "gpt-4o"
) -> Dict[str, Any]:
    """
    Compute comprehensive savings and financial metrics for a single request.
    """
    pricing = get_pricing_for_model(target_model)
    tokens_saved = max(0, raw_tokens - sir_tokens)
    
    reduction_pct = 0.0
    if raw_tokens > 0:
        reduction_pct = round((tokens_saved / raw_tokens) * 100.0, 2)
    
    raw_input_cost = calculate_token_cost(raw_tokens, pricing["input_per_1m"])
    sir_input_cost = calculate_token_cost(sir_tokens, pricing["input_per_1m"])
    cost_saved = max(0.0, raw_input_cost - sir_input_cost)

    return {
        "target_model": target_model,
        "model_display_name": pricing["name"],
        "pricing": {
            "input_per_1m": pricing["input_per_1m"],
            "output_per_1m": pricing["output_per_1m"],
        },
        "raw_tokens": raw_tokens,
        "sir_tokens": sir_tokens,
        "tokens_saved": tokens_saved,
        "token_reduction_pct": reduction_pct,
        "raw_input_cost_usd": round(raw_input_cost, 8),
        "sir_input_cost_usd": round(sir_input_cost, 8),
        "cost_saved_usd": round(cost_saved, 8),
    }


def project_enterprise_savings(
    cost_saved_per_request: float,
    tokens_saved_per_request: int,
    monthly_volumes: List[int] = None
) -> Dict[str, Any]:
    """
    Project monthly and annual dollar and token savings across all frontier models
    for specific enterprise scale volumes.
    """
    if monthly_volumes is None:
        monthly_volumes = [10_000, 100_000, 1_000_000, 10_000_000]

    projections_by_model: Dict[str, Any] = {}

    for model_key, pricing in PRICING_MATRIX.items():
        single_req_saved = calculate_token_cost(tokens_saved_per_request, pricing["input_per_1m"])
        volume_tiers = []
        
        for volume in monthly_volumes:
            monthly_dollars = single_req_saved * volume
            annual_dollars = monthly_dollars * 12
            monthly_tokens = tokens_saved_per_request * volume
            annual_tokens = monthly_tokens * 12

            volume_tiers.append({
                "monthly_requests": volume,
                "monthly_saved_usd": round(monthly_dollars, 2),
                "annual_saved_usd": round(annual_dollars, 2),
                "monthly_tokens_saved": monthly_tokens,
                "annual_tokens_saved": annual_tokens,
            })

        projections_by_model[model_key] = {
            "model_name": pricing["name"],
            "input_per_1m": pricing["input_per_1m"],
            "single_req_saved_usd": round(single_req_saved, 8),
            "tiers": volume_tiers,
        }

    return projections_by_model


def get_all_pricing() -> Dict[str, Any]:
    """Return all available models and their current rate matrix."""
    return PRICING_MATRIX
