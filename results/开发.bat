@echo off
title AixSystems - 浏览器启动 (开发模式 - 热更新)
cd /d "%~dp0..\code"
echo 正在启动 AixSystems 开发模式...

where node >nul 2>nul || (echo 未检测到 Node.js,请先安装 Node 18+ & pause & exit /b 1)
where npm >nul 2>nul || (echo 未检测到 npm,请先安装 Node.js 后重试 & pause & exit /b 1)

if not exist "node_modules\.bin\vite.cmd" (
  echo ========================================
  echo   首次使用,正在安装依赖,约 30 秒...
  echo ========================================
  call npm install --no-audit --no-fund
  if errorlevel 1 (echo 安装失败 & pause & exit /b 1)
)

echo ========================================
echo   AixSystems 开发模式启动中,支持代码热更新...
echo   浏览器即将打开 http://127.0.0.1:5173
echo   修改 code/src/ 下文件会自动刷新
echo ========================================

start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:5173'"
call npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
echo.
echo 服务已停止,按任意键关闭窗口...
pause >nul
