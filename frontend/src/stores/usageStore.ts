import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TokenUsage, UsageRecord, AIModel } from "../types";

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface UsageStore {
  records: Record<string, UsageRecord>;
  models: AIModel[];

  setModels: (models: AIModel[]) => void;
  getCurrentRecord: () => UsageRecord;
  addUsage: (usage: TokenUsage, modelId: string) => void;
  resetCurrentMonth: () => void;
}

export const useUsageStore = create<UsageStore>()(
  persist(
    (set, get) => ({
      records: {},
      models: [],

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

          return {
            records: {
              ...state.records,
              [month]: {
                month,
                totalInputTokens: existing.totalInputTokens + usage.promptTokens,
                totalOutputTokens: existing.totalOutputTokens + usage.completionTokens,
                totalCostUsd: existing.totalCostUsd + cost,
                requests: existing.requests + 1,
              },
            },
          };
        }),

      resetCurrentMonth: () =>
        set((state) => {
          const month = getCurrentMonth();
          const { [month]: _, ...rest } = state.records;
          return { records: rest };
        }),
    }),
    { name: "cloud-study-usage" },
  ),
);
