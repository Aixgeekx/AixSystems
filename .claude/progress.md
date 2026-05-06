# AixSystems 自驱迭代进度（最近更新：2026-05-07）

## 当前状态
- 主分支：`main`，远端：`https://github.com/Aixgeekx/AixSystems`
- **最新发布：v1.0.0**（commit `f453e5d` + push 完成）
- 本会话连发：v0.99.0（精简日志 + 快照对比器）→ **v1.0.0（时间管理三连）**

## 项目主旨
AixSystems = 离线本地时间管理系统 + 内置 Aix AI（可选）+ openclaw 风格 PS 直达 + Agent 接力胶囊。
React 18 + TS 5.6 + Ant Design 5 + Dexie(IndexedDB)，Electron 31 桌面壳。

## 长期主线
1. **时间管理核心**（事项/专注/习惯/目标/复习）
2. **Aix 黑匣子审计**（链式哈希、回放包、健康度）
3. **PowerShell 7 / openclaw 风格直达**（白名单、可观测、本地优先）
4. **Agent 接力胶囊**（CLI 续跑、健康度评分、复盘 todo）

## 核心工具层
`code/src/utils/aixAudit.ts`（约 1145 行 + 60+ 单测）；
**新增** `code/src/utils/dailyInsight.ts`（v1.0.0 工具，7 单测）：
- `computeTodaySaturation(items)` → { plannedMinutes, ratio, level: 空闲|紧凑|超载, advice }
- `computeHabitStreaks(habits, logs, topN=5)` → top N 习惯当前/最长连击
- `computeTomorrowAgenda(items, topN=5)` → 明天 schedule 类前 N 条

## 已发布版本（本会话）
- v0.86~v0.98 - 历史三连（黑匣子 / PowerShell / Agent）
- **v0.99.0** - 黄金路径 MD 导出 + 复盘 todo 进度卡 + 数据中心快照对比器（含 buildV1HealthCheck/buildPresetManualMarkdown/buildBranchHealthCsv 系统加但未接入 UI）
- **v1.0.0** - 时间管理三连：今日饱和度环 + 习惯连击榜 + 明日事项预览（完成）

## 下一轮候选（v1.0.1 / v1.1.0）
**用户明确要求"全能"+"openclaw 风格"，下轮重心：**
1. **PowerShell 本地一键面板** — 首页加 openclaw 风格白名单 PS 预设按钮（4 个），通过 `window.sgx.runPowerShellPreset(preset)` 调用，写入审计日志
2. **电脑资源仪表盘** — 首页加 storage/system snapshot 卡（基于 `window.sgx.getStorageStats()` / `getSystemSnapshot()`）
3. **buildV1HealthCheck UI** — Aix 主入口接综合健康评分卡（audit / powershell / agent 三档）

## 发布闭环（每轮）
1. 工具/UI 改 + 单测
2. `npm test` + `npm run build`
3. 版本三处对齐：`code/package.json` + `APP_VERSION` + `desktop/package.json`
4. README.md / code/README.md 简短日志（**图中老版本风格：一行/三子弹**）
5. `git add -A && git commit && git push`
6. 清理 `desktop/dist-installer/` 保留近 3 版

## 关键约束
- 更新日志精简（一行/三子弹），禁止冗长技术细节
- Aix 不读日记正文
- PS 白名单 + 写审计日志
- API Key 只在 IndexedDB
