// 主题背景层 - 动态响应多套风格
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
  const accentGlow = hexToRgba(theme.accent, 0.28);
  const style = theme.style;

  const renderCyberpunk = () => (
    <>
      <style>{`
        @keyframes cyberPulse {
          0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.72; }
          50% { transform: translate3d(1%, -2%, 0) scale(1.04); opacity: 1; }
          100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.72; }
        }
        @keyframes cyberGridDrift {
          0% { transform: translateY(0); }
          100% { transform: translateY(36px); }
        }
        @keyframes cyberScanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(circle at 18% 20%, rgba(85,243,255,0.16), transparent 26%),
          radial-gradient(circle at 84% 18%, rgba(255,79,216,0.18), transparent 28%),
          radial-gradient(circle at 72% 78%, ${accentGlow}, transparent 26%),
          linear-gradient(180deg, #020617 0%, #060c1b 42%, #01030a 100%)
        `
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(85,243,255,0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(85,243,255,0.08) 1px, transparent 1px)
        `,
        backgroundSize: '36px 36px',
        maskImage: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.92) 26%, rgba(0,0,0,0.92) 100%)',
        animation: 'cyberGridDrift 18s linear infinite'
      }} />
      <div style={{
        position: 'absolute', top: '-12%', left: '-8%', width: '42vw', height: '42vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(85,243,255,0.2) 0%, rgba(85,243,255,0.06) 32%, transparent 72%)',
        animation: 'cyberPulse 16s ease-in-out infinite'
      }} />
    </>
  );

  const renderLightDay = () => (
    <>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${theme.gradient[0]} 0%, ${theme.gradient[1]} 100%)` }} />
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '60vw', height: '60vw', borderRadius: '50%', background: `radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 60%)`, filter: 'blur(40px)' }} />
    </>
  );

  const renderDarkNight = () => (
    <>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${theme.gradient[0]} 0%, ${theme.gradient[1]} 100%)` }} />
      <div style={{ position: 'absolute', top: '10%', left: '20%', width: '40vw', height: '40vw', borderRadius: '50%', background: `radial-gradient(circle, ${accentGlow} 0%, transparent 60%)`, filter: 'blur(60px)' }} />
    </>
  );

  const renderMinimal = () => (
    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${theme.gradient[0]} 0%, ${theme.gradient[1]} 100%)` }} />
  );

  const renderRetro = () => (
    <>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${theme.gradient[0]} 0%, ${theme.gradient[1]} 100%)` }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.08%22/%3E%3C/svg%3E")' }} />
    </>
  );

  const renderGradient = () => (
    <>
      <style>{`
        @keyframes floatGradA {
          0% { transform: translate3d(-2%, 0%, 0) scale(1); }
          50% { transform: translate3d(4%, -3%, 0) scale(1.08); }
          100% { transform: translate3d(-2%, 0%, 0) scale(1); }
        }
      `}</style>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${theme.gradient[0]} 0%, ${theme.gradient[1]} 100%)` }} />
      <div style={{
        position: 'absolute', top: '-10%', left: '-5%', width: '50vw', height: '50vw', borderRadius: '50%',
        background: `radial-gradient(circle, ${accentGlow} 0%, transparent 70%)`,
        animation: 'floatGradA 18s ease-in-out infinite'
      }} />
    </>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute',
        inset: -80,
        filter: `brightness(${brightness}%) blur(${blur / 10}px)`,
        transition: 'filter 0.35s ease'
      }}>
        {style === 'cyberpunk' && renderCyberpunk()}
        {style === 'light' && renderLightDay()}
        {style === 'dark' && renderDarkNight()}
        {style === 'minimal' && renderMinimal()}
        {style === 'retro' && renderRetro()}
        {style === 'gradient' && renderGradient()}
      </div>
    </div>
  );
}
