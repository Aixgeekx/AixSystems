@echo off
title 打包 AixSystems 单文件便携版
cd /d "%~dp0..\"

where node >nul 2>nul || (echo 未检测到 Node.js,请先安装 Node 18+ & pause & exit /b 1)
where npm >nul 2>nul || (echo 未检测到 npm,请先安装 Node.js 后重试 & pause & exit /b 1)

echo ========================================
echo   打包 AixSystems 单文件便携版
echo   该模式仍会生成 portable.exe,适合临时分发
echo ========================================
echo.

if not exist "code\node_modules\.bin\vite.cmd" (
  echo [1/4] 安装应用依赖...
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

echo [2/4] 构建 Web 产物...
pushd code
call npm run build
if errorlevel 1 (
  popd
  echo 构建失败
  pause
  exit /b 1
)
popd

if not exist "desktop\node_modules\.bin\electron-builder.cmd" (
  echo [3/4] 安装桌面端依赖...
  pushd desktop
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    popd
    echo desktop 依赖安装失败
    pause
    exit /b 1
  )
  popd
)

echo [4/4] 构建单文件 portable.exe...
pushd desktop
call npm run dist:portable-exe
set ERR=%errorlevel%
popd
if %ERR% neq 0 (echo 单文件便携版构建失败 & pause & exit /b 1)

echo.
echo ==========================================
echo 单文件便携版已生成: desktop\dist-installer\
echo ==========================================
start "" explorer "desktop\dist-installer"
pause
