Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "              Starting Baton Platform              " -ForegroundColor Cyan
Write-Host "  Knowledge Handover with Verifiable Evidence      " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

Write-Host "Starting Backend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; .\venv\Scripts\python -m uvicorn app.main:app --reload --port 8000"

Start-Sleep -Seconds 3

Write-Host "Starting Frontend on http://localhost:3000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "Baton is running!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Green

