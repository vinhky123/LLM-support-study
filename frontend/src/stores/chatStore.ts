import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatSession, ChatMessage, DomainProgress } from "../types";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

interface ChatStore {
  sessions: ChatSession[];
  currentSessionId: string | null;
  domainProgress: DomainProgress[];
  isLoading: boolean;

  getCurrentSession: () => ChatSession | null;
  createSession: (name?: string) => string;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  updateLastAssistantMessage: (content: string) => void;
  setLoading: (loading: boolean) => void;
  updateDomainProgress: (
    domainId: string,
    confidence: DomainProgress["confidence"],
  ) => void;
  addStudiedTopic: (domainId: string, topic: string) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      domainProgress: [
        { domainId: "ingestion", confidence: "not_started", topicsStudied: [] },
        { domainId: "store", confidence: "not_started", topicsStudied: [] },
        { domainId: "operations", confidence: "not_started", topicsStudied: [] },
        { domainId: "security", confidence: "not_started", topicsStudied: [] },
      ],
      isLoading: false,

      getCurrentSession: () => {
        const { sessions, currentSessionId } = get();
        return sessions.find((s) => s.id === currentSessionId) ?? null;
      },

      createSession: (name?: string) => {
        const id = generateId();
        const session: ChatSession = {
          id,
          name: name || `Chat ${get().sessions.length + 1}`,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          sessions: [session, ...state.sessions],
          currentSessionId: id,
        }));
        return id;
      },

      switchSession: (id) => set({ currentSessionId: id }),

      deleteSession: (id) =>
        set((state) => {
          const sessions = state.sessions.filter((s) => s.id !== id);
          const currentSessionId =
            state.currentSessionId === id
              ? sessions[0]?.id ?? null
              : state.currentSessionId;
          return { sessions, currentSessionId };
        }),

      renameSession: (id, name) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, name } : s,
          ),
        })),

      addMessage: (message) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === state.currentSessionId
              ? {
                  ...s,
                  messages: [
                    ...s.messages,
                    { ...message, id: generateId(), timestamp: Date.now() },
                  ],
                  updatedAt: Date.now(),
                }
              : s,
          ),
        })),

      updateLastAssistantMessage: (content) =>
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== state.currentSessionId) return s;
            const messages = [...s.messages];
            const lastIdx = messages.length - 1;
            if (lastIdx >= 0 && messages[lastIdx].role === "assistant") {
              messages[lastIdx] = { ...messages[lastIdx], content };
            }
            return { ...s, messages, updatedAt: Date.now() };
          }),
        })),

      setLoading: (isLoading) => set({ isLoading }),

      updateDomainProgress: (domainId, confidence) =>
        set((state) => ({
          domainProgress: state.domainProgress.map((d) =>
            d.domainId === domainId ? { ...d, confidence } : d,
          ),
        })),

      addStudiedTopic: (domainId, topic) =>
        set((state) => ({
          domainProgress: state.domainProgress.map((d) =>
            d.domainId === domainId && !d.topicsStudied.includes(topic)
              ? { ...d, topicsStudied: [...d.topicsStudied, topic] }
              : d,
          ),
        })),
    }),
    { name: "cloud-study-chat" },
  ),
);
