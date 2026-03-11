import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import type { ChatMessage } from "../../types";
import { GraduationCap } from "lucide-react";

interface Props {
  messages: ChatMessage[];
  certName?: string;
}

export default function ChatWindow({ messages, certName }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, messages[messages.length - 1]?.content]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-aws-orange/10 flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-aws-orange" />
          </div>
          <h2 className="text-xl font-bold text-text mb-2">
            {certName ?? "AWS Cloud"} Study Assistant
          </h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            Hỏi bất kỳ câu hỏi nào về AWS. Sử dụng các
            Quick Prompts bên dưới hoặc gõ câu hỏi trực tiếp. Bạn cũng có thể
            gửi ảnh (kiến trúc, diagram, screenshot) để phân tích.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
