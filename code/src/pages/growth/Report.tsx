// 智能周期成长报告 - 自动聚合所有模块数据生成可视化报告 (v0.25.0)
import React, { Suspense, lazy, useMemo, useState } from 'react';
import { App as AntApp, Button, Card, Col, Divider, Row, Segmented, Space, Statistic, Tag, Typography, Spin } from 'antd';
import {
  DownloadOutlined, FileTextOutlined, FileImageOutlined,
  CalendarOutlined, FireOutlined, CheckCircleOutlined, BookOutlined,
  TrophyOutlined, RiseOutlined, ArrowUpOutlined, ArrowDownOutlined, FlagOutlined
} from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db } from '@/db';
import { useThemeVariants } from '@/hooks/useVariants';

const ReactECharts = lazy(() => import('echarts-for-react'));

type Period = 'week' | 'month' | 'quarter' | 'year';

function periodRange(p: Period) {
  const now = dayjs();
  let start: number; let end: number; let prevStart: number; let prevEnd: number;
  if (p === 'quarter') {
    const q = Math.floor(now.month() / 3);
    start = now.month(q * 3).startOf('month').valueOf();
    end = now.month(q * 3 + 2).endOf('month').valueOf();
    const prevQ = now.subtract(3, 'month');
    const pq = Math.floor(prevQ.month() / 3);
    prevStart = prevQ.month(pq * 3).startOf('month').valueOf();
    prevEnd = prevQ.month(pq * 3 + 2).endOf('month').valueOf();
  } else {
    start = now.startOf(p).valueOf();
    end = now.endOf(p).valueOf();
    const prev = now.subtract(1, p);
    prevStart = prev.startOf(p).valueOf();
    prevEnd = prev.endOf(p).valueOf();
  }
  const label = p === 'week' ? '本周' : p === 'month' ? '本月' : p === 'quarter' ? '本季度' : '本年度';
  return { start, end, prevStart, prevEnd, label };
}

