### [2026-04-26] Read 工具不要给非 PDF 传空 pages
- **现象**：读取 TS/MD 文件时传入 `pages: ""` 会直接报 `Invalid pages parameter`。
- **原因**：Read 工具的 `pages` 只用于 PDF，空字符串也会被当成非法分页参数校验。
- **解决**：读取普通文件时省略 `pages` 字段；如果工具包装器强制需要该字段，传有效值如 `"1"`。
- **教训**：非 PDF 文件读取只传 `file_path/limit/offset`，不要复制带空 `pages` 的参数模板。

- **现象**：切到赛博朋克等深色主题后，小组件外壳变暗了，但设置面板和部分控件仍然是浅色/白色，视觉不统一。
- **原因**：之前只给悬浮窗外层换了主题色，没有让内部控件真正跟随主题；同时透明度滑块只保存值，没有作用到窗体本身。
- **解决**：把小组件主题抽到 `code/src/config/widgetThemes.ts`，增加“跟随全局主题”映射；设置面板改成自绘主题按钮组；透明度写入窗体样式。
- **教训**：做主题系统时不要只改容器背景，必须同时检查控件、弹层、空状态和透明度等所有子层是否一起联动。

### [2026-04-22] 目录式便携版如果没有标记文件会丢失可移植性
- **现象**：`win-unpacked` 目录本身可以运行，但数据会落到系统用户目录，不会跟着整个文件夹迁移。
- **原因**：Electron 目录版不会像 `portable.exe` 那样自动提供 `PORTABLE_EXECUTABLE_DIR`，主进程无法知道当前是便携模式。
- **解决**：在便携目录里生成 `AixSystems.portable` 标记，并在 `desktop/main.cjs` 中优先检测程序目录下的便携标记后再重定向 `userData/`。
- **教训**：只把安装包换成压缩包不等于真正便携，必须同时验证运行时数据路径是否也跟着程序目录走。

### [2026-04-22] 单文件 portable.exe 构建日志可能出现 rcedit fatal 但产物仍成功输出
- **现象**：执行 `npm run dist:portable-exe` 时日志里会出现一次 `Fatal error: Unable to commit changes`，看起来像构建失败。
- **原因**：`rcedit` 在写入可执行文件元信息时可能先失败并自动重试，electron-builder 后续仍能继续完成打包。
- **解决**：以最终退出码和 `desktop/dist-installer/AixSystems-*.portable.exe` 是否生成作为判断标准，而不是只看中途一条日志。
- **教训**：桌面打包链路要同时看过程日志和最终产物，必要时把“默认推荐路线”放到更稳定的目录式便携包上。

### [2026-04-22] 在 Vite 浏览器运行时代码里混用 require 会导致整页白屏
- **现象**：应用启动后一片空白，控制台报 `ReferenceError: require is not defined`。
- **原因**：`code/src/hooks/useVariants.ts` 在 React 浏览器运行时调用了 `require('antd')`，而生产态前端没有 CommonJS `require`。
- **解决**：改为顶部 `import { theme as antdTheme } from 'antd'`，运行时直接使用 `antdTheme.darkAlgorithm`。
- **教训**：Vite + React 前端运行时代码一律使用 ESM import，不能把 Node/CommonJS 写法混进浏览器路径。

### [2026-04-22] 界面显示版本号与实际打包版本可能脱节
- **现象**：安装包和 `package.json` 已经升到新版本，但侧栏“工作台版本”仍显示旧号，例如还停在 `v0.18.0`。
- **原因**：界面版本号来自 `code/src/config/constants.ts` 里的 `APP_VERSION` 常量，并不是自动读取 `package.json`。
- **解决**：发布前同步更新 `APP_VERSION`，并和 `code/package.json`、`desktop/package.json` 一起检查。
- **教训**：只改打包版本还不够，UI 里如果单独维护版本常量，也必须一起对齐，否则会误导验收和排错。
