// 全部事项 - 工作台风格 (v0.24.0 完善升级)
import React, { useState, useMemo } from 'react';
import { Button, Card, Col, Input, Row, Select, Space, Statistic, Tag, Typography, Divider, Segmented, Popconfirm, message } from 'antd';
import {
  AppstoreOutlined, CalendarOutlined, CheckCircleOutlined,
  ClockCircleOutlined, DeleteOutlined, FilterOutlined,
  OrderedListOutlined, PlusOutlined, SearchOutlined,
  SortAscendingOutlined, UnorderedListOutlined
} from '@ant-design/icons';
import { useItems } from '@/hooks/useItems';
import { useClassifies } from '@/hooks/useClassifies';
import ItemCard from '@/components/ItemCard';
import Empty from '@/components/Empty';
import { ITEM_TYPES } from '@/config/itemTypes';
import type { ItemType } from '@/config/itemTypes';
import { useAppStore } from '@/stores/appStore';
import { useThemeVariants } from '@/hooks/useVariants';
import { db } from '@/db';

type SortMode = 'time' | 'name' | 'type';
type StatusFilter = 'all' | 'pending' | 'done' | 'overdue';

export default function AllPage() {
  const [type, setType] = useState<ItemType | undefined>();
  const [classifyId, setClassifyId] = useState<string | undefined>();
  const [kw, setKw] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('time');
  const items = useItems({ type, classifyId, pinnedFirst: true }) || [];
  const classifies = useClassifies() || [];
  const openItemForm = useAppStore(s => s.openItemForm);
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
    if (status === 'pending') list = list.filter(i => i.completeStatus === 'pending');
    else if (status === 'done') list = list.filter(i => i.completeStatus === 'done');
    else if (status === 'overdue') list = list.filter(i => i.completeStatus === 'overdue' || (i.completeStatus === 'pending' && i.startTime < Date.now()));
    if (sortMode === 'name') list = [...list].sort((a, b) => a.title.localeCompare(b.title, 'zh'));
    else if (sortMode === 'type') list = [...list].sort((a, b) => a.type.localeCompare(b.type));
    return list;
  }, [items, kw, status, sortMode]);

  const done = items.filter(i => i.completeStatus === 'done').length;
  const pending = items.filter(i => i.completeStatus === 'pending').length;
  const overdue = items.filter(i => i.completeStatus === 'pending' && i.startTime < Date.now()).length;
  const pinned = items.filter(i => i.pinned).length;

  const batchComplete = async () => {
    const ids = filtered.filter(i => i.completeStatus === 'pending').map(i => i.id);
    if (!ids.length) return message.info('没有待处理事项');
    for (const id of ids) await db.items.update(id, { completeStatus: 'done', completeTime: Date.now() });
    message.success(`已完成 ${ids.length} 项`);
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      {/* Hero */}
      <Card
        bordered={false}
        className="anim-fade-in-up"
        style={{
          borderRadius: 28, overflow: 'hidden',
          background: isDark
            ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
            : 'linear-gradient(135deg, rgba(99,102,241,0.94), rgba(37,99,235,0.9) 45%, rgba(15,23,42,0.92) 100%)',
          boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(99,102,241,0.16)',
          border: isDark ? `1px solid ${accent}33` : 'none'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(224,242,254,0.85)' }}>
              事项工作台
            </Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#f8fafc', textShadow: isDark ? `0 0 20px ${accent}44` : 'none' }}>
              全部事项 · 一站式管理
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 14, color: 'rgba(226,232,240,0.84)' }}>
              跨类型、跨分类查看所有事项，支持多维度筛选、排序和批量操作。
            </Typography.Paragraph>
            <Space wrap size={8}>
              <Tag color="blue">{ITEM_TYPES.length} 种类型</Tag>
              <Tag color="green">{classifies.length} 个分类</Tag>
              <Tag color="purple">{items.length} 条事项</Tag>
            </Space>
          </Col>
          <Col xs={24} lg={9}>
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 22, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title={<span style={{ color: 'rgba(226,232,240,0.7)' }}>完成率</span>} value={items.length ? Math.round(done / items.length * 100) : 0} suffix="%" valueStyle={{ color: '#fff', fontSize: 28 }} />
                </Card>
              </Col>
              <Col span={12}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 22, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title={<span style={{ color: 'rgba(226,232,240,0.7)' }}>置顶</span>} value={pinned} valueStyle={{ color: '#fff', fontSize: 28 }} />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* 统计 */}
      <Row gutter={[16, 16]}>
        {[
          { label: '全部', value: items.length, color: '#38bdf8', icon: <OrderedListOutlined /> },
          { label: '已完成', value: done, color: '#22c55e', icon: <CheckCircleOutlined /> },
          { label: '待处理', value: pending, color: '#3b82f6', icon: <ClockCircleOutlined /> },
          { label: '已过期', value: overdue, color: '#ef4444', icon: <CalendarOutlined /> }
        ].map((s, i) => (
          <Col xs={12} md={6} key={s.label}>
            <Card bordered={false} className="anim-fade-in-up hover-lift"
              style={{ borderRadius: 22, background: cardBg, border: cardBorder, animationDelay: `${0.06 + i * 0.04}s` }}>
              <Statistic
                title={<span style={{ display: 'flex', alignItems: 'center', gap: 6, color: subColor }}>{s.icon} {s.label}</span>}
                value={s.value}
                valueStyle={{ fontSize: 28, fontWeight: 700, color: s.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 筛选栏 */}
      <Card bordered={false} className="anim-fade-in-up stagger-2" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Row gutter={[16, 12]} align="middle">
          <Col flex="auto">
            <Space wrap size={10}>
              <Input
                prefix={<SearchOutlined style={{ color: subColor }} />}
                placeholder="搜索标题"
                value={kw}
                onChange={e => setKw(e.target.value)}
                allowClear
                style={{ width: 200, borderRadius: 12 }}
              />
              <Select
                placeholder="所有类型"
                allowClear
                value={type}
                onChange={setType}
                style={{ width: 140 }}
                options={ITEM_TYPES.map(t => ({ value: t.key, label: t.label }))}
                suffixIcon={<FilterOutlined />}
              />
              <Select
                placeholder="所有分类"
                allowClear
                value={classifyId}
                onChange={setClassifyId}
                style={{ width: 140 }}
                options={classifies.map(c => ({ value: c.id, label: c.name }))}
                suffixIcon={<AppstoreOutlined />}
              />
              <Segmented
                value={status}
                onChange={v => setStatus(v as StatusFilter)}
                options={[
                  { label: '全部', value: 'all' },
                  { label: '待处理', value: 'pending' },
                  { label: '已完成', value: 'done' },
                  { label: '已过期', value: 'overdue' }
                ]}
              />
              <Segmented
                value={sortMode}
                onChange={v => setSortMode(v as SortMode)}
                options={[
                  { label: '按时间', value: 'time', icon: <ClockCircleOutlined /> },
                  { label: '按名称', value: 'name', icon: <SortAscendingOutlined /> },
                  { label: '按类型', value: 'type', icon: <UnorderedListOutlined /> }
                ]}
              />
            </Space>
          </Col>
          <Col>
            <Space size={8}>
              <Popconfirm title={`将 ${filtered.filter(i => i.completeStatus === 'pending').length} 条待处理全部标记完成？`} onConfirm={batchComplete}>
                <Button icon={<CheckCircleOutlined />}>批量完成</Button>
              </Popconfirm>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openItemForm()} style={{ borderRadius: 10 }}>新建</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 列表 */}
      <Card bordered={false} className="anim-fade-in-up stagger-3" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <Typography.Text style={{ color: subColor }}>事项列表</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 0', color: titleColor }}>
              {kw ? `搜索 "${kw}" 的结果` : type ? `${ITEM_TYPES.find(t => t.key === type)?.label || ''} 事项` : '全部事项'}
            </Typography.Title>
          </div>
          <Space wrap size={8}>
            <Tag color="blue">命中 {filtered.length}</Tag>
            {kw && <Tag color="default">关键词: {kw}</Tag>}
          </Space>
        </div>
        <Divider style={{ margin: '0 0 16px' }} />
        {filtered.length === 0
          ? <Empty text="没有匹配的事项" subtext="调整筛选条件或新建一条事项吧" />
          : filtered.map((it, i) => <ItemCard key={it.id} item={it} showDate index={i} />)
        }
      </Card>
    </Space>
  );
}
