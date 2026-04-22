// 空状态占位 - 精美插画风格
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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px 24px',
        textAlign: 'center'
      }}
    >
      {/* 插画图标 */}
      <div
        className="anim-float-slow"
        style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: isDark
            ? `radial-gradient(circle, ${accent}22 0%, transparent 70%)`
            : `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
          display: 'grid',
          placeItems: 'center',
          marginBottom: 20,
          position: 'relative'
        }}
      >
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M9 9h6v6H9z" opacity="0.3" />
          <circle cx="12" cy="12" r="1.5" fill={accent} stroke="none" />
          <path d="M8 16l2.5-2.5" opacity="0.4" />
          <path d="M13.5 10.5L16 8" opacity="0.4" />
        </svg>
      </div>

      <div style={{
        fontSize: 18,
        fontWeight: 600,
        color: isDark ? '#f8fafc' : '#0f172a',
        marginBottom: 8,
        letterSpacing: '-0.01em'
      }}>
        {text}
      </div>
      <div style={{
        fontSize: 14,
        color: isDark ? 'rgba(226,232,240,0.55)' : '#94a3b8',
        maxWidth: 280,
        lineHeight: 1.6
      }}>
        {subtext}
      </div>
    </div>
  );
}
