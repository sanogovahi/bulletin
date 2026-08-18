@echo off
title Portail Bulletins Police

cd /d "%~dp0"

echo.
echo ==========================================
echo       PORTAIL BULLETINS POLICE
echo ==========================================
echo.
echo Demarrage du serveur...
echo.

start "" /B cmd /c "npm start"

timeout /t 5 /nobreak >nul

echo Ouverture du portail...
start "" "http://localhost:3000"

echo.
echo Le portail est maintenant ouvert.
echo.
echo NE FERMEZ PAS cette fenetre tant que
echo vous utilisez le portail.
echo.
pause