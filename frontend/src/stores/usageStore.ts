import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TokenUsage, UsageRecord, AIModel } from "../types";
import { getUsageRecords, saveUsageRecords } from "../services/api";

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface UsageStore {
  records: Record<string, UsageRecord>;
  models: AIModel[];
  _synced: boolean;

  setModels: (models: AIModel[]) => void;
  getCurrentRecord: () => UsageRecord;
  addUsage: (usage: TokenUsage, modelId: string) => void;
  resetCurrentMonth: () => void;
  syncFromBackend: () => Promise<void>;
}

export const useUsageStore = create<UsageStore>()(
  persist(
    (set, get) => ({
      records: {},
      models: [],
      _synced: false,

      setModels: (models) => set({ models }),

      getCurrentRecord: () => {
        const month = getCurrentMonth();
        return (
          get().records[month] ?? {
            month,
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalCostUsd: 0,
            requests: 0,
          }
        );
      },

      syncFromBackend: async () => {
        if (get()._synced) return;
        try {
          const backendRecords = await getUsageRecords();
          if (Object.keys(backendRecords).length > 0) {
            // Merge: backend wins on any month it has data for
            set((state) => ({
              records: { ...state.records, ...(backendRecords as Record<string, UsageRecord>) },
              _synced: true,
            }));
          } else {
            set({ _synced: true });
          }
        } catch {
          set({ _synced: true });
        }
      },

      addUsage: (usage, modelId) =>
        set((state) => {
          const month = getCurrentMonth();
          const existing = state.records[month] ?? {
            month,
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalCostUsd: 0,
            requests: 0,
          };

          const model = state.models.find((m) => m.id === modelId);
          const inputPricePerToken = (model?.inputPricePerM ?? 0.075) / 1_000_000;
          const outputPricePerToken = (model?.outputPricePerM ?? 0.30) / 1_000_000;

          const cost =
            usage.promptTokens * inputPricePerToken +
            usage.completionTokens * outputPricePerToken;

          const newRecords = {
            ...state.records,
            [month]: {
              month,
              totalInputTokens: existing.totalInputTokens + usage.promptTokens,
              totalOutputTokens: existing.totalOutputTokens + usage.completionTokens,
              totalCostUsd: existing.totalCostUsd + cost,
              requests: existing.requests + 1,
            },
          };

          // Fire-and-forget save to backend
          saveUsageRecords(newRecords);

          return { records: newRecords };
        }),

      resetCurrentMonth: () =>
        set((state) => {
          const month = getCurrentMonth();
          const { [month]: _, ...rest } = state.records;
          saveUsageRecords(rest);
          return { records: rest };
        }),
    }),
    { name: "cloud-study-usage" },
  ),
);
