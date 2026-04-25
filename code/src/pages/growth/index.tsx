// 成长仪表盘 - 整合习惯、目标、专注、事项的成长可视化 + 成就徽章 + 周期复盘 + 关联洞察 (v0.25.0)
import React, { Suspense, lazy } from 'react';
import { App as AntApp, Button, Card, Col, Progress, Row, Space, Statistic, Tag, Typography, Tabs, Tooltip } from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  FireOutlined,
  FlagOutlined,
  TrophyOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  LockOutlined,
  StarOutlined,
  BookOutlined,
  DownloadOutlined,
  ThunderboltOutlined,
  SmileOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db } from '@/db';
import { useThemeVariants } from '@/hooks/useVariants';
import { useSettingsStore } from '@/stores/settingsStore';
import { callAixModel } from '@/utils/aixModel';
import { useAchievements } from '@/hooks/useAchievements';
import { useGameLevel } from '@/hooks/useGameLevel';
import { useCorrelationInsights } from '@/hooks/useCorrelationInsights';

const ReactECharts = lazy(() => import('echarts-for-react'));

interface PeriodData {
  itemsDone: number;
  itemsTotal: number;
  focusMin: number;
  diaries: number;
  checkins: number;
}

function diffTag(now: number, prev: number) {
  if (prev === 0) return now > 0 ? { text: '新增', color: '#22c55e' as const } : { text: '持平', color: '#94a3b8' as const };
  const pct = Math.round((now - prev) / prev * 100);
  return pct >= 0 ? { text: `+${pct}%`, color: '#22c55e' as const } : { text: `${pct}%`, color: '#ef4444' as const };
}

function buildGrowthReport(dashboard: any, achievements: any) {
  const line = (name: string, data?: PeriodData, prev?: PeriodData) => data ? `| ${name} | ${data.itemsDone}/${data.itemsTotal} | ${data.focusMin} 分钟 | ${data.checkins} 次 | ${data.diaries} 篇 | ${diffTag(data.focusMin, prev?.focusMin || 0).text} |` : '';
  return `# AixSystems 成长复盘报告\n\n- 生成时间：${dayjs().format('YYYY-MM-DD HH:mm')}\n- 总事项：${dashboard.totalItems}\n- 总专注：${Math.round(dashboard.totalFocusMin)} 分钟\n- 习惯数：${dashboard.totalHabits}\n- 目标数：${dashboard.totalGoals}（已完成 ${dashboard.completedGoals}）\n- 成就：${achievements?.unlockedCount || 0}/${achievements?.total || 0}\n\n## 周期复盘\n\n| 周期 | 事项完成 | 专注时长 | 习惯打卡 | 日记 | 专注环比 |\n|---|---:|---:|---:|---:|---:|\n${line('本周', dashboard.summary.week, dashboard.summary.lastWeek)}\n${line('本月', dashboard.summary.month, dashboard.summary.lastMonth)}\n\n## 进行中目标\n\n${dashboard.activeGoalsList.length ? dashboard.activeGoalsList.map((g: any) => `- ${g.title}：${g.progress}%（${g.doneCount}/${g.totalCount}）`).join('\n') : '- 暂无进行中的目标'}\n`;
}

function buildGrowthHtmlReport(dashboard: any, achievements: any) {
  const cell = (data?: PeriodData, prev?: PeriodData) => data ? `<tr><td>${data.itemsDone}/${data.itemsTotal}</td><td>${data.focusMin} 分钟</td><td>${data.checkins} 次</td><td>${data.diaries} 篇</td><td>${diffTag(data.focusMin, prev?.focusMin || 0).text}</td></tr>` : '';
  const goals = dashboard.activeGoalsList.length ? dashboard.activeGoalsList.map((g: any) => `<li><span>${g.title}</span><b>${g.progress}%</b><em style="width:${g.progress}%"></em></li>`).join('') : '<li><span>暂无进行中的目标</span><b>0%</b><em style="width:0%"></em></li>';
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>AixSystems 成长报告</title><style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0f172a;color:#e2e8f0}.wrap{max-width:980px;margin:0 auto;padding:42px 24px}.hero{padding:34px;border-radius:28px;background:linear-gradient(135deg,#7c3aed,#06b6d4);box-shadow:0 30px 80px #0006}h1{margin:0 0 10px;font-size:36px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin:18px 0}.card{padding:20px;border-radius:22px;background:#ffffff12;border:1px solid #ffffff1f}.num{font-size:30px;font-weight:800;color:#fff}table{width:100%;border-collapse:collapse;overflow:hidden;border-radius:18px;background:#ffffff0d}th,td{padding:14px;text-align:left;border-bottom:1px solid #ffffff14}li{position:relative;list-style:none;margin:12px 0;padding:14px 16px;border-radius:16px;background:#ffffff0d;overflow:hidden}li em{position:absolute;left:0;bottom:0;height:4px;background:#22d3ee}li span,li b{position:relative;z-index:1}li b{float:right;color:#86efac}.section{margin-top:24px}</style></head><body><main class="wrap"><section class="hero"><p>${dayjs().format('YYYY-MM-DD HH:mm')}</p><h1>AixSystems 成长复盘报告</h1><p>用本地数据生成的个人成长控制台快照。</p></section><section class="grid"><div class="card"><p>总事项</p><div class="num">${dashboard.totalItems}</div></div><div class="card"><p>总专注</p><div class="num">${Math.round(dashboard.totalFocusMin)} 分</div></div><div class="card"><p>习惯数</p><div class="num">${dashboard.totalHabits}</div></div><div class="card"><p>成就</p><div class="num">${achievements?.unlockedCount || 0}/${achievements?.total || 0}</div></div></section><section class="section"><h2>周期复盘</h2><table><thead><tr><th>事项完成</th><th>专注时长</th><th>习惯打卡</th><th>日记</th><th>专注环比</th></tr></thead><tbody>${cell(dashboard.summary.week, dashboard.summary.lastWeek)}${cell(dashboard.summary.month, dashboard.summary.lastMonth)}</tbody></table></section><section class="section"><h2>进行中目标</h2><ul>${goals}</ul></section></main></body></html>`;
}

