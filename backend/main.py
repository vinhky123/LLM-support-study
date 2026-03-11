from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, notes, quiz

app = FastAPI(title="Cloud Study Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(notes.router, prefix="/api/notes", tags=["notes"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["quiz"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
