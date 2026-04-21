# 时光序 App 调研文档 (基于 Web 端 bundle 分析)

> 调研日期: 2026-04-21
> 数据来源: `https://web.shiguangxu.com/` 的前端 bundle (main.js 1.9MB + vendor.js 1.7MB) + 所有一级 API 路径 + 927 条 UI 中文字符串
> 调研方式: `curl` 抓包 → Python 脚本解码 `\uXXXX` 字符串 → 正则提取路由、API、依赖
> 置信度: **★★★★★** 对 Web 端; 对移动端/后端仅基于 URL/API 命名推断,仍有不确定性
> 原始数据: `title/raw/home.html` (入口 HTML), `title/cn_strings.txt` (全部解码字符串), `title/raw/all_apis.txt` (全部 API)

---

## 一、公司与产品

| 项 | 值 | 来源 |
|---|---|---|
| 产品名 | **时光序** (英文 shiguangxu) | bundle 中 `时光序` |
| 产品早期名 | **未来管家** (weilaizhushou) | bundle 中 `未来管家`;老 API 域名 |
| 开发公司 | **花生未来(广州)科技有限公司** | bundle 中 `花生未来（广州）科技有限公司` |
| 产品 Slogan | "你的专属私人管家" / "好用的时间管理工具" | bundle 字符串 |
| Web 端 | https://web.shiguangxu.com | 当前抓取入口 |
| 老域名 | https://www.weilaizhushou.com | 仍然保留跳转 |
| Android 包名 | `com.duorong.smarttool` (早期 `com.weilai.manager`) | bundle 中的下载链接 |
| iOS App Store ID | 1343731648 (老版/未来管家) | bundle 中的 itunes.apple.com 链接 |

**关键判断**: 产品经历了 "未来管家 → 时光序" 的品牌升级,后端服务仍大量沿用 `weilaizhushou.com` 域名,新的 `shiguangxu.com` 域名是品牌前端;内部代号 **duorong (多榕)**。

---

## 二、功能地图 (基于路由 + API + UI 字符串三向校验)

### 2.1 左侧主导航 (`/home/*`)

| 模块 | 路由 | 说明 |
|---|---|---|
| 我的一天 | `/home/today/myDay` | 当日聚合视图 |
| 我的一周 | `/home/today/myWeek` | 周视图 |
| 我的一月 | `/home/today/myMonth` | 月视图 |
| 我的一年 | UI 提及但未见独立路由 | 可能在月视图内 |
| 事项 - 全部 | `/home/matter/all` | 所有事项聚合 |
| 事项 - 日程 | `/home/matter/schedule` | 日程视图 |
| 事项 - 清单 | `/home/matter/checkList` | 清单视图 |
| 事项 - 四象限 | `/home/matter/importance` | 重要&紧急矩阵 |
| 事项 - 重复 | `/home/matter/repeat` | 重复事项 |
| 备忘录 | `/home/memo` | 富文本备忘 |
| 日记日历 | `/home/diary/calendar` | 日记月历 |
| 日记列表 | `/diary/diaryList` | 日记列表 |
| 番茄专注 | `/home/absorbed/tomatoAbsorbed` | 专注/番茄钟 |
| 应用锁 | `/home/applicationlock` | App 级密码锁 |
| 桌面小部件 | `/home/desktop/dayPlugin` / `dayPluginSetup` | 桌面小组件设置 (会员) |
| 主题换肤 | `/home/themeskin` | 主题 / 壁纸 |
| 系统设置 | `/home/systemsetting` | 设置中心 |
| 意见反馈 | `/home/feedback` | 反馈 |
| 用户中心 | `/home/user` | 账户设置 |
| 搜索 | `/search/index` | 全局搜索 |
| 帮助中心 | `/help`, `/commonProblem/*`, `/newcomerGuide/*`, `/newFeatures/index`, `/characteristic/index` | 帮助/新手引导/新功能/特色 |

### 2.2 事项类型 (共 23 个业务模块,从 API `/base/<模块>/` 列出)

