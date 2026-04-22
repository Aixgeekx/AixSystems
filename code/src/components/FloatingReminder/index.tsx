// 浮动提醒小窗 - 支持多主题、三样式、透明度和位置记忆
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty as AntEmpty, List, Segmented, Select, Slider, Space, Tag, Typography } from 'antd';
import { CloseOutlined, DragOutlined, SettingOutlined } from '@ant-design/icons';
import { useItems } from '@/hooks/useItems';
import { fmtDate, fmtFromNow, fmtTime, today0, endOfWeek } from '@/utils/time';
import { ITEM_TYPE_MAP } from '@/config/itemTypes';

type Style = 'compact' | 'standard' | 'detail';
type WidgetTheme = 'daylight' | 'night' | 'minimal' | 'cyberpunk' | 'gradient' | 'retro';

interface Props { onClose?: () => void; }

const POS_KEY = 'floatingWidget.pos';
const STYLE_KEY = 'floatingWidget.style';
const OPACITY_KEY = 'floatingWidget.opacity';
const SOURCE_KEY = 'floatingWidget.source';
const THEME_KEY = 'floatingWidget.theme';

const WIDGET_THEMES: Record<WidgetTheme, {
  label: string;
  shellBg: string;
  shellBorder: string;
  shellShadow: string;
  titleColor: string;
  textColor: string;
  mutedColor: string;
  accent: string;
  accentSoft: string;
  panelBg: string;
  settingBg: string;
  chipBg: string;
  chipText: string;
}> = {
  daylight: {
    label: '白天',
    shellBg: 'rgba(255,255,255,0.94)',
    shellBorder: 'rgba(59,130,246,0.12)',
    shellShadow: '0 18px 40px rgba(15,23,42,0.16)',
    titleColor: '#0f172a',
    textColor: '#0f172a',
    mutedColor: '#64748b',
    accent: '#2563eb',
    accentSoft: 'rgba(37,99,235,0.10)',
    panelBg: 'rgba(248,250,252,0.92)',
    settingBg: 'rgba(241,245,249,0.92)',
    chipBg: 'rgba(37,99,235,0.12)',
    chipText: '#1d4ed8'
  },
  night: {
    label: '黑夜',
    shellBg: 'rgba(8,15,28,0.92)',
    shellBorder: 'rgba(148,163,184,0.18)',
    shellShadow: '0 24px 48px rgba(2,6,23,0.44)',
    titleColor: '#f8fafc',
    textColor: '#e2e8f0',
    mutedColor: '#94a3b8',
    accent: '#38bdf8',
    accentSoft: 'rgba(56,189,248,0.12)',
    panelBg: 'rgba(15,23,42,0.72)',
    settingBg: 'rgba(15,23,42,0.92)',
    chipBg: 'rgba(56,189,248,0.12)',
    chipText: '#bae6fd'
  },
  minimal: {
    label: '简约',
    shellBg: 'rgba(248,250,252,0.96)',
    shellBorder: 'rgba(148,163,184,0.14)',
    shellShadow: '0 12px 28px rgba(15,23,42,0.12)',
    titleColor: '#111827',
    textColor: '#111827',
    mutedColor: '#6b7280',
    accent: '#111827',
    accentSoft: 'rgba(17,24,39,0.08)',
    panelBg: 'rgba(255,255,255,0.96)',
    settingBg: 'rgba(248,250,252,0.96)',
    chipBg: 'rgba(17,24,39,0.08)',
    chipText: '#111827'
  },
  cyberpunk: {
    label: '赛博朋克',
    shellBg: 'rgba(7,10,24,0.94)',
    shellBorder: 'rgba(85,243,255,0.24)',
    shellShadow: '0 0 24px rgba(85,243,255,0.18), 0 22px 48px rgba(0,0,0,0.42)',
    titleColor: '#f8fafc',
    textColor: '#e2e8f0',
    mutedColor: '#94a3b8',
    accent: '#55f3ff',
    accentSoft: 'rgba(255,79,216,0.12)',
    panelBg: 'linear-gradient(135deg, rgba(85,243,255,0.08), rgba(255,79,216,0.08))',
    settingBg: 'rgba(9,14,28,0.96)',
    chipBg: 'rgba(85,243,255,0.12)',
    chipText: '#67e8f9'
  },
  gradient: {
    label: '渐变',
    shellBg: 'linear-gradient(160deg, rgba(255,255,255,0.94), rgba(244,114,182,0.14), rgba(59,130,246,0.18))',
    shellBorder: 'rgba(255,255,255,0.35)',
    shellShadow: '0 24px 50px rgba(59,130,246,0.16)',
    titleColor: '#111827',
    textColor: '#111827',
    mutedColor: '#6b7280',
    accent: '#db2777',
    accentSoft: 'rgba(219,39,119,0.08)',
    panelBg: 'rgba(255,255,255,0.75)',
    settingBg: 'rgba(255,255,255,0.84)',
    chipBg: 'rgba(219,39,119,0.12)',
    chipText: '#be185d'
  },
  retro: {
    label: '复古',
    shellBg: 'rgba(245,236,218,0.96)',
    shellBorder: 'rgba(146,64,14,0.14)',
    shellShadow: '0 18px 40px rgba(120,53,15,0.18)',
    titleColor: '#422006',
    textColor: '#422006',
    mutedColor: '#7c5a3b',
    accent: '#b45309',
    accentSoft: 'rgba(180,83,9,0.10)',
    panelBg: 'rgba(255,248,235,0.92)',
    settingBg: 'rgba(255,244,225,0.92)',
    chipBg: 'rgba(180,83,9,0.12)',
    chipText: '#92400e'
  }
};

