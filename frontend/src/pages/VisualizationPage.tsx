import { useState, useCallback } from "react";
import {
  Upload,
  Map,
  CreditCard,
  Table2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import MindMapView from "../components/visualization/MindMap";
import FlashcardsView from "../components/visualization/Flashcards";
import SummaryTableView from "../components/visualization/SummaryTable";
import { generateFlashcards, generateSummary } from "../services/api";
import { useChatStore } from "../stores/chatStore";
import type { Flashcard, SummaryDomain } from "../types";

type ViewMode = "mindmap" | "flashcards" | "summary";

const VIEW_TABS: { id: ViewMode; label: string; icon: React.ElementType }[] = [
  { id: "mindmap", label: "Mind Map", icon: Map },
  { id: "flashcards", label: "Flashcards", icon: CreditCard },
  { id: "summary", label: "Summary", icon: Table2 },
];

export default function VisualizationPage() {
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("mindmap");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [summary, setSummary] = useState<SummaryDomain[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { currentCertId, currentModelId } = useChatStore();

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setContent(text);
      setFlashcards([]);
      setSummary([]);
      setError("");
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setContent(text);
      setFlashcards([]);
      setSummary([]);
      setError("");
    };
    reader.readAsText(file);
  }, []);

  const handleViewChange = async (mode: ViewMode) => {
    setViewMode(mode);
    setError("");

    if (mode === "flashcards" && flashcards.length === 0 && content) {
      setLoading(true);
      try {
        const result = await generateFlashcards(content, currentCertId, currentModelId);
        setFlashcards(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate flashcards");
      } finally {
        setLoading(false);
      }
    }

    if (mode === "summary" && summary.length === 0 && content) {
      setLoading(true);
      try {
        const result = await generateSummary(content, currentCertId, currentModelId);
        setSummary(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate summary");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 bg-surface border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm">Knowledge Visualization</h2>
          <p className="text-xs text-text-secondary">
            {fileName || "Upload file .md để bắt đầu"}
          </p>
        </div>
        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                          bg-primary text-white hover:bg-primary-hover cursor-pointer transition-colors">
          <Upload className="w-3.5 h-3.5" />
          Upload .md
          <input
            type="file"
            accept=".md,.markdown,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
      </div>

      {content && (
        <div className="px-6 pt-3 bg-surface border-b border-border">
          <div className="flex gap-1">
            {VIEW_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleViewChange(id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-xs font-medium
                           transition-colors border-b-2 ${
                             viewMode === id
                               ? "border-primary text-primary bg-primary-light/50"
                               : "border-transparent text-text-secondary hover:text-text hover:bg-surface-hover"
                           }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {!content ? (
          <div
            className="flex items-center justify-center h-full"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div
              className="border-2 border-dashed border-border rounded-2xl p-12 text-center
                         hover:border-primary/40 transition-colors cursor-pointer max-w-md"
              onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
            >
              <Upload className="w-10 h-10 text-border mx-auto mb-3" />
              <h3 className="font-medium text-text mb-1">Upload study notes</h3>
              <p className="text-sm text-text-secondary">
                Kéo thả file .md hoặc click để chọn file.
                <br />
                File notes được tạo từ trang Notes.
              </p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-text-secondary">AI đang phân tích notes...</p>
            </div>
          </div>
        ) : (
          <div
            className={
              viewMode === "mindmap"
                ? "h-[calc(100vh-180px)] min-h-[500px]"
                : ""
            }
          >
            {viewMode === "mindmap" && <MindMapView content={content} />}
            {viewMode === "flashcards" && <FlashcardsView flashcards={flashcards} />}
            {viewMode === "summary" && <SummaryTableView summary={summary} />}
          </div>
        )}
      </div>
    </div>
  );
}
