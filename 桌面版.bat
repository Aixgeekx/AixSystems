@echo off
chcp 65001 >nul
title AixSystems · 桌面版
cd /d "%~dp0"

rem 先确保 code/dist 存在(Electron 生产模式依赖它)
if not exist "code\node_modules\" (
  echo ========================================
  echo   首次使用,正在安装应用依赖...
  echo ========================================
  pushd code
  call npm install --no-audit --no-fund
  popd
)

if not exist "code\dist\index.html" (
  echo ========================================
  echo   首次构建应用...
  echo ========================================
  pushd code
  call npm run build
  popd
)

rem 再确保 desktop/node_modules 存在(Electron 本身)
if not exist "desktop\node_modules\" (
  echo ========================================
  echo   首次使用,正在安装 Electron (约 1 分钟,180MB)...
  echo ========================================
  pushd desktop
  call npm install --no-audit --no-fund
  popd
  if errorlevel 1 (echo Electron 安装失败 & pause & exit /b 1)
)

echo ========================================
echo   AixSystems 桌面版启动中...
echo ========================================
cd desktop
call npm start
