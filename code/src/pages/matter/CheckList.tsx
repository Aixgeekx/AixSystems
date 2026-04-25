// 清单视图 - 工作台风格 (v0.24.0 完善升级)
import React, { useState, useMemo } from 'react';
import { Button, Card, Col, Input, Progress, Row, Space, Statistic, Tag, Typography, Divider, Segmented } from 'antd';
import { CheckSquareOutlined, CheckCircleOutlined, ClockCircleOutlined, PlusOutlined, SearchOutlined, TrophyOutlined } from '@ant-design/icons';
import { useItems } from '@/hooks/useItems';
import ItemCard from '@/components/ItemCard';
import Empty from '@/components/Empty';
import { useAppStore } from '@/stores/appStore';
import { useThemeVariants } from '@/hooks/useVariants';

type ViewFilter = 'all' | 'pending' | 'done';

export default function CheckListPage() {
  const items = useItems({ type: 'checklist', pinnedFirst: true }) || [];
  const openItemForm = useAppStore(s => s.openItemForm);
  const [kw, setKw] = useState('');
  const [view, setView] = useState<ViewFilter>('all');
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const filtered = useMemo(() => {
    let list = items;
    if (kw) list = list.filter(i => i.title.toLowerCase().includes(kw.toLowerCase()));
    if (view === 'pending') list = list.filter(i => i.completeStatus === 'pending');
    else if (view === 'done') list = list.filter(i => i.completeStatus === 'done');
    return list;
  }, [items, kw, view]);

  const done = items.filter(i => i.completeStatus === 'done').length;
  const pending = items.filter(i => i.completeStatus === 'pending').length;
  const completion = items.length ? Math.round(done / items.length * 100) : 0;
  const subtaskTotal = items.reduce((s, i) => s + (i.subtasks?.length || 0), 0);
  const subtaskDone = items.reduce((s, i) => s + (i.subtasks?.filter(st => st.done).length || 0), 0);

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 28, overflow: 'hidden',
        background: isDark
          ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
          : 'linear-gradient(135deg, rgba(16,185,129,0.94), rgba(5,150,105,0.9) 45%, rgba(15,23,42,0.92) 100%)',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(16,185,129,0.16)',
        border: isDark ? `1px solid ${accent}33` : 'none'
      }} bodyStyle={{ padding: 24 }}>
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(224,242,254,0.85)' }}>
              <CheckSquareOutlined /> 清单管理
            </Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#f8fafc' }}>
              清单 · 逐条推进每件事
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 14, color: 'rgba(226,232,240,0.84)' }}>
              以清单形式管理待办，支持子任务分解，随时掌握整体进度。
            </Typography.Paragraph>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openItemForm(undefined, 'checklist')}
              style={{ borderRadius: 12, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}>
              新建清单
            </Button>
          </Col>
          <Col xs={24} lg={9}>
            <div style={{ borderRadius: 24, padding: 18, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.16)', backdropFilter: 'blur(10px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Typography.Text strong style={{ color: '#f8fafc' }}>整体完成率</Typography.Text>
                <Tag color={completion >= 80 ? 'green' : completion >= 50 ? 'gold' : 'blue'} style={{ marginInlineEnd: 0 }}>
                  {completion >= 80 ? '优秀' : completion >= 50 ? '进行中' : '加油'}
                </Tag>
              </div>
              <Progress percent={completion} strokeColor={{ from: '#10b981', to: '#34d399' }} trailColor="rgba(255,255,255,0.14)"
                format={v => <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{v}%</span>} />
              {subtaskTotal > 0 && (
                <div style={{ marginTop: 6, color: 'rgba(226,232,240,0.7)', fontSize: 12 }}>
                  子任务: {subtaskDone}/{subtaskTotal}
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {[
          { label: '全部', value: items.length, color: '#38bdf8', icon: <CheckSquareOutlined /> },
          { label: '已完成', value: done, color: '#22c55e', icon: <CheckCircleOutlined /> },
          { label: '进行中', value: pending, color: '#f59e0b', icon: <ClockCircleOutlined /> },
          { label: '子任务', value: subtaskDone, color: '#8b5cf6', icon: <TrophyOutlined /> }
        ].map((s, i) => (
          <Col xs={12} md={6} key={s.label}>
            <Card bordered={false} className="anim-fade-in-up hover-lift"
              style={{ borderRadius: 22, background: cardBg, border: cardBorder, animationDelay: `${0.06 + i * 0.04}s` }}>
              <Statistic title={<span style={{ display: 'flex', alignItems: 'center', gap: 6, color: subColor }}>{s.icon} {s.label}</span>}
                value={s.value} valueStyle={{ fontSize: 28, fontWeight: 700, color: s.color }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card bordered={false} className="anim-fade-in-up stagger-2" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Space wrap size={10}>
          <Input prefix={<SearchOutlined />} placeholder="搜索清单" value={kw} onChange={e => setKw(e.target.value)} allowClear style={{ width: 200, borderRadius: 12 }} />
          <Segmented value={view} onChange={v => setView(v as ViewFilter)} options={[
            { label: '全部', value: 'all' }, { label: '进行中', value: 'pending' }, { label: '已完成', value: 'done' }
          ]} />
        </Space>
      </Card>

      <Card bordered={false} className="anim-fade-in-up stagger-3" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>
            {view === 'pending' ? '进行中' : view === 'done' ? '已完成' : '全部清单'}
          </Typography.Title>
          <Tag color="green">共 {filtered.length} 条</Tag>
        </div>
        <Divider style={{ margin: '0 0 16px' }} />
        {filtered.length === 0
          ? <Empty text="暂无清单" subtext="清单适合把大任务拆成可执行的小步骤" />
          : filtered.map((it, i) => <ItemCard key={it.id} item={it} showDate index={i} />)
        }
      </Card>
    </Space>
  );
}
