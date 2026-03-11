import json
import httpx
from config import AI_GATEWAY_API_KEY, AI_GATEWAY_BASE_URL, DEFAULT_MODEL


def _headers() -> dict:
    if not AI_GATEWAY_API_KEY:
        raise ValueError(
            "AI_GATEWAY_API_KEY is not set. "
            "Create a .env file in backend/ with your Vercel AI Gateway key. "
            "Get it from https://vercel.com/~/ai-gateway"
        )
    return {
        "Authorization": f"Bearer {AI_GATEWAY_API_KEY}",
        "Content-Type": "application/json",
    }


def _build_messages(
    history: list[dict],
    user_message: str,
    image: dict | None,
    system_instruction: str,
) -> list[dict]:
    """Build OpenAI-compatible messages array."""
    messages = [{"role": "system", "content": system_instruction}]

    for msg in history:
        role = "user" if msg["role"] == "user" else "assistant"
        content_parts = []
        if msg.get("image") and msg["image"].get("data") and msg["image"]["data"] != "(image)":
            content_parts.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:{msg['image']['mimeType']};base64,{msg['image']['data']}",
                },
            })
        text = msg.get("content", "")
        if text:
            content_parts.append({"type": "text", "text": text})

        if content_parts:
            messages.append({"role": role, "content": content_parts if len(content_parts) > 1 else text})

    user_content: list[dict] | str
    if image and image.get("data"):
        user_content = [
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{image['mimeType']};base64,{image['data']}",
                },
            },
            {"type": "text", "text": user_message},
        ]
    else:
        user_content = user_message

    messages.append({"role": "user", "content": user_content})
    return messages


def _extract_usage(data: dict) -> dict:
    """Extract token usage from an OpenAI-compatible response."""
    usage = data.get("usage") or {}
    return {
        "promptTokens": usage.get("prompt_tokens", 0),
        "completionTokens": usage.get("completion_tokens", 0),
        "totalTokens": usage.get("total_tokens", 0),
    }


def chat_stream(
    history: list[dict],
    user_message: str,
    image: dict | None = None,
    system_instruction: str = "",
    model: str = "",
):
    """Stream chat response. Yields text chunks and finally a usage dict."""
    messages = _build_messages(history, user_message, image, system_instruction)
    body = {
        "model": model or DEFAULT_MODEL,
        "messages": messages,
        "stream": True,
        "stream_options": {"include_usage": True},
    }

    usage = {"promptTokens": 0, "completionTokens": 0, "totalTokens": 0}

    with httpx.Client(timeout=120) as client:
        with client.stream(
            "POST",
            f"{AI_GATEWAY_BASE_URL}/chat/completions",
            headers=_headers(),
            json=body,
        ) as response:
            response.raise_for_status()
            for line in response.iter_lines():
                if not line.startswith("data: "):
                    continue
                data = line[6:].strip()
                if data == "[DONE]":
                    break
                try:
                    parsed = json.loads(data)
                    if parsed.get("usage"):
                        usage = _extract_usage(parsed)
                    delta = parsed.get("choices", [{}])[0].get("delta", {})
                    content = delta.get("content")
                    if content:
                        yield {"type": "text", "text": content}
                except (json.JSONDecodeError, IndexError, KeyError):
                    continue

    yield {"type": "usage", "usage": usage}


def generate_text(prompt: str, system_instruction: str, model: str = "") -> tuple[str, dict]:
    """Generate a complete text response. Returns (text, usage)."""
    body = {
        "model": model or DEFAULT_MODEL,
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt},
        ],
        "stream": False,
    }

    with httpx.Client(timeout=120) as client:
        response = client.post(
            f"{AI_GATEWAY_BASE_URL}/chat/completions",
            headers=_headers(),
            json=body,
        )
        response.raise_for_status()
        data = response.json()
        text = data["choices"][0]["message"]["content"]
        usage = _extract_usage(data)
        return text, usage


def generate_json(prompt: str, system_instruction: str, model: str = "") -> tuple[list | dict, dict]:
    """Generate and parse a JSON response. Returns (parsed_json, usage)."""
    raw, usage = generate_text(prompt, system_instruction, model)
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1]
        cleaned = cleaned.rsplit("```", 1)[0]
    return json.loads(cleaned.strip()), usage
