@echo off
cd /d "%~dp0"
echo Starting IT Procurement Portal at http://127.0.0.1:8000 ...
if exist ".venv\Scripts\uvicorn.exe" (
    ".venv\Scripts\uvicorn.exe" main:app --host 127.0.0.1 --port 8000 --reload
) else (
    uvicorn main:app --host 127.0.0.1 --port 8000 --reload
)
pause
