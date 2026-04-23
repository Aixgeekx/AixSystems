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
import { FOCUS_MODES, FOCUS_MODE_LABELS } from '@/config/constants';
import { useFocusStore } from '@/stores/focusStore';
import { currentNoise, NOISE_LABELS, playNoise, setVolume, stopNoise } from '@/utils/audio';
import { fmtDateTime } from '@/utils/time';
import { useThemeVariants } from '@/hooks/useVariants';
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
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

  const [mode, setMode] = useState<'countdown' | 'stopwatch' | 'pomodoro'>('pomodoro');
  const [minutes, setMinutes] = useState(25);
  const [title, setTitle] = useState('深度工作');
  const [strict, setStrict] = useState(false);
  const [noise, setNoise] = useState<string | null>(() => currentNoise());
  const [volume, setVolumeState] = useState(0.3);
  const [impression, setImpression] = useState('');

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

  const hourMap: Record<number, number> = {};
  for (const s of sessions) { hourMap[dayjs(s.startTime).hour()] = (hourMap[dayjs(s.startTime).hour()] || 0) + s.actualMs / 60_000; }
  let bestHour = -1, bestHourMin = 0;
  for (const [h, m] of Object.entries(hourMap)) { if (m > bestHourMin) { bestHourMin = m; bestHour = parseInt(h); } }
  const bestHourLabel = bestHour >= 0 ? `${bestHour.toString().padStart(2, '0')}:00` : '--';

  const weekStart = dayjs().startOf('week').valueOf();
  const lastWeekStart = dayjs().subtract(1, 'week').startOf('week').valueOf();
  const thisWeekMin = sessions.filter(s => s.startTime >= weekStart).reduce((sum, s) => sum + s.actualMs / 60_000, 0);
  const lastWeekMin = sessions.filter(s => s.startTime >= lastWeekStart && s.startTime < weekStart).reduce((sum, s) => sum + s.actualMs / 60_000, 0);
  const weekChange = lastWeekMin > 0 ? Math.round((thisWeekMin - lastWeekMin) / lastWeekMin * 100) : 0;

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
              { title: '周同比', value: weekChange > 0 ? `+${weekChange}` : weekChange, suffix: '%', icon: <RiseOutlined />, color: weekChange >= 0 ? '#22c55e' : '#ef4444', key: 'week' }
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
