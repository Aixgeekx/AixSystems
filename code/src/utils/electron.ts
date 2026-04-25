// 渲染进程通往 Electron 的桥 - 通过 window.sgx (preload 注入)
interface SgxBridge {
  isElectron: boolean;
  platform: string;
  saveBackup: (json: string) => Promise<string>;
  pickImport: () => Promise<string | null>;
  openDataDir: () => Promise<string>;
  getVersion: () => Promise<string>;
  getStorageStats: () => Promise<{
    root: string;
    total: number;
    free: number;
    used: number;
  }>;
  getSystemSnapshot: () => Promise<{
    platform: string;
    arch: string;
    hostname: string;
    cpuModel: string;
    cpuCores: number;
    totalMem: number;
    freeMem: number;
    uptime: number;
    diskRoot: string;
    diskTotal: number;
    diskFree: number;
    diskUsed: number;
  }>;
  getSystemManagerPlan: () => Promise<{
    startup: string[];
    privacy: string[];
    disk: string[];
    scan: string[];
    tools: string[];
  }>;
}

export function getElectron(): SgxBridge | null {
  return (window as any).sgx || null;
}

export function isElectron(): boolean {
  return !!getElectron();
}
