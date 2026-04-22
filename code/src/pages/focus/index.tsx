// 番茄专注 - 三模式 + 暂停恢复 + 白噪音 + 统计
import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Input, InputNumber, List, Progress, Row, Slider, Space, Statistic, Switch, Tabs, Tag, Typography, Select } from 'antd';
import {
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SoundOutlined,
  StopOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';
import { useLiveQuery } from 'dexie-react-hooks';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { FOCUS_MODES, FOCUS_MODE_LABELS } from '@/config/constants';
import { useFocusStore } from '@/stores/focusStore';
import { currentNoise, NOISE_LABELS, playNoise, setVolume, stopNoise } from '@/utils/audio';
import { fmtDateTime } from '@/utils/time';

const PRESETS = [15, 25, 45, 90];

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
      axisLine: { lineStyle: { color: '#cbd5e1' } }
    },
    yAxis: {
      type: 'value',
      name: '分钟',
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.18)' } }
    },
    tooltip: { trigger: 'axis' },
    series: [{
      type: 'bar',
      data: days14.map(day => day.mins),
      itemStyle: { color: '#2563eb', borderRadius: [6, 6, 0, 0] }
    }]
  };

  const pieOpt = {
    tooltip: {},
    series: [{
      type: 'pie',
      radius: ['48%', '72%'],
      data: FOCUS_MODES.map(currentMode => ({
        name: FOCUS_MODE_LABELS[currentMode],
        value: sessions
          .filter(session => session.mode === currentMode)
          .reduce((sum, session) => sum + session.actualMs / 60_000, 0)
      }))
    }]
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card
        bordered={false}
        style={{
          borderRadius: 28,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(12,74,110,0.95), rgba(37,99,235,0.92) 55%, rgba(15,23,42,0.92) 100%)',
          boxShadow: '0 28px 60px rgba(37,99,235,0.18)'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: 'rgba(186,230,253,0.9)' }}>沉浸式专注工作台</Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#f8fafc' }}>
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
                  style={{
                    borderRadius: 999,
                    borderColor: minutes === preset ? 'transparent' : 'rgba(255,255,255,0.22)',
                    background: minutes === preset ? 'rgba(255,255,255,0.18)' : 'transparent',
                    color: '#fff'
                  }}
                >
                  {preset} 分钟
                </Button>
              ))}
            </Space>
          </Col>

          <Col xs={24} lg={9}>
            <div style={{
              borderRadius: 24,
              padding: 18,
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.16)',
              backdropFilter: 'blur(12px)'
            }}>
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Tag color={f.running ? 'processing' : hasSession ? 'gold' : 'default'} style={{ width: 'fit-content' }}>
                  {f.running ? '专注进行中' : hasSession ? '专注已暂停' : '准备开始'}
                </Tag>
                <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}>
                  模式: {FOCUS_MODE_LABELS[sessionMode]}
                </Typography.Text>
                <Typography.Title level={2} style={{ margin: 0, color: '#fff' }}>
                  {formatClock(displaySec)}
                </Typography.Title>
                <Progress
                  percent={progressPercent}
                  strokeColor="#f8fafc"
                  trailColor="rgba(255,255,255,0.12)"
                  showInfo={false}
                />
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card bordered={false} style={{ borderRadius: 24, background: 'rgba(255,255,255,0.92)' }}>
            {!hasSession ? (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div>
                  <Typography.Text type="secondary">启动专注</Typography.Text>
                  <Typography.Title level={4} style={{ margin: '4px 0 0' }}>先选模式，再开始计时</Typography.Title>
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
                />

                <Button type="primary" size="large" icon={<PlayCircleOutlined />} onClick={start}>
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
                  background: f.running ? 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(14,165,233,0.12))' : 'linear-gradient(135deg, rgba(250,204,21,0.1), rgba(249,115,22,0.12))'
                }}>
                  <Typography.Text type="secondary">当前进度</Typography.Text>
                  <Typography.Title level={1} style={{ margin: '8px 0 10px' }}>
                    {formatClock(displaySec)}
                  </Typography.Title>
                  <Progress percent={progressPercent} strokeColor={f.running ? '#2563eb' : '#f59e0b'} />
                  <Input.TextArea
                    placeholder="记录本次专注的感想、结论或下一步动作"
                    value={impression}
                    onChange={e => setImpression(e.target.value)}
                    rows={3}
                    style={{ marginTop: 16 }}
                  />
                </div>

                <Space wrap size={10}>
                  {!f.running && !f.strictMode ? (
                    <Button type="primary" icon={<ReloadOutlined />} onClick={f.resume}>
                      继续专注
                    </Button>
                  ) : null}
                  {f.running ? (
                    <Button icon={<PauseCircleOutlined />} disabled={f.strictMode} onClick={f.pause}>
                      暂停
                    </Button>
                  ) : null}
                  <Button type="primary" icon={<StopOutlined />} disabled={f.strictMode} onClick={() => finish(false)}>
                    完成
                  </Button>
                  <Button danger onClick={() => finish(true)}>放弃</Button>
                </Space>
              </Space>
            )}
          </Card>

          <Card bordered={false} style={{ marginTop: 16, borderRadius: 24, background: 'rgba(255,255,255,0.92)' }}>
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                <SoundOutlined /> 白噪音工作室
              </Typography.Title>
              <Space wrap>
                <Button type={!noise ? 'primary' : 'default'} onClick={() => toggleNoise(null)}>关闭</Button>
                {(['white', 'pink', 'brown', 'rain', 'keyboard'] as const).map(key => (
                  <Button key={key} type={noise === key ? 'primary' : 'default'} onClick={() => toggleNoise(key)}>
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
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Row gutter={[12, 12]}>
            <Col span={12}>
              <Card bordered={false} style={{ borderRadius: 20, background: 'rgba(255,255,255,0.92)' }}>
                <Statistic title="今日专注" value={todayMin.toFixed(0)} suffix="分钟" />
              </Card>
            </Col>
            <Col span={12}>
              <Card bordered={false} style={{ borderRadius: 20, background: 'rgba(255,255,255,0.92)' }}>
                <Statistic title="平均时长" value={averageMin} suffix="分钟" />
              </Card>
            </Col>
            <Col span={12}>
              <Card bordered={false} style={{ borderRadius: 20, background: 'rgba(255,255,255,0.92)' }}>
                <Statistic title="完成率" value={successRate} suffix="%" valueStyle={{ color: '#16a34a' }} />
              </Card>
            </Col>
            <Col span={12}>
              <Card bordered={false} style={{ borderRadius: 20, background: 'rgba(255,255,255,0.92)' }}>
                <Statistic title="总次数" value={sessions.length} />
              </Card>
            </Col>
          </Row>

          <Card bordered={false} style={{ marginTop: 16, borderRadius: 24, background: 'rgba(255,255,255,0.92)' }}>
            <Tabs
              defaultActiveKey="trend"
              items={[
                {
                  key: 'trend',
                  label: '近 14 天',
                  children: <ReactECharts option={barOpt} style={{ height: 240 }} />
                },
                {
                  key: 'mode',
                  label: '模式分布',
                  children: sessions.length > 0
                    ? <ReactECharts option={pieOpt} style={{ height: 240 }} />
                    : <div style={{ color: '#94a3b8', padding: 40, textAlign: 'center' }}>暂无数据</div>
                },
                {
                  key: 'timeline',
                  label: '最近记录',
                  children: sessions.length === 0 ? (
                    <div style={{ color: '#94a3b8', padding: 40, textAlign: 'center' }}>暂无记录</div>
                  ) : (
                    <List
                      split={false}
                      dataSource={sessions.slice(0, 10)}
                      renderItem={(session: any) => (
                        <List.Item style={{ paddingInline: 0 }}>
                          <div style={{ width: '100%', padding: 14, borderRadius: 18, background: 'rgba(15,23,42,0.03)' }}>
                            <Space wrap size={[8, 8]}>
                              <Tag color={session.giveUp ? 'red' : 'green'}>{FOCUS_MODE_LABELS[session.mode]}</Tag>
                              <Tag>{Math.round(session.actualMs / 60_000)} 分钟</Tag>
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
