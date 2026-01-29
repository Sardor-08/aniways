@echo off
echo ==========================================
echo Installing All Dependencies (Backend + Frontend)
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/2] Installing Backend Dependencies...
echo.

REM Check if Python is available
echo Checking for Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    py --version >nul 2>&1
    if errorlevel 1 (
        echo.
        echo ERROR: Python is not installed or not in your PATH
        echo.
        echo Please install Python 3.8 or higher from:
        echo https://www.python.org/downloads/
        echo.
        echo Make sure to check "Add Python to PATH" during installation
        echo.
        pause
        exit /b 1
    )
    set PYTHON_CMD=py
) else (
    set PYTHON_CMD=python
)

echo Found Python: %PYTHON_CMD%
echo.

REM Check if virtual environment exists
if not exist ".venv\Scripts\activate.bat" (
    echo Creating Python virtual environment...
    %PYTHON_CMD% -m venv .venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        echo Please make sure Python is properly installed
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
