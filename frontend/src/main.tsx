import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Apply stored theme before first render to prevent flash
try {
  const stored = localStorage.getItem("cloud-study-theme");
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed?.state?.isDark) {
      document.documentElement.classList.add("dark");
    }
  }
} catch {
  // ignore
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