| # | 模块 | API 前缀 | UI 显示名 | 典型能力 |
|---|---|---|---|---|
| 1 | anniversary | `/base/anniversary/` | 纪念日 | 自定义纪念日,农历/阳历,完成提醒 |
| 2 | aunt | `/base/aunt/` | **生理期 / 大姨妈** | 经期预测与完成记录 |
| 3 | bill | `/base/bill/` | **记账 / 信用卡还款** | 账单、信用卡还款日提醒 |
| 4 | birthday | `/base/birthday/` | 生日 | 生日提醒,支持农历/公历 |
| 5 | book | `/base/book/v1/remind/` | **读书** | 读书提醒 |
| 6 | clock | `/base/clock/` | **闹钟 / 作息** | 起床闹钟、睡眠闹钟、作息表 (`work_rest_schedules`) |
| 7 | countdown | `/base/countdown/` | 倒数日 | 倒计时至某日 |
| 8 | diary | `/base/diary/v2/` | **日记** | 富文本日记 + 那年今日 + 标签 + 回收站 + 心情 + 位置 + 加密 |
| 9 | dress | `/base/dress/v1/` | **穿衣搭配** | 穿衣提醒 |
| 10 | festival | `/base/festival/v1/custom/` | **节日** | 自定义节日 (内置元旦/春节/元宵/母亲节/父亲节/端午/中秋/教师/万圣/情人/平安夜/圣诞/劳动/国庆) |
| 11 | focus | `/base/focus/v2-v4/` | **专注 / 番茄钟** | 倒计时/正计时/番茄钟 + 严格模式 + 白噪音 + 统计 (饼图/柱状图/时间轴) |
| 12 | healthy/medicine | `/base/healthy/medicine/v1/` | **吃药提醒** | 医疗提醒 |
| 13 | loan | `/base/loan/` | **贷款** | 贷款账单还款 |
| 14 | log | `/base/log/data/` | 埋点 | `activite` = 活跃埋点 |
| 15 | manage | `/base/manage/v1/` | 应用管理 | `applet` 子应用/小程序,`viewDisplay` 菜单排序 |
| 16 | plan | `/base/plan/*` | **计划 / 待办 / 打卡** (核心) | checkin 打卡、checklist 清单、classify 分类、importance 四象限、record 待办记录、repeat 重复 |
| 17 | qa | `/base/qa/` | 问答 | 帮助内容 |
| 18 | run | `/base/run/` | **跑步** | 跑步提醒/记录 |
| 19 | summary | `/base/summary/` | **总结** | 周结/月结 |
| 20 | syllabus | `/base/syllabus/` | **课程表** | 学期课表 |
| 21 | sys | `/base/sys/` | 系统 | 版本/配置 |
| 22 | user | `/base/user/` | 用户 | 账户/密码/验证码/邮箱绑定 |
| 23 | work | `/base/work/` | 工作 | 上班下班相关 |

> 内置快捷模板示例 (UI 提及): 上班、下班、晨会、吃早餐、吃晚餐、喝水、吃药、记账、跑步、读书、起床闹钟、睡眠闹钟。

### 2.3 重复规则引擎 (远超行业平均)

从 UI 字符串看,重复规则极其丰富:

- **基础**: 不重复 / 每天 / 每周 / 每月 / 每年 / 每个工作日 (周一到周五)
- **间隔**: 每隔 N 天/周/月/年
- **分散**: 每周 (不同天、不同时间)、每月 (不同天、不同时间)
- **位置**: 月的第 N 日 / 月第 N 个周几 / 最后一天 / 最后一个 (周几) / 月初
- **年度**: 按日期 / 按周数 / 年的第 N 个月的第 N 天
- **任意**: 任意多天 (自选日期集)
- **记忆曲线** ★★★★: 艾宾浩斯遗忘曲线间隔 (教育场景)
- **智能跳过**: 法定节假日 / 非补班周末

### 2.4 事项公共字段

- 时间: 全天 / 时间点 / 时间段 / 多个时间 / 长期 / 持续时间
- 提醒: 最多 5 个 (第一个/第二个.../ 第五个),每个可提前 N 分钟/小时/天
- 附件: 图片、视频、音频、压缩文件、文本文件、其他文件 (通过阿里云 OSS)
- 备注: 文本 / 贴纸 / 表情
- 地址: 集成百度地图 (BMap)
- 天气: 有 "天气" 字段
- 延期: 已顺延、延期
- 子任务: "完成母任务需要先完成子任务"

