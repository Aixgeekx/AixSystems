// 跨模块关联洞察引擎 - 发现习惯↔情绪↔专注↔目标间的隐藏关联 (v0.25.0)
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db } from '@/db';

export interface Insight {
  id: string;                              // 唯一标识
  category: 'habit_focus' | 'habit_mood' | 'focus_mood' | 'goal_habit' | 'habit_streak';
  title: string;                           // 简短标题,如 "运动日专注高28%"
  detail: string;                          // 详细描述
  confidence: 'high' | 'medium' | 'low';   // 置信度
  icon: string;                            // emoji 图标
  color: string;                           // 高亮色
  modules: string[];                       // 涉及的模块
}

const MIN_DAYS = 3;                       // 最少对比天数

function moodScore(mood: string | undefined): number {
  if (!mood) return 0;
  const map: Record<string, number> = { 'happy': 5, 'good': 4, 'neutral': 3, 'sad': 2, 'angry': 1, 'anxious': 1, 'excited': 5, 'tired': 2, 'calm': 4 };
  return map[mood] ?? 3;
}

export function useCorrelationInsights() {
  return useLiveQuery(async () => {
    const [habits, habitLogs, sessions, diaries, goals] = await Promise.all([
      db.habits.filter(h => !h.deletedAt).toArray(),
      db.habitLogs.toArray(),
      db.focusSessions.toArray(),
      db.diaries.filter(d => !d.deletedAt).toArray(),
      db.goals.filter(g => !g.deletedAt).toArray()
    ]);

    if (!habits.length || !habitLogs.length) return [] as Insight[];

    // 构建每日汇总: dateKey → { habitIds, focusMin, moodScore, diaryCount }
    const dayMap = new Map<number, { habitIds: Set<string>; focusMin: number; moods: number[]; diaries: number }>();

    for (const log of habitLogs) {
      const dk = dayjs(log.date).startOf('day').valueOf();
      if (!dayMap.has(dk)) dayMap.set(dk, { habitIds: new Set(), focusMin: 0, moods: [], diaries: 0 });
      dayMap.get(dk)!.habitIds.add(log.habitId);
    }
    for (const s of sessions) {
      const dk = dayjs(s.startTime).startOf('day').valueOf();
      if (!dayMap.has(dk)) dayMap.set(dk, { habitIds: new Set(), focusMin: 0, moods: [], diaries: 0 });
      dayMap.get(dk)!.focusMin += s.actualMs / 60_000;
    }
    for (const d of diaries) {
      const dk = dayjs(d.date).startOf('day').valueOf();
      if (!dayMap.has(dk)) dayMap.set(dk, { habitIds: new Set(), focusMin: 0, moods: [], diaries: 0 });
      const ms = moodScore(d.mood);
      if (ms > 0) dayMap.get(dk)!.moods.push(ms);
      dayMap.get(dk)!.diaries++;
    }

    const insights: Insight[] = [];

    for (const habit of habits) {
      const doneDays: { focusMin: number; moods: number[] }[] = [];
      const missDays: { focusMin: number; moods: number[] }[] = [];

      for (const [, day] of dayMap) {
        if (day.habitIds.has(habit.id)) doneDays.push({ focusMin: day.focusMin, moods: day.moods });
        else missDays.push({ focusMin: day.focusMin, moods: day.moods });
      }

      // 习惯→专注关联
      if (doneDays.length >= MIN_DAYS && missDays.length >= MIN_DAYS) {
        const doneAvg = doneDays.reduce((s, d) => s + d.focusMin, 0) / doneDays.length;
        const missAvg = missDays.reduce((s, d) => s + d.focusMin, 0) / missDays.length;
        if (doneAvg > missAvg + 5) {
          const pct = Math.round((doneAvg - missAvg) / Math.max(1, missAvg) * 100);
          const conf = doneDays.length >= 7 && missDays.length >= 7 ? 'high' as const : 'medium' as const;
          insights.push({
            id: `hf_${habit.id}`,
            category: 'habit_focus',
            title: `${habit.name}日专注高${pct}%`,
            detail: `在完成${habit.name}的日子里，你平均专注 ${Math.round(doneAvg)} 分钟，比未完成日（${Math.round(missAvg)} 分钟）高出 ${pct}%。每日坚持该习惯可能与更长的深度工作时间相关。`,
            confidence: conf,
            icon: '🔥',
            color: '#f59e0b',
            modules: ['习惯', '专注']
          });
        }
      }

      // 习惯→情绪关联
      const doneMoods = doneDays.flatMap(d => d.moods);
      const missMoods = missDays.flatMap(d => d.moods);
      if (doneMoods.length >= MIN_DAYS && missMoods.length >= MIN_DAYS) {
        const doneMoodAvg = doneMoods.reduce((s, v) => s + v, 0) / doneMoods.length;
        const missMoodAvg = missMoods.reduce((s, v) => s + v, 0) / missMoods.length;
        if (Math.abs(doneMoodAvg - missMoodAvg) > 0.5) {
          const better = doneMoodAvg > missMoodAvg;
          const pct = Math.round(Math.abs(doneMoodAvg - missMoodAvg) / 5 * 100);
          insights.push({
            id: `hm_${habit.id}`,
            category: 'habit_mood',
            title: `${habit.name}让心情${better ? '更' : '略'}好`,
            detail: `${habit.name}完成日的情绪评分平均 ${doneMoodAvg.toFixed(1)}，未完成日 ${missMoodAvg.toFixed(1)}。${better ? '该习惯可能是你的情绪助推器，有助于保持积极心态。' : '完成该习惯时你的情绪评分略低，或许可以考虑调整执行时间或方式。'}`,
            confidence: doneMoods.length >= 10 ? 'high' as const : 'medium' as const,
            icon: better ? '😊' : '🤔',
            color: better ? '#22c55e' : '#f59e0b',
            modules: ['习惯', '日记']
          });
        }
      }
    }

    // 专注→情绪整体关联
    const highFocusDays: number[] = [];
    const lowFocusDays: number[] = [];
    for (const [, day] of dayMap) {
      for (const m of day.moods) {
        if (day.focusMin > 30) highFocusDays.push(m);
        else lowFocusDays.push(m);
      }
    }
    if (highFocusDays.length >= MIN_DAYS && lowFocusDays.length >= MIN_DAYS) {
      const hfAvg = highFocusDays.reduce((s, v) => s + v, 0) / highFocusDays.length;
      const lfAvg = lowFocusDays.reduce((s, v) => s + v, 0) / lowFocusDays.length;
      if (hfAvg > lfAvg + 0.3) {
        insights.push({
          id: 'fm_global',
          category: 'focus_mood',
          title: '深度专注日情绪更佳',
          detail: `每日专注超30分钟的日期，情绪评分平均 ${hfAvg.toFixed(1)}，较低专注日 ${lfAvg.toFixed(1)}。深度工作可能与你的情绪健康正向相关。`,
          confidence: highFocusDays.length >= 10 ? 'high' as const : 'medium' as const,
          icon: '🧘',
          color: '#7c3aed',
          modules: ['专注', '日记']
        });
      }
    }

    // 习惯连续天数→专注质量关联
    interface StreakData { habitId: string; streak: number; focusMin: number; }
    const streakData: StreakData[] = [];
    const sortedDates = Array.from(dayMap.keys()).sort((a, b) => b - a); // 最新在前
    for (const habit of habits) {
      let streak = 0;
      for (const d of sortedDates) {
        const day = dayMap.get(d);
        if (day?.habitIds.has(habit.id)) { streak++; }
        else break;
      }
      const todayData = dayMap.get(sortedDates[0]);
      if (streak >= 5 && todayData) {
        streakData.push({ habitId: habit.id, streak, focusMin: todayData.focusMin });
      }
    }
    if (streakData.length >= 2) {
      const top = streakData.sort((a, b) => b.streak - a.streak)[0];
      const h = habits.find(h => h.id === top.habitId);
      if (h) {
        insights.push({
          id: `hs_${h.id}`,
          category: 'habit_streak',
          title: `${h.name}连续${top.streak}天`,
          detail: `你已连续 ${top.streak} 天完成「${h.name}」，这是当前最长的习惯连续记录。保持这条连胜链将大幅提升习惯稳定性。`,
          confidence: 'high',
          icon: '⚡',
          color: '#06b6d4',
          modules: ['习惯', '成长']
        });
      }
    }

    // 按置信度排序: high → medium → low
    return insights.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.confidence] - order[b.confidence];
    });
  }, []);
}
