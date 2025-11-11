@echo off
REM Forg3t Local Server Starter
REM This script sets up and runs the local unlearning server

REM Change to the directory where this script is located
cd /d %~dp0

echo ========================================
echo Forg3t Protocol - Local Server Starter
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