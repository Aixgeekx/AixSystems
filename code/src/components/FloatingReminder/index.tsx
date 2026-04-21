// 浮动提醒小窗 - 紧凑/标准/详细三样式,透明度可调,位置记忆
import React, { useState, useEffect } from 'react';
import { Card, Button, List, Tag, Segmented, Slider, Space, Empty as AntEmpty } from 'antd';
import { CloseOutlined, DragOutlined, SettingOutlined } from '@ant-design/icons';
import { useItems } from '@/hooks/useItems';
import { fmtTime, fmtDate, today0, endOfWeek } from '@/utils/time';
import { ITEM_TYPE_MAP } from '@/config/itemTypes';

type Style = 'compact' | 'standard' | 'detail';

interface Props { onClose?: () => void; }

const POS_KEY = 'floatingWidget.pos';
const STYLE_KEY = 'floatingWidget.style';
const OPACITY_KEY = 'floatingWidget.opacity';
const SOURCE_KEY = 'floatingWidget.source';

export default function FloatingReminder({ onClose }: Props) {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(POS_KEY) || 'null'); } catch { return null; } })();
  const [pos, setPos] = useState(saved || { x: 20, y: 80 });
  const [dragging, setDragging] = useState(false);
  const [style, setStyle] = useState<Style>((localStorage.getItem(STYLE_KEY) as Style) || 'standard');
  const [opacity, setOpacity] = useState(Number(localStorage.getItem(OPACITY_KEY)) || 0.95);
  const [showSetting, setShowSetting] = useState(false);
  const [source, setSource] = useState<string>(localStorage.getItem(SOURCE_KEY) || 'today');

  const today = useItems({ startBetween: [today0(), today0() + 86_400_000] }) || [];
  const week = useItems({ startBetween: [today0(), endOfWeek()] }) || [];
  const data = source === 'today' ? today : source === 'week' ? week : today.filter(i => i.completeStatus === 'pending');

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX - 100, y: e.clientY - 20 });
    const onUp = () => {
      setDragging(false);
      localStorage.setItem(POS_KEY, JSON.stringify(pos));
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, pos]);

  useEffect(() => { localStorage.setItem(STYLE_KEY, style); }, [style]);
  useEffect(() => { localStorage.setItem(OPACITY_KEY, String(opacity)); }, [opacity]);
  useEffect(() => { localStorage.setItem(SOURCE_KEY, source); }, [source]);

  const width = style === 'compact' ? 220 : style === 'detail' ? 360 : 280;

  const renderItem = (i: any) => {
    const meta = ITEM_TYPE_MAP[i.type as keyof typeof ITEM_TYPE_MAP];
    if (style === 'compact') return <List.Item style={{ padding: '4px 0' }}>
      <span style={{ color: meta?.color, marginRight: 6 }}>●</span>
      <span style={{ fontSize: 12, flex: 1 }}>{i.title}</span>
      <span style={{ fontSize: 11, color: '#888' }}>{fmtTime(i.startTime)}</span>
    </List.Item>;
    if (style === 'detail') return <List.Item>
      <div style={{ width: '100%' }}>
        <Space><Tag color={meta?.color}>{meta?.label}</Tag><strong>{i.title}</strong></Space>
        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{fmtDate(i.startTime)} · {fmtTime(i.startTime)}</div>
        {i.description && <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{i.description.slice(0, 40)}</div>}
      </div>
    </List.Item>;
    return <List.Item>
      <div style={{ width: '100%' }}>
        <div style={{ fontWeight: 500 }}>{i.title}</div>
        <Tag color={meta?.color}>{fmtTime(i.startTime)}</Tag>
      </div>
    </List.Item>;
  };

  return (
    <Card size="small" title={<span>
      <DragOutlined onMouseDown={() => setDragging(true)} style={{ cursor: 'move', marginRight: 6 }} />
      今日提醒
    </span>}
      extra={<Space size={2}>
        <Button type="text" size="small" icon={<SettingOutlined />} onClick={() => setShowSetting(!showSetting)} />
        <Button type="text" size="small" icon={<CloseOutlined />} onClick={onClose} />
      </Space>}
      style={{ position: 'fixed', left: pos.x, top: pos.y, width, zIndex: 9999,
        background: `rgba(255,255,255,${opacity})`, backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>

      {showSetting && (
        <div style={{ marginBottom: 10, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
          <div style={{ marginBottom: 6 }}>样式</div>
          <Segmented value={style} onChange={v => setStyle(v as Style)} size="small"
            options={[{ value: 'compact', label: '紧凑' }, { value: 'standard', label: '标准' }, { value: 'detail', label: '详细' }]} />
          <div style={{ margin: '8px 0 6px' }}>数据源</div>
          <Segmented value={source} onChange={v => setSource(v as string)} size="small"
            options={[{ value: 'today', label: '今日' }, { value: 'week', label: '本周' }, { value: 'pending', label: '未完成' }]} />
          <div style={{ margin: '8px 0 6px' }}>透明度 {(opacity * 100).toFixed(0)}%</div>
          <Slider min={0.4} max={1} step={0.05} value={opacity} onChange={setOpacity} />
        </div>
      )}

      {data.length === 0 ? <AntEmpty image={AntEmpty.PRESENTED_IMAGE_SIMPLE} description="暂无事项" /> :
        <List size="small" dataSource={data.slice(0, style === 'detail' ? 10 : 6)} renderItem={renderItem} />
      }
    </Card>
  );
}
