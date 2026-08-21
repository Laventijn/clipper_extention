@echo off
setlocal

cd /d "%~dp0\.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0bewaar-versie.ps1" %*

endlocal
