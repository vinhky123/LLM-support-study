# Cloud Study Assistant

A local-first study companion for AWS certification exams, powered by [Vercel AI Gateway](https://vercel.com/docs/ai-gateway).

Supports:
- **DEA-C01** (Data Engineer Associate)
- **SAA-C03** (Solutions Architect Associate)
- **SAP-C02** (Solutions Architect Professional)
- **Common AWS mode** (generic cloud study)

## Features

- **AI Chat (streaming)** with certification-aware prompts
- **Image upload in chat** (for models that support vision)
- **Multi-cert mode**: switch cert profile from sidebar
- **Multi-model mode**: switch model from sidebar
- **Token & cost tracker**:
  - tracks prompt/completion tokens per request
  - calculates estimated USD cost by selected model pricing
  - stores usage locally
  - auto-rolls by month (new month = new counter)
- **Auto note generation** from chat, export `.md`
- **Knowledge visualization** from notes:
  - Mind map
  - Flashcards
  - Summary table
- **Quiz mode** with exam-style MCQ
- **Domain progress tracker** per certification profile

## Prerequisites

- Python 3.10+
- Node.js 18+
- Docker Desktop (optional, if running with Docker)
- Vercel AI Gateway API key

## Get Vercel AI Gateway API Key

1. Go to [Vercel AI Gateway](https://vercel.com/~/ai-gateway)
2. Login / create Vercel account
3. Open **Settings** and create an API key
4. Add payment method to unlock the free credit bucket (Vercel $5 credit flow)

Then create `backend/.env` from example:

```bash
cp backend/.env.example backend/.env
```

Update values:

```env
AI_GATEWAY_API_KEY=your_key_here
DEFAULT_MODEL=google/gemini-2.0-flash-lite
```

## Run Locally (without Docker)

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: `http://localhost:5173`

## Run FE + BE together

- **Windows double-click**: run `run.bat` in project root
- **Terminal**:

```bash
npm run dev
```

## Docker

### Start

```bash
docker compose up --build
```

Open app at: `http://localhost`

### Stop

```bash
docker compose down
```

### Useful commands

```bash
# run in background
docker compose up -d --build

# view logs
docker compose logs -f

# rebuild a single service
docker compose build backend
docker compose build frontend

# restart services
docker compose restart
```

### Docker architecture

- `frontend` container: Nginx serves built React app on port `80`
- `backend` container: FastAPI on port `8000`
- Nginx proxies `/api/*` to backend service (`http://backend:8000`)

## Available Models

| Model | Provider | Input | Output | Vision | Notes |
|---|---|---:|---:|---|---|
| Gemini 2.0 Flash Lite | Google | $0.075 / 1M | $0.30 / 1M | Yes | Default, best cost/perf |
| Gemini 2.0 Flash | Google | $0.15 / 1M | $0.60 / 1M | Yes | Balanced |
| Gemini 2.5 Flash | Google | $0.30 / 1M | $2.50 / 1M | Yes | Better quality, pricier |
| Grok 4.1 Fast (non-reasoning) | xAI | $0.20 / 1M | $0.50 / 1M | No | Text-only |
| Amazon Nova Micro | Amazon | $0.035 / 1M | $0.14 / 1M | No | Cheapest text model |

Notes:
- Models with **Vision = No** should be used for text-only chat.
- Pricing shown is configured estimate used for in-app cost tracking.

## Tech Stack

| Layer | Technology |
|---|---|
| LLM Gateway | Vercel AI Gateway (OpenAI-compatible REST) |
| Backend | Python, FastAPI, httpx |
| Frontend | React 18, TypeScript, Vite |
| Styling | TailwindCSS v4 |
| State | Zustand + localStorage |
| Visualization | markmap-lib + markmap-view |
| Markdown | react-markdown + remark-gfm |
| Icons | Lucide React |
