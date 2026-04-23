// 成就徽章检测 hook - 基于数据计算解锁状态 (v0.21.6)
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db } from '@/db';
import { ACHIEVEMENTS } from '@/config/achievements';

function getMaxStreak(habitLogs: { habitId: string; date: number }[]) {
  const byHabit: Record<string, number[]> = {};
  for (const log of habitLogs) {
    const d = dayjs(log.date).startOf('day').valueOf();
    byHabit[log.habitId] = byHabit[log.habitId] || [];
    if (!byHabit[log.habitId].includes(d)) byHabit[log.habitId].push(d);
  }
  let max = 0;
  for (const dates of Object.values(byHabit)) {
    const sorted = dates.sort((a, b) => b - a);
    let streak = 0;
    let check = dayjs().startOf('day');
    for (const d of sorted) {
      const dd = dayjs(d).startOf('day');
      if (dd.isSame(check, 'day')) { streak++; check = check.subtract(1, 'day'); }
      else if (dd.isSame(check.subtract(1, 'day'), 'day')) { streak++; check = dd; }
      else break;
    }
    max = Math.max(max, streak);
  }
  return max;
}

export function useAchievements() {
  return useLiveQuery(async () => {
    const [habits, habitLogs, sessions, diaries, goals, items, unlockedRaw] = await Promise.all([
      db.habits.filter(h => !h.deletedAt).toArray(),
      db.habitLogs.toArray(),
      db.focusSessions.toArray(),
      db.diaries.filter(d => !d.deletedAt).toArray(),
      db.goals.filter(g => !g.deletedAt).toArray(),
      db.items.filter(i => !i.deletedAt).toArray(),
      db.cacheKv.get('achievements_unlocked')
    ]);
    const unlocked: Set<string> = new Set(unlockedRaw?.value || []);
    const totalFocusMin = sessions.reduce((s, v) => s + v.actualMs / 60_000, 0);
    const maxStreak = getMaxStreak(habitLogs);
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const totalRecords = habits.length + habitLogs.length + sessions.length + diaries.length + goals.length + items.length;
    const hasCompleteDay = items.length > 0 && items.some(i => {
      const d = dayjs(i.startTime).startOf('day').valueOf();
      const dayItems = items.filter(x => !x.deletedAt && dayjs(x.startTime).startOf('day').valueOf() === d);
      return dayItems.length > 0 && dayItems.every(x => x.completeStatus === 'done');
    });

    const newlyUnlocked: string[] = [];
    const check = (id: string, cond: boolean) => {
      if (cond && !unlocked.has(id)) { unlocked.add(id); newlyUnlocked.push(id); }
    };
    check('first_checkin', habitLogs.length > 0);
    check('streak_7', maxStreak >= 7);
    check('streak_30', maxStreak >= 30);
    check('focus_1', sessions.length > 0);
    check('focus_10h', totalFocusMin >= 600);
    check('focus_100h', totalFocusMin >= 6000);
    check('diary_1', diaries.length > 0);
    check('goal_1', completedGoals > 0);
    check('records_100', totalRecords >= 100);
    check('complete_day', hasCompleteDay);

    if (newlyUnlocked.length > 0) {
      await db.cacheKv.put({ key: 'achievements_unlocked', value: Array.from(unlocked) });
    }

    const list = ACHIEVEMENTS.map(a => ({ ...a, unlocked: unlocked.has(a.id) }));
    return { list, unlockedCount: unlocked.size, total: ACHIEVEMENTS.length, newlyUnlocked };
  }, []);
}
