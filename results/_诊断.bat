@echo off
title AixSystems - 环境诊断
cd /d "%~dp0..\"
echo [1] 当前目录 = %CD%
echo [2] bat 路径  = %~f0

where node >nul 2>nul
if errorlevel 1 (
  echo [3] Node.js 未安装
) else (
  echo [3] Node.js 已安装
  node -v
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [4] npm 未安装
) else (
  echo [4] npm 已安装
  call npm -v
)

if exist "code\package.json" (echo [5] code\package.json 存在) else (echo [5] 缺少 code\package.json)
if exist "desktop\package.json" (echo [6] desktop\package.json 存在) else (echo [6] 缺少 desktop\package.json)
if exist "code\dist\index.html" (echo [7] code\dist\index.html 已存在) else (echo [7] 尚未构建 code\dist\index.html)
if exist "desktop\build\icon.ico" (echo [8] desktop\build\icon.ico 已存在) else (echo [8] 缺少 desktop\build\icon.ico)

echo.
echo === 诊断结束,按任意键关闭窗口 ===
pause >nul
