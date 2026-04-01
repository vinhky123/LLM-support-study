import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import ChatPage from "./pages/ChatPage";
import NotesPage from "./pages/NotesPage";
import VisualizationPage from "./pages/VisualizationPage";
import QuizPage from "./pages/QuizPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<ChatPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/visualize" element={<VisualizationPage />} />
          <Route path="/quiz" element={<QuizPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
