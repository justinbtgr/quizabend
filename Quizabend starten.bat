@echo off
setlocal
cd /d "%~dp0"
title Quizabend - dieses Fenster offen lassen
if exist "runtime\node.exe" (
  "runtime\node.exe" scripts\launch.mjs
) else (
  where node >nul 2>&1
  if errorlevel 1 (
    echo Bitte Node.js ab Version 22 installieren oder den vollstaendigen Quizabend-Ordner verwenden.
  ) else (
    node scripts\launch.mjs
  )
)
echo.
echo Quizabend beendet. Der Spielstand bleibt gespeichert.
pause
