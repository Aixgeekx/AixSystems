// 各 type 特有字段渲染 - 按 itemType 的 extraFields 定义动态生成
import React from 'react';
import { Form, InputNumber, Input, Select } from 'antd';
import { ITEM_TYPE_MAP } from '@/config/itemTypes';
import type { ItemType } from '@/config/itemTypes';

interface Props { type: ItemType; }

const EXTRA_META: Record<string, { label: string; widget: 'number' | 'text' | 'select'; unit?: string; options?: string[] }> = {
  cycleDays:      { label: '经期周期',   widget: 'number', unit: '天' },
  durationDays:   { label: '经期天数',   widget: 'number', unit: '天' },
  cardNo:         { label: '卡号尾四位', widget: 'text' },
  amount:         { label: '金额',       widget: 'number', unit: '元' },
  bank:           { label: '银行',       widget: 'text' },
  totalAmount:    { label: '贷款总额',   widget: 'number', unit: '元' },
  periods:        { label: '期数',       widget: 'number', unit: '期' },
  monthlyPayment: { label: '月供',       widget: 'number', unit: '元' },
  dosage:         { label: '剂量',       widget: 'text' },
  frequency:      { label: '频率',       widget: 'text' },
  schedule:       { label: '作息描述',   widget: 'text' },
  distance:       { label: '距离',       widget: 'number', unit: '公里' },
  duration:       { label: '时长',       widget: 'number', unit: '分钟' },
  bookName:       { label: '书名',       widget: 'text' },
  pages:          { label: '目标页数',   widget: 'number', unit: '页' },
  classroom:      { label: '教室',       widget: 'text' },
  teacher:        { label: '老师',       widget: 'text' },
  weeks:          { label: '周次',       widget: 'text' }
};

export default function ExtraFields({ type }: Props) {
  const meta = ITEM_TYPE_MAP[type];
  const fields = meta.extraFields || [];
  if (!fields.length) return null;
  return (
    <div style={{ padding: 12, background: '#fafafa', borderRadius: 6, marginBottom: 16 }}>
      <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{meta.label}·专属字段</div>
      {fields.map(key => {
        const f = EXTRA_META[key];
        if (!f) return null;
        return (
          <Form.Item key={key} label={f.label} name={['extra', key]} style={{ marginBottom: 12 }}>
            {f.widget === 'number' ? <InputNumber addonAfter={f.unit} style={{ width: 200 }} /> : <Input style={{ width: 260 }} />}
          </Form.Item>
        );
      })}
    </div>
  );
}
