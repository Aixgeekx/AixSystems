# AixSystems v0.37.0 进度

## 当前目标
持续迭代增强功能，主导思想：**黑科技全能系统，个人成长和控制**。本轮聚焦系统自主化，把首页升级为日常控制指挥台，把 Aix 中枢升级为技能任务图谱，把数据中心升级为灾备演练舱，进一步靠近私人便携全能系统。

## 计划实现（本轮 v0.37.0）
- [x] 首页自主控制指挥台：自动合成今日最高优先级控制指令、恢复力评分、下一步入口和执行顺序
- [x] Aix 技能任务图谱：把内置技能按数据、权限、Provider 和日志依赖组织成可归档的自主任务链路
- [x] 数据灾备演练舱：根据备份时间、数据量、模块覆盖和运行环境生成灾备等级、风险点与演练步骤
- [x] 版本号统一到 0.37.0：`code/package.json`、`desktop/package.json`、`APP_VERSION`、lockfile 顶层版本
- [x] 应用内更新日志新增 v0.37.0
- [x] README、code/README、results/使用说明、Aix_tools/readme 同步 v0.37.0

## 待完成
- [x] 运行 Vitest 与前端构建
- [x] 桌面安装包构建
- [ ] 提交并推送 `origin main`
- [ ] 创建并推送 tag：`v0.37.0`
- [ ] 创建 GitHub Release 并上传安装包

## 新增/修改重点
- `code/src/pages/home/index.tsx` — 首页自主控制指挥台
- `code/src/pages/aix/index.tsx` — Aix 技能任务图谱
- `code/src/pages/dataio/index.tsx` — 数据灾备演练舱
- `code/src/config/constants.ts` 等版本同步
- 文档同步
