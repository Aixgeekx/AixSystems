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

**Windows**:双击根目录 `桌面版.bat`(Electron 独立窗口)或 `启动.bat`(浏览器)。首次自动安装依赖。

**命令行**:
```bash
cd code && npm install && npm run dev   # 开发模式 http://127.0.0.1:5173
```

## 功能速览

| 类别 | 能力 |
|---|---|
| **视图** | 我的一天 / 一周 / 一月 / 一年 |
| **事项** | 全部 / 日程 / 清单 / 四象限(拖拽) / 重复 |
| **事项类型** | 17 种:日程/清单/生日/纪念日/倒数日/节日/生理期/信用卡还款/贷款/吃药/起床闹钟/睡眠闹钟/作息/跑步/读书/穿衣搭配/课程表/上班打卡 |
| **重复规则** | 每天/周/月/年 + 工作日 + 自定义间隔 + 周几 + **记忆曲线** |
| **提醒** | 最多 5 个提醒(准时/提前 N 分/小时/天),浏览器 Notification 通道 |
| **专注** | 倒计时 / 正计时 / 番茄钟,严格模式,5 款白噪音(Web Audio 实时合成) |
| **统计** | ECharts 近 14 天柱状图 / 饼图 / 时间轴 |
| **日记** | TipTap 富文本 + 心情 + 那年今日 + AES-GCM 加密 |
| **备忘录** | 富文本 + 文件夹 + 置顶 + 回收站 |
| **主题** | 17 款内置壁纸 + 亮度 / 模糊调节 |
| **安全** | PBKDF2 派生密钥 + AES-GCM 密码保护(应用锁 / 日记锁) |
| **桌面小部件** | 浮动小窗,三种样式 + 透明度调节 + 位置记忆 |
| **搜索** | 跨事项 / 日记 / 备忘录 |
| **备份** | JSON 全量导出导入(桌面版直写磁盘) |
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
├─ 启动.bat                  双击 - 浏览器 + 生产模式
├─ 开发.bat                  双击 - 浏览器 + 热更新
├─ 桌面版.bat                双击 - Electron 独立窗口
├─ 桌面版-开发.bat           双击 - Electron + 热更新
├─ 打包.bat                  双击 - 生成 .exe 安装包
├─ 创建桌面快捷方式.bat      一次性 - 在桌面放 3 个图标
├─ 使用说明.md               完整使用文档
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
├─ Aix_tools/                辅助脚本(含图标生成器)
├─ title/                    调研资料
└─ data/                     JSON 备份目录
```

## 打包分发

```bash
# 一键(推荐)
双击 打包.bat

# 命令行
cd desktop && npm install && npm run dist
```

产物:`desktop/dist-installer/AixSystems-0.1.0-Setup.exe`(约 80MB NSIS 向导包)

## License

MIT
