import { useState, useEffect } from "react";
import {
  BrainCircuit,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { generateQuizFromTopic, getQuizTopics } from "../services/api";
import { useChatStore } from "../stores/chatStore";
import type { QuizQuestion } from "../types";

const DOMAIN_COLORS: Record<string, string> = {
  ingestion: "bg-blue-100 text-blue-700 border-blue-200",
  store: "bg-green-100 text-green-700 border-green-200",
  operations: "bg-purple-100 text-purple-700 border-purple-200",
  security: "bg-orange-100 text-orange-700 border-orange-200",
  secure: "bg-blue-100 text-blue-700 border-blue-200",
  resilient: "bg-green-100 text-green-700 border-green-200",
  performing: "bg-purple-100 text-purple-700 border-purple-200",
  cost: "bg-orange-100 text-orange-700 border-orange-200",
  complexity: "bg-blue-100 text-blue-700 border-blue-200",
  new_solutions: "bg-green-100 text-green-700 border-green-200",
  migration: "bg-purple-100 text-purple-700 border-purple-200",
  cost_perf: "bg-orange-100 text-orange-700 border-orange-200",
};

export default function QuizPage() {
  const [topic, setTopic] = useState("");
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quizStarted, setQuizStarted] = useState(false);
  const { currentCertId, currentModelId } = useChatStore();

  useEffect(() => {
    getQuizTopics(currentCertId)
      .then(setSuggestedTopics)
      .catch(() => {});
  }, [currentCertId]);

  const handleGenerateQuiz = async (t?: string) => {
    const selectedTopic = t || topic;
    if (!selectedTopic.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await generateQuizFromTopic(selectedTopic, 5, currentCertId, currentModelId);
      setQuestions(result);
      setCurrentIdx(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setScore({ correct: 0, total: 0 });
      setQuizStarted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    setShowExplanation(true);
    const isCorrect = idx === questions[currentIdx].correctAnswer;
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleRestart = () => {
    setQuizStarted(false);
    setQuestions([]);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore({ correct: 0, total: 0 });
  };

  const isFinished =
    quizStarted &&
    questions.length > 0 &&
    currentIdx === questions.length - 1 &&
    selectedAnswer !== null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 bg-surface border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-primary" />
              Quiz Mode
            </h2>
            <p className="text-xs text-text-secondary">
              Luyện tập câu hỏi trắc nghiệm theo format exam
            </p>
          </div>
          {quizStarted && (
            <div className="flex items-center gap-3">
              <div className="text-xs font-medium bg-surface-alt px-3 py-1.5 rounded-lg">
                Score: {score.correct}/{score.total}
              </div>
              <button
                onClick={handleRestart}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs
                           border border-border hover:bg-surface-hover transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                New Quiz
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 max-w-2xl mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {!quizStarted ? (
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <BrainCircuit className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-1">Practice Quiz</h3>
              <p className="text-sm text-text-secondary">
                Nhập chủ đề hoặc chọn từ gợi ý bên dưới
              </p>
            </div>

            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerateQuiz()}
                placeholder="VD: AWS Glue ETL, Kinesis vs MSK..."
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button
                onClick={() => handleGenerateQuiz()}
                disabled={loading || !topic.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                           bg-primary text-white text-sm font-medium
                           hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generate
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {suggestedTopics.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTopic(t);
                    handleGenerateQuiz(t);
                  }}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-full bg-surface border border-border text-xs
                             hover:border-primary hover:text-primary hover:bg-primary-light
                             disabled:opacity-50 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : isFinished ? (
          <div className="max-w-md mx-auto text-center py-8">
            <div
              className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                score.correct / score.total >= 0.7 ? "bg-green-100" : "bg-orange-100"
              }`}
            >
              <span className="text-2xl font-bold">
                {Math.round((score.correct / score.total) * 100)}%
              </span>
            </div>
            <h3 className="text-lg font-bold mb-1">Quiz Complete!</h3>
            <p className="text-sm text-text-secondary mb-6">
              {score.correct}/{score.total} correct
              {score.correct / score.total >= 0.7 ? " — Great job!" : " — Keep studying!"}
            </p>
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                         bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Try Another Topic
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              {questions.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    idx < currentIdx ? "bg-primary" : idx === currentIdx ? "bg-primary/50" : "bg-border"
                  }`}
                />
              ))}
            </div>

            <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
              {questions[currentIdx]?.domain && (
                <span
                  className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mb-3 border ${
                    DOMAIN_COLORS[questions[currentIdx].domain] ?? "bg-gray-100 text-gray-700 border-gray-200"
                  }`}
                >
                  {questions[currentIdx].domain}
                </span>
              )}

              <h3 className="font-medium text-text mb-5 leading-relaxed">
                Q{currentIdx + 1}. {questions[currentIdx].question}
              </h3>

              <div className="space-y-2">
                {questions[currentIdx].options.map((option, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = idx === questions[currentIdx].correctAnswer;
                  const showResult = selectedAnswer !== null;

                  let style = "border-border hover:border-primary/40 hover:bg-primary-light/30";
                  if (showResult && isCorrect) style = "border-green-400 bg-green-50";
                  else if (showResult && isSelected && !isCorrect) style = "border-red-400 bg-red-50";
                  else if (isSelected) style = "border-primary bg-primary-light";

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectAnswer(idx)}
                      disabled={selectedAnswer !== null}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors flex items-center gap-3 ${style}`}
                    >
                      <span className="shrink-0">
                        {showResult && isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : showResult && isSelected ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <span className="w-5 h-5 rounded-full border-2 border-current inline-flex items-center justify-center text-xs opacity-40">
                            {String.fromCharCode(65 + idx)}
                          </span>
                        )}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>

              {showExplanation && (
                <div className="mt-5 p-4 rounded-xl bg-surface-alt border border-border">
                  <h4 className="text-xs font-semibold text-primary mb-1">Explanation</h4>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {questions[currentIdx].explanation}
                  </p>
                </div>
              )}

              {selectedAnswer !== null && !isFinished && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleNext}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl
                               bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
