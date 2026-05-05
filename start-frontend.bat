@echo off
echo ============================================
echo   Iniciando Frontend - React / Vite
echo ============================================

cd /d "%~dp0frontend"

REM Instalar dependencias si no existen
if not exist "node_modules" (
    echo Instalando dependencias npm...
    npm install
)

echo.
echo Frontend corriendo en: http://localhost:5173
echo.
npm run dev

pause
