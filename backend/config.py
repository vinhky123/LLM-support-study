import os
from dotenv import load_dotenv

load_dotenv()

AI_GATEWAY_API_KEY = os.getenv("AI_GATEWAY_API_KEY", "")
AI_GATEWAY_BASE_URL = os.getenv("AI_GATEWAY_BASE_URL", "https://ai-gateway.vercel.sh/v1")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "google/gemini-2.0-flash-lite")

# Chat history / compression (token estimates are heuristic; see CHAT_TOKEN_CHARS_PER_TOKEN)
CHAT_SUMMARY_MODEL = os.getenv("CHAT_SUMMARY_MODEL", "google/gemini-2.0-flash-lite")
CHAT_TOKEN_CHARS_PER_TOKEN = max(1, int(os.getenv("CHAT_TOKEN_CHARS_PER_TOKEN", "4")))
CHAT_IMAGE_TOKEN_PENALTY = int(os.getenv("CHAT_IMAGE_TOKEN_PENALTY", "2000"))
CHAT_HISTORY_MAX_ESTIMATED_TOKENS = int(os.getenv("CHAT_HISTORY_MAX_ESTIMATED_TOKENS", "10000"))
CHAT_RECENT_ESTIMATED_TOKENS = int(os.getenv("CHAT_RECENT_ESTIMATED_TOKENS", "6000"))
CHAT_SUMMARY_INPUT_MAX_CHARS = int(os.getenv("CHAT_SUMMARY_INPUT_MAX_CHARS", "20000"))
CHAT_MESSAGE_MAX_CHARS = int(os.getenv("CHAT_MESSAGE_MAX_CHARS", "12000"))

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
    {
        "id": "alibaba/qwen3.6-plus",
        "name": "Qwen 3.6 Plus",
        "provider": "Alibaba",
        "inputCost": "$0.50/M tokens",
        "outputCost": "$3.00/M tokens",
        "inputPricePerM": 0.50,
        "outputPricePerM": 3.00,
        "vision": False,
        "description": "High-quality Qwen model for complex reasoning.",
    },
]
