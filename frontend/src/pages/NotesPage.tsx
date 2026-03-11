import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FileText,
  Download,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useChatStore } from "../stores/chatStore";
import { generateNotes } from "../services/api";

export default function NotesPage() {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { sessions, getCurrentSession, currentSessionId, switchSession } =
    useChatStore();

  const session = getCurrentSession();

  const handleGenerate = async () => {
    if (!session || session.messages.length < 2) return;
    setLoading(true);
    setError("");
    try {
      const result = await generateNotes(session.messages);
      setNotes(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate notes",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!notes) return;
    const blob = new Blob([notes], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `study-notes-${session?.name || "untitled"}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-3 bg-white border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Study Notes
          </h2>
          <p className="text-xs text-text-secondary">
            Tạo note từ cuộc hội thoại hoặc tải note đã có
          </p>
        </div>
        <div className="flex items-center gap-2">
          {notes && (
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                         bg-surface-alt border border-border hover:bg-surface-hover transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download .md
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Session Selector Panel */}
        <div className="w-64 border-r border-border bg-white p-4 overflow-y-auto">
          <h3 className="text-xs font-semibold text-text-secondary uppercase mb-3">
            Chọn session để tạo notes
          </h3>
          {sessions.length === 0 ? (
            <p className="text-xs text-text-secondary">
              Chưa có session nào. Hãy chat trước!
            </p>
          ) : (
            <div className="space-y-1">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => switchSession(s.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                    s.id === currentSessionId
                      ? "bg-primary-light text-primary font-medium border border-primary/20"
                      : "hover:bg-surface-hover"
                  }`}
                >
                  <div className="font-medium truncate">{s.name}</div>
                  <div className="text-text-secondary mt-0.5">
                    {s.messages.length} messages
                  </div>
                </button>
              ))}
            </div>
          )}

          {session && session.messages.length >= 2 && (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5
                         rounded-lg bg-primary text-white text-xs font-medium
                         hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {loading ? "Generating..." : "Generate Notes"}
            </button>
          )}
        </div>

        {/* Notes Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {notes ? (
            <div className="max-w-3xl mx-auto bg-white rounded-xl border border-border p-8 shadow-sm">
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {notes}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <FileText className="w-12 h-12 text-border mx-auto mb-3" />
                <h3 className="font-medium text-text-secondary mb-1">
                  No notes yet
                </h3>
                <p className="text-sm text-text-secondary">
                  Chọn một session và nhấn "Generate Notes" để tạo ghi chú
                  <br />
                  hoặc tải file .md lên trang Visualize
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
