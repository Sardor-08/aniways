@echo off
REM ============================================
REM Aniways Startup Script (Windows)
REM Usage: start.bat
REM ============================================

echo Starting Aniways...

:: Start backend (venv is in project root)
start "Aniways Backend" cmd /k "cd /d %~dp0backend && call %~dp0.venv\Scripts\activate && python server.py"

:: Wait for backend to start
timeout /t 2 /nobreak >nul

:: Start frontend
start "Aniways Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Backend: http://localhost:4444
echo Frontend: http://localhost:3000
