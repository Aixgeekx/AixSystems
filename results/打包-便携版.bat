@echo off
title 打包 AixSystems 便携压缩包
cd /d "%~dp0..\"

where node >nul 2>nul || (echo 未检测到 Node.js,请先安装 Node 18+ & pause & exit /b 1)
where npm >nul 2>nul || (echo 未检测到 npm,请先安装 Node.js 后重试 & pause & exit /b 1)

echo ========================================
echo   打包 AixSystems 便携版压缩包
echo   产物可解压后直接在 Windows 上运行
echo ========================================
echo.

if not exist "code\node_modules\.bin\vite.cmd" (
  echo [1/5] 安装应用依赖...
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

echo [2/5] 构建 Web 产物...
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
  echo [3/5] 安装桌面端依赖...
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

echo [4/5] 构建便携版 exe...
pushd desktop
call npm run dist:portable
set ERR=%errorlevel%
popd
if %ERR% neq 0 (echo 便携版构建失败 & pause & exit /b 1)

set "PORTABLE_EXE="
for %%F in ("desktop\dist-installer\*portable*.exe") do set "PORTABLE_EXE=%%~fF"
if not defined PORTABLE_EXE (
  echo 未找到便携版 exe
  pause
  exit /b 1
)

set "PORTABLE_ROOT=results\portable"
set "PORTABLE_DIR=%PORTABLE_ROOT%\AixSystems-Windows-Portable"
set "PORTABLE_ZIP=%PORTABLE_ROOT%\AixSystems-Windows-Portable.zip"

if exist "%PORTABLE_DIR%" rmdir /s /q "%PORTABLE_DIR%"
if exist "%PORTABLE_ZIP%" del /f /q "%PORTABLE_ZIP%"
if not exist "%PORTABLE_ROOT%" mkdir "%PORTABLE_ROOT%"
mkdir "%PORTABLE_DIR%"

echo [5/5] 生成压缩包...
copy /y "%PORTABLE_EXE%" "%PORTABLE_DIR%\" >nul
copy /y "results\使用说明.md" "%PORTABLE_DIR%\" >nul
copy /y "LICENSE" "%PORTABLE_DIR%\" >nul

powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '%PORTABLE_DIR%\*' -DestinationPath '%PORTABLE_ZIP%'"
if errorlevel 1 (echo 压缩包生成失败 & pause & exit /b 1)

echo.
echo ==========================================
echo 便携压缩包已生成: %PORTABLE_ZIP%
echo ==========================================
start "" explorer "%PORTABLE_ROOT%"
pause
