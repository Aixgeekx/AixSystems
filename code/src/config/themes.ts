// 11 款主题风格
export type ThemeStyle = 'cyberpunk' | 'light' | 'dark' | 'minimal' | 'retro' | 'gradient';

export interface ThemeMeta {
  key: string;
  label: string;
  style: ThemeStyle;
  gradient: [string, string];                            // 两色渐变作为壁纸替代
  accent: string;                                        // AntD 主色
}

export const THEMES: ThemeMeta[] = [
  { key: 'cyberpunk',  label: '霓虹赛博', style: 'cyberpunk', gradient: ['#00f0ff', '#ff003c'], accent: '#00f0ff' },
  { key: 'day',        label: '白天明亮', style: 'light',     gradient: ['#F5F9FC', '#C1D3E0'], accent: '#1677FF' },
  { key: 'night',      label: '黑夜暗色', style: 'dark',      gradient: ['#1F2A44', '#0B0F1E'], accent: '#6C7BBF' },
  { key: 'minimal',    label: '极简白白', style: 'minimal',   gradient: ['#FFFFFF', '#F5F5F5'], accent: '#333333' },
  { key: 'minimal_dark',label: '极简黑黑', style: 'minimal',   gradient: ['#1A1A1A', '#000000'], accent: '#FFFFFF' },
  { key: 'retro',      label: '复古泛黄', style: 'retro',     gradient: ['#E8E3D8', '#B8A88A'], accent: '#8D7B4C' },
  { key: 'retro_red',  label: '复古暗红', style: 'retro',     gradient: ['#EED6B3', '#7B3E2B'], accent: '#7B3E2B' },
  { key: 'grad_ocean', label: '渐变海洋', style: 'gradient',  gradient: ['#7FE3C4', '#4E5EFF'], accent: '#4E5EFF' },
  { key: 'grad_sunset',label: '渐变炽夏', style: 'gradient',  gradient: ['#FFD59B', '#FF6B5B'], accent: '#FF6B5B' },
  { key: 'grad_sky',   label: '渐变天空', style: 'gradient',  gradient: ['#CCE6FF', '#4CA0F5'], accent: '#1E7CE0' },
  { key: 'grad_peach', label: '渐变水蜜', style: 'gradient',  gradient: ['#FFDCE0', '#F782A5'], accent: '#F782A5' },
];

export const DEFAULT_THEME = 'cyberpunk';                                       // 默认主题
