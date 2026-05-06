// 时间管理日常洞察工具 - 基于本地 Item / Habit / HabitLog 的纯函数计算
import dayjs from 'dayjs';
import type { Item, Habit, HabitLog } from '@/models';

export interface TodaySaturation {
  plannedMinutes: number;                                    // 今日 schedule 类事项总计划分钟
  itemCount: number;                                         // 今日 schedule 类事项数
  ratio: number;                                             // 0-100 占 24h 的比例
  level: '空闲' | '紧凑' | '超载';
  advice: string;
}

export function computeTodaySaturation(items: Item[]): TodaySaturation {
  const todayStart = dayjs().startOf('day').valueOf();
  const todayEnd = dayjs().endOf('day').valueOf();
  const scheduleTypes = new Set(['schedule', 'checklist', 'work', 'course', 'absorbed']);
  const todayItems = items.filter(item => !item.deletedAt && scheduleTypes.has(String(item.type)) && item.startTime >= todayStart && item.startTime <= todayEnd);
  let plannedMinutes = 0;
  for (const item of todayItems) {
    const end = item.endTime || (item.startTime + 30 * 60_000);  // 无 endTime 默认 30 分钟
    plannedMinutes += Math.max(0, Math.round((end - item.startTime) / 60_000));
  }
  const ratio = Math.min(100, Math.round(plannedMinutes / (24 * 60) * 100));
  const level: TodaySaturation['level'] = ratio >= 60 ? '超载' : ratio >= 30 ? '紧凑' : '空闲';
  const advice = level === '超载' ? '今日已排满，建议把非紧急事项挪到明天。' : level === '紧凑' ? '节奏合理，专注完成核心事项。' : '今日尚有大量空闲，可以补一个目标推进。';
  return { plannedMinutes, itemCount: todayItems.length, ratio, level, advice };
}

export interface HabitStreak {
  habitId: string;
  name: string;
  color: string;
  currentStreak: number;                                     // 当前连续打卡天数
  longestStreak: number;                                     // 历史最长连击
}

export function computeHabitStreaks(habits: Habit[], logs: HabitLog[], topN = 5): HabitStreak[] {
  const todayKey = dayjs().startOf('day').valueOf();
  const result: HabitStreak[] = [];
  for (const habit of habits) {
    if (habit.deletedAt) continue;
    const dates = new Set(logs.filter(l => l.habitId === habit.id && l.count > 0).map(l => dayjs(l.date).startOf('day').valueOf()));
    let current = 0;
    let cursor = todayKey;
    while (dates.has(cursor)) { current += 1; cursor -= 86_400_000; }
    if (!dates.has(todayKey)) {  // 今日未打卡时，从昨天向前回溯算"待续连击"
      cursor = todayKey - 86_400_000; let back = 0;
      while (dates.has(cursor)) { back += 1; cursor -= 86_400_000; }
      current = back;
    }
    let longest = 0; let run = 0; let prevKey = -Infinity;
    const sorted = [...dates].sort((a, b) => a - b);
    for (const day of sorted) {
      run = day - prevKey === 86_400_000 ? run + 1 : 1;
      if (run > longest) longest = run;
      prevKey = day;
    }
    result.push({ habitId: habit.id, name: habit.name, color: habit.color, currentStreak: current, longestStreak: longest });
  }
  return result.sort((a, b) => b.currentStreak - a.currentStreak || b.longestStreak - a.longestStreak).slice(0, topN);
}

export interface TomorrowAgendaEntry {
  itemId: string;
  title: string;
  type: string;
  startTime: number;
  startLabel: string;
  importance: number;
}

export function computeTomorrowAgenda(items: Item[], topN = 5): TomorrowAgendaEntry[] {
  const start = dayjs().add(1, 'day').startOf('day').valueOf();
  const end = dayjs().add(1, 'day').endOf('day').valueOf();
  const scheduleTypes = new Set(['schedule', 'checklist', 'work', 'course', 'absorbed', 'wakeup', 'sleep']);
  return items
    .filter(item => !item.deletedAt && item.completeStatus !== 'done' && scheduleTypes.has(String(item.type)) && item.startTime >= start && item.startTime <= end)
    .sort((a, b) => a.startTime - b.startTime || (b.importance || 0) - (a.importance || 0))
    .slice(0, topN)
    .map(item => ({
      itemId: item.id,
      title: item.title,
      type: String(item.type),
      startTime: item.startTime,
      startLabel: dayjs(item.startTime).format('HH:mm'),
      importance: Number(item.importance || 0)
    }));
}
