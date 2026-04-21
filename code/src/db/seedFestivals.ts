// 节日种子扩充 - 按当前年份展开内置节日到 items 表
import { db } from './index';
import { nanoid } from 'nanoid';
import { BUILT_IN_FESTIVALS } from '@/config/festivals';
import { lunar2SolarTime } from '@/utils/lunar';

export async function seedFestivalsOfYear(year: number): Promise<number> {
  const key = `festivals_seeded_${year}`;
  const flag = await db.settings.get(key);
  if (flag?.value) return 0;                                 // 幂等

  const rows = BUILT_IN_FESTIVALS.map(f => {
    let t: number;
    if (f.type === 'lunar') {
      try { t = lunar2SolarTime(year, f.month, f.day); } catch { return null; }
    } else {
      t = new Date(year, f.month - 1, f.day).getTime();
    }
    return {
      id: nanoid(),
      type: 'festival' as const,
      title: f.name,
      startTime: t,
      allDay: true,
      isLunar: f.type === 'lunar',
      reminders: [{ offsetMs: -86_400_000, label: '提前 1 天' }],
      completeStatus: 'pending' as const,
      pinned: ['春节', '国庆节', '中秋节', '元旦'].includes(f.name),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }).filter(Boolean) as any[];

  if (rows.length) await db.items.bulkAdd(rows);
  await db.settings.put({ key, value: true });
  return rows.length;
}
