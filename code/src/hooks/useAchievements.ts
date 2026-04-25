// 成就徽章检测 hook - 基于数据计算解锁状态 (v0.25.0 扩展至22项)
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
    const [habits, habitLogs, sessions, diaries, goals, items, memos, unlockedRaw] = await Promise.all([
      db.habits.filter(h => !h.deletedAt).toArray(),
      db.habitLogs.toArray(),
      db.focusSessions.toArray(),
      db.diaries.filter(d => !d.deletedAt).toArray(),
      db.goals.filter(g => !g.deletedAt).toArray(),
      db.items.filter(i => !i.deletedAt).toArray(),
      db.memos.filter(m => !m.deletedAt).toArray(),
      db.cacheKv.get('achievements_unlocked')
    ]);
    const unlocked: Set<string> = new Set(unlockedRaw?.value || []);
    const totalFocusMin = sessions.reduce((s, v) => s + v.actualMs / 60_000, 0);
    const totalFocusH = Math.floor(totalFocusMin / 60);
    const maxStreak = getMaxStreak(habitLogs);
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const totalRecords = habits.length + habitLogs.length + sessions.length + diaries.length + goals.length + items.length + memos.length;
    const hasCompleteDay = items.length > 0 && items.some(i => {
      const d = dayjs(i.startTime).startOf('day').valueOf();
      const dayItems = items.filter(x => !x.deletedAt && dayjs(x.startTime).startOf('day').valueOf() === d);
      return dayItems.length > 0 && dayItems.every(x => x.completeStatus === 'done');
    });
    const hasPerfectWeek = habits.length > 0 && (() => {
      for (let w = 0; w < 12; w++) {
        const ws = dayjs().subtract(w, 'week').startOf('week');
        let allDaysDone = true;
        for (let d = 0; d < 7; d++) {
          const dd = ws.add(d, 'day').startOf('day').valueOf();
          const dayDone = habits.every(h => habitLogs.some(l => l.habitId === h.id && dayjs(l.date).startOf('day').valueOf() === dd));
          if (!dayDone) { allDaysDone = false; break; }
        }
        if (allDaysDone) return true;
      }
      return false;
    })();
    const hasAllModule = habits.length > 0 && habitLogs.length > 0 && sessions.length > 0 && diaries.length > 0 && goals.length > 0 && items.length > 0 && memos.length > 0;

    const newlyUnlocked: string[] = [];
    const check = (id: string, cond: boolean) => {
      if (cond && !unlocked.has(id)) { unlocked.add(id); newlyUnlocked.push(id); }
    };
    check('first_checkin', habitLogs.length > 0);
    check('streak_7', maxStreak >= 7);
    check('streak_30', maxStreak >= 30);
    check('streak_60', maxStreak >= 60);
    check('streak_100', maxStreak >= 100);
    check('focus_1', sessions.length > 0);
    check('focus_10h', totalFocusMin >= 600);
    check('focus_100h', totalFocusMin >= 6000);
    check('focus_1000h', totalFocusH >= 1000);
    check('diary_1', diaries.length > 0);
    check('diary_30', diaries.length >= 30);
    check('diary_100', diaries.length >= 100);
    check('goal_1', completedGoals >= 1);
    check('goal_5', completedGoals >= 5);
    check('goal_10', completedGoals >= 10);
    check('records_100', totalRecords >= 100);
    check('records_1000', totalRecords >= 1000);
    check('complete_day', hasCompleteDay);
    check('habits_3', habits.length >= 3);
    check('habits_10', habits.length >= 10);
    check('week_perfect', hasPerfectWeek);
    check('all_module', hasAllModule);

    if (newlyUnlocked.length > 0) {
      await db.cacheKv.put({ key: 'achievements_unlocked', value: Array.from(unlocked) });
    }

    const list = ACHIEVEMENTS.map(a => ({ ...a, unlocked: unlocked.has(a.id) }));
    return { list, unlockedCount: unlocked.size, total: ACHIEVEMENTS.length, newlyUnlocked };
  }, []);
}
