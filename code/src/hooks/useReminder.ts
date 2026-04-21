// 提醒轮询 hook - 全应用启动一次,扫 reminderQueue 到期触发 OS 通知
import { useEffect, useRef } from 'react';
import { db } from '@/db';
import { notify, requestPerm } from '@/utils/notify';
import { REMINDER_POLL_MS } from '@/config/constants';

export function useReminder() {                                        // 挂在 App 根节点
  const t = useRef<number | null>(null);
  useEffect(() => {
    requestPerm();
    const tick = async () => {
      const nowTs = Date.now();
      const due = await db.reminderQueue.where('fired').equals(0 as any).toArray();
      const pending = due.filter(r => !r.fired && r.fireAt <= nowTs);
      for (const r of pending) {
        const item = await db.items.get(r.itemId);
        if (item) notify(item.title, item.description || '到点了,记得查看!');
        await db.reminderQueue.update(r.id, { fired: true });
      }
    };
    t.current = window.setInterval(tick, REMINDER_POLL_MS);
    tick();
    return () => { if (t.current) window.clearInterval(t.current); };
  }, []);
}

export async function rescheduleItemReminders(itemId: string) {        // 事项保存后重建队列
  const item = await db.items.get(itemId);
  await db.reminderQueue.where('itemId').equals(itemId).delete();
  if (!item || item.deletedAt) return;
  for (const r of item.reminders || []) {
    const fireAt = item.startTime + r.offsetMs;
    if (fireAt > Date.now()) {
      await db.reminderQueue.add({
        id: itemId + '_' + r.offsetMs, itemId, fireAt, fired: false
      });
    }
  }
}
