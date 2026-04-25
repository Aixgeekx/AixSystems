# Aix_tools 说明

> 本目录存放 agent 生成的辅助脚本、工具、项目文档等。

## 最新版本 v0.39.0
- 数据中心新增数据迁移胶囊，按备份新鲜度、模块覆盖、记录规模和运行环境生成迁移包清单、换机步骤和风险提示。
- Aix 中枢新增技能自检矩阵，按启用状态、数据输入、Provider、权限边界和日志证据生成健康评分与修复动作。
- 桌面超级管理器新增执行前预检舱，在 PowerShell 白名单执行前汇总系统压力、预设风险、备份/回滚和安全边界。

## 最新版本 v0.38.0
- Agent 中枢新增自治队列，按风险、权限阶段、恢复进度和停滞时间自动排序待续跑分支。
- 成长仪表盘新增 90 天控制推演，基于专注、习惯、目标、日记频率和复习雷达生成 30/60/90 天控制力路径。
- 系统设置新增 Aix Provider 可信路由，按协议、健康、延迟、官方回退和活跃槽生成可信度评分与推荐主路由。

## 最新版本 v0.37.0
- 首页新增自主控制指挥台，自动合成最高优先级控制指令、恢复力评分、执行顺序和下一步入口。
- Aix 中枢新增技能任务图谱，把数据感知、策略生成、权限确认和执行归档组织成可恢复任务链。
- 数据中心新增灾备演练舱，按备份新鲜度、模块覆盖、数据规模和运行环境生成灾备等级与演练步骤。

## 最新版本 v0.36.0
- 日记页新增本地情绪-行动关联图谱，只统计情绪、标签、强度、完成事项、专注和习惯数据，Aix 不读取日记正文。
- 专注页新增 1-5 星质量智能评级，结合时长、严格模式、白噪音偏好和高能时段输出节奏建议。
- 首页今日专注警报升级为实时控制卡，聚合专注缺口、质量滑坡、建议事项和最佳补专注时段。

## 最新版本 v0.35.0
- Aix 自进化路线图新增 7/30/90 天系统进化规划，可按控制力、数据主权、技能和 Provider 状态归档。
- Agent 权限合约新增允许范围、禁止动作、证据来源和审批阶段，任务创建时写入本地恢复数据。
- 桌面应急工具箱新增断网急救、时间校准、Hosts 检查和端口急救，并接入 PowerShell 白名单确认链路。

## 最新版本 v0.34.0
- Aix 控制战役编排器新增四阶段本地战役，可把今日压力一键写入事项子任务和审计日志。
- Agent 恢复驾驶舱新增分支队列、权限阶段、恢复进度和下一步动作视图。
- 桌面超级管理器健康演练新增健康分、性能/磁盘/自启/端口只读演练和安全边界提示。

## 最新版本 v0.33.0
- 插件广场二期新增技能详情、输入/输出 schema、版本归档和本地插件包导入雏形。
- PowerShell 白名单工作流新增预设风险评分、执行前确认、备份说明和回滚说明。
- Aix 本地代理中心新增 OpenAI / Claude / Ollama 协议能力卡、Provider 探活和故障转移提示。

## 最新版本 v0.32.0
- 新增 Aix 主入口，把 openclaw 技能生态、Claude Code 专业 Agent 流程和时光序私人数据统一成软件核心中枢。
- 新增 Aix 技能库 / 插件广场雏形，内置成长控制、复习削峰、专注作战、电脑只读扫描、私人便携胶囊和 Provider 调度技能。
- 新增私人便携胶囊与离线/有 API 双模式：没有 API 仍是全能系统工具，有 API 后升级为有灵魂的黑科技系统。

## 最新版本 v0.31.0
- 超级管理器三期新增自启入口、临时目录、端口占用只读扫描，并补充 PowerShell 只读预设通道。
- Aix Provider 管理新增健康检查、延迟记录、策略历史和故障转移回退；Aix 是软件内置 AI 名称，由用户提供 API 与 Key。
- 新增 Aix Agent 中枢，把个人成长、电脑管理和模型调度做成可分支、可授权、可恢复的本地任务。

## 最新版本 v0.29.0
- 全局外壳新增手机版导航抽屉和窄屏布局，为后续手机版做准备。
- 系统设置新增 Aix 模型 Key 槽，可保存并切换多套模型供应商配置。
- 桌面端新增 Windows 超级管理器雏形，安全只读展示 CPU、内存、磁盘状态。
- 新增 `release_assets.py`，可把 `desktop/dist-installer/` 中所有历史安装包、portable.exe、zip 和 blockmap 上传到对应 GitHub Release。

## 最新版本 v0.28.0
- 专注页新增 Aix 深度策略：基于场景、完成率和质量调用模型生成干预。
- 成长仪表盘新增任务编排器：把目标、专注、习惯、日记串成今日流程。
- 成长仪表盘新增风险预警中心：输出风险分和即时干预动作。

## 最新版本 v0.27.0
- 专注页新增智能场景识别：按当前时间段和近期完成质量推荐专注策略。
- 习惯页新增模板与链式习惯：一键生成成长链，完成后提示下一环节。
- 日记页新增智能引导：按情绪快速套用反思模板。

## 最新版本 v0.26.0

