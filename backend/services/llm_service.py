import json
import hashlib
import time
import base64
from io import BytesIO
from functools import lru_cache

import httpx
from PIL import Image

from config import (
    DEFAULT_MODEL,
    IMAGE_JPEG_QUALITY,
    IMAGE_MAX_BYTES,
    IMAGE_MAX_LONG_EDGE,
    MODEL_PRICING,
    OPENROUTER_API_KEY,
    OPENROUTER_BASE_URL,
    VERCEL_API_KEY,
    VERCEL_BASE_URL,
)

# ---------------------------------------------------------------------------
# Response cache (deduplication)
# ---------------------------------------------------------------------------
_RESPONSE_CACHE: dict[str, dict] = {}
_RESPONSE_CACHE_TTL = 120  # seconds


def _cache_key(prompt: str, system: str, model: str, provider: str) -> str:
    return hashlib.sha256(f"{prompt}|{system}|{model}|{provider}".encode()).hexdigest()


def _get_cached(key: str) -> tuple[str, dict] | None:
    entry = _RESPONSE_CACHE.get(key)
    if entry and (time.time() - entry["ts"]) < _RESPONSE_CACHE_TTL:
        return entry["text"], entry["usage"]
    if entry:
        _RESPONSE_CACHE.pop(key, None)
    return None


def _set_cache(key: str, text: str, usage: dict) -> None:
    _RESPONSE_CACHE[key] = {"text": text, "usage": usage, "ts": time.time()}


# ---------------------------------------------------------------------------
# Provider helpers (cached)
# ---------------------------------------------------------------------------
@lru_cache(maxsize=2)
def _get_headers(provider: str) -> dict:
    if provider == "openrouter":
        if not OPENROUTER_API_KEY:
            raise ValueError(
                "OPENROUTER_API_KEY is not set. "
                "Create a .env file in backend/ with your OpenRouter API key. "
                "Get it from https://openrouter.ai/keys"
            )
        return {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        }
    elif provider == "vercel":
        if not VERCEL_API_KEY:
            raise ValueError(
                "VERCEL_API_KEY is not set. "
                "Create a .env file in backend/ with your Vercel AI Gateway key. "
                "Get it from https://vercel.com/~/ai-gateway"
            )
        return {
            "Authorization": f"Bearer {VERCEL_API_KEY}",
            "Content-Type": "application/json",
        }
    raise ValueError(f"Unknown provider: {provider}. Use 'openrouter' or 'vercel'.")


@lru_cache(maxsize=2)
def _get_base_url(provider: str) -> str:
    if provider == "openrouter":
        return OPENROUTER_BASE_URL
    elif provider == "vercel":
        return VERCEL_BASE_URL
    raise ValueError(f"Unknown provider: {provider}. Use 'openrouter' or 'vercel'.")


# ---------------------------------------------------------------------------
# Shared async HTTP client
# ---------------------------------------------------------------------------
_ASYNC_CLIENT: httpx.AsyncClient | None = None


def _get_async_client() -> httpx.AsyncClient:
    global _ASYNC_CLIENT
    if _ASYNC_CLIENT is None:
        _ASYNC_CLIENT = httpx.AsyncClient(
            timeout=httpx.Timeout(
                connect=10.0,
                read=90.0,
                write=30.0,
                pool=5.0,
            ),
            limits=httpx.Limits(
                max_keepalive_connections=10,
                max_connections=20,
            ),
            http2=True,
        )
    return _ASYNC_CLIENT


# ---------------------------------------------------------------------------
# Model ID resolution
# ---------------------------------------------------------------------------
_MODEL_ID_CACHE: dict[str, str] = {}


def _get_actual_model_id(model: str, provider: str) -> str:
    if not model:
        return DEFAULT_MODEL

    cache_key = f"{model}:{provider}"
    if cache_key in _MODEL_ID_CACHE:
        return _MODEL_ID_CACHE[cache_key]

    if model in MODEL_PRICING:
        model_data = MODEL_PRICING[model]
        model_ids = model_data.get("model_ids", {})
        provider_model_id = model_ids.get(provider)
        result = provider_model_id if provider_model_id else model_ids.get("openrouter", model)
    else:
        result = model

    _MODEL_ID_CACHE[cache_key] = result
    return result


