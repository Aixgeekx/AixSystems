@echo off
chcp 65001 >nul
title 打包 AixSystems 为 .exe 安装包
cd /d "%~dp0"

echo ========================================
echo   打包 AixSystems 为 Windows 安装包
echo   首次运行约 5-10 分钟,会下载 electron-builder (约 100MB)
echo ========================================
echo.

rem 1. 确保 code 依赖
if not exist "code\node_modules\" (
  echo [1/4] 安装应用依赖...
  pushd code & call npm install --no-audit --no-fund & popd
)

rem 2. 构建最新的 dist
echo [2/4] 构建 Web 产物...
pushd code & call npm run build & popd
if errorlevel 1 (echo 构建失败 & pause & exit /b 1)

rem 3. 确保 desktop 依赖
if not exist "desktop\node_modules\" (
  echo [3/4] 安装 Electron + electron-builder...
  pushd desktop & call npm install --no-audit --no-fund & popd
)

rem 4. 生成图标 (如果不存在)
if not exist "desktop\build\icon.ico" (
  echo 生成图标...
  call node "Aix_tools\gen_icon.cjs"
)

rem 5. 调用 electron-builder
echo [4/4] electron-builder 打包中...
pushd desktop
call npm run dist
set ERR=%errorlevel%
popd
if %ERR% neq 0 (echo 打包失败 & pause & exit /b 1)

echo.
echo ==========================================
echo 打包完成! 安装包在: desktop\dist-installer\
echo ==========================================
start "" explorer "desktop\dist-installer"
pause
