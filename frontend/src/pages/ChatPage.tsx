import { useState, useEffect, useCallback } from "react";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";
import QuickPrompts from "../components/chat/QuickPrompts";
import { useChatStore } from "../stores/chatStore";
import { sendChatMessage, getQuickPrompts } from "../services/api";
import type { ImageData, QuickPrompt } from "../types";

export default function ChatPage() {
  const [quickPrompts, setQuickPrompts] = useState<QuickPrompt[]>([]);
  const {
    getCurrentSession,
    currentSessionId,
    createSession,
    addMessage,
    updateLastAssistantMessage,
    isLoading,
    setLoading,
  } = useChatStore();

  const session = getCurrentSession();

  useEffect(() => {
    getQuickPrompts()
      .then(setQuickPrompts)
      .catch(() => {});
  }, []);

  const handleSend = useCallback(
    async (message: string, image?: ImageData) => {
      let sid = currentSessionId;
      if (!sid) {
        sid = createSession(message.slice(0, 40) || "New Chat");
      }

      addMessage({ role: "user", content: message, image });
      addMessage({ role: "assistant", content: "" });
      setLoading(true);

      try {
        const currentMessages =
          useChatStore.getState().getCurrentSession()?.messages ?? [];
        const history = currentMessages.slice(0, -1);

        await sendChatMessage(history, message, image, (partial) => {
          updateLastAssistantMessage(partial);
        });
      } catch (err) {
        updateLastAssistantMessage(
          `**Error:** ${err instanceof Error ? err.message : "Something went wrong. Please check your API key and try again."}`,
        );
      } finally {
        setLoading(false);
      }
    },
    [
      currentSessionId,
      createSession,
      addMessage,
      updateLastAssistantMessage,
      setLoading,
    ],
  );

  const handleQuickPrompt = useCallback(
    (template: string) => {
      const filled = template
        .replace("{topic}", "[...]")
        .replace("{topicA}", "[A]")
        .replace("{topicB}", "[B]")
        .replace("{service}", "[...]");
      handleSend(filled);
    },
    [handleSend],
  );

  return (
    <div className="flex flex-col h-full bg-surface-alt">
      {/* Header */}
      <div className="px-6 py-3 bg-white border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm">
            {session?.name ?? "New Chat"}
          </h2>
          <p className="text-xs text-text-secondary">
            AWS Data Engineer Associate (DEA-C01)
          </p>
        </div>
      </div>

      <ChatWindow messages={session?.messages ?? []} />

      {/* Quick Prompts */}
      {(!session || session.messages.length === 0) && quickPrompts.length > 0 && (
        <div className="px-4 pb-2">
          <QuickPrompts prompts={quickPrompts} onSelect={handleQuickPrompt} />
        </div>
      )}

      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
