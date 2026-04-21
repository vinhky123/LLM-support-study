import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from config import DEFAULT_MODEL
from services.note_service import (
    generate_notes_from_conversation,
    generate_notes_from_conversation_stream,
    generate_flashcards_from_notes,
    generate_flashcards_from_notes_stream,
    generate_summary_from_notes,
    generate_summary_from_notes_stream,
)

router = APIRouter()


class NoteGenerateRequest(BaseModel):
    messages: list[dict]
    certId: str = "common"
    model: str = ""
    provider: str = "openrouter"


class NoteParseRequest(BaseModel):
    content: str
    certId: str = "common"
    model: str = ""
    provider: str = "openrouter"


# --- Non-streaming endpoints (backward compatible) ---

@router.post("/generate")
async def generate_notes(request: NoteGenerateRequest):
    notes, usage = await generate_notes_from_conversation(
        request.messages, request.certId, request.model, request.provider,
    )
    return {"notes": notes, "usage": usage, "model": request.model or DEFAULT_MODEL}


@router.post("/flashcards")
async def parse_flashcards(request: NoteParseRequest):
    flashcards, usage = await generate_flashcards_from_notes(
        request.content, request.certId, request.model, request.provider,
    )
    return {"flashcards": flashcards, "usage": usage, "model": request.model or DEFAULT_MODEL}


@router.post("/summary")
async def parse_summary(request: NoteParseRequest):
    summary, usage = await generate_summary_from_notes(
        request.content, request.certId, request.model, request.provider,
    )
    return {"summary": summary, "usage": usage, "model": request.model or DEFAULT_MODEL}


# --- Streaming endpoints ---

@router.post("/generate/stream")
async def generate_notes_stream(request: NoteGenerateRequest):
    async def event_stream():
        try:
            async for chunk in generate_notes_from_conversation_stream(
                request.messages, request.certId, request.model, request.provider,
            ):
                if chunk["type"] == "text":
                    yield f"data: {json.dumps({'text': chunk['text']})}\n\n"
                elif chunk["type"] == "usage":
                    yield f"data: {json.dumps({'usage': chunk['usage'], 'model': request.model or DEFAULT_MODEL})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/flashcards/stream")
async def parse_flashcards_stream(request: NoteParseRequest):
    async def event_stream():
        try:
            async for chunk in generate_flashcards_from_notes_stream(
                request.content, request.certId, request.model, request.provider,
            ):
                if chunk["type"] == "text":
                    yield f"data: {json.dumps({'text': chunk['text']})}\n\n"
                elif chunk["type"] == "usage":
                    yield f"data: {json.dumps({'usage': chunk['usage'], 'model': request.model or DEFAULT_MODEL})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/summary/stream")
async def parse_summary_stream(request: NoteParseRequest):
    async def event_stream():
        try:
            async for chunk in generate_summary_from_notes_stream(
                request.content, request.certId, request.model, request.provider,
            ):
                if chunk["type"] == "text":
                    yield f"data: {json.dumps({'text': chunk['text']})}\n\n"
                elif chunk["type"] == "usage":
                    yield f"data: {json.dumps({'usage': chunk['usage'], 'model': request.model or DEFAULT_MODEL})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