export default function FloatingReminder({ onClose }: Props) {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(POS_KEY) || 'null'); } catch { return null; } })();
  const [pos, setPos] = useState(saved || { x: 20, y: 80 });
  const [dragging, setDragging] = useState(false);
  const [style, setStyle] = useState<Style>((localStorage.getItem(STYLE_KEY) as Style) || 'standard');
  const [theme, setTheme] = useState<WidgetTheme>((localStorage.getItem(THEME_KEY) as WidgetTheme) || 'night');
  const [opacity, setOpacity] = useState(Number(localStorage.getItem(OPACITY_KEY)) || 0.95);
  const [showSetting, setShowSetting] = useState(false);
  const [source, setSource] = useState<string>(localStorage.getItem(SOURCE_KEY) || 'today');

  const today = useItems({ startBetween: [today0(), today0() + 86_400_000] }) || [];
  const week = useItems({ startBetween: [today0(), endOfWeek()] }) || [];
  const data = source === 'today' ? today : source === 'week' ? week : today.filter(i => i.completeStatus === 'pending');
  const skin = WIDGET_THEMES[theme];

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX - 100, y: e.clientY - 20 });
    const onUp = () => {
      setDragging(false);
      localStorage.setItem(POS_KEY, JSON.stringify(pos));
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, pos]);

  useEffect(() => { localStorage.setItem(STYLE_KEY, style); }, [style]);
  useEffect(() => { localStorage.setItem(THEME_KEY, theme); }, [theme]);
  useEffect(() => { localStorage.setItem(OPACITY_KEY, String(opacity)); }, [opacity]);
  useEffect(() => { localStorage.setItem(SOURCE_KEY, source); }, [source]);

  const width = style === 'compact' ? 236 : style === 'detail' ? 380 : 300;

  const widgetStyle = useMemo(() => ({
    position: 'fixed' as const,
    left: pos.x,
    top: pos.y,
    width,
    zIndex: 9999,
    background: skin.shellBg,
    border: `1px solid ${skin.shellBorder}`,
    boxShadow: skin.shellShadow,
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)'
  }), [pos.x, pos.y, width, skin]);

  const commonItemSurface = {
    width: '100%',
    padding: style === 'detail' ? 14 : 10,
    borderRadius: 16,
    background: skin.panelBg
  } as React.CSSProperties;

  const renderItem = (item: any) => {
    const meta = ITEM_TYPE_MAP[item.type as keyof typeof ITEM_TYPE_MAP];
    if (style === 'compact') {
      return (
        <List.Item style={{ padding: '4px 0' }}>
          <div style={{ ...commonItemSurface, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: meta?.color || skin.accent, fontSize: 16 }}>●</span>
            <span style={{ fontSize: 12, color: skin.textColor, flex: 1 }}>{item.title}</span>
            <span style={{ fontSize: 11, color: skin.mutedColor }}>{fmtTime(item.startTime)}</span>
          </div>
        </List.Item>
      );
    }

    if (style === 'detail') {
      return (
        <List.Item style={{ paddingInline: 0 }}>
          <div style={commonItemSurface}>
            <Space wrap size={[8, 8]}>
              <Tag color={meta?.color}>{meta?.label}</Tag>
              <Typography.Text strong style={{ color: skin.textColor }}>{item.title}</Typography.Text>
            </Space>
            <div style={{ fontSize: 12, color: skin.mutedColor, marginTop: 6 }}>
              {fmtDate(item.startTime)} · {fmtTime(item.startTime)} · {fmtFromNow(item.startTime)}
            </div>
            {item.description && (
              <div style={{ fontSize: 12, color: skin.textColor, opacity: 0.8, marginTop: 6 }}>
                {item.description.slice(0, 60)}
              </div>
            )}
          </div>
        </List.Item>
      );
    }

    return (
      <List.Item style={{ paddingInline: 0 }}>
        <div style={commonItemSurface}>
          <div style={{ fontWeight: 600, color: skin.textColor }}>{item.title}</div>
          <Space wrap size={[8, 8]} style={{ marginTop: 8 }}>
            <Tag color={meta?.color}>{meta?.label || '事项'}</Tag>
            <Tag style={{ background: skin.chipBg, color: skin.chipText, border: 'none' }}>{fmtTime(item.startTime)}</Tag>
          </Space>
        </div>
      </List.Item>
    );
  };

  return (
    <Card
      size="small"
      title={(
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: skin.titleColor }}>
          <DragOutlined onMouseDown={() => setDragging(true)} style={{ cursor: 'move' }} />
          <span style={{ fontWeight: 700 }}>今日提醒</span>
          <Tag style={{ background: skin.chipBg, color: skin.chipText, border: 'none', marginInlineEnd: 0 }}>{skin.label}</Tag>
        </div>
      )}
      extra={(
        <Space size={2}>
          <Button type="text" size="small" style={{ color: skin.mutedColor }} icon={<SettingOutlined />} onClick={() => setShowSetting(!showSetting)} />
          <Button type="text" size="small" style={{ color: skin.mutedColor }} icon={<CloseOutlined />} onClick={onClose} />
        </Space>
      )}
      styles={{
        header: { borderBottom: `1px solid ${skin.shellBorder}`, background: 'transparent' },
        body: { background: 'transparent', paddingTop: 12 }
      }}
      style={widgetStyle}
    >
      {showSetting && (
        <div style={{ marginBottom: 12, padding: 10, background: skin.settingBg, borderRadius: 14 }}>
          <div style={{ marginBottom: 8, color: skin.mutedColor }}>样式</div>
          <Segmented
            value={style}
            onChange={value => setStyle(value as Style)}
            size="small"
            options={[
              { value: 'compact', label: '紧凑' },
              { value: 'standard', label: '标准' },
              { value: 'detail', label: '详细' }
            ]}
          />

          <div style={{ margin: '10px 0 8px', color: skin.mutedColor }}>主题风格</div>
          <Select
            value={theme}
            onChange={value => setTheme(value as WidgetTheme)}
            style={{ width: '100%' }}
            options={Object.entries(WIDGET_THEMES).map(([value, meta]) => ({ value, label: meta.label }))}
          />

          <div style={{ margin: '10px 0 8px', color: skin.mutedColor }}>数据源</div>
          <Segmented
            value={source}
            onChange={value => setSource(value as string)}
            size="small"
            options={[
              { value: 'today', label: '今日' },
              { value: 'week', label: '本周' },
              { value: 'pending', label: '未完成' }
            ]}
          />

          <div style={{ margin: '10px 0 8px', color: skin.mutedColor }}>透明度 {(opacity * 100).toFixed(0)}%</div>
          <Slider min={0.4} max={1} step={0.05} value={opacity} onChange={setOpacity} />
        </div>
      )}

      {data.length === 0 ? (
        <AntEmpty image={AntEmpty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: skin.mutedColor }}>暂无事项</span>} />
      ) : (
        <List size="small" dataSource={data.slice(0, style === 'detail' ? 10 : 6)} renderItem={renderItem} />
      )}
    </Card>
  );
}
