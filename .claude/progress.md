# AixSystems v0.27.0 进度

## 当前目标
持续迭代增强功能，主导思想：**黑科技系统，个人成长和控制**。

## 已完成（本轮 v0.27.0）
- [x] 专注智能场景识别：根据时间段和近期专注完成质量推荐专注模式、时长和严格模式
- [x] 习惯模板与链式习惯：新增成长控制链模板、链式触发字段和完成后下一习惯提示
- [x] 日记智能引导：新增平静、焦虑、开心三类情绪反思模板，一键进入写作
- [x] 版本号统一到 0.27.0：`code/package.json`、`desktop/package.json`、`APP_VERSION`、lockfile 顶层版本
- [x] 应用内更新日志新增 v0.27.0
- [x] README、code/README、results/使用说明、Aix_tools/readme 已同步 v0.27.0
- [x] 测试通过：39/39 Vitest
- [x] 构建通过：tsc + Vite 成功
- [ ] Git 提交：待创建
- [ ] 推送 `origin main`：待执行
- [ ] 创建并推送 tag：`v0.27.0` 待执行
- [ ] GitHub Release：待创建

## 新增/修改重点
- `code/src/pages/focus/index.tsx` — 专注智能场景识别卡片
- `code/src/pages/habit/index.tsx` — 习惯模板与链式触发
- `code/src/pages/diary/index.tsx` — 情绪智能引导模板
- `code/src/models/index.ts` — Habit 增加 extra 扩展字段

## 下一步候选方向
1. **Aix 模型深度接入**：让专注、习惯、日记建议可选调用用户配置 API 生成个性化策略
2. **成长控制任务编排器**：把目标、习惯、专注和日记串成每日自动控制流程
3. **风险预警中心**：识别连续拖延、低专注和情绪异常并给出干预动作
