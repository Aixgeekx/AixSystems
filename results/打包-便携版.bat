@echo off
title 打包 AixSystems 便携压缩包
cd /d "%~dp0..\"

where node >nul 2>nul || (echo 未检测到 Node.js,请先安装 Node 18+ & pause & exit /b 1)
where npm >nul 2>nul || (echo 未检测到 npm,请先安装 Node.js 后重试 & pause & exit /b 1)

echo ========================================
echo   打包 AixSystems 便携版压缩包
echo   产物为解压即用的目录版,不会把所有资源压进单个 exe
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

echo [4/5] 构建便携目录...
pushd desktop
call npm run dist:portable
set ERR=%errorlevel%
popd
if %ERR% neq 0 (echo 便携目录构建失败 & pause & exit /b 1)

set "UNPACKED_DIR=desktop\dist-installer\win-unpacked"
if not exist "%UNPACKED_DIR%\AixSystems.exe" (
  echo 未找到便携目录产物
  pause
  exit /b 1
)

set "PORTABLE_ROOT=results\portable"
set "PORTABLE_DIR=%PORTABLE_ROOT%\AixSystems-Windows-Portable"
set "PORTABLE_ZIP=%PORTABLE_ROOT%\AixSystems-Windows-Portable.zip"

if exist "%PORTABLE_DIR%" rmdir /s /q "%PORTABLE_DIR%"
if exist "%PORTABLE_ZIP%" del /f /q "%PORTABLE_ZIP%"
if not exist "%PORTABLE_ROOT%" mkdir "%PORTABLE_ROOT%"
mkdir "%PORTABLE_DIR%" >nul

echo [5/5] 生成压缩包...
xcopy "%UNPACKED_DIR%\*" "%PORTABLE_DIR%\" /e /i /h /y >nul
type nul > "%PORTABLE_DIR%\AixSystems.portable"
> "%PORTABLE_DIR%\启动AixSystems.bat" (
  echo @echo off
  echo cd /d "%%~dp0..\"
  echo start "" "%%~dp0..\AixSystems.exe"
)
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
