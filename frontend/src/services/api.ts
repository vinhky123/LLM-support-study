import type {
  ChatMessage,
  QuickPrompt,
  Domain,
  ImageData,
  Flashcard,
  SummaryDomain,
  QuizQuestion,
} from "../types";

const API_BASE = "/api";

export async function sendChatMessage(
  messages: ChatMessage[],
  message: string,
  image?: ImageData,
  onChunk?: (text: string) => void,
): Promise<string> {
  const body = {
    messages: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      content: m.content,
      image: m.image ? { data: m.image.data, mimeType: m.image.mimeType } : null,
    })),
    message,
    image: image ? { data: image.data, mimeType: image.mimeType } : null,
  };

  const res = await fetch(`${API_BASE}/chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Chat request failed: ${res.status}`);

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    const lines = text.split("\n");

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") break;

      try {
        const parsed = JSON.parse(data);
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.text) {
          fullText += parsed.text;
          onChunk?.(fullText);
        }
      } catch {
        // skip unparseable chunks
      }
    }
  }

  return fullText;
}

export async function getQuickPrompts(): Promise<QuickPrompt[]> {
  const res = await fetch(`${API_BASE}/chat/quick-prompts`);
  return res.json();
}

export async function getDomains(): Promise<Domain[]> {
  const res = await fetch(`${API_BASE}/chat/domains`);
  return res.json();
}

export async function generateNotes(
  messages: ChatMessage[],
): Promise<string> {
  const body = {
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
      image: m.image ? { data: "(image)", mimeType: m.image.mimeType } : undefined,
    })),
  };

  const res = await fetch(`${API_BASE}/notes/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Note generation failed: ${res.status}`);
  const data = await res.json();
  return data.notes;
}

export async function generateFlashcards(
  content: string,
): Promise<Flashcard[]> {
  const res = await fetch(`${API_BASE}/notes/flashcards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) throw new Error(`Flashcard generation failed: ${res.status}`);
  const data = await res.json();
  return data.flashcards;
}

export async function generateSummary(
  content: string,
): Promise<SummaryDomain[]> {
  const res = await fetch(`${API_BASE}/notes/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) throw new Error(`Summary generation failed: ${res.status}`);
  const data = await res.json();
  return data.summary;
}

export async function generateQuizFromTopic(
  topic: string,
  count = 5,
): Promise<QuizQuestion[]> {
  const res = await fetch(`${API_BASE}/quiz/from-topic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, count }),
  });

  if (!res.ok) throw new Error(`Quiz generation failed: ${res.status}`);
  const data = await res.json();
  return data.questions;
}

export async function generateQuizFromNotes(
  notes: string,
  count = 5,
): Promise<QuizQuestion[]> {
  const res = await fetch(`${API_BASE}/quiz/from-notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes, count }),
  });

  if (!res.ok) throw new Error(`Quiz generation failed: ${res.status}`);
  const data = await res.json();
  return data.questions;
}
