import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatSession, ChatMessage, DomainProgress } from "../types";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

interface ChatStore {
  sessions: ChatSession[];
  currentSessionId: string | null;
  currentCertId: string;
  currentModelId: string;
  currentProvider: string;
  domainProgressMap: Record<string, DomainProgress[]>;
  isLoading: boolean;

  getCurrentSession: () => ChatSession | null;
  createSession: (name?: string) => string;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  updateLastAssistantMessage: (content: string) => void;
  setLoading: (loading: boolean) => void;
  setCertId: (certId: string) => void;
  setModelId: (modelId: string) => void;
  setProvider: (provider: string) => void;
  getDomainProgress: () => DomainProgress[];
  updateDomainProgress: (
    domainId: string,
    confidence: DomainProgress["confidence"],
  ) => void;
  initDomainProgress: (domainIds: string[]) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      currentCertId: "common",
      currentModelId: "",
      currentProvider: "openrouter",
      domainProgressMap: {},
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

      setCertId: (certId) => set({ currentCertId: certId }),

      setModelId: (modelId) => set({ currentModelId: modelId }),

      setProvider: (provider) => set({ currentProvider: provider }),

      getDomainProgress: () => {
        const { currentCertId, domainProgressMap } = get();
        return domainProgressMap[currentCertId] ?? [];
      },

      initDomainProgress: (domainIds) =>
        set((state) => {
          const certId = state.currentCertId;
          const existing = state.domainProgressMap[certId];
          if (existing && existing.length > 0) return state;
          return {
            domainProgressMap: {
              ...state.domainProgressMap,
              [certId]: domainIds.map((id) => ({
                domainId: id,
                confidence: "not_started" as const,
                topicsStudied: [],
              })),
            },
          };
        }),

      updateDomainProgress: (domainId, confidence) =>
        set((state) => {
          const certId = state.currentCertId;
          const current = state.domainProgressMap[certId] ?? [];
          return {
            domainProgressMap: {
              ...state.domainProgressMap,
              [certId]: current.map((d) =>
                d.domainId === domainId ? { ...d, confidence } : d,
              ),
            },
          };
        }),
    }),
    { name: "cloud-study-chat" },
  ),
);