function buildGrowthShareCard(dashboard: any, achievements: any) {
  const score = Math.round((dashboard?.radar || []).reduce((sum: number, r: any) => sum + r.value, 0) / Math.max(1, dashboard?.radar?.length || 1));
  const radar = (dashboard?.radar || []).map((r: any) => `<span><b>${r.value}</b>${r.name}</span>`).join('');
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>AixSystems 成长分享卡</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#020617;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.card{width:720px;max-width:calc(100vw - 40px);padding:42px;border-radius:36px;color:#fff;background:radial-gradient(circle at 20% 0%,#22d3ee55,transparent 34%),linear-gradient(135deg,#111827,#4c1d95 55%,#0f172a);box-shadow:0 40px 120px #0008}.tag{color:#bae6fd;font-weight:700;letter-spacing:.14em}.score{font-size:112px;line-height:1;font-weight:900;margin:18px 0;background:linear-gradient(135deg,#fff,#67e8f9);-webkit-background-clip:text;color:transparent}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:28px}.grid span{padding:14px;border-radius:18px;background:#ffffff14;text-align:center}.grid b{display:block;font-size:24px;color:#86efac}.meta{display:flex;justify-content:space-between;margin-top:30px;color:#cbd5e1}</style></head><body><section class="card"><div class="tag">AIXSYSTEMS · GROWTH CONTROL</div><div class="score">${score}</div><h1>我的成长控制力快照</h1><p>本月专注 ${Math.round(dashboard.monthFocusMin || 0)} 分钟，成就 ${achievements?.unlockedCount || 0}/${achievements?.total || 0}，用离线本地数据持续掌控自己。</p><div class="grid">${radar}</div><div class="meta"><span>${dayjs().format('YYYY-MM-DD HH:mm')}</span><span>Local-first Growth System</span></div></section></body></html>`;
}

