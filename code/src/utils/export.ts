// JSON 全量导入/导出 - 本地备份。Electron 下直写 data/ 目录,浏览器下载 blob
import { db } from '@/db';
import { getElectron } from './electron';

export async function exportAll(): Promise<Blob> {                    // 导出全库
  const payload: Record<string, any[]> = {};
  const tables = db.tables;
  for (const t of tables) {
    payload[t.name] = await t.toArray();
  }
  const wrapper = { version: 1, exportedAt: Date.now(), data: payload };
  const json = JSON.stringify(wrapper, null, 2);
  return new Blob([json], { type: 'application/json' });
}

export async function downloadBackup(): Promise<{ ok: boolean; path?: string; msg: string }> {
  const blob = await exportAll();
  const electron = getElectron();
  if (electron) {                                                       // 桌面版 - 直写文件系统
    try {
      const text = await blob.text();
      const p = await electron.saveBackup(text);
      return { ok: true, path: p, msg: `已保存到 ${p}` };
    } catch (e: any) { return { ok: false, msg: '保存失败: ' + e.message }; }
  }
  // 浏览器版 - 触发浏览器下载
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aixsystems-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { ok: true, msg: '已触发浏览器下载' };
}

export async function importAll(json: string, merge = false): Promise<{ ok: boolean; msg: string }> {
  try {
    const parsed = JSON.parse(json);
    const data = parsed.data || parsed;
    await db.transaction('rw', db.tables, async () => {
      for (const t of db.tables) {
        const rows = data[t.name];
        if (!Array.isArray(rows)) continue;
        if (!merge) await t.clear();
        await t.bulkPut(rows);
      }
    });
    return { ok: true, msg: `导入成功,共 ${Object.keys(data).length} 张表` };
  } catch (e: any) {
    return { ok: false, msg: '导入失败: ' + e.message };
  }
}

export async function pickAndImport(merge = false) {                    // 桌面版走原生选择器
  const electron = getElectron();
  if (!electron) throw new Error('仅桌面版支持');
  const json = await electron.pickImport();
  if (!json) return { ok: false, msg: '未选择文件' };
  return importAll(json, merge);
}
