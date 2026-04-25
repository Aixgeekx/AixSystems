# AixSystems v0.42.0 进度

## 当前目标
持续迭代增强功能，主导思想：**黑科技全能系统，个人成长和控制**。本轮聚焦总控令牌调度、Claude Code CLI 续跑雷达和 PowerShell 7 黑匣子，把 Aix 中枢升级为控制令牌到 openclow 技能的 dry-run 调度器，把 Agent 中枢升级为 CLI 断点雷达，把桌面超级管理器升级为可回放的 PowerShell 7 控制黑匣子。

## 计划实现（本轮 v0.42.0）
- [x] 控制令牌 → openclow 技能调度器：基于 Aix controlToken、SKILLS 和 eventLog 生成每个技能的 dry-run 调度建议，默认不执行未知代码
- [x] Claude Code CLI 续跑雷达：基于 Agent 分支的 Plan / Permission / Checkpoint / Resume 断点、子任务进度和风险权重排序恢复优先级
- [x] PowerShell 7 控制回放黑匣子：把 pwsh 7 白名单执行结果、哈希、耗时、摘要和恢复建议压成可回放审计卡，并映射为 Agent 证据线索
- [x] 版本号统一到 0.42.0：`code/package.json`、`desktop/package.json`、`APP_VERSION`、lockfile 顶层版本
- [x] 应用内更新日志新增 v0.42.0
- [x] README、code/README、results/使用说明、Aix_tools/readme 同步 v0.42.0

## 待完成
- [x] 运行 Vitest 与前端构建
- [x] 桌面安装包构建
- [x] 提交并推送 `origin main`
- [x] 创建并推送 tag：`v0.42.0`
- [x] 创建 GitHub Release 并上传安装包

## 验证与发布结果
- Vitest：6 个测试文件、39 个用例全部通过。
- 前端构建：`npm --prefix code run build` 通过，保留 MapleMono 字体运行时解析和大 chunk 既有警告。
- 桌面安装包：`npm --prefix desktop run dist` 通过，生成 `desktop/dist-installer/AixSystems-0.42.0-Setup.exe` 和 blockmap。
- Git：已提交 `405b8d8 feat: AixSystems v0.42.0 - add token dispatch and replay radar` 并推送 `origin main`。
- Tag/Release：已推送 `v0.42.0`，`release_assets.py` 已上传安装包和 blockmap。

## 新增/修改重点
- `code/src/pages/aix/index.tsx` — 控制令牌到 openclow 技能调度器
- `code/src/pages/agent/index.tsx` — Claude Code CLI 续跑雷达
- `code/src/pages/desktop/index.tsx` — PowerShell 7 控制回放黑匣子
- `code/src/config/constants.ts` 等版本同步
- 文档同步
