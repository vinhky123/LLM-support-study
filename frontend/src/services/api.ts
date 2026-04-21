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
  TokenUsage,
  ProviderInfo,
} from "../types";
import { useUsageStore } from "../stores/usageStore";

const API_BASE = "/api";

function trackUsage(usage: TokenUsage | undefined, modelId: string) {
  if (usage && (usage.promptTokens > 0 || usage.completionTokens > 0)) {
    useUsageStore.getState().addUsage(usage, modelId);
  }
}

export async function sendChatMessage(
  messages: ChatMessage[],
  message: string,
  image?: ImageData,
  onChunk?: (text: string) => void,
  certId: string = "common",
  model: string = "",
  provider: string = "openrouter",
): Promise<string> {
  const body = {
    // Ảnh chỉ gửi qua `image` (turn hiện tại); không gửi base64 trong lịch sử → giảm payload
    messages: messages.map((m) => {
      const stub =
        m.image?.data && !m.content.includes("[Đã gửi ảnh trong tin nhắn trước.]")
          ? "\n\n[Đã gửi ảnh trong tin nhắn trước.]"
          : "";
      return {
        role: m.role === "assistant" ? "model" : "user",
        content: m.content + stub,
        image: null,
      };
    }),
    message,
    image: image ? { data: image.data, mimeType: image.mimeType } : null,
    certId,
    model,
    provider,
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
        if (parsed.usage) {
          trackUsage(parsed.usage, parsed.model || model);
        }
      } catch {
        // skip unparseable chunks
      }
    }
  }

  if (!fullText.trim()) {
    throw new Error(
      "Không nhận được phản hồi từ máy chủ. Vui lòng thử lại hoặc kiểm tra kết nối và API.",
    );
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

export async function getModels(provider: string = "openrouter"): Promise<{ models: AIModel[]; default: string }> {
  const res = await fetch(`${API_BASE}/chat/models?provider=${provider}`);
  return res.json();
}

export async function getUsageRecords(): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(`${API_BASE}/usage`);
    if (!res.ok) return {};
    const data = await res.json();
    return data.records ?? {};
  } catch {
    return {};
  }
}

export async function getProviders(): Promise<{ providers: ProviderInfo[]; default: string }> {
  const res = await fetch(`${API_BASE}/chat/providers`);
  return res.json();
}

export async function saveUsageRecords(records: Record<string, unknown>): Promise<void> {
  try {
    await fetch(`${API_BASE}/usage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
    });
  } catch {
    // silently fail — localStorage is still the in-memory fallback
  }
}

// --- SSE helper for streaming endpoints ---
async function readSSE(
  url: string,
  body: unknown,
  onChunk: (text: string) => void,
): Promise<{ usage?: TokenUsage; model?: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let usage: TokenUsage | undefined;
  let model: string | undefined;

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
        if (parsed.text) onChunk(parsed.text);
        if (parsed.usage) {
          usage = parsed.usage;
          model = parsed.model;
        }
      } catch {
        // skip unparseable chunks
      }
    }
  }

  if (usage) trackUsage(usage, model || "");
  return { usage, model };
}

export async function generateNotes(
  messages: ChatMessage[],
  certId: string = "common",
  model: string = "",
  provider: string = "openrouter",
  onChunk?: (text: string) => void,
): Promise<string> {
  const body = {
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
      image: m.image ? { data: "(image)", mimeType: m.image.mimeType } : undefined,
    })),
    certId,
    model,
    provider,
  };

  // Use streaming if onChunk is provided
  if (onChunk) {
    let fullText = "";
    await readSSE(`${API_BASE}/notes/generate/stream`, body, (text) => {
      fullText += text;
      onChunk(fullText);
    });
    return fullText;
  }

  // Fallback to non-streaming
  const res = await fetch(`${API_BASE}/notes/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Note generation failed: ${res.status}`);
  const data = await res.json();
  trackUsage(data.usage, data.model || model);
  return data.notes;
}

export async function generateFlashcards(
  content: string,
  certId: string = "common",
  model: string = "",
  provider: string = "openrouter",
  onChunk?: (text: string) => void,
): Promise<Flashcard[]> {
  const body = { content, certId, model, provider };

  if (onChunk) {
    let fullText = "";
    await readSSE(`${API_BASE}/notes/flashcards/stream`, body, (text) => {
      fullText += text;
      onChunk(fullText);
    });
    // Parse final JSON from accumulated text
    const cleaned = fullText.trim();
    if (cleaned.startsWith("```")) {
      const parts = cleaned.split("\n");
      const jsonBlock = parts.find((p) => p.startsWith("[")) || parts.find((p) => p.startsWith("{"));
      if (jsonBlock) return JSON.parse(jsonBlock);
    }
    return JSON.parse(cleaned);
  }

  const res = await fetch(`${API_BASE}/notes/flashcards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Flashcard generation failed: ${res.status}`);
  const data = await res.json();
  trackUsage(data.usage, data.model || model);
  return data.flashcards;
}

