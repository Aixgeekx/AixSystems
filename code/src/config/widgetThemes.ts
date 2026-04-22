import type { ThemeConfig } from 'antd';
import { DEFAULT_THEME } from './themes';

export type WidgetTheme = 'daylight' | 'night' | 'minimal' | 'cyberpunk' | 'gradient' | 'retro';
export type WidgetThemeMode = 'auto' | WidgetTheme;

export interface WidgetThemeMeta {
  label: string;
  shellBg: string;
  shellBorder: string;
  shellShadow: string;
  titleColor: string;
  textColor: string;
  mutedColor: string;
  accent: string;
  accentAlt: string;
  accentSoft: string;
  panelBg: string;
  settingBg: string;
  chipBg: string;
  chipText: string;
  buttonBg: string;
  buttonHoverBg: string;
  buttonBorder: string;
  divider: string;
  controlBg: string;
  controlFill: string;
  sliderRail: string;
}

export const WIDGET_THEMES: Record<WidgetTheme, WidgetThemeMeta> = {
  daylight: {
    label: '白天',
    shellBg: 'linear-gradient(165deg, rgba(255,255,255,0.96), rgba(240,247,255,0.92))',
    shellBorder: 'rgba(37,99,235,0.16)',
    shellShadow: '0 18px 40px rgba(15,23,42,0.16)',
    titleColor: '#0f172a',
    textColor: '#0f172a',
    mutedColor: '#64748b',
    accent: '#2563eb',
    accentAlt: '#38bdf8',
    accentSoft: 'rgba(37,99,235,0.10)',
    panelBg: 'rgba(248,250,252,0.92)',
    settingBg: 'rgba(241,245,249,0.94)',
    chipBg: 'rgba(37,99,235,0.12)',
    chipText: '#1d4ed8',
    buttonBg: 'rgba(255,255,255,0.82)',
    buttonHoverBg: 'rgba(219,234,254,0.96)',
    buttonBorder: 'rgba(37,99,235,0.16)',
    divider: 'rgba(148,163,184,0.18)',
    controlBg: 'rgba(255,255,255,0.9)',
    controlFill: 'rgba(37,99,235,0.12)',
    sliderRail: 'rgba(148,163,184,0.28)'
  },
  night: {
    label: '黑夜',
    shellBg: 'linear-gradient(165deg, rgba(8,15,28,0.96), rgba(15,23,42,0.92))',
    shellBorder: 'rgba(148,163,184,0.18)',
    shellShadow: '0 24px 48px rgba(2,6,23,0.44)',
    titleColor: '#f8fafc',
    textColor: '#e2e8f0',
    mutedColor: '#94a3b8',
    accent: '#38bdf8',
    accentAlt: '#6366f1',
    accentSoft: 'rgba(56,189,248,0.12)',
    panelBg: 'rgba(15,23,42,0.78)',
    settingBg: 'rgba(15,23,42,0.96)',
    chipBg: 'rgba(56,189,248,0.14)',
    chipText: '#bae6fd',
    buttonBg: 'rgba(15,23,42,0.88)',
    buttonHoverBg: 'rgba(30,41,59,0.98)',
    buttonBorder: 'rgba(56,189,248,0.16)',
    divider: 'rgba(56,189,248,0.12)',
    controlBg: 'rgba(15,23,42,0.88)',
    controlFill: 'rgba(56,189,248,0.14)',
    sliderRail: 'rgba(71,85,105,0.52)'
  },
  minimal: {
    label: '简约',
    shellBg: 'linear-gradient(165deg, rgba(248,250,252,0.98), rgba(255,255,255,0.94))',
    shellBorder: 'rgba(148,163,184,0.14)',
    shellShadow: '0 12px 28px rgba(15,23,42,0.12)',
    titleColor: '#111827',
    textColor: '#111827',
    mutedColor: '#6b7280',
    accent: '#111827',
    accentAlt: '#475569',
    accentSoft: 'rgba(17,24,39,0.08)',
    panelBg: 'rgba(255,255,255,0.96)',
    settingBg: 'rgba(248,250,252,0.96)',
    chipBg: 'rgba(17,24,39,0.08)',
    chipText: '#111827',
    buttonBg: 'rgba(255,255,255,0.98)',
    buttonHoverBg: 'rgba(243,244,246,0.98)',
    buttonBorder: 'rgba(15,23,42,0.08)',
    divider: 'rgba(148,163,184,0.18)',
    controlBg: 'rgba(255,255,255,0.96)',
    controlFill: 'rgba(17,24,39,0.1)',
    sliderRail: 'rgba(209,213,219,0.84)'
  },
  cyberpunk: {
    label: '赛博朋克',
    shellBg: 'linear-gradient(145deg, rgba(5,8,20,0.98), rgba(15,12,36,0.96), rgba(31,8,48,0.94))',
    shellBorder: 'rgba(85,243,255,0.28)',
    shellShadow: '0 0 24px rgba(85,243,255,0.18), 0 0 54px rgba(255,79,216,0.16), 0 22px 48px rgba(0,0,0,0.42)',
    titleColor: '#f8fafc',
    textColor: '#e2e8f0',
    mutedColor: '#94a3b8',
    accent: '#55f3ff',
    accentAlt: '#ff4fd8',
    accentSoft: 'rgba(255,79,216,0.16)',
    panelBg: 'linear-gradient(135deg, rgba(85,243,255,0.08), rgba(255,79,216,0.12))',
    settingBg: 'linear-gradient(160deg, rgba(8,12,26,0.96), rgba(19,8,30,0.96))',
    chipBg: 'rgba(85,243,255,0.14)',
    chipText: '#67e8f9',
    buttonBg: 'linear-gradient(145deg, rgba(11,18,38,0.94), rgba(28,8,40,0.9))',
    buttonHoverBg: 'linear-gradient(145deg, rgba(12,24,48,0.98), rgba(44,12,52,0.96))',
    buttonBorder: 'rgba(85,243,255,0.22)',
    divider: 'rgba(85,243,255,0.14)',
    controlBg: 'rgba(10,16,34,0.9)',
    controlFill: 'rgba(85,243,255,0.16)',
    sliderRail: 'rgba(34,211,238,0.28)'
  },
  gradient: {
    label: '渐变',
    shellBg: 'linear-gradient(155deg, rgba(255,255,255,0.96), rgba(255,214,231,0.84), rgba(188,216,255,0.92))',
    shellBorder: 'rgba(255,255,255,0.42)',
    shellShadow: '0 24px 50px rgba(59,130,246,0.16)',
    titleColor: '#111827',
    textColor: '#111827',
    mutedColor: '#6b7280',
    accent: '#db2777',
    accentAlt: '#2563eb',
    accentSoft: 'rgba(219,39,119,0.08)',
    panelBg: 'rgba(255,255,255,0.78)',
    settingBg: 'rgba(255,255,255,0.86)',
    chipBg: 'rgba(219,39,119,0.12)',
    chipText: '#be185d',
    buttonBg: 'linear-gradient(135deg, rgba(255,255,255,0.94), rgba(255,228,238,0.88))',
    buttonHoverBg: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(219,39,119,0.12), rgba(59,130,246,0.12))',
    buttonBorder: 'rgba(255,255,255,0.42)',
    divider: 'rgba(148,163,184,0.18)',
    controlBg: 'rgba(255,255,255,0.86)',
    controlFill: 'rgba(219,39,119,0.12)',
    sliderRail: 'rgba(251,191,36,0.3)'
  },
  retro: {
    label: '复古',
    shellBg: 'linear-gradient(160deg, rgba(245,236,218,0.98), rgba(229,212,182,0.94))',
    shellBorder: 'rgba(146,64,14,0.16)',
    shellShadow: '0 18px 40px rgba(120,53,15,0.18)',
    titleColor: '#422006',
    textColor: '#422006',
    mutedColor: '#7c5a3b',
    accent: '#b45309',
    accentAlt: '#7c2d12',
    accentSoft: 'rgba(180,83,9,0.10)',
    panelBg: 'rgba(255,248,235,0.92)',
    settingBg: 'rgba(255,244,225,0.94)',
    chipBg: 'rgba(180,83,9,0.12)',
    chipText: '#92400e',
    buttonBg: 'rgba(255,248,235,0.94)',
    buttonHoverBg: 'rgba(254,243,199,0.96)',
    buttonBorder: 'rgba(146,64,14,0.16)',
    divider: 'rgba(146,64,14,0.14)',
    controlBg: 'rgba(255,248,235,0.92)',
    controlFill: 'rgba(180,83,9,0.12)',
    sliderRail: 'rgba(180,83,9,0.24)'
  }
};

