// Electron 主进程 - 加载应用 + 文件 IPC + 打包后资源路径处理
const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { execFile } = require('node:child_process');
const crypto = require('node:crypto');

const DEV = !!process.env.SGX_DEV;                                      // SGX_DEV=1 启用开发模式
const PORTABLE_MARKERS = ['AixSystems.portable', 'portable.flag'];
const EXEC_DIR = app.isPackaged ? path.dirname(process.execPath) : '';
const PORTABLE_DIR = process.env.PORTABLE_EXECUTABLE_DIR
  ? path.resolve(process.env.PORTABLE_EXECUTABLE_DIR)
  : (EXEC_DIR && PORTABLE_MARKERS.some(name => fs.existsSync(path.join(EXEC_DIR, name))) ? EXEC_DIR : '');

if (PORTABLE_DIR) {
  const portableUserData = path.join(PORTABLE_DIR, 'userData');
  fs.mkdirSync(portableUserData, { recursive: true });
  app.setPath('userData', portableUserData);
  app.setPath('sessionData', portableUserData);
}

// 打包后 dist 在 resourcesPath/app-dist,源码运行时在 ../code/dist
function getDistIndex() {
  if (app.isPackaged) return path.join(process.resourcesPath, 'app-dist', 'index.html');
  return path.join(__dirname, '..', 'code', 'dist', 'index.html');
}

// 数据目录: 打包后用系统 userData,源码运行时用仓库根的 data/
function getDataDir() {
  if (app.isPackaged) return path.join(app.getPath('userData'), 'data');
  const root = path.resolve(__dirname, '..', 'data');
  return root;
}

function getDiskStats() {
  const target = getDataDir();
  const root = path.parse(target).root || target;
  const stat = fs.statfsSync(root);
  const total = stat.blocks * stat.bsize;
  const free = stat.bavail * stat.bsize;
  return {
    root,
    total,
    free,
    used: total - free
  };
}

function runCommand(file, args) {
  return new Promise(resolve => {
    execFile(file, args, { windowsHide: true, timeout: 5000, maxBuffer: 1024 * 1024 }, (error, stdout) => {
      resolve(error ? '' : stdout.toString());
    });
  });
}

function runCommandDetailed(file, args) {
  const started = Date.now();
  return new Promise(resolve => {
    execFile(file, args, { windowsHide: true, timeout: 7000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({ ok: !error, stdout: stdout?.toString() || '', stderr: stderr?.toString() || error?.message || '', durationMs: Date.now() - started });
    });
  });
}

async function runPowerShell7(script) {
  const args = ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script];
  const shells = ['pwsh.exe', 'powershell.exe'];
  for (const shellName of shells) {
    const result = await runCommandDetailed(shellName, args);
    if (result.ok && result.stdout) return { ...result, shell: shellName, fallback: shellName !== 'pwsh.exe' };
    if (shellName === shells[shells.length - 1]) return { ...result, shell: shellName, fallback: true };
  }
  return { ok: false, stdout: '', stderr: 'PowerShell 不可用', durationMs: 0, shell: 'none', fallback: true };
}

