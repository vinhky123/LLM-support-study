import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services.llm_service import async_generate_json, async_generate_text_stream
from prompts.system_prompts import get_prompt
from config import DEFAULT_MODEL

router = APIRouter()


class QuizFromTopicRequest(BaseModel):
    topic: str
    count: int = 5
    certId: str = "common"
    model: str = ""
    provider: str = "openrouter"


class QuizFromNotesRequest(BaseModel):
    notes: str
    count: int = 5
    certId: str = "common"
    model: str = ""
    provider: str = "openrouter"


# --- Non-streaming endpoints (backward compatible) ---

@router.post("/from-topic")
async def quiz_from_topic(request: QuizFromTopicRequest):
    system_instruction = get_prompt("quiz_generation", request.certId)
    prompt = (
        f"Generate {request.count} exam-style multiple choice questions "
        f"about: {request.topic}"
    )
    questions, usage = await async_generate_json(prompt, system_instruction, request.model, request.provider)
    return {"questions": questions, "usage": usage, "model": request.model or DEFAULT_MODEL}


@router.post("/from-notes")
async def quiz_from_notes(request: QuizFromNotesRequest):
    system_instruction = get_prompt("quiz_generation", request.certId)
    prompt = (
        f"Generate {request.count} exam-style multiple choice questions "
        f"based on these study notes:\n\n{request.notes}"
    )
    questions, usage = await async_generate_json(prompt, system_instruction, request.model, request.provider)
    return {"questions": questions, "usage": usage, "model": request.model or DEFAULT_MODEL}


# --- Streaming endpoints ---

@router.post("/from-topic/stream")
async def quiz_from_topic_stream(request: QuizFromTopicRequest):
    system_instruction = get_prompt("quiz_generation", request.certId)
    prompt = (
        f"Generate {request.count} exam-style multiple choice questions "
        f"about: {request.topic}"
    )

    async def event_stream():
        try:
            async for chunk in async_generate_text_stream(prompt, system_instruction, request.model, request.provider):
                if chunk["type"] == "text":
                    yield f"data: {json.dumps({'text': chunk['text']})}\n\n"
                elif chunk["type"] == "usage":
                    yield f"data: {json.dumps({'usage': chunk['usage'], 'model': request.model or DEFAULT_MODEL})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/from-notes/stream")
async def quiz_from_notes_stream(request: QuizFromNotesRequest):
    system_instruction = get_prompt("quiz_generation", request.certId)
    prompt = (
        f"Generate {request.count} exam-style multiple choice questions "
        f"based on these study notes:\n\n{request.notes}"
    )

    async def event_stream():
        try:
            async for chunk in async_generate_text_stream(prompt, system_instruction, request.model, request.provider):
                if chunk["type"] == "text":
                    yield f"data: {json.dumps({'text': chunk['text']})}\n\n"
                elif chunk["type"] == "usage":
                    yield f"data: {json.dumps({'usage': chunk['usage'], 'model': request.model or DEFAULT_MODEL})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
