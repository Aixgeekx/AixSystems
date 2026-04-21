// 重复规则选择器 - 支持所有常见 RRULE + 记忆曲线
import React, { useState, useEffect } from 'react';
import { Select, InputNumber, Checkbox, Space } from 'antd';
import { buildRRule } from '@/utils/rrule';

interface Props { value?: string; onChange?: (v?: string) => void; }

export default function RepeatPicker({ value, onChange }: Props) {
  const [mode, setMode] = useState<string>('none');
  const [interval, setIntervalN] = useState(1);
  const [weekdays, setWeekdays] = useState<number[]>([]);

  useEffect(() => {
    if (!value) setMode('none');
    else if (value === 'memory_curve') setMode('memory_curve');
    else if (value.includes('FREQ=DAILY')) setMode('daily');
    else if (value.includes('FREQ=WEEKLY')) setMode('weekly');
    else if (value.includes('FREQ=MONTHLY')) setMode('monthly');
    else if (value.includes('FREQ=YEARLY')) setMode('yearly');
  }, [value]);

  const emit = (m: string, iv = interval, wd = weekdays) => {
    if (m === 'none') return onChange?.(undefined);
    if (m === 'memory_curve') return onChange?.('memory_curve');
    const freq = m === 'workday' ? 'weekly' : (m as 'daily' | 'weekly' | 'monthly' | 'yearly');
    const byweekday = m === 'workday' ? [0, 1, 2, 3, 4] : (m === 'weekly' ? wd : undefined);
    onChange?.(buildRRule({ freq, interval: iv, byweekday }));
  };

  return (
    <Space wrap>
      <Select value={mode} onChange={v => { setMode(v); emit(v); }} style={{ width: 160 }}
        options={[
          { value: 'none', label: '不重复' },
          { value: 'daily', label: '每天' },
          { value: 'weekly', label: '每周' },
          { value: 'monthly', label: '每月' },
          { value: 'yearly', label: '每年' },
          { value: 'workday', label: '每个工作日' },
          { value: 'memory_curve', label: '记忆曲线' }
        ]} />
      {(mode === 'daily' || mode === 'weekly' || mode === 'monthly' || mode === 'yearly') && (
        <>
          <span>每隔</span>
          <InputNumber min={1} max={99} value={interval} onChange={n => { setIntervalN(n || 1); emit(mode, n || 1); }} style={{ width: 70 }} />
          <span>{mode === 'daily' ? '天' : mode === 'weekly' ? '周' : mode === 'monthly' ? '月' : '年'}</span>
        </>
      )}
      {mode === 'weekly' && (
        <Checkbox.Group value={weekdays} onChange={v => { setWeekdays(v as number[]); emit(mode, interval, v as number[]); }}
          options={[{label:'一',value:0},{label:'二',value:1},{label:'三',value:2},{label:'四',value:3},{label:'五',value:4},{label:'六',value:5},{label:'日',value:6}]} />
      )}
    </Space>
  );
}