export default function GrowthReport() {
  const { message } = AntApp.useApp();
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const [period, setPeriod] = useState<Period>('week');
  const range = useMemo(() => periodRange(period), [period]);

  const data = useLiveQuery(async () => {
    const [items, diaries, sessions, habits, habitLogs, goals, memos] = await Promise.all([
      db.items.toArray(), db.diaries.toArray(), db.focusSessions.toArray(),
      db.habits.filter(h => !h.deletedAt).toArray(), db.habitLogs.toArray(),
      db.goals.filter(g => !g.deletedAt).toArray(), db.memos.toArray()
    ]);

    const inRange = (ts: number) => ts >= range.start && ts <= range.end;
    const inPrev = (ts: number) => ts >= range.prevStart && ts <= range.prevEnd;

    const nowItems = items.filter(i => !i.deletedAt && inRange(i.startTime));
    const prevItems = items.filter(i => !i.deletedAt && inPrev(i.startTime));
    const doneItems = nowItems.filter(i => i.completeStatus === 'done');
    const focusMinutes = sessions.filter(s => inRange(s.startTime)).reduce((s, v) => s + v.actualMs / 60_000, 0);
    const prevFocus = sessions.filter(s => inPrev(s.startTime)).reduce((s, v) => s + v.actualMs / 60_000, 0);
    const nowDiaries = diaries.filter(d => !d.deletedAt && inRange(d.createdAt));
    const checkins = habitLogs.filter(l => inRange(l.date));
    const prevCheckins = habitLogs.filter(l => inPrev(l.date));
    const completedGoals = goals.filter(g => g.status === 'completed' && g.updatedAt && inRange(g.updatedAt));
    const nowMemos = memos.filter(m => !m.deletedAt && inRange(m.createdAt));

    const moodList = nowDiaries.filter(d => d.mood).map(d => d.mood!);
    const moodCounts: Record<string, number> = {};
    for (const m of moodList) { moodCounts[m] = (moodCounts[m] || 0) + 1; }

    const dailyFocus: { date: string; min: number }[] = [];
    let cursor = dayjs(range.start);
    while (cursor.valueOf() <= range.end) {
      const dStart = cursor.startOf('day').valueOf();
      const dEnd = cursor.endOf('day').valueOf();
      dailyFocus.push({
        date: cursor.format('MM-DD'),
        min: Math.round(sessions.filter(s => s.startTime >= dStart && s.startTime <= dEnd).reduce((s, v) => s + v.actualMs / 60_000, 0))
      });
      cursor = cursor.add(1, 'day');
    }

    const habitCompletion: { name: string; rate: number; color: string }[] = [];
    for (const h of habits) {
      const logs = checkins.filter(l => l.habitId === h.id);
      const daysInPeriod = Math.max(1, Math.ceil((range.end - range.start) / 86400000));
      const expected = h.frequency === 'daily' ? daysInPeriod : h.frequency === 'weekly' ? Math.ceil(daysInPeriod / 7) * h.targetCount : h.targetCount;
      habitCompletion.push({ name: h.name, rate: Math.min(100, Math.round((logs.length / Math.max(1, expected)) * 100)), color: h.color });
    }

    const topHabits = habits.sort((a, b) => {
      const aLogs = checkins.filter(l => l.habitId === a.id).length;
      const bLogs = checkins.filter(l => l.habitId === b.id).length;
      return bLogs - aLogs;
    }).slice(0, 5).map(h => ({ name: h.name, count: checkins.filter(l => l.habitId === h.id).length, color: h.color }));

    const focusModes: Record<string, number> = {};
    for (const s of sessions.filter(s => inRange(s.startTime))) {
      focusModes[s.mode] = (focusModes[s.mode] || 0) + Math.round(s.actualMs / 60_000);
    }

    return {
      doneItems: doneItems.length, totalItems: nowItems.length,
      completionRate: nowItems.length ? Math.round((doneItems.length / nowItems.length) * 100) : 0,
      prevCompletionRate: prevItems.length ? Math.round((prevItems.filter(i => i.completeStatus === 'done').length / prevItems.length) * 100) : 0,
      focusMinutes: Math.round(focusMinutes), prevFocus: Math.round(prevFocus),
      diaries: nowDiaries.length, checkins: checkins.length, prevCheckins: prevCheckins.length,
      activeHabits: habits.length, activeGoals: goals.filter(g => g.status === 'active').length,
      completedGoals: completedGoals.length, memos: nowMemos.length,
      moodList, moodCounts, dailyFocus, habitCompletion, topHabits, focusModes
    };
  }, [range]);

  const c1 = isDark ? '#f8fafc' : '#0f172a';
  const c2 = isDark ? 'rgba(226,232,240,0.7)' : '#64748b';
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';

  if (!data) return <Spin size="large" />;

  const focusTrendOpt = {
    grid: { top: 20, right: 16, bottom: 30, left: 44 },
    xAxis: { type: 'category', data: data.dailyFocus.map(d => d.date), axisLabel: { color: c2 }, axisLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.15)' : '#e2e8f0' } } },
    yAxis: { type: 'value', name: '分钟', axisLabel: { color: c2 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(148,163,184,0.14)' } } },
    tooltip: { trigger: 'axis', backgroundColor: isDark ? 'rgba(10,14,28,0.92)' : '#fff', borderColor: isDark ? accent + '44' : '#e2e8f0', textStyle: { color: c1 } },
    series: [{ type: 'bar', data: data.dailyFocus.map(d => d.min), itemStyle: { color: accent, borderRadius: [6, 6, 0, 0] }, name: '专注分钟' }]
  };

  const habitsOpt = {
    grid: { top: 20, right: 16, bottom: 30, left: 100 },
    xAxis: { type: 'value', max: 100, axisLabel: { color: c2, formatter: '{value}%' }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(148,163,184,0.14)' } } },
    yAxis: { type: 'category', data: data.habitCompletion.map(h => h.name).reverse(), axisLabel: { color: c2 }, axisLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.15)' : '#e2e8f0' } } },
    tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}: ${p[0].value}%` },
    series: [{ type: 'bar', data: data.habitCompletion.map(h => h.rate).reverse(), itemStyle: { color: accent, borderRadius: [0, 6, 6, 0] }, barWidth: 16, label: { show: true, position: 'right', formatter: '{c}%', color: c2, fontSize: 11 } }]
  };

  const moodPieOpt = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 0, top: 'center', textStyle: { color: c2 } },
    series: [{
      type: 'pie', radius: ['55%', '78%'], center: ['58%', '50%'],
      data: Object.entries(data.moodCounts).map(([k, v]) => ({ name: k, value: v })),
      label: { color: c2 }, itemStyle: { borderColor: isDark ? '#0a0e1c' : '#fff', borderWidth: 2 }
    }]
  };

  const buildJsonExport = () => JSON.stringify({
    generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    period: { label: range.label, start: dayjs(range.start).format('YYYY-MM-DD'), end: dayjs(range.end).format('YYYY-MM-DD') },
    summary: {
      items: { done: data.doneItems, total: data.totalItems, rate: data.completionRate },
      focus: { minutes: data.focusMinutes, prevPeriod: data.prevFocus },
      habits: { checkins: data.checkins, prevPeriod: data.prevCheckins, active: data.activeHabits },
      diaries: data.diaries, goals: data.completedGoals, memos: data.memos
    },
    detail: { moodCounts: data.moodCounts, dailyFocus: data.dailyFocus, habitCompletion: data.habitCompletion }
  }, null, 2);

  const buildHtmlExport = () => {
    const rows = data.dailyFocus.map(d => `<tr><td>${d.date}</td><td>${d.min} 分</td></tr>`).join('');
    const hrows = data.habitCompletion.map(h => `<tr><td>${h.name}</td><td>${h.rate}%</td></tr>`).join('');
    return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>AixSystems ${range.label}成长报告</title><style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0f172a;color:#e2e8f0}.wrap{max-width:900px;margin:0 auto;padding:40px 24px}.hero{padding:36px;border-radius:24px;background:linear-gradient(135deg,#7c3aed,#06b6d4);margin-bottom:24px}h1{margin:0 0 8px;font-size:32px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:20px 0}.card{padding:18px;border-radius:16px;background:#ffffff0f;border:1px solid #ffffff18}.num{font-size:28px;font-weight:800;color:#fff}table{width:100%;border-collapse:collapse;margin:12px 0;border-radius:14px;overflow:hidden;background:#ffffff0a}th,td{padding:12px;text-align:left;border-bottom:1px solid #ffffff12}th{color:#94a3b8}.section{margin-top:24px}h2{font-size:20px;margin-bottom:12px}</style></head><body><main class="wrap"><section class="hero"><p>${dayjs().format('YYYY-MM-DD HH:mm')}</p><h1>AixSystems ${range.label}成长报告</h1><p>基于全模块本地数据的智能周期复盘。</p></section><section class="grid"><div class="card"><p>事项完成</p><div class="num">${data.doneItems}/${data.totalItems}</div><p>${data.completionRate}%</p></div><div class="card"><p>专注时长</p><div class="num">${data.focusMinutes} 分</div></div><div class="card"><p>习惯打卡</p><div class="num">${data.checkins} 次</div></div><div class="card"><p>日记/备忘</p><div class="num">${data.diaries}/${data.memos}</div></div></section><section class="section"><h2>每日专注趋势</h2><table><thead><tr><th>日期</th><th>专注时长</th></tr></thead><tbody>${rows}</tbody></table></section><section class="section"><h2>习惯完成率</h2><table><thead><tr><th>习惯</th><th>完成率</th></tr></thead><tbody>${hrows}</tbody></table></section></main></body></html>`;
  };

  const exportJson = () => {
    const blob = new Blob([buildJsonExport()], { type: 'application/json;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `aixsystems-${period}-${dayjs().format('YYYY-MM-DD')}.json`; a.click();
    message.success('JSON 数据报告已导出');
  };
  const exportHtml = () => {
    const blob = new Blob([buildHtmlExport()], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `aixsystems-${period}-${dayjs().format('YYYY-MM-DD')}.html`; a.click();
    message.success('HTML 可视化报告已导出');
  };

  const diff = (now: number, prev: number) => {
    if (!prev) return { text: '新增', color: '#22c55e' };
    const pct = Math.round((now - prev) / prev * 100);
    return pct >= 0 ? { text: `+${pct}%`, color: '#22c55e', icon: <ArrowUpOutlined /> } : { text: `${pct}%`, color: '#ef4444', icon: <ArrowDownOutlined /> };
  };
  const focusDiff = diff(data.focusMinutes, data.prevFocus);
  const checkinDiff = diff(data.checkins, data.prevCheckins);

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Row justify="space-between" align="middle" wrap>
          <Col>
            <Typography.Text style={{ color: c2 }}><RiseOutlined /> 智能周期报告</Typography.Text>
            <Typography.Title level={3} style={{ margin: '4px 0 0', color: c1 }}>成长复盘 · {range.label}</Typography.Title>
          </Col>
          <Col>
            <Space>
              <Segmented value={period} onChange={v => setPeriod(v as Period)}
                options={[{ label: '本周', value: 'week' }, { label: '本月', value: 'month' }, { label: '本季', value: 'quarter' }, { label: '本年', value: 'year' }]}
              />
              <Button icon={<FileTextOutlined />} onClick={exportJson}>导出 JSON</Button>
              <Button type="primary" icon={<FileImageOutlined />} onClick={exportHtml}>导出 HTML</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}><Card bordered={false} style={{ borderRadius: 18, background: cardBg, border: cardBorder }}><Statistic title="事项完成" value={`${data.doneItems}/${data.totalItems}`} valueStyle={{ color: '#38bdf8' }} suffix={<Tag style={{ marginLeft: 8 }} color={data.completionRate >= 80 ? 'green' : 'blue'}>{data.completionRate}%</Tag>} /></Card></Col>
        <Col xs={12} md={6}><Card bordered={false} style={{ borderRadius: 18, background: cardBg, border: cardBorder }}><Statistic title="专注时长" value={data.focusMinutes} suffix="分钟" valueStyle={{ color: '#f59e0b' }} prefix={<FireOutlined />} />{<Tag style={{ marginTop: 4 }} color={focusDiff.color}>{focusDiff.icon}{focusDiff.text}</Tag>}</Card></Col>
        <Col xs={12} md={6}><Card bordered={false} style={{ borderRadius: 18, background: cardBg, border: cardBorder }}><Statistic title="习惯打卡" value={data.checkins} suffix="次" valueStyle={{ color: '#a78bfa' }} />{<Tag style={{ marginTop: 4 }} color={checkinDiff.color}>{checkinDiff.icon}{checkinDiff.text}</Tag>}</Card></Col>
        <Col xs={12} md={6}><Card bordered={false} style={{ borderRadius: 18, background: cardBg, border: cardBorder }}><Statistic title="日记/备忘" value={data.diaries} suffix={`/${data.memos}`} valueStyle={{ color: '#34d399' }} /></Card></Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card bordered={false} style={{ borderRadius: 22, background: cardBg, border: cardBorder }}>
            <Typography.Text style={{ color: c2 }}>每日专注趋势</Typography.Text>
            <Typography.Title level={5} style={{ margin: '4px 0 12px', color: c1 }}>{range.label}专注分布</Typography.Title>
            <Suspense fallback={<div style={{ height: 240 }} />}><ReactECharts option={focusTrendOpt} style={{ height: 260 }} theme={isDark ? 'dark' : undefined} /></Suspense>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ borderRadius: 22, background: cardBg, border: cardBorder }}>
            <Typography.Text style={{ color: c2 }}>情绪分布</Typography.Text>
            <Typography.Title level={5} style={{ margin: '4px 0 12px', color: c1 }}>{range.label}情绪记录</Typography.Title>
            {data.moodList.length > 0 ? (
              <Suspense fallback={<div style={{ height: 240 }} />}><ReactECharts option={moodPieOpt} style={{ height: 260 }} theme={isDark ? 'dark' : undefined} /></Suspense>
            ) : <div style={{ color: c2, textAlign: 'center', padding: 40 }}>暂无情绪记录</div>}
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 22, background: cardBg, border: cardBorder }}>
        <Typography.Text style={{ color: c2 }}>习惯完成率</Typography.Text>
        <Typography.Title level={5} style={{ margin: '4px 0 12px', color: c1 }}>{range.label}习惯达成情况</Typography.Title>
        {data.habitCompletion.length > 0 ? (
          <Suspense fallback={<div style={{ height: 200 }} />}><ReactECharts option={habitsOpt} style={{ height: Math.max(200, data.habitCompletion.length * 40) }} theme={isDark ? 'dark' : undefined} /></Suspense>
        ) : <div style={{ color: c2, textAlign: 'center', padding: 40 }}>暂无习惯数据</div>}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ borderRadius: 18, background: cardBg, border: cardBorder }}>
            <Statistic title="活跃习惯" value={data.activeHabits} valueStyle={{ color: c1 }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ borderRadius: 18, background: cardBg, border: cardBorder }}>
            <Statistic title="进行中目标" value={data.activeGoals} valueStyle={{ color: c1 }} prefix={<FlagOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ borderRadius: 18, background: cardBg, border: cardBorder }}>
            <Statistic title={`${range.label}达成目标`} value={data.completedGoals} valueStyle={{ color: '#22c55e' }} prefix={<TrophyOutlined />} />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
