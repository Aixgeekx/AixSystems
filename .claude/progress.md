# AixSystems v0.40.0 进度

## 当前目标
持续迭代增强功能，主导思想：**黑科技全能系统，个人成长和控制**。本轮聚焦 Claude Code CLI、openclow 技能生态和 PowerShell 7 安全终端，把 Agent 中枢升级为 CLI 工作流交接舱，把 Aix 中枢升级为 openclow 本地技能清单注册器，把桌面超级管理器升级为 PowerShell 7 安全终端账本。

## 计划实现（本轮 v0.40.0）
- [x] Claude Code CLI 工作流交接舱：为 Agent 分支生成计划、权限、检查点、恢复提示和 CLI 续跑线索
- [x] openclow 本地技能清单注册器：把插件包名解析成 manifest、兼容性、风险、Schema 和禁用归档，不执行未知代码
- [x] PowerShell 7 安全终端账本：在白名单预设前展示 pwsh 7、安全哈希、超时、只读级别和审计导出线索
- [x] 版本号统一到 0.40.0：`code/package.json`、`desktop/package.json`、`APP_VERSION`、lockfile 顶层版本
- [x] 应用内更新日志新增 v0.40.0
- [x] README、code/README、results/使用说明、Aix_tools/readme 同步 v0.40.0

## 待完成
- [x] 运行 Vitest 与前端构建
- [x] 桌面安装包构建
- [ ] 提交并推送 `origin main`
- [ ] 创建并推送 tag：`v0.40.0`
- [ ] 创建 GitHub Release 并上传安装包

## 验证结果
- Vitest：6 个测试文件通过，39/39 用例通过。
- 前端构建：`npm --prefix code run build` 通过；仅保留既有字体运行时解析和大 chunk 警告。
- 桌面构建：`npm --prefix desktop run dist` 通过，生成 `AixSystems-0.40.0-Setup.exe` 与 blockmap。

## 新增/修改重点
- `code/src/pages/agent/index.tsx` — Claude Code CLI 工作流交接舱
- `code/src/pages/aix/index.tsx` — openclow 本地技能清单注册器
- `code/src/pages/desktop/index.tsx` — PowerShell 7 安全终端账本
- `code/src/config/constants.ts` 等版本同步
- 文档同步
