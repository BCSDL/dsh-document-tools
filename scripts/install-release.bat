@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-release.ps1" %*
pause
