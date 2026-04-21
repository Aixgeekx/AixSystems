// 17 款主题壁纸 - 原版名称复用 + 纯色生成(离线不依赖图片资源)
export interface ThemeMeta {
  key: string;
  label: string;
  gradient: [string, string];                            // 两色渐变作为壁纸替代
  accent: string;                                        // AntD 主色
}

export const THEMES: ThemeMeta[] = [
  { key: 'shuangcha',  label: '霜茶',   gradient: ['#E8E3D8', '#B8A88A'], accent: '#8D7B4C' },
  { key: 'caocong',    label: '草丛',   gradient: ['#C4E3B2', '#6BA368'], accent: '#4F8D4B' },
  { key: 'jingye',     label: '静夜',   gradient: ['#1F2A44', '#0B0F1E'], accent: '#6C7BBF' },
  { key: 'qianhai',    label: '浅海',   gradient: ['#D3ECEF', '#7FB7C5'], accent: '#3E8E9E' },
  { key: 'jiguang',    label: '极光',   gradient: ['#7FE3C4', '#4E5EFF'], accent: '#4E5EFF' },
  { key: 'tiankong',   label: '天空',   gradient: ['#CCE6FF', '#4CA0F5'], accent: '#1E7CE0' },
  { key: 'xuedi',      label: '雪地',   gradient: ['#F5F9FC', '#C1D3E0'], accent: '#5A7C9A' },
  { key: 'haian',      label: '海岸',   gradient: ['#FFEED1', '#6FB7C1'], accent: '#3B8993' },
  { key: 'fangyan',    label: '房檐',   gradient: ['#EED6B3', '#7B3E2B'], accent: '#7B3E2B' },
  { key: 'ronghe',     label: '融合',   gradient: ['#F5A3C7', '#6F8EFF'], accent: '#6F8EFF' },
  { key: 'bikong',     label: '碧空',   gradient: ['#B4E0FA', '#2E86DE'], accent: '#2E86DE' },
  { key: 'taqing',     label: '踏青',   gradient: ['#DFF0C1', '#69A360'], accent: '#69A360' },
  { key: 'chixia',     label: '炽夏',   gradient: ['#FFD59B', '#FF6B5B'], accent: '#FF6B5B' },
  { key: 'taotao',     label: '桃桃',   gradient: ['#FFDCE0', '#F782A5'], accent: '#F782A5' },
  { key: 'chunuan',    label: '初暖',   gradient: ['#FFE9C7', '#F6A96A'], accent: '#F6A96A' },
  { key: 'qiangzhi',   label: '墙纸',   gradient: ['#EDE6D6', '#B8A87C'], accent: '#8D7A4C' },
  { key: 'chunse',     label: '纯色',   gradient: ['#F5F5F5', '#E8E8E8'], accent: '#1677FF' }
];

export const DEFAULT_THEME = 'bikong';                                       // 默认主题
