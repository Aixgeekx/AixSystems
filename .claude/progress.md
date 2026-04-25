# AixSystems v0.32.0 进度

## 当前目标
持续迭代增强功能，主导思想：**黑科技全能系统，个人成长和控制**。本轮重点把 Aix 做成软件核心入口：具备 openclaw 的技能生态、Claude Code 的专业 Agent 流程、时光序的私人数据底座，并保持无 API 离线全能、有 API 注入灵魂。

## 已完成（本轮 v0.32.0）
- [x] Aix 主入口：新增独立 Aix 页面，聚合 Provider 状态、本地成长数据、今日控制计划、电脑健康建议和晚间复盘
- [x] Aix 技能库 / 插件广场雏形：内置成长控制、复习削峰、专注作战、电脑只读扫描、私人便携胶囊和 Provider 调度技能，支持启停和执行日志
- [x] 私人便携胶囊：明确无 API / 有 API 双模式，支持从 Aix 入口触发本地备份，保持离线性和便携性
- [x] 版本号统一到 0.32.0：`code/package.json`、`desktop/package.json`、`APP_VERSION`、lockfile 顶层版本
- [x] 应用内更新日志新增 v0.32.0
- [x] README、code/README、results/使用说明、Aix_tools/readme 已同步 v0.32.0

## 待完成
- [x] 运行 Vitest 与前端构建
- [x] 桌面安装包构建
- [ ] 提交并推送 `origin main`
- [ ] 创建并推送 tag：`v0.32.0`
- [ ] 创建 GitHub Release 并上传 `AixSystems-0.32.0-Setup.exe` 与 blockmap

## 新增/修改重点
- `code/src/pages/aix/index.tsx` — Aix 主入口、技能库/插件广场雏形、私人便携胶囊
- `code/src/config/routes.ts`、`code/src/App.tsx` — Aix 中枢路由和菜单入口
- `code/src/pages/help/NewFeatures.tsx` — v0.32.0 应用内更新日志
- `code/src/config/constants.ts`、`code/package.json`、`desktop/package.json`、lockfile — 版本同步
- `README.md`、`code/README.md`、`results/使用说明.md`、`Aix_tools/readme.md` — 文档同步

## 下一步候选方向
1. **插件广场二期**：插件详情页、技能输入/输出 schema、版本归档和本地安装包导入
2. **PowerShell 白名单工作流**：预设命令风险评分、执行前确认、备份与回滚计划
3. **Aix 本地代理中心**：OpenAI/Claude/Ollama 协议转换、Provider 自动探活、失败自动切换
