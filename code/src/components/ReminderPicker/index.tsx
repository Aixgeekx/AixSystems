// 提醒选择器 - 最多 5 条,每条是 offsetMs (v0.21.4 主题适配)
import React from 'react';
import { Select, Space, Tag, Button } from 'antd';
import { MAX_REMINDERS } from '@/config/constants';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import type { Reminder } from '@/models';
import { useThemeVariants } from '@/hooks/useVariants';

interface Props { value?: Reminder[]; onChange?: (v: Reminder[]) => void; }

const PRESETS: Array<{ label: string; offsetMs: number }> = [
  { label: '准时', offsetMs: 0 },
  { label: '提前 5 分钟', offsetMs: -5 * 60_000 },
  { label: '提前 15 分钟', offsetMs: -15 * 60_000 },
  { label: '提前 30 分钟', offsetMs: -30 * 60_000 },
  { label: '提前 1 小时', offsetMs: -60 * 60_000 },
  { label: '提前 1 天', offsetMs: -24 * 60 * 60_000 },
  { label: '提前 3 天', offsetMs: -3 * 24 * 60 * 60_000 }
];

export default function ReminderPicker({ value = [], onChange }: Props) {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const list = value || [];
  const canAdd = list.length < MAX_REMINDERS;

  const add = (offsetMs: number) => {
    const label = PRESETS.find(p => p.offsetMs === offsetMs)?.label;
    onChange?.([...list, { offsetMs, label }]);
  };
  const remove = (i: number) => onChange?.(list.filter((_, idx) => idx !== i));

  return (
    <Space wrap>
      {list.map((r, i) => (
        <Tag key={i} color="blue" closable closeIcon={<CloseOutlined />} onClose={() => remove(i)}>
          {r.label || `偏移 ${r.offsetMs / 60_000} 分钟`}
        </Tag>
      ))}
      {canAdd && (
        <Select placeholder="添加提醒" style={{ width: 160 }}
          suffixIcon={<PlusOutlined />} value={undefined as any}
          options={PRESETS.map(p => ({ value: p.offsetMs, label: p.label }))}
          onChange={(v) => add(v)} />
      )}
      {!canAdd && <span style={{ color: isDark ? '#64748b' : '#999' }}>最多 {MAX_REMINDERS} 个提醒</span>}
    </Space>
  );
}
