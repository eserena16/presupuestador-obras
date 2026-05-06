@echo off
echo ============================================
echo   Iniciando Backend - FastAPI
echo ============================================

cd /d "%~dp0backend"

REM ──────────────────────────────────────────────────────────────────
REM  Matar TODOS los procesos Python/uvicorn en el puerto 8000
REM ──────────────────────────────────────────────────────────────────
echo Liberando puerto 8000...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8000 " ^| findstr "LISTENING"') do (
    if not "%%a"=="0" (
        echo   Terminando proceso PID %%a...
        taskkill /F /T /PID %%a >nul 2>&1
    )
)
REM Matar todos los uvicorn/python que tengan "uvicorn" en el comando
tasklist /FI "IMAGENAME eq python.exe" /FO CSV /NH 2>nul | findstr /i "uvicorn" >nul 2>&1
timeout /t 2 /nobreak >nul

REM ──────────────────────────────────────────────────────────────────
REM  Entorno virtual
REM ──────────────────────────────────────────────────────────────────
if not exist ".venv" (
    echo Creando entorno virtual Python...
    python -m venv .venv
)

call .venv\Scripts\activate.bat

REM ──────────────────────────────────────────────────────────────────
REM  Dependencias
REM ──────────────────────────────────────────────────────────────────
echo Instalando dependencias...
pip install -r requirements.txt --quiet

REM ──────────────────────────────────────────────────────────────────
REM  Verificar paquetes criticos
REM ──────────────────────────────────────────────────────────────────
echo.
echo Verificando modulos criticos...
python -c "import anthropic; print('  [OK] anthropic', anthropic.__version__)" 2>nul || echo   [ERROR] anthropic no esta instalado - ejecuta: pip install anthropic
python -c "import httpx;     print('  [OK] httpx')" 2>nul || echo   [ERROR] httpx no esta instalado
python -c "import fastapi;   print('  [OK] fastapi')" 2>nul || echo   [ERROR] fastapi no esta instalado

echo.
echo Verificando rutas AI e Intendencia...
python -c "from app.routers import ai, intendencia; print('  [OK] Rutas AI e Intendencia se importan correctamente')" 2>&1

REM ──────────────────────────────────────────────────────────────────
REM  Configuracion
REM ──────────────────────────────────────────────────────────────────
if not exist ".env" (
    echo Creando .env desde .env.example...
    copy .env.example .env
    echo.
    echo *** IMPORTANTE: Edita backend\.env con tus datos de PostgreSQL ***
    pause
    exit /b 1
)

REM ──────────────────────────────────────────────────────────────────
REM  Seeds
REM ──────────────────────────────────────────────────────────────────
echo.
echo Verificando datos iniciales...
python seed.py
python seed_catalog.py
python seed_obra_types.py

REM ──────────────────────────────────────────────────────────────────
REM  Arrancar servidor
REM ──────────────────────────────────────────────────────────────────
echo.
echo ============================================
echo  Backend listo en: http://localhost:8000
echo  Swagger docs:     http://localhost:8000/api/docs
echo ============================================
echo.
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
