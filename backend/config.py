import os
from dotenv import load_dotenv

load_dotenv()

# OpenRouter configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

# Vercel AI Gateway configuration
VERCEL_API_KEY = os.getenv("VERCEL_API_KEY", "")
VERCEL_BASE_URL = os.getenv("VERCEL_BASE_URL", "https://ai-gateway.vercel.sh/v1")

# Default model (used when provider is not specified or for backward compatibility)
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "qwen/qwen3.5-flash-02-23")

# Chat history / compression (token estimates are heuristic; see CHAT_TOKEN_CHARS_PER_TOKEN)
CHAT_SUMMARY_MODEL = os.getenv("CHAT_SUMMARY_MODEL", "qwen/qwen3.5-flash-02-23")
CHAT_TOKEN_CHARS_PER_TOKEN = max(1, int(os.getenv("CHAT_TOKEN_CHARS_PER_TOKEN", "4")))
CHAT_IMAGE_TOKEN_PENALTY = int(os.getenv("CHAT_IMAGE_TOKEN_PENALTY", "2000"))
CHAT_HISTORY_MAX_ESTIMATED_TOKENS = int(os.getenv("CHAT_HISTORY_MAX_ESTIMATED_TOKENS", "10000"))
CHAT_RECENT_ESTIMATED_TOKENS = int(os.getenv("CHAT_RECENT_ESTIMATED_TOKENS", "4000"))
CHAT_SUMMARY_INPUT_MAX_CHARS = int(os.getenv("CHAT_SUMMARY_INPUT_MAX_CHARS", "20000"))
CHAT_MESSAGE_MAX_CHARS = int(os.getenv("CHAT_MESSAGE_MAX_CHARS", "12000"))
IMAGE_MAX_BYTES = int(os.getenv("IMAGE_MAX_BYTES", "1500000"))
IMAGE_MAX_LONG_EDGE = int(os.getenv("IMAGE_MAX_LONG_EDGE", "1280"))
IMAGE_JPEG_QUALITY = int(os.getenv("IMAGE_JPEG_QUALITY", "75"))
IMAGE_WEBP_QUALITY = int(os.getenv("IMAGE_WEBP_QUALITY", "70"))

# Model pricing configuration per provider
MODEL_PRICING = {
    "qwen-3.5-flash": {
        "name": "Qwen 3.5 Flash",
        "vision": False,
        "description": "Fast and efficient Qwen model.",
        "model_ids": {
            "openrouter": "qwen/qwen3.5-flash-02-23",
            "vercel": "alibaba/qwen3.5-flash"
        },
        "pricing": {
            "openrouter": {"inputPricePerM": 0.065, "outputPricePerM": 0.26},
            "vercel": {"inputPricePerM": 0.10, "outputPricePerM": 0.40},
        }
    },
    "qwen-3.6-plus": {
        "name": "Qwen 3.6 Plus",
        "vision": False,
        "description": "High-quality Qwen model for complex reasoning.",
        "model_ids": {
            "openrouter": "qwen/qwen3.6-plus",
            "vercel": "alibaba/qwen3.6-plus"
        },
        "pricing": {
            "openrouter": {"inputPricePerM": 0.325, "outputPricePerM": 1.95},
            "vercel": {"inputPricePerM": 0.50, "outputPricePerM": 3.00},
        }
    },
    "nemotron-3-super-120b": {
        "name": "Nemotron 3 Super 120B",
        "vision": False,
        "description": "Free model via OpenRouter. Good for general tasks.",
        "model_ids": {
            "openrouter": "nvidia/nemotron-3-super-120b-a12b:free",
            "vercel": "nvidia/nemotron-3-super-120b-a12b"
        },
        "pricing": {
            "openrouter": {"inputPricePerM": 0.0, "outputPricePerM": 0.0},
            "vercel": {"inputPricePerM": 0.15, "outputPricePerM": 0.65},
        }
    },
    "claude-sonnet-4.6": {
        "name": "Claude Sonnet 4.6",
        "vision": True,
        "description": "High-quality Claude model with vision support.",
        "model_ids": {
            "openrouter": "anthropic/claude-sonnet-4.6",
            "vercel": "anthropic/claude-sonnet-4.6"
        },
        "pricing": {
            "openrouter": {"inputPricePerM": 3.00, "outputPricePerM": 15.00},
            "vercel": {"inputPricePerM": 3.00, "outputPricePerM": 15.00},
        }
    },
}


def get_available_models(provider: str = "openrouter") -> list[dict]:
    """Get available models filtered by provider with appropriate pricing."""
    models = []
    for model_key, model_data in MODEL_PRICING.items():
        # Get model ID for the specific provider
        model_id = model_data["model_ids"].get(provider)
        if not model_id:
            continue  # Skip models not available for this provider
            
        # Get pricing for the specific provider
        pricing = model_data["pricing"].get(provider)
        if not pricing:
            continue  # Skip models without pricing for this provider
            
        models.append({
            "id": model_id,  # Use actual model ID for the provider
            "name": model_data["name"],
            "provider": provider.capitalize(),
            "inputCost": f"${pricing['inputPricePerM']}/M tokens",
            "outputCost": f"${pricing['outputPricePerM']}/M tokens",
            "inputPricePerM": pricing["inputPricePerM"],
            "outputPricePerM": pricing["outputPricePerM"],
            "vision": model_data["vision"],
            "description": model_data["description"],
        })
    return models
