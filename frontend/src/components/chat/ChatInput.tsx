import { useState, useRef, useCallback } from "react";
import { Send, ImagePlus, X, Loader2 } from "lucide-react";
import type { ImageData } from "../../types";

interface Props {
  onSend: (message: string, image?: ImageData) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<ImageData | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImageSelect = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setImage({
          data: base64,
          mimeType: file.type,
          preview: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    },
    [],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) handleImageSelect(file);
          break;
        }
      }
    },
    [handleImageSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleImageSelect(file);
    },
    [handleImageSelect],
  );

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed && !image) return;
    onSend(trimmed, image ?? undefined);
    setText("");
    setImage(null);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className="border-t border-border bg-white p-4"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {image && (
        <div className="mb-2 inline-flex items-start gap-1">
          <img
            src={image.preview}
            alt="Preview"
            className="h-16 rounded-lg border border-border"
          />
          <button
            onClick={() => setImage(null)}
            className="p-0.5 rounded-full bg-gray-200 hover:bg-gray-300 -ml-3 -mt-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="p-2.5 rounded-xl text-text-secondary hover:bg-surface-hover transition-colors"
          title="Attach image"
        >
          <ImagePlus className="w-5 h-5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageSelect(file);
            e.target.value = "";
          }}
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Hỏi về AWS hoặc chứng chỉ bạn đang học... (Shift+Enter để xuống dòng)"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-border bg-surface-alt px-4 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                     max-h-32 overflow-y-auto"
          style={{ minHeight: "42px" }}
          disabled={disabled}
        />

        <button
          onClick={handleSubmit}
          disabled={disabled || (!text.trim() && !image)}
          className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {disabled ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
