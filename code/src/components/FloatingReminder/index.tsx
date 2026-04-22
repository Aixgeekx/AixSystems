// 浮动提醒小窗 - 支持多主题、三样式、透明度和位置记忆
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, ConfigProvider, Empty as AntEmpty, List, Slider, Space, Tag, Typography } from 'antd';
import { CloseOutlined, DragOutlined, SettingOutlined } from '@ant-design/icons';
import { useItems } from '@/hooks/useItems';
import { fmtDate, fmtFromNow, fmtTime, today0, endOfWeek } from '@/utils/time';
import { ITEM_TYPE_MAP } from '@/config/itemTypes';
import { useSettingsStore } from '@/stores/settingsStore';
import { getWidgetAntdTheme, getWidgetSkin, getWidgetThemeText, normalizeWidgetThemeMode, WIDGET_THEME_MODE_OPTIONS, type WidgetThemeMode } from '@/config/widgetThemes';

type Style = 'compact' | 'standard' | 'detail';

interface Props { onClose?: () => void; }

const POS_KEY = 'floatingWidget.pos';
const STYLE_KEY = 'floatingWidget.style';
const OPACITY_KEY = 'floatingWidget.opacity';
const SOURCE_KEY = 'floatingWidget.source';
const THEME_KEY = 'floatingWidget.theme';

export default function FloatingReminder({ onClose }: Props) {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(POS_KEY) || 'null'); } catch { return null; } })();
  const appThemeKey = useSettingsStore(s => s.theme);
  const [pos, setPos] = useState(saved || { x: 20, y: 80 });
  const [dragging, setDragging] = useState(false);
  const [style, setStyle] = useState<Style>((localStorage.getItem(STYLE_KEY) as Style) || 'standard');
  const [themeMode, setThemeMode] = useState<WidgetThemeMode>(normalizeWidgetThemeMode(localStorage.getItem(THEME_KEY)));
  const [opacity, setOpacity] = useState(Number(localStorage.getItem(OPACITY_KEY)) || 0.95);
  const [showSetting, setShowSetting] = useState(false);
  const [source, setSource] = useState<string>(localStorage.getItem(SOURCE_KEY) || 'today');

  const today = useItems({ startBetween: [today0(), today0() + 86_400_000] }) || [];
  const week = useItems({ startBetween: [today0(), endOfWeek()] }) || [];
  const data = source === 'today' ? today : source === 'week' ? week : today.filter(i => i.completeStatus === 'pending');
  const skin = getWidgetSkin(themeMode, appThemeKey);
  const antdTheme = useMemo(() => getWidgetAntdTheme(skin), [skin]);
  const themeText = getWidgetThemeText(themeMode, appThemeKey);

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
  useEffect(() => { localStorage.setItem(THEME_KEY, themeMode); }, [themeMode]);
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
    opacity,
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)'
  }), [opacity, pos.x, pos.y, width, skin]);

  const commonItemSurface = {
    width: '100%',
    padding: style === 'detail' ? 14 : 10,
    borderRadius: 16,
    background: skin.panelBg,
    border: `1px solid ${skin.divider}`
  } as React.CSSProperties;

  const renderPickers = (
    label: string,
    options: Array<{ value: string; label: string; hint?: string; }>,
    value: string,
    onChange: (next: string) => void,
    columns = 3
  ) => (
    <>
      <div style={{ margin: '10px 0 8px', color: skin.mutedColor }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 8 }}>
        {options.map(option => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              style={{
                padding: option.hint ? '10px 10px 9px' : '10px 8px',
                borderRadius: 14,
                border: `1px solid ${active ? skin.accent : skin.buttonBorder}`,
                background: active ? `linear-gradient(135deg, ${skin.accentSoft}, ${skin.buttonHoverBg})` : skin.buttonBg,
                color: active ? skin.titleColor : skin.textColor,
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: active ? `0 0 0 1px ${skin.accentSoft} inset, 0 10px 24px -16px ${skin.accentAlt}` : 'none',
                transition: 'all 0.18s ease'
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700 }}>{option.label}</div>
              {option.hint && <div style={{ marginTop: 3, fontSize: 11, color: skin.mutedColor }}>{option.hint}</div>}
            </button>
          );
        })}
      </div>
    </>
  );

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
    <ConfigProvider theme={antdTheme}>
      <Card
        size="small"
        title={(
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: skin.titleColor }}>
            <DragOutlined onMouseDown={() => setDragging(true)} style={{ cursor: 'move' }} />
            <span style={{ fontWeight: 700 }}>今日提醒</span>
            <Tag style={{ background: skin.chipBg, color: skin.chipText, border: 'none', marginInlineEnd: 0 }}>{themeText}</Tag>
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
        <div style={{ height: 2, marginBottom: 12, borderRadius: 999, background: `linear-gradient(90deg, ${skin.accent}, ${skin.accentAlt})`, opacity: 0.9 }} />

        {showSetting && (
          <div style={{ marginBottom: 12, padding: 12, background: skin.settingBg, borderRadius: 16, border: `1px solid ${skin.divider}` }}>
            {renderPickers('展示样式', [
              { value: 'compact', label: '紧凑' },
              { value: 'standard', label: '标准' },
              { value: 'detail', label: '详细' }
            ], style, next => setStyle(next as Style))}

            {renderPickers('主题风格', WIDGET_THEME_MODE_OPTIONS, themeMode, next => setThemeMode(next as WidgetThemeMode), 2)}

            {renderPickers('数据源', [
              { value: 'today', label: '今日' },
              { value: 'week', label: '本周' },
              { value: 'pending', label: '未完成' }
            ], source, setSource)}

            <div style={{ margin: '10px 0 8px', color: skin.mutedColor }}>透明度 {(opacity * 100).toFixed(0)}%</div>
            <Slider min={0.4} max={1} step={0.05} value={opacity} onChange={value => setOpacity(value as number)} />
          </div>
        )}

        {data.length === 0 ? (
          <AntEmpty image={AntEmpty.PRESENTED_IMAGE_SIMPLE} imageStyle={{ opacity: 0.4 }} description={<span style={{ color: skin.mutedColor }}>暂无事项</span>} />
        ) : (
          <List size="small" dataSource={data.slice(0, style === 'detail' ? 10 : 6)} renderItem={renderItem} />
        )}
      </Card>
    </ConfigProvider>
  );
}
