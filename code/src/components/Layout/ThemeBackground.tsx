// 主题背景层 - 渐变 + 光斑 + 细纹理
import React from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ThemeMeta } from '@/config/themes';

interface Props { theme: ThemeMeta; }

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map(s => s + s).join('') : value;
  const num = Number.parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function ThemeBackground({ theme }: Props) {
  const brightness = useSettingsStore(s => s.brightness);
  const blur = useSettingsStore(s => s.blur);
  const accentSoft = hexToRgba(theme.accent, 0.24);
  const accentGlow = hexToRgba(theme.accent, 0.38);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' }}>
      <style>{`
        @keyframes aixFloatA {
          0% { transform: translate3d(-2%, 0%, 0) scale(1); }
          50% { transform: translate3d(4%, -3%, 0) scale(1.08); }
          100% { transform: translate3d(-2%, 0%, 0) scale(1); }
        }
        @keyframes aixFloatB {
          0% { transform: translate3d(0%, 0%, 0) scale(1); }
          50% { transform: translate3d(-4%, 5%, 0) scale(1.06); }
          100% { transform: translate3d(0%, 0%, 0) scale(1); }
        }
        @keyframes aixDrift {
          0% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -10px, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
      `}</style>

      <div style={{
        position: 'absolute',
        inset: -60,
        filter: `brightness(${brightness}%) blur(${blur / 10}px)`,
        transition: 'filter 0.4s ease'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${theme.gradient[0]} 0%, ${theme.gradient[1]} 100%)`
        }} />

        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 18% 20%, ${hexToRgba(theme.gradient[0], 0.68)} 0%, transparent 34%),
            radial-gradient(circle at 82% 16%, ${accentGlow} 0%, transparent 28%),
            radial-gradient(circle at 74% 78%, ${hexToRgba(theme.gradient[1], 0.28)} 0%, transparent 30%)
          `,
          mixBlendMode: 'screen',
          opacity: 0.95
        }} />

        <div style={{
          position: 'absolute',
          top: '-8%',
          left: '-4%',
          width: '48vw',
          height: '48vw',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentGlow} 0%, ${accentSoft} 34%, transparent 72%)`,
          animation: 'aixFloatA 18s ease-in-out infinite'
        }} />

        <div style={{
          position: 'absolute',
          right: '-8%',
          bottom: '-12%',
          width: '42vw',
          height: '42vw',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${hexToRgba(theme.gradient[0], 0.44)} 0%, ${hexToRgba(theme.gradient[1], 0.18)} 42%, transparent 74%)`,
          animation: 'aixFloatB 24s ease-in-out infinite'
        }} />

        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(115deg, rgba(255,255,255,0.08) 0%, transparent 34%),
            linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: 'auto, 34px 34px, 34px 34px',
          opacity: 0.36,
          animation: 'aixDrift 12s ease-in-out infinite'
        }} />
      </div>

      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(15,23,42,0.04) 100%)'
      }} />
    </div>
  );
}
