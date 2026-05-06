@echo off
setlocal

set "OPENCLAW_CMD="

:: 1) fnm default symbol link
set "FNM_DEFAULT=%LOCALAPPDATA%\fnm_multishells\default"
if exist "%FNM_DEFAULT%\openclaw.cmd" set "OPENCLAW_CMD=%FNM_DEFAULT%\openclaw.cmd"

:: 2) traverse fnm_multishells, pick latest by modification time
if not defined OPENCLAW_CMD (
    for /f "delims=" %%a in ('dir /b /ad /o-d "%LOCALAPPDATA%\fnm_multishells" 2^>nul') do (
        if exist "%LOCALAPPDATA%\fnm_multishells\%%a\openclaw.cmd" (
            set "OPENCLAW_CMD=%LOCALAPPDATA%\fnm_multishells\%%a\openclaw.cmd"
            goto :found
        )
    )
)

:found
if defined OPENCLAW_CMD (
    start /b "" "%OPENCLAW_CMD%" gateway --force >nul 2>&1
) else (
    exit /b 1
)