export const WIDGET_THEME_MODE_OPTIONS: Array<{ value: WidgetThemeMode; label: string; hint?: string; }> = [
  { value: 'auto', label: '跟随全局', hint: '自动同步当前应用主题' },
  { value: 'daylight', label: '白天' },
  { value: 'night', label: '黑夜' },
  { value: 'minimal', label: '简约' },
  { value: 'cyberpunk', label: '赛博朋克' },
  { value: 'gradient', label: '渐变' },
  { value: 'retro', label: '复古' }
];

export function normalizeWidgetThemeMode(value?: string | null): WidgetThemeMode {
  return WIDGET_THEME_MODE_OPTIONS.some(item => item.value === value) ? value as WidgetThemeMode : 'auto';
}

export function resolveWidgetTheme(themeKey = DEFAULT_THEME): WidgetTheme {
  if (themeKey === 'cyberpunk') return 'cyberpunk';
  if (themeKey === 'day') return 'daylight';
  if (themeKey === 'night' || themeKey === 'minimal_dark') return 'night';
  if (themeKey === 'minimal') return 'minimal';
  if (themeKey.startsWith('retro')) return 'retro';
  if (themeKey.startsWith('grad_')) return 'gradient';
  return 'night';
}

export function getWidgetSkin(mode: WidgetThemeMode, appThemeKey?: string) {
  return WIDGET_THEMES[mode === 'auto' ? resolveWidgetTheme(appThemeKey) : mode];
}

