import type {
  ChatMessage,
  QuickPrompt,
  Domain,
  ImageData,
  Flashcard,
  SummaryDomain,
  QuizQuestion,
  CertProfile,
  AIModel,
} from "../types";

const API_BASE = "/api";

export async function sendChatMessage(
  messages: ChatMessage[],
  message: string,
  image?: ImageData,
  onChunk?: (text: string) => void,
  certId: string = "common",
  model: string = "",
): Promise<string> {
  const body = {
    messages: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      content: m.content,
      image: m.image ? { data: m.image.data, mimeType: m.image.mimeType } : null,
    })),
    message,
    image: image ? { data: image.data, mimeType: image.mimeType } : null,
    certId,
    model,
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

export async function getProfiles(): Promise<CertProfile[]> {
  const res = await fetch(`${API_BASE}/chat/profiles`);
  return res.json();
}

export async function getQuickPrompts(certId: string = "common"): Promise<QuickPrompt[]> {
  const res = await fetch(`${API_BASE}/chat/quick-prompts?certId=${certId}`);
  return res.json();
}

export async function getDomains(certId: string = "common"): Promise<Domain[]> {
  const res = await fetch(`${API_BASE}/chat/domains?certId=${certId}`);
  return res.json();
}

export async function getQuizTopics(certId: string = "common"): Promise<string[]> {
  const res = await fetch(`${API_BASE}/chat/quiz-topics?certId=${certId}`);
  return res.json();
}

export async function getModels(): Promise<{ models: AIModel[]; default: string }> {
  const res = await fetch(`${API_BASE}/chat/models`);
  return res.json();
}

export async function generateNotes(
  messages: ChatMessage[],
  certId: string = "common",
  model: string = "",
): Promise<string> {
  const body = {
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
      image: m.image ? { data: "(image)", mimeType: m.image.mimeType } : undefined,
    })),
    certId,
    model,
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
  certId: string = "common",
  model: string = "",
): Promise<Flashcard[]> {
  const res = await fetch(`${API_BASE}/notes/flashcards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, certId, model }),
  });

  if (!res.ok) throw new Error(`Flashcard generation failed: ${res.status}`);
  const data = await res.json();
  return data.flashcards;
}

export async function generateSummary(
  content: string,
  certId: string = "common",
  model: string = "",
): Promise<SummaryDomain[]> {
  const res = await fetch(`${API_BASE}/notes/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, certId, model }),
  });

  if (!res.ok) throw new Error(`Summary generation failed: ${res.status}`);
  const data = await res.json();
  return data.summary;
}

export async function generateQuizFromTopic(
  topic: string,
  count = 5,
  certId: string = "common",
  model: string = "",
): Promise<QuizQuestion[]> {
  const res = await fetch(`${API_BASE}/quiz/from-topic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, count, certId, model }),
  });

  if (!res.ok) throw new Error(`Quiz generation failed: ${res.status}`);
  const data = await res.json();
  return data.questions;
}

export async function generateQuizFromNotes(
  notes: string,
  count = 5,
  certId: string = "common",
  model: string = "",
): Promise<QuizQuestion[]> {
  const res = await fetch(`${API_BASE}/quiz/from-notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes, count, certId, model }),
  });

  if (!res.ok) throw new Error(`Quiz generation failed: ${res.status}`);
  const data = await res.json();
  return data.questions;
}