async function scanStartupItems() {
  const startupDir = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
  const fileItems = fs.existsSync(startupDir)
    ? fs.readdirSync(startupDir).slice(0, 20).map(name => ({ source: 'Startup 文件夹', name, path: path.join(startupDir, name) }))
    : [];
  const regText = await runCommand('reg', ['query', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run']);
  const regItems = regText.split(/\r?\n/).map(line => line.trim()).filter(line => /^\S+\s+REG_/.test(line)).slice(0, 20).map(line => ({ source: 'HKCU Run', name: line.split(/\s+REG_/)[0], path: line }));
  return [...fileItems, ...regItems];
}

function scanTempFiles() {
  const tempDir = os.tmpdir();
  const entries = fs.existsSync(tempDir) ? fs.readdirSync(tempDir, { withFileTypes: true }).slice(0, 300) : [];
  let totalBytes = 0;
  let oldCount = 0;
  const oldLimit = Date.now() - 7 * 24 * 60 * 60 * 1000;
  entries.forEach(entry => {
    try {
      const stat = fs.statSync(path.join(tempDir, entry.name));
      totalBytes += stat.size;
      if (stat.mtimeMs < oldLimit) oldCount += 1;
    } catch {}
  });
  return { path: tempDir, count: entries.length, oldCount, totalBytes };
}

async function scanPorts() {
  const text = await runCommand('netstat', ['-ano']);
  return text.split(/\r?\n/).map(line => line.trim()).filter(line => /^(TCP|UDP)\s+/i.test(line)).slice(0, 30).map(line => {
    const parts = line.split(/\s+/);
    return { protocol: parts[0], local: parts[1], state: parts.length === 5 ? parts[3] : 'LISTEN', pid: parts[parts.length - 1] };
  });
}

const POWERSHELL_PRESETS = {
  computer: {
    title: '电脑信息', risk: 12, level: '只读低风险', backup: '记录当前系统摘要与 Aix eventLog，不修改系统状态', rollback: '无需回滚，仅保留输出审计',
    script: 'Get-ComputerInfo | Select-Object CsName,WindowsProductName,OsArchitecture,OsBuildNumber | ConvertTo-Json -Compress'
  },
  processes: {
    title: '高占用进程', risk: 18, level: '只读低风险', backup: '记录进程快照，不结束进程', rollback: '无需回滚，关闭结果面板即可',
    script: 'Get-Process | Sort-Object CPU -Descending | Select-Object -First 8 ProcessName,Id,CPU,WorkingSet64 | ConvertTo-Json -Compress'
  },
  services: {
    title: '运行服务', risk: 22, level: '只读低风险', backup: '记录服务列表，不启动或停止服务', rollback: '无需回滚，保持系统服务原样',
    script: 'Get-Service | Where-Object Status -eq Running | Select-Object -First 12 Name,DisplayName,Status | ConvertTo-Json -Compress'
  },
  network: {
    title: '网络急救诊断', risk: 16, level: '只读低风险', backup: '记录 IP、DNS 和连通性摘要，不修改网络配置', rollback: '无需回滚，仅用于断网排查',
    script: 'Get-NetIPConfiguration | Select-Object InterfaceAlias,IPv4Address,DNSServer | ConvertTo-Json -Compress'
  },
  clock: {
    title: '时间同步检查', risk: 10, level: '只读低风险', backup: '记录系统时间与时区，不修改时间服务', rollback: '无需回滚，仅提示校准方向',
    script: 'Get-TimeZone | Select-Object Id,DisplayName,BaseUtcOffset | ConvertTo-Json -Compress'
  },
  hosts: {
    title: 'Hosts 安全检查', risk: 20, level: '只读低风险', backup: '读取 hosts 前 40 行，不写入文件', rollback: '无需回滚，未知条目只提示人工确认',
    script: 'Get-Content "$env:SystemRoot\\System32\\drivers\\etc\\hosts" -ErrorAction SilentlyContinue | Select-Object -First 40 | ConvertTo-Json -Compress'
  }
};

async function runPowerShellPreset(preset) {
  const item = POWERSHELL_PRESETS[preset];
  if (!item) return { preset, output: '', error: '未知 PowerShell 预设' };
  const executedAt = Date.now();
  const hash = crypto.createHash('sha256').update(`${preset}:${item.risk}:${item.script}`).digest('hex').slice(0, 16);
  const result = await runPowerShell7(item.script);
  const output = result.stdout.slice(0, 12000);
  return {
    preset,
    ...item,
    shell: result.shell,
    fallback: result.fallback,
    hash,
    executedAt,
    durationMs: result.durationMs,
    output,
    outputSummary: `shell=${result.shell}; hash=${hash}; duration=${result.durationMs}ms; chars=${output.length}`,
    error: output ? '' : (result.stderr || 'PowerShell 无输出或执行失败')
  };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: 'AixSystems · 时间管理系统',
    icon: path.join(__dirname, 'build', 'icon.png'),
    backgroundColor: '#f0f5ff',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,                                                    // 要用 preload 调用 Node API
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  if (DEV) {
    win.loadURL('http://127.0.0.1:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    const idx = getDistIndex();
    if (fs.existsSync(idx)) win.loadFile(idx);
    else win.loadURL('data:text/html,<h1 style="font-family:sans-serif;margin:40px">' +
      '请先在 code 目录运行 <code>npm run build</code> 生成 dist/</h1>');
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) { shell.openExternal(url); return { action: 'deny' }; }
    return { action: 'allow' };
  });
}

// IPC: 保存备份到本地文件系统
ipcMain.handle('sgx:save-backup', async (_, json) => {
  const dir = getDataDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const name = `aixsystems-backup-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now()}.json`;
  const full = path.join(dir, name);
  fs.writeFileSync(full, json, 'utf8');
  return full;
});

// IPC: 打开系统文件选择,读取 JSON 返回字符串
ipcMain.handle('sgx:pick-import', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: '选择 AixSystems 备份文件',
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (!filePaths?.[0]) return null;
  return fs.readFileSync(filePaths[0], 'utf8');
});

