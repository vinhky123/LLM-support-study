from services.llm_service import generate_text, generate_json
from prompts.system_prompts import (
    NOTE_GENERATION,
    FLASHCARD_GENERATION,
    SUMMARY_GENERATION,
)


def generate_notes_from_conversation(messages: list[dict]) -> str:
    """Generate structured study notes from a conversation."""
    conversation_text = _format_conversation(messages)
    prompt = f"Here is the conversation to summarize into study notes:\n\n{conversation_text}"
    return generate_text(prompt, NOTE_GENERATION)


def generate_flashcards_from_notes(notes_content: str) -> list[dict]:
    """Parse notes into flashcard Q&A pairs."""
    prompt = f"Generate flashcards from these study notes:\n\n{notes_content}"
    return generate_json(prompt, FLASHCARD_GENERATION)


def generate_summary_from_notes(notes_content: str) -> list[dict]:
    """Generate a domain-organized summary from notes."""
    prompt = f"Generate a structured summary from these study notes:\n\n{notes_content}"
    return generate_json(prompt, SUMMARY_GENERATION)


def _format_conversation(messages: list[dict]) -> str:
    parts = []
    for msg in messages:
        role = "Student" if msg["role"] == "user" else "Tutor"
        content = msg.get("content", "")
        if msg.get("image"):
            content = "[Image attached] " + content
        parts.append(f"**{role}**: {content}")
    return "\n\n".join(parts)
