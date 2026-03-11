from fastapi import APIRouter
from pydantic import BaseModel
from services.llm_service import generate_json
from prompts.system_prompts import QUIZ_GENERATION

router = APIRouter()


class QuizFromTopicRequest(BaseModel):
    topic: str
    count: int = 5


class QuizFromNotesRequest(BaseModel):
    notes: str
    count: int = 5


@router.post("/from-topic")
async def quiz_from_topic(request: QuizFromTopicRequest):
    prompt = (
        f"Generate {request.count} exam-style multiple choice questions "
        f"about: {request.topic}"
    )
    questions = generate_json(prompt, QUIZ_GENERATION)
    return {"questions": questions}


@router.post("/from-notes")
async def quiz_from_notes(request: QuizFromNotesRequest):
    prompt = (
        f"Generate {request.count} exam-style multiple choice questions "
        f"based on these study notes:\n\n{request.notes}"
    )
    questions = generate_json(prompt, QUIZ_GENERATION)
    return {"questions": questions}
