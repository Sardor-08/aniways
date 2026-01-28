@echo off
echo Building Aniways Electron App...
echo.
cd /d "%~dp0frontend"
npm run electron:build
echo.
echo Build complete! Check the frontend\out folder for your packaged app.
pause