# ---------------------------------------------------------------------------
# Message builder
# ---------------------------------------------------------------------------
def _build_messages(
    history: list[dict],
    user_message: str,
    image: dict | None,
    system_instruction: str,
) -> list[dict]:
    messages = [{"role": "system", "content": system_instruction}]

    for msg in history:
        role = "user" if msg["role"] == "user" else "assistant"
        text = msg.get("content", "")
        msg_image = msg.get("image")

        if msg_image and msg_image.get("data") and msg_image["data"] != "(image)":
            image_url = f"data:{msg_image['mimeType']};base64,{msg_image['data']}"
            if text:
                messages.append({
                    "role": role,
                    "content": [
                        {"type": "image_url", "image_url": {"url": image_url}},
                        {"type": "text", "text": text},
                    ],
                })
            else:
                messages.append({
                    "role": role,
                    "content": [{"type": "image_url", "image_url": {"url": image_url}}],
                })
        elif text:
            messages.append({"role": role, "content": text})

    if image and image.get("data"):
        optimized_image = _optimize_image_payload(image)
        image_url = f"data:{optimized_image['mimeType']};base64,{optimized_image['data']}"
        messages.append({
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": image_url}},
                {"type": "text", "text": user_message},
            ],
        })
    else:
        messages.append({"role": "user", "content": user_message})

    return messages


def _optimize_image_payload(image: dict) -> dict:
    """Server-side image optimization as a safety layer before model call."""
    data = image.get("data")
    mime_type = image.get("mimeType", "image/jpeg")
    if not data:
        return image

    try:
        raw = base64.b64decode(data, validate=False)
    except Exception:
        return image

    if len(raw) <= IMAGE_MAX_BYTES and mime_type in {"image/jpeg", "image/webp"}:
        return image

    try:
        img = Image.open(BytesIO(raw))
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")

        long_edge = max(img.size)
        if long_edge > IMAGE_MAX_LONG_EDGE:
            scale = IMAGE_MAX_LONG_EDGE / long_edge
            resized = (max(1, int(img.width * scale)), max(1, int(img.height * scale)))
            img = img.resize(resized, Image.Resampling.LANCZOS)

        output = BytesIO()
        img.save(output, format="JPEG", quality=IMAGE_JPEG_QUALITY, optimize=True)
        compressed = output.getvalue()
        if len(compressed) > IMAGE_MAX_BYTES:
            output = BytesIO()
            img.save(output, format="JPEG", quality=max(45, IMAGE_JPEG_QUALITY - 20), optimize=True)
            compressed = output.getvalue()

        return {
            "data": base64.b64encode(compressed).decode("utf-8"),
            "mimeType": "image/jpeg",
            "width": img.width,
            "height": img.height,
            "compressedBytes": len(compressed),
        }
    except Exception:
        return image


def _extract_usage(data: dict) -> dict:
    usage = data.get("usage") or {}
    return {
        "promptTokens": usage.get("prompt_tokens", 0),
        "completionTokens": usage.get("completion_tokens", 0),
        "totalTokens": usage.get("total_tokens", 0),
    }


# ---------------------------------------------------------------------------
# ASYNC: Chat streaming
# ---------------------------------------------------------------------------
async def async_chat_stream(
    history: list[dict],
    user_message: str,
    image: dict | None = None,
    system_instruction: str = "",
    model: str = "",
    provider: str = "openrouter",
):
    start_time = time.time()

    messages = _build_messages(history, user_message, image, system_instruction)
    actual_model = _get_actual_model_id(model, provider)
    body = {
        "model": actual_model,
        "messages": messages,
        "stream": True,
        "stream_options": {"include_usage": True},
    }

    usage: dict = {"promptTokens": 0, "completionTokens": 0, "totalTokens": 0}

    print(f"[LLM] async_stream start provider={provider} model={actual_model} msgs={len(messages)}")

    client = _get_async_client()
    async with client.stream(
        "POST",
        f"{_get_base_url(provider)}/chat/completions",
        headers=_get_headers(provider),
        json=body,
    ) as response:
        response.raise_for_status()
        first_chunk_time = None
        async for line in response.aiter_lines():
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
                    if first_chunk_time is None:
                        first_chunk_time = time.time() - start_time
                        print(f"[LLM] first chunk in {first_chunk_time:.2f}s")
                    yield {"type": "text", "text": content}
            except (json.JSONDecodeError, IndexError, KeyError):
                continue

    total = time.time() - start_time
    print(f"[LLM] async_stream done in {total:.2f}s tokens={usage.get('totalTokens', 0)}")
    yield {"type": "usage", "usage": usage}


