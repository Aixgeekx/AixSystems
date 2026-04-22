@echo off
setlocal
title AixSystems - 桌面版 (开发模式 - 热更新)
cd /d "%~dp0..\"
echo 正在启动 AixSystems 桌面版 (开发模式)...

where node >nul 2>nul || (echo 未检测到 Node.js,请先安装 Node 18+ & pause & exit /b 1)
where npm >nul 2>nul || (echo 未检测到 npm,请先安装 Node.js 后重试 & pause & exit /b 1)

if not exist "code\node_modules\.bin\vite.cmd" (
  echo 正在安装应用依赖...
  pushd code
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    popd
    echo code 依赖安装失败
    pause
    exit /b 1
  )
  popd
)

if not exist "desktop\node_modules\.bin\cross-env.cmd" (
  echo 正在安装 Electron,约 1 分钟...
  pushd desktop
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    popd
    echo Electron 安装失败
    pause
    exit /b 1
  )
  popd
)

if not exist "desktop\node_modules\.bin\electron.cmd" (
  echo 正在安装 Electron,约 1 分钟...
  pushd desktop
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    popd
    echo Electron 安装失败
    pause
    exit /b 1
  )
  popd
)

echo ========================================
echo   AixSystems 桌面版 (开发模式)
echo   1. 启动 Vite dev server
echo   2. 等待服务就绪后启动 Electron 窗口
echo   修改 code/src/ 下文件窗口自动刷新
echo ========================================

start "AixSystems Vite Dev" cmd /k "cd /d ""%~dp0..\code"" && npm run dev -- --host 127.0.0.1 --port 5173 --strictPort"

set "VITE_URL=http://127.0.0.1:5173"
set /a WAIT_COUNT=0

:wait_vite
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -UseBasicParsing '%VITE_URL%' -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>nul
if not errorlevel 1 goto vite_ready

set /a WAIT_COUNT+=1
if %WAIT_COUNT% geq 30 (
  echo Vite dev server 启动超时,请检查新开的 Vite 窗口日志
  pause
  exit /b 1
)

echo 等待 Vite dev server 就绪...
timeout /t 1 >nul
goto wait_vite

:vite_ready
cd desktop
call npm run dev
if errorlevel 1 (echo 启动失败 & pause & exit /b 1)
endlocal
