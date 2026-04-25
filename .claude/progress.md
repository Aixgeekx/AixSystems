# AixSystems v0.30.0 进度

## 当前目标
持续迭代增强功能，主导思想：**黑科技全能系统，个人成长和控制**。

## 已完成（本轮 v0.30.0）
- [x] 超级管理器二期：桌面端新增安全控制矩阵，覆盖自启管理、隐私清理、磁盘保护、文件扫描和工具大全规划
- [x] Aix Provider 管理：学习 cc-switch，新增 Provider 预设、原子切换、配置备份和官方登录回退提示
- [x] 手机版实质适配：全局新增底部四入口导航，移动端可快速进入首页、今天、成长和工具
- [x] 版本号统一到 0.30.0：`code/package.json`、`desktop/package.json`、`APP_VERSION`、lockfile 顶层版本
- [x] 应用内更新日志新增 v0.30.0
- [x] README、code/README、results/使用说明、Aix_tools/readme 已同步 v0.30.0

## 待完成
- [x] 运行 Vitest 与前端构建
- [x] 桌面安装包构建
- [ ] 提交并推送 `origin main`
- [ ] 创建并推送 tag：`v0.30.0`
- [ ] 创建 GitHub Release 并上传 `AixSystems-0.30.0-Setup.exe` 与 blockmap

## 新增/修改重点
- `code/src/pages/desktop/index.tsx` — 超级管理器安全控制矩阵
- `desktop/main.cjs`、`desktop/preload.cjs`、`code/src/utils/electron.ts` — 超级管理器只读计划 IPC
- `code/src/pages/systemsetting/index.tsx` — cc-switch 风格 Provider 管理
- `code/src/components/Layout/index.tsx` — 手机版底部四入口导航

## 下一步候选方向
1. **超级管理器三期**：自启项真实只读枚举、临时文件扫描和端口占用扫描
2. **Aix 本地代理中心**：Provider 健康检查、故障转移、模型协议转换和策略历史
3. **手机版 PWA**：移动首页重排、触控表单、PWA 安装提示和离线缓存策略
