# AixSystems v0.38.0 进度

## 当前目标
持续迭代增强功能，主导思想：**黑科技全能系统，个人成长和控制**。本轮聚焦更强的自主执行与长期控制，把 Agent 中枢升级为自治队列，把成长仪表盘升级为 90 天控制推演，把系统设置升级为 Provider 可信路由，继续靠近私人便携全能系统。

## 计划实现（本轮 v0.38.0）
- [x] Agent 自治队列：按风险、恢复进度、权限阶段和下一步动作自动排序，形成可继续执行的本地 Agent 队列
- [x] 成长 90 天控制推演：基于专注、习惯、目标、日记频率和复习雷达生成 30/60/90 天控制力路径
- [x] Aix Provider 可信路由：按协议、健康、延迟、官方回退和活跃槽生成可信度评分与推荐路由
- [x] 版本号统一到 0.38.0：`code/package.json`、`desktop/package.json`、`APP_VERSION`、lockfile 顶层版本
- [x] 应用内更新日志新增 v0.38.0
- [x] README、code/README、results/使用说明、Aix_tools/readme 同步 v0.38.0

## 待完成
- [x] 运行 Vitest 与前端构建
- [x] 桌面安装包构建
- [x] 提交并推送 `origin main`
- [x] 创建并推送 tag：`v0.38.0`
- [x] 创建 GitHub Release 并上传安装包

## 验证与发布结果
- Vitest：6 个测试文件通过，39/39 用例通过。
- 前端构建：`npm --prefix code run build` 通过；仅保留既有字体运行时解析和大 chunk 警告。
- 桌面构建：`npm --prefix desktop run dist` 通过，生成 `AixSystems-0.38.0-Setup.exe` 与 blockmap。
- Git：`main` 已推送到 `origin`，tag `v0.38.0` 已推送。
- Release：`v0.38.0` 已创建/补齐，并上传安装包与 blockmap。

## 新增/修改重点
- `code/src/pages/agent/index.tsx` — Agent 自治队列
- `code/src/pages/growth/index.tsx` — 90 天成长控制推演
- `code/src/pages/systemsetting/index.tsx` — Provider 可信路由
- `code/src/config/constants.ts` 等版本同步
- 文档同步
