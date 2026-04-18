@echo off
REM Windows launcher; Linux/macOS use run.sh in repo root (same app).
echo Starting Cloud Study Assistant...
echo.

start "Backend" cmd /k "cd /d %~dp0backend && uvicorn main:app --reload --port 8000"
timeout /t 2 /nobreak >nul
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Backend and Frontend started in separate windows.
echo Browser will open automatically when Frontend is ready.
echo Close the Backend and Frontend windows to stop the servers.
pause
