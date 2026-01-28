@echo off
echo Starting Aniways Electron App in Development Mode...
echo.
echo This will start both the Next.js dev server and Electron.
echo.
cd /d "%~dp0frontend"
npm run electron:dev
