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
  scanSystemControl: () => Promise<{
    startup: { source: string; name: string; path: string }[];
    temp: { path: string; count: number; oldCount: number; totalBytes: number };
    ports: { protocol: string; local: string; state: string; pid: string }[];
    scannedAt: number;
  }>;
  getEmergencyToolkit: () => Promise<{ key: string; title: string; desc: string; preset: 'network' | 'clock' | 'hosts' | 'services'; risk: number }[]>;
  getPowerShellPresets: () => Promise<{ key: 'computer' | 'processes' | 'services' | 'network' | 'clock' | 'hosts'; title: string; risk: number; level: string; backup: string; rollback: string }[]>;
  runPowerShellPreset: (preset: 'computer' | 'processes' | 'services' | 'network' | 'clock' | 'hosts') => Promise<{ preset: string; title?: string; risk?: number; level?: string; backup?: string; rollback?: string; output: string; error?: string; shell?: string; fallback?: boolean; hash?: string; executedAt?: number; durationMs?: number; outputSummary?: string }>;
}

export function getElectron(): SgxBridge | null {
  return (window as any).sgx || null;
}

export function isElectron(): boolean {
  return !!getElectron();
}
