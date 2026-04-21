import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MessageSquare,
  StickyNote,
  BarChart3,
  BrainCircuit,
  Plus,
  Trash2,
  GraduationCap,
  ChevronDown,
  Cpu,
  Eye,
  Coins,
  RotateCcw,
  Sun,
  Moon,
  Edit2,
  Server,
} from "lucide-react";
import { useChatStore } from "../../stores/chatStore";
import { useUsageStore } from "../../stores/usageStore";
import { useThemeStore } from "../../stores/themeStore";
import { getProfiles, getDomains, getModels, getProviders } from "../../services/api";
import type { CertProfile, Domain, DomainProgress, AIModel, ProviderInfo } from "../../types";

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

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    sessions,
    currentSessionId,
    currentCertId,
    currentModelId,
    currentProvider,
    setCertId,
    setModelId,
    setProvider,
    createSession,
    switchSession,
    deleteSession,
    getDomainProgress,
    updateDomainProgress,
    initDomainProgress,
  } = useChatStore();

  const { getCurrentRecord, resetCurrentMonth, setModels: setUsageModels, syncFromBackend } = useUsageStore();
  const { isDark, toggle: toggleTheme } = useThemeStore();

  const [profiles, setProfiles] = useState<CertProfile[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [defaultProviderId, setDefaultProviderId] = useState<string>("openrouter");
  const [defaultModelId, setDefaultModelId] = useState("");
  const [certDropdownOpen, setCertDropdownOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionName, setEditingSessionName] = useState("");
  const certDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const providerDropdownRef = useRef<HTMLDivElement>(null);

  const domainProgress = getDomainProgress();
  const usageRecord = getCurrentRecord();
  const currentProfile = profiles.find((p) => p.id === currentCertId);
  const activeModelId = currentModelId || defaultModelId;
  const currentModel = models.find((m) => m.id === activeModelId);

  useEffect(() => {
    syncFromBackend();
    getProfiles().then(setProfiles).catch(() => {});
    getModels(currentProvider)
      .then((data) => {
        setModels(data.models);
        setDefaultModelId(data.default);
        setUsageModels(data.models);
      })
      .catch(() => {});
    getProviders()
      .then((data) => {
        setProviders(data.providers);
        setDefaultProviderId(data.default);
      })
      .catch(() => {});
  }, [setUsageModels, syncFromBackend, currentProvider]);

  useEffect(() => {
    if (currentCertId === "common") {
      setDomains([]);
      return;
    }
    getDomains(currentCertId)
      .then((d) => {
        setDomains(d);
        initDomainProgress(d.map((dom) => dom.id));
      })
      .catch(() => {});
  }, [currentCertId, initDomainProgress]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (
        certDropdownRef.current &&
        !certDropdownRef.current.contains(target)
      ) {
        setCertDropdownOpen(false);
      }
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(target)
      ) {
        setModelDropdownOpen(false);
      }
      if (
        providerDropdownRef.current &&
        !providerDropdownRef.current.contains(target)
      ) {
        setProviderDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <aside className="w-64 bg-sidebar text-text-sidebar flex flex-col h-full shrink-0">
      {/* Logo + Selectors */}
      <div className="p-4 border-b border-white/10 space-y-2">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-aws-orange" />
          <h1 className="font-bold text-white text-sm leading-tight flex-1">
            Cloud Study
          </h1>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-text-sidebar opacity-70 hover:opacity-100"
            title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Cert Dropdown */}
        <div className="relative" ref={certDropdownRef}>
          <button
            onClick={() => {
              setCertDropdownOpen(!certDropdownOpen);
              setModelDropdownOpen(false);
              setProviderDropdownOpen(false);
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg
                       bg-white/5 hover:bg-white/10 text-xs transition-colors"
          >
            <span className="truncate">
              {currentProfile?.name ?? "Loading..."}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 shrink-0 transition-transform ${certDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>
          {certDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-sidebar-hover rounded-lg
                           border border-white/10 shadow-xl z-50 overflow-hidden">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setCertId(p.id);
                    setCertDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                    p.id === currentCertId
                      ? "bg-sidebar-active text-white"
                      : "hover:bg-white/5"
                  }`}
                >
                  <div className="font-medium">{p.name}</div>
                  <div className="opacity-50 text-[10px]">{p.fullName}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Provider Dropdown */}
        <div className="relative" ref={providerDropdownRef}>
          <button
            onClick={() => {
              setProviderDropdownOpen(!providerDropdownOpen);
              setCertDropdownOpen(false);
              setModelDropdownOpen(false);
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg
                       bg-white/5 hover:bg-white/10 text-xs transition-colors"
          >
            <span className="flex items-center gap-1.5 truncate">
              <Server className="w-3 h-3 opacity-50" />
              {providers.find(p => p.id === currentProvider)?.name ?? "Loading..."}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 shrink-0 transition-transform ${providerDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>
          {providerDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-sidebar-hover rounded-lg
                           border border-white/10 shadow-xl z-50 overflow-hidden">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => {
                    setProvider(provider.id);
                    setProviderDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                    provider.id === currentProvider
                      ? "bg-sidebar-active text-white"
                      : "hover:bg-white/5"
                }`}
                >
                  <div className="font-medium">{provider.name}</div>
                  <div className="opacity-50 text-[10px]">{provider.website}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Model Dropdown */}
        <div className="relative" ref={modelDropdownRef}>
          <button
            onClick={() => {
              setModelDropdownOpen(!modelDropdownOpen);
              setCertDropdownOpen(false);
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg
                       bg-white/5 hover:bg-white/10 text-xs transition-colors"
          >
            <span className="flex items-center gap-1.5 truncate">
              <Cpu className="w-3 h-3 opacity-50" />
              {currentModel?.name ?? "Loading..."}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 shrink-0 transition-transform ${modelDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>
          {modelDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-sidebar-hover rounded-lg
                           border border-white/10 shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto">
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setModelId(m.id);
                    setModelDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                    m.id === activeModelId
                      ? "bg-sidebar-active text-white"
                      : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{m.name}</span>
                    {m.vision && <Eye className="w-3 h-3 opacity-50" />}
                  </div>
                  <div className="opacity-50 text-[10px]">
                    {m.provider} · {m.inputCost} in / {m.outputCost} out
                  </div>
                  <div className="opacity-40 text-[10px] mt-0.5 leading-snug">
                    {m.description}
                  </div>
                </button>
              ))}
            </div>
          )}
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
              {editingSessionId === session.id ? (
                <input
                  className="flex-1 bg-transparent border border-white/20 rounded px-1 py-0.5 text-xs outline-none focus:border-aws-orange"
                  value={editingSessionName}
                  onChange={(e) => setEditingSessionName(e.target.value)}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  onBlur={() => {
                    const trimmed = editingSessionName.trim();
                    if (trimmed && trimmed !== session.name) {
                      useChatStore.getState().renameSession(session.id, trimmed);
                    }
                    setEditingSessionId(null);
                    setEditingSessionName("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setEditingSessionId(null);
                      setEditingSessionName("");
                    }
                  }}
                />
              ) : (
                <span
                  className="truncate flex-1"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingSessionId(session.id);
                    setEditingSessionName(session.name);
                  }}
                >
                  {session.name}
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingSessionId(session.id);
                  setEditingSessionName(session.name);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-sidebar-hover transition-all"
                title="Rename"
              >
                <Edit2 className="w-3 h-3" />
              </button>
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
      {currentCertId !== "common" && domains.length > 0 && (
        <div className="border-t border-white/10 p-3">
          <span className="text-[10px] font-medium uppercase opacity-50">
            Exam Domains
          </span>
          <div className="mt-2 space-y-2">
            {domains.map((domain) => {
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
      )}

      {/* Usage / Cost Counter */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-medium uppercase opacity-50 flex items-center gap-1">
            <Coins className="w-3 h-3" />
            Usage ({usageRecord.month})
          </span>
          <button
            onClick={resetCurrentMonth}
            className="p-0.5 rounded hover:bg-white/10 opacity-40 hover:opacity-100 transition-all"
            title="Reset monthly counter"
          >
            <RotateCcw className="w-2.5 h-2.5" />
          </button>
        </div>
        <div className="bg-white/5 rounded-lg px-2.5 py-2 space-y-1">
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-white leading-none">
              ${usageRecord.totalCostUsd.toFixed(4)}
            </span>
            <span className="text-[9px] opacity-40">/ $5.00</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-aws-orange transition-all duration-300"
              style={{
                width: `${Math.min((usageRecord.totalCostUsd / 5) * 100, 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] opacity-40">
            <span>{usageRecord.requests} reqs</span>
            <span>
              {((usageRecord.totalInputTokens + usageRecord.totalOutputTokens) / 1000).toFixed(1)}K
              tokens
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
