@echo off
title Catfish Treasure Hunt
echo Starting Catfish Treasure Hunt in your browser...

:: Check if Microsoft Edge exists
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" "%~dp0index.html"
    exit /b 0
)

:: Check if Google Chrome exists
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "%~dp0index.html"
    exit /b 0
)

:: Fallback to system default
start "" "%~dp0index.html"
exit /b 0
