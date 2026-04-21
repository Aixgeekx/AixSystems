// 主题背景层 - 渐变 + 亮度/模糊
import React from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ThemeMeta } from '@/config/themes';

interface Props { theme: ThemeMeta; }

export default function ThemeBackground({ theme }: Props) {
  const brightness = useSettingsStore(s => s.brightness);
  const blur = useSettingsStore(s => s.blur);
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: -1,
      background: `linear-gradient(135deg, ${theme.gradient[0]} 0%, ${theme.gradient[1]} 100%)`,
      filter: `brightness(${brightness}%) blur(${blur / 10}px)`,
      transition: 'all 0.4s ease'
    }} />
  );
}
