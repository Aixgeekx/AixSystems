# AixSystems · 时间管理系统

<p align="center">
  <img src="desktop/build/icon.png" width="128" height="128" alt="AixSystems logo" />
</p>

<p align="center">
  <strong>离线本地时间管理系统 · 零服务器依赖 · 浏览器 & 桌面双形态</strong>
</p>

<p align="center">
  Vite · React 18 · TypeScript · Ant Design 5 · Dexie (IndexedDB) · Electron 31
</p>

---

## 项目定位

AixSystems 是一个**完整可运行的时间管理系统原型框架**,覆盖 23 个业务模块、17 种事项类型、17 款主题。所有数据本地 IndexedDB 存储,零服务器依赖。

可直接作为:
- 个人时间管理工具日常使用(双击即用)
- 基于此构建你自己的时间管理产品(源码完整,模块化清晰)
- 离线 PWA / Electron 桌面应用的参考实现

## 三秒开箱

```bash
git clone https://github.com/<YOUR>/AixSystems.git
cd AixSystems
```

**Windows**:双击 `results/桌面版.bat`(Electron 独立窗口)或 `results/启动.bat`(浏览器)。首次自动安装依赖。

**命令行**:
```bash
cd code && npm install && npm run dev   # 开发模式 http://127.0.0.1:5173
```

## 最近更新

- `v0.8.0`：日记和备忘录编辑器改为按需加载，并新增本地草稿恢复，减少离线便携场景下的误操作损失
- `v0.7.0`：专注页图表改为按需懒加载，默认先显示最近记录，进一步降低离线便携场景下的首开压力
- `v0.6.0`：路由改为懒加载，构建加入分包策略，降低离线便携版首屏加载压力
- `v0.5.0`：新增全局本地状态条，备份后会记录最近一次备份元数据，数据中心可直接看到最近备份信息
- `v0.4.0`：专注会话支持本地断点续跑，启动页设置正式生效，系统设置页升级为本地系统控制台
- `v0.3.0`：搜索页升级为检索工作台，专注页支持暂停恢复，数据中心改为本地实时统计视图，整体背景与界面层次继续增强
- `v0.2.0`：新增全局命令面板，重构工作台外壳和交付脚本结构

## 功能速览

| 类别 | 能力 |
|---|---|
| **视图** | 我的一天 / 一周 / 一月 / 一年 |
| **事项** | 全部 / 日程 / 清单 / 四象限(拖拽) / 重复 |
| **事项类型** | 17 种:日程/清单/生日/纪念日/倒数日/节日/生理期/信用卡还款/贷款/吃药/起床闹钟/睡眠闹钟/作息/跑步/读书/穿衣搭配/课程表/上班打卡 |
| **重复规则** | 每天/周/月/年 + 工作日 + 自定义间隔 + 周几 + **记忆曲线** |
| **提醒** | 最多 5 个提醒(准时/提前 N 分/小时/天),浏览器 Notification 通道 |
| **专注** | 倒计时 / 正计时 / 番茄钟,严格模式,5 款白噪音(Web Audio 实时合成) |
| **工作台体验** | 全局命令面板 / 检索工作台 / 沉浸式专注界面 / 动态主题背景 |
| **统计** | ECharts 近 14 天柱状图 / 饼图 / 时间轴 |
| **日记** | TipTap 富文本 + 心情 + 那年今日 + AES-GCM 加密 |
| **备忘录** | 富文本 + 文件夹 + 置顶 + 回收站 |
| **主题** | 17 款内置壁纸 + 亮度 / 模糊调节 |
| **安全** | PBKDF2 派生密钥 + AES-GCM 密码保护(应用锁 / 日记锁) |
| **桌面小部件** | 浮动小窗,三种样式 + 透明度调节 + 位置记忆 |
| **搜索** | 跨事项 / 日记 / 备忘录 |
| **备份** | JSON 全量导出导入(桌面版直写磁盘) |
| **本地体验** | 专注断点续跑 / 启动页偏好生效 / 存储状态可见 |
| **数据可见性** | 全局本地状态条 / 最近备份时间与路径可追踪 |
| **性能与可移植性** | 路由懒加载 / 分包构建 / 降低本地便携版首屏压力 |
| **按需加载** | 专注图表延迟加载 / 进入需要的界面再取重依赖 |
| **本地容错** | 日记草稿恢复 / 备忘录草稿恢复 / 降低误关窗口损失 |
| **PWA** | 可安装 + Service Worker 离线缓存 |

## 技术栈

```
前端     Vite 5 · React 18 · TypeScript 5.6 · Ant Design 5
状态     Zustand 5
数据     Dexie 4 (IndexedDB 封装) · 15 张表
富文本   TipTap 3 (ProseMirror)
日期     dayjs + lunar-javascript
重复规则 rrule (RFC 5545)
图表     ECharts 5
拖拽     @dnd-kit/core + /sortable
桌面     Electron 31 + electron-builder
测试     Vitest + @testing-library/react (25 用例)
```

## 目录结构

```
AixSystems/
├─ code/                     应用源码 (Vite + React + TS)
│  ├─ src/
│  │  ├─ config/            统一配置
│  │  ├─ db/                IndexedDB schema
│  │  ├─ models/            TS 数据模型
│  │  ├─ stores/            Zustand
│  │  ├─ hooks/             自定义 hooks
│  │  ├─ utils/             工具 (time/rrule/lunar/crypto/audio/electron)
│  │  ├─ components/        通用组件
│  │  └─ pages/             21 个路由页面
│  └─ public/
├─ desktop/                  Electron 桌面壳
│  ├─ main.cjs              主进程 + IPC
│  ├─ preload.cjs           渲染进程桥
│  └─ build/icon.ico        应用图标
├─ results/                  交付脚本与说明
│  ├─ 桌面版.bat            Electron 独立窗口
│  ├─ 启动.bat              浏览器生产模式
│  ├─ 开发.bat              浏览器开发模式
│  ├─ 桌面版-开发.bat       Electron 开发模式
│  ├─ 打包.bat              Windows 安装包
│  ├─ 打包-便携版.bat       Windows 便携压缩包
│  ├─ 创建桌面快捷方式.bat  桌面快捷方式
│  ├─ 创建桌面快捷方式.ps1  快捷方式实现
│  └─ 使用说明.md           使用文档
├─ Aix_tools/                辅助脚本(含图标生成器)
├─ title/                    调研资料
└─ data/                     JSON 备份目录
```

## 打包分发

```bash
# 一键(推荐)
双击 results/打包.bat

# 命令行
cd desktop && npm install && npm run dist
```

产物:`desktop/dist-installer/AixSystems-0.8.0-Setup.exe`(约 80MB NSIS 向导包)

## 维护约定

- 每次功能、界面、脚本或交付结构发生变更时,同步更新本 `README.md`
- 每一轮稳定修改完成后,提交并推送到 GitHub 作为远端备份
- 持续迭代模式下,默认按“修改代码 → 更新 README → 测试/构建 → 推送 GitHub”执行

## License

MIT
