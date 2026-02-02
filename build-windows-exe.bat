@echo off
echo =========================================
echo   Building Aniways Windows Executable
echo =========================================
echo.

cd /d "%~dp0frontend"

echo [1/4] Installing dependencies...
call npm ci
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo [2/4] Building Next.js application...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build Next.js!
    pause
    exit /b 1
)

echo.
echo [3/4] Copying static files...
if exist ".next\static" (
    if not exist ".next\standalone\.next\static" mkdir ".next\standalone\.next\static"
    xcopy /E /Y /Q ".next\static\*" ".next\standalone\.next\static\"
)
if exist "public" (
    if not exist ".next\standalone\public" mkdir ".next\standalone\public"
    xcopy /E /Y /Q "public\*" ".next\standalone\public\"
)

echo.
echo [4/4] Building Electron executable...
call npx electron-forge make --platform win32 --arch x64
if %errorlevel% neq 0 (
    echo ERROR: Failed to build Electron app!
    pause
    exit /b 1
)

echo.
echo =========================================
echo   Build Complete!
echo =========================================
echo.
echo Your Windows executable is located in:
echo   frontend\out\make\squirrel.windows\x64\
echo.
echo The installer (.exe) and ZIP file are ready!
echo.
pause
