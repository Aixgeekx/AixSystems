// 27 款主题风格 — 赛博/极简/渐变各 7 款 + 经典保留 6 款
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
  // ===== 赛博 7 款 =====
  { key: 'cyberpunk',   label: '霓虹赛博', style: 'cyberpunk', gradient: ['#00f0ff', '#ff003c'], accent: '#00f0ff', summary: '霓虹网格、冷蓝高亮、强烈未来感', fontFamily: '"Orbitron", "Rajdhani", "Segoe UI", sans-serif' },
  { key: 'matrix',      label: '矩阵终端', style: 'cyberpunk', gradient: ['#06110a', '#39ff14'], accent: '#39ff14', summary: '黑绿终端、代码雨氛围、更偏黑客风', fontFamily: '"Consolas", "Cascadia Code", "Segoe UI", monospace' },
  { key: 'cyber_violet',label: '紫电赛博', style: 'cyberpunk', gradient: ['#1a0b2e', '#c026d3'], accent: '#d946ef', summary: '紫电脉冲、霓虹粉紫、迷幻未来感', fontFamily: '"Orbitron", "Rajdhani", "Segoe UI", sans-serif' },
  { key: 'cyber_gold',  label: '鎏金赛博', style: 'cyberpunk', gradient: ['#0f0f0f', '#f59e0b'], accent: '#fbbf24', summary: '黑金奢华、暗调高亮、精英黑客风', fontFamily: '"Orbitron", "Rajdhani", "Segoe UI", sans-serif' },
  { key: 'cyber_red',   label: '赤红赛博', style: 'cyberpunk', gradient: ['#1a0505', '#ef4444'], accent: '#f87171', summary: '血红警报、危机模式、激进警示风', fontFamily: '"Orbitron", "Rajdhani", "Segoe UI", sans-serif' },
  { key: 'cyber_ice',   label: '冰霜赛博', style: 'cyberpunk', gradient: ['#0a1628', '#67e8f9'], accent: '#22d3ee', summary: '冰蓝极寒、北极光感、冷静克制风', fontFamily: '"Orbitron", "Rajdhani", "Segoe UI", sans-serif' },
  { key: 'cyber_pink',  label: '霓虹粉',   style: 'cyberpunk', gradient: ['#1a0a14', '#ec4899'], accent: '#f472b6', summary: '霓虹粉紫、甜酷混合、Y2K 未来感', fontFamily: '"Orbitron", "Rajdhani", "Segoe UI", sans-serif' },

  // ===== 极简 7 款 =====
  { key: 'minimal',     label: '极简白白', style: 'minimal',   gradient: ['#FFFFFF', '#F5F5F5'], accent: '#333333', summary: '最干净的白色留白风格，适合极简控', fontFamily: '"Segoe UI", "PingFang SC", sans-serif' },
  { key: 'minimal_dark',label: '极简黑黑', style: 'minimal',   gradient: ['#1A1A1A', '#000000'], accent: '#FFFFFF', summary: '去装饰化深色界面，只保留必要信息', fontFamily: '"Segoe UI", "PingFang SC", sans-serif' },
  { key: 'minimal_gray',label: '极简灰灰', style: 'minimal',   gradient: ['#F3F4F6', '#E5E7EB'], accent: '#4B5563', summary: '中性灰调、不冷不暖、专注内容本身', fontFamily: '"Segoe UI", "PingFang SC", sans-serif' },
  { key: 'minimal_warm',label: '极简暖白', style: 'minimal',   gradient: ['#FFFBF5', '#F5EFE6'], accent: '#8D7B68', summary: '暖白底衬、温润纸感、长时间阅读友好', fontFamily: '"Segoe UI", "PingFang SC", sans-serif' },
  { key: 'minimal_blue',label: '极简蓝调', style: 'minimal',   gradient: ['#F0F5FF', '#D6E4FF'], accent: '#2F54EB', summary: '淡蓝底色、冷静理性、效率办公向', fontFamily: '"Segoe UI", "PingFang SC", sans-serif' },
  { key: 'minimal_green',label:'极简森绿', style: 'minimal',   gradient: ['#F6FFED', '#D9F7BE'], accent: '#389E0D', summary: '浅绿护眼、自然清新、健康工作向', fontFamily: '"Segoe UI", "PingFang SC", sans-serif' },
  { key: 'minimal_paper',label:'极简纸纹', style: 'minimal',   gradient: ['#FDFCF8', '#EDE8E0'], accent: '#6B5B4F', summary: '仿纸纹理质感、书写记录氛围', fontFamily: '"Georgia", "Songti SC", serif' },

  // ===== 渐变 7 款 =====
  { key: 'grad_ocean',  label: '渐变海洋', style: 'gradient',  gradient: ['#7FE3C4', '#4E5EFF'], accent: '#4E5EFF', summary: '海风感蓝绿渐变，轻快但不单薄', fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' },
  { key: 'grad_sunset', label: '渐变炽夏', style: 'gradient',  gradient: ['#FFD59B', '#FF6B5B'], accent: '#FF6B5B', summary: '橙红日落氛围，界面更有热度', fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' },
  { key: 'grad_sky',    label: '渐变天空', style: 'gradient',  gradient: ['#CCE6FF', '#4CA0F5'], accent: '#1E7CE0', summary: '明快蓝天色调，阅读和管理类页面更舒展', fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' },
  { key: 'grad_peach',  label: '渐变水蜜', style: 'gradient',  gradient: ['#FFDCE0', '#F782A5'], accent: '#F782A5', summary: '柔和粉调，适合轻松和记录类场景', fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' },
  { key: 'aurora',      label: '极光薄暮', style: 'gradient',  gradient: ['#7DD3FC', '#8B5CF6'], accent: '#8B5CF6', summary: '蓝紫极光混色，兼顾未来感和高级感', fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' },
  { key: 'grad_forest', label: '渐变森野', style: 'gradient',  gradient: ['#D4F5C7', '#84CC16'], accent: '#65A30D', summary: '黄绿森野渐变、生机勃勃、自然治愈', fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' },
  { key: 'grad_dusk',   label: '渐变暮光', style: 'gradient',  gradient: ['#FDA4AF', '#7C3AED'], accent: '#9333EA', summary: '紫红暮光渐变、浪漫晚霞、情绪氛围', fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' },

  // 保留的经典款
  { key: 'day',         label: '白天明亮', style: 'light',     gradient: ['#F5F9FC', '#C1D3E0'], accent: '#1677FF', summary: '清透日光、干净玻璃感、适合长时办公', fontFamily: '"Segoe UI", "PingFang SC", sans-serif' },
  { key: 'forest',      label: '森林氧气', style: 'light',     gradient: ['#E7F7EE', '#56B58A'], accent: '#2F855A', summary: '植物系绿调、柔和轻亮、视觉压力更低', fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' },
  { key: 'night',       label: '黑夜暗色', style: 'dark',      gradient: ['#1F2A44', '#0B0F1E'], accent: '#6C7BBF', summary: '偏冷的深夜工作台、稳重耐看', fontFamily: '"Segoe UI", "PingFang SC", sans-serif' },
  { key: 'ember',       label: '余烬夜幕', style: 'dark',      gradient: ['#1A0D12', '#9F1239'], accent: '#FB7185', summary: '暗红夜色、比纯黑更有温度', fontFamily: '"Bahnschrift", "Segoe UI", sans-serif' },
  { key: 'retro',       label: '复古泛黄', style: 'retro',     gradient: ['#E8E3D8', '#B8A88A'], accent: '#8D7B4C', summary: '纸张质感与旧书色调，更像随身手账', fontFamily: '"Georgia", "Times New Roman", serif' },
  { key: 'retro_red',   label: '复古暗红', style: 'retro',     gradient: ['#EED6B3', '#7B3E2B'], accent: '#7B3E2B', summary: '酒红旧物风格，适合做更有记忆点的界面', fontFamily: '"Georgia", "Times New Roman", serif' },
];

export const DEFAULT_THEME = 'cyberpunk';                                       // 默认主题
