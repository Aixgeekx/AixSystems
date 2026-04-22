import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
CRLF = "\r\n"

BATS = {
    "_诊断.bat": r"""@echo off
title AixSystems - 环境诊断
cd /d "%~dp0"
echo [1] 当前目录 = %CD%
echo [2] bat 路径  = %~f0

where node >nul 2>nul
if errorlevel 1 (
  echo [3] Node.js 未安装
) else (
  echo [3] Node.js 已安装
  node -v
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [4] npm 未安装
) else (
  echo [4] npm 已安装
  call npm -v
)

if exist "code\package.json" (echo [5] code\package.json 存在) else (echo [5] 缺少 code\package.json)
if exist "desktop\package.json" (echo [6] desktop\package.json 存在) else (echo [6] 缺少 desktop\package.json)
if exist "code\dist\index.html" (echo [7] code\dist\index.html 已存在) else (echo [7] 尚未构建 code\dist\index.html)
if exist "desktop\build\icon.ico" (echo [8] desktop\build\icon.ico 已存在) else (echo [8] 缺少 desktop\build\icon.ico)

echo.
echo === 诊断结束,按任意键关闭窗口 ===
pause >nul
""",

    "启动.bat": r"""@echo off
title AixSystems - 浏览器启动 (生产模式)
cd /d "%~dp0code"
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
""",

    "开发.bat": r"""@echo off
title AixSystems - 浏览器启动 (开发模式 - 热更新)
cd /d "%~dp0code"
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
""",

    "打包.bat": r"""@echo off
title 打包 AixSystems 为 .exe 安装包
cd /d "%~dp0"

where node >nul 2>nul || (echo 未检测到 Node.js,请先安装 Node 18+ & pause & exit /b 1)
where npm >nul 2>nul || (echo 未检测到 npm,请先安装 Node.js 后重试 & pause & exit /b 1)

echo ========================================
echo   打包 AixSystems 为 Windows 安装包
echo   首次运行约 5-10 分钟,会下载 electron-builder (约 100MB)
echo ========================================
echo.

rem 1. 确保 code 依赖
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

rem 2. 构建最新的 dist
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

rem 3. 确保 desktop 依赖
if not exist "desktop\node_modules\.bin\electron-builder.cmd" (
  echo [3/4] 安装 Electron + electron-builder...
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

rem 4. 调用 electron-builder (图标已固化于 desktop/build/,需重生成见 Aix_tools/gen_icon_v2.py)
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
""",

    "打包-便携版.bat": r"""@echo off
title 打包 AixSystems 便携压缩包
cd /d "%~dp0"

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

powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '%PORTABLE_DIR%\\*' -DestinationPath '%PORTABLE_ZIP%'"
if errorlevel 1 (echo 压缩包生成失败 & pause & exit /b 1)

echo.
echo ==========================================
echo 便携压缩包已生成: %PORTABLE_ZIP%
echo ==========================================
start "" explorer "%PORTABLE_ROOT%"
pause
""",

    "桌面版.bat": r"""@echo off
title AixSystems - 桌面版
cd /d "%~dp0"
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
""",

    "桌面版-开发.bat": r"""@echo off
setlocal
title AixSystems - 桌面版 (开发模式 - 热更新)
cd /d "%~dp0"
echo 正在启动 AixSystems 桌面版 (开发模式)...

where node >nul 2>nul || (echo 未检测到 Node.js,请先安装 Node 18+ & pause & exit /b 1)
where npm >nul 2>nul || (echo 未检测到 npm,请先安装 Node.js 后重试 & pause & exit /b 1)

if not exist "code\node_modules\.bin\vite.cmd" (
  echo 正在安装应用依赖...
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

if not exist "desktop\node_modules\.bin\cross-env.cmd" (
  echo 正在安装 Electron,约 1 分钟...
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

if not exist "desktop\node_modules\.bin\electron.cmd" (
  echo 正在安装 Electron,约 1 分钟...
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
echo   AixSystems 桌面版 (开发模式)
echo   1. 启动 Vite dev server
echo   2. 等待服务就绪后启动 Electron 窗口
echo   修改 code/src/ 下文件窗口自动刷新
echo ========================================

start "AixSystems Vite Dev" cmd /k "cd /d ""%~dp0code"" && npm run dev -- --host 127.0.0.1 --port 5173 --strictPort"

set "VITE_URL=http://127.0.0.1:5173"
set /a WAIT_COUNT=0

:wait_vite
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -UseBasicParsing '%VITE_URL%' -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>nul
if not errorlevel 1 goto vite_ready

set /a WAIT_COUNT+=1
if %WAIT_COUNT% geq 30 (
  echo Vite dev server 启动超时,请检查新开的 Vite 窗口日志
  pause
  exit /b 1
)

echo 等待 Vite dev server 就绪...
timeout /t 1 >nul
goto wait_vite

:vite_ready
cd desktop
call npm run dev
if errorlevel 1 (echo 启动失败 & pause & exit /b 1)
endlocal
""",

    "创建桌面快捷方式.bat": r"""@echo off
title 创建桌面快捷方式
cd /d "%~dp0"
echo 正在创建桌面快捷方式...

if not exist "%~dp0创建桌面快捷方式.ps1" (
  echo 缺少 创建桌面快捷方式.ps1
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0创建桌面快捷方式.ps1"
if errorlevel 1 (echo 创建失败,请检查 .ps1 文件 & pause & exit /b 1)
echo.
echo 完成! 按任意键关闭...
pause >nul
""",
}

results_dir = ROOT / "results"
results_dir.mkdir(exist_ok=True)

for name in BATS:
    root_fp = ROOT / name
    if root_fp.exists():
        root_fp.unlink()
        print(f"[DEL] root/{name}")

for name, body in BATS.items():
    body_r = body.replace("%~dp0", r"%~dp0..\\").replace("\\\\", "\\")
    fp = results_dir / name
    fp.write_bytes(body_r.replace("\n", CRLF).encode("gbk"))
    size = fp.stat().st_size
    print(f"[OK] results/{name} ({size} bytes)")
