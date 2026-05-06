# 静默启动 openclaw gateway 的 PowerShell wrapper
# 负责在 PATH 缺失时遍历 fnm 目录自动定位 openclaw
$ErrorActionPreference = 'SilentlyContinue'
$env:NODE_NO_WARNINGS = '1'

function Find-OpenClaw {
    # 1) PATH 中直接有
    $cmd = Get-Command openclaw.cmd -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    # 2) fnm default 符号链接目录
    $fnmDefault = "$env:LOCALAPPDATA\fnm_multishells\default"
    $p = Join-Path $fnmDefault 'openclaw.cmd'
    if (Test-Path $p) { return $p }

    # 3) 遍历 fnm_multishells 所有动态目录，按最后修改时间降序找最新一个
    $base = "$env:LOCALAPPDATA\fnm_multishells"
    if (Test-Path $base) {
        $dirs = Get-ChildItem $base -Directory | Sort-Object LastWriteTime -Descending
        foreach ($d in $dirs) {
            $p = Join-Path $d.FullName 'openclaw.cmd'
            if (Test-Path $p) { return $p }
        }
    }

    # 4) 全局 npm prefix
    $globalPaths = @(
        "$env:APPDATA\npm\openclaw.cmd"
        "$env:PROGRAMFILES\nodejs\openclaw.cmd"
        "C:\Program Files\nodejs\openclaw.cmd"
    )
    foreach ($p in $globalPaths) {
        if (Test-Path $p) { return $p }
    }

    return $null
}

$openclaw = Find-OpenClaw
if ($openclaw) {
    & $openclaw gateway --force
} else {
    # 完全静默，不写日志也不弹窗
    exit 1
}
