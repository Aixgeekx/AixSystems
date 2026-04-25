# AixSystems v0.35.0 进度

## 当前目标
持续迭代增强功能，主导思想：**黑科技全能系统，个人成长和控制**。本轮把 v0.34.0 的控制战役、Agent 恢复和桌面健康演练继续升级为自进化路线图、权限合约和本地应急工具箱，让 Aix 更像可长期成长的私人便携操作系统。

## 计划实现（本轮 v0.35.0）
- [x] Aix 自进化路线图：按控制力、数据主权、技能启用、Provider 状态自动生成 7/30/90 天系统进化路线，并写入本地日志
- [x] Agent 权限合约：为成长/电脑/模型 Agent 增加权限范围、禁止动作、证据、审批阶段和合约归档，强化 Claude Code 式安全边界
- [x] 桌面应急工具箱：新增断网急救、时间校准、DNS/Hosts 检查、端口急救等只读/低风险工具卡，配套 PowerShell 白名单元信息
- [x] 版本号统一到 0.35.0：`code/package.json`、`desktop/package.json`、`APP_VERSION`、lockfile 顶层版本
- [x] 应用内更新日志新增 v0.35.0
- [x] README、code/README、results/使用说明、Aix_tools/readme 同步 v0.35.0

## 待完成
- [x] 运行 Vitest 与前端构建
- [x] 桌面安装包构建
- [ ] 提交并推送 `origin main`
- [ ] 创建并推送 tag：`v0.35.0`
- [ ] 创建 GitHub Release 并上传 `AixSystems-0.35.0-Setup.exe` 与 blockmap

## 新增/修改重点
- `code/src/pages/aix/index.tsx` — Aix 自进化路线图
- `code/src/pages/agent/index.tsx` — Agent 权限合约
- `code/src/pages/desktop/index.tsx`、`desktop/main.cjs`、`desktop/preload.cjs`、`code/src/utils/electron.ts` — 桌面应急工具箱与安全桥
- `code/src/config/constants.ts`、`code/package.json`、`desktop/package.json`、lockfile — 版本同步
- `README.md`、`code/README.md`、`results/使用说明.md`、`Aix_tools/readme.md` — 文档同步
