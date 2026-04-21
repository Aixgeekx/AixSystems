# 在桌面创建 AixSystems 快捷方式 - 右键此文件选"用 PowerShell 运行"
# 生成 3 个快捷方式: 桌面版 / 浏览器版 / 开发模式

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$desktop = [Environment]::GetFolderPath('Desktop')
$shell = New-Object -ComObject WScript.Shell
$iconPath = Join-Path $here 'desktop\build\icon.ico'

function New-Shortcut($name, $target, $desc, $icon) {
  $path = Join-Path $desktop "$name.lnk"
  $sc = $shell.CreateShortcut($path)
  $sc.TargetPath = $target
  $sc.WorkingDirectory = Split-Path $target
  $sc.Description = $desc
  $sc.WindowStyle = 7                                     # 最小化启动
  if ($icon) { $sc.IconLocation = $icon }
  $sc.Save()
  Write-Host "已创建: $path"
}

New-Shortcut 'AixSystems(桌面版)'   (Join-Path $here '桌面版.bat')   '启动 AixSystems Electron 桌面版'        $iconPath
New-Shortcut 'AixSystems(浏览器版)' (Join-Path $here '启动.bat')     '浏览器打开 AixSystems (生产模式)'       $iconPath
New-Shortcut 'AixSystems(开发模式)' (Join-Path $here '开发.bat')     '浏览器打开 + 代码热更新,供修改代码使用' $iconPath

Write-Host ""
Write-Host "三个快捷方式已放到桌面。日常用「AixSystems(桌面版)」双击即可。"
Write-Host "按任意键关闭此窗口..."
[Console]::ReadKey() | Out-Null