// IPC: 在资源管理器中打开数据目录
ipcMain.handle('sgx:open-data-dir', async () => {
  const dir = getDataDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  shell.openPath(dir);
  return dir;
});

// IPC: 返回版本号
ipcMain.handle('sgx:get-version', () => app.getVersion());
ipcMain.handle('sgx:get-storage-stats', () => getDiskStats());
ipcMain.handle('sgx:get-system-snapshot', () => {
  const disk = getDiskStats();
  const cpus = os.cpus();
  return {
    platform: process.platform,
    arch: process.arch,
    hostname: os.hostname(),
    cpuModel: cpus[0]?.model || 'Unknown CPU',
    cpuCores: cpus.length,
    totalMem: os.totalmem(),
    freeMem: os.freemem(),
    uptime: os.uptime(),
    diskRoot: disk.root,
    diskTotal: disk.total,
    diskFree: disk.free,
    diskUsed: disk.used
  };
});
ipcMain.handle('sgx:get-system-manager-plan', () => ({
  startup: ['扫描用户 Startup 文件夹', '扫描 HKCU Run 自启项', '标记高频启动项，默认只读不修改'],
  privacy: ['定位浏览器缓存与临时目录', '生成可清理清单', '清理前强制确认并备份路径'],
  disk: ['监控数据目录与安装盘容量', '识别大文件和旧安装包', '提醒导出备份后再清理'],
  scan: ['按扩展名扫描可疑脚本', '识别重复文件和超大附件', '所有删除动作进入人工确认'],
  tools: ['断网急救', '时间校准', '二维码生成', 'HOST 修改', '批量重命名', '端口扫描']
}));
ipcMain.handle('sgx:scan-system-control', async () => ({
  startup: await scanStartupItems(),
  temp: scanTempFiles(),
  ports: await scanPorts(),
  scannedAt: Date.now()
}));
ipcMain.handle('sgx:get-emergency-toolkit', () => [
  { key: 'network', title: '断网急救', desc: '查看网卡、IP 和 DNS 摘要', preset: 'network', risk: 16 },
  { key: 'clock', title: '时间校准', desc: '检查时区和系统时间服务线索', preset: 'clock', risk: 10 },
  { key: 'hosts', title: 'Hosts 检查', desc: '只读查看 hosts 前 40 行', preset: 'hosts', risk: 20 },
  { key: 'ports', title: '端口急救', desc: '复用端口占用扫描定位异常监听', preset: 'services', risk: 22 }
]);
ipcMain.handle('sgx:get-powershell-presets', () => Object.entries(POWERSHELL_PRESETS).map(([key, value]) => ({ key, title: value.title, risk: value.risk, level: value.level, backup: value.backup, rollback: value.rollback })));
ipcMain.handle('sgx:run-powershell-preset', async (_, preset) => runPowerShellPreset(preset));

Menu.setApplicationMenu(null);

app.whenReady().then(createWindow);

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
