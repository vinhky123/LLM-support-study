import { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import type { Flashcard } from "../../types";

const DOMAIN_COLORS: Record<string, string> = {
  ingestion: "bg-blue-100 text-blue-700",
  store: "bg-green-100 text-green-700",
  operations: "bg-purple-100 text-purple-700",
  security: "bg-orange-100 text-orange-700",
};

interface Props {
  flashcards: Flashcard[];
}

export default function FlashcardsView({ flashcards }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (flashcards.length === 0) return null;

  const card = flashcards[currentIndex];
  const domainColor = DOMAIN_COLORS[card.domain] ?? "bg-gray-100 text-gray-700";

  const goPrev = () => {
    setFlipped(false);
    setCurrentIndex((i) => (i > 0 ? i - 1 : flashcards.length - 1));
  };

  const goNext = () => {
    setFlipped(false);
    setCurrentIndex((i) => (i < flashcards.length - 1 ? i + 1 : 0));
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-sm text-text-secondary">
        Card {currentIndex + 1} / {flashcards.length}
      </div>

      {/* Card */}
      <div
        onClick={() => setFlipped(!flipped)}
        className="w-full max-w-xl cursor-pointer"
        style={{ perspective: "1000px" }}
      >
        <div
          className="relative transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0)",
          }}
        >
          {/* Front */}
          <div
            className="bg-white rounded-2xl border border-border shadow-lg p-8 min-h-[250px]
                       flex flex-col items-center justify-center text-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full mb-4 ${domainColor}`}>
              {card.domain}
            </span>
            <p className="text-lg font-medium text-text leading-relaxed">
              {card.question}
            </p>
            <p className="text-xs text-text-secondary mt-4">
              Click to reveal answer
            </p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-primary-light rounded-2xl border border-primary/20
                       shadow-lg p-8 min-h-[250px]
                       flex flex-col items-center justify-center text-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p className="text-base text-text leading-relaxed">
              {card.answer}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={goPrev}
          className="p-2 rounded-lg border border-border hover:bg-surface-hover transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            setFlipped(false);
            setCurrentIndex(0);
          }}
          className="p-2 rounded-lg border border-border hover:bg-surface-hover transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={goNext}
          className="p-2 rounded-lg border border-border hover:bg-surface-hover transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
