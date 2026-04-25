# AixSystems v0.34.0 进度

## 当前目标
持续迭代增强功能，主导思想：**黑科技全能系统，个人成长和控制**。本轮把 v0.33.0 的 Aix 插件/代理/PowerShell 基础继续升级为可执行的个人控制战役、可恢复 Agent 编排和桌面超级管理器健康演练，保持离线可用、便携优先、API 作为灵魂增强。

## 计划实现（本轮 v0.34.0）
- [x] Aix 控制战役编排器：基于今日事项、逾期、目标风险、习惯中断、复习压力生成多阶段可执行战役，并一键写入本地事项与审计日志
- [x] Agent 恢复驾驶舱：展示 Agent 分支队列、权限阶段、恢复状态和下一步动作，支持从 eventLog / Item 状态恢复执行视图
- [x] 桌面超级管理器健康演练：融合 CPU/内存/磁盘、自启、临时目录、端口和 PowerShell 输出，生成健康分、清理演练和安全边界
- [x] 版本号统一到 0.34.0：`code/package.json`、`desktop/package.json`、`APP_VERSION`、lockfile 顶层版本
- [x] 应用内更新日志新增 v0.34.0
- [x] README、code/README、results/使用说明、Aix_tools/readme 同步 v0.34.0

## 待完成
- [x] 运行 Vitest 与前端构建
- [x] 桌面安装包构建
- [ ] 提交并推送 `origin main`
- [ ] 创建并推送 tag：`v0.34.0`
- [ ] 创建 GitHub Release 并上传 `AixSystems-0.34.0-Setup.exe` 与 blockmap

## 新增/修改重点
- `code/src/pages/aix/index.tsx` — Aix 控制战役编排器
- `code/src/pages/agent/index.tsx` — Agent 恢复驾驶舱
- `code/src/pages/desktop/index.tsx` — 桌面超级管理器健康演练
- `code/src/config/constants.ts`、`code/package.json`、`desktop/package.json`、lockfile — 版本同步
- `README.md`、`code/README.md`、`results/使用说明.md`、`Aix_tools/readme.md` — 文档同步
