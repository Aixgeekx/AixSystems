// 番茄专注 - 三模式 + 白噪音 + 日柱状图 + 时间轴 + 感想
import React, { useEffect, useState } from 'react';
import { Card, Button, Select, InputNumber, Switch, Progress, Row, Col, Statistic, Tabs, List, Tag, Space, Slider, Input } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, StopOutlined, SoundOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useFocusStore } from '@/stores/focusStore';
import { FOCUS_MODES, FOCUS_MODE_LABELS } from '@/config/constants';
import { db } from '@/db';
import { nanoid } from 'nanoid';
import { useLiveQuery } from 'dexie-react-hooks';
import ReactECharts from 'echarts-for-react';
import { playNoise, stopNoise, setVolume, currentNoise, NOISE_LABELS } from '@/utils/audio';
import { fmtDateTime, fmtDate } from '@/utils/time';

export default function FocusPage() {
  const f = useFocusStore();
  const [mode, setMode] = useState<'countdown' | 'stopwatch' | 'pomodoro'>('pomodoro');
  const [minutes, setMinutes] = useState(25);
  const [title, setTitle] = useState('专注工作');
  const [strict, setStrict] = useState(false);
  const [noise, setNoise] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(0.3);
  const [impression, setImpression] = useState('');

  useEffect(() => {
    if (!f.running) return;
    const t = setInterval(() => f.tick(), 1000);
    return () => clearInterval(t);
  }, [f.running]);

  useEffect(() => () => { stopNoise(); }, []);

  const sessions = useLiveQuery(() => db.focusSessions.orderBy('startTime').reverse().limit(200).toArray(), []) || [];

  function start() {
    f.start({ mode, plannedMs: minutes * 60_000, title, strict });
  }

  async function finish(giveUp = false) {
    await db.focusSessions.add({
      id: nanoid(), mode: f.mode, title: f.title, plannedMs: f.plannedMs,
      actualMs: f.elapsedMs, startTime: f.startAt, endTime: Date.now(),
      giveUp, strictMode: f.strictMode, impression, createdAt: Date.now()
    });
    stopNoise();
    setNoise(null);
    setImpression('');
    f.stop();
  }

  function toggleNoise(k: string | null) {
    if (!k) { stopNoise(); setNoise(null); return; }
    playNoise(k as any, volume);
    setNoise(k);
  }

  const pct = f.plannedMs ? Math.min(100, Math.round(f.elapsedMs / f.plannedMs * 100)) : 0;
  const remainSec = Math.max(0, Math.floor((f.plannedMs - f.elapsedMs) / 1000));
  const totalMin = sessions.reduce((s, x) => s + x.actualMs / 60_000, 0);

  // 最近 14 天日柱状图
  const days14 = Array.from({ length: 14 }).map((_, i) => {
    const d = dayjs().subtract(13 - i, 'day');
    const ms = d.startOf('day').valueOf();
    const me = d.endOf('day').valueOf();
    const mins = sessions.filter(s => s.startTime >= ms && s.startTime <= me).reduce((a, b) => a + b.actualMs / 60_000, 0);
    return { date: d.format('MM/DD'), mins: Math.round(mins) };
  });

  const barOpt = {
    grid: { top: 30, right: 16, bottom: 30, left: 40 },
    xAxis: { type: 'category', data: days14.map(d => d.date) },
    yAxis: { type: 'value', name: '分钟' },
    tooltip: { trigger: 'axis' },
    series: [{ type: 'bar', data: days14.map(d => d.mins), itemStyle: { color: '#fa541c', borderRadius: [4, 4, 0, 0] } }]
  };

  const pieOpt = {
    tooltip: {},
    series: [{ type: 'pie', radius: ['45%','70%'], data: FOCUS_MODES.map(m => ({
      name: FOCUS_MODE_LABELS[m], value: sessions.filter(s => s.mode === m).reduce((a,b) => a + b.actualMs/60_000, 0)
    })) }]
  };

  return (
    <div>
      <Row gutter={16}>
        <Col span={14}>
          <Card title="专注面板">
            {!f.running ? (
              <>
                <Space wrap style={{ marginBottom: 12 }}>
                  <Select value={mode} onChange={setMode} style={{ width: 140 }}
                    options={FOCUS_MODES.map(m => ({ value: m, label: FOCUS_MODE_LABELS[m] }))} />
                  <InputNumber min={1} max={180} value={minutes} onChange={v => setMinutes(v || 25)} addonAfter="分钟" />
                  <Switch checkedChildren="严格" unCheckedChildren="普通" checked={strict} onChange={setStrict} />
                </Space>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="专注标题" style={{ marginBottom: 16 }} />
                <Button type="primary" icon={<PlayCircleOutlined />} size="large" onClick={start}>开始专注</Button>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <h2>{f.title}</h2>
                <div style={{ fontSize: 48, fontWeight: 300, margin: '16px 0' }}>
                  {Math.floor(remainSec / 60)}:{(remainSec % 60).toString().padStart(2, '0')}
                </div>
                <Progress percent={pct} />
                <Input.TextArea placeholder="专注过程中有什么收获?" value={impression}
                  onChange={e => setImpression(e.target.value)} rows={2} style={{ margin: '16px 0' }} />
                <Space>
                  <Button icon={<PauseCircleOutlined />} disabled={f.strictMode} onClick={f.pause}>暂停</Button>
                  <Button type="primary" icon={<StopOutlined />} disabled={f.strictMode} onClick={() => finish(false)}>完成</Button>
                  <Button danger onClick={() => finish(true)}>放弃</Button>
                </Space>
                {f.strictMode && <div style={{ color: '#ff4d4f', marginTop: 12 }}>严格模式:无法暂停或提前完成</div>}
              </div>
            )}
          </Card>

          <Card title={<><SoundOutlined /> 白噪音</>} size="small" style={{ marginTop: 16 }}>
            <Space wrap>
              <Button type={!noise ? 'primary' : 'default'} onClick={() => toggleNoise(null)}>关闭</Button>
              {(['white','pink','brown','rain','keyboard'] as const).map(k => (
                <Button key={k} type={noise === k ? 'primary' : 'default'} onClick={() => toggleNoise(k)}>{NOISE_LABELS[k]}</Button>
              ))}
            </Space>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span>音量</span>
              <Slider min={0} max={1} step={0.05} value={volume} onChange={v => { setVolumeState(v); setVolume(v); }} style={{ flex: 1 }} />
            </div>
          </Card>
        </Col>

        <Col span={10}>
          <Card title="统计">
            <Row gutter={8}>
              <Col span={8}><Statistic title="总次数" value={sessions.length} /></Col>
              <Col span={8}><Statistic title="总时长(分)" value={totalMin.toFixed(0)} /></Col>
              <Col span={8}><Statistic title="放弃" value={sessions.filter(s => s.giveUp).length} valueStyle={{ color: '#ff4d4f' }}/></Col>
            </Row>
            <Tabs defaultActiveKey="day" items={[
              { key: 'day', label: '近 14 天', children: <ReactECharts option={barOpt} style={{ height: 220 }} /> },
              { key: 'pie', label: '模式分布', children: sessions.length > 0 ? <ReactECharts option={pieOpt} style={{ height: 220 }} /> : <div style={{ color: '#999', padding: 40, textAlign: 'center' }}>暂无数据</div> },
              { key: 'tl', label: '时间轴', children: sessions.length === 0 ? <div style={{ color: '#999', padding: 40, textAlign: 'center' }}>暂无记录</div> :
                <List size="small" dataSource={sessions.slice(0, 15)} renderItem={(s: any) => (
                  <List.Item>
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <Space>
                        <Tag color={s.giveUp ? 'red' : 'green'}>{FOCUS_MODE_LABELS[s.mode]}</Tag>
                        <strong>{s.title}</strong>
                      </Space>
                      <span style={{ color: '#888', fontSize: 12 }}>{fmtDateTime(s.startTime)} · 用时 {Math.round(s.actualMs / 60_000)} 分钟</span>
                      {s.impression && <span style={{ color: '#666' }}>感想: {s.impression}</span>}
                    </Space>
                  </List.Item>
                )} />
              }
            ]} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
