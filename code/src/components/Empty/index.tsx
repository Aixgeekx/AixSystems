// 空状态占位 - 高级插画风 (v0.24.0 Premium)
import React from 'react';
import { useThemeVariants } from '@/hooks/useVariants';

interface Props { text?: string; subtext?: string; }

export default function Empty({ text = '暂无数据', subtext = '试着添加第一条记录吧' }: Props) {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

  return (
    <div
      className="anim-fade-in-up"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '52px 24px', textAlign: 'center'
      }}
    >
      {/* 多层动态插画 */}
      <div style={{ position: 'relative', width: 140, height: 140, marginBottom: 24 }}>
        {/* 外圈光晕 */}
        <div className="anim-soft-pulse" style={{
          position: 'absolute', inset: -10, borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}12 0%, transparent 70%)`
        }} />
        {/* 外环 */}
        <div className="anim-float-slow" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: `1.5px dashed ${accent}33`
        }} />
        {/* 内环 */}
        <div style={{
          position: 'absolute', inset: 20, borderRadius: '50%',
          background: isDark ? `${accent}0a` : `${accent}08`,
          border: `1px solid ${accent}18`,
          display: 'grid', placeItems: 'center'
        }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ opacity: 0.65 }}>
            {/* 盒子主体 */}
            <rect x="10" y="18" width="28" height="20" rx="4" stroke={accent} strokeWidth="1.5" fill={isDark ? `${accent}0d` : `${accent}08`} />
            {/* 盒盖 */}
            <path d="M8 18 L24 10 L40 18" stroke={accent} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {/* 中线 */}
            <line x1="24" y1="10" x2="24" y2="38" stroke={accent} strokeWidth="1" opacity="0.3" />
            {/* 星星装饰 */}
            <circle cx="18" cy="26" r="1.5" fill={accent} opacity="0.4" />
            <circle cx="30" cy="30" r="1" fill={accent} opacity="0.3" />
            <circle cx="34" cy="24" r="1.5" fill={accent} opacity="0.25" />
            {/* 向上箭头 - 暗示添加 */}
            <path d="M24 15 L24 7 M20 11 L24 7 L28 11" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          </svg>
        </div>
        {/* 浮动小点 */}
        <div className="anim-float" style={{
          position: 'absolute', top: 8, right: 12, width: 6, height: 6, borderRadius: '50%',
          background: accent, opacity: 0.25
        }} />
        <div className="anim-float" style={{
          position: 'absolute', bottom: 12, left: 8, width: 4, height: 4, borderRadius: '50%',
          background: accent, opacity: 0.2, animationDelay: '-2s'
        }} />
      </div>

      <div style={{
        fontSize: 17, fontWeight: 600,
        color: isDark ? '#f8fafc' : '#0f172a',
        marginBottom: 6, letterSpacing: '-0.01em'
      }}>
        {text}
      </div>
      <div style={{
        fontSize: 13, color: isDark ? 'rgba(226,232,240,0.5)' : '#94a3b8',
        maxWidth: 260, lineHeight: 1.7
      }}>
        {subtext}
      </div>
    </div>
  );
}
