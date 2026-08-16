@echo off
chcp 65001 >nul
title SkyCitadel Desktop Build

echo ==========================================
echo   SkyCitadel Desktop Builder
echo ==========================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Download Node.js from https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm not found!
    pause
    exit /b 1
)

echo [OK] Node.js version:
node -v
echo.

echo [1/3] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)

echo.
echo [2/3] Building installer...
call npm run dist
if %errorlevel% neq 0 (
    echo [ERROR] Build failed.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo [DONE] Build complete!
echo Installer is in the "build" folder.
echo ==========================================
echo.
echo Press any key to open the folder...
pause >nul
start build

exit /b 0