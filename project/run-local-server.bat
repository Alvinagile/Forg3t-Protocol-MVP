@echo off
REM Forg3t Local Server Runner
REM This script runs the local unlearning server (assumes environment is set up)

REM Change to the directory where this script is located
cd /d %~dp0

echo ========================================
echo Forg3t Protocol - Local Server Runner
echo ========================================

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo Error: Failed to activate virtual environment
    echo Please run 'start-local-server.bat' first to set up the environment
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

echo Starting local server...
echo ========================================
echo Server will attempt to start on port 8788 (or next available port)
echo Press Ctrl+C to stop the server
echo ========================================
python server.py

if errorlevel 1 (
    echo.
    echo Error: Failed to start the server
    echo Check the error message above for details
) else (
    echo.
    echo Server stopped
)

pause