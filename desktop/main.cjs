// Electron 主进程 - 加载应用 + 文件 IPC + 打包后资源路径处理
const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const DEV = !!process.env.SGX_DEV;                                      // SGX_DEV=1 启用开发模式

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

Menu.setApplicationMenu(null);

app.whenReady().then(createWindow);

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
