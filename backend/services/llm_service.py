import base64
import json
from google import genai
from google.genai import types
from config import GEMINI_API_KEY, GEMINI_MODEL

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        if not GEMINI_API_KEY:
            raise ValueError(
                "GEMINI_API_KEY is not set. "
                "Create a .env file in backend/ with your key. "
                "Get a free key at https://aistudio.google.com/apikey"
            )
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client


def _build_history(messages: list[dict]) -> list[types.Content]:
    """Convert frontend message format to google-genai Content objects."""
    history = []
    for msg in messages:
        role = "user" if msg["role"] == "user" else "model"
        parts: list[types.Part] = []
        if msg.get("image") and msg["image"].get("data"):
            try:
                image_bytes = base64.b64decode(msg["image"]["data"])
                parts.append(types.Part.from_bytes(
                    data=image_bytes,
                    mime_type=msg["image"]["mimeType"],
                ))
            except Exception:
                pass
        if msg.get("content"):
            parts.append(types.Part.from_text(text=msg["content"]))
        if parts:
            history.append(types.Content(role=role, parts=parts))
    return history


def chat_stream(
    messages: list[dict],
    user_message: str,
    image: dict | None = None,
    system_instruction: str = "",
):
    """Stream chat response from Gemini. Yields text chunks."""
    client = _get_client()
    history = _build_history(messages)

    chat = client.chats.create(
        model=GEMINI_MODEL,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
        ),
        history=history,
    )

    user_parts: list[types.Part] = []
    if image and image.get("data"):
        image_bytes = base64.b64decode(image["data"])
        user_parts.append(types.Part.from_bytes(
            data=image_bytes,
            mime_type=image["mimeType"],
        ))
    user_parts.append(types.Part.from_text(text=user_message))

    for chunk in chat.send_message_stream(user_parts):
        if chunk.text:
            yield chunk.text


def generate_text(prompt: str, system_instruction: str) -> str:
    """Generate a complete text response (non-streaming)."""
    client = _get_client()
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
        ),
    )
    return response.text


def generate_json(prompt: str, system_instruction: str) -> list | dict:
    """Generate and parse a JSON response."""
    raw = generate_text(prompt, system_instruction)
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1]
        cleaned = cleaned.rsplit("```", 1)[0]
    return json.loads(cleaned.strip())
