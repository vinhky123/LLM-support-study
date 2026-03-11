import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.llm_service import chat_stream, generate_text
from prompts.system_prompts import get_prompt
from prompts.cert_profiles import get_profile, get_all_profiles_summary
from config import AVAILABLE_MODELS, DEFAULT_MODEL

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


def _maybe_compress_history(
    messages: list[ChatMessage], cert_id: str, model: str
) -> list[dict]:
    """If history is too long, summarize older part into a single summary message."""
    # Rough heuristic based on total character count
    total_chars = sum(len(m.content or "") for m in messages)
    MAX_CHARS = 8000

    if total_chars <= MAX_CHARS or not messages:
        return [m.model_dump() for m in messages]

    # Keep the most recent messages verbatim
    RECENT_COUNT = 10
    recent_messages = messages[-RECENT_COUNT:]
    older_messages = messages[:-RECENT_COUNT]

    # Build a plain-text transcript for the older part
    transcript_lines = [f"[{m.role}] {m.content}" for m in older_messages if m.content]
    transcript = "\n".join(transcript_lines)

    system_instruction = get_prompt("chat_compression", cert_id)
    summary, _usage = generate_text(
        prompt=transcript,
        system_instruction=system_instruction,
        model=model,
    )

    compressed_history: list[dict] = []
    if summary.strip():
        compressed_history.append(
            {
                "role": "assistant",
                "content": f"Summary of earlier conversation:\n{summary}",
            }
        )

    compressed_history.extend(m.model_dump() for m in recent_messages)
    return compressed_history


@router.post("/message")
async def send_message(request: ChatRequest):
    system_instruction = get_prompt("study_assistant", request.certId)

    def event_stream():
        try:
            history = _maybe_compress_history(
                request.messages, cert_id=request.certId, model=request.model or DEFAULT_MODEL
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
