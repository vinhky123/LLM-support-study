#!/usr/bin/env bash
# Unix companion to run.bat: backend + frontend from repo root.
# Windows: use run.bat instead.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "Starting Cloud Study Assistant..."
echo

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

run_backend() {
  cd "$ROOT/backend"
  if command -v uvicorn >/dev/null 2>&1; then
    exec uvicorn main:app --reload --port 8000
  fi
  exec python3 -m uvicorn main:app --reload --port 8000
}

(
  run_backend
) &
BACKEND_PID=$!

sleep 2

(
  cd "$ROOT/frontend"
  exec npm run dev
) &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID, Frontend PID: $FRONTEND_PID"
echo "Open http://localhost:5173 when the dev server is ready."
echo "Press Ctrl+C to stop both servers."
echo

wait "$FRONTEND_PID"
