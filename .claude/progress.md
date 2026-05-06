# AixSystems 自驱迭代进度（最近一次更新：2026-05-07）

## 当前状态
- 主分支：`main`，远端：`https://github.com/Aixgeekx/AixSystems`
- 最新发布：**v0.91.0**（已 commit + 即将 push + release）
- 本会话累计连发 6 个版本：v0.86.0 → v0.91.0，共 18 个新黑科技功能

## 长期主线方向
1. **Aix 内置 AI** — Aix 是核心特色，离线全能 + 有 API 加灵魂；不读日记正文
2. **CLI / openclow / PowerShell 7** — 持续融合 Claude Code Agent / 技能/插件生态 / 白名单只读 PS
3. **本地优先** — 所有数据 IndexedDB，模型可选，桌面/浏览器双形态

## 核心工具层
`code/src/utils/aixAudit.ts`（约 320 行 + 25 单测）暴露：
- `hashString` / `fingerprintDetail` — cyrb53 链式哈希
- `buildAuditTickets` / `summarizeTickets` / `buildReplayPackage` / `verifyReplayPackage` — 审计票据 + 回放包导出/导入
- `buildAuditCsv` / `buildAuditHeatmap` — CSV 导出 / 14 天风险热力图聚合
- `summarizePowerShellLogs` / `buildPresetTrendRows` / `buildPresetDrillSchedule` / `scanPowerShellBlacklist` — PS 风险评分 + 14 天趋势 + 演练编排 + 黑名单关键词审计
- `buildCheckpointCapsule` / `parseCheckpointCapsule` / `buildRelayTree` / `buildRelayTreeMarkdown` — Agent CLI 续跑胶囊 + 多跳接力树 + Markdown 导出

## 发布闭环（每轮固定步骤）
1. 工具层加新函数 + 单测（vitest）
2. UI 挂到 `code/src/pages/aix/index.tsx` 或 `code/src/pages/agent/index.tsx`
3. `npm test` + `npm run build` 双绿
4. 三处版本对齐：`code/package.json` + `code/src/config/constants.ts#APP_VERSION` + `desktop/package.json`
5. 更新 README.md / code/README.md / Aix_tools/readme.md 三处变更日志
6. `cd desktop && npm run dist` 后台打 NSIS
7. **清理本地**：删 `desktop/dist-installer/` 中除最近 3 版以外的 `.exe`/`.blockmap`（GitHub Release 是长期备份）
8. `git add` + commit（feat: AixSystems vX.Y.Z - ...）+ `git push origin main`
9. `python Aix_tools/release_assets.py` 自动给当前 tag 上传 Setup.exe + blockmap

## 已发布版本快速回顾（本会话内）
- **v0.86.0** 黑匣子审计回放器 + PS 7 风险驾驶舱 + CLI Checkpoint 胶囊
- **v0.87.0** 审计回放包导入校验 + PS 演练编排器 + Checkpoint 胶囊接力导入
- **v0.88.0** 审计时间线播放器 + PS 14 天趋势条 + Agent 接力链路时间线
- **v0.89.0** 审计票据搜索过滤 + Agent 接力 Markdown 导出 + PS 演练日志清零
- **v0.90.0** 审计风险热力图 + PS 黑名单关键词审计 + Agent 接力深度追溯
- **v0.91.0** 审计 CSV 导出 + PS 一键演练全部预设 + Agent 深度树 Markdown 导出

## 下一轮候选方向（v0.92.0+）
- **审计** — 票据按 scope 分组筛选导出 / 风险热力图按月切换 / 跨日链式哈希校验摘要
- **PowerShell** — 演练成本（耗时）TOP 排行 / 失败原因聚类 / 与黑名单关键词联动告警
- **Agent** — 接力树折叠展开交互 / 失效胶囊清理 / 与 Aix 总控令牌的关联评分

## 隐私 / 安全边界（不可逾越）
- Aix 不读日记正文，只用情绪 / 标签 / 强度 / 数量等不可还原元数据
- PowerShell 始终白名单只读 + 人工确认 + 写审计日志
- API Key 只在 IndexedDB，不能进 commit / log / README
