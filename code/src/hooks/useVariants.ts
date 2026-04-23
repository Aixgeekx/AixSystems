import { theme as antdTheme } from 'antd';
import { useSettingsStore } from '@/stores/settingsStore';
import { THEMES, DEFAULT_THEME } from '@/config/themes';

export function useThemeVariants() {
  const themeKey = useSettingsStore(s => s.theme);
  const theme = THEMES.find(t => t.key === themeKey) || THEMES.find(t => t.key === DEFAULT_THEME)!;
  const style = theme.style;

  // 根据当前 style 输出各种小组件/面板的动态样式
  
  const getPanelStyle = () => {
    switch (style) {
      case 'cyberpunk':
        return {
          background: 'rgba(10, 10, 20, 0.85)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: `1px solid rgba(0, 240, 255, 0.3)`,
          boxShadow: `0 0 20px rgba(0, 240, 255, 0.1), inset 0 0 10px rgba(0, 240, 255, 0.1)`,
          color: '#00f0ff',
          titleColor: '#00f0ff',
          textShadow: '0 0 10px rgba(0,240,255,0.5)',
          subColor: 'rgba(0, 240, 255, 0.6)'
        };
      case 'dark':
        return {
          background: 'rgba(20, 26, 40, 0.45)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 32px 64px -12px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.15)',
          color: '#f8fafc',
          titleColor: '#f8fafc',
          textShadow: 'none',
          subColor: 'rgba(226,232,240,0.72)'
        };
      case 'minimal':
        return {
          background: theme.key === 'minimal_dark' ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          border: theme.key === 'minimal_dark' ? '1px solid #333' : '1px solid #eaeaea',
          boxShadow: 'none',
          color: theme.key === 'minimal_dark' ? '#fff' : '#333',
          titleColor: theme.key === 'minimal_dark' ? '#fff' : '#111',
          textShadow: 'none',
          subColor: theme.key === 'minimal_dark' ? '#aaa' : '#888'
        };
      case 'retro':
        return {
          background: 'rgba(240, 230, 210, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(139, 115, 85, 0.3)',
          boxShadow: '2px 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)',
          color: '#4a3b2c',
          titleColor: '#3a2b1c',
          textShadow: 'none',
          subColor: '#7a6b5c'
        };
      case 'light':
      case 'gradient':
      default:
        // 玻璃轻亮风格
        return {
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.65)',
          boxShadow: '0 20px 60px -16px rgba(0, 0, 0, 0.05)',
          color: '#0f172a',
          titleColor: '#0f172a',
          textShadow: 'none',
          subColor: '#64748b'
        };
    }
  };

  const getItemCardStyle = (done: boolean, isHover: boolean, metaColor: string) => {
    switch (style) {
      case 'cyberpunk':
        return {
          background: done ? 'rgba(0, 240, 255, 0.05)' : (isHover ? 'rgba(0, 240, 255, 0.1)' : 'rgba(10, 10, 20, 0.7)'),
          border: `1px solid ${done ? 'rgba(0, 240, 255, 0.1)' : (isHover ? 'rgba(0, 240, 255, 0.5)' : 'rgba(0, 240, 255, 0.3)')}`,
          boxShadow: done ? 'none' : (isHover ? '0 0 20px rgba(0, 240, 255, 0.3), inset 0 0 10px rgba(0, 240, 255, 0.2)' : '0 0 10px rgba(0, 240, 255, 0.1), inset 0 0 5px rgba(0, 240, 255, 0.1)'),
          color: done ? 'rgba(0, 240, 255, 0.3)' : '#00f0ff',
          textShadow: done ? 'none' : '0 0 8px rgba(0,240,255,0.4)',
          indicatorGlow: done ? 'none' : `0 0 10px ${metaColor}`,
          transform: (isHover && !done) ? 'translateY(-2px)' : 'translateY(0)'
        };
      case 'dark':
        return {
          background: done ? 'rgba(30, 40, 60, 0.45)' : (isHover ? 'rgba(40, 50, 70, 0.95)' : 'rgba(30, 40, 60, 0.85)'),
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: done ? '0 4px 12px rgba(0,0,0,0.01)' : (isHover ? '0 16px 40px -8px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.1)' : '0 12px 30px -10px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.05)'),
          color: done ? 'rgba(255,255,255,0.4)' : '#f8fafc',
          textShadow: 'none',
          indicatorGlow: 'none',
          transform: (isHover && !done) ? 'translateY(-2px)' : 'translateY(0)'
        };
      case 'minimal':
        const cBg = theme.key === 'minimal_dark' ? '#1f1f1f' : '#fff';
        const cHov = theme.key === 'minimal_dark' ? '#2a2a2a' : '#fafafa';
        const cBorder = theme.key === 'minimal_dark' ? '#333' : '#eee';
        return {
          background: done ? (theme.key === 'minimal_dark' ? '#111' : '#f9f9f9') : (isHover ? cHov : cBg),
          border: `1px solid ${cBorder}`,
          boxShadow: 'none',
          color: done ? (theme.key === 'minimal_dark' ? '#666' : '#aaa') : (theme.key === 'minimal_dark' ? '#fff' : '#333'),
          textShadow: 'none',
          indicatorGlow: 'none',
          transform: 'translateY(0)'
        };
      case 'retro':
        return {
          background: done ? 'rgba(220, 210, 190, 0.45)' : (isHover ? 'rgba(255, 248, 230, 0.95)' : 'rgba(240, 230, 210, 0.85)'),
          border: '1px solid rgba(139, 115, 85, 0.4)',
          boxShadow: done ? 'none' : (isHover ? '4px 6px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6)' : '2px 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)'),
          color: done ? 'rgba(74, 59, 44, 0.4)' : '#4a3b2c',
          textShadow: 'none',
          indicatorGlow: 'none',
          transform: 'translateY(0)'
        };
      case 'light':
      case 'gradient':
      default:
        // 默认毛玻璃卡片
        return {
          background: done ? 'rgba(255, 255, 255, 0.45)' : (isHover ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.85)'),
          border: '1px solid rgba(255, 255, 255, 0.9)',
          boxShadow: done ? '0 4px 12px rgba(0,0,0,0.01)' : (isHover ? '0 16px 40px -8px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255,255,255,1)' : '0 12px 30px -10px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255,255,255,1)'),
          color: done ? 'rgba(15, 23, 42, 0.4)' : '#0f172a',
          textShadow: 'none',
          indicatorGlow: 'none',
          transform: (isHover && !done) ? 'translateY(-2px)' : 'translateY(0)'
        };
    }
  };

  
  const getAntdTheme = () => {
    // dynamically generate antd ConfigProvider theme
    const base = {
      token: {
        colorPrimary: theme.accent,
        fontFamily: theme.fontFamily,
      },
      algorithm: style === 'dark' || style === 'cyberpunk' || theme.key === 'minimal_dark' ? antdTheme.darkAlgorithm : undefined
    };
    return base;
  };

  return { theme, style, getPanelStyle, getItemCardStyle, getAntdTheme };
}

