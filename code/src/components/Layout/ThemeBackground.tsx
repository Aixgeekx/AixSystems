// 主题背景层 - 动态响应多套风格 (v0.24.0 高级视觉)
import React from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ThemeMeta } from '@/config/themes';

interface Props { theme: ThemeMeta; }

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map(s => s + s).join('') : value;
  const num = Number.parseInt(full, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

export default function ThemeBackground({ theme }: Props) {
  const brightness = useSettingsStore(s => s.brightness);
  const blur = useSettingsStore(s => s.blur);
  const accentGlow = hexToRgba(theme.accent, 0.28);
  const accentSoft = hexToRgba(theme.accent, 0.12);
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
          0% { transform: translateY(-100%); opacity: 0.6; }
          50% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0.6; }
        }
        @keyframes cyberFlicker {
          0%, 95%, 100% { opacity: 1; }
          96% { opacity: 0.8; }
          97% { opacity: 1; }
          98% { opacity: 0.6; }
        }
      `}</style>
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse at 18% 20%, rgba(85,243,255,0.18), transparent 30%),
          radial-gradient(ellipse at 84% 18%, rgba(255,79,216,0.2), transparent 32%),
          radial-gradient(ellipse at 50% 80%, ${accentGlow}, transparent 30%),
          radial-gradient(ellipse at 72% 50%, rgba(124,58,237,0.12), transparent 28%),
          linear-gradient(180deg, #020617 0%, #060c1b 42%, #01030a 100%)
        `
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(85,243,255,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(85,243,255,0.06) 1px, transparent 1px)
        `,
        backgroundSize: '36px 36px',
        maskImage: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 20%, rgba(0,0,0,0.8) 80%, transparent 100%)',
        animation: 'cyberGridDrift 18s linear infinite'
      }} />
      <div style={{
        position: 'absolute', top: '-12%', left: '-8%', width: '42vw', height: '42vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(85,243,255,0.2) 0%, rgba(85,243,255,0.06) 32%, transparent 72%)',
        animation: 'cyberPulse 16s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute', bottom: '-8%', right: '-5%', width: '35vw', height: '35vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,79,216,0.14) 0%, transparent 65%)',
        animation: 'cyberPulse 20s ease-in-out infinite', animationDelay: '-8s'
      }} />
      {/* 扫描线 */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(85,243,255,0.3), transparent)',
        animation: 'cyberScanline 8s linear infinite', pointerEvents: 'none'
      }} />
    </>
  );

  const renderLightDay = () => (
    <>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${theme.gradient[0]} 0%, ${theme.gradient[1]} 100%)` }} />
      <div style={{
        position: 'absolute', top: '-15%', right: '-10%', width: '65vw', height: '65vw', borderRadius: '50%',
        background: `radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.3) 40%, transparent 65%)`,
        filter: 'blur(40px)'
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', left: '-10%', width: '50vw', height: '50vw', borderRadius: '50%',
        background: `radial-gradient(circle, ${accentSoft} 0%, transparent 60%)`,
        filter: 'blur(60px)', animation: 'floatGradA 22s ease-in-out infinite'
      }} />
      {/* 细腻光点 */}
      <div style={{
        position: 'absolute', top: '20%', left: '60%', width: 180, height: 180, borderRadius: '50%',
        background: `radial-gradient(circle, ${hexToRgba(theme.accent, 0.08)} 0%, transparent 70%)`,
        animation: 'float 8s ease-in-out infinite'
      }} />
    </>
  );

  const renderDarkNight = () => (
    <>
      <style>{`
        @keyframes auroraShift {
          0% { transform: translateX(0) translateY(0) rotate(0deg); }
          33% { transform: translateX(3%) translateY(-2%) rotate(1deg); }
          66% { transform: translateX(-2%) translateY(1%) rotate(-0.5deg); }
          100% { transform: translateX(0) translateY(0) rotate(0deg); }
        }
      `}</style>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${theme.gradient[0]} 0%, ${theme.gradient[1]} 100%)` }} />
      {/* 极光效果 */}
      <div style={{
        position: 'absolute', top: '5%', left: '15%', width: '50vw', height: '50vw', borderRadius: '50%',
        background: `radial-gradient(circle, ${accentGlow} 0%, transparent 55%)`,
        filter: 'blur(70px)', animation: 'auroraShift 24s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '10%', width: '35vw', height: '35vw', borderRadius: '50%',
        background: `radial-gradient(circle, ${hexToRgba(theme.accent, 0.15)} 0%, transparent 55%)`,
        filter: 'blur(50px)', animation: 'auroraShift 18s ease-in-out infinite', animationDelay: '-6s'
      }} />
      {/* 星点 */}
      <div style={{
        position: 'absolute', top: '12%', right: '25%', width: 3, height: 3, borderRadius: '50%',
        background: 'rgba(255,255,255,0.6)', animation: 'softPulse 4s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute', top: '35%', left: '40%', width: 2, height: 2, borderRadius: '50%',
        background: 'rgba(255,255,255,0.4)', animation: 'softPulse 5s ease-in-out infinite', animationDelay: '-2s'
      }} />
      <div style={{
        position: 'absolute', bottom: '25%', left: '18%', width: 2, height: 2, borderRadius: '50%',
        background: 'rgba(255,255,255,0.35)', animation: 'softPulse 6s ease-in-out infinite', animationDelay: '-4s'
      }} />
    </>
  );

  const renderMinimal = () => (
    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${theme.gradient[0]} 0%, ${theme.gradient[1]} 100%)` }} />
  );

  const renderRetro = () => (
    <>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${theme.gradient[0]} 0%, ${theme.gradient[1]} 100%)` }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.08%22/%3E%3C/svg%3E")' }} />
      <div style={{
        position: 'absolute', top: '15%', left: '20%', width: '30vw', height: '30vw', borderRadius: '50%',
        background: `radial-gradient(circle, ${hexToRgba(theme.accent, 0.1)} 0%, transparent 55%)`,
        filter: 'blur(40px)'
      }} />
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
        @keyframes floatGradB {
          0% { transform: translate3d(2%, 1%, 0) scale(1); }
          50% { transform: translate3d(-3%, 4%, 0) scale(1.06); }
          100% { transform: translate3d(2%, 1%, 0) scale(1); }
        }
      `}</style>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${theme.gradient[0]} 0%, ${theme.gradient[1]} 100%)` }} />
      <div style={{
        position: 'absolute', top: '-10%', left: '-5%', width: '50vw', height: '50vw', borderRadius: '50%',
        background: `radial-gradient(circle, ${accentGlow} 0%, transparent 65%)`,
        animation: 'floatGradA 18s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-5%', width: '40vw', height: '40vw', borderRadius: '50%',
        background: `radial-gradient(circle, ${hexToRgba(theme.accent, 0.16)} 0%, transparent 60%)`,
        animation: 'floatGradB 22s ease-in-out infinite'
      }} />
      {/* 高光粒子 */}
      <div style={{
        position: 'absolute', top: '30%', right: '30%', width: 120, height: 120, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)`,
        animation: 'float 6s ease-in-out infinite'
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
