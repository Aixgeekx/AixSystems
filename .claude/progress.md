# AixSystems v0.21.4 进度

## 当前目标
v0.21.4 主题适配全覆盖 + 字体修复

## 已完成
- [x] 全部 36 个页面文件引入 useThemeVariants 并适配 dark/cyberpunk 主题
- [x] 关键组件适配：CommandPalette、ItemForm/Dialog、RichEditor、ExtraFields、ReminderPicker、ItemCard、Empty、Layout
- [x] 修复 useVariants.ts 中 fontFamily 硬编码为 theme.fontFamily
- [x] index.html 添加 Google Fonts 预加载（Orbitron、Rajdhani）
- [x] 构建通过（tsc + vite）
- [x] 测试通过（36/36 Vitest）
- [x] 已提交 7 个 commit 到 main

## 适配模式
```tsx
const { theme } = useThemeVariants();
const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
const accent = theme.accent;
```
- Card: `background: isDark ? 'rgba(10,14,28,0.5)' : undefined, border: isDark ? '1px solid rgba(255,255,255,0.08)' : undefined`
- 文字: `#f8fafc`(主)、`#e2e8f0`(次)、`#94a3b8`(辅助)
- 进度/强调: `accent` 或 `#4ade80`/`#52c41a`

## 下一步方向（待决策）
1. 继续完善功能：成长系统（growth/habit/goal）增强、数据可视化、性能优化
2. 开始 v0.22.0 新功能开发
3. 修复用户反馈的具体问题

## 关键文件路径
- `code/src/hooks/useVariants.ts` — 主题变量 hook
- `code/src/config/themes.ts` — 15 款主题定义
- `code/src/components/Layout/index.tsx` — 布局外壳
- `code/index.html` — 字体预加载
