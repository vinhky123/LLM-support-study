import json
import hashlib
import time

from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services.llm_service import async_chat_stream, async_generate_text
from prompts.system_prompts import get_prompt
from prompts.cert_profiles import get_profile, get_all_profiles_summary
from config import (
    CHAT_HISTORY_MAX_ESTIMATED_TOKENS,
    CHAT_IMAGE_TOKEN_PENALTY,
    CHAT_MESSAGE_MAX_CHARS,
    CHAT_RECENT_ESTIMATED_TOKENS,
    CHAT_SUMMARY_INPUT_MAX_CHARS,
    CHAT_SUMMARY_MODEL,
    CHAT_TOKEN_CHARS_PER_TOKEN,
    DEFAULT_MODEL,
    get_available_models,
)

router = APIRouter()

# ---------------------------------------------------------------------------
# Summary cache — keyed by SHA-256 of older transcript text
# ---------------------------------------------------------------------------
_SUMMARY_CACHE: dict[str, dict] = {}
_SUMMARY_CACHE_TTL = 300  # 5 minutes


def _summary_cache_key(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def _get_cached_summary(key: str) -> str | None:
    entry = _SUMMARY_CACHE.get(key)
    if entry and (time.time() - entry["ts"]) < _SUMMARY_CACHE_TTL:
        return entry["summary"]
    if entry:
        _SUMMARY_CACHE.pop(key, None)
    return None


def _set_cached_summary(key: str, summary: str) -> None:
    _SUMMARY_CACHE[key] = {"summary": summary, "ts": time.time()}


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------
class ImageData(BaseModel):
    data: str
    mimeType: str


class ChatMessage(BaseModel):
    role: str
    content: str
    image: ImageData | None = None


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    message: str
    image: ImageData | None = None
    certId: str = "common"
    model: str = ""
    provider: str = "openrouter"


# ---------------------------------------------------------------------------
# Token estimation helpers
# ---------------------------------------------------------------------------
def _estimate_tokens_for_message(m: ChatMessage) -> int:
    text = m.content or ""
    n = max(0, len(text) // CHAT_TOKEN_CHARS_PER_TOKEN)
    if m.image and m.image.data:
        n += CHAT_IMAGE_TOKEN_PENALTY
    return max(1, n) if text.strip() or (m.image and m.image.data) else 0


def _estimate_total_tokens(messages: list[ChatMessage]) -> int:
    return sum(_estimate_tokens_for_message(m) for m in messages)


def _sanitize_messages(messages: list[ChatMessage]) -> list[ChatMessage]:
    """Strip images from history (current turn uses request.image). Truncate very long texts."""
    out: list[ChatMessage] = []
    for m in messages:
        content = m.content or ""
        image = m.image
        if image and image.data:
            stub = "\n\n[Đã gửi ảnh trong tin nhắn trước.]"
            if stub.strip() not in content:
                content = content + stub
            image = None
        if len(content) > CHAT_MESSAGE_MAX_CHARS:
            content = (
                content[:CHAT_MESSAGE_MAX_CHARS]
                + "\n\n[... đã cắt do độ dài.]"
            )
        out.append(ChatMessage(role=m.role, content=content, image=image))
    return out


def _take_recent_suffix(messages: list[ChatMessage], max_est: int) -> list[ChatMessage]:
    """Largest suffix whose estimated token cost is <= max_est."""
    if not messages:
        return []
    for count in range(len(messages), 0, -1):
        chunk = messages[-count:]
        if _estimate_total_tokens(chunk) <= max_est:
            return chunk
    return [messages[-1]]


# ---------------------------------------------------------------------------
# Deferred compression — returns (recent_history, older_text_or_None)
# ---------------------------------------------------------------------------
def _prepare_context(messages: list[ChatMessage]) -> tuple[list[dict], str | None]:
    """Split history into recent messages + optional older transcript for background compression."""
    if not messages:
        return [], None

    sanitized = _sanitize_messages(messages)
    total_est = _estimate_total_tokens(sanitized)

    # Fast path: whole history fits in recent budget
    if total_est <= CHAT_RECENT_ESTIMATED_TOKENS:
        return [m.model_dump() for m in sanitized], None

    recent = _take_recent_suffix(sanitized, CHAT_RECENT_ESTIMATED_TOKENS)
    older = sanitized[: len(sanitized) - len(recent)]

    if not older:
        return [m.model_dump() for m in recent], None

    # Build older transcript for background compression
    transcript_lines = [
        f"[{m.role}] {m.content}" for m in older if (m.content or "").strip()
    ]
    transcript = "\n".join(transcript_lines)
    if len(transcript) > CHAT_SUMMARY_INPUT_MAX_CHARS:
        transcript = (
            "[Đoạn đầu hội thoại đã bỏ qua do độ dài.]\n"
            + transcript[-CHAT_SUMMARY_INPUT_MAX_CHARS:]
        )

    return [m.model_dump() for m in recent], transcript


async def _compress_background(transcript: str, cert_id: str) -> str:
    """Run compression in background; returns summary text."""
    ck = _summary_cache_key(transcript)
    cached = _get_cached_summary(ck)
    if cached:
        return cached

    system_instruction = get_prompt("chat_compression", cert_id)
    summary, _usage = await async_generate_text(
        prompt=transcript,
        system_instruction=system_instruction,
        model=CHAT_SUMMARY_MODEL,
    )
    summary_text = summary.strip()
    if summary_text:
        _set_cached_summary(ck, summary_text)
    return summary_text


# ---------------------------------------------------------------------------
# Streaming event generator
# ---------------------------------------------------------------------------
async def _chat_event_stream(
    history: list[dict],
    user_message: str,
    image: dict | None,
    system_instruction: str,
    model: str,
    provider: str,
    older_transcript: str | None,
    cert_id: str,
):
    """Stream chat response. If older_transcript exists, compress it in background."""

    # Kick off background compression (non-blocking)
    summary_task = None
    if older_transcript:
        import asyncio
        summary_task = asyncio.create_task(_compress_background(older_transcript, cert_id))

    try:
        async for chunk in async_chat_stream(
            history,
            user_message,
            image,
            system_instruction=system_instruction,
            model=model,
            provider=provider,
        ):
            if chunk["type"] == "text":
                yield f"data: {json.dumps({'text': chunk['text']})}\n\n"
            elif chunk["type"] == "usage":
                yield f"data: {json.dumps({'usage': chunk['usage'], 'model': model or DEFAULT_MODEL})}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

    # Wait for background task to finish (it caches for next turn)
    if summary_task:
        try:
            await summary_task
        except Exception:
            pass  # Summary failure shouldn't break the response


@router.post("/message")
async def send_message(request: ChatRequest):
    system_instruction = get_prompt("study_assistant", request.certId)
    history, older_transcript = _prepare_context(request.messages)
    image = request.image.model_dump() if request.image else None

    return StreamingResponse(
        _chat_event_stream(
            history,
            request.message,
            image,
            system_instruction=system_instruction,
            model=request.model,
            provider=request.provider,
            older_transcript=older_transcript,
            cert_id=request.certId,
        ),
        media_type="text/event-stream",
    )


@router.get("/profiles")
async def list_profiles():
    return get_all_profiles_summary()


@router.get("/quick-prompts")
async def get_quick_prompts(certId: str = "common"):
    profile = get_profile(certId)
    return profile["quickPrompts"]


@router.get("/domains")
async def get_domains(certId: str = "common"):
    profile = get_profile(certId)
    return profile["domains"]


@router.get("/quiz-topics")
async def get_quiz_topics(certId: str = "common"):
    profile = get_profile(certId)
    return profile["suggestedQuizTopics"]


@router.get("/providers")
async def get_providers():
    return {
        "providers": [
            {
                "id": "openrouter",
                "name": "OpenRouter",
                "description": "Access to multiple AI models through a unified API",
                "website": "https://openrouter.ai",
                "requiresApiKey": True,
            },
            {
                "id": "vercel",
                "name": "Vercel AI Gateway",
                "description": "Vercel's AI Gateway service",
                "website": "https://vercel.com/~/ai-gateway",
                "requiresApiKey": True,
            },
        ],
        "default": "openrouter",
    }


@router.get("/models")
async def list_models(provider: str = "openrouter"):
    return {"models": get_available_models(provider), "default": DEFAULT_MODEL}
