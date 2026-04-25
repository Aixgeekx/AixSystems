// 成长等级系统 - XP计算、等级称号、进度 (v0.25.0)
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db } from '@/db';
import {
  XP_PER_HABIT_CHECKIN, XP_PER_FOCUS_10MIN, XP_PER_DIARY,
  XP_PER_ITEM_DONE, XP_PER_GOAL_MILESTONE, XP_PER_GOAL_COMPLETE,
  XP_PER_MEMO, getLevel, LEVELS
} from '@/config/achievements';

export function useGameLevel() {
  return useLiveQuery(async () => {
    const [habits, habitLogs, sessions, diaries, items, goals, memos] = await Promise.all([
      db.habits.filter(h => !h.deletedAt).toArray(),
      db.habitLogs.toArray(),
      db.focusSessions.toArray(),
      db.diaries.filter(d => !d.deletedAt).toArray(),
      db.items.filter(i => !i.deletedAt).toArray(),
      db.goals.filter(g => !g.deletedAt).toArray(),
      db.memos.filter(m => !m.deletedAt).toArray()
    ]);

    const totalXp =
      habitLogs.length * XP_PER_HABIT_CHECKIN +
      Math.floor(sessions.reduce((s, v) => s + v.actualMs / 60_000, 0) / 10) * XP_PER_FOCUS_10MIN +
      diaries.length * XP_PER_DIARY +
      items.filter(i => i.completeStatus === 'done').length * XP_PER_ITEM_DONE +
      goals.reduce((s, g) => s + (g.milestones?.filter(m => m.done).length || 0), 0) * XP_PER_GOAL_MILESTONE +
      goals.filter(g => g.status === 'completed').length * XP_PER_GOAL_COMPLETE +
      memos.length * XP_PER_MEMO;

    const curLevel = getLevel(totalXp);
    const nextLevel = LEVELS.find(l => l.level === curLevel.level + 1);
    const levelProgress = nextLevel ? Math.round((totalXp - curLevel.xp) / (nextLevel.xp - curLevel.xp) * 100) : 100;
    const xpToNext = nextLevel ? nextLevel.xp - totalXp : 0;

    // 今日获得的XP
    const todayStart = dayjs().startOf('day').valueOf();
    const todayXp =
      habitLogs.filter(l => l.date >= todayStart).length * XP_PER_HABIT_CHECKIN +
      Math.floor(sessions.filter(s => s.startTime >= todayStart).reduce((s, v) => s + v.actualMs / 60_000, 0) / 10) * XP_PER_FOCUS_10MIN +
      diaries.filter(d => !d.deletedAt && d.createdAt >= todayStart).length * XP_PER_DIARY +
      items.filter(i => !i.deletedAt && i.completeStatus === 'done' && (i.completeTime || 0) >= todayStart).length * XP_PER_ITEM_DONE +
      memos.filter(m => !m.deletedAt && m.createdAt >= todayStart).length * XP_PER_MEMO;

    return { totalXp, level: curLevel.level, title: curLevel.title, icon: curLevel.icon, levelProgress, xpToNext, todayXp };
  }, []);
}
