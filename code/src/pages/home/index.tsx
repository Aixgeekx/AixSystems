// 首页工作台 - 全局概览 + 快捷入口 + 本地模式信息 (v0.20.0 增强动画)
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Input, List, Progress, Row, Segmented, Space, Tag, Typography } from 'antd';
import {
  DatabaseOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  FireOutlined,
  HddOutlined,
  PlusOutlined,
  ReadOutlined,
  SearchOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import * as Icons from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useAppStore } from '@/stores/appStore';
import { downloadBackup } from '@/utils/export';
import { fmtDateTime, fmtFromNow } from '@/utils/time';
import { previewOf } from '@/utils/html';
import { getElectron, isElectron } from '@/utils/electron';
import { callAixModel } from '@/utils/aixModel';
import { useThemeVariants } from '@/hooks/useVariants';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ItemType } from '@/config/itemTypes';

type CompactFilter = 'all' | 'favorites' | 'agenda' | 'growth' | 'records' | 'tools' | 'settings';
type CompactApp = {
  key: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  group: Exclude<CompactFilter, 'all' | 'favorites'>;
  onClick: () => void;
};

function formatBytes(bytes?: number) {
  if (!bytes || bytes < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export default function HomePage() {
  const nav = useNavigate();
  const openItemForm = useAppStore(s => s.openItemForm);
  const electron = isElectron();
  const { theme, style, getPanelStyle } = useThemeVariants();
  const { aixApiUrl, aixApiKey, aixModel } = useSettingsStore();
  const [aixAnswer, setAixAnswer] = useState('');
  const [aixLoading, setAixLoading] = useState(false);
  const isDark = style === 'cyberpunk' || style === 'dark' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const [mode, setMode] = useState<'dashboard' | 'compact'>(() => (localStorage.getItem('home.viewMode') as 'dashboard' | 'compact') || 'compact');
  const [compactQuery, setCompactQuery] = useState('');
  const [compactFilter, setCompactFilter] = useState<CompactFilter>(() => (localStorage.getItem('home.compactFilter') as CompactFilter) || 'all');
  const [favoriteKeys, setFavoriteKeys] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('home.compactFavorites') || '[]'); } catch { return []; }
  });
  const [compactOrder, setCompactOrder] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('home.compactOrder') || '[]'); } catch { return []; }
  });
  const [draggingKey, setDraggingKey] = useState<string>();
  const [originStorage, setOriginStorage] = useState<{ usage?: number; quota?: number }>({});
  const [diskStats, setDiskStats] = useState<{ root: string; total: number; free: number; used: number } | null>(null);

  const dashboard = useLiveQuery(async () => {
    const [items, diaries, memos, sessions, lastBackup, goals, habits, habitLogs, queue] = await Promise.all([
      db.items.toArray(),
      db.diaries.toArray(),
      db.memos.toArray(),
      db.focusSessions.toArray(),
      db.cacheKv.get('lastBackupMeta'),
      db.goals.filter(g => !g.deletedAt && g.status === 'active').toArray(),
      db.habits.filter(h => !h.deletedAt).toArray(),
      db.habitLogs.toArray(),
      db.reminderQueue.toArray()
    ]);

    const activeItems = items.filter(item => !item.deletedAt);
    const todayStart = dayjs().startOf('day').valueOf();
    const todayEnd = dayjs().endOf('day').valueOf();
    const todayItems = activeItems.filter(item => item.startTime >= todayStart && item.startTime <= todayEnd);
    const done = todayItems.filter(item => item.completeStatus === 'done').length;
    const pending = todayItems.filter(item => item.completeStatus === 'pending').length;
    const overdueItems = activeItems.filter(item => item.completeStatus !== 'done' && item.startTime < todayStart).length;
    const weekItems = activeItems.filter(item => item.completeStatus !== 'done' && item.startTime >= todayStart && item.startTime <= dayjs().add(7, 'day').endOf('day').valueOf()).length;
    const pinnedNotes = memos.filter(memo => !memo.deletedAt && memo.pinned).slice(0, 4);
    const recentDiaries = diaries.filter(diary => !diary.deletedAt).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);
    const recentSessions = sessions.sort((a, b) => b.startTime - a.startTime).slice(0, 6);
    const qualitySample = sessions.slice().sort((a, b) => b.startTime - a.startTime).slice(0, 8).map(session => {
      const plannedRate = session.plannedMs ? Math.min(120, Math.round(session.actualMs / session.plannedMs * 100)) : 100;
      return session.giveUp ? Math.max(20, Math.round(plannedRate * 0.45)) : Math.min(100, plannedRate + (session.strictMode ? 8 : 0) + (session.actualMs >= 45 * 60_000 ? 6 : 0));
    });
    const focusQuality = qualitySample.length ? Math.round(qualitySample.reduce((sum, score) => sum + score, 0) / qualitySample.length) : 0;
    const focusTasks = todayItems.filter(item => item.completeStatus !== 'done' && ['schedule', 'checklist', 'book'].includes(item.type)).slice(0, 3);
    const todayFocusMinutes = Math.round(sessions.filter(session => session.startTime >= todayStart && session.startTime <= todayEnd).reduce((sum, session) => sum + session.actualMs / 60_000, 0));
    const focusMinutes = sessions.reduce((sum, session) => sum + session.actualMs / 60_000, 0);
    const hourlyFocus = sessions.reduce<Record<number, number>>((map, session) => {
      const hour = dayjs(session.startTime).hour();
      map[hour] = (map[hour] || 0) + session.actualMs / 60_000;
      return map;
    }, {});
    const peakFocusHour = Object.entries(hourlyFocus).sort((a, b) => b[1] - a[1])[0]?.[0];
    const focusTarget = 60;
    const focusGap = Math.max(0, focusTarget - todayFocusMinutes);
    const focusAlert = {
      todayFocusMinutes,
      focusGap,
      focusTarget,
      quality: focusQuality,
      tasks: focusTasks.map(item => item.title).filter(Boolean),
      peakHour: peakFocusHour ? `${peakFocusHour}:00-${String(Number(peakFocusHour) + 1).padStart(2, '0')}:00` : '完成一次专注后生成',
      level: todayFocusMinutes >= focusTarget && focusQuality >= 75 ? '达标' : todayFocusMinutes < 25 ? '空窗' : focusQuality && focusQuality < 55 ? '质量滑坡' : '缺口',
      advice: todayFocusMinutes >= focusTarget && focusQuality >= 75 ? '今日专注已达标，可以转入轻量复盘。' : focusQuality && focusQuality < 55 ? '近期质量滑坡，建议降低时长并开启白噪音。' : peakFocusHour ? `还差 ${focusGap} 分钟，建议在 ${peakFocusHour}:00 高能时段补一次专注。` : `还差 ${focusGap} 分钟，先启动 25 分钟番茄钟建立节奏。`
    };
    const riskGoalCount = goals.filter(goal => {
      const ms = goal.milestones || [];
      const progress = ms.length ? Math.round(ms.filter(m => m.done).length / ms.length * 100) : 0;
      const expected = goal.targetDate ? Math.min(100, Math.max(0, Math.round((Date.now() - goal.createdAt) / Math.max(1, goal.targetDate - goal.createdAt) * 100))) : 0;
      return goal.targetDate && (goal.targetDate < Date.now() || progress + 20 < expected);
    }).length;
    const habitBreakCount = habits.filter(habit => {
      const last = habitLogs.filter(log => log.habitId === habit.id).sort((a, b) => b.date - a.date)[0];
      return !last || dayjs().startOf('day').diff(dayjs(last.date).startOf('day'), 'day') >= 3;
    }).length;
    const reviewPressureCount = queue.filter(entry => entry.curveDay && !entry.completedAt && entry.fireAt >= todayStart && entry.fireAt <= dayjs().add(7, 'day').endOf('day').valueOf()).length;
    const overloadSignals = [
      { label: '今日待处理', value: pending, limit: 6, color: '#38bdf8', path: ROUTES.TODAY_DAY },
      { label: '逾期事项', value: overdueItems, limit: 3, color: '#ef4444', path: ROUTES.MATTER_ALL },
      { label: '7天事项', value: weekItems, limit: 18, color: '#0ea5e9', path: ROUTES.TODAY_WEEK },
      { label: '目标风险', value: riskGoalCount, limit: 2, color: '#f59e0b', path: ROUTES.GOAL },
      { label: '习惯中断', value: habitBreakCount, limit: 2, color: '#10b981', path: ROUTES.HABIT },
      { label: '复习压力', value: reviewPressureCount, limit: 8, color: '#8b5cf6', path: ROUTES.REVIEW }
    ].map(signal => ({ ...signal, percent: Math.min(100, Math.round(signal.value / signal.limit * 100)) }));
    const overloadScore = Math.round(overloadSignals.reduce((sum, signal) => sum + signal.percent, 0) / overloadSignals.length);
    const overloadLevel = overloadScore >= 72 ? '高压' : overloadScore >= 42 ? '紧绷' : '可控';
    const overloadAdvice = overloadScore >= 72 ? '先清逾期与今日待处理，再拆分目标和复习压力。' : overloadScore >= 42 ? '建议今天压缩新增事项，优先完成最短闭环。' : '当前控制负载可控，可以保持正常推进。';
    const alerts = [
      { label: '目标风险', value: riskGoalCount, color: '#ef4444', path: ROUTES.GOAL },
      { label: '习惯中断', value: habitBreakCount, color: '#f59e0b', path: ROUTES.HABIT },
      { label: '7天复习', value: reviewPressureCount, color: '#8b5cf6', path: ROUTES.REVIEW }
    ].filter(alert => alert.value > 0);

    return {
      activeItems,
      todayItems,
      done,
      pending,
      diaries,
      memos,
      pinnedNotes,
      recentDiaries,
      sessions: recentSessions,
      focusMinutes,
      focusAlert,
      lastBackup,
      alerts,
      overloadSignals,
      overloadScore,
      overloadLevel,
      overloadAdvice
    };
  }, []);

  async function quickBackup() {
    await downloadBackup();
  }

  const askAix = async (intent: string) => {
    if (!dashboard) return;
    setAixLoading(true);
    try {
      const fallback = intent === 'plan' ? '今日建议：先清理逾期/高压事项，再启动一次 25 分钟专注，最后写 3 句复盘。' : intent === 'review' ? '复盘建议：记录今天完成了什么、情绪波动来自哪里、明天最小推进动作是什么。' : '专注建议：选择当前最短闭环任务，开启 25 分钟番茄钟，结束后只保留一个后续动作。';
      const text = await callAixModel({ apiUrl: aixApiUrl, apiKey: aixApiKey, model: aixModel }, [
        { role: 'system', content: '你是 AixSystems 首页智能控制助手，只输出中文、短句、可执行建议。' },
        { role: 'user', content: JSON.stringify({ intent, todayItems: dashboard.todayItems.length, pending: dashboard.pending, done: dashboard.done, focus: dashboard.focusAlert, overload: dashboard.overloadLevel, alerts: dashboard.alerts }) }
      ]).catch(() => fallback);
      setAixAnswer(text);
    } finally {
      setAixLoading(false);
    }
  };

  const switchMode = (next: 'dashboard' | 'compact') => {
    setMode(next);
    localStorage.setItem('home.viewMode', next);
  };
  const switchCompactFilter = (next: CompactFilter) => {
    setCompactFilter(next);
    localStorage.setItem('home.compactFilter', next);
  };
  const toggleFavorite = (key: string) => {
    const next = favoriteKeys.includes(key) ? favoriteKeys.filter(item => item !== key) : [key, ...favoriteKeys];
    setFavoriteKeys(next);
    localStorage.setItem('home.compactFavorites', JSON.stringify(next));
  };
  const moveCompactApp = (fromKey: string, toKey: string) => {
    if (fromKey === toKey) return;
    const keys = compactApps.map(app => app.key);
    const current = [...compactOrder.filter(key => keys.includes(key)), ...keys.filter(key => !compactOrder.includes(key))];
    const fromIndex = current.indexOf(fromKey);
    const toIndex = current.indexOf(toKey);
    if (fromIndex < 0 || toIndex < 0) return;
    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);
    setCompactOrder(current);
    localStorage.setItem('home.compactOrder', JSON.stringify(current));
  };

  const total = dashboard?.todayItems.length || 0;
  const completion = total ? Math.round(((dashboard?.done || 0) / total) * 100) : 0;
  const diskPercent = diskStats?.total ? Math.round((diskStats.used / diskStats.total) * 100) : 0;
  const appPercent = originStorage.quota ? Math.round(((originStorage.usage || 0) / originStorage.quota) * 100) : 0;

  useEffect(() => {
    navigator.storage?.estimate?.().then(result => {
      setOriginStorage({ usage: result.usage, quota: result.quota });
    }).catch(() => setOriginStorage({}));
  }, []);

  useEffect(() => {
    if (!electron) return;
    getElectron()?.getStorageStats().then(setDiskStats).catch(() => setDiskStats(null));
  }, [electron]);

  const storageCards = useMemo(() => ([
    {
      title: '应用占用',
      value: formatBytes(originStorage.usage),
      desc: originStorage.quota ? `当前源配额 ${formatBytes(originStorage.quota)}` : '当前环境未返回配额信息',
      percent: appPercent,
      icon: <DatabaseOutlined />,
      color: '#2563eb'
    },
    {
      title: '磁盘已用',
      value: diskStats ? formatBytes(diskStats.used) : (electron ? '读取中' : '浏览器不可用'),
      desc: diskStats ? `${diskStats.root} 总量 ${formatBytes(diskStats.total)}` : (electron ? '正在读取本机磁盘状态' : '浏览器无法直接访问系统磁盘'),
      percent: diskPercent,
      icon: <HddOutlined />,
      color: '#7c3aed'
    },
    {
      title: '磁盘剩余',
      value: diskStats ? formatBytes(diskStats.free) : (electron ? '读取中' : '浏览器不可用'),
      desc: diskStats ? `可用空间 ${formatBytes(diskStats.free)}` : '用于评估备份和便携运行空间',
      percent: diskStats?.total ? 100 - diskPercent : 0,
      icon: <DownloadOutlined />,
      color: '#16a34a'
    }
  ]), [appPercent, diskPercent, diskStats, electron, originStorage.quota, originStorage.usage]);

  const shell = getPanelStyle() as any;
  const titleColor = shell.titleColor || shell.color || (isDark ? '#f8fafc' : '#0f172a');
  const textColor = shell.color || titleColor;
  const subColor = shell.subColor || (isDark ? 'rgba(226,232,240,0.74)' : '#64748b');
  const borderColor = isDark ? `${accent}33` : 'rgba(148,163,184,0.18)';
  const innerBg = isDark ? 'rgba(8,16,30,0.74)' : 'rgba(255,255,255,0.82)';
  const innerStrongBg = isDark ? 'rgba(6,12,24,0.9)' : 'rgba(255,255,255,0.92)';
  const tintedBg = (color: string) => isDark ? `${color}1a` : `${color}12`;

  const cardStyle: React.CSSProperties = {
    background: shell.background,
    backdropFilter: shell.backdropFilter,
    WebkitBackdropFilter: shell.WebkitBackdropFilter,
    border: shell.border,
    boxShadow: shell.boxShadow,
    color: textColor,
    borderRadius: 24,
    transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
  };

  const heroStyle: React.CSSProperties = {
    borderRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    background: isDark
      ? `linear-gradient(135deg, rgba(20,24,39,0.9) 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
      : `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)`,
    boxShadow: isDark
      ? `0 24px 64px -12px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05)`
      : `0 24px 64px -12px rgba(15,23,42,0.06), inset 0 1px 1px rgba(255,255,255,1)`,
    border: isDark ? `1px solid rgba(255,255,255,0.05)` : `1px solid rgba(255,255,255,0.8)`
  };

  const actionButtonStyle: React.CSSProperties = {
    borderRadius: 14,
    fontWeight: 600,
    height: 42,
    border: `1px solid ${borderColor}`,
    background: innerStrongBg,
    color: titleColor,
    boxShadow: isDark ? `0 0 18px ${accent}18` : '0 14px 28px rgba(15,23,42,0.08)',
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
  };

  const statTiles = [
    { label: '今日事项', value: dashboard?.todayItems.length || 0, icon: <CalendarOutlined />, color: '#38bdf8' },
    { label: '已完成', value: dashboard?.done || 0, icon: <CheckCircleOutlined />, color: '#22c55e' },
    { label: '待处理', value: dashboard?.pending || 0, icon: <ClockCircleOutlined />, color: '#60a5fa' },
    { label: '专注时长', value: `${Math.round(dashboard?.focusMinutes || 0)} 分`, icon: <FireOutlined />, color: '#f59e0b' }
  ];

  const countType = (type: ItemType) => dashboard?.activeItems.filter(item => item.type === type).length || 0;
  const routeGo = (path: string) => () => nav(path);
  const createType = (type: ItemType) => () => openItemForm(undefined, type);
  const compactApps: CompactApp[] = [
    { key: 'today', title: '每日先知', desc: `${dashboard?.todayItems.length || 0} 个今日事项`, icon: <Icons.BulbOutlined />, color: '#ff4d6d', group: 'agenda', onClick: routeGo(ROUTES.TODAY_DAY) },
    { key: 'week', title: '本周规划', desc: '一周事项节奏总览', icon: <Icons.CalendarOutlined />, color: '#0ea5e9', group: 'agenda', onClick: routeGo(ROUTES.TODAY_WEEK) },
    { key: 'month', title: '本月规划', desc: '月度事项与安排', icon: <Icons.ScheduleOutlined />, color: '#6366f1', group: 'agenda', onClick: routeGo(ROUTES.TODAY_MONTH) },
    { key: 'year', title: '年度规划', desc: '全年计划视图', icon: <Icons.BarChartOutlined />, color: '#14b8a6', group: 'agenda', onClick: routeGo(ROUTES.TODAY_YEAR) },
    { key: 'all', title: '全部事项', desc: `${dashboard?.activeItems.length || 0} 个活跃事项`, icon: <Icons.OrderedListOutlined />, color: '#38bdf8', group: 'agenda', onClick: routeGo(ROUTES.MATTER_ALL) },
    { key: 'schedule', title: '日程', desc: `${countType('schedule')} 条日程`, icon: <Icons.CalendarOutlined />, color: '#3b82f6', group: 'agenda', onClick: routeGo(ROUTES.MATTER_SCHEDULE) },
    { key: 'focus', title: '番茄专注', desc: `累计 ${Math.round(dashboard?.focusMinutes || 0)} 分钟`, icon: <Icons.HourglassOutlined />, color: '#6366f1', group: 'tools', onClick: routeGo(ROUTES.FOCUS) },
    { key: 'habit', title: '习惯打卡', desc: '成长系统 · 每日打卡', icon: <Icons.CheckCircleOutlined />, color: '#3b82f6', group: 'growth', onClick: routeGo(ROUTES.HABIT) },
    { key: 'goal', title: '目标', desc: '目标管理与里程碑', icon: <Icons.TrophyOutlined />, color: '#4f8cff', group: 'growth', onClick: routeGo(ROUTES.GOAL) },
    { key: 'growth', title: '成长仪表盘', desc: '徽章 / 复盘 / 趋势', icon: <Icons.DashboardOutlined />, color: '#22d3ee', group: 'growth', onClick: routeGo(ROUTES.GROWTH) },
    { key: 'review', title: '复习中心', desc: '今日待复习 / 未来节点', icon: <Icons.BookOutlined />, color: '#8b5cf6', group: 'growth', onClick: routeGo(ROUTES.REVIEW) },
    { key: 'memo', title: '备忘录', desc: `已有 ${dashboard?.memos?.length || 0} 篇备忘`, icon: <Icons.FileTextOutlined />, color: '#22c55e', group: 'records', onClick: routeGo(ROUTES.MEMO) },
    { key: 'diary', title: '日记', desc: `已有 ${dashboard?.diaries?.length || 0} 篇日记`, icon: <Icons.ReadOutlined />, color: '#ff6b45', group: 'records', onClick: routeGo(ROUTES.DIARY_CAL) },
    { key: 'syllabus', title: '课程表', desc: `${countType('syllabus')} 条课程记录`, icon: <Icons.TableOutlined />, color: '#06b6d4', group: 'agenda', onClick: routeGo('/home/syllabus') },
    { key: 'work', title: '上班表', desc: `${countType('work')} 条打卡记录`, icon: <Icons.SolutionOutlined />, color: '#38bdf8', group: 'agenda', onClick: createType('work') },
    { key: 'bill', title: '记账', desc: `${countType('bill')} 笔账单提醒`, icon: <Icons.WalletOutlined />, color: '#14b8a6', group: 'agenda', onClick: createType('bill') },
    { key: 'repay', title: '还款提醒', desc: '信用卡 / 贷款提醒', icon: <Icons.CreditCardOutlined />, color: '#7c3aed', group: 'agenda', onClick: createType('bill') },
    { key: 'loan', title: '贷款', desc: `${countType('loan')} 条贷款事项`, icon: <Icons.BankOutlined />, color: '#0ea5e9', group: 'agenda', onClick: routeGo('/home/loan') },
    { key: 'book', title: '读书笔记', desc: `${countType('book')} 本书在书架`, icon: <Icons.BookOutlined />, color: '#22c55e', group: 'records', onClick: createType('book') },
    { key: 'medicine', title: '喝水吃药', desc: `${countType('medicine')} 条健康提醒`, icon: <Icons.MedicineBoxOutlined />, color: '#38bdf8', group: 'tools', onClick: createType('medicine') },
    { key: 'run', title: '跑步健康', desc: `${countType('run')} 条跑步记录`, icon: <Icons.ThunderboltOutlined />, color: '#10b981', group: 'tools', onClick: createType('run') },
    { key: 'aunt', title: '生理期', desc: `${countType('aunt')} 条周期记录`, icon: <Icons.PlusCircleOutlined />, color: '#f472b6', group: 'tools', onClick: routeGo('/home/aunt') },
    { key: 'sleep', title: '睡眠', desc: `${countType('clock_sleep')} 条睡眠闹钟`, icon: <Icons.MoonOutlined />, color: '#6478f8', group: 'agenda', onClick: createType('clock_sleep') },
    { key: 'wakeup', title: '起床闹钟', desc: `${countType('clock_wakeup')} 条起床闹钟`, icon: <Icons.SunOutlined />, color: '#facc15', group: 'agenda', onClick: createType('clock_wakeup') },
    { key: 'countdown', title: '倒数纪念日', desc: `${countType('countdown') + countType('anniversary')} 个重要日期`, icon: <Icons.CalendarOutlined />, color: '#3b82f6', group: 'agenda', onClick: createType('countdown') },
    { key: 'birthday', title: '生日', desc: `${countType('birthday')} 个生日提醒`, icon: <Icons.GiftOutlined />, color: '#f59e0b', group: 'agenda', onClick: createType('birthday') },
    { key: 'anniversary', title: '纪念日', desc: `${countType('anniversary')} 个纪念日`, icon: <Icons.HeartOutlined />, color: '#ec4899', group: 'agenda', onClick: createType('anniversary') },
    { key: 'festival', title: '节日', desc: `${countType('festival')} 个节日提醒`, icon: <Icons.FlagOutlined />, color: '#f97316', group: 'agenda', onClick: createType('festival') },
    { key: 'dress', title: '穿衣搭配', desc: `${countType('dress')} 条搭配记录`, icon: <Icons.SkinOutlined />, color: '#f472b6', group: 'tools', onClick: createType('dress') },
    { key: 'workrest', title: '作息表', desc: `${countType('clock_workrest')} 条作息规则`, icon: <Icons.ClockCircleOutlined />, color: '#14b8a6', group: 'agenda', onClick: createType('clock_workrest') },
    { key: 'checklist', title: '清单', desc: `${countType('checklist')} 个清单事项`, icon: <Icons.CheckSquareOutlined />, color: '#10b981', group: 'agenda', onClick: routeGo(ROUTES.MATTER_CHECKLIST) },
    { key: 'importance', title: '四象限', desc: '重要紧急矩阵', icon: <Icons.AppstoreOutlined />, color: '#ef4444', group: 'agenda', onClick: routeGo(ROUTES.MATTER_IMPORTANCE) },
    { key: 'repeat', title: '重复事项', desc: `${dashboard?.activeItems.filter(item => !!item.repeatRule).length || 0} 个重复规则`, icon: <Icons.ReloadOutlined />, color: '#8b5cf6', group: 'agenda', onClick: routeGo(ROUTES.MATTER_REPEAT) },
    { key: 'search', title: '全局搜索', desc: '跨事项 / 日记 / 备忘录', icon: <Icons.SearchOutlined />, color: '#64748b', group: 'tools', onClick: routeGo(ROUTES.SEARCH) },
    { key: 'dataio', title: '导入导出', desc: '本地 JSON 备份恢复', icon: <Icons.CloudDownloadOutlined />, color: '#0ea5e9', group: 'tools', onClick: routeGo(ROUTES.DATAIO) },
    { key: 'widget', title: '桌面小组件', desc: '浮动提醒小窗', icon: <Icons.DesktopOutlined />, color: '#22d3ee', group: 'tools', onClick: routeGo(ROUTES.DESKTOP_WIDGET) },
    { key: 'theme', title: '主题换肤', desc: '27 款主题与字体', icon: <Icons.SkinOutlined />, color: '#ec4899', group: 'settings', onClick: routeGo(ROUTES.THEMESKIN) },
    { key: 'functions', title: '实用功能', desc: '工具合集与扩展入口', icon: <Icons.AppstoreOutlined />, color: '#06b6d4', group: 'tools', onClick: routeGo('/home/functions') },
    { key: 'menuSort', title: '菜单排序', desc: '自定义侧栏顺序', icon: <Icons.MenuOutlined />, color: '#64748b', group: 'settings', onClick: routeGo('/home/menusort') },
    { key: 'system', title: '系统设置', desc: '启动页 / 诊断 / 字体', icon: <Icons.SettingOutlined />, color: '#94a3b8', group: 'settings', onClick: routeGo(ROUTES.SYSTEM) },
    { key: 'classify', title: '分类管理', desc: '分类与文件夹', icon: <Icons.TagsOutlined />, color: '#14b8a6', group: 'settings', onClick: routeGo('/home/classify') },
    { key: 'trash', title: '回收站', desc: '恢复误删内容', icon: <Icons.DeleteOutlined />, color: '#ef4444', group: 'settings', onClick: routeGo('/home/trash') },
    { key: 'lock', title: '应用锁', desc: '本地密码保护', icon: <Icons.LockOutlined />, color: '#6366f1', group: 'settings', onClick: routeGo(ROUTES.APP_LOCK) },
    { key: 'user', title: '个人资料', desc: '昵称 / 签名 / 头像', icon: <Icons.UserOutlined />, color: '#38bdf8', group: 'settings', onClick: routeGo(ROUTES.USER) },
    { key: 'help', title: '帮助中心', desc: '新手引导与特性', icon: <Icons.QuestionCircleOutlined />, color: '#22c55e', group: 'settings', onClick: routeGo(ROUTES.HELP) },
    { key: 'feedback', title: '意见反馈', desc: '写入本地日志', icon: <Icons.MessageOutlined />, color: '#f97316', group: 'settings', onClick: routeGo(ROUTES.FEEDBACK) }
  ];
  const compactTemplates = [
    { key: 'study', label: '学习', color: '#8b5cf6', order: ['review', 'growth', 'goal', 'focus', 'book', 'diary', 'memo', 'syllabus'] },
    { key: 'work', label: '工作', color: '#0ea5e9', order: ['today', 'week', 'schedule', 'all', 'checklist', 'importance', 'focus', 'dataio'] },
    { key: 'health', label: '健康', color: '#10b981', order: ['habit', 'run', 'medicine', 'sleep', 'wakeup', 'aunt', 'focus', 'diary'] },
    { key: 'allround', label: '全能', color: '#f59e0b', order: compactApps.map(app => app.key) }
  ];
  const applyCompactTemplate = (order: string[]) => {
    const keys = compactApps.map(app => app.key);
    const next = [...order.filter(key => keys.includes(key)), ...keys.filter(key => !order.includes(key))];
    setCompactOrder(next);
    localStorage.setItem('home.compactOrder', JSON.stringify(next));
  };
  const compactOrderIndex = new Map(compactOrder.map((key, index) => [key, index]));
  const filteredCompactApps = compactApps
    .filter(app => compactFilter === 'all' || (compactFilter === 'favorites' ? favoriteKeys.includes(app.key) : app.group === compactFilter))
    .filter(app => !compactQuery.trim() || `${app.title} ${app.desc}`.toLowerCase().includes(compactQuery.toLowerCase()))
    .sort((a, b) => {
      const af = favoriteKeys.includes(a.key) ? 1 : 0;
      const bf = favoriteKeys.includes(b.key) ? 1 : 0;
      if (af !== bf) return bf - af;
      return (compactOrderIndex.get(a.key) ?? 999) - (compactOrderIndex.get(b.key) ?? 999) || a.title.localeCompare(b.title, 'zh-CN');
    });

  const modeSwitcher = (
    <Segmented
      value={mode}
      onChange={value => switchMode(value as 'dashboard' | 'compact')}
      options={[
        { label: '工作台', value: 'dashboard' },
        { label: '紧凑应用', value: 'compact' }
      ]}
      style={{
        padding: 4,
        borderRadius: 12,
        background: innerStrongBg,
        border: `1px solid ${borderColor}`
      }}
    />
  );

  if (mode === 'compact') {
    return (
      <Space direction="vertical" size={14} style={{ width: '100%' }}>
        <Card bordered={false} style={{ ...heroStyle, borderRadius: 24 }} bodyStyle={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <div>
              <Typography.Text style={{ color: subColor }}>{dayjs().format('HH:mm · YYYY 年 M 月 D 日')}</Typography.Text>
              <Typography.Title level={3} style={{ margin: '4px 0 0', color: titleColor, fontFamily: theme.fontFamily }}>
                AixSystems · 全功能紧凑模式
              </Typography.Title>
              <Typography.Text style={{ color: subColor, fontSize: 13 }}>
                像手机桌面一样，把事项、成长、记录、工具和设置全部压缩到一个入口面板；拖动卡片即可固定自己的控制台顺序。
              </Typography.Text>
            </div>
            {modeSwitcher}
          </div>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索事项、日记、备忘录"
            value={compactQuery}
            onChange={event => setCompactQuery(event.target.value)}
            onPressEnter={event => nav(`${ROUTES.SEARCH}?q=${encodeURIComponent((event.target as HTMLInputElement).value)}`)}
            style={{
              marginTop: 14,
              height: 40,
              borderRadius: 14,
              background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.75)',
              border: `1px solid ${borderColor}`,
              color: titleColor
            }}
          />
          <div style={{ overflowX: 'auto', paddingBottom: 2 }}>
            <Segmented
              value={compactFilter}
              onChange={value => switchCompactFilter(value as CompactFilter)}
              options={[
                { label: '全部', value: 'all' },
                { label: '收藏', value: 'favorites' },
                { label: '事项', value: 'agenda' },
                { label: '成长', value: 'growth' },
                { label: '记录', value: 'records' },
                { label: '工具', value: 'tools' },
                { label: '设置', value: 'settings' }
              ]}
              style={{
                marginTop: 12,
                minWidth: 560,
                padding: 4,
                borderRadius: 12,
                background: innerStrongBg,
                border: `1px solid ${borderColor}`
              }}
            />
          </div>
          <Space wrap size={8} style={{ marginTop: 12 }}>
            <Typography.Text style={{ color: subColor, fontSize: 12 }}>控制台模板</Typography.Text>
            {compactTemplates.map(template => (
              <Button
                key={template.key}
                size="small"
                onClick={() => applyCompactTemplate(template.order)}
                style={{ borderRadius: 999, color: template.color, borderColor: `${template.color}66`, background: isDark ? `${template.color}18` : `${template.color}10` }}
              >
                {template.label}
              </Button>
            ))}
          </Space>
        </Card>

        <Row gutter={[10, 10]}>
          {filteredCompactApps.map((app, index) => (
            <Col key={app.key} xs={12} md={8} xl={6}>
              <button
                type="button"
                draggable
                className="hover-lift anim-fade-in-up"
                onDragStart={event => {
                  setDraggingKey(app.key);
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', app.key);
                }}
                onDragOver={event => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                }}
                onDrop={event => {
                  event.preventDefault();
                  moveCompactApp(event.dataTransfer.getData('text/plain') || draggingKey || '', app.key);
                  setDraggingKey(undefined);
                }}
                onDragEnd={() => setDraggingKey(undefined)}
                onClick={app.onClick}
                style={{
                  width: '100%',
                  minHeight: 92,
                  border: `1px solid ${isDark ? `${app.color}33` : 'rgba(255,255,255,0.52)'}`,
                  borderRadius: 18,
                  padding: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  cursor: draggingKey ? 'grabbing' : 'grab',
                  opacity: draggingKey === app.key ? 0.58 : 1,
                  transform: draggingKey === app.key ? 'scale(0.98)' : undefined,
                  textAlign: 'left',
                  background: isDark ? `linear-gradient(135deg, ${app.color}1c, rgba(8,12,24,0.78))` : 'rgba(255,255,255,0.72)',
                  boxShadow: isDark ? `0 14px 34px ${app.color}12` : '0 12px 28px rgba(15,23,42,0.08)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  animationDelay: `${Math.min(index * 0.018, 0.36)}s`
                }}
              >
                <div
                  onClick={event => {
                    event.stopPropagation();
                    toggleFavorite(app.key);
                  }}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    color: favoriteKeys.includes(app.key) ? '#fbbf24' : subColor,
                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)'
                  }}
                >
                  <Icons.StarFilled style={{ fontSize: 12 }} />
                </div>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  background: app.color,
                  color: '#fff',
                  fontSize: 23,
                  boxShadow: `0 10px 24px ${app.color}44`
                }}>
                  {app.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: titleColor, fontWeight: 900, fontSize: 16, lineHeight: 1.2 }}>{app.title}</div>
                  <div style={{ color: subColor, fontSize: 13, marginTop: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.desc}</div>
                </div>
              </button>
            </Col>
          ))}
        </Row>
        {filteredCompactApps.length === 0 && (
          <Card bordered={false} style={{ ...cardStyle, borderRadius: 18 }} bodyStyle={{ padding: 18 }}>
            <Typography.Text style={{ color: subColor }}>
              当前筛选下没有匹配功能，试试切换分组或修改搜索词。
            </Typography.Text>
          </Card>
        )}
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      {/* Hero */}
      <Card
        bordered={false}
        className="anim-fade-in-up"
        style={heroStyle}
        bodyStyle={{ padding: 22 }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>{modeSwitcher}</div>
        <Row gutter={[20, 20]} align="middle">
          <Col xs={24} xl={13}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '10px 0' }}>
              <Typography.Text style={{ color: subColor, fontWeight: 500, letterSpacing: '0.05em' }}>
                {dayjs().format('YYYY / MM / DD')} · {dayjs().format('dddd')}
              </Typography.Text>
              <Typography.Title
                level={1}
                style={{
                  margin: '12px 0 16px',
                  color: titleColor,
                  lineHeight: 1.1,
                  fontWeight: 800,
                  fontFamily: theme.fontFamily,
                  letterSpacing: '-0.02em'
                }}
              >
                工作台
              </Typography.Title>
              <Typography.Paragraph
                style={{
                  marginBottom: 24,
                  color: subColor,
                  fontSize: 15,
                  maxWidth: 580,
                  lineHeight: 1.6
                }}
              >
                这是你的核心控制中心。所有事项、数据、目标和复盘均汇聚于此。保持专注，让每一天都有迹可循。
              </Typography.Paragraph>
              <Space wrap size={12}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  className="hover-scale"
                  style={{
                    borderRadius: 16,
                    height: 48,
                    padding: '0 24px',
                    fontSize: 15,
                    fontWeight: 600,
                    boxShadow: `0 12px 28px -6px ${accent}66`,
                    border: 'none',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                  onClick={() => openItemForm(undefined, 'schedule')}
                >
                  新建事项
                </Button>
                <Button
                  icon={<SearchOutlined />}
                  className="hover-lift"
                  style={{...actionButtonStyle, height: 48, borderRadius: 16, padding: '0 24px', fontSize: 15}}
                  onClick={() => nav(ROUTES.SEARCH)}
                >
                  搜索
                </Button>
              </Space>
            </div>
          </Col>

          <Col xs={24} xl={11}>
            <div
              className="anim-fade-in-up stagger-2"
              style={{
                borderRadius: 24,
                padding: 16,
                background: innerBg,
                border: `1px solid ${borderColor}`,
                backdropFilter: 'blur(8px)',
                transition: 'all 0.3s ease'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 12
                }}
              >
                <Typography.Text strong style={{ color: titleColor }}>
                  今日完成率
                </Typography.Text>
                <Tag
                  bordered={false}
                  style={{
                    background: tintedBg(accent),
                    color: titleColor,
                    marginInlineEnd: 0,
                    borderRadius: 8,
                    padding: '2px 10px',
                    fontWeight: 700
                  }}
                >
                  {completion}%
                </Tag>
              </div>
              <Progress
                percent={completion}
                strokeColor={accent}
                trailColor={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)'}
                showInfo={false}
                strokeLinecap="round"
                size={['100%', 8]}
              />
              <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
                {statTiles.map(tile => (
                  <Col span={12} key={tile.label}>
                    <div
                      className="hover-scale"
                      style={{
                        borderRadius: 18,
                        padding: '12px 12px 10px',
                        background: innerStrongBg,
                        border: `1px solid ${borderColor}`,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          color: tile.color,
                          fontSize: 16
                        }}
                      >
                        {tile.icon}
                        <span style={{ fontSize: 12, color: subColor }}>
                          {tile.label}
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 24,
                          fontWeight: 700,
                          color: titleColor
                        }}
                      >
                        {tile.value}
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
              <Typography.Text
                style={{
                  display: 'block',
                  marginTop: 12,
                  color: subColor,
                  fontSize: 12
                }}
              >
                {dashboard?.lastBackup?.value?.exportedAt
                  ? `最近备份 ${fmtFromNow(dashboard.lastBackup.value.exportedAt)}`
                  : '建议先创建第一份本地备份'}
              </Typography.Text>
            </div>
          </Col>
        </Row>
      </Card>

      {dashboard?.alerts?.length ? (
        <Card bordered={false} className="anim-fade-in-up stagger-2" style={{ ...cardStyle, borderRadius: 32 }} bodyStyle={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <Typography.Text style={{ color: subColor, fontWeight: 500, letterSpacing: '0.02em' }}>成长警报</Typography.Text>
              <Typography.Title level={4} style={{ margin: '6px 0 0', color: titleColor, fontWeight: 700 }}>需要今天处理的控制信号</Typography.Title>
            </div>
            <Space wrap size={10}>
              {dashboard.alerts.map((alert: any) => (
                <Button key={alert.label} onClick={() => nav(alert.path)} style={{ borderRadius: 12, color: alert.color, borderColor: `${alert.color}44`, background: tintedBg(alert.color), fontWeight: 600, padding: '0 16px' }}>
                  {alert.label} · <span style={{fontSize: 16, marginLeft: 4}}>{alert.value}</span>
                </Button>
              ))}
            </Space>
          </div>
        </Card>
      ) : null}

      <Card bordered={false} className="anim-fade-in-up stagger-2" style={{ ...cardStyle, borderRadius: 32 }} bodyStyle={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          <div>
            <Typography.Text style={{ color: subColor, fontWeight: 500, letterSpacing: '0.02em' }}>Aix 智能控制助手</Typography.Text>
            <Typography.Title level={4} style={{ margin: '6px 0 6px', color: titleColor, fontWeight: 700 }}>一键生成今日控制策略</Typography.Title>
            <Typography.Text style={{ color: subColor, fontSize: 13 }}>接入 Aix 模型后可基于今日事项、专注、成长警报生成个性化建议。</Typography.Text>
          </div>
          <Space wrap>
            <Button loading={aixLoading} onClick={() => askAix('plan')} style={{ borderRadius: 999 }}>今日计划</Button>
            <Button loading={aixLoading} onClick={() => askAix('focus')} style={{ borderRadius: 999 }}>专注建议</Button>
            <Button loading={aixLoading} onClick={() => askAix('review')} style={{ borderRadius: 999 }}>晚间复盘</Button>
          </Space>
        </div>
        {aixAnswer ? <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', color: titleColor, margin: 0 }}>{aixAnswer}</Typography.Paragraph> : null}
      </Card>

      <Card bordered={false} className="anim-fade-in-up stagger-2" style={{ ...cardStyle, borderRadius: 32 }} bodyStyle={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          <div>
            <Typography.Text style={{ color: subColor, fontWeight: 500, letterSpacing: '0.02em' }}>今日专注警报</Typography.Text>
            <Typography.Title level={4} style={{ margin: '6px 0 6px', color: titleColor, fontWeight: 700 }}>专注控制 · {dashboard?.focusAlert.level || '空窗'}</Typography.Title>
            <Typography.Text style={{ color: subColor, fontSize: 13 }}>{dashboard?.focusAlert.advice || '先启动 25 分钟番茄钟建立节奏。'}</Typography.Text>
          </div>
          <Button type="primary" icon={<FireOutlined />} onClick={() => nav(ROUTES.FOCUS)} style={{ borderRadius: 16, height: 44, padding: '0 24px', fontWeight: 600, boxShadow: `0 12px 28px -6px ${accent}66`, border: 'none' }}>开始专注</Button>
        </div>
        <Row gutter={[16, 16]}>
          {[
            { label: '今日已专注', value: `${dashboard?.focusAlert.todayFocusMinutes || 0} 分`, color: '#f59e0b' },
            { label: '距离目标', value: `${dashboard?.focusAlert.focusGap || 0} 分`, color: '#ef4444' },
            { label: '高能时段', value: dashboard?.focusAlert.peakHour || '完成一次专注后生成', color: '#22c55e' },
            { label: '质量评分', value: dashboard?.focusAlert.quality ? `${dashboard.focusAlert.quality} 分` : '暂无样本', color: '#8b5cf6' }
          ].map(signal => (
            <Col xs={24} md={12} xl={6} key={signal.label}>
              <div style={{ minHeight: 96, borderRadius: 18, padding: 14, background: tintedBg(signal.color), border: `1px solid ${signal.color}44` }}>
                <Typography.Text style={{ color: subColor, fontSize: 12 }}>{signal.label}</Typography.Text>
                <div style={{ marginTop: 8, color: titleColor, fontSize: 22, fontWeight: 800 }}>{signal.value}</div>
              </div>
            </Col>
          ))}
        </Row>
        {dashboard?.focusAlert.tasks?.length ? (
          <Space wrap size={8} style={{ marginTop: 14 }}>
            <Typography.Text style={{ color: subColor, fontSize: 12 }}>建议进入专注的事项</Typography.Text>
            {dashboard.focusAlert.tasks.map((task: string) => <Tag key={task} color="blue" style={{ borderRadius: 8 }}>{task}</Tag>)}
          </Space>
        ) : null}
      </Card>

      <Card bordered={false} className="anim-fade-in-up stagger-2" style={{ ...cardStyle, borderRadius: 32 }} bodyStyle={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          <div>
            <Typography.Text style={{ color: subColor, fontWeight: 500, letterSpacing: '0.02em' }}>事项过载雷达</Typography.Text>
            <Typography.Title level={4} style={{ margin: '6px 0 6px', color: titleColor, fontWeight: 700 }}>今日控制负载 · {dashboard?.overloadLevel || '可控'}</Typography.Title>
            <Typography.Text style={{ color: subColor, fontSize: 13 }}>{dashboard?.overloadAdvice || '当前控制负载可控，可以保持正常推进。'}</Typography.Text>
          </div>
          <Progress type="circle" percent={dashboard?.overloadScore || 0} size={82} strokeColor={(dashboard?.overloadScore || 0) >= 72 ? '#ef4444' : (dashboard?.overloadScore || 0) >= 42 ? '#f59e0b' : '#22c55e'} trailColor={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)'} />
        </div>
        <Row gutter={[16, 16]}>
          {dashboard?.overloadSignals.map((signal: any) => (
            <Col xs={24} sm={12} xl={4} key={signal.label}>
              <button type="button" onClick={() => nav(signal.path)} className="hover-lift" style={{ width: '100%', minHeight: 120, textAlign: 'left', cursor: 'pointer', borderRadius: 20, padding: 16, background: tintedBg(signal.color), border: `1px solid ${signal.color}33`, transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Typography.Text strong style={{ color: titleColor, fontSize: 13 }}>{signal.label}</Typography.Text>
                  <Tag style={{ marginInlineEnd: 0, borderRadius: 8, padding: '0 6px', fontWeight: 600 }} color={signal.percent >= 80 ? 'red' : signal.percent >= 50 ? 'gold' : 'green'}>{signal.value}</Tag>
                </Space>
                <Progress percent={signal.percent} showInfo={false} strokeColor={signal.color} trailColor={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)'} size={['100%', 6]} style={{ margin: '16px 0 8px' }} />
                <Typography.Text style={{ color: subColor, fontSize: 12 }}>阈值 {signal.limit} · {signal.percent >= 80 ? '需要削峰' : signal.percent >= 50 ? '保持警惕' : '负载正常'}</Typography.Text>
              </button>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {/* 快捷入口 */}
        <Col xs={24} xl={9}>
          <Card
            bordered={false}
            className="anim-fade-in-up stagger-2 hover-lift"
            style={{
              ...cardStyle,
              borderRadius: 32,
              height: '100%'
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Typography.Text style={{ color: subColor, fontWeight: 500, letterSpacing: '0.02em' }}>
              快捷入口
            </Typography.Text>
            <Typography.Title
              level={4}
              style={{ margin: '6px 0 16px', color: titleColor, fontWeight: 700 }}
            >
              常用模块直接进入
            </Typography.Title>
            <Row gutter={[10, 10]}>
              {[
                { label: '我的一天', path: ROUTES.TODAY_DAY, icon: <CalendarOutlined />, color: '#38bdf8' },
                { label: '备忘录', path: ROUTES.MEMO, icon: <ReadOutlined />, color: '#34d399' },
                { label: '日记', path: ROUTES.DIARY_CAL, icon: <ReadOutlined />, color: '#a78bfa' },
                { label: '番茄专注', path: ROUTES.FOCUS, icon: <FireOutlined />, color: '#f59e0b' },
                { label: '导入导出', path: ROUTES.DATAIO, icon: <DownloadOutlined />, color: '#22d3ee' },
                { label: '系统设置', path: ROUTES.SYSTEM, icon: <ClockCircleOutlined />, color: '#94a3b8' }
              ].map(entry => (
                <Col xs={12} key={entry.path}>
                  <button
                    type="button"
                    className="hover-lift"
                    onClick={() => nav(entry.path)}
                    style={{
                      width: '100%',
                      border: `1px solid ${borderColor}`,
                      textAlign: 'left',
                      padding: '14px 16px',
                      borderRadius: 20,
                      cursor: 'pointer',
                      background: innerStrongBg,
                      transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        display: 'grid',
                        placeItems: 'center',
                        background: tintedBg(entry.color),
                        color: entry.color,
                        fontSize: 18,
                        flexShrink: 0
                      }}
                    >
                      {entry.icon}
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: titleColor
                      }}
                    >
                      {entry.label}
                    </span>
                  </button>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* 存储控件 */}
        <Col xs={24} xl={15}>
          <Card
            bordered={false}
            className="anim-fade-in-up stagger-3 hover-lift"
            style={{ ...cardStyle, borderRadius: 32 }}
            bodyStyle={{ padding: 24 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 20
              }}
            >
              <div>
                <Typography.Text style={{ color: subColor, fontWeight: 500, letterSpacing: '0.02em' }}>
                  存储控件
                </Typography.Text>
                <Typography.Title
                  level={4}
                  style={{ margin: '6px 0 0', color: titleColor, fontWeight: 700 }}
                >
                  应用存储与设备空间
                </Typography.Title>
              </div>
              <Tag
                bordered={false}
                style={{
                  background: tintedBg(accent),
                  color: titleColor,
                  marginInlineEnd: 0,
                  borderRadius: 8,
                  padding: '2px 10px',
                  fontWeight: 600
                }}
              >
                {electron ? '桌面版实时读取' : '浏览器环境'}
              </Tag>
            </div>
            <Row gutter={[16, 16]}>
              {storageCards.map(card => (
                <Col key={card.title} xs={24} md={8}>
                  <div
                    className="hover-lift"
                    style={{
                      borderRadius: 24,
                      padding: 20,
                      background: tintedBg(card.color),
                      border: `1px solid ${card.color}22`,
                      minHeight: 176,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12
                      }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          display: 'grid',
                          placeItems: 'center',
                          background: innerStrongBg,
                          color: card.color
                        }}
                      >
                        {card.icon}
                      </div>
                      <Tag
                        bordered={false}
                        style={{
                          background: innerStrongBg,
                          color: titleColor,
                          marginInlineEnd: 0,
                          borderRadius: 8,
                          padding: '0 8px',
                          fontWeight: 600
                        }}
                      >
                        {card.percent}%
                      </Tag>
                    </div>
                    <div
                      style={{
                        marginTop: 14,
                        color: subColor,
                        fontSize: 12
                      }}
                    >
                      {card.title}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 24,
                        fontWeight: 700,
                        color: titleColor
                      }}
                    >
                      {card.value}
                    </div>
                    <Progress
                      percent={card.percent}
                      strokeColor={card.color}
                      showInfo={false}
                      style={{ margin: '14px 0 8px' }}
                      trailColor={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)'}
                      strokeLinecap="round"
                      size={['100%', 8]}
                    />
                    <Typography.Text
                      style={{
                        color: subColor,
                        fontSize: 12
                      }}
                    >
                      {card.desc}
                    </Typography.Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 本地内容速览 */}
      <Card
        bordered={false}
        className="anim-fade-in-up stagger-4"
        style={{ ...cardStyle, borderRadius: 32 }}
        bodyStyle={{ padding: 24 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 20
          }}
        >
          <div>
            <Typography.Text style={{ color: subColor, fontWeight: 500, letterSpacing: '0.02em' }}>
              本地内容速览
            </Typography.Text>
            <Typography.Title
              level={4}
              style={{ margin: '6px 0 0', color: titleColor, fontWeight: 700 }}
            >
              最近记录与备份状态
            </Typography.Title>
          </div>
          <Typography.Text style={{ color: subColor, fontSize: 13, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)', padding: '6px 12px', borderRadius: 8 }}>
            {dashboard?.lastBackup?.value?.exportedAt
              ? `最近备份 ${fmtDateTime(dashboard.lastBackup.value.exportedAt)}`
              : '暂无备份记录'}
          </Typography.Text>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <div
              className="hover-lift"
              style={{
                borderRadius: 24,
                padding: 20,
                background: tintedBg('#2563eb'),
                border: `1px solid rgba(37,99,235,0.2)`,
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 14
                }}
              >
                <Typography.Text strong style={{ color: titleColor, fontSize: 15 }}>
                  置顶备忘录
                </Typography.Text>
                <Button
                  type="link"
                  size="small"
                  icon={<ArrowRightOutlined />}
                  onClick={() => nav(ROUTES.MEMO)}
                  style={{ color: accent, padding: 0, fontWeight: 600 }}
                >
                  查看全部
                </Button>
              </div>
              {dashboard?.pinnedNotes?.length ? (
                <List
                  split={false}
                  dataSource={dashboard.pinnedNotes}
                  renderItem={(memo: any) => (
                    <List.Item style={{ paddingInline: 0, paddingBlock: 12 }}>
                      <div style={{ width: '100%' }}>
                        <div style={{ fontWeight: 700, color: titleColor, fontSize: 14 }}>
                          {memo.title || '无标题备忘'}
                        </div>
                        <div style={{ color: subColor, marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
                          {previewOf(memo.content, 60)}
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ margin: '20px 0', color: subColor, fontSize: 13, textAlign: 'center' }}>
                  暂无置顶备忘录
                </div>
              )}
            </div>
          </Col>

          <Col xs={24} lg={12}>
            <div
              className="hover-lift"
              style={{
                borderRadius: 24,
                padding: 20,
                background: tintedBg('#16a34a'),
                border: `1px solid rgba(22,163,74,0.2)`,
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 14
                }}
              >
                <Typography.Text strong style={{ color: titleColor, fontSize: 15 }}>
                  最近日记
                </Typography.Text>
                <Button
                  type="link"
                  size="small"
                  icon={<ArrowRightOutlined />}
                  onClick={() => nav(ROUTES.DIARY_CAL)}
                  style={{ color: accent, padding: 0, fontWeight: 600 }}
                >
                  查看全部
                </Button>
              </div>
              {dashboard?.recentDiaries?.length ? (
                <List
                  split={false}
                  dataSource={dashboard.recentDiaries}
                  renderItem={(diary: any) => (
                    <List.Item style={{ paddingInline: 0, paddingBlock: 12 }}>
                      <div style={{ width: '100%' }}>
                        <div style={{ fontWeight: 700, color: titleColor, fontSize: 14 }}>
                          {diary.title || '未命名日记'}
                        </div>
                        <div style={{ color: subColor, marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
                          {previewOf(diary.content, 60)}
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ margin: '20px 0', color: subColor, fontSize: 13, textAlign: 'center' }}>
                  暂无日记内容
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Card>
    </Space>
  );
}
