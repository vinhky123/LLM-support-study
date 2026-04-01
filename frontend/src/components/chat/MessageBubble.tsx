import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User, Bot, FileDown } from "lucide-react";
import type { ChatMessage } from "../../types";

interface Props {
  message: ChatMessage;
}

function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function assistantExportFilename(message: ChatMessage) {
  const date = new Date(message.timestamp).toISOString().slice(0, 10);
  const idPart = message.id.replace(/[^a-zA-Z0-9-_]/g, "").slice(0, 12);
  return `aws-chat-assistant-${date}-${idPart || "msg"}.md`;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "bg-primary text-white" : "bg-aws-orange text-white"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-primary text-white rounded-tr-sm"
            : "bg-surface border border-border rounded-tl-sm shadow-sm"
        }`}
      >
        {message.image?.preview && (
          <img
            src={message.image.preview}
            alt="Uploaded"
            className="max-w-full max-h-48 rounded-lg mb-2"
          />
        )}
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="flex justify-between items-start gap-2">
            <div className="markdown-body text-sm flex-1 min-w-0">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
            {message.content.trim() ? (
              <button
                type="button"
                className="shrink-0 p-1 rounded-md text-text-secondary hover:bg-surface-alt hover:text-text -mt-0.5 -mr-1"
                title="Tải nội dung Markdown"
                aria-label="Tải nội dung Markdown"
                onClick={() =>
                  downloadMarkdown(
                    assistantExportFilename(message),
                    message.content,
                  )
                }
              >
                <FileDown className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
