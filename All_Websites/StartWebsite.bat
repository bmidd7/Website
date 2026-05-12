@echo off
title My Django + Caddy Server

set PROJECT_DIR=M:\C VSCode\.vscode\Website\All_Websites
set WSGI_MODULE=All_Websites.wsgi:application
set PYTHON=python

echo Starting Django (Waitress)...

start "Django Server" cmd /k ^
"%PYTHON% -m waitress --host 127.0.0.1 --port 8000 %WSGI_MODULE%"


timeout /t 2 >nul

echo Starting Caddy...

start "Caddy Server" cmd /k ^
cd /d "%PROJECT_DIR%" && caddy.exe run

echo Both servers launched.
pause