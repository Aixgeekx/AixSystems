// 成就徽章配置 - 基于数据自动解锁 (v0.21.6 成长激励)
export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;                                               // emoji 字符
  color: string;
  condition: 'first_checkin' | 'streak_7' | 'streak_30' | 'focus_1' | 'focus_10h' | 'focus_100h' | 'diary_1' | 'goal_1' | 'records_100' | 'complete_day';
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_checkin', name: '初次打卡', desc: '完成第一次习惯打卡', icon: '🌱', color: '#22c55e', condition: 'first_checkin' },
  { id: 'streak_7', name: '七日坚持', desc: '任意习惯连续打卡 7 天', icon: '🔥', color: '#f59e0b', condition: 'streak_7' },
  { id: 'streak_30', name: '月不落', desc: '任意习惯连续打卡 30 天', icon: '🌙', color: '#a78bfa', condition: 'streak_30' },
  { id: 'focus_1', name: '专注入门', desc: '完成第一次专注会话', icon: '🎯', color: '#38bdf8', condition: 'focus_1' },
  { id: 'focus_10h', name: '专注达人', desc: '累计专注时长达到 10 小时', icon: '⏳', color: '#f97316', condition: 'focus_10h' },
  { id: 'focus_100h', name: '心流大师', desc: '累计专注时长达到 100 小时', icon: '🧘', color: '#ec4899', condition: 'focus_100h' },
  { id: 'diary_1', name: '笔下生花', desc: '写下第一篇日记', icon: '✍️', color: '#8b5cf6', condition: 'diary_1' },
  { id: 'goal_1', name: '目标达成', desc: '完成第一个目标', icon: '🏆', color: '#eab308', condition: 'goal_1' },
  { id: 'records_100', name: '数据积累', desc: '本地总记录数超过 100 条', icon: '💾', color: '#06b6d4', condition: 'records_100' },
  { id: 'complete_day', name: '今日事毕', desc: '某天完成所有待办事项', icon: '✅', color: '#10b981', condition: 'complete_day' }
];
