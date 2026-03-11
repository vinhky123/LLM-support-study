import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.llm_service import chat_stream
from prompts.system_prompts import QUICK_PROMPTS, DEA_C01_DOMAINS

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


@router.post("/message")
async def send_message(request: ChatRequest):
    def event_stream():
        try:
            history = [m.model_dump() for m in request.messages]
            image = request.image.model_dump() if request.image else None
            for chunk in chat_stream(history, request.message, image):
                yield f"data: {json.dumps({'text': chunk})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/quick-prompts")
async def get_quick_prompts():
    return QUICK_PROMPTS


@router.get("/domains")
async def get_domains():
    return DEA_C01_DOMAINS
