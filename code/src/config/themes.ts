// 15 款主题风格
export type ThemeStyle = 'cyberpunk' | 'light' | 'dark' | 'minimal' | 'retro' | 'gradient';

export interface ThemeMeta {
  key: string;
  label: string;
  style: ThemeStyle;
  gradient: [string, string];                            // 两色渐变作为壁纸替代
  accent: string;                                        // AntD 主色
  summary: string;
  fontFamily: string;
}

export const THEMES: ThemeMeta[] = [
  { key: 'cyberpunk',   label: '霓虹赛博', style: 'cyberpunk', gradient: ['#00f0ff', '#ff003c'], accent: '#00f0ff', summary: '霓虹网格、冷蓝高亮、强烈未来感', fontFamily: '"Orbitron", "Rajdhani", "Segoe UI", sans-serif' },
  { key: 'matrix',      label: '矩阵终端', style: 'cyberpunk', gradient: ['#06110a', '#39ff14'], accent: '#39ff14', summary: '黑绿终端、代码雨氛围、更偏黑客风', fontFamily: '"Consolas", "Cascadia Code", "Segoe UI", monospace' },
  { key: 'day',         label: '白天明亮', style: 'light',     gradient: ['#F5F9FC', '#C1D3E0'], accent: '#1677FF', summary: '清透日光、干净玻璃感、适合长时办公', fontFamily: '"Segoe UI", "PingFang SC", sans-serif' },
  { key: 'forest',      label: '森林氧气', style: 'light',     gradient: ['#E7F7EE', '#56B58A'], accent: '#2F855A', summary: '植物系绿调、柔和轻亮、视觉压力更低', fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' },
  { key: 'night',       label: '黑夜暗色', style: 'dark',      gradient: ['#1F2A44', '#0B0F1E'], accent: '#6C7BBF', summary: '偏冷的深夜工作台、稳重耐看', fontFamily: '"Segoe UI", "PingFang SC", sans-serif' },
  { key: 'ember',       label: '余烬夜幕', style: 'dark',      gradient: ['#1A0D12', '#9F1239'], accent: '#FB7185', summary: '暗红夜色、比纯黑更有温度', fontFamily: '"Bahnschrift", "Segoe UI", sans-serif' },
  { key: 'minimal',     label: '极简白白', style: 'minimal',   gradient: ['#FFFFFF', '#F5F5F5'], accent: '#333333', summary: '最干净的白色留白风格，适合极简控', fontFamily: '"Segoe UI", "PingFang SC", sans-serif' },
  { key: 'minimal_dark',label: '极简黑黑', style: 'minimal',   gradient: ['#1A1A1A', '#000000'], accent: '#FFFFFF', summary: '去装饰化深色界面，只保留必要信息', fontFamily: '"Segoe UI", "PingFang SC", sans-serif' },
  { key: 'retro',       label: '复古泛黄', style: 'retro',     gradient: ['#E8E3D8', '#B8A88A'], accent: '#8D7B4C', summary: '纸张质感与旧书色调，更像随身手账', fontFamily: '"Georgia", "Times New Roman", serif' },
  { key: 'retro_red',   label: '复古暗红', style: 'retro',     gradient: ['#EED6B3', '#7B3E2B'], accent: '#7B3E2B', summary: '酒红旧物风格，适合做更有记忆点的界面', fontFamily: '"Georgia", "Times New Roman", serif' },
  { key: 'grad_ocean',  label: '渐变海洋', style: 'gradient',  gradient: ['#7FE3C4', '#4E5EFF'], accent: '#4E5EFF', summary: '海风感蓝绿渐变，轻快但不单薄', fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' },
  { key: 'grad_sunset', label: '渐变炽夏', style: 'gradient',  gradient: ['#FFD59B', '#FF6B5B'], accent: '#FF6B5B', summary: '橙红日落氛围，界面更有热度', fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' },
  { key: 'grad_sky',    label: '渐变天空', style: 'gradient',  gradient: ['#CCE6FF', '#4CA0F5'], accent: '#1E7CE0', summary: '明快蓝天色调，阅读和管理类页面更舒展', fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' },
  { key: 'grad_peach',  label: '渐变水蜜', style: 'gradient',  gradient: ['#FFDCE0', '#F782A5'], accent: '#F782A5', summary: '柔和粉调，适合轻松和记录类场景', fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' },
  { key: 'aurora',      label: '极光薄暮', style: 'gradient',  gradient: ['#7DD3FC', '#8B5CF6'], accent: '#8B5CF6', summary: '蓝紫极光混色，兼顾未来感和高级感', fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' },
];

export const DEFAULT_THEME = 'cyberpunk';                                       // 默认主题
