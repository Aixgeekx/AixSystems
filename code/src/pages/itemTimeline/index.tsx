// 事项时间线 - 事项完成时间轴
import React, { useMemo, useState } from 'react';
import { Card, Col, Empty, Select, Space, Tag, Timeline, Typography } from 'antd';
import { ClockCircleOutlined, CarryOutOutlined, FilterOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db } from '@/db';
import { useThemeVariants } from '@/hooks/useVariants';
import { ITEM_TYPES } from '@/config/itemTypes';

const TYPE_MAP: Record<string, { label: string; color: string }> = {};
ITEM_TYPES.forEach(t => { TYPE_MAP[t.key] = { label: t.label, color: t.color }; });

const STATUS_COLORS: Record<string, string> = { done: '#22c55e', pending: '#f59e0b', overdue: '#ef4444', failed: '#6b7280', postponed: '#8b5cf6' };
const STATUS_LABELS: Record<string, string> = { done: '已完成', pending: '待处理', overdue: '已逾期', failed: '已失败', postponed: '已推迟' };

export default function ItemTimelinePage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const [status, setStatus] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const items = useLiveQuery(() => db.items.filter(i => !i.deletedAt).toArray(), []);

  const filtered = useMemo(() => {
    let list = (items || []).filter(i => !i.deletedAt);
    if (status !== 'all') list = list.filter(i => i.completeStatus === status);
    if (typeFilter !== 'all') list = list.filter(i => i.type === typeFilter);
    return list.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
  }, [items, status, typeFilter]);

  const todayItems = useMemo(() => {
    const todayStart = dayjs().startOf('day').valueOf();
    return filtered.filter(i => (i.startTime >= todayStart && i.startTime < todayStart + 86400000) || (i.completeTime && i.completeTime >= todayStart));
  }, [filtered]);

  const weekItems = useMemo(() => {
    const weekStart = dayjs().startOf('week').valueOf();
    return filtered.filter(i => i.startTime >= weekStart || (i.completeTime && i.completeTime >= weekStart));
  }, [filtered]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    (items || []).forEach(i => set.add(i.type));
    return [{ value: 'all', label: '全部类型' }, ...Array.from(set).map(t => ({ value: t, label: TYPE_MAP[t]?.label || t }))];
  }, [items]);

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : `linear-gradient(135deg, #3b82f6, #2563eb 52%, #0f172a)`,
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: `0 28px 60px ${accent}20`
      }} bodyStyle={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><ClockCircleOutlined /> 事项时间线</Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 0', color: '#fff' }}>事项时间轴</Typography.Title>
          </div>
          <Space>
            <Select value={status} onChange={setStatus} style={{ width: 110 }}
              options={[{ value: 'all', label: '全部状态' }, ...Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))]} />
            <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 120 }}
              options={typeOptions} showSearch optionFilterProp="label" />
          </Space>
        </div>
      </Card>

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>
          <FilterOutlined /> 快速统计
        </Typography.Title>
        <Space size={16} wrap>
          <Tag color="blue" style={{ borderRadius: 999, fontSize: 13, padding: '4px 14px' }}>总计 {filtered.length}</Tag>
          <Tag color="green" style={{ borderRadius: 999, fontSize: 13, padding: '4px 14px' }}>今日 {todayItems.length}</Tag>
          <Tag color="orange" style={{ borderRadius: 999, fontSize: 13, padding: '4px 14px' }}>本周 {weekItems.length}</Tag>
          <Tag color="purple" style={{ borderRadius: 999, fontSize: 13, padding: '4px 14px' }}>已完成 {filtered.filter(i => i.completeStatus === 'done').length}</Tag>
        </Space>
      </Card>

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>
          <CarryOutOutlined /> 事项时间轴
        </Typography.Title>
        {filtered.length > 0 ? (
          <Timeline mode="left" items={filtered.slice(0, 50).map(item => {
            const statusColor = STATUS_COLORS[item.completeStatus] || '#94a3b8';
            const time = item.completeTime ? dayjs(item.completeTime) : dayjs(item.updatedAt || item.createdAt);
            const typeLabel = TYPE_MAP[item.type]?.label || item.type;
            return {
              dot: <div style={{ width: 12, height: 12, borderRadius: '50%', background: statusColor, border: `2px solid ${statusColor}44` }} />,
              children: (
                <div style={{ padding: '4px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Typography.Text style={{ fontWeight: 600, color: titleColor, fontSize: 14 }}>{item.title}</Typography.Text>
                      <Space size={4} style={{ marginLeft: 8 }}>
                        <Tag style={{ borderRadius: 999, fontSize: 10, background: `${statusColor}18`, border: `1px solid ${statusColor}44`, color: statusColor }}>{STATUS_LABELS[item.completeStatus] || item.completeStatus}</Tag>
                        <Tag style={{ borderRadius: 999, fontSize: 10, background: `${accent}14`, border: `1px solid ${accent}33`, color: accent }}>{typeLabel}</Tag>
                      </Space>
                    </div>
                    <span style={{ color: subColor, fontSize: 12, whiteSpace: 'nowrap' }}>{time.format('MM/DD HH:mm')}</span>
                  </div>
                  {item.description && <div style={{ color: subColor, fontSize: 12, marginTop: 2, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>}
                  {item.subtasks && item.subtasks.length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      <div style={{ height: 4, borderRadius: 2, background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9', width: 120 }}>
                        <div style={{ height: '100%', width: `${Math.round(item.subtasks.filter(s => s.done).length / item.subtasks.length * 100)}%`, borderRadius: 2, background: statusColor, transition: 'width 0.5s' }} />
                      </div>
                      <span style={{ fontSize: 10, color: subColor }}>{item.subtasks.filter(s => s.done).length}/{item.subtasks.length} 子任务</span>
                    </div>
                  )}
                </div>
              ),
              label: <span style={{ color: subColor, fontSize: 11 }}>{time.format('MM月DD日')}</span>
            };
          })} />
        ) : (
          <Empty description="暂无事项记录" />
        )}
      </Card>
    </Space>
  );
}
