@echo off
echo ==========================================
echo       SCHOOL MANAGER BACKEND STARTER
echo ==========================================

cd /d "%~dp0"

IF EXIST venv\Scripts\activate (
    echo [INFO] Activating virtual environment...
    call venv\Scripts\activate
) ELSE (
    echo [WARNING] 'venv' folder not found. Using system Python.
    echo To create a venv: python -m venv venv
)

echo [INFO] Installing/Updating dependencies...
pip install -r requirements.txt

echo.
echo [INFO] Starting Uvicorn server...
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
