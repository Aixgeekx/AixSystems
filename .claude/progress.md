# AixSystems v0.31.0 进度

## 当前目标
持续迭代增强功能，主导思想：**黑科技全能系统，个人成长和控制**。Aix 是软件内置 AI 与核心特色，用户提供 API 与 Key 后启用。

## 已完成（本轮 v0.31.0）
- [x] 超级管理器三期：桌面端新增自启入口、临时目录采样、端口占用只读扫描
- [x] PowerShell 安全预设：内置电脑信息、高占用进程、运行服务三个只读 PowerShell 通道
- [x] Aix Provider 管理增强：新增健康检查、延迟记录、策略历史和故障转移回退
- [x] Aix Agent 中枢：新增本地 Agent 任务分支、权限确认和恢复日志页面
- [x] 版本号统一到 0.31.0：`code/package.json`、`desktop/package.json`、`APP_VERSION`、lockfile 顶层版本
- [x] 应用内更新日志新增 v0.31.0
- [x] README、code/README、results/使用说明、Aix_tools/readme 已同步 v0.31.0

## 待完成
- [x] 运行 Vitest 与前端构建
- [x] 桌面安装包构建
- [ ] 提交并推送 `origin main`
- [ ] 创建并推送 tag：`v0.31.0`
- [ ] 创建 GitHub Release 并上传 `AixSystems-0.31.0-Setup.exe` 与 blockmap

## 新增/修改重点
- `desktop/main.cjs`、`desktop/preload.cjs`、`code/src/utils/electron.ts` — 只读系统扫描与 PowerShell 预设 IPC
- `code/src/pages/desktop/index.tsx` — 超级管理器三期扫描面板与 PowerShell 预设入口
- `code/src/utils/aixModel.ts`、`code/src/pages/systemsetting/index.tsx`、`code/src/stores/settingsStore.ts` — Aix Provider 健康检查和故障转移
- `code/src/pages/agent/index.tsx`、`code/src/config/routes.ts`、`code/src/App.tsx` — Aix Agent 中枢路由与页面

## 下一步候选方向
1. **Aix 内置 AI 主入口**：独立 Aix 页面，聚合 API/Key 配置、对话、工具调用、成长/电脑控制建议
2. **超级管理器四期**：PowerShell 命令白名单、风险评分、执行前备份和回滚计划
3. **Aix 本地代理中心**：OpenAI/Claude/Ollama 协议转换、Provider 自动探活、失败自动切换
