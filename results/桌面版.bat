@echo off
title AixSystems - 桌面版
cd /d "%~dp0..\"
echo 正在启动 AixSystems 桌面版...

where node >nul 2>nul || (echo 未检测到 Node.js,请先安装 Node 18+ & pause & exit /b 1)
where npm >nul 2>nul || (echo 未检测到 npm,请先安装 Node.js 后重试 & pause & exit /b 1)

rem 先确保 code/dist 存在(Electron 生产模式依赖它)
if not exist "code\node_modules\.bin\vite.cmd" (
  echo ========================================
  echo   首次使用,正在安装应用依赖...
  echo ========================================
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

if not exist "code\dist\index.html" (
  echo ========================================
  echo   首次构建应用...
  echo ========================================
  pushd code
  call npm run build
  if errorlevel 1 (
    popd
    echo 构建失败
    pause
    exit /b 1
  )
  popd
)

rem 再确保 desktop/node_modules 存在(Electron 本身)
if not exist "desktop\node_modules\.bin\electron.cmd" (
  echo ========================================
  echo   首次使用,正在安装 Electron,约 1 分钟, 180MB...
  echo ========================================
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
echo   AixSystems 桌面版启动中...
echo ========================================
cd desktop
call npm start
if errorlevel 1 (echo 启动失败 & pause & exit /b 1)
