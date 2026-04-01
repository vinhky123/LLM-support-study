import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.llm_service import chat_stream, generate_text
from prompts.system_prompts import get_prompt
from prompts.cert_profiles import get_profile, get_all_profiles_summary
from config import (
    AVAILABLE_MODELS,
    CHAT_HISTORY_MAX_ESTIMATED_TOKENS,
    CHAT_IMAGE_TOKEN_PENALTY,
    CHAT_MESSAGE_MAX_CHARS,
    CHAT_RECENT_ESTIMATED_TOKENS,
    CHAT_SUMMARY_INPUT_MAX_CHARS,
    CHAT_SUMMARY_MODEL,
    CHAT_TOKEN_CHARS_PER_TOKEN,
    DEFAULT_MODEL,
)

router = APIRouter()


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


def _maybe_compress_history(
    messages: list[ChatMessage],
    cert_id: str,
) -> list[dict]:
    """Bound context: token-shaped recent window + optional cheap-model summary of older turns."""
    if not messages:
        return []

    sanitized = _sanitize_messages(messages)
    total_est = _estimate_total_tokens(sanitized)

    # Fast path: whole history fits in recent budget — send everything
    if total_est <= CHAT_RECENT_ESTIMATED_TOKENS:
        return [m.model_dump() for m in sanitized]

    recent = _take_recent_suffix(sanitized, CHAT_RECENT_ESTIMATED_TOKENS)
    older = sanitized[: len(sanitized) - len(recent)]

    if not older:
        return [m.model_dump() for m in recent]

    # Optional: if total is under global max, we could still only send recent + summary
    # when older exists we always summarize older to avoid huge prompts
    transcript_lines = [
        f"[{m.role}] {m.content}" for m in older if (m.content or "").strip()
    ]
    transcript = "\n".join(transcript_lines)
    if len(transcript) > CHAT_SUMMARY_INPUT_MAX_CHARS:
        transcript = (
            "[Đoạn đầu hội thoại đã bỏ qua do độ dài.]\n"
            + transcript[-CHAT_SUMMARY_INPUT_MAX_CHARS:]
        )

    system_instruction = get_prompt("chat_compression", cert_id)
    summary, _usage = generate_text(
        prompt=transcript,
        system_instruction=system_instruction,
        model=CHAT_SUMMARY_MODEL,
    )

    summary_text = summary.strip()
    summary_est = (
        max(64, len(summary_text) // CHAT_TOKEN_CHARS_PER_TOKEN) if summary_text else 0
    )
    # Keep summary + recent under global prompt budget
    recent_budget = max(1500, CHAT_HISTORY_MAX_ESTIMATED_TOKENS - summary_est - 400)
    if _estimate_total_tokens(recent) > recent_budget:
        recent = _take_recent_suffix(recent, recent_budget)

    compressed_history: list[dict] = []
    if summary_text:
        compressed_history.append(
            {
                "role": "assistant",
                "content": f"Summary of earlier conversation:\n{summary_text}",
            }
        )

    compressed_history.extend(m.model_dump() for m in recent)

    return compressed_history


@router.post("/message")
async def send_message(request: ChatRequest):
    system_instruction = get_prompt("study_assistant", request.certId)

    def event_stream():
        try:
            history = _maybe_compress_history(
                request.messages,
                cert_id=request.certId,
            )
            image = request.image.model_dump() if request.image else None
            for chunk in chat_stream(
                history,
                request.message,
                image,
                system_instruction=system_instruction,
                model=request.model,
            ):
                if chunk["type"] == "text":
                    yield f"data: {json.dumps({'text': chunk['text']})}\n\n"
                elif chunk["type"] == "usage":
                    yield f"data: {json.dumps({'usage': chunk['usage'], 'model': request.model or DEFAULT_MODEL})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


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


@router.get("/models")
async def list_models():
    return {"models": AVAILABLE_MODELS, "default": DEFAULT_MODEL}
