from services.llm_service import generate_text, generate_json
from prompts.system_prompts import get_prompt


def generate_notes_from_conversation(
    messages: list[dict], cert_id: str = "common", model: str = "",
) -> tuple[str, dict]:
    conversation_text = _format_conversation(messages)
    prompt = f"Here is the conversation to summarize into study notes:\n\n{conversation_text}"
    system_instruction = get_prompt("note_generation", cert_id)
    return generate_text(prompt, system_instruction, model)


def generate_flashcards_from_notes(
    notes_content: str, cert_id: str = "common", model: str = "",
) -> tuple[list[dict], dict]:
    prompt = f"Generate flashcards from these study notes:\n\n{notes_content}"
    system_instruction = get_prompt("flashcard_generation", cert_id)
    return generate_json(prompt, system_instruction, model)


def generate_summary_from_notes(
    notes_content: str, cert_id: str = "common", model: str = "",
) -> tuple[list[dict], dict]:
    prompt = f"Generate a structured summary from these study notes:\n\n{notes_content}"
    system_instruction = get_prompt("summary_generation", cert_id)
    return generate_json(prompt, system_instruction, model)


def _format_conversation(messages: list[dict]) -> str:
    parts = []
    for msg in messages:
        role = "Student" if msg["role"] == "user" else "Tutor"
        content = msg.get("content", "")
        if msg.get("image"):
            content = "[Image attached] " + content
        parts.append(f"**{role}**: {content}")
    return "\n\n".join(parts)
