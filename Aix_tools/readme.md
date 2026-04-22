# Aix_tools 说明

> 本目录存放 agent 生成的辅助脚本、工具、项目文档等。

## 工具脚本

- `decode_bundle_cn.py` — webpack minified bundle 里 `\uXXXX` 转义的中文字符串批量解码(调研阶段使用)。
- `gen_icon_v2.py` — 以 `image-cache/.../1.png` 手绘无穷符号为源图,生成**紫红渐变底 + 银白 logo + iOS 圆角**的应用图标,覆盖 `desktop/build/icon.{png,ico}` 和 `code/{public,dist}/icons/icon-{192,512}.png`。改颜色/版式调 `BG_TOP_LEFT`/`BG_BOT_RIGHT`/`LOGO_COLOR`/`CORNER` 常量。**依赖 Pillow** (`pip install pillow`)。
- `rebuild_bats.py` — 批量生成 `results/` 下的 `.bat` 启动脚本,**强制 GBK 编码 + CRLF 换行 + 末尾 pause 兜底**。任何 bat 的修改都改本脚本再执行 `python Aix_tools/rebuild_bats.py`,严禁直接编辑 .bat(编辑器会把 GBK 另存为 UTF-8 导致 cmd 报 `'ho' 不是内部命令` 系列错)。

## 脚本编码规则 (Windows 中文环境)

| 文件类型 | 编码 | 原因 |
|---|---|---|
| `.bat` | **GBK (CP936)**,无 BOM | Windows cmd.exe 按系统 ANSI 代码页解析 bat,中文 Windows 默认 GBK。UTF-8 无 BOM 会把 `echo`/`call`/`errorlevel` 被中文字节拦腰切断。 |
| `.ps1` | **UTF-8 with BOM** | PowerShell 5.1 默认按 ANSI 读,PS 7+ 默认 UTF-8。加 BOM 后两者都按 UTF-8 解析,兼容最广。 |
| `.py` / `.ts` / `.md` | UTF-8 (无 BOM) | 符合跨平台通用默认。 |

## 项目概览

AixSystems 时间管理系统(离线本地版)。基于调研原版 [时光序](https://web.shiguangxu.com) 逆向得到的功能画像设计实现,但完全本地化、零服务器依赖,并可自由扩展为你自己的时间管理产品。

| 模块 | 说明 |
|---|---|
| **15 张表的 IndexedDB** | 事项 / 日记 / 备忘录 / 专注 / 分类 / 文件夹 / 标签 / 提醒队列 / 主题 / 设置 / 用户 / 日志 / 附件 / 缓存 KV |
| **17 种事项类型** | 日程/清单/生日/纪念日/倒数日/节日/生理期/信用卡还款/贷款/吃药/起床闹钟/睡眠闹钟/作息/跑步/读书/穿衣搭配/课程表/上班打卡 |
| **17 款主题** | 霜茶/草丛/静夜/浅海/极光/天空/雪地/海岸/房檐/融合/碧空/踏青/炽夏/桃桃/初暖/墙纸/纯色 |
| **40+ 路由** | 对齐原版 `/home/*` 路径结构 |

## 启动方式

- **双击** `results/` 下的 `.bat` 脚本最方便(见 `../results/使用说明.md`)
- 或命令行:

```bash
cd code
npm install
npm run dev        # 开发服务 http://127.0.0.1:5173
npm run build      # 生产打包 到 code/dist/
npm run preview    # 预览生产产物
npm test           # 跑单元测试 (25 用例)
```

## 目录结构

```
AixSystems/
├─ code/                # 应用源码 (Vite + React + TS + AntD + Dexie)
│  └─ src/
│     ├─ config/         # 统一配置 (constants/itemTypes/routes/themes/festivals)
│     ├─ db/             # IndexedDB schema + 种子数据
│     ├─ models/         # TypeScript 数据模型
│     ├─ stores/         # Zustand 全局状态
│     ├─ hooks/          # useItems/useReminder/useLunar/useHotkeys/useClassifies
│     ├─ utils/          # time/rrule/lunar/notify/export/crypto/audio/html/electron
│     ├─ components/     # Layout/ItemForm/RepeatPicker/ReminderPicker/RichEditor/
│     │                  # PasswordLock/FloatingReminder/ItemCard/Empty
│     └─ pages/          # 21 个路由页面
├─ desktop/             # Electron 桌面壳
│  ├─ main.cjs           # 主进程 + IPC
│  ├─ preload.cjs        # 渲染进程桥 (window.sgx)
│  ├─ package.json       # electron-builder 配置
│  └─ build/icon.ico     # 应用图标 (小写 x 造型)
├─ Aix_tools/           # 本目录
├─ title/               # 调研资料
├─ data/                # 桌面版导出的 JSON 备份
├─ results/             # 最终交付物
└─ results/             # 启动脚本、快捷方式脚本与使用说明
```

## 技术栈

- Vite 5 + React 18 + TypeScript 5.6
- Ant Design 5 (UI)
- Dexie 4 (IndexedDB 封装)
- TipTap 3 (富文本编辑)
- dayjs + lunar-javascript (时间 + 农历)
- rrule (重复规则 RFC 5545)
- Zustand (状态管理)
- ECharts + echarts-for-react (图表)
- @dnd-kit (拖拽)
- Electron 31 + electron-builder (桌面版)
- Vitest (单元测试,25 用例)

## 离线改造要点

| 原版能力 | 本地版方案 |
|---|---|
| 账号登录 | 去掉,启动即主界面 |
| 微信/QQ | 去掉 |
| 会员 Gate | 全部解锁 |
| 服务器同步 | JSON 导入导出手动备份(Electron 下直写磁盘) |
| 电话/短信提醒 | 浏览器 Notification API |
| 桌面小部件 | 浮动小窗 (position:fixed) |
| 附件 OSS | 存 IndexedDB blobs 表 |
| 意见反馈 | 写入本地 `eventLog` 表 |

## 打包分发

```bash
cd desktop && npm install && npm run dist
```

产物: `desktop/dist-installer/AixSystems-0.4.0-Setup.exe` (NSIS 安装包,约 80MB)

便携版: `npm run dist:portable` → `AixSystems-0.4.0-portable.exe`