# ---------------------------------------------------------------------------
# ASYNC: Generate text (non-streaming, with cache)
# ---------------------------------------------------------------------------
async def async_generate_text(
    prompt: str,
    system_instruction: str,
    model: str = "",
    provider: str = "openrouter",
) -> tuple[str, dict]:
    # Check cache (skip if prompt contains images)
    ck = _cache_key(prompt, system_instruction, model, provider)
    cached = _get_cached(ck)
    if cached:
        print(f"[LLM] cache hit for async_generate_text")
        return cached

    start_time = time.time()
    actual_model = _get_actual_model_id(model, provider)
    body = {
        "model": actual_model,
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt},
        ],
        "stream": False,
    }

    print(f"[LLM] async_generate_text start provider={provider} model={actual_model}")

    client = _get_async_client()
    response = await client.post(
        f"{_get_base_url(provider)}/chat/completions",
        headers=_get_headers(provider),
        json=body,
    )
    response.raise_for_status()
    data = response.json()
    text = data["choices"][0]["message"]["content"]
    usage = _extract_usage(data)

    total = time.time() - start_time
    print(f"[LLM] async_generate_text done in {total:.2f}s tokens={usage.get('totalTokens', 0)}")

    _set_cache(ck, text, usage)
    return text, usage


# ---------------------------------------------------------------------------
# ASYNC: Generate JSON (streaming variant for notes/quiz/flashcards)
# ---------------------------------------------------------------------------
async def async_generate_json(
    prompt: str,
    system_instruction: str,
    model: str = "",
    provider: str = "openrouter",
) -> tuple[list | dict, dict]:
    raw, usage = await async_generate_text(prompt, system_instruction, model, provider)
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1]
        cleaned = cleaned.rsplit("```", 1)[0]
    return json.loads(cleaned.strip()), usage


# ---------------------------------------------------------------------------
# ASYNC: Generate text with streaming (for notes/quiz/flashcards)
# ---------------------------------------------------------------------------
async def async_generate_text_stream(
    prompt: str,
    system_instruction: str,
    model: str = "",
    provider: str = "openrouter",
):
    """Stream text response. Yields text chunks and finally a usage dict."""
    start_time = time.time()

    # Check cache — if hit, yield full text at once
    ck = _cache_key(prompt, system_instruction, model, provider)
    cached = _get_cached(ck)
    if cached:
        print(f"[LLM] cache hit for async_generate_text_stream")
        yield {"type": "text", "text": cached[0]}
        yield {"type": "usage", "usage": cached[1]}
        return

    actual_model = _get_actual_model_id(model, provider)
    body = {
        "model": actual_model,
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt},
        ],
        "stream": True,
        "stream_options": {"include_usage": True},
    }

    usage: dict = {"promptTokens": 0, "completionTokens": 0, "totalTokens": 0}
    full_text = ""

    print(f"[LLM] async_generate_text_stream start provider={provider} model={actual_model}")

    client = _get_async_client()
    async with client.stream(
        "POST",
        f"{_get_base_url(provider)}/chat/completions",
        headers=_get_headers(provider),
        json=body,
    ) as response:
        response.raise_for_status()
        async for line in response.aiter_lines():
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
                    full_text += content
                    yield {"type": "text", "text": content}
            except (json.JSONDecodeError, IndexError, KeyError):
                continue

    total = time.time() - start_time
    print(f"[LLM] async_generate_text_stream done in {total:.2f}s tokens={usage.get('totalTokens', 0)}")

    _set_cache(ck, full_text, usage)
    yield {"type": "usage", "usage": usage}


# ---------------------------------------------------------------------------
# SYNC wrappers (kept for backward compatibility — notes/quiz service layer)
# ---------------------------------------------------------------------------
import asyncio


def chat_stream(*args, **kwargs):
    """Sync wrapper — should NOT be used directly; prefer async_chat_stream."""
    async def _collect():
        chunks = []
        async for chunk in async_chat_stream(*args, **kwargs):
            chunks.append(chunk)
        return chunks
    return asyncio.get_event_loop().run_until_complete(_collect())


def generate_text(*args, **kwargs):
    """Sync wrapper — should NOT be used directly; prefer async_generate_text."""
    return asyncio.get_event_loop().run_until_complete(async_generate_text(*args, **kwargs))


def generate_json(*args, **kwargs):
    """Sync wrapper — should NOT be used directly; prefer async_generate_json."""
    return asyncio.get_event_loop().run_until_complete(async_generate_json(*args, **kwargs))
