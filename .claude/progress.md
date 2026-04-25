# AixSystems v0.29.0 进度

## 当前目标
持续迭代增强功能，主导思想：**黑科技全能系统，个人成长和控制**。

## 已完成（本轮 v0.29.0）
- [x] 手机版导航适配：全局外壳新增窄屏菜单按钮、抽屉导航和移动端内容间距优化
- [x] Aix 模型 Key 槽：系统设置可保存、查看、切换多套模型配置，向 Claude Code CLI / cc-switch 式管理演进
- [x] Windows 超级管理器雏形：桌面端安全只读展示 CPU、内存、磁盘状态，并预留自启管理、隐私清理、磁盘保护、文件扫描和工具大全
- [x] Release 全版本资产补档工具：新增 `Aix_tools/release_assets.py`，按版本上传历史安装包、portable.exe、zip 和 blockmap
- [x] 版本号统一到 0.29.0：`code/package.json`、`desktop/package.json`、`APP_VERSION`、lockfile 顶层版本
- [x] 应用内更新日志新增 v0.29.0
- [x] README、code/README、results/使用说明、Aix_tools/readme 已同步 v0.29.0

## 待完成
- [ ] 运行 Vitest 与前端构建
- [ ] 桌面安装包构建
- [ ] 提交并推送 `origin main`
- [ ] 创建并推送 tag：`v0.29.0`
- [ ] 创建 GitHub Release 并上传 `AixSystems-0.29.0-Setup.exe` 与 blockmap
- [ ] 执行历史 Release 资产补档

## 新增/修改重点
- `code/src/components/Layout/index.tsx` — 手机版导航抽屉与窄屏布局
- `code/src/pages/systemsetting/index.tsx` — Aix 模型 Key 槽
- `code/src/pages/desktop/index.tsx` — Windows 超级管理器雏形
- `desktop/main.cjs`、`desktop/preload.cjs`、`code/src/utils/electron.ts` — 安全只读系统状态 IPC
- `Aix_tools/release_assets.py` — 全版本 Release 资产补档工具

## 下一步候选方向
1. **超级管理器二期**：自启项只读扫描、隐私清理建议、磁盘保护策略和文件扫描面板
2. **Aix 模型跨页策略中心**：统一专注、成长、日记、习惯、桌面管理的模型调用和策略历史
3. **手机版实质适配**：移动端首页、底部导航、触控优化和 PWA 安装体验
