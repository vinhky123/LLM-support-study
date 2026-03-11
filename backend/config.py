import os
from dotenv import load_dotenv

load_dotenv()

AI_GATEWAY_API_KEY = os.getenv("AI_GATEWAY_API_KEY", "")
AI_GATEWAY_BASE_URL = os.getenv("AI_GATEWAY_BASE_URL", "https://ai-gateway.vercel.sh/v1")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "google/gemini-2.0-flash-lite")

AVAILABLE_MODELS = [
    {
        "id": "google/gemini-2.0-flash-lite",
        "name": "Gemini 2.0 Flash Lite",
        "provider": "Google",
        "inputCost": "$0.075/M tokens",
        "outputCost": "$0.30/M tokens",
        "vision": True,
        "description": "Cheapest option. Good for explanations and summaries.",
    },
    {
        "id": "google/gemini-2.0-flash",
        "name": "Gemini 2.0 Flash",
        "provider": "Google",
        "inputCost": "$0.15/M tokens",
        "outputCost": "$0.60/M tokens",
        "vision": True,
        "description": "Balanced cost and quality. Recommended for study.",
    },
    {
        "id": "google/gemini-2.5-flash",
        "name": "Gemini 2.5 Flash",
        "provider": "Google",
        "inputCost": "$0.30/M tokens",
        "outputCost": "$2.50/M tokens",
        "vision": True,
        "description": "Best quality Gemini. Uses more credits.",
    },
    {
        "id": "xai/grok-4.1-fast-non-reasoning",
        "name": "Grok 4.1 Fast",
        "provider": "xAI",
        "inputCost": "$0.20/M tokens",
        "outputCost": "$0.50/M tokens",
        "vision": False,
        "description": "Fast and cheap Grok model. Text only.",
    },
    {
        "id": "amazon/nova-micro",
        "name": "Amazon Nova Micro",
        "provider": "Amazon",
        "inputCost": "$0.035/M tokens",
        "outputCost": "$0.14/M tokens",
        "vision": False,
        "description": "Cheapest text model. Good for simple Q&A.",
    },
]
