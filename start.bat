@echo off
echo ===================================================
echo               Starting Baton Platform
echo   Knowledge Handover with Verifiable Evidence
echo ===================================================

echo Starting Backend Server on http://localhost:8000 ...
start "Baton Backend" cmd /k "cd backend && .\venv\Scripts\python -m uvicorn app.main:app --reload --port 8000"

echo Waiting 3 seconds for backend initialization...
timeout /t 3 /nobreak > nul

echo Starting Frontend Next.js Server on http://localhost:3000 ...
start "Baton Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo Baton is booting up!
echo Frontend: http://localhost:3000
echo Backend API Docs: http://localhost:8000/docs
echo ===================================================
