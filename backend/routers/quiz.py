from fastapi import APIRouter
from pydantic import BaseModel
from services.llm_service import generate_json
from prompts.system_prompts import get_prompt
from config import DEFAULT_MODEL

router = APIRouter()


class QuizFromTopicRequest(BaseModel):
    topic: str
    count: int = 5
    certId: str = "common"
    model: str = ""


class QuizFromNotesRequest(BaseModel):
    notes: str
    count: int = 5
    certId: str = "common"
    model: str = ""


@router.post("/from-topic")
async def quiz_from_topic(request: QuizFromTopicRequest):
    system_instruction = get_prompt("quiz_generation", request.certId)
    prompt = (
        f"Generate {request.count} exam-style multiple choice questions "
        f"about: {request.topic}"
    )
    questions, usage = generate_json(prompt, system_instruction, request.model)
    return {"questions": questions, "usage": usage, "model": request.model or DEFAULT_MODEL}


@router.post("/from-notes")
async def quiz_from_notes(request: QuizFromNotesRequest):
    system_instruction = get_prompt("quiz_generation", request.certId)
    prompt = (
        f"Generate {request.count} exam-style multiple choice questions "
        f"based on these study notes:\n\n{request.notes}"
    )
    questions, usage = generate_json(prompt, system_instruction, request.model)
    return {"questions": questions, "usage": usage, "model": request.model or DEFAULT_MODEL}
