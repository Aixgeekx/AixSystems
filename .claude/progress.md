# AixSystems v0.45.0 进度

## 当前目标
持续迭代增强功能，主导思想：**黑科技全能系统，个人成长和控制**。本轮聚焦控制债务熔断、Agent 权限债务审计和 PowerShell 7 巡检排班，把 Aix 中枢升级为能在个人失控前自动降低新任务摄入，把 Agent 中枢升级为能发现权限/证据缺口，把桌面超级管理器升级为只读巡检顺序编排器。

## 计划实现（本轮 v0.45.0）
- [ ] 控制债务熔断器：基于 controlToken、逾期、待办、习惯中断、目标风险、复习压力生成熔断等级与降载动作，不读取日记正文
- [ ] Agent 权限债务审计器：基于 Agent 分支的 contract、claudeWorkflow、checkpoint、resume 和风险等级生成缺口清单，非低风险只补授权证据
- [ ] PowerShell 7 巡检排班器：基于 healthScore、preflight、replayBlackBox 和白名单预设生成只读巡检顺序，不自动执行命令
- [ ] 版本号统一到 0.45.0：`code/package.json`、`desktop/package.json`、`APP_VERSION`、lockfile 顶层版本
- [ ] 应用内更新日志新增 v0.45.0
- [ ] README、code/README、results/使用说明、Aix_tools/readme 同步 v0.45.0

## 待完成
- [ ] 运行 Vitest 与前端构建
- [ ] 桌面安装包构建
- [ ] 提交并推送 `origin main`
- [ ] 创建并推送 tag：`v0.45.0`
- [ ] 创建 GitHub Release 并上传安装包

## 新增/修改重点
- `code/src/pages/aix/index.tsx` — 控制债务熔断器
- `code/src/pages/agent/index.tsx` — Agent 权限债务审计器
- `code/src/pages/desktop/index.tsx` — PowerShell 7 巡检排班器
- `code/src/config/constants.ts` 等版本同步
- 文档同步
