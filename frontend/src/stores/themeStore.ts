import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeStore {
  isDark: boolean;
  toggle: () => void;
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      isDark: false,
      toggle: () =>
        set((state) => {
          const next = !state.isDark;
          applyTheme(next);
          return { isDark: next };
        }),
    }),
    {
      name: "cloud-study-theme",
      onRehydrateStorage: () => (state) => {
        if (state?.isDark) applyTheme(true);
      },
    },
  ),
);
