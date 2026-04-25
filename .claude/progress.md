# AixSystems v0.26.0 进度

## 当前目标
持续迭代增强功能，主导思想：**黑科技系统，个人成长和控制**。

## 已完成（本轮 v0.26.0）
- [x] Aix 模型 API 配置入口：系统设置新增 API 地址、API Key、模型名配置，数据仅保存到本地 IndexedDB
- [x] Aix 模型调用工具：新增 `callAixModel`，集中处理临时 API 接口请求和响应解析
- [x] 成长轨迹 AI 模拟器：成长仪表盘新增 30 天轨迹模拟，基于专注、目标、习惯和雷达数据生成干预建议
- [x] 首页智能控制助手：首页工作台新增今日计划、专注建议、晚间复盘三类一键策略
- [x] 版本号统一到 0.26.0：`code/package.json`、`desktop/package.json`、`APP_VERSION`、lockfile 顶层版本
- [x] 应用内更新日志新增 v0.26.0
- [x] README、code/README、results/使用说明、Aix_tools/readme 已同步 v0.26.0
- [x] 测试通过：39/39 Vitest
- [x] 构建通过：tsc + Vite 成功

## 新增文件
- `code/src/utils/aixModel.ts` — Aix 模型 API 调用工具

## 验证记录
- `npm --prefix code test -- --run`：通过，6 个测试文件 / 39 个测试
- `npm --prefix code run build`：通过

## 待处理
- 创建提交并推送 `origin main`
- 创建并推送 `v0.26.0` tag
- 创建 GitHub Release：`AixSystems v0.26.0`

## 下一步候选方向
1. **专注智能场景识别**：根据时间段、事项类型和近期表现自动推荐专注模式
2. **习惯模板与链式习惯**：预设习惯模板 + 习惯链（完成 A 后触发 B）
3. **日记智能引导**：日记页增加情绪引导模板和反思提示
