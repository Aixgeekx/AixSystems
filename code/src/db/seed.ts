// 用户资料初始签名
import { db } from './index';
import { nanoid } from 'nanoid';
import { BUILT_IN_CLASSIFY } from '@/config/constants';
import { THEMES, DEFAULT_THEME } from '@/config/themes';
import { seedFestivalsOfYear } from './seedFestivals';

export async function seedIfEmpty() {                      // 幂等种子
  const n = await db.classifies.count();
  if (n === 0) {
    await db.classifies.bulkAdd(BUILT_IN_CLASSIFY.map((c, i) => ({
      id: nanoid(), name: c.name, icon: c.icon, color: c.color, sortOrder: i
    })));
  }

  const t = await db.themes.count();
  if (t === 0) {
    await db.themes.bulkAdd(THEMES.map(th => ({
      key: th.key, label: th.label, isBuiltIn: true, brightness: 100, blur: 0,
      active: th.key === DEFAULT_THEME
    })));
  }

  const u = await db.userProfile.count();
  if (u === 0) {
    await db.userProfile.add({ id: 1, nickname: '我', signature: '时间管理,始于 AixSystems' });
  }

  const y = new Date().getFullYear();
  await seedFestivalsOfYear(y);
  await seedFestivalsOfYear(y + 1);                         // 提前铺下一年节日
}
