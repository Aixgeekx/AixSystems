# AixSystems v0.39.0 进度

## 当前目标
持续迭代增强功能，主导思想：**黑科技全能系统，个人成长和控制**。本轮聚焦系统可迁移、技能可评分、电脑可预检，把数据中心升级为迁移胶囊，把 Aix 中枢升级为技能自检矩阵，把桌面超级管理器升级为执行前预检舱。

## 计划实现（本轮 v0.39.0）
- [x] 数据迁移胶囊：按备份新鲜度、模块覆盖、记录规模和运行环境生成迁移包清单、换机步骤和风险提示
- [x] Aix 技能自检矩阵：按技能启用、风险、Provider、数据输入和日志能力生成健康评分与修复动作
- [x] 桌面执行前预检舱：在 PowerShell 白名单执行前汇总系统压力、预设风险、备份/回滚和安全边界
- [x] 版本号统一到 0.39.0：`code/package.json`、`desktop/package.json`、`APP_VERSION`、lockfile 顶层版本
- [x] 应用内更新日志新增 v0.39.0
- [x] README、code/README、results/使用说明、Aix_tools/readme 同步 v0.39.0

## 待完成
- [x] 运行 Vitest 与前端构建
- [x] 桌面安装包构建
- [ ] 提交并推送 `origin main`
- [ ] 创建并推送 tag：`v0.39.0`
- [ ] 创建 GitHub Release 并上传安装包

## 验证结果
- Vitest：6 个测试文件通过，39/39 用例通过。
- 前端构建：`npm --prefix code run build` 通过；仅保留既有字体运行时解析和大 chunk 警告。
- 桌面构建：`npm --prefix desktop run dist` 通过，生成 `AixSystems-0.39.0-Setup.exe` 与 blockmap。
- 构建恢复：首次 NSIS 输出文件被占用，已将旧 `AixSystems-0.39.0-Setup.exe` 重命名为 `.locked-backup` 后重新生成。

## 新增/修改重点
- `code/src/pages/dataio/index.tsx` — 数据迁移胶囊
- `code/src/pages/aix/index.tsx` — Aix 技能自检矩阵
- `code/src/pages/desktop/index.tsx` — 桌面执行前预检舱
- `code/src/config/constants.ts` 等版本同步
- 文档同步