export async function generateSummary(
  content: string,
  certId: string = "common",
  model: string = "",
  provider: string = "openrouter",
  onChunk?: (text: string) => void,
): Promise<SummaryDomain[]> {
  const body = { content, certId, model, provider };

  if (onChunk) {
    let fullText = "";
    await readSSE(`${API_BASE}/notes/summary/stream`, body, (text) => {
      fullText += text;
      onChunk(fullText);
    });
    const cleaned = fullText.trim();
    if (cleaned.startsWith("```")) {
      const parts = cleaned.split("\n");
      const jsonBlock = parts.find((p) => p.startsWith("[")) || parts.find((p) => p.startsWith("{"));
      if (jsonBlock) return JSON.parse(jsonBlock);
    }
    return JSON.parse(cleaned);
  }

  const res = await fetch(`${API_BASE}/notes/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Summary generation failed: ${res.status}`);
  const data = await res.json();
  trackUsage(data.usage, data.model || model);
  return data.summary;
}

export async function generateQuizFromTopic(
  topic: string,
  count = 5,
  certId: string = "common",
  model: string = "",
  provider: string = "openrouter",
  onChunk?: (text: string) => void,
): Promise<QuizQuestion[]> {
  const body = { topic, count, certId, model, provider };

  if (onChunk) {
    let fullText = "";
    await readSSE(`${API_BASE}/quiz/from-topic/stream`, body, (text) => {
      fullText += text;
      onChunk(fullText);
    });
    const cleaned = fullText.trim();
    if (cleaned.startsWith("```")) {
      const parts = cleaned.split("\n");
      const jsonBlock = parts.find((p) => p.startsWith("[")) || parts.find((p) => p.startsWith("{"));
      if (jsonBlock) return JSON.parse(jsonBlock);
    }
    return JSON.parse(cleaned);
  }

  const res = await fetch(`${API_BASE}/quiz/from-topic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Quiz generation failed: ${res.status}`);
  const data = await res.json();
  trackUsage(data.usage, data.model || model);
  return data.questions;
}

export async function generateQuizFromNotes(
  notes: string,
  count = 5,
  certId: string = "common",
  model: string = "",
  provider: string = "openrouter",
  onChunk?: (text: string) => void,
): Promise<QuizQuestion[]> {
  const body = { notes, count, certId, model, provider };

  if (onChunk) {
    let fullText = "";
    await readSSE(`${API_BASE}/quiz/from-notes/stream`, body, (text) => {
      fullText += text;
      onChunk(fullText);
    });
    const cleaned = fullText.trim();
    if (cleaned.startsWith("```")) {
      const parts = cleaned.split("\n");
      const jsonBlock = parts.find((p) => p.startsWith("[")) || parts.find((p) => p.startsWith("{"));
      if (jsonBlock) return JSON.parse(jsonBlock);
    }
    return JSON.parse(cleaned);
  }

  const res = await fetch(`${API_BASE}/quiz/from-notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Quiz generation failed: ${res.status}`);
  const data = await res.json();
  trackUsage(data.usage, data.model || model);
  return data.questions;
}