### 2.5 日记 (一等功能)

- 富文本 (TinyMCE 或 Slate) + 图片 + 位置 + 心情
- 那年今日 (`/base/diary/v2/todayInHistory`)
- 标签 (add/delete/list/update)
- 回收站 (`moveInOrOutTrash`)
- 置顶 (`updateDiaryTop`)
- 日记密码 (`password/checkDiaryPassword` / `initStatus` / `updatePassword` / `updateDiaryEncryption`)
- 日记锁 (整体锁 / 单条锁)
- 月历视图 (`getMonthDiary`)

### 2.6 专注 / 番茄钟 (细化版本 v2→v4)

- 类型: 倒计时、正计时、番茄钟
- 严格模式: 不可暂停 / 不可提前完成
- 重复专注: `repeat/add`, `repeat/list`, `repeat/update`, `addFocusRecord`
- 放弃记录: `giveup/add` (保存/不保存)
- 延长专注: 延长时长 / 延长番茄钟个数
- 统计: 饼图 (`pieChart`)、柱状图 (`barChart`)、日柱状图 (`dayBarChart`)、记录列表 (`recordList`)
- 白噪音场景: 休息 / 打扰 / 信息 / 洗手间
- 感想: "专注过程中有什么收获?" (写下反思)

### 2.7 桌面小组件 (会员)

- 路由: `/home/desktop/dayPlugin`
- 能力: 嵌入桌面、置于顶层、多主题、透明度、亮度、模糊、同时显示提醒弹窗
- 明确标识 **"桌面小部件为会员功能"**

### 2.8 主题系统

17 款内置壁纸/主题: 霜茶、草丛、静夜、浅海、极光、天空、雪地、海岸、房檐、融合、碧空、踏青、炽夏、桃桃、初暖、墙纸、纯色,支持调亮度 / 模糊度。

### 2.9 账户 & 安全

- 登录方式: 手机号+验证码 / 微信扫码 / QQ / 邮箱 (部分场景仅绑定)
- 注册: `《注册协议》` + 邀请码 (选填)
- 密码保护: 日记密码、备忘录密码、应用锁、安全锁、日记锁 (整体/单条)
- 账号能力: 改头像 (缩放/旋转/裁剪)、昵称、手机、邮箱、性别、签名

### 2.10 数据与统计 (ECharts 几乎全家桶)

bundle 中出现的图表类型: **饼图 / 柱状图 / 折线图 / 散点图 / 涟漪散点图 / 雷达图 / 树图 / 矩形树图 / 箱型图 / 热力图 / 地图 / 平行坐标图 / 线图 / 关系图 / 桑基图 / 漏斗图 / 仪表盘图 / 象形柱图 / 主题河流图 / 旭日图** → 说明 ECharts 被完整引入,产品本身大量使用饼图/柱状图/时间轴/日柱状图。

---

## 三、技术栈 (Web 端, 已验证)

### 3.1 核心框架与状态管理

| 技术 | 命中次数 | 说明 |
|---|---|---|
| **React** | 13 | `useState`, `useEffect`, `createRoot` 模式 |
| **Ant Design (antd)** | 32 + rc-(13) | UI 组件库,底层 `rc-*` 系列 |
| **Redux + Redux-Saga** | 2 + 3 | 状态管理与副作用 |
| **Immutable.js** | 15 | 不可变数据结构 |
| **React Router (history)** | 26 | 路由 |

### 3.2 关键工具库

| 技术 | 说明 |
|---|---|
| **Moment.js** (43 命中) | 日期处理 — 旧派选择,非 dayjs/date-fns |
| **ECharts** (10 命中 + 全图表名命中) | 统计图表 |
| **TinyMCE v3.20.1** | 主富文本编辑器 (`/static/tinymce/tinymce.js?3.20.1_1769768620492`) |
| **Slate.js** (78 命中) | 可能为另一套编辑器或自定义 |
| **xlsx** | Excel 导入/导出 |
| **qrcode** | 扫码登录 |
| **百度地图 (BMap)** | 地点选择 |
| **qs** | URL query 处理 |
| **阿里 iconfont** | 三个图标库: `1769511`, `1781111`, `4609560` |