function downloadText(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function SummaryBlock({ data, prev, isDark, titleColor, subColor, cardBg, cardBorder }: { data?: PeriodData; prev?: PeriodData; isDark: boolean; titleColor: string; subColor: string; cardBg: string; cardBorder: string }) {
  if (!data) return <div style={{ color: subColor }}>加载中...</div>;
  const stats = [
    { label: '事项完成', value: data.itemsDone, total: data.itemsTotal, prevValue: prev?.itemsDone, icon: <CheckCircleOutlined />, color: '#38bdf8' },
    { label: '专注时长', value: data.focusMin, suffix: '分钟', prevValue: prev?.focusMin, icon: <FireOutlined />, color: '#f59e0b' },
    { label: '习惯打卡', value: data.checkins, suffix: '次', prevValue: prev?.checkins, icon: <CalendarOutlined />, color: '#a78bfa' },
    { label: '日记篇数', value: data.diaries, suffix: '篇', prevValue: prev?.diaries, icon: <BookOutlined />, color: '#34d399' }
  ];
  const completion = data.itemsTotal ? Math.round((data.itemsDone / data.itemsTotal) * 100) : 0;
  const hint = completion >= 80 ? '效率极高，保持这种状态！' : completion >= 50 ? '进度不错，继续推进。' : '还有很大提升空间，加油！';
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Paragraph style={{ color: subColor, margin: 0 }}>
        事项完成率 <strong style={{ color: titleColor }}>{completion}%</strong>，{hint}
      </Typography.Paragraph>
      <Row gutter={[12, 12]}>
        {stats.map(stat => {
          const d = stat.prevValue !== undefined ? diffTag(stat.value, stat.prevValue) : null;
          return (
            <Col span={12} key={stat.label}>
              <Card bordered={false} style={{ borderRadius: 18, background: cardBg, border: cardBorder }}>
                <Statistic title={<span style={{ color: subColor }}>{stat.icon} {stat.label}</span>} value={stat.value} suffix={stat.suffix} valueStyle={{ fontSize: 24, fontWeight: 700, color: stat.color }} />
                {d && (
                  <Tag style={{ marginTop: 8, borderRadius: 6, color: d.color, borderColor: d.color + '40', background: d.color + '10' }}>
                    {d.text}
                  </Tag>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>
    </Space>
  );
}

export default function GrowthPage() {
  const { message } = AntApp.useApp();
  const nav = useNavigate();
  const { theme } = useThemeVariants();
  const { aixApiUrl, aixApiKey, aixModel } = useSettingsStore();
  const [aixPlan, setAixPlan] = React.useState('');
  const [aixLoading, setAixLoading] = React.useState(false);
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

  const dashboard = useLiveQuery(async () => {
    const [items, diaries, memos, sessions, habits, habitLogs, goals, queue] = await Promise.all([
      db.items.toArray(),
      db.diaries.toArray(),
      db.memos.toArray(),
      db.focusSessions.toArray(),
      db.habits.filter(h => !h.deletedAt).toArray(),
      db.habitLogs.toArray(),
      db.goals.filter(g => !g.deletedAt).toArray(),
      db.reminderQueue.toArray()
    ]);

    const todayStart = dayjs().startOf('day').valueOf();
    const weekStart = dayjs().startOf('week').valueOf();
    const monthStart = dayjs().startOf('month').valueOf();

    const todayItems = items.filter(i => !i.deletedAt && i.startTime >= todayStart && i.startTime <= dayjs().endOf('day').valueOf());
    const weekFocus = sessions.filter(s => s.startTime >= weekStart).reduce((s, v) => s + v.actualMs / 60_000, 0);
    const monthFocus = sessions.filter(s => s.startTime >= monthStart).reduce((s, v) => s + v.actualMs / 60_000, 0);

    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');
    const completedReviews = queue.filter(q => q.completedAt).length;
    const radar = [
      { name: '专注', value: Math.min(100, Math.round(monthFocus / 600 * 100)) },
      { name: '习惯', value: habits.length ? Math.min(100, Math.round(habitLogs.filter(l => l.date >= monthStart).length / (habits.length * 21) * 100)) : 0 },
      { name: '目标', value: goals.length ? Math.min(100, Math.round((completedGoals.length + activeGoals.length * 0.45) / goals.length * 100)) : 0 },
      { name: '日记', value: Math.min(100, diaries.filter(d => !d.deletedAt && d.createdAt >= monthStart).length * 12) },
      { name: '复习', value: Math.min(100, completedReviews * 8) }
    ];
    const activeGoalsList = activeGoals.slice(0, 4).map(g => ({
      id: g.id,
      title: g.title,
      color: g.color,
      progress: g.milestones?.length ? Math.round((g.milestones.filter(m => m.done).length / g.milestones.length) * 100) : 0,
      doneCount: g.milestones?.filter(m => m.done).length || 0,
      totalCount: g.milestones?.length || 0
    }));

    // 习惯本周打卡分布
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
      const d = dayjs().subtract(6 - i, 'day');
      const start = d.startOf('day').valueOf();
      const end = d.endOf('day').valueOf();
      const count = habitLogs.filter(l => l.date >= start && l.date <= end).length;
      return { day: d.format('ddd'), count };
    });

    const weekStartTs = dayjs().startOf('week').valueOf();
    const weekEndTs = dayjs().endOf('week').valueOf();
    const lastWeekStartTs = dayjs().subtract(1, 'week').startOf('week').valueOf();
    const lastWeekEndTs = dayjs().subtract(1, 'week').endOf('week').valueOf();
    const monthStartTs = dayjs().startOf('month').valueOf();
    const monthEndTs = dayjs().endOf('month').valueOf();
    const lastMonthStartTs = dayjs().subtract(1, 'month').startOf('month').valueOf();
    const lastMonthEndTs = dayjs().subtract(1, 'month').endOf('month').valueOf();

    const mkPeriod = (s: number, e: number) => {
      const its = items.filter(i => !i.deletedAt && i.startTime >= s && i.startTime <= e);
      const foc = sessions.filter(x => x.startTime >= s && x.startTime <= e).reduce((sum, x) => sum + x.actualMs / 60_000, 0);
      return {
        itemsDone: its.filter(i => i.completeStatus === 'done').length,
        itemsTotal: its.length,
        focusMin: Math.round(foc),
        diaries: diaries.filter(d => !d.deletedAt && d.createdAt >= s && d.createdAt <= e).length,
        checkins: habitLogs.filter(l => l.date >= s && l.date <= e).length
      };
    };

    const growthAverage = Math.round(radar.reduce((sum, item) => sum + item.value, 0) / radar.length);
    const growthToken = {
      id: `AIX-GROW-${dayjs().format('YYYYMMDD')}-${growthAverage}`,
      score: growthAverage,
      level: growthAverage >= 78 ? '稳定掌控' : growthAverage >= 52 ? '加速恢复' : '先止损',
      action: growthAverage >= 78 ? '把当前高分行为固化为周模板。' : growthAverage >= 52 ? '补一段专注并推进一个目标里程碑。' : '只保留一个目标、一个习惯和一次短复盘。',
      signals: radar
    };

    return {
      totalItems: items.filter(i => !i.deletedAt).length,
      todayDone: todayItems.filter(i => i.completeStatus === 'done').length,
      todayTotal: todayItems.length,
      totalDiaries: diaries.filter(d => !d.deletedAt).length,
      totalMemos: memos.filter(m => !m.deletedAt).length,
      totalFocusMin: sessions.reduce((s, v) => s + v.actualMs / 60_000, 0),
      weekFocusMin: weekFocus,
      monthFocusMin: monthFocus,
      totalHabits: habits.length,
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      activeGoalsList,
      weekDays,
      radar,
      controlProjection: [30, 60, 90].map(days => {
        const focusGain = Math.min(28, Math.round(monthFocus / 600 * 18 + days / 9));
        const habitGain = habits.length ? Math.min(26, Math.round(habitLogs.filter(l => l.date >= monthStart).length / Math.max(1, habits.length) * 1.8 + days / 12)) : Math.round(days / 10);
        const goalGain = activeGoals.length ? Math.min(24, Math.round(activeGoalsList.reduce((sum, goal) => sum + goal.progress, 0) / Math.max(1, activeGoalsList.length) * 0.16 + days / 15)) : Math.round(days / 14);
        const diaryGain = Math.min(16, diaries.filter(d => !d.deletedAt && d.createdAt >= monthStart).length * 2 + Math.round(days / 22));
        const reviewGain = Math.min(12, completedReviews + Math.round(days / 18));
        const score = Math.min(100, Math.round(radar.reduce((sum, item) => sum + item.value, 0) / radar.length + focusGain + habitGain + goalGain + diaryGain + reviewGain));
        return {
          days,
          score,
          level: score >= 82 ? '稳定掌控' : score >= 58 ? '加速恢复' : '先止损',
          action: days === 30 ? '固定一个核心目标、两段专注和三次复盘' : days === 60 ? '把高分行为固化为周模板，削减低价值事项' : '沉淀个人控制系统，形成可迁移成长协议'
        };
      }),
      summary: {
        week: mkPeriod(weekStartTs, weekEndTs),
        lastWeek: mkPeriod(lastWeekStartTs, lastWeekEndTs),
        month: mkPeriod(monthStartTs, monthEndTs),
        lastMonth: mkPeriod(lastMonthStartTs, lastMonthEndTs)
      },
      growthToken
    };
  }, []);

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';
  const tintedBg = (color: string) => isDark ? `${color}1a` : `${color}12`;

  const barOpt = {
    grid: { top: 24, right: 16, bottom: 30, left: 40 },
    xAxis: {
      type: 'category',
      data: dashboard?.weekDays.map(d => d.day) || [],
      axisLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.2)' : '#cbd5e1' } },
      axisLabel: { color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b' }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.18)' } },
      axisLabel: { color: isDark ? 'rgba(255,255,255,0.5)' : '#94a3b8' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? 'rgba(10,14,28,0.9)' : 'rgba(255,255,255,0.95)',
      borderColor: isDark ? accent + '44' : '#e2e8f0',
      textStyle: { color: isDark ? '#f8fafc' : '#0f172a' }
    },
    series: [{
      type: 'bar',
      data: dashboard?.weekDays.map(d => d.count) || [],
      itemStyle: { color: accent, borderRadius: [6, 6, 0, 0] }
    }]
  };

  const radarOpt = {
    radar: {
      indicator: (dashboard?.radar || []).map((r: any) => ({ name: r.name, max: 100 })),
      radius: '68%',
      axisName: { color: subColor },
      splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(148,163,184,0.24)' } },
      splitArea: { areaStyle: { color: isDark ? ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)'] : ['rgba(59,130,246,0.04)', 'rgba(59,130,246,0.08)'] } },
      axisLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(148,163,184,0.28)' } }
    },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'radar',
      data: [{ value: (dashboard?.radar || []).map((r: any) => r.value), name: '成长控制力' }],
      areaStyle: { color: `${accent}33` },
      lineStyle: { color: accent, width: 3 },
      itemStyle: { color: accent }
    }]
  };

  const statCards = [
    { label: '总事项', value: dashboard?.totalItems || 0, icon: <CalendarOutlined />, color: '#38bdf8' },
    { label: '日记篇数', value: dashboard?.totalDiaries || 0, icon: <RiseOutlined />, color: '#a78bfa' },
    { label: '备忘条数', value: dashboard?.totalMemos || 0, icon: <CheckCircleOutlined />, color: '#34d399' },
    { label: '专注时长', value: `${Math.round(dashboard?.totalFocusMin || 0)} 分`, icon: <FireOutlined />, color: '#f59e0b' }
  ];

  const todayCompletion = dashboard?.todayTotal ? Math.round((dashboard.todayDone / dashboard.todayTotal) * 100) : 0;
  const riskScore = dashboard ? Math.min(100, Math.round((100 - todayCompletion) * 0.36 + Math.max(0, 90 - dashboard.summary.week.focusMin) * 0.28 + Math.max(0, 5 - dashboard.summary.week.checkins) * 6 + Math.max(0, 3 - dashboard.summary.week.diaries) * 5)) : 0;
  const riskLevel = riskScore >= 70 ? '红色预警' : riskScore >= 42 ? '黄色预警' : '绿色稳定';
  const orchestratorSteps = dashboard ? [
    { title: '目标牵引', desc: dashboard.activeGoalsList[0]?.title ? `先推进「${dashboard.activeGoalsList[0].title}」的最小里程碑` : '先创建一个可衡量核心目标', color: '#8b5cf6' },
    { title: '专注执行', desc: `今日完成率 ${todayCompletion}%，安排 ${todayCompletion < 60 ? 45 : 25} 分钟深度专注`, color: '#06b6d4' },
    { title: '习惯闭环', desc: `本周打卡 ${dashboard.summary.week.checkins} 次，补齐一个最容易断裂的习惯链`, color: '#22c55e' },
    { title: '日记校准', desc: dashboard.summary.week.diaries ? '今晚复盘行动与情绪的关联' : '今晚写一篇压力拆解日记建立反馈', color: '#f59e0b' }
  ] : [];
  const riskActions = [
    riskScore >= 70 ? '立即削减非核心事项，只保留一个目标、一个习惯和一次专注。' : riskScore >= 42 ? '今天降低启动阻力，用 25 分钟专注和一次轻量复盘恢复节奏。' : '维持当前节奏，把稳定行为沉淀为固定模板。',
    dashboard && dashboard.summary.week.focusMin < 90 ? '本周专注不足 90 分钟，优先补一段无打断深度工作。' : '专注时长处于可控区间，继续关注质量而不是堆时长。',
    dashboard && dashboard.summary.week.diaries < 3 ? '日记样本偏少，今晚用智能引导记录情绪触发点。' : '日记记录充足，可从情绪趋势中提炼下一步策略。'
  ];
  const achievements = useAchievements();
  const gameLevel = useGameLevel();
  const insights = useCorrelationInsights();
  const simulateGrowth = async () => {
    if (!dashboard) return message.warning('成长数据仍在加载中');
    setAixLoading(true);
    try {
      const fallback = `30 天模拟：保持每周 ${Math.max(1, Math.round((dashboard.summary.week.focusMin || 0) / 25))} 次专注，优先推进 ${dashboard.activeGoalsList[0]?.title || '一个核心目标'}，每 7 天复盘一次情绪和习惯波动。`;
      const text = await callAixModel({ apiUrl: aixApiUrl, apiKey: aixApiKey, model: aixModel }, [
        { role: 'system', content: '你是 AixSystems 的个人成长控制模型，只输出简短、可执行的 30 天成长干预建议。' },
        { role: 'user', content: JSON.stringify({ focusMin: Math.round(dashboard.totalFocusMin), week: dashboard.summary.week, month: dashboard.summary.month, goals: dashboard.activeGoalsList, radar: dashboard.radar, growthToken: dashboard.growthToken }) }
      ]).catch(() => fallback);
      setAixPlan(text);
      message.success('Aix 成长轨迹模拟已生成');
    } finally {
      setAixLoading(false);
    }
  };
  const exportReport = (format: 'md' | 'html' | 'card') => {
    if (!dashboard) return message.warning('成长数据仍在加载中');
    if (format === 'card') downloadText(`aixsystems-growth-card-${dayjs().format('YYYY-MM-DD')}.html`, buildGrowthShareCard(dashboard, achievements), 'text/html;charset=utf-8');
    else if (format === 'html') downloadText(`aixsystems-growth-${dayjs().format('YYYY-MM-DD')}.html`, buildGrowthHtmlReport(dashboard, achievements), 'text/html;charset=utf-8');
    else downloadText(`aixsystems-growth-${dayjs().format('YYYY-MM-DD')}.md`, buildGrowthReport(dashboard, achievements), 'text/markdown;charset=utf-8');
    message.success(format === 'card' ? '成长分享卡已导出' : format === 'html' ? '可视化成长报告已导出' : '成长报告已导出');
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card
        bordered={false}
        className="anim-fade-in-up"
        style={{
          borderRadius: 28,
          overflow: 'hidden',
          background: isDark
            ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
            : 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(139,92,246,0.92) 44%, rgba(236,72,153,0.9) 100%)',
          boxShadow: isDark
            ? `0 28px 60px ${accent}24, 0 0 40px ${accent}10`
            : '0 28px 60px rgba(139,92,246,0.16)',
          border: isDark ? `1px solid ${accent}33` : 'none'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(233,213,255,0.9)' }}>
              成长仪表盘
            </Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#fff', textShadow: isDark ? `0 0 20px ${accent}44` : 'none' }}>
              看见自己的成长轨迹
            </Typography.Title>
            {gameLevel && (
              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{
                  padding: '6px 18px', borderRadius: 20, background: 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.25)',
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <span style={{ fontSize: 22 }}>{gameLevel.icon}</span>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Lv.{gameLevel.level}</span>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{gameLevel.title}</span>
                </div>
                <div style={{ flex: 1, minWidth: 140, maxWidth: 280 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{gameLevel.totalXp} XP</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                      {gameLevel.levelProgress < 100 ? `距升级还需 ${gameLevel.xpToNext} XP` : '已满级'}
                    </span>
                  </div>
                  <Progress
                    percent={gameLevel.levelProgress}
                    strokeColor={{ '0%': '#fff', '100%': '#67e8f9' }}
                    trailColor="rgba(255,255,255,0.15)"
                    size="small"
                    showInfo={false}
                    strokeLinecap="round"
                  />
                </div>
                <Tag style={{ borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#a5f3fc' }}>
                  今日 +{gameLevel.todayXp} XP
                </Tag>
              </div>
            )}
            <Typography.Paragraph style={{ marginBottom: 16, color: 'rgba(226,232,240,0.84)' }}>
              整合习惯、目标、专注和事项数据，用一个页面看清自己每天都在向哪个方向前进。
            </Typography.Paragraph>
            <Space wrap>
              <Button type="primary" icon={<RiseOutlined />} onClick={() => nav('/home/growth/report')} style={{ borderRadius: 12, fontWeight: 700, background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', border: 'none' }}>
                智能周期报告
              </Button>
              <Button icon={<BulbOutlined />} loading={aixLoading} onClick={simulateGrowth} style={{ borderRadius: 12, fontWeight: 700 }}>
                Aix 模拟 30 天轨迹
              </Button>
              <Button icon={<DownloadOutlined />} onClick={() => exportReport('md')} style={{ borderRadius: 12, fontWeight: 700 }}>
                导出 Markdown
              </Button>
              <Button icon={<DownloadOutlined />} onClick={() => exportReport('html')} style={{ borderRadius: 12, fontWeight: 700 }}>
                导出 HTML 报告
              </Button>
              <Button icon={<DownloadOutlined />} onClick={() => exportReport('card')} style={{ borderRadius: 12, fontWeight: 700 }}>
                导出分享卡
              </Button>
            </Space>
          </Col>

          <Col xs={24} lg={9}>
            <Row gutter={[12, 12]}>
              <Col span={8}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title="习惯数" value={dashboard?.totalHabits || 0} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title="目标数" value={dashboard?.totalGoals || 0} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title="已完成目标" value={dashboard?.completedGoals || 0} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {aixPlan ? (
        <Card bordered={false} className="anim-fade-in-up hover-lift" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
          <Typography.Text style={{ color: subColor }}>Aix 成长轨迹模拟器</Typography.Text>
          <Typography.Title level={4} style={{ margin: '4px 0 12px', color: titleColor }}>未来 30 天干预建议</Typography.Title>
          <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', color: titleColor, marginBottom: 0 }}>{aixPlan}</Typography.Paragraph>
        </Card>
      ) : null}

      <Card bordered={false} className="anim-fade-in-up hover-lift" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Space align="center" wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Typography.Text style={{ color: subColor }}>成长总控令牌</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 8px', color: titleColor }}>{dashboard?.growthToken.id || 'AIX-GROW'} · {dashboard?.growthToken.level || '加载中'}</Typography.Title>
            <Typography.Text style={{ color: subColor }}>{dashboard?.growthToken.action || '等待成长数据生成控制动作。'}</Typography.Text>
          </div>
          <Progress type="dashboard" percent={dashboard?.growthToken.score || 0} strokeColor={(dashboard?.growthToken.score || 0) >= 78 ? '#22c55e' : (dashboard?.growthToken.score || 0) >= 52 ? '#f59e0b' : '#ef4444'} trailColor={isDark ? 'rgba(255,255,255,0.08)' : undefined} />
        </Space>
        <Row gutter={[12, 12]} style={{ marginTop: 14 }}>
          {(dashboard?.growthToken.signals || []).map((signal: any) => (
            <Col xs={24} md={12} xl={5} key={signal.name}>
              <div style={{ padding: 12, borderRadius: 16, background: tintedBg(signal.value >= 70 ? '#22c55e' : '#8b5cf6'), border: `1px solid ${(signal.value >= 70 ? '#22c55e' : '#8b5cf6')}33` }}>
                <Typography.Text strong style={{ color: titleColor }}>{signal.name}</Typography.Text>
                <Progress percent={signal.value} showInfo={false} strokeColor={signal.value >= 70 ? '#22c55e' : '#8b5cf6'} trailColor={isDark ? 'rgba(255,255,255,0.08)' : undefined} style={{ margin: '8px 0 0' }} />
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Card bordered={false} className="anim-fade-in-up hover-lift" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Text style={{ color: subColor }}>90 天成长控制推演</Typography.Text>
        <Typography.Title level={4} style={{ margin: '4px 0 14px', color: titleColor }}>从恢复节奏到个人控制协议</Typography.Title>
        <Row gutter={[12, 12]}>
          {(dashboard?.controlProjection || []).map((stage: any, index: number) => (
            <Col xs={24} md={8} key={stage.days}>
              <div style={{ height: '100%', padding: 16, borderRadius: 18, background: tintedBg(stage.score >= 82 ? '#22c55e' : stage.score >= 58 ? '#f59e0b' : '#ef4444'), border: `1px solid ${(stage.score >= 82 ? '#22c55e' : stage.score >= 58 ? '#f59e0b' : '#ef4444')}33` }}>
                <Space wrap><Tag color="purple">D+{stage.days}</Tag><Typography.Text strong style={{ color: titleColor }}>{stage.level}</Typography.Text></Space>
                <Progress percent={stage.score} strokeColor={stage.score >= 82 ? '#22c55e' : stage.score >= 58 ? '#f59e0b' : '#ef4444'} trailColor={isDark ? 'rgba(255,255,255,0.08)' : undefined} style={{ margin: '12px 0 8px' }} />
                <Typography.Paragraph style={{ margin: 0, color: subColor, fontSize: 12 }}>{index + 1}. {stage.action}</Typography.Paragraph>
              </div>
            </Col>
          ))}
        </Row>
        <Typography.Paragraph style={{ color: subColor, margin: '12px 0 0', fontSize: 12 }}>推演只使用事项、专注、习惯、目标、日记频率和复习统计，不读取日记正文。</Typography.Paragraph>
      </Card>

      <Card bordered={false} className="anim-fade-in-up hover-lift" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Text style={{ color: subColor }}>成长控制任务编排器</Typography.Text>
        <Typography.Title level={4} style={{ margin: '4px 0 14px', color: titleColor }}>今日自动控制流程</Typography.Title>
        <Row gutter={[12, 12]}>
          {orchestratorSteps.map((step, index) => (
            <Col xs={24} md={6} key={step.title}>
              <div style={{ height: '100%', padding: 14, borderRadius: 18, background: tintedBg(step.color), border: `1px solid ${step.color}33` }}>
                <Tag color="purple" style={{ borderRadius: 6 }}>第 {index + 1} 步</Tag>
                <Typography.Title level={5} style={{ margin: '10px 0 6px', color: titleColor }}>{step.title}</Typography.Title>
                <Typography.Paragraph style={{ margin: 0, color: subColor, fontSize: 12 }}>{step.desc}</Typography.Paragraph>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Card bordered={false} className="anim-fade-in-up hover-lift" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Text style={{ color: subColor }}>风险预警中心</Typography.Text>
        <Space align="center" wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Typography.Title level={4} style={{ margin: '4px 0 12px', color: titleColor }}>{riskLevel}</Typography.Title>
          <Tag color={riskScore >= 70 ? 'red' : riskScore >= 42 ? 'gold' : 'green'} style={{ borderRadius: 8, padding: '4px 12px' }}>风险 {riskScore}</Tag>
        </Space>
        <Progress percent={riskScore} strokeColor={riskScore >= 70 ? '#ef4444' : riskScore >= 42 ? '#f59e0b' : '#22c55e'} trailColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)'} />
        <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
          {riskActions.map(action => (
            <Col xs={24} md={8} key={action}>
              <div style={{ padding: 12, borderRadius: 16, background: tintedBg(riskScore >= 70 ? '#ef4444' : riskScore >= 42 ? '#f59e0b' : '#22c55e'), color: subColor, minHeight: 72 }}>{action}</div>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {statCards.map((stat, i) => (
          <Col xs={24} md={12} xl={6} key={stat.label}>
            <Card
              bordered={false}
              className="anim-fade-in-up hover-lift"
              style={{
                borderRadius: 22,
                background: cardBg,
                border: cardBorder,
                boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)',
                animationDelay: `${0.08 + i * 0.06}s`
              }}
            >
              <Statistic
                title={<span style={{ display: 'flex', alignItems: 'center', gap: 6, color: subColor }}>{stat.icon} {stat.label}</span>}
                value={stat.value}
                valueStyle={{ fontSize: 32, fontWeight: 700, color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="anim-fade-in-up stagger-2 hover-lift"
            style={{ borderRadius: 24, background: cardBg, border: cardBorder, boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)' }}
          >
            <Typography.Text style={{ color: subColor }}>今日状态</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 16px', color: titleColor }}>事项完成率</Typography.Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <Progress
                type="circle"
                percent={todayCompletion}
                size={120}
                strokeColor={accent}
                trailColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)'}
                format={v => <span style={{ color: titleColor, fontSize: 24, fontWeight: 700 }}>{v}%</span>}
              />
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: titleColor }}>{dashboard?.todayDone || 0} / {dashboard?.todayTotal || 0}</div>
                <div style={{ color: subColor, marginTop: 4 }}>今日事项已完成</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="anim-fade-in-up stagger-3 hover-lift"
            style={{ borderRadius: 24, background: cardBg, border: cardBorder, boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)' }}
          >
            <Typography.Text style={{ color: subColor }}>专注统计</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 16px', color: titleColor }}>本周 / 本月</Typography.Title>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ padding: 16, borderRadius: 16, background: tintedBg('#38bdf8'), border: `1px solid ${cardBorder}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8', marginBottom: 8 }}>
                    <ClockCircleOutlined /> <span style={{ fontSize: 12, color: subColor }}>本周专注</span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: titleColor }}>
                    {Math.round(dashboard?.weekFocusMin || 0)}
                  </div>
                  <div style={{ color: subColor, fontSize: 12 }}>分钟</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ padding: 16, borderRadius: 16, background: tintedBg('#f59e0b'), border: `1px solid ${cardBorder}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b', marginBottom: 8 }}>
                    <FireOutlined /> <span style={{ fontSize: 12, color: subColor }}>本月专注</span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: titleColor }}>
                    {Math.round(dashboard?.monthFocusMin || 0)}
                  </div>
                  <div style={{ color: subColor, fontSize: 12 }}>分钟</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="anim-fade-in-up stagger-4"
            style={{ borderRadius: 24, background: cardBg, border: cardBorder, boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)' }}
          >
            <Typography.Text style={{ color: subColor }}>成长雷达</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 16px', color: titleColor }}>个人成长控制力</Typography.Title>
            <Suspense fallback={<div style={{ height: 260, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)', borderRadius: 12 }} />}>
              <ReactECharts option={radarOpt} style={{ height: 260 }} theme={isDark ? 'dark' : undefined} />
            </Suspense>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="anim-fade-in-up stagger-5"
            style={{ borderRadius: 24, background: cardBg, border: cardBorder, boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)' }}
          >
            <Typography.Text style={{ color: subColor }}>目标进度</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 16px', color: titleColor }}>进行中目标概览</Typography.Title>
            {dashboard?.activeGoalsList ? (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {dashboard.activeGoalsList.length > 0 ? (
                  dashboard.activeGoalsList.map(goal => (
                    <div key={goal.id}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: goal.color }} />
                          <span style={{ color: titleColor, fontSize: 14, fontWeight: 500 }}>{goal.title}</span>
                        </div>
                        <span style={{ color: subColor, fontSize: 12 }}>{goal.doneCount} / {goal.totalCount}</span>
                      </div>
                      <Progress percent={goal.progress} strokeColor={goal.color} trailColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)'} showInfo={false} strokeLinecap="round" size={{ height: 6 }} />
                    </div>
                  ))
                ) : (
                  <Tag style={{ borderRadius: 6 }}>暂无进行中的目标</Tag>
                )}
                {dashboard.completedGoals > 0 && (
                  <Tag color="green" style={{ borderRadius: 6, fontSize: 14, padding: '4px 12px' }}>
                    已达成 {dashboard.completedGoals} 个目标
                  </Tag>
                )}
              </Space>
            ) : (
              <div style={{ color: subColor }}>加载中...</div>
            )}
          </Card>
        </Col>
      </Row>

      <Card
        bordered={false}
        className="anim-fade-in-up stagger-6"
        style={{ borderRadius: 24, background: cardBg, border: cardBorder, boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)' }}
      >
        <Typography.Text style={{ color: subColor }}>习惯打卡</Typography.Text>
        <Typography.Title level={4} style={{ margin: '4px 0 16px', color: titleColor }}>近 7 天打卡分布</Typography.Title>
        <Suspense fallback={<div style={{ height: 240, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)', borderRadius: 12 }} />}>
          <ReactECharts option={barOpt} style={{ height: 240 }} theme={isDark ? 'dark' : undefined} />
        </Suspense>
      </Card>

      {/* 周期复盘 */}
      <Card
        bordered={false}
        className="anim-fade-in-up stagger-6"
        style={{ borderRadius: 24, background: cardBg, border: cardBorder, boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)' }}
      >
        <Typography.Text style={{ color: subColor }}>数据洞察</Typography.Text>
        <Typography.Title level={4} style={{ margin: '4px 0 16px', color: titleColor }}>周期复盘</Typography.Title>
        <Tabs
          items={[
            {
              key: 'week',
              label: '本周',
              children: <SummaryBlock data={dashboard?.summary.week} prev={dashboard?.summary.lastWeek} isDark={isDark} titleColor={titleColor} subColor={subColor} cardBg={cardBg} cardBorder={cardBorder} />
            },
            {
              key: 'month',
              label: '本月',
              children: <SummaryBlock data={dashboard?.summary.month} prev={dashboard?.summary.lastMonth} isDark={isDark} titleColor={titleColor} subColor={subColor} cardBg={cardBg} cardBorder={cardBorder} />
            }
          ]}
        />
      </Card>

      {/* 成就徽章墙 */}
      <Card
        bordered={false}
        className="anim-fade-in-up stagger-7"
        style={{ borderRadius: 24, background: cardBg, border: cardBorder, boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <Typography.Text style={{ color: subColor }}>成长激励</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 0', color: titleColor }}>成就徽章</Typography.Title>
          </div>
          <Tag color="gold" style={{ borderRadius: 6, fontSize: 14, padding: '4px 12px' }}>
            <TrophyOutlined /> {achievements?.unlockedCount || 0} / {achievements?.total || 0}
          </Tag>
        </div>

        {achievements ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {achievements.list.map(a => (
              <div
                key={a.id}
                className="hover-scale"
                style={{
                  padding: '16px 12px',
                  borderRadius: 18,
                  textAlign: 'center',
                  background: a.unlocked ? `${a.color}15` : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.03)',
                  border: a.unlocked ? `1px solid ${a.color}35` : `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}`,
                  transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  filter: a.unlocked ? 'none' : 'grayscale(0.85) opacity(0.65)'
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8, filter: a.unlocked ? 'none' : 'grayscale(1)' }}>{a.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: a.unlocked ? a.color : subColor, marginBottom: 4 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: subColor, lineHeight: 1.4 }}>{a.desc}</div>
                {!a.unlocked && (
                  <div style={{ marginTop: 6, fontSize: 11, color: subColor }}>
                    <LockOutlined style={{ fontSize: 10, marginRight: 4 }} />未解锁
                  </div>
                )}
                {a.unlocked && (
                  <div style={{ marginTop: 6, fontSize: 11, color: a.color }}>
                    <StarOutlined style={{ fontSize: 10, marginRight: 4 }} />已解锁
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: subColor }}>加载中...</div>
        )}
      </Card>

      {/* 跨模块关联洞察 */}
      <Card
        bordered={false}
        className="anim-fade-in-up stagger-7"
        style={{ borderRadius: 24, background: cardBg, border: cardBorder, boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <Typography.Text style={{ color: subColor }}><ThunderboltOutlined /> 黑科技引擎</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 0', color: titleColor }}>跨模块关联洞察</Typography.Title>
          </div>
          {insights && insights.length > 0 && (
            <Tag color="purple" style={{ borderRadius: 6, fontSize: 13, padding: '4px 12px' }}>
              <BulbOutlined /> {insights.length} 条洞察
            </Tag>
          )}
        </div>
        <Typography.Paragraph style={{ color: subColor, marginBottom: 16 }}>
          基于你全部本地数据的统计分析，发现习惯、专注、情绪、目标之间隐藏的关联模式。
        </Typography.Paragraph>

        {insights ? (
          insights.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {insights.map(insight => (
                <Tooltip key={insight.id} title={insight.detail} placement="top">
                  <div
                    className="hover-lift"
                    style={{
                      padding: 20,
                      borderRadius: 18,
                      background: isDark ? `${insight.color}0d` : `${insight.color}08`,
                      border: `1px solid ${insight.color}25`,
                      cursor: 'default',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: -16, right: -16, width: 64, height: 64,
                      borderRadius: '50%', background: `${insight.color}12`, pointerEvents: 'none'
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, position: 'relative' }}>
                      <span style={{ fontSize: 28 }}>{insight.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: titleColor, lineHeight: 1.3 }}>{insight.title}</div>
                        <div style={{ fontSize: 11, color: subColor, marginTop: 2 }}>
                          {insight.modules.join(' × ')}
                          <Tag
                            style={{ marginLeft: 8, fontSize: 10, borderRadius: 4, lineHeight: '16px' }}
                            color={insight.confidence === 'high' ? 'green' : insight.confidence === 'medium' ? 'blue' : 'default'}
                          >
                            {insight.confidence === 'high' ? '高置信' : insight.confidence === 'medium' ? '中信度' : '低置信'}
                          </Tag>
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: subColor, lineHeight: 1.6, position: 'relative' }}>{insight.detail}</div>
                  </div>
                </Tooltip>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '40px 20px', borderRadius: 16,
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.02)',
              border: `1px dashed ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'}`
            }}>
              <SmileOutlined style={{ fontSize: 36, color: subColor, marginBottom: 12 }} />
              <div style={{ color: subColor, fontSize: 14, marginBottom: 4 }}>数据不足，暂未发现显著关联</div>
              <div style={{ color: subColor, fontSize: 12 }}>持续记录习惯、专注和日记，AixSystems 会自动发现隐藏的成长模式。</div>
            </div>
          )
        ) : (
          <div style={{ color: subColor }}>分析中...</div>
        )}
      </Card>
    </Space>
  );
}
