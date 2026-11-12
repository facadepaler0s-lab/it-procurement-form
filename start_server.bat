@echo off
cd /d "d:\Procurement Form"
echo Starting IT Procurement Portal at http://127.0.0.1:8000 ...
"d:\Procurement Form\.venv\Scripts\uvicorn.exe" main:app --host 127.0.0.1 --port 8000 --reload
pause