- **Aix 模型 API 配置**: 系统设置新增 Aix 模型接口，支持配置 API 地址、API Key 和模型名，配置仅保存在本地 IndexedDB
- **Aix 成长轨迹模拟器**: 成长仪表盘新增 30 天模拟按钮，结合专注、目标、习惯和成长雷达调用 Aix 输出个人成长干预建议
- **首页智能控制助手**: 首页工作台新增今日计划、专注建议、晚间复盘三类一键策略，可用 Aix 模型生成或在未配置时使用本地兜底建议

## 工具脚本

- `openclaw_study.md` — openclaw 学习笔记，结合时光序、Claude Code、cc-switch 和 Aix 内置 AI 要求，沉淀黑科技全能系统路线。
- `decode_bundle_cn.py` — webpack minified bundle 里 `\uXXXX` 转义的中文字符串批量解码(调研阶段使用)。
- `gen_icon_v2.py` — 以 `image-cache/.../1.png` 手绘无穷符号为源图,生成**紫红渐变底 + 银白 logo + iOS 圆角**的应用图标,覆盖 `desktop/build/icon.{png,ico}` 和 `code/{public,dist}/icons/icon-{192,512}.png`。改颜色/版式调 `BG_TOP_LEFT`/`BG_BOT_RIGHT`/`LOGO_COLOR`/`CORNER` 常量。**依赖 Pillow** (`pip install pillow`)。
- `rebuild_bats.py` — 批量生成 `results/` 下的 `.bat` 启动脚本,**强制 GBK 编码 + CRLF 换行 + 末尾 pause 兜底**。任何 bat 的修改都改本脚本再执行 `python Aix_tools/rebuild_bats.py`,严禁直接编辑 .bat(编辑器会把 GBK 另存为 UTF-8 导致 cmd 报 `'ho' 不是内部命令` 系列错)。
- `release_assets.py` — 扫描 `desktop/dist-installer/` 的 `AixSystems-*` 安装包、便携包和 blockmap，按版本自动创建/补齐 GitHub Release 附件；使用前需已有 GitHub token 或 git credential。

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
| **18 张表的 IndexedDB** | 事项 / 日记 / 备忘录 / 专注 / 分类 / 文件夹 / 标签 / 提醒队列 / 主题 / 设置 / 用户 / 日志 / 附件 / 缓存 KV / 习惯 / 习惯打卡 / 目标 |
| **数据主权导出** | 全量备份 + 选择性模块导出 + Manifest 表记录清单 + 数据主权评分 |
| **17 种事项类型** | 日程/清单/生日/纪念日/倒数日/节日/生理期/信用卡还款/贷款/吃药/起床闹钟/睡眠闹钟/作息/跑步/读书/穿衣搭配/课程表/上班打卡 |
| **记忆曲线复习提醒** | 选择记忆曲线后自动生成 1/2/4/7/15/30 天复习提醒队列 |
| **复习中心** | 聚合今日待复习、未来 7 天分布、已过期复习、待反馈提醒、完成记录、掌握率、巩固回流、复习强度配置和智能推荐 |
| **首页紧凑应用模式** | 两列功能入口矩阵 + 搜索/筛选/收藏/拖拽排序/控制台模板，聚合事项、成长、记录、工具、设置等所有核心入口 |
| **今日行动控制** | MyDay AI 日计划编排 + 自动化执行面板，聚合待办、习惯、复习、专注和日记入口 |
| **成长风险控制** | 目标风险预警详情 + 目标推进建议器 + 习惯恢复计划 + 未来 30 天复习压力热力图 + 压力摘要 + 削峰建议 |
| **成长报告分享** | Markdown 报告 + HTML 可视化报告 + 成长控制力分享卡 |
| **Aix 内置中枢** | 独立 Aix 主入口 + 控制战役编排器 + 自进化路线图 + 技能库/插件广场 + 插件详情/Schema/版本归档 + OpenAI/Claude/Ollama 本地代理中心；无 API 是离线全能系统工具，有 API 是有灵魂的黑科技系统 |
| **Aix 模型控制** | 系统设置配置 API 地址/API Key/模型名，并支持 cc-switch 风格 Provider 预设、原子切换、配置备份和官方登录回退，首页智能控制助手和成长轨迹模拟器输出个人行动建议 |
| **27 款主题风格** | 赛博系列 7 款 / 极简系列 7 款 / 渐变系列 7 款 / 经典保留 6 款 |
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
npm test           # 跑单元测试 (39 用例)
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
│     └─ pages/          # 24+ 个路由页面
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
- Vitest (单元测试,39 用例)

## 离线改造要点

| 原版能力 | 本地版方案 |
|---|---|
| 账号登录 | 去掉,启动即主界面 |
| 微信/QQ | 去掉 |
| 会员 Gate | 全部解锁 |
| 服务器同步 | JSON 导入导出手动备份(Electron 下直写磁盘) |
| 电话/短信提醒 | 浏览器 Notification API |
| 桌面小部件 | 浮动小窗 (position:fixed) + 跟随全局/白天/黑夜/简约/赛博朋克/渐变/复古主题 |
| 附件 OSS | 存 IndexedDB blobs 表 |
| 意见反馈 | 写入本地 `eventLog` 表 |

## 打包分发

```bash
cd desktop && npm install && npm run dist
```

产物: `desktop/dist-installer/AixSystems-0.35.0-Setup.exe` (NSIS 安装包,约 80MB)

目录便携版: `npm run dist:portable` → `desktop/dist-installer/win-unpacked/`

单文件便携版: `npm run dist:portable-exe` → `AixSystems-0.31.0-portable.exe`
