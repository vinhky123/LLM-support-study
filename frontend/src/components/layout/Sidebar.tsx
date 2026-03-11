import { useLocation, useNavigate } from "react-router-dom";
import {
  MessageSquare,
  StickyNote,
  BarChart3,
  BrainCircuit,
  Plus,
  Trash2,
  GraduationCap,
} from "lucide-react";
import { useChatStore } from "../../stores/chatStore";
import type { Domain, DomainProgress } from "../../types";

const NAV_ITEMS = [
  { path: "/", icon: MessageSquare, label: "Chat" },
  { path: "/notes", icon: StickyNote, label: "Notes" },
  { path: "/visualize", icon: BarChart3, label: "Visualize" },
  { path: "/quiz", icon: BrainCircuit, label: "Quiz" },
];

const CONFIDENCE_COLORS: Record<DomainProgress["confidence"], string> = {
  not_started: "bg-gray-600",
  learning: "bg-yellow-500",
  confident: "bg-green-500",
};

const CONFIDENCE_LABELS: Record<DomainProgress["confidence"], string> = {
  not_started: "Chưa học",
  learning: "Đang học",
  confident: "Nắm vững",
};

const DOMAINS: Domain[] = [
  { id: "ingestion", name: "Ingestion & Transform", weight: 34, topics: [] },
  { id: "store", name: "Data Store", weight: 26, topics: [] },
  { id: "operations", name: "Operations", weight: 22, topics: [] },
  { id: "security", name: "Security & Governance", weight: 18, topics: [] },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    sessions,
    currentSessionId,
    domainProgress,
    createSession,
    switchSession,
    deleteSession,
    updateDomainProgress,
  } = useChatStore();

  return (
    <aside className="w-64 bg-sidebar text-text-sidebar flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-aws-orange" />
          <div>
            <h1 className="font-bold text-white text-sm leading-tight">
              Cloud Study
            </h1>
            <span className="text-[10px] text-text-sidebar opacity-70">
              AWS DEA-C01
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-2 space-y-0.5">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-sidebar-active text-text-sidebar-active font-medium"
                  : "hover:bg-sidebar-hover"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Chat Sessions */}
      <div className="flex-1 overflow-hidden flex flex-col mt-2 border-t border-white/10">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-xs font-medium uppercase opacity-50">
            Sessions
          </span>
          <button
            onClick={() => {
              createSession();
              navigate("/");
            }}
            className="p-1 rounded hover:bg-sidebar-hover transition-colors"
            title="New chat"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                session.id === currentSessionId
                  ? "bg-sidebar-active text-white"
                  : "hover:bg-sidebar-hover"
              }`}
              onClick={() => {
                switchSession(session.id);
                navigate("/");
              }}
            >
              <MessageSquare className="w-3 h-3 shrink-0 opacity-50" />
              <span className="truncate flex-1">{session.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/30 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-xs opacity-40 text-center py-4">
              No sessions yet
            </p>
          )}
        </div>
      </div>

      {/* Domain Progress */}
      <div className="border-t border-white/10 p-3">
        <span className="text-[10px] font-medium uppercase opacity-50">
          Exam Domains
        </span>
        <div className="mt-2 space-y-2">
          {DOMAINS.map((domain) => {
            const progress = domainProgress.find(
              (d) => d.domainId === domain.id,
            );
            const conf = progress?.confidence ?? "not_started";
            return (
              <button
                key={domain.id}
                onClick={() => {
                  const next =
                    conf === "not_started"
                      ? "learning"
                      : conf === "learning"
                        ? "confident"
                        : "not_started";
                  updateDomainProgress(domain.id, next);
                }}
                className="w-full text-left group"
                title={`Click to cycle: ${CONFIDENCE_LABELS[conf]}`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="truncate">{domain.name}</span>
                  <span className="text-[10px] opacity-50 ml-1">
                    {domain.weight}%
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${CONFIDENCE_COLORS[conf]}`}
                      style={{
                        width:
                          conf === "not_started"
                            ? "0%"
                            : conf === "learning"
                              ? "50%"
                              : "100%",
                      }}
                    />
                  </div>
                  <span className="text-[9px] opacity-40 w-14 text-right">
                    {CONFIDENCE_LABELS[conf]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
