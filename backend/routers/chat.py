import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.llm_service import chat_stream
from prompts.system_prompts import get_prompt
from prompts.cert_profiles import get_profile, get_all_profiles_summary

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


@router.post("/message")
async def send_message(request: ChatRequest):
    system_instruction = get_prompt("study_assistant", request.certId)

    def event_stream():
        try:
            history = [m.model_dump() for m in request.messages]
            image = request.image.model_dump() if request.image else None
            for chunk in chat_stream(
                history,
                request.message,
                image,
                system_instruction=system_instruction,
            ):
                yield f"data: {json.dumps({'text': chunk})}\n\n"
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
