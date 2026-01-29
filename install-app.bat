@echo off
echo ==========================================
echo Installing All Dependencies (Backend + Frontend)
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/2] Installing Backend Dependencies...
echo.

REM Check if virtual environment exists
if not exist ".venv\Scripts\activate.bat" (
    echo Creating Python virtual environment...
    python -m venv .venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        echo Make sure Python is installed and in your PATH
        pause
        exit /b 1
    )
)

echo Activating virtual environment...
call .venv\Scripts\activate.bat

echo.
echo Installing Python dependencies from requirements.txt...
cd backend
pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

cd ..

echo.
echo Backend installation complete!
echo.
echo.
echo [2/2] Installing Frontend Dependencies...
echo.

cd frontend

echo Installing npm packages...
call npm install

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install frontend dependencies
    echo Make sure Node.js and npm are installed
    pause
    exit /b 1
)

cd ..

echo.
echo.
echo ==========================================
echo All Dependencies Installed Successfully!
echo ==========================================
echo.
echo You can now run start-app.bat to launch the application
echo.
pause
