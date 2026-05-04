@echo off
title 创建桌面快捷方式
cd /d "%~dp0..\"
echo 正在创建桌面快捷方式...

if not exist "%~dp0..\创建桌面快捷方式.ps1" (
  echo 缺少 创建桌面快捷方式.ps1
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\创建桌面快捷方式.ps1"
if errorlevel 1 (echo 创建失败,请检查 .ps1 文件 & pause & exit /b 1)
echo.
echo 完成! 按任意键关闭...
pause >nul
