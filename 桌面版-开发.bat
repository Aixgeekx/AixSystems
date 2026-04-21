@echo off
chcp 65001 >nul
title AixSystems · 桌面版 (开发模式 - 热更新)
cd /d "%~dp0"

if not exist "code\node_modules\" (
  pushd code & call npm install --no-audit --no-fund & popd
)
if not exist "desktop\node_modules\" (
  echo 正在安装 Electron (约 1 分钟)...
  pushd desktop & call npm install --no-audit --no-fund & popd
)

echo ========================================
echo   AixSystems 桌面版 (开发模式)
echo   1. 启动 Vite dev server
echo   2. 3 秒后启动 Electron 窗口
echo   修改 code/src/ 下文件窗口自动刷新
echo ========================================

rem 启动 Vite dev,留在新窗口
start "AixSystems Vite Dev" cmd /c "cd /d %~dp0code && npm run dev"

timeout /t 4 >nul

rem 启动 Electron (开发模式)
cd desktop
call npm run dev
