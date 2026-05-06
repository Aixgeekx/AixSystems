// 时间管理日常洞察工具 - 基于本地 Item / Habit / HabitLog 的纯函数计算
import dayjs from 'dayjs';
import type { Item, Habit, HabitLog } from '@/models';

const SCHEDULE_TYPES = new Set(['schedule', 'checklist', 'work', 'course', 'absorbed']);  // schedule 类
const AGENDA_TYPES = new Set(['schedule', 'checklist', 'work', 'course', 'absorbed', 'wakeup', 'sleep']);  // 含起床/睡眠

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
  const todayItems = items.filter(item => {                                  // 过滤脏数据：endTime 不能早于 startTime
    if (item.deletedAt || !SCHEDULE_TYPES.has(String(item.type))) return false;
    if (item.startTime < todayStart || item.startTime > todayEnd) return false;
    if (item.endTime !== undefined && item.endTime < item.startTime) return false;
    return true;
  });
  let plannedMinutes = 0;
  for (const item of todayItems) {
    const end = item.endTime || (item.startTime + 30 * 60_000);              // 无 endTime 默认 30 分钟
    plannedMinutes += Math.max(0, Math.round((end - item.startTime) / 60_000));
  }
  const ratio = Math.min(100, Math.round(plannedMinutes / (24 * 60) * 100));
  const level: TodaySaturation['level'] = ratio >= 60 ? '超载' : ratio >= 30 ? '紧凑' : '空闲';
  const advice = level === '超载' ? '今日已排满，建议把非紧急事项挪到明天。' : level === '紧凑' ? '节奏合理，专注完成核心事项。' : '今日尚有大量空闲，可以补一个目标推进。';
  return { plannedMinutes, itemCount: todayItems.length, ratio, level, advice };
}

export interface WeeklySaturationDay {
  dateKey: number;                                           // 当天 startOf('day') 时间戳
  dateLabel: string;                                         // MM-DD
  weekdayLabel: string;                                      // 周一/周二...
  plannedMinutes: number;                                    // 当天 schedule 类计划分钟
  ratio: number;                                             // 0-100 占 24h 的比例
  isToday: boolean;
}

export function computeWeeklySaturationTrend(items: Item[]): WeeklySaturationDay[] {  // 过去 7 天（含今天）饱和度趋势
  const todayStart = dayjs().startOf('day').valueOf();
  const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const result: WeeklySaturationDay[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const dayStart = dayjs().subtract(offset, 'day').startOf('day');
    const dayStartMs = dayStart.valueOf();
    const dayEndMs = dayStart.endOf('day').valueOf();
    const dayItems = items.filter(item => !item.deletedAt && SCHEDULE_TYPES.has(String(item.type)) && item.startTime >= dayStartMs && item.startTime <= dayEndMs);
    let planned = 0;
    for (const item of dayItems) {
      const end = item.endTime || (item.startTime + 30 * 60_000);
      planned += Math.max(0, Math.round((end - item.startTime) / 60_000));
    }
    result.push({
      dateKey: dayStartMs,
      dateLabel: dayStart.format('MM-DD'),
      weekdayLabel: weekdayLabels[dayStart.day()],
      plannedMinutes: planned,
      ratio: Math.min(100, Math.round(planned / (24 * 60) * 100)),
      isToday: dayStartMs === todayStart
    });
  }
  return result;
}

export interface HabitStreak {
  habitId: string;
  name: string;
  color: string;
  currentStreak: number;                                     // 当前连续打卡天数
  longestStreak: number;                                     // 历史最长连击
  yesterdayDone: boolean;                                    // 昨日是否已打卡（用于醒目标记中断风险）
  todayDone: boolean;                                        // 今日是否已打卡
  breakDays: number;                                         // 距上一次打卡的天数（0=今日，1=昨日，>=2 已断签；99=从未打卡）
}

export function computeHabitStreaks(habits: Habit[], logs: HabitLog[], topN = 5): HabitStreak[] {
  const todayKey = dayjs().startOf('day').valueOf();
  const yesterdayKey = todayKey - 86_400_000;
  const result: HabitStreak[] = [];
  for (const habit of habits) {
    if (habit.deletedAt) continue;
    const dates = new Set(logs.filter(l => l.habitId === habit.id && l.count > 0).map(l => dayjs(l.date).startOf('day').valueOf()));
    let current = 0;
    let cursor = todayKey;
    while (dates.has(cursor)) { current += 1; cursor -= 86_400_000; }
    if (!dates.has(todayKey)) {  // 今日未打卡时，从昨天向前回溯算"待续连击"
      cursor = yesterdayKey; let back = 0;
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
    let breakDays = 99;                                                      // 默认从未打卡
    if (sorted.length) {
      const lastDone = sorted[sorted.length - 1];                            // 最后一次打卡
      const diff = Math.round((todayKey - lastDone) / 86_400_000);
      breakDays = diff < 0 ? 0 : diff;                                       // 未来记录视为今日已打卡
    }
    result.push({
      habitId: habit.id,
      name: habit.name,
      color: habit.color,
      currentStreak: current,
      longestStreak: longest,
      yesterdayDone: dates.has(yesterdayKey),
      todayDone: dates.has(todayKey),
      breakDays
    });
  }
  return result.sort((a, b) => b.currentStreak - a.currentStreak || b.longestStreak - a.longestStreak).slice(0, topN);
}

export type AgendaTimeSlot = '清晨' | '上午' | '下午' | '晚上';                // 时段四分

export function classifyAgendaSlot(hour: number): AgendaTimeSlot {            // 时段映射规则唯一处
  if (hour < 9) return '清晨';
  if (hour < 12) return '上午';
  if (hour < 18) return '下午';
  return '晚上';
}

export interface TomorrowAgendaEntry {
  itemId: string;
  title: string;
  type: string;
  startTime: number;
  startLabel: string;
  importance: number;
  timeSlot: AgendaTimeSlot;                                  // 所属时段（清晨/上午/下午/晚上）
}

export function computeTomorrowAgenda(items: Item[], topN = 5): TomorrowAgendaEntry[] {
  const start = dayjs().add(1, 'day').startOf('day').valueOf();
  const end = dayjs().add(1, 'day').endOf('day').valueOf();
  return items
    .filter(item => !item.deletedAt && item.completeStatus !== 'done' && AGENDA_TYPES.has(String(item.type)) && item.startTime >= start && item.startTime <= end)
    .sort((a, b) => a.startTime - b.startTime || (b.importance || 0) - (a.importance || 0))
    .slice(0, topN)
    .map(item => ({
      itemId: item.id,
      title: item.title,
      type: String(item.type),
      startTime: item.startTime,
      startLabel: dayjs(item.startTime).format('HH:mm'),
      importance: Number(item.importance || 0),
      timeSlot: classifyAgendaSlot(dayjs(item.startTime).hour())
    }));
}

export interface TomorrowAgendaGroup {                                        // 时段分组结果
  slot: AgendaTimeSlot;
  entries: TomorrowAgendaEntry[];
}

export function groupTomorrowAgenda(entries: TomorrowAgendaEntry[]): TomorrowAgendaGroup[] {  // 按时段聚合，保持四段顺序
  const order: AgendaTimeSlot[] = ['清晨', '上午', '下午', '晚上'];
  const map = new Map<AgendaTimeSlot, TomorrowAgendaEntry[]>();
  for (const slot of order) map.set(slot, []);
  for (const entry of entries) map.get(entry.timeSlot)!.push(entry);
  return order.map(slot => ({ slot, entries: map.get(slot)! })).filter(group => group.entries.length > 0);
}
