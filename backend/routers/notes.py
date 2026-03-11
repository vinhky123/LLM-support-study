from fastapi import APIRouter
from pydantic import BaseModel
from services.note_service import (
    generate_notes_from_conversation,
    generate_flashcards_from_notes,
    generate_summary_from_notes,
)

router = APIRouter()


class NoteGenerateRequest(BaseModel):
    messages: list[dict]


class NoteParseRequest(BaseModel):
    content: str


@router.post("/generate")
async def generate_notes(request: NoteGenerateRequest):
    notes = generate_notes_from_conversation(request.messages)
    return {"notes": notes}


@router.post("/flashcards")
async def parse_flashcards(request: NoteParseRequest):
    flashcards = generate_flashcards_from_notes(request.content)
    return {"flashcards": flashcards}


@router.post("/summary")
async def parse_summary(request: NoteParseRequest):
    summary = generate_summary_from_notes(request.content)
    return {"summary": summary}
