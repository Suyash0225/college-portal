@echo off
echo Starting College Portal...

start "Flask Backend" cmd /k "cd /d C:\Users\Suyash\NewProject\backend && python app.py"

timeout /t 3 /nobreak >nul

start "Vite Frontend" cmd /k "cd /d C:\Users\Suyash\NewProject\frontend && npm run dev"

echo.
echo College Portal is starting up!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo You can close this window.