### 3.3 桌面端 = Electron (已确认)

关键证据:
```js
// home.html 中直接判断
this.process && this.process.versions && this.process.versions.electron
// bundle 中 31 处 `ipcRenderer` 调用
```
- macOS 和 Windows 都走 Electron,Mac 上隐藏 Electron loading (`"darwin"!==this.process.platform`)
- 支持快捷键 (热键)、开机自启、嵌入桌面、置于顶层 — 都是 Electron 原生 API
- 桌面端包前缀 `pc-sgx/latest/` 用于更新

### 3.4 响应式适配

```js
// rem 方案: 基准 1920px,字号 = 100px
document.getElementsByTagName("html")[0].style.fontSize = e / 1920 * 100 + "px"
// 例外路由(不做 rem,用固定字号):
["/help","/search/index","/newcomerGuide/...","/characteristic/index","/commonProblem/...","/newFeatures/index"]
```
正常应用走 rem,帮助/搜索/新手引导走 PC 固定字号。

### 3.5 构建与打包

- **Webpack** (`webpackJsonp` 模式,code splitting 明显:main/vendor 两个 chunk + 按需 chunk)
- 资源路径固定前缀 `/static/`
- Chunk hash 命名: `main.2422919e.chunk.js`, `3.65ecfa1d.chunk.js`

---

## 四、后端服务画像 (从域名/API 推断)

### 4.1 环境矩阵

| 环境 | 时光序域名 | 未来助手域名 |
|---|---|---|
| 生产 API | `api.shiguangxu.com` (推测) | `api.weilaizhushou.com` |
| 生产 WS | `api-ws.shiguangxu.com` (推测) | `api-ws.weilaizhushou.com` |
| 预发 API | `pre2.shiguangxu.com`, `pre-web.weilaizhushou.com` | `papi.weilaizhushou.com` |
| 测试 API | `test2.shiguangxu.com`, `test-web.shiguangxu.com`, `tapi.shiguangxu.com` | `tapi.weilaizhushou.com`, `tapi-ws.weilaizhushou.com` |
| 开发 API | `dev2.shiguangxu.com`, `dev-web.shiguangxu.com`, `dapi.shiguangxu.com` | `dapi.weilaizhushou.com` |
| 埋点 | — | `collect.weilaizhushou.com`, `pcollect.*`, `test-collect.*` |
| 协议页 | `wap.shiguangxu.com/member/version2/agreement/register.html?apptype=sgx` | `html5.weilaizhushou.com/...?apptype=weilai` |

**判断**: `apptype=sgx` 对应时光序,`apptype=weilai` 对应未来助手,**两款 App 共用同一后端**,按 `apptype` 参数区分 UI/权益。

### 4.2 对象存储 & CDN

- **阿里云 OSS 深圳**: `livelihood.oss-cn-shenzhen.aliyuncs.com`
- **图片 CDN**: `images.weilaizhushou.com`
- 上传接口: `/base/plan/oss/getToken` (前端直传 OSS 的 STS token 方案)

### 4.3 WebSocket 实时性

- `api-ws.*` 子域名说明有专门的 WS 集群
- 用于: 桌面端实时提醒、跨端同步推送、(可能有的)协作场景

### 4.4 第三方登录 (已确认)

- **微信**: `open.weixin.qq.com/connect/qrconnect`
- **QQ**: `graph.qq.com/oauth2.0/authorize`
- 手机号: 短信验证码 (bundle 有 "发送短信验证码" UI)
- 邮箱: 绑定用

### 4.5 登录/注册字段

- 邀请码 (选填) — 邀请体系
- 注册协议 (`html5.weilaizhushou.com/.../agreement/register.html`)

---

## 五、移动端推断 (未抓到包,仅从命名线索)

| 项 | 推断 | 依据 |
|---|---|---|
| Android 包名 | `com.duorong.smarttool` | 应用宝下载链接 `https://android.myapp.com/myapp/detail.htm?apkName=com.duorong.smarttool` |
| Android 开发栈 | **Android 原生为主** (Kotlin/Java),可能有 Flutter 模块 | 包名 duorong 公司代号;需抓 apk 验证 |
| iOS 语言 | 未验证,推测 Swift + 部分 OC | 需抓 ipa 验证 |
| 共享后端 | 与 Web 端相同 (`api.weilaizhushou.com`) | Web bundle 直接引用 |
| 鸿蒙版本 | 不确定是否有原生 ArkTS | 需查应用市场 |

