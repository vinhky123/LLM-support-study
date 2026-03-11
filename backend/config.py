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
        "inputPricePerM": 0.075,
        "outputPricePerM": 0.30,
        "vision": True,
        "description": "Cheapest option. Good for explanations and summaries.",
    },
    {
        "id": "google/gemini-2.0-flash",
        "name": "Gemini 2.0 Flash",
        "provider": "Google",
        "inputCost": "$0.15/M tokens",
        "outputCost": "$0.60/M tokens",
        "inputPricePerM": 0.15,
        "outputPricePerM": 0.60,
        "vision": True,
        "description": "Balanced cost and quality. Recommended for study.",
    },
    {
        "id": "google/gemini-2.5-flash",
        "name": "Gemini 2.5 Flash",
        "provider": "Google",
        "inputCost": "$0.30/M tokens",
        "outputCost": "$2.50/M tokens",
        "inputPricePerM": 0.30,
        "outputPricePerM": 2.50,
        "vision": True,
        "description": "Best quality Gemini. Uses more credits.",
    },
    {
        "id": "openai/gpt-4o-mini",
        "name": "GPT-4o Mini",
        "provider": "OpenAI",
        "inputCost": "$0.15/M tokens",
        "outputCost": "$0.60/M tokens",
        "inputPricePerM": 0.15,
        "outputPricePerM": 0.60,
        "vision": True,
        "description": "Affordable GPT option with vision support.",
    },
    {
        "id": "openai/gpt-4.1-mini",
        "name": "GPT-4.1 Mini",
        "provider": "OpenAI",
        "inputCost": "$0.40/M tokens",
        "outputCost": "$1.60/M tokens",
        "inputPricePerM": 0.40,
        "outputPricePerM": 1.60,
        "vision": True,
        "description": "Stronger GPT mini variant.",
    },
    {
        "id": "anthropic/claude-sonnet-4.6",
        "name": "Claude Sonnet 4.6",
        "provider": "Anthropic",
        "inputCost": "$3.00/M tokens",
        "outputCost": "$15.00/M tokens",
        "inputPricePerM": 3.00,
        "outputPricePerM": 15.00,
        "vision": True,
        "description": "High-quality Claude model with vision support.",
    },
]
