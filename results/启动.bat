@echo off
title AixSystems - 浏览器启动 (生产模式)
cd /d "%~dp0..\code"
echo 正在启动 AixSystems...

where node >nul 2>nul || (echo 未检测到 Node.js,请先安装 Node 18+ & pause & exit /b 1)
where npm >nul 2>nul || (echo 未检测到 npm,请先安装 Node.js 后重试 & pause & exit /b 1)

if not exist "node_modules\.bin\vite.cmd" (
  echo ========================================
  echo   首次使用,正在安装依赖,约 30 秒...
  echo ========================================
  call npm install --no-audit --no-fund
  if errorlevel 1 (echo 安装失败,请检查网络 & pause & exit /b 1)
)

if not exist "dist\index.html" (
  echo ========================================
  echo   首次构建应用,约 20 秒...
  echo ========================================
  call npm run build
  if errorlevel 1 (echo 构建失败 & pause & exit /b 1)
)

echo ========================================
echo   AixSystems 启动中,浏览器即将打开...
echo   如未自动打开,请访问 http://127.0.0.1:4173
echo   关闭此窗口即可停止服务
echo ========================================

start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:4173'"
call npm run preview -- --host 0.0.0.0 --port 4173 --strictPort
echo.
echo 服务已停止,按任意键关闭窗口...
pause >nul
