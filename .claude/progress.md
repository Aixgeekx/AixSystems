# AixSystems 自驱迭代进度（最近一次更新：2026-05-07）

## 当前状态
- 主分支：`main`，远端：`https://github.com/Aixgeekx/AixSystems`
- 最新发布：**v0.92.0**（commit + push + Release 全部完成）
- 本会话累计连发 7 个版本：v0.86.0 → v0.92.0，共 21 个新黑科技功能

## 长期主线方向
1. **Aix 内置 AI** — 离线全能 + 有 API 加灵魂；不读日记正文
2. **CLI / openclow / PowerShell 7** — 持续融合
3. **本地优先** — IndexedDB，模型可选，浏览器/桌面双形态

## 核心工具层
`code/src/utils/aixAudit.ts`（约 320 行 + 25 单测）暴露：
- `hashString` / `fingerprintDetail` — cyrb53 链式哈希
- `buildAuditTickets` / `summarizeTickets` / `buildReplayPackage` / `verifyReplayPackage` — 审计票据 + 回放包
- `buildAuditCsv` / `buildAuditHeatmap` — CSV / 14 天风险热力图
- `summarizePowerShellLogs` / `buildPresetTrendRows` / `buildPresetDrillSchedule` / `scanPowerShellBlacklist` — PS 风险 + 趋势 + 演练 + 黑名单
- `buildCheckpointCapsule` / `parseCheckpointCapsule` / `buildRelayTree` / `buildRelayTreeMarkdown` — Agent CLI 胶囊 + 多跳 + Markdown

## 发布闭环（每轮固定步骤）
1. 工具/UI 改动 + 单测
2. `npm test` + `npm run build` 双绿
3. 三处版本对齐：`code/package.json` + `APP_VERSION` + `desktop/package.json`
4. README.md / code/README.md / Aix_tools/readme.md 同步变更日志
5. `cd desktop && npm run dist`（先改版本再打）
6. **清理本地**：保留 `desktop/dist-installer/` 最近 3 版
7. `git add` + commit + `git push origin main`
8. `python Aix_tools/release_assets.py` 自动上传 Setup.exe + blockmap

## 已发布版本（本会话内）
- **v0.86.0** 黑匣子审计回放器 + PS 7 风险驾驶舱 + CLI Checkpoint 胶囊
- **v0.87.0** 审计回放包导入校验 + PS 演练编排器 + Checkpoint 胶囊接力导入
- **v0.88.0** 审计时间线播放器 + PS 14 天趋势条 + Agent 接力链路时间线
- **v0.89.0** 审计票据搜索过滤 + Agent 接力 Markdown 导出 + PS 演练日志清零
- **v0.90.0** 审计风险热力图 + PS 黑名单关键词审计 + Agent 接力深度追溯
- **v0.91.0** 审计 CSV 导出 + PS 一键演练全部预设 + Agent 深度树 Markdown 导出
- **v0.92.0** 审计 CSV 按 scope 选择性导出 + PS 演练成本 TOP 5 + Agent 失效胶囊清理

## 下一轮候选方向（v0.93.0+）
- **审计** — 跨日链式哈希校验摘要 / 票据级 Aix 风险评论
- **PowerShell** — 失败原因聚类 / 与黑名单关键词联动告警
- **Agent** — 接力深度热力图 / 接力分支 SLA 计时器

## 隐私 / 安全边界（不可逾越）
- Aix 不读日记正文，只用情绪 / 标签 / 强度 / 数量等不可还原元数据
- PowerShell 始终白名单只读 + 人工确认 + 写审计日志
- API Key 只在 IndexedDB