> ⚠️ 之前的初版文档假设移动端是 Flutter,是**错误的推测**。Web 端明确是 React + Electron 桌面端;移动端需要抓 APK 才能确认,此处不做推断。

---

## 六、产品策略洞察

1. **"一事 App 化" 战略**:把每一种提醒独立成业务模块(生日/纪念日/倒数/穿衣/生理期/喝水/吃药/读书/跑步/课程/账单/贷款/上班/起床/睡觉...),而不是统一成抽象事项,对小白用户的**心智门槛极低**。
2. **双品牌共用后端**:未来助手 + 时光序,用 `apptype` 区分,节省研发成本,体现产品迭代思路。
3. **记忆曲线**是差异化亮点,瞄准教育/学生用户。
4. **严格模式专注**瞄准自律人群,相比滴答清单/番茄 ToDo 更狠。
5. **会员变现点**: 桌面小部件、流量上限、(推测的)短信/电话提醒、数据导出。

---

## 七、给 AixApp 复刻的技术建议

如果要在 `E:/Desktop/Aix_ai/AixApp` 下实现一个类时光序 MVP,**建议架构**:

```
Web 端:        React 18 + TS + Ant Design v5 + Zustand (或 Redux Toolkit) + dayjs (替代 moment) + ECharts 5
编辑器:        TipTap (替代 TinyMCE v3) — v3 已过时,TipTap 基于 ProseMirror 更现代
桌面:         Electron 28 + electron-builder,通过 preload + contextBridge 暴露 API (比 ipcRenderer 直用更安全)
移动:         Flutter 3.x 一把梭 (Android + iOS + Desktop),或 React Native + Expo
后端:         Node.js (NestJS) 或 Go (gin),RESTful + WebSocket (Socket.IO / ws)
数据库:       PostgreSQL + Redis (缓存) + Meilisearch (全文搜索)
对象存储:      MinIO (自部署) 或 阿里云 OSS
推送:         极光/个推 + APNs + FCM
重复规则:     iCalendar RFC 5545 RRULE 标准,前后端共用解析库 (`rrule.js` 前端 / dateutil 后端)
```

**MVP 优先级** (2个月):
1. 账户 + 事项 (schedule + checkList + repeat + importance) + 日历视图
2. 提醒系统 (本地闹钟 + 服务端推送)
3. 桌面小组件 (Electron BrowserWindow 窗口 always-on-top)
4. 日记 + 标签 + 那年今日
5. 番茄钟 + 统计

**不要在 MVP 做的**: 贷款/账单/生理期/穿搭/课程表 这类"小而专"模块 — 等核心打磨好再迭代。

---

## 八、待核实 (后续可补充的工作)

- [ ] 抓 Android APK,反编译 `classes.dex` 确认是否用 Flutter / React Native / 原生
- [ ] 抓 iOS ipa,查 `Info.plist` 和 main 二进制的 Swift 特征
- [ ] 抓 Electron 桌面包 (`pc-sgx/latest/` 路径) 看 `app.asar` 内资源是否与 Web 端同源
- [ ] 抓一次真实 API 请求,观察鉴权头 (Authorization / X-Token) 和加密方式
- [ ] 观察微信小程序/鸿蒙版本是否存在、是否独立实现
- [ ] 会员价格体系最新数值 (Pro 月费/年费/终身)
- [ ] 2024-2026 的 AI 功能接入状态

---

## 九、原始证据文件 (本次调研产出)

| 文件 | 用途 |
|---|---|
| `title/raw/home.html` | 首页入口 HTML (6896 B) |
| `title/raw/main.js` | 业务代码 bundle (1.9 MB) |
| `title/raw/vendor.js` | 第三方依赖 bundle (1.7 MB) |
| `title/raw/all_apis.txt` | 172 条 `/base/*` API 去重列表 |
| `title/cn_strings.txt` | 927 条 UI 中文字符串,按出现次数降序 |
| `Aix_tools/decode_bundle_cn.py` | `\uXXXX` → 中文解码脚本 |
