import { describe, expect, it } from 'vitest';
import { getWidgetSkin, getWidgetThemeText, normalizeWidgetThemeMode, resolveWidgetTheme } from './widgetThemes';

describe('widgetThemes', () => {
  it('自动模式会映射到全局赛博朋克主题', () => {
    expect(resolveWidgetTheme('cyberpunk')).toBe('cyberpunk');
    expect(getWidgetSkin('auto', 'cyberpunk').label).toBe('赛博朋克');
  });

  it('渐变和复古全局主题会映射到对应的小组件主题', () => {
    expect(resolveWidgetTheme('grad_sky')).toBe('gradient');
    expect(resolveWidgetTheme('retro_red')).toBe('retro');
  });

  it('新增主题会按风格自动映射到对应小组件主题', () => {
    expect(resolveWidgetTheme('forest')).toBe('daylight');
    expect(resolveWidgetTheme('matrix')).toBe('cyberpunk');
    expect(resolveWidgetTheme('ember')).toBe('night');
    expect(resolveWidgetTheme('aurora')).toBe('gradient');
  });

  it('极简暗色会落到夜间小组件，避免重新变白', () => {
    expect(resolveWidgetTheme('minimal_dark')).toBe('night');
    expect(getWidgetSkin('auto', 'minimal_dark').label).toBe('黑夜');
  });

  it('非法主题模式会回退到自动模式', () => {
    expect(normalizeWidgetThemeMode('abc')).toBe('auto');
  });

  it('自动模式会带出当前跟随结果文案', () => {
    expect(getWidgetThemeText('auto', 'day')).toBe('跟随全局 · 白天');
  });
});
