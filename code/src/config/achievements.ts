// 成就徽章配置 - 基于数据自动解锁 (v0.25.0 扩展至22项)
export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;                                               // emoji 字符
  color: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_checkin', name: '初次打卡', desc: '完成第一次习惯打卡', icon: '🌱', color: '#22c55e' },
  { id: 'streak_7', name: '七日坚持', desc: '任意习惯连续打卡 7 天', icon: '🔥', color: '#f59e0b' },
  { id: 'streak_30', name: '月不落', desc: '任意习惯连续打卡 30 天', icon: '🌙', color: '#a78bfa' },
  { id: 'streak_60', name: '双月王者', desc: '任意习惯连续打卡 60 天', icon: '👑', color: '#fbbf24' },
  { id: 'streak_100', name: '百日传奇', desc: '任意习惯连续打卡 100 天', icon: '💎', color: '#06b6d4' },
  { id: 'focus_1', name: '专注入门', desc: '完成第一次专注会话', icon: '🎯', color: '#38bdf8' },
  { id: 'focus_10h', name: '专注达人', desc: '累计专注 10 小时', icon: '⏳', color: '#f97316' },
  { id: 'focus_100h', name: '心流大师', desc: '累计专注 100 小时', icon: '🧘', color: '#ec4899' },
  { id: 'focus_1000h', name: '时间领主', desc: '累计专注 1000 小时', icon: '⏰', color: '#ef4444' },
  { id: 'diary_1', name: '笔下生花', desc: '写下第一篇日记', icon: '✍️', color: '#8b5cf6' },
  { id: 'diary_30', name: '月度日记', desc: '累计 30 篇日记', icon: '📖', color: '#7c3aed' },
  { id: 'diary_100', name: '百篇巨著', desc: '累计 100 篇日记', icon: '📚', color: '#c084fc' },
  { id: 'goal_1', name: '目标达成', desc: '完成第一个目标', icon: '🏆', color: '#eab308' },
  { id: 'goal_5', name: '五连胜', desc: '累计达成 5 个目标', icon: '🌟', color: '#f59e0b' },
  { id: 'goal_10', name: '十全十美', desc: '累计达成 10 个目标', icon: '💫', color: '#22c55e' },
  { id: 'records_100', name: '数据积累', desc: '本地总记录数超过 100 条', icon: '💾', color: '#06b6d4' },
  { id: 'records_1000', name: '数据宝库', desc: '本地总记录数超过 1000 条', icon: '🗄️', color: '#6366f1' },
  { id: 'complete_day', name: '今日事毕', desc: '某天完成所有待办事项', icon: '✅', color: '#10b981' },
  { id: 'habits_3', name: '习惯养成', desc: '创建 3 个习惯', icon: '🌿', color: '#84cc16', },
  { id: 'habits_10', name: '习惯大师', desc: '创建 10 个习惯', icon: '🌳', color: '#22d3ee' },
  { id: 'week_perfect', name: '完美一周', desc: '连续 7 天完成所有习惯目标', icon: '🌈', color: '#f472b6' },
  { id: 'all_module', name: '全能选手', desc: '所有模块均有数据记录', icon: '🎪', color: '#fb923c' }
];

// XP与等级配置
export const XP_PER_HABIT_CHECKIN = 10;                       // 每次习惯打卡
export const XP_PER_FOCUS_10MIN = 5;                          // 每10分钟专注
export const XP_PER_DIARY = 15;                               // 每篇日记
export const XP_PER_ITEM_DONE = 5;                            // 完成事项
export const XP_PER_GOAL_MILESTONE = 30;                      // 完成目标里程碑
export const XP_PER_GOAL_COMPLETE = 100;                      // 达成目标
export const XP_PER_MEMO = 3;                                 // 每条备忘

export const LEVELS = [
  { level: 1, xp: 0, title: '初识成长', icon: '🌱' },
  { level: 2, xp: 120, title: '入门学徒', icon: '📘' },
  { level: 3, xp: 360, title: '进阶行者', icon: '⚡' },
  { level: 4, xp: 720, title: '自律达人', icon: '🔥' },
  { level: 5, xp: 1500, title: '成长专家', icon: '🎯' },
  { level: 6, xp: 2800, title: '心流大师', icon: '🧘' },
  { level: 7, xp: 4800, title: '时间宗师', icon: '👑' },
  { level: 8, xp: 7500, title: '黑科技传说', icon: '💎' },
  { level: 9, xp: 11000, title: '成长神话', icon: '🌟' },
  { level: 10, xp: 16000, title: 'Aix至尊', icon: '🏆' }
];

export function getLevel(xp: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) return LEVELS[i];
  }
  return LEVELS[0];
}
