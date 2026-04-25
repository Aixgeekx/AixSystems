# AixSystems v0.43.0 进度

## 当前目标
持续迭代增强功能，主导思想：**黑科技全能系统，个人成长和控制**。本轮聚焦本地控制战役自动编排、Claude Code CLI 证据链打包和 PowerShell 7 自愈预检沙盒，把 Aix 中枢升级为可从令牌生成 dry-run 战役包的调度器，把 Agent 中枢升级为可复制续跑证据链，把桌面超级管理器升级为白名单只读自愈预检沙盒。

## 计划实现（本轮 v0.43.0）
- [x] 本地控制战役自动编排器：基于 controlToken、SKILLS、eventLog、目标/习惯/复习统计生成 dry-run 战役包和子任务草案，不读取日记正文
- [x] Claude Code CLI 续跑证据链打包：基于 Item.extra.claudeWorkflow、子任务进度、risk 和 eventLog 输出可复制 Resume / Checkpoint 证据链
- [x] PowerShell 7 自愈预检沙盒：基于 presets、hash、duration 和 replayBlackBox 生成白名单只读自愈预检建议，人工确认后仍禁止任意命令
- [x] 版本号统一到 0.43.0：`code/package.json`、`desktop/package.json`、`APP_VERSION`、lockfile 顶层版本
- [x] 应用内更新日志新增 v0.43.0
- [x] README、code/README、results/使用说明、Aix_tools/readme 同步 v0.43.0

## 待完成
- [x] 运行 Vitest 与前端构建
- [x] 桌面安装包构建
- [x] 提交并推送 `origin main`
- [x] 创建并推送 tag：`v0.43.0`
- [x] 创建 GitHub Release 并上传安装包

## 验证与发布结果
- Vitest：6 个测试文件、39 个用例全部通过。
- 前端构建：`npm --prefix code run build` 通过，保留 MapleMono 字体运行时解析和大 chunk 既有警告。
- 桌面安装包：`npm --prefix desktop run dist` 通过，生成 `desktop/dist-installer/AixSystems-0.43.0-Setup.exe` 和 blockmap。
- Git：已提交 `3cfa0c5 feat: AixSystems v0.43.0 - add campaign evidence sandbox` 并推送 `origin main`。
- Tag/Release：已推送 `v0.43.0`，`release_assets.py` 已上传安装包和 blockmap。

## 新增/修改重点
- `code/src/pages/aix/index.tsx` — 本地控制战役自动编排器
- `code/src/pages/agent/index.tsx` — Claude Code CLI 续跑证据链打包
- `code/src/pages/desktop/index.tsx` — PowerShell 7 自愈预检沙盒
- `code/src/config/constants.ts` 等版本同步
- 文档同步
