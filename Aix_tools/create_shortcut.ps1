$ws = New-Object -ComObject WScript.Shell
$s = $ws.CreateShortcut("C:\Users\123\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\OpenClaw Gateway.lnk")
$s.TargetPath = "cmd.exe"
$s.Arguments = "/c E:\Desktop\Aix_ai\AixApp\Aix_tools\start_openclaw.bat"
$s.WindowStyle = 7
$s.Save()