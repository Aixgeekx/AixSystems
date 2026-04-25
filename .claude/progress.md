# AixSystems v0.28.0 进度

## 当前目标
持续迭代增强功能，主导思想：**黑科技系统，个人成长和控制**。

## 已完成（本轮 v0.28.0）
- [x] Aix 专注深度策略：专注页基于场景、完成率和质量调用用户配置模型生成干预策略
- [x] 成长控制任务编排器：成长仪表盘把目标、专注、习惯和日记串成今日控制流程
- [x] 风险预警中心：识别完成率、专注、习惯和日记风险并输出即时干预动作
- [x] 版本号统一到 0.28.0：`code/package.json`、`desktop/package.json`、`APP_VERSION`、lockfile 顶层版本
- [x] 应用内更新日志新增 v0.28.0
- [x] README、code/README、results/使用说明、Aix_tools/readme 已同步 v0.28.0
- [x] 测试通过：39/39 Vitest
- [x] 构建通过：tsc + Vite 成功
- [x] Git 提交：`bffd6b3 feat: AixSystems v0.28.0 - add control risk center`
- [x] 已推送 `origin main`
- [x] 已创建并推送 tag：`v0.28.0`
- [x] GitHub Release 已创建：`https://github.com/Aixgeekx/AixSystems/releases/tag/v0.28.0`
- [x] Release 附件：已上传 `AixSystems-0.28.0-Setup.exe` 与 blockmap；手机版为后续规划项

## 新增/修改重点
- `code/src/pages/focus/index.tsx` — Aix 专注深度策略
- `code/src/pages/growth/index.tsx` — 成长控制任务编排器、风险预警中心

## 下一步候选方向
1. **手机版规划与适配**：整理移动端导航、布局和触控优先级，为后续手机版做准备
2. **Release 自动附加产物**：构建后自动上传安装包、blockmap 和便携包到 GitHub Release
3. **Aix 模型跨页策略中心**：统一管理专注、成长、日记和习惯的模型策略调用
