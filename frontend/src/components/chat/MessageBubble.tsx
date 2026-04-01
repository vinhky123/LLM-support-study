import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User, Bot } from "lucide-react";
import type { ChatMessage } from "../../types";

interface Props {
  message: ChatMessage;
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
            : "bg-white border border-border rounded-tl-sm shadow-sm"
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
          <div className="markdown-body text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
