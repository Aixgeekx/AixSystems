# AixSystems v0.25.0 进度

## 当前目标
持续迭代增强功能，主导思想：**黑科技系统，个人成长和控制**。

## 已完成（本轮 v0.25.0）
- [x] 跨模块关联洞察引擎：`useCorrelationInsights` hook + growth 页面新增"关联洞察"卡片，自动发现习惯↔情绪↔专注↔目标的隐藏关联模式
- [x] 智能周期成长报告：新增 `Report.tsx` 页面，支持周/月/季/年四个周期维度，含每日专注趋势图、情绪分布饼图、习惯完成率水平条，支持导出 JSON/HTML
- [x] 进阶成就与等级系统：成就从 10 项扩充至 22 项，新增 10 级成长等级（Lv.1-10），每日 XP 经验值追踪，各模块行为自动获取 XP
- [x] 版本号统一到 0.25.0：`code/package.json`、`desktop/package.json`、`APP_VERSION`
- [x] 应用内更新日志新增 v0.25.0
- [x] Aix_tools/readme 已同步 v0.25.0
- [x] 测试通过：39/39 Vitest
- [x] 构建通过：tsc + Vite 成功

## 新增文件
- `code/src/hooks/useCorrelationInsights.ts` — 跨模块关联洞察分析引擎
- `code/src/hooks/useGameLevel.ts` — XP/等级/称号计算 hook
- `code/src/pages/growth/Report.tsx` — 智能周期成长报告页面

## 验证记录
- `npm --prefix code test`：通过，6 个测试文件 / 39 个测试
- `npm --prefix code run build`：通过

## 待处理
- `.vscode/`、`image/` 未跟踪目录，未纳入提交
- 提交和推送需要用户确认

## 下一步候选方向
1. **专注智能场景识别**：根据时间段、事项类型自动推荐专注模式
2. **习惯模板与链式习惯**：预设习惯模板 + 习惯链（完成A后触发B）
3. **日记智能引导**：日记页增加情绪引导模板和反思提示
4. **可视化体感验收**：启动 Vite 浏览器检查 v0.25.0 新功能