export function getWidgetThemeText(mode: WidgetThemeMode, appThemeKey?: string) {
  const skin = getWidgetSkin(mode, appThemeKey);
  return mode === 'auto' ? `跟随全局 · ${skin.label}` : skin.label;
}

export function getWidgetAntdTheme(skin: WidgetThemeMeta) {
  return {
    token: {
      colorPrimary: skin.accent,
      colorInfo: skin.accent,
      colorText: skin.textColor,
      colorTextSecondary: skin.mutedColor,
      colorTextPlaceholder: skin.mutedColor,
      colorBorder: skin.shellBorder,
      colorBgContainer: skin.controlBg,
      colorBgElevated: skin.settingBg,
      colorFillSecondary: skin.controlFill,
      colorFillTertiary: skin.accentSoft,
      controlItemBgActive: skin.controlFill,
      controlItemBgHover: skin.accentSoft,
      boxShadowSecondary: skin.shellShadow
    },
    components: {
      Button: {
        colorText: skin.textColor,
        colorTextTextHover: skin.titleColor,
        colorTextTextActive: skin.titleColor
      },
      Card: {
        headerBg: 'transparent'
      },
      Select: {
        optionActiveBg: skin.accentSoft,
        optionSelectedBg: skin.controlFill
      },
      Segmented: {
        trackBg: skin.controlBg,
        itemActiveBg: skin.buttonHoverBg,
        itemColor: skin.mutedColor,
        itemSelectedColor: skin.titleColor
      },
      Slider: {
        railBg: skin.sliderRail,
        railHoverBg: skin.sliderRail,
        trackBg: skin.accent,
        trackHoverBg: skin.accentAlt,
        handleColor: skin.accent,
        handleActiveColor: skin.accentAlt,
        dotActiveBorderColor: skin.accent
      }
    }
  } as ThemeConfig;
}
