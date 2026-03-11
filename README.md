# Cloud Study Assistant

A local-first study companion for AWS certification exams, powered by multiple AI models via [Vercel AI Gateway](https://vercel.com/docs/ai-gateway).

Supports **DEA-C01** (Data Engineer), **SAA-C03** (Solutions Architect Associate), **SAP-C02** (Solutions Architect Professional), and a general AWS mode.

## Features

- **AI Chat** — Ask questions with streaming responses. Supports image uploads (architecture diagrams, screenshots). Pre-configured quick prompts per certification.
- **Multi-Model** — Switch between Gemini 2.0 Flash Lite, Gemini 2.0 Flash, Gemini 2.5 Flash, Grok 4.1 Fast, Amazon Nova Micro. All within a $5 free tier budget.
- **Multi-Cert** — Switch between DEA-C01 / SAA-C03 / SAP-C02 / General mode. Prompts, domains, and quiz topics adapt automatically.
- **Note Generation** — Summarize chat conversations into structured Markdown study notes. Download as `.md` files.
- **Knowledge Visualization** — Upload notes and view them as:
  - Interactive Mind Maps (powered by markmap)
  - Flashcards with flip animation
  - Summary tables organized by exam domain
- **Quiz Mode** — Generate practice questions matching the exam format. Instant scoring with explanations.
- **Domain Progress Tracker** — Track confidence across exam domains.

## Prerequisites

- Python 3.10+
- Node.js 18+
- A Vercel AI Gateway API key (free $5 credit when you add a payment method)

## Setup

### Lấy Vercel AI Gateway API key

1. Truy cập [Vercel AI Gateway](https://vercel.com/~/ai-gateway)
2. Đăng nhập / tạo tài khoản Vercel
3. Vào **Settings** > tạo API Key
4. Thêm payment method để nhận $5 free credit (bị charge $0, chỉ verify thẻ)

> $5 đủ dùng cho hàng nghìn requests với các model rẻ như Gemini 2.0 Flash Lite ($0.075/M tokens) hoặc Nova Micro ($0.035/M tokens).

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Tạo file `.env` trong thư mục `backend/`:

```
AI_GATEWAY_API_KEY=paste_key_vào_đây
DEFAULT_MODEL=google/gemini-2.0-flash-lite
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

App tại **http://localhost:5173**. Vite proxy `/api/*` sang backend port 8000.

### Chạy cả FE + BE cùng lúc

**Cách 1 — Double-click (Windows):** Chạy `run.bat` ở thư mục gốc.

**Cách 2 — Terminal:**
```bash
npm run dev
```

### Docker

```bash
# 1. Tạo backend/.env (xem hướng dẫn ở trên)
# 2. Build và chạy
docker compose up --build
```

App tại **http://localhost**.

## Available Models

| Model                  | Provider | Input       | Output      | Vision | Best for              |
| ---------------------- | -------- | ----------- | ----------- | ------ | --------------------- |
| Gemini 2.0 Flash Lite  | Google   | $0.075/M    | $0.30/M     | Yes    | Budget study (default)|
| Gemini 2.0 Flash       | Google   | $0.15/M     | $0.60/M     | Yes    | Balanced              |
| Gemini 2.5 Flash       | Google   | $0.30/M     | $2.50/M     | Yes    | Best quality          |
| Grok 4.1 Fast          | xAI      | $0.20/M     | $0.50/M     | No     | Fast text-only        |
| Amazon Nova Micro      | Amazon   | $0.035/M    | $0.14/M     | No     | Cheapest text Q&A     |

Select model in the sidebar dropdown. Models with the eye icon support image uploads.

## Tech Stack

| Layer     | Technology                                   |
| --------- | -------------------------------------------- |
| LLM       | Vercel AI Gateway (multi-model)              |
| Backend   | Python, FastAPI, httpx                       |
| Frontend  | React 18, TypeScript, Vite                   |
| Styling   | TailwindCSS v4                               |
| State     | Zustand (persisted to localStorage)          |
| Mind Maps | markmap-lib + markmap-view                   |
| Markdown  | react-markdown + remark-gfm                 |
| Icons     | Lucide React                                 |
