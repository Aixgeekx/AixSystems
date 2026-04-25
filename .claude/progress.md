# AixSystems v0.33.0 进度

## 当前目标
持续迭代增强功能，主导思想：**黑科技全能系统，个人成长和控制**。本轮把 v0.32.0 的 Aix 主入口继续升级为可扩展插件系统、安全 PowerShell 白名单工作流和本地代理中心，保持离线可用、便携优先、API 注入灵魂。

## 计划实现（本轮 v0.33.0）
- [x] 插件广场二期：插件详情、输入/输出 schema、版本归档、本地安装包导入雏形
- [x] PowerShell 白名单工作流：预设命令风险评分、执行前确认、备份计划、回滚计划和审计记录
- [x] Aix 本地代理中心：OpenAI / Claude / Ollama 协议能力卡、Provider 自动探活、失败自动切换建议
- [x] 版本号统一到 0.33.0：`code/package.json`、`desktop/package.json`、`APP_VERSION`、lockfile 顶层版本
- [x] 应用内更新日志新增 v0.33.0
- [x] README、code/README、results/使用说明、Aix_tools/readme 同步 v0.33.0

## 待完成
- [x] 运行 Vitest 与前端构建
- [x] 桌面安装包构建
- [x] 提交并推送 `origin main`
- [x] 创建并推送 tag：`v0.33.0`
- [x] 创建 GitHub Release 并上传 `AixSystems-0.33.0-Setup.exe` 与 blockmap

## 发布结果
- Commit：`6b302e1 feat: AixSystems v0.33.0 - add plugin and proxy workflows`
- Release：https://github.com/Aixgeekx/AixSystems/releases/tag/v0.33.0
- 资产：`AixSystems-0.33.0-Setup.exe`、`AixSystems-0.33.0-Setup.exe.blockmap`

## 新增/修改重点
- `code/src/pages/aix/index.tsx` — 插件广场二期和 Aix 本地代理中心
- `code/src/pages/desktop/index.tsx` — PowerShell 白名单工作流 UI
- `desktop/main.cjs`、`desktop/preload.cjs`、`code/src/utils/electron.ts` — 白名单预设元信息与安全执行桥
- `code/src/utils/aixModel.ts`、`code/src/stores/settingsStore.ts` — Provider 探活和本地代理能力扩展
- `README.md`、`code/README.md`、`results/使用说明.md`、`Aix_tools/readme.md` — 文档同步
