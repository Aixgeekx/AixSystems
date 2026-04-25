# AixSystems v0.44.0 进度

## 当前目标
持续迭代增强功能，主导思想：**黑科技全能系统，个人成长和控制**。本轮聚焦个人失控预警、Agent 自律教练和桌面控制力镜像，把 Aix 中枢升级为能从总控令牌发现失控趋势，把 Agent 中枢升级为可自动提炼今日最小下一步，把桌面超级管理器升级为把 PowerShell 7 只读健康信号映射到个人控制力建议。

## 计划实现（本轮 v0.44.0）
- [x] 个人失控预警：基于 controlToken、逾期、习惯中断、目标风险、复习压力生成三色干预建议，不读取日记正文
- [x] Agent 自律教练：基于 autonomyQueue、CLI 续跑雷达和子任务停滞状态生成今日最小下一步，非低风险仍需授权
- [x] 桌面控制力镜像：基于 healthScore、PowerShell 7 白名单预设、replayBlackBox 生成电脑状态到个人控制力的只读建议
- [x] 版本号统一到 0.44.0：`code/package.json`、`desktop/package.json`、`APP_VERSION`、lockfile 顶层版本
- [x] 应用内更新日志新增 v0.44.0
- [x] README、code/README、results/使用说明、Aix_tools/readme 同步 v0.44.0

## 待完成
- [x] 运行 Vitest 与前端构建
- [x] 桌面安装包构建
- [x] 提交并推送 `origin main`
- [x] 创建并推送 tag：`v0.44.0`
- [x] 创建 GitHub Release 并上传安装包

## 验证与发布结果
- Vitest：6 个测试文件、39 个用例全部通过。
- 前端构建：`npm --prefix code run build` 通过，保留 MapleMono 字体运行时解析和大 chunk 既有警告；首次因 `desktop/index.tsx` 中 `electron` 声明顺序导致 TS2448/TS2454，已调整到使用前声明后通过。
- 桌面安装包：`npm --prefix desktop run dist` 通过，生成 `desktop/dist-installer/AixSystems-0.44.0-Setup.exe` 和 blockmap。
- Git：已提交 `f38a672 feat: AixSystems v0.44.0 - add control mirror coach` 并推送 `origin main`。
- Tag/Release：已推送 `v0.44.0`，`release_assets.py` 已上传安装包和 blockmap。

## 新增/修改重点
- `code/src/pages/aix/index.tsx` — 个人失控预警
- `code/src/pages/agent/index.tsx` — Agent 自律教练
- `code/src/pages/desktop/index.tsx` — 桌面控制力镜像
- `code/src/config/constants.ts` 等版本同步
- 文档同步
