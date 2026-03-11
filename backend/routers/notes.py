from fastapi import APIRouter
from pydantic import BaseModel
from config import DEFAULT_MODEL
from services.note_service import (
    generate_notes_from_conversation,
    generate_flashcards_from_notes,
    generate_summary_from_notes,
)

router = APIRouter()


class NoteGenerateRequest(BaseModel):
    messages: list[dict]
    certId: str = "common"
    model: str = ""


class NoteParseRequest(BaseModel):
    content: str
    certId: str = "common"
    model: str = ""


@router.post("/generate")
async def generate_notes(request: NoteGenerateRequest):
    notes, usage = generate_notes_from_conversation(request.messages, request.certId, request.model)
    return {"notes": notes, "usage": usage, "model": request.model or DEFAULT_MODEL}


@router.post("/flashcards")
async def parse_flashcards(request: NoteParseRequest):
    flashcards, usage = generate_flashcards_from_notes(request.content, request.certId, request.model)
    return {"flashcards": flashcards, "usage": usage, "model": request.model or DEFAULT_MODEL}


@router.post("/summary")
async def parse_summary(request: NoteParseRequest):
    summary, usage = generate_summary_from_notes(request.content, request.certId, request.model)
    return {"summary": summary, "usage": usage, "model": request.model or DEFAULT_MODEL}
