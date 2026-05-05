@echo off
echo ============================================
echo   Iniciando Backend - FastAPI
echo ============================================

cd /d "%~dp0backend"

REM Crear entorno virtual si no existe
if not exist ".venv" (
    echo Creando entorno virtual Python...
    python -m venv .venv
)

REM Activar entorno virtual
call .venv\Scripts\activate.bat

REM Instalar dependencias
echo Instalando dependencias...
pip install -r requirements.txt --quiet

REM Copiar .env si no existe
if not exist ".env" (
    echo Creando .env desde .env.example...
    copy .env.example .env
    echo.
    echo *** IMPORTANTE ***
    echo Edita el archivo backend\.env con tus datos de PostgreSQL antes de continuar.
    echo Luego cierra esta ventana y vuelve a ejecutar start-backend.bat
    echo ******************
    pause
    exit /b 1
)

REM Crear usuarios por defecto si la BD esta limpia
echo Verificando usuarios iniciales...
python seed.py

REM Iniciar servidor
echo.
echo Backend corriendo en: http://localhost:8000
echo Documentacion API:    http://localhost:8000/api/docs
echo.
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
