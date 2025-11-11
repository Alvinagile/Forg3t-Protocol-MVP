@echo off
REM Forg3t Local Server Starter (Background)
REM This script sets up and runs the local unlearning server in the background

REM Change to the directory where this script is located
cd /d %~dp0

echo ========================================
echo Forg3t Protocol - Local Server Starter (Background)
echo ========================================

echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not accessible from the command line.
    echo.
    echo Please install Python 3.8 or higher from https://www.python.org/downloads/
    echo During installation, make sure to check "Add Python to PATH"
    echo.
    echo After installing Python, please run this script again.
    pause
    exit /b 1
)

echo Python is installed. Checking version...
for /f "tokens=2" %%i in ('python --version') do set PYTHON_VERSION=%%i
for /f "delims=. tokens=1,2" %%a in ("%PYTHON_VERSION%") do (
    set PYTHON_MAJOR=%%a
    set PYTHON_MINOR=%%b
)

if %PYTHON_MAJOR% LSS 3 (
    echo Error: Python 3.8 or higher is required. Your version is %PYTHON_VERSION%
    echo Please install a newer version of Python from https://www.python.org/downloads/
    pause
    exit /b 1
)

if %PYTHON_MAJOR% EQU 3 (
    if %PYTHON_MINOR% LSS 8 (
        echo Error: Python 3.8 or higher is required. Your version is %PYTHON_VERSION%
        echo Please install a newer version of Python from https://www.python.org/downloads/
        pause
        exit /b 1
    )
)

echo Python %PYTHON_VERSION% is compatible.

echo Checking if venv module is available...
python -m venv --help >nul 2>&1
if errorlevel 1 (
    echo Error: Python venv module is not available.
    echo Please make sure you have a complete Python installation.
    pause
    exit /b 1
)

REM Check if venv exists, if not create it
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo Error: Failed to create virtual environment
        echo.
        echo This could be due to one of the following reasons:
        echo 1. Python is not properly installed
        echo 2. Python is not added to your system PATH
        echo 3. Windows security policies are preventing the creation of the virtual environment
        echo.
        echo Troubleshooting steps:
        echo 1. Check if Python is installed by running "python --version" in Command Prompt
        echo 2. If Python is installed, make sure it's added to your PATH environment variable
        echo 3. Try running this script as Administrator
        echo 4. If problems persist, manually create the virtual environment with:
        echo    "python -m venv venv" and then run the script again
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
echo If this step takes a long time, please be patient as it downloads and installs packages.
pip install -r requirements.txt
if errorlevel 1 (
    echo Error: Failed to install requirements
    echo.
    echo This could be due to network issues or package conflicts.
    echo.
    echo Troubleshooting steps:
    echo 1. Check your internet connection
    echo 2. Try running "pip install -r requirements.txt" manually
    echo 3. If you're behind a corporate firewall, you might need to configure pip to use your proxy
    echo 4. Try running this script as Administrator
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
echo Server will attempt to start on port 8788 (or next available port)
echo To stop the server, close the terminal window that will open
echo ========================================

REM Start server in a new minimized command window
start /min cmd /c "cd /d %~dp0 & title Forg3t Local Server & echo Server running... & echo Press Ctrl+C to stop & echo. & venv\Scripts\activate.bat & python server.py & echo. & echo Server stopped & pause"

echo Server started successfully!
echo You can now use the local unlearning feature in the application.
echo.
echo A new terminal window has been opened to run the server in the background.
echo Close that window when you want to stop the server.
echo.
echo Press any key to continue...
pause >nul