# Cloud Study Assistant - AWS DEA-C01

A local-first study companion for the AWS Data Engineer Associate (DEA-C01) certification, powered by Google Gemini AI.

## Features

- **AI Chat** — Ask questions about AWS data engineering with streaming responses. Supports image uploads (architecture diagrams, screenshots). Pre-configured quick prompts for common study patterns.
- **Note Generation** — Automatically summarize chat conversations into structured Markdown study notes. Download as `.md` files.
- **Knowledge Visualization** — Upload notes and view them as:
  - Interactive Mind Maps (powered by markmap)
  - Flashcards with flip animation
  - Structured summary tables organized by exam domain
- **Quiz Mode** — Generate practice questions that match the DEA-C01 exam format. Instant scoring with detailed explanations.
- **Domain Progress Tracker** — Track your confidence across the 4 exam domains (Data Ingestion 34%, Data Store 26%, Operations 22%, Security 18%).

## Prerequisites

- Python 3.10+
- Node.js 18+
- A free Google Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

## Setup

### Lấy API key Gemini (miễn phí)

1. Truy cập [Google AI Studio](https://aistudio.google.com/apikey)
2. Đăng nhập bằng tài khoản Google
3. Nhấn **Create API Key**
4. Chọn project (hoặc tạo project mới nếu chưa có)
5. Copy API key vừa tạo — đảm bảo **Quota Tier** hiển thị là **Free tier**

> Không cần thẻ tín dụng. Free tier: ~10 requests/phút, 250–500 requests/ngày — đủ cho ôn thi cá nhân.

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Tạo file `.env` trong thư mục `backend/`:

```
GEMINI_API_KEY=paste_key_vào_đây
GEMINI_MODEL=gemini-2.5-flash
```

Start the server:

```bash
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**. The Vite dev server proxies API requests to the backend at port 8000.

### Chạy cả FE + BE cùng lúc

**Cách 1 — Double-click (Windows):** Chạy file `run.bat` ở thư mục gốc. Hai cửa sổ CMD sẽ mở (Backend + Frontend), trình duyệt tự mở khi Frontend sẵn sàng.

**Cách 2 — Terminal:**
```bash
npm run dev
```
Chạy từ thư mục gốc project. Backend và Frontend chạy song song trong cùng terminal.

## Project Structure

```
backend/
  main.py              — FastAPI application entry point
  config.py            — Environment configuration
  routers/
    chat.py            — Chat endpoints (streaming SSE)
    notes.py           — Note generation and parsing
    quiz.py            — Quiz question generation
  services/
    llm_service.py     — Gemini API wrapper
    note_service.py    — Note/flashcard/summary generation
  prompts/
    system_prompts.py  — System prompts and exam domain data

frontend/
  src/
    pages/             — ChatPage, NotesPage, VisualizationPage, QuizPage
    components/        — Reusable UI components
    stores/            — Zustand state management
    services/          — API client
```

## Tech Stack

| Layer     | Technology                                  |
| --------- | ------------------------------------------- |
| LLM       | Google Gemini 2.5 Flash (free tier)         |
| Backend   | Python, FastAPI, google-generativeai        |
| Frontend  | React 18, TypeScript, Vite                  |
| Styling   | TailwindCSS v4                              |
| State     | Zustand (persisted to localStorage)         |
| Mind Maps | markmap-lib + markmap-view                  |
| Markdown  | react-markdown + remark-gfm                |
| Icons     | Lucide React                                |
