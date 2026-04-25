// 番茄专注 - 三模式 + 暂停恢复 + 白噪音 + 统计 (v0.21.7 专注统计增强)
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Button, Card, Col, Input, InputNumber, List, Progress, Row, Skeleton, Slider, Space, Statistic, Switch, Tabs, Tag, Typography, Select } from 'antd';
import {
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SoundOutlined,
  StopOutlined,
  FireOutlined,
  TrophyOutlined,
  FieldTimeOutlined,
  AreaChartOutlined,
  RiseOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { callAixModel } from '@/utils/aixModel';
import { FOCUS_MODES, FOCUS_MODE_LABELS } from '@/config/constants';
import { useFocusStore } from '@/stores/focusStore';
import { currentNoise, NOISE_LABELS, playNoise, setVolume, stopNoise } from '@/utils/audio';
import { fmtDateTime } from '@/utils/time';
import { useThemeVariants } from '@/hooks/useVariants';
import { useSettingsStore } from '@/stores/settingsStore';
import Empty from '@/components/Empty';

const PRESETS = [15, 25, 45, 90];
const ReactECharts = lazy(() => import('echarts-for-react'));

function formatClock(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return hours > 0
    ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function FocusPage() {
  const f = useFocusStore();
  const { theme } = useThemeVariants();
  const { aixApiUrl, aixApiKey, aixModel } = useSettingsStore();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

  const [mode, setMode] = useState<'countdown' | 'stopwatch' | 'pomodoro'>('pomodoro');
  const [minutes, setMinutes] = useState(25);
  const [title, setTitle] = useState('深度工作');
  const [strict, setStrict] = useState(false);
  const [noise, setNoise] = useState<string | null>(() => currentNoise());
  const [volume, setVolumeState] = useState(0.3);
  const [impression, setImpression] = useState('');
  const [aixFocusPlan, setAixFocusPlan] = useState('');
  const [aixLoading, setAixLoading] = useState(false);

  useEffect(() => {
    if (!f.running) return;
    const timer = setInterval(() => f.tick(), 1000);
    return () => clearInterval(timer);
  }, [f.running, f]);

  useEffect(() => () => { stopNoise(); }, []);

  const sessions = useLiveQuery(() => db.focusSessions.orderBy('startTime').reverse().limit(200).toArray(), []) || [];
  const hasSession = !!f.startAt || f.elapsedMs > 0;
  const sessionMode = hasSession ? f.mode : mode;
  const elapsedSec = Math.floor(f.elapsedMs / 1000);
  const remainSec = Math.max(0, Math.floor((f.plannedMs - f.elapsedMs) / 1000));
  const displaySec = sessionMode === 'stopwatch' ? elapsedSec : remainSec;
  const progressPercent = sessionMode === 'stopwatch'
    ? Math.min(100, Math.max(8, Math.round(f.elapsedMs / Math.max(minutes * 60_000, 1) * 100)))
    : (f.plannedMs ? Math.min(100, Math.round(f.elapsedMs / f.plannedMs * 100)) : 0);

  const totalMin = sessions.reduce((sum, session) => sum + session.actualMs / 60_000, 0);
  const todayStart = dayjs().startOf('day').valueOf();
  const todaySessions = sessions.filter(session => session.startTime >= todayStart);
  const todayMin = todaySessions.reduce((sum, session) => sum + session.actualMs / 60_000, 0);
  const successRate = sessions.length ? Math.round((sessions.length - sessions.filter(session => session.giveUp).length) / sessions.length * 100) : 0;
  const averageMin = sessions.length ? Math.round(totalMin / sessions.length) : 0;
  const qualitySessions = sessions.slice(0, 12).map(session => {
    const plannedRate = session.plannedMs ? Math.min(120, Math.round(session.actualMs / session.plannedMs * 100)) : 100;
    const score = session.giveUp ? Math.max(20, Math.round(plannedRate * 0.45)) : Math.min(100, plannedRate + (session.strictMode ? 8 : 0));
    const grade = score >= 90 ? 'S' : score >= 75 ? 'A' : score >= 55 ? 'B' : 'C';
    return { ...session, score, grade };
  });
  const qualityAverage = qualitySessions.length ? Math.round(qualitySessions.reduce((sum, session) => sum + session.score, 0) / qualitySessions.length) : 0;
  const currentHour = dayjs().hour();
  const scene = currentHour < 11 ? { name: '晨间破局', minutes: 45, mode: 'countdown' as const, strict: true, title: '核心目标推进', reason: '上午意志力窗口适合处理高价值任务' }
    : currentHour < 18 ? { name: '午后稳态', minutes: 25, mode: 'pomodoro' as const, strict: false, title: '单点推进', reason: '午后用番茄钟降低启动阻力' }
      : { name: '夜间收束', minutes: 15, mode: 'countdown' as const, strict: false, title: '复盘与清理', reason: '夜间适合轻量整理，避免过度兴奋' };
  const recentCompletion = qualitySessions.length ? Math.round(qualitySessions.filter(session => !session.giveUp).length / qualitySessions.length * 100) : 0;
  const sceneBoost = recentCompletion >= 80 ? '近期完成率稳定，可以提高 5 分钟挑战强度。' : recentCompletion ? '近期有中断信号，先降低阻力保持连续。' : '暂无专注样本，先从当前场景模板开始校准。';

  const hourMap: Record<number, number> = {};
  for (const s of sessions) { hourMap[dayjs(s.startTime).hour()] = (hourMap[dayjs(s.startTime).hour()] || 0) + s.actualMs / 60_000; }
  let bestHour = -1, bestHourMin = 0;
  for (const [h, m] of Object.entries(hourMap)) { if (m > bestHourMin) { bestHourMin = m; bestHour = parseInt(h); } }
  const bestHourLabel = bestHour >= 0 ? `${bestHour.toString().padStart(2, '0')}:00` : '--';

  const weekStart = dayjs().startOf('week').valueOf();
  const lastWeekStart = dayjs().subtract(1, 'week').startOf('week').valueOf();
  const monthStart = dayjs().startOf('month').valueOf();
  const lastMonthStart = dayjs().subtract(1, 'month').startOf('month').valueOf();
  const thisWeekMin = sessions.filter(s => s.startTime >= weekStart).reduce((sum, s) => sum + s.actualMs / 60_000, 0);
  const lastWeekMin = sessions.filter(s => s.startTime >= lastWeekStart && s.startTime < weekStart).reduce((sum, s) => sum + s.actualMs / 60_000, 0);
  const thisMonthMin = sessions.filter(s => s.startTime >= monthStart).reduce((sum, s) => sum + s.actualMs / 60_000, 0);
  const lastMonthMin = sessions.filter(s => s.startTime >= lastMonthStart && s.startTime < monthStart).reduce((sum, s) => sum + s.actualMs / 60_000, 0);
  const weekChange = lastWeekMin > 0 ? Math.round((thisWeekMin - lastWeekMin) / lastWeekMin * 100) : 0;
  const monthChange = lastMonthMin > 0 ? Math.round((thisMonthMin - lastMonthMin) / lastMonthMin * 100) : 0;

  async function generateAixFocusPlan() {
    setAixLoading(true);
    try {
      const fallback = `${scene.name}：${scene.reason}。建议 ${scene.minutes} 分钟${scene.strict ? '严格' : '普通'}专注，结束后记录一句完成感想。`;
      const text = await callAixModel({ apiUrl: aixApiUrl, apiKey: aixApiKey, model: aixModel }, [
        { role: 'system', content: '你是 AixSystems 的专注控制模型，只输出 3 条短促、可执行的专注干预策略。' },
        { role: 'user', content: JSON.stringify({ scene, recentCompletion, qualityAverage, todayMin: Math.round(todayMin), bestHourLabel }) }
      ]).catch(() => fallback);
      setAixFocusPlan(text);
    } finally {
      setAixLoading(false);
    }
  }

  function start() {
    f.start({ mode, plannedMs: minutes * 60_000, title, strict });
  }

  async function finish(giveUp = false) {
    await db.focusSessions.add({
      id: nanoid(),
      mode: f.mode,
      title: f.title,
      plannedMs: f.plannedMs,
      actualMs: f.elapsedMs,
      startTime: f.startAt,
      endTime: Date.now(),
      giveUp,
      strictMode: f.strictMode,
      impression,
      createdAt: Date.now()
    });
    stopNoise();
    setNoise(null);
    setImpression('');
    f.stop();
  }

  function toggleNoise(key: string | null) {
    if (!key) {
      stopNoise();
      setNoise(null);
      return;
    }
    playNoise(key as any, volume);
    setNoise(key);
  }

  const days14 = Array.from({ length: 14 }).map((_, index) => {
    const currentDay = dayjs().subtract(13 - index, 'day');
    const start = currentDay.startOf('day').valueOf();
    const end = currentDay.endOf('day').valueOf();
    const mins = sessions
      .filter(session => session.startTime >= start && session.startTime <= end)
      .reduce((sum, session) => sum + session.actualMs / 60_000, 0);
    return { date: currentDay.format('MM/DD'), mins: Math.round(mins) };
  });

  const barOpt = {
    grid: { top: 24, right: 16, bottom: 30, left: 40 },
    xAxis: {
      type: 'category',
      data: days14.map(day => day.date),
      axisLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.2)' : '#cbd5e1' } },
      axisLabel: { color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b' }
    },
    yAxis: {
      type: 'value',
      name: '分钟',
      nameTextStyle: { color: isDark ? 'rgba(255,255,255,0.5)' : '#94a3b8' },
      splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.18)' } },
      axisLabel: { color: isDark ? 'rgba(255,255,255,0.5)' : '#94a3b8' }
    },
    tooltip: { trigger: 'axis', backgroundColor: isDark ? 'rgba(10,14,28,0.9)' : 'rgba(255,255,255,0.95)', borderColor: isDark ? accent + '44' : '#e2e8f0', textStyle: { color: isDark ? '#f8fafc' : '#0f172a' } },
    series: [{
      type: 'bar',
      data: days14.map(day => day.mins),
      itemStyle: { color: accent, borderRadius: [6, 6, 0, 0] },
      emphasis: { itemStyle: { color: accent + 'dd' } }
    }]
  };

  const pieOpt = {
    tooltip: { backgroundColor: isDark ? 'rgba(10,14,28,0.9)' : 'rgba(255,255,255,0.95)', borderColor: isDark ? accent + '44' : '#e2e8f0', textStyle: { color: isDark ? '#f8fafc' : '#0f172a' } },
    series: [{
      type: 'pie',
      radius: ['48%', '72%'],
      center: ['50%', '50%'],
      label: { color: isDark ? 'rgba(255,255,255,0.7)' : '#64748b' },
      data: FOCUS_MODES.map(currentMode => ({
        name: FOCUS_MODE_LABELS[currentMode],
        value: sessions
          .filter(session => session.mode === currentMode)
          .reduce((sum, session) => sum + session.actualMs / 60_000, 0),
        itemStyle: { color: currentMode === 'countdown' ? accent : currentMode === 'stopwatch' ? accent + 'cc' : accent + '88' }
      }))
    }]
  };

  const energyHours = Array.from({ length: 24 }).map((_, hour) => {
    const total = sessions.filter(s => dayjs(s.startTime).hour() === hour).reduce((sum, s) => sum + s.actualMs / 60_000, 0);
    const today = todaySessions.filter(s => dayjs(s.startTime).hour() === hour).reduce((sum, s) => sum + s.actualMs / 60_000, 0);
    return { hour: `${hour.toString().padStart(2, '0')}:00`, total: Math.round(total), today: Math.round(today) };
  });
  const energyOpt = {
    grid: { top: 34, right: 16, bottom: 34, left: 42 },
    xAxis: { type: 'category', data: energyHours.map(h => h.hour), axisLabel: { color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b', interval: 2 } },
    yAxis: { type: 'value', name: '分钟', nameTextStyle: { color: isDark ? 'rgba(255,255,255,0.5)' : '#94a3b8' }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.18)' } }, axisLabel: { color: isDark ? 'rgba(255,255,255,0.5)' : '#94a3b8' } },
    tooltip: { trigger: 'axis', backgroundColor: isDark ? 'rgba(10,14,28,0.9)' : 'rgba(255,255,255,0.95)', borderColor: isDark ? accent + '44' : '#e2e8f0', textStyle: { color: isDark ? '#f8fafc' : '#0f172a' } },
    legend: { data: ['历史能量', '今日能量'], textStyle: { color: isDark ? '#e2e8f0' : '#334155' } },
    series: [
      { name: '历史能量', type: 'line', smooth: true, data: energyHours.map(h => h.total), areaStyle: { color: `${accent}22` }, lineStyle: { color: accent, width: 3 }, itemStyle: { color: accent } },
      { name: '今日能量', type: 'bar', data: energyHours.map(h => h.today), itemStyle: { color: '#22c55e', borderRadius: [6, 6, 0, 0] } }
    ]
  };

  const monthOpt = {
    grid: { top: 34, right: 16, bottom: 30, left: 42 },
    xAxis: {
      type: 'category',
      data: ['上月', '本月'],
      axisLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.2)' : '#cbd5e1' } },
      axisLabel: { color: isDark ? 'rgba(255,255,255,0.68)' : '#64748b' }
    },
    yAxis: {
      type: 'value',
      name: '分钟',
      nameTextStyle: { color: isDark ? 'rgba(255,255,255,0.5)' : '#94a3b8' },
      splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.18)' } },
      axisLabel: { color: isDark ? 'rgba(255,255,255,0.5)' : '#94a3b8' }
    },
    tooltip: { trigger: 'axis', backgroundColor: isDark ? 'rgba(10,14,28,0.9)' : 'rgba(255,255,255,0.95)', borderColor: isDark ? accent + '44' : '#e2e8f0', textStyle: { color: isDark ? '#f8fafc' : '#0f172a' } },
    series: [{
      type: 'bar',
      data: [Math.round(lastMonthMin), Math.round(thisMonthMin)],
      itemStyle: { color: (params: any) => params.dataIndex === 0 ? accent + '66' : accent, borderRadius: [8, 8, 0, 0] },
      label: { show: true, position: 'top', color: isDark ? '#e2e8f0' : '#334155' }
    }]
  };

  function ChartFallback() {
    return <Skeleton active paragraph={{ rows: 6 }} style={{ padding: '20px 0' }} />;
  }

  function LazyChart({ option }: { option: any }) {
    return (
      <Suspense fallback={<ChartFallback />}>
        <ReactECharts option={option} style={{ height: 240 }} theme={isDark ? 'dark' : undefined} />
      </Suspense>
    );
  }

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      {/* Hero */}
      <Card
        bordered={false}
        className="anim-fade-in-up"
        style={{
          borderRadius: 28,
          overflow: 'hidden',
          background: isDark
            ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 50%, rgba(6,8,18,0.98) 100%)`
            : 'linear-gradient(135deg, rgba(12,74,110,0.95), rgba(37,99,235,0.92) 55%, rgba(15,23,42,0.92) 100%)',
          boxShadow: isDark
            ? `0 28px 60px ${accent}24, 0 0 40px ${accent}10`
            : '0 28px 60px rgba(37,99,235,0.18)',
          border: isDark ? `1px solid ${accent}33` : 'none'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(186,230,253,0.9)' }}>
              沉浸式专注工作台
            </Typography.Text>
            <Typography.Title
              level={2}
              style={{
                margin: '8px 0 10px',
                color: '#f8fafc',
                textShadow: isDark ? `0 0 20px ${accent}44` : 'none'
              }}
            >
              {hasSession ? f.title : '把注意力收束到一件真正重要的事上'}
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 16, color: 'rgba(226,232,240,0.84)' }}>
              支持倒计时、正计时、番茄钟和白噪音。当前数据全部保存在本地，刷新统计会实时更新。
            </Typography.Paragraph>
            <Space wrap size={10}>
              {PRESETS.map(preset => (
                <Button
                  key={preset}
                  onClick={() => setMinutes(preset)}
                  className="hover-scale"
                  style={{
                    borderRadius: 999,
                    borderColor: minutes === preset ? 'transparent' : 'rgba(255,255,255,0.22)',
                    background: minutes === preset ? 'rgba(255,255,255,0.22)' : 'transparent',
                    color: '#fff',
                    transition: 'all 0.25s ease',
                    transform: minutes === preset ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  {preset} 分钟
                </Button>
              ))}
            </Space>
          </Col>

          <Col xs={24} lg={9}>
            <div
              className="anim-fade-in-up stagger-2"
              style={{
                borderRadius: 24,
                padding: 18,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
                backdropFilter: 'blur(12px)'
              }}
            >
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Tag
                  color={f.running ? 'processing' : hasSession ? 'gold' : 'default'}
                  style={{ width: 'fit-content' }}
                >
                  {f.running ? '专注进行中' : hasSession ? '专注已暂停' : '准备开始'}
                </Tag>
                <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}>
                  模式: {FOCUS_MODE_LABELS[sessionMode]}
                </Typography.Text>
                <Typography.Title
                  level={2}
                  style={{
                    margin: 0,
                    color: '#fff',
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em',
                    textShadow: isDark ? `0 0 20px ${accent}66` : 'none'
                  }}
                >
                  {formatClock(displaySec)}
                </Typography.Title>
                <Progress
                  percent={progressPercent}
                  strokeColor="#f8fafc"
                  trailColor="rgba(255,255,255,0.12)"
                  showInfo={false}
                  strokeLinecap="round"
                />
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          {/* 专注控制 */}
          <Card
            bordered={false}
            className="anim-fade-in-up stagger-2 hover-lift"
            style={{
              borderRadius: 24,
              background: cardBg,
              border: cardBorder,
              boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)'
            }}
          >
            {!hasSession ? (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div>
                  <Typography.Text type="secondary">启动专注</Typography.Text>
                  <Typography.Title level={4} style={{ margin: '4px 0 0' }}>
                    先选模式，再开始计时
                  </Typography.Title>
                </div>

                <Space wrap>
                  <Select
                    value={mode}
                    onChange={setMode}
                    style={{ width: 160 }}
                    options={FOCUS_MODES.map(currentMode => ({ value: currentMode, label: FOCUS_MODE_LABELS[currentMode] }))}
                  />
                  <InputNumber
                    min={1}
                    max={180}
                    value={minutes}
                    onChange={value => setMinutes(value || 25)}
                    addonAfter="分钟"
                  />
                  <Switch checkedChildren="严格" unCheckedChildren="普通" checked={strict} onChange={setStrict} />
                </Space>

                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="为这次专注起一个标题"
                  style={{ borderRadius: 10 }}
                />

                <Button
                  type="primary"
                  size="large"
                  icon={<PlayCircleOutlined />}
                  onClick={start}
                  style={{
                    borderRadius: 12,
                    boxShadow: `0 8px 20px -4px ${accent}66`,
                    transition: 'all 0.25s ease'
                  }}
                >
                  开始专注
                </Button>
              </Space>
            ) : (
              <Space direction="vertical" size={18} style={{ width: '100%' }}>
                <div>
                  <Typography.Text type="secondary">{f.running ? '进行中' : '已暂停'}</Typography.Text>
                  <Typography.Title level={3} style={{ margin: '4px 0 8px' }}>{f.title}</Typography.Title>
                  <Typography.Text type="secondary">
                    {f.strictMode ? '严格模式已开启，不能暂停或提前完成。' : '暂停后可继续恢复，不会丢失这次会话。'}
                  </Typography.Text>
                </div>

                <div style={{
                  padding: 20,
                  borderRadius: 22,
                  background: f.running
                    ? `linear-gradient(135deg, ${accent}15, ${accent}08)`
                    : 'linear-gradient(135deg, rgba(250,204,21,0.1), rgba(249,115,22,0.12))',
                  border: `1px solid ${f.running ? accent + '33' : 'rgba(250,204,21,0.2)'}`,
                  transition: 'all 0.4s ease'
                }}>
                  <Typography.Text type="secondary">当前进度</Typography.Text>
                  <Typography.Title
                    level={1}
                    style={{
                      margin: '8px 0 10px',
                      fontFamily: 'monospace',
                      letterSpacing: '0.05em',
                      color: f.running ? accent : '#f59e0b'
                    }}
                  >
                    {formatClock(displaySec)}
                  </Typography.Title>
                  <Progress
                    percent={progressPercent}
                    strokeColor={f.running ? accent : '#f59e0b'}
                    strokeLinecap="round"
                    trailColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)'}
                  />
                  <Input.TextArea
                    placeholder="记录本次专注的感想、结论或下一步动作"
                    value={impression}
                    onChange={e => setImpression(e.target.value)}
                    rows={3}
                    style={{
                      marginTop: 16,
                      borderRadius: 10,
                      background: isDark ? 'rgba(10,14,28,0.5)' : 'rgba(255,255,255,0.7)'
                    }}
                  />
                </div>

                <Space wrap size={10}>
                  {!f.running && !f.strictMode ? (
                    <Button
                      type="primary"
                      icon={<ReloadOutlined />}
                      onClick={f.resume}
                      style={{ borderRadius: 10, boxShadow: `0 8px 20px -4px ${accent}44` }}
                    >
                      继续专注
                    </Button>
                  ) : null}
                  {f.running ? (
                    <Button
                      icon={<PauseCircleOutlined />}
                      disabled={f.strictMode}
                      onClick={f.pause}
                      style={{ borderRadius: 10 }}
                    >
                      暂停
                    </Button>
                  ) : null}
                  <Button
                    type="primary"
                    icon={<StopOutlined />}
                    disabled={f.strictMode}
                    onClick={() => finish(false)}
                    style={{ borderRadius: 10 }}
                  >
                    完成
                  </Button>
                  <Button danger onClick={() => finish(true)} style={{ borderRadius: 10 }}>放弃</Button>
                </Space>
              </Space>
            )}
          </Card>

          <Card
            bordered={false}
            className="anim-fade-in-up stagger-2 hover-lift"
            style={{
              marginTop: 16,
              borderRadius: 24,
              background: cardBg,
              border: cardBorder,
              boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)'
            }}
          >
            <Typography.Text style={{ color: isDark ? 'rgba(226,232,240,0.72)' : '#64748b' }}>专注智能场景识别</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 10px' }}>{scene.name} · {scene.minutes} 分钟</Typography.Title>
            <Typography.Paragraph style={{ color: isDark ? 'rgba(226,232,240,0.72)' : '#64748b' }}>{scene.reason}。{sceneBoost}</Typography.Paragraph>
            <Space wrap>
              <Tag color={scene.strict ? 'red' : 'blue'}>{scene.strict ? '严格模式' : '普通模式'}</Tag>
              <Tag color="purple">{FOCUS_MODE_LABELS[scene.mode]}</Tag>
              <Tag color="green">近况 {recentCompletion || 0}%</Tag>
              <Button size="small" type="primary" onClick={() => { setMode(scene.mode); setMinutes(scene.minutes); setStrict(scene.strict); setTitle(scene.title); }} style={{ borderRadius: 10 }}>
                应用场景
              </Button>
              <Button size="small" loading={aixLoading} onClick={generateAixFocusPlan} style={{ borderRadius: 10 }}>
                Aix 深度策略
              </Button>
            </Space>
            {aixFocusPlan ? <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', color: isDark ? 'rgba(226,232,240,0.82)' : '#475569', margin: '12px 0 0' }}>{aixFocusPlan}</Typography.Paragraph> : null}
          </Card>

          {/* 白噪音 */}
          <Card
            bordered={false}
            className="anim-fade-in-up stagger-3 hover-lift"
            style={{
              marginTop: 16,
              borderRadius: 24,
              background: cardBg,
              border: cardBorder,
              boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)'
            }}
          >
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                <SoundOutlined /> 白噪音工作室
              </Typography.Title>
              <Space wrap>
                <Button
                  type={!noise ? 'primary' : 'default'}
                  onClick={() => toggleNoise(null)}
                  style={{ borderRadius: 10 }}
                >
                  关闭
                </Button>
                {(['white', 'pink', 'brown', 'rain', 'keyboard'] as const).map(key => (
                  <Button
                    key={key}
                    type={noise === key ? 'primary' : 'default'}
                    onClick={() => toggleNoise(key)}
                    style={{
                      borderRadius: 10,
                      transition: 'all 0.25s ease',
                      transform: noise === key ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    {NOISE_LABELS[key]}
                  </Button>
                ))}
              </Space>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Typography.Text>音量</Typography.Text>
                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={value => {
                    setVolumeState(value);
                    setVolume(value);
                  }}
                  style={{ flex: 1 }}
                  trackStyle={{ background: accent }}
                  handleStyle={{ borderColor: accent }}
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          {/* 统计卡片 */}
          <Row gutter={[12, 12]}>
            {[
              { title: '今日专注', value: todayMin.toFixed(0), suffix: '分钟', icon: <FireOutlined />, color: accent, key: 'today' },
              { title: '平均时长', value: averageMin, suffix: '分钟', icon: <FieldTimeOutlined />, color: accent + 'cc', key: 'avg' },
              { title: '完成率', value: successRate, suffix: '%', icon: <TrophyOutlined />, color: '#16a34a', key: 'rate' },
              { title: '总次数', value: sessions.length, suffix: '', icon: <FireOutlined />, color: accent + '88', key: 'total' },
              { title: '最佳时段', value: bestHourLabel, suffix: bestHourMin > 0 ? ` (${Math.round(bestHourMin)}分)` : '', icon: <AreaChartOutlined />, color: '#a78bfa', key: 'best' },
              { title: '周同比', value: weekChange > 0 ? `+${weekChange}` : weekChange, suffix: '%', icon: <RiseOutlined />, color: weekChange >= 0 ? '#22c55e' : '#ef4444', key: 'week' },
              { title: '月同比', value: monthChange > 0 ? `+${monthChange}` : monthChange, suffix: '%', icon: <AreaChartOutlined />, color: monthChange >= 0 ? '#22c55e' : '#ef4444', key: 'month' },
              { title: '质量评级', value: qualityAverage >= 90 ? 'S' : qualityAverage >= 75 ? 'A' : qualityAverage >= 55 ? 'B' : qualityAverage ? 'C' : '--', suffix: qualityAverage ? ` ${qualityAverage}分` : '', icon: <TrophyOutlined />, color: qualityAverage >= 75 ? '#22c55e' : qualityAverage >= 55 ? '#f59e0b' : '#ef4444', key: 'quality' }
            ].map((stat, i) => (
              <Col span={12} key={stat.key}>
                <Card
                  bordered={false}
                  className="anim-fade-in-up hover-lift"
                  style={{
                    borderRadius: 20,
                    background: cardBg,
                    border: cardBorder,
                    animationDelay: `${0.1 + i * 0.06}s`,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Statistic
                    title={
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: isDark ? `${accent}aa` : '#64748b' }}>
                        {stat.icon} {stat.title}
                      </span>
                    }
                    value={stat.value}
                    suffix={stat.suffix}
                    valueStyle={{ fontSize: 28, fontWeight: 700, color: stat.color }}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          {/* 图表 */}
          <Card
            bordered={false}
            className="anim-fade-in-up stagger-3"
            style={{
              marginTop: 16,
              borderRadius: 24,
              background: cardBg,
              border: cardBorder,
              boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)'
            }}
          >
            <Tabs
              defaultActiveKey="timeline"
              destroyInactiveTabPane
              items={[
                {
                  key: 'energy',
                  label: '能量曲线',
                  children: sessions.length > 0
                    ? <LazyChart option={energyOpt} />
                    : <Empty text="暂无数据" subtext="完成专注后会按小时生成能量曲线" />
                },
                {
                  key: 'trend',
                  label: '近 14 天',
                  children: <LazyChart option={barOpt} />
                },
                {
                  key: 'mode',
                  label: '模式分布',
                  children: sessions.length > 0
                    ? <LazyChart option={pieOpt} />
                    : <Empty text="暂无数据" subtext="开始专注后会自动生成统计图表" />
                },
                {
                  key: 'month',
                  label: '月同比',
                  children: sessions.length > 0
                    ? <LazyChart option={monthOpt} />
                    : <Empty text="暂无数据" subtext="完成专注后会自动对比本月与上月" />
                },
                {
                  key: 'quality',
                  label: '质量评级',
                  children: qualitySessions.length === 0 ? (
                    <Empty text="暂无评级" subtext="完成专注后会自动生成质量分" />
                  ) : (
                    <List
                      split={false}
                      dataSource={qualitySessions}
                      renderItem={(session: any) => (
                        <List.Item style={{ paddingInline: 0 }}>
                          <div style={{ width: '100%', padding: 14, borderRadius: 18, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)', border: isDark ? `1px solid ${accent}15` : '1px solid transparent' }}>
                            <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                              <Typography.Text strong>{session.title}</Typography.Text>
                              <Tag color={session.grade === 'S' || session.grade === 'A' ? 'green' : session.grade === 'B' ? 'gold' : 'red'} style={{ borderRadius: 6 }}>{session.grade} · {session.score}分</Tag>
                            </Space>
                            <Progress percent={session.score} showInfo={false} strokeColor={session.grade === 'S' || session.grade === 'A' ? '#22c55e' : session.grade === 'B' ? '#f59e0b' : '#ef4444'} style={{ margin: '10px 0 4px' }} />
                            <Typography.Text type="secondary">{Math.round(session.actualMs / 60_000)} / {Math.round(session.plannedMs / 60_000)} 分钟 · {session.giveUp ? '已放弃' : session.strictMode ? '严格完成' : '普通完成'}</Typography.Text>
                          </div>
                        </List.Item>
                      )}
                    />
                  )
                },
                {
                  key: 'timeline',
                  label: '最近记录',
                  children: sessions.length === 0 ? (
                    <Empty text="暂无记录" subtext="完成第一次专注后这里会显示历史" />
                  ) : (
                    <List
                      split={false}
                      dataSource={sessions.slice(0, 10)}
                      renderItem={(session: any) => (
                        <List.Item style={{ paddingInline: 0 }}>
                          <div
                            className="hover-lift"
                            style={{
                              width: '100%',
                              padding: 14,
                              borderRadius: 18,
                              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)',
                              border: isDark ? `1px solid ${accent}15` : '1px solid transparent',
                              transition: 'all 0.3s ease',
                              marginBottom: 8
                            }}
                          >
                            <Space wrap size={[8, 8]}>
                              <Tag
                                color={session.giveUp ? 'red' : 'green'}
                                style={{ borderRadius: 6 }}
                              >
                                {FOCUS_MODE_LABELS[session.mode]}
                              </Tag>
                              <Tag style={{ borderRadius: 6 }}>{Math.round(session.actualMs / 60_000)} 分钟</Tag>
                            </Space>
                            <Typography.Title level={5} style={{ margin: '10px 0 4px' }}>
                              {session.title}
                            </Typography.Title>
                            <Typography.Text type="secondary" style={{ display: 'block' }}>
                              {fmtDateTime(session.startTime)}
                            </Typography.Text>
                            {session.impression ? (
                              <Typography.Paragraph style={{ margin: '8px 0 0', color: '#475569' }}>
                                {session.impression}
                              </Typography.Paragraph>
                            ) : null}
                          </div>
                        </List.Item>
                      )}
                    />
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
