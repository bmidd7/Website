@echo off
title My Django + Caddy + Guacamole Server

set PROJECT_DIR=M:\C VSCode\.vscode\Website\All_Websites
set ODYESSEUS_DIR=M:\C VSCode\odysseus
set GUACAMOLE_DIR=%PROJECT_DIR%\Services\guacamole-stack
set WSGI_MODULE=All_Websites.wsgi:application
set PYTHON=python

cd /d "%PROJECT_DIR%"

echo.
echo ========================================
echo Starting All Services
echo ========================================
echo.

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: Docker not found - Guacamole will not start
    echo.
) else (
    echo Starting Guacamole...
    cd /d "%GUACAMOLE_DIR%"
    docker compose up -d
    cd /d "%PROJECT_DIR%"
    echo Guacamole started
    echo.
)

echo Starting Django (Waitress)...

start "Waitress" /B %PYTHON% -m waitress --host 127.0.0.1 --port 8000 %WSGI_MODULE%

timeout /t 2 >nul

echo Starting Caddy...

start "Caddy" /B caddy.exe run

@REM echo Starting Odysseus...

@REM cd /d "%ODYESSEUS_DIR%"

@REM start "Odysseus" /B  ./launch-windows.ps1

echo.
echo ========================================
echo All Services Started
echo ========================================
echo.

exit