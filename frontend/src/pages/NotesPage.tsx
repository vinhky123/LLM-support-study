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
  const {
    sessions,
    getCurrentSession,
    currentSessionId,
    currentCertId,
    currentModelId,
    switchSession,
  } = useChatStore();

  const session = getCurrentSession();

  const handleGenerate = async () => {
    if (!session || session.messages.length < 2) return;
    setLoading(true);
    setError("");
    try {
      const result = await generateNotes(session.messages, currentCertId, currentModelId);
      setNotes(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate notes");
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
    a.download = `notes-${session?.name || "untitled"}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const noteCards = splitIntoCards(notes);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-3 bg-surface border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Study Notes
          </h2>
          <p className="text-xs text-text-secondary">
            Flash notes — tóm tắt cô đọng từ hội thoại
          </p>
        </div>
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

      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar: session selector + generate button */}
        <div className="w-56 border-r border-border bg-surface-alt p-3 overflow-y-auto flex flex-col gap-3">
          <p className="text-[10px] font-semibold text-text-secondary uppercase">
            Session
          </p>

          {sessions.length === 0 ? (
            <p className="text-xs text-text-secondary">Chưa có session nào.</p>
          ) : (
            <div className="space-y-1 flex-1">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => switchSession(s.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors ${
                    s.id === currentSessionId
                      ? "bg-primary-light text-primary font-medium border border-primary/20"
                      : "hover:bg-surface-hover"
                  }`}
                >
                  <div className="font-medium truncate">{s.name}</div>
                  <div className="text-[10px] text-text-secondary mt-0.5">
                    {s.messages.length} msgs
                  </div>
                </button>
              ))}
            </div>
          )}

          {session && session.messages.length >= 2 && (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2
                         rounded-lg bg-primary text-white text-xs font-medium
                         hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {loading ? "Generating..." : "Generate"}
            </button>
          )}
        </div>

        {/* Notes content */}
        <div className="flex-1 overflow-y-auto p-5 bg-surface-alt">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {!notes ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <FileText className="w-10 h-10 text-border mx-auto mb-3" />
                <p className="text-sm font-medium text-text-secondary mb-1">
                  No notes yet
                </p>
                <p className="text-xs text-text-secondary">
                  Chọn session bên trái và nhấn Generate
                </p>
              </div>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-0">
              {noteCards.map((card, i) => (
                <NoteCard key={i} content={card} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Split a markdown string into per-## sections */
function splitIntoCards(markdown: string): string[] {
  if (!markdown.trim()) return [];
  const sections = markdown.split(/(?=^## )/m).filter((s) => s.trim());
  if (sections.length <= 1) return [markdown];
  return sections;
}

function NoteCard({ content }: { content: string }) {
  return (
    <div className="break-inside-avoid mb-4 bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="note-card-body px-4 py-3">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ children }) => (
              <h2 className="text-xs font-bold text-primary uppercase tracking-wide mb-2 pb-1.5 border-b border-border">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xs font-semibold text-text mt-2 mb-1">{children}</h3>
            ),
            ul: ({ children }) => (
              <ul className="space-y-1 mb-2">{children}</ul>
            ),
            li: ({ children }) => (
              <li className="flex items-start gap-1.5 text-[11px] leading-snug text-text">
                <span className="mt-1 w-1 h-1 rounded-full bg-primary/50 shrink-0" />
                <span>{children}</span>
              </li>
            ),
            blockquote: ({ children }) => (
              <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-aws-orange/8 border-l-2 border-aws-orange text-[10px] font-medium text-aws-orange leading-snug">
                {children}
              </div>
            ),
            p: ({ children }) => (
              <p className="text-[11px] leading-snug text-text mb-1">{children}</p>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-text">{children}</strong>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
