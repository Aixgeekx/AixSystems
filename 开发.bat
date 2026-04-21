@echo off
chcp 65001 >nul
title AixSystems · 浏览器启动 (开发模式 - 热更新)
cd /d "%~dp0code"

if not exist "node_modules\" (
  echo ========================================
  echo   首次使用,正在安装依赖 (约 30 秒)...
  echo ========================================
  call npm install --no-audit --no-fund
  if errorlevel 1 (echo 安装失败 & pause & exit /b 1)
)

echo ========================================
echo   AixSystems 开发模式启动中,支持代码热更新...
echo   浏览器即将打开 http://127.0.0.1:5173
echo   修改 code/src/ 下文件会自动刷新
echo ========================================

timeout /t 2 >nul
start "" "http://127.0.0.1:5173"
call npm run dev
