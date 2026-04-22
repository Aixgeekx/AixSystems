# AixSystems · 时间管理系统

> 离线本地时间管理系统,数据全部本地 IndexedDB 存储,零服务器依赖。支持浏览器和 Electron 桌面两种运行方式。

## 快速开始

```bash
cd code
npm install      # 安装依赖
npm run dev      # 启动开发服务器 http://127.0.0.1:5173
# 或
npm run build && npm run preview     # 打包后预览
```

浏览器打开后自动进入「我的一天」。首次使用点击右上角「添加事项」创建第一条记录,浏览器会询问通知权限,允许后即可在到期时收到桌面提醒。

## 数据备份

**数据存在 IndexedDB** — 清除浏览器数据会全部丢失。请定期:

左侧菜单 → 设置 → 导入导出 → 下载备份 JSON

恢复时同一页面上传 JSON 即可。桌面版则直接写入 `data/` 目录。

## 功能总览

| 类别 | 已实现 |
|---|---|
| 视图 | 我的一天 / 一周 / 一月 / 一年 |
| 事项 | 全部 / 日程 / 清单 / 四象限(拖拽) / 重复 |
| 事项类型 | 17 种: 日程/清单/生日/纪念日/倒数日/节日/生理期/信用卡/贷款/吃药/起床/睡眠/作息/跑步/读书/穿衣/课程/上班 |
| 重复规则 | 每天/周/月/年 + 工作日 + 自定义间隔 + 周几 + 记忆曲线 |
| 提醒 | 最多 5 个,浏览器 Notification + AntD Notification |
| 专注 | 倒计时 / 正计时 / 番茄钟,严格模式,ECharts 统计 |
| 日记 | TipTap 富文本 + 心情 + 置顶 + 加密 + 那年今日 |
| 备忘录 | 富文本 + 文件夹 + 置顶 + 回收站 |
| 主题 | 17 款内置壁纸 + 亮度 / 模糊调节 |
| 应用锁 | PBKDF2 + AES-GCM 密码保护 |
| 桌面小部件 | 浮动小窗,三样式 + 透明度调节 |
| 搜索 | 跨事项 / 日记 / 备忘录 |
| 导入导出 | JSON 全量备份 (桌面版直写磁盘) |

## 技术栈

Vite 5 + React 18 + TypeScript 5.6 + Ant Design 5 + Dexie (IndexedDB) + Zustand + dayjs + lunar-javascript + rrule + ECharts + TipTap 3 + Electron 31。

## 目录

见 `../Aix_tools/readme.md` 和 `../results/使用说明.md`。

## License

MIT
