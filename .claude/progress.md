# AixSystems v0.36.0 进度

## 当前目标
持续迭代增强功能，主导思想：**黑科技全能系统，个人成长和控制**。本轮聚焦深度成长洞察，通过日记情绪与行动数据的强关联分析、专注质量的智能化评级，以及实时专注预警，进一步提升系统的个人控制力。

## 计划实现（本轮 v0.36.0）
- [x] 日记情绪与行动联动洞察：仅在本地自动分析日记情绪标签、强度与当日完成事项、专注时长、习惯执行的反馈关联，并生成洞察报告；Aix 不读取日记正文
- [x] 专注质量智能化评级：基于专注时长、中断频率、白噪音偏好和时间段，对专注会话进行 1-5 星评级并给出环境/节奏调整建议
- [x] 首页今日专注警报：聚合当前专注风险（低频、过低、质量滑坡）、待专注事项和环境建议，在首页实时控制台展示
- [x] 版本号统一到 0.36.0：`code/package.json`、`desktop/package.json`、`APP_VERSION`、lockfile 顶层版本
- [x] 应用内更新日志新增 v0.36.0
- [x] README、code/README、results/使用说明、Aix_tools/readme 同步 v0.36.0

## 待完成
- [x] 运行 Vitest 与前端构建
- [x] 桌面安装包构建
- [ ] 提交并推送 `origin main`
- [ ] 创建并推送 tag：`v0.36.0`
- [ ] 创建 GitHub Release 并上传安装包

## 新增/修改重点
- `code/src/pages/diary/index.tsx` — 情绪关联洞察引擎
- `code/src/pages/absorbed/index.tsx` — 专注质量评级与 AI 场景建议
- `code/src/pages/home/index.tsx` — 首页实时专注警报卡片
- `code/src/config/constants.ts` 等版本同步
- 文档同步
