# AixSystems v0.41.0 进度

## 当前目标
持续迭代增强功能，主导思想：**黑科技全能系统，个人成长和控制**。本轮聚焦个人控制总控、openclow 技能沙盒和 PowerShell 7 审计执行链，把首页/成长/Aix 串成黑科技总控令牌，把 Aix 中枢升级为本地技能沙盒校验器，把桌面超级管理器升级为 PowerShell 7 安全账本执行底座。

## 计划实现（本轮 v0.41.0）
- [x] 黑科技总控令牌：从逾期、专注缺口、目标风险、习惯中断和复习压力生成个人控制令牌，并在首页/成长/Aix 战役中复用
- [x] openclow 本地技能沙盒校验器：为归档 manifest 生成权限合约、输入输出 Schema、dry-run 状态和 Claude Code 续跑提示，默认禁用不执行未知代码
- [x] PowerShell 7 安全账本执行底座：桌面端优先 pwsh 7、回退 powershell.exe，并返回命令哈希、耗时、时间戳和输出摘要
- [x] 版本号统一到 0.41.0：`code/package.json`、`desktop/package.json`、`APP_VERSION`、lockfile 顶层版本
- [x] 应用内更新日志新增 v0.41.0
- [x] README、code/README、results/使用说明、Aix_tools/readme 同步 v0.41.0

## 待完成
- [x] 运行 Vitest 与前端构建
- [x] 桌面安装包构建
- [x] 提交并推送 `origin main`
- [x] 创建并推送 tag：`v0.41.0`
- [x] 创建 GitHub Release 并上传安装包

## 验证与发布结果
- Vitest：6 个测试文件通过，39/39 用例通过。
- 前端构建：`npm --prefix code run build` 通过；仅保留既有字体运行时解析和大 chunk 警告。
- 桌面构建：`npm --prefix desktop run dist` 通过，生成 `AixSystems-0.41.0-Setup.exe` 与 blockmap。
- Git：`main` 已推送到 `origin`，tag `v0.41.0` 已推送。
- Release：`v0.41.0` 已创建/补齐，并上传安装包与 blockmap。

## 新增/修改重点
- `code/src/pages/home/index.tsx` — 黑科技总控令牌
- `code/src/pages/growth/index.tsx` — 成长页控制令牌展示
- `code/src/pages/aix/index.tsx` — openclow 本地技能沙盒与战役令牌接入
- `desktop/main.cjs`、`code/src/utils/electron.ts`、`code/src/pages/desktop/index.tsx` — PowerShell 7 安全账本执行底座
- `code/src/config/constants.ts` 等版本同步
- 文档同步
