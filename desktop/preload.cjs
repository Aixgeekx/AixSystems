// Electron preload - 通过 contextBridge 向渲染进程注入安全的原生能力
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sgx', {
  isElectron: true,
  platform: process.platform,
  saveBackup: (json) => ipcRenderer.invoke('sgx:save-backup', json),      // 返回保存路径
  pickImport: () => ipcRenderer.invoke('sgx:pick-import'),                // 返回 JSON 字符串或 null
  openDataDir: () => ipcRenderer.invoke('sgx:open-data-dir'),             // 在资源管理器中打开 data/
  getVersion: () => ipcRenderer.invoke('sgx:get-version'),
  getStorageStats: () => ipcRenderer.invoke('sgx:get-storage-stats')
});
