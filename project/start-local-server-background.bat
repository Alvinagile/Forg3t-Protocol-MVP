@echo off
REM Forg3t Local Server Starter (Background)
REM This script sets up and runs the local unlearning server in the background

REM Change to the directory where this script is located
cd /d %~dp0

echo ========================================
echo Forg3t Protocol - Local Server Starter (Background)
echo ========================================

REM Check if venv exists, if not create it
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo Error: Failed to create virtual environment
        echo Please make sure Python is installed and accessible
        pause
        exit /b 1
    )
)

echo Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo Error: Failed to activate virtual environment
    pause
    exit /b 1
)

REM Check if requirements.txt exists
if not exist "requirements.txt" (
    echo Error: requirements.txt not found
    echo Please make sure you're running this script from the correct directory
    pause
    exit /b 1
)

echo Installing requirements...
pip install -r requirements.txt
if errorlevel 1 (
    echo Error: Failed to install requirements
    pause
    exit /b 1
)

REM Check if server.py exists
if not exist "server.py" (
    echo Error: server.py not found
    echo Please make sure you're running this script from the correct directory
    pause
    exit /b 1
)

echo Starting local server in background...
echo ========================================
echo Server will be available at: http://127.0.0.1:8788
echo To stop the server, close the terminal window that will open
echo ========================================

REM Start server in a new minimized command window
start /min cmd /c "cd /d %~dp0 & title Forg3t Local Server & echo Server running... & echo Press Ctrl+C to stop & echo. & venv\Scripts\activate.bat & uvicorn server:app --host 127.0.0.1 --port 8788 & echo. & echo Server stopped & pause"

echo Server started successfully!
echo You can now use the local unlearning feature in the application.
echo.
echo A new terminal window has been opened to run the server in the background.
echo Close that window when you want to stop the server.
echo.
echo Press any key to continue...
pause >nul