import { useState, useRef, useCallback, useEffect } from "react";
import { Send, ImagePlus, X, Loader2, Maximize2 } from "lucide-react";
import type { ImageData } from "../../types";

const MIN_HEIGHT = 42;
const MAX_INLINE_HEIGHT = 160;

interface Props {
  onSend: (message: string, image?: ImageData) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<ImageData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [atMax, setAtMax] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const scrollH = el.scrollHeight;
    if (scrollH >= MAX_INLINE_HEIGHT) {
      el.style.height = `${MAX_INLINE_HEIGHT}px`;
      setAtMax(true);
    } else {
      el.style.height = `${Math.max(scrollH, MIN_HEIGHT)}px`;
      setAtMax(false);
    }
  }, []);

  useEffect(() => {
    autoResize();
  }, [text, autoResize]);

  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setImage({ data: base64, mimeType: file.type, preview: reader.result as string });
    };
    reader.readAsDataURL(file);
  }, []);

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
    if (disabled) return;
    const trimmed = text.trim();
    if (!trimmed && !image) return;
    onSend(trimmed, image ?? undefined);
    setText("");
    setImage(null);
    setIsExpanded(false);
    setAtMax(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" && !e.shiftKey && !isExpanded) {
      e.preventDefault();
      handleSubmit();
    }
  };

  /* Expanded overlay mode */
  if (isExpanded) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6"
        onMouseDown={() => setIsExpanded(false)}
      >
        <div
          className="w-full max-w-2xl bg-surface rounded-2xl shadow-2xl border border-border flex flex-col"
          onMouseDown={(e) => e.stopPropagation()}
             style={{ height: "420px" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <span className="text-xs font-medium text-text-secondary">
              Expanded input — Enter xuống dòng · Shift+Enter không gửi
            </span>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-xs text-text-secondary hover:text-text px-2 py-1 rounded-lg hover:bg-surface-hover transition-colors"
            >
              Thu nhỏ ↙
            </button>
          </div>

          {/* Image preview */}
          {image && (
            <div className="px-4 pt-3 flex items-start gap-1">
              <img src={image.preview} alt="Preview" className="h-16 rounded-lg border border-border" />
              <button
                onClick={() => setImage(null)}
                className="p-0.5 rounded-full bg-surface-hover hover:bg-border -ml-3 -mt-1 text-text-secondary"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Textarea — fills remaining height */}
          <textarea
            ref={textareaRef}
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={handlePaste}
            placeholder="Viết câu hỏi dài... (Enter để xuống dòng)"
            className="flex-1 w-full px-4 py-3 text-sm bg-surface focus:outline-none"
            style={{ resize: "none" }}
          />

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => fileRef.current?.click()}
                className="p-2 rounded-lg text-text-secondary hover:bg-surface-hover transition-colors"
                title="Attach image"
              >
                <ImagePlus className="w-4 h-4" />
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
            </div>
            <button
              onClick={handleSubmit}
              disabled={disabled || (!text.trim() && !image)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-white text-sm font-medium
                         hover:bg-primary-hover disabled:opacity-40 transition-colors"
            >
              {disabled ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Gửi
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* Inline mode */
  return (
    <div
      className="border-t border-border bg-surface p-4"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {image && (
        <div className="mb-2 inline-flex items-start gap-1">
          <img src={image.preview} alt="Preview" className="h-16 rounded-lg border border-border" />
          <button
            onClick={() => setImage(null)}
            className="p-0.5 rounded-full bg-surface-hover hover:bg-border -ml-3 -mt-1 text-text-secondary"
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

        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Hỏi về AWS hoặc chứng chỉ bạn đang học... (Shift+Enter để xuống dòng)"
            rows={1}
            className="w-full resize-none rounded-xl border border-border bg-surface-alt px-4 py-2.5 pr-9 text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                       overflow-y-auto transition-all"
            style={{ minHeight: `${MIN_HEIGHT}px` }}
          />
          {atMax && (
            <button
              onClick={() => setIsExpanded(true)}
              className="absolute bottom-2 right-2 p-1 rounded-lg
                         text-text-secondary hover:text-primary hover:bg-primary-light transition-colors"
              title="Phóng to ô nhập"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

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
