@echo off
echo ============================================
echo   Presupuestador de Obras - ST Arquitectos
echo ============================================
echo.
echo Iniciando Backend y Frontend en paralelo...
echo.

start "Backend - FastAPI" cmd /k "start-backend.bat"
timeout /t 3 /nobreak >nul
start "Frontend - React" cmd /k "start-frontend.bat"

echo.
echo Servicios iniciados:
echo   Backend:   http://localhost:8000
echo   Frontend:  http://localhost:5173
echo   API Docs:  http://localhost:8000/api/docs
echo.
echo Cerrar esta ventana no detiene los servicios.
echo Para detenerlos, cerrar las ventanas de Backend y Frontend.
pause
