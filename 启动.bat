@echo off
chcp 65001 >nul
title AixSystems · 浏览器启动 (生产模式)
cd /d "%~dp0code"

if not exist "node_modules\" (
  echo ========================================
  echo   首次使用,正在安装依赖 (约 30 秒)...
  echo ========================================
  call npm install --no-audit --no-fund
  if errorlevel 1 (echo 安装失败,请检查网络 & pause & exit /b 1)
)

if not exist "dist\" (
  echo ========================================
  echo   首次构建应用 (约 20 秒)...
  echo ========================================
  call npm run build
  if errorlevel 1 (echo 构建失败 & pause & exit /b 1)
)

echo ========================================
echo   AixSystems 启动中,浏览器即将打开...
echo   如未自动打开,请访问 http://127.0.0.1:4173
echo   关闭此窗口即可停止服务
echo ========================================

start "" "http://127.0.0.1:4173"
call npx vite preview
