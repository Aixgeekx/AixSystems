# openclaw 学习笔记：AixSystems 黑科技全能系统路线

> 日期：2026-04-25  
> 目标：学习 `https://github.com/openclaw`，结合 AixSystems 现有知识库、时光序功能画像、Claude Code / cc-switch / deep-dive-claude-code 学习结果，以及用户要求“黑科技全能系统、个人成长和控制”。

## 1. openclaw 可学习的核心定位

openclaw 的公开定位是个人开源 AI 助手，强调跨系统、跨平台、个人可控和技能生态。它不是单一聊天框，而更像一套由 AI 助手、技能目录、命令行客户端、工作流引擎、平台伴随组件组成的 Agent 系统。

对 AixSystems 的启发：Aix 不应该只是“调用一个模型接口”，而应该成为软件内置核心 AI 品牌与能力中枢。用户提供 API 与 Key 后，Aix 应把个人成长、时间管理、电脑控制、Provider 调度和自动化工作流统一起来，形成比普通助手更强的本地控制系统。

## 2. openclaw 能力拆解

| openclaw 方向 | 学到的设计思想 | AixSystems 对应落点 |
|---|---|---|
| personal AI assistant | AI 是产品入口，不只是附属功能 | Aix 作为主功能和软件特色之一，提供独立入口 |
| Any OS / Any Platform | 跨系统、跨端、跨入口 | Windows 桌面优先，后续手机版/PWA/macOS/Linux |
| clawhub / skills | 技能目录、技能版本归档、可发现能力生态 | Aix 技能库：成长技能、电脑技能、数据技能、复盘技能 |
| acpx / headless CLI | 有状态 Agent 会话，可由 CLI/后台驱动 | Aix Agent 任务可恢复、可分支、可后台执行 |
| lobster workflow shell | 本地优先、类型化、工具/技能管道化 | Aix 工作流引擎：只调用白名单工具，不执行任意危险命令 |
| Windows companion | 托盘、命令面板、系统集成 | 超级管理器、PowerShell 预设、托盘快捷操作 |
| local-first macro engine | 自动化本地优先，强调可组合 | 本地 IndexedDB + Electron IPC + 受控 PowerShell |

## 3. 与时光序知识库的结合

AixSystems 原始功能画像来自时光序：事项、日程、清单、提醒、日记、备忘、专注、主题、桌面小组件等。时光序偏“时间管理工具”，openclaw 偏“AI Agent 平台”。AixSystems 的路线应融合两者：

1. **保留时光序式时间管理底座**：事项、提醒、复习、专注、日记、习惯、目标仍是用户数据和行动入口。
2. **引入 openclaw 式 Agent 能力层**：Aix 读取这些本地数据后，生成策略、任务分支、复盘和自动化工作流。
3. **把工具变成技能**：原来的页面功能可以升级为 Aix 技能，例如“目标推进技能”“复习削峰技能”“电脑自启扫描技能”。
4. **把提醒变成执行队列**：现有 reminderQueue 和 eventLog 可继续扩展为 Agent 队列、恢复点和权限日志。
5. **把桌面小组件升级成系统伴随层**：参考 Windows companion，后续可做托盘、命令面板、快捷键、PowerShell 白名单。

## 4. 与 Claude Code / cc-switch 学习结果的结合

此前已经学习到：Claude Code 强在 Agent 循环、工具系统、权限控制、上下文恢复；cc-switch 强在 Provider 管理、原子配置、备份回退、健康检查。openclaw 补充了技能生态与本地工作流管道。

综合后，AixSystems 的 AI 架构可以分成六层：

1. **Aix Core**：内置 AI 名称、主入口、模型调用、系统提示词、策略生成。
2. **Provider Layer**：用户 API / Key、Provider 预设、健康检查、故障转移、策略历史。
3. **Skill Layer**：成长、复习、专注、日记、电脑管理、数据备份等技能注册与版本记录。
4. **Tool Layer**：Electron IPC、PowerShell 只读预设、IndexedDB 查询、导入导出、通知、未来 MCP。
5. **Permission Layer**：只读 / 需确认 / 高风险禁止；所有电脑控制必须确认、备份、回滚。
6. **Session Layer**：Agent 任务分支、暂停恢复、事件日志、上下文压缩、长期记忆。

## 5. Aix 内置 AI 的产品定位

用户明确要求：Aix 是软件内置 AI，需要用户提供 API、Key，并且是主要功能和软件特色之一。因此后续文案和 UI 应避免把 Aix 写成“可选小工具”，而应写成产品核心。

建议定位语：

> Aix 是 AixSystems 内置的个人成长与电脑控制 AI 中枢。用户接入自己的 API 与 Key 后，Aix 能读取本地时间管理数据、生成成长策略、调度 Provider、调用安全工具，并在确认后协助管理电脑。

关键原则：

- **用户自带模型能力**：API / Key 由用户提供，仅本地保存。
- **Aix 是品牌，不是泛称 AI**：页面、按钮、文档优先使用 Aix。
- **本地优先**：用户数据在 IndexedDB / 本机，不默认上传。
- **工具受控**：Aix 调用 PowerShell、电脑控制、文件操作必须走白名单和确认。
- **比普通助手强**：不止聊天，还能计划、复盘、执行、恢复、审计。

## 6. 对当前 v0.31.0 的承接

v0.31.0 已完成三项基础：

1. 超级管理器三期：自启、临时目录、端口只读扫描。
2. Aix Provider：健康检查、延迟记录、故障转移。
3. Aix Agent 中枢：任务分支、权限确认、恢复日志。

这些正好对应 openclaw 的三条路线：平台伴随组件、Provider/Agent 会话、技能/工作流中枢。下一步应从“功能雏形”进入“Aix 主入口 + 技能生态 + 安全工作流”。

## 7. 下一轮可落地的大功能候选

### 大功能 1：Aix 主入口页面

新增独立 Aix 页面，作为软件核心特色入口：

- API / Key / Provider 当前状态
- Aix 对话输入框
- 本地数据摘要：今日事项、习惯、目标、复习、专注
- 一键生成：今日控制计划、电脑健康建议、晚间复盘
- 展示 Aix 当前可用技能

### 大功能 2：Aix 技能库 / Skill Registry

参考 clawhub / skills：

- 内置技能列表：成长控制、复习削峰、目标推进、专注策略、电脑扫描、备份建议
- 每个技能有名称、风险等级、输入数据、输出动作、版本号
- 支持启用/禁用、执行记录、最近结果
- 技能调用只走本地白名单工具

### 大功能 3：PowerShell 白名单工作流

参考 lobster workflow shell：

- 只允许预设命令，不允许任意命令输入
- 每个预设标注风险：只读 / 需确认 / 禁止
- 执行前展示命令摘要和影响范围
- 执行后写 eventLog，支持导出审计
- 后续再加备份和回滚计划

### 大功能 4：Aix 本地代理中心

结合 cc-switch 与 openclaw 的 Agent 会话思想：

- 支持 OpenAI-compatible / Claude / Ollama 等 Provider 配置
- 自动探活和失败切换
- 模型能力标签：长上下文、工具调用、视觉、低延迟
- 策略历史：某次建议由哪个 Provider 生成
- 为未来本地代理服务做准备

## 8. 安全边界

AixSystems 的“黑科技全能系统”必须强，但不能失控：

- 默认只读扫描。
- 不做破坏性系统修改。
- 不开放任意 PowerShell 命令直通。
- 不自动删除文件、不自动改注册表、不自动结束进程。
- 高风险动作必须分三段：确认、备份、回滚。
- 所有 Agent 和电脑控制动作写入 eventLog。

## 9. 结论

openclaw 的关键价值不在某一个页面，而在“个人 AI 助手 + 技能生态 + 有状态 Agent + 本地工作流 + 跨平台伴随组件”的组合。AixSystems 应继续以时光序的时间管理数据为地基，以 Claude Code 的 Agent/工具/权限思想为骨架，以 cc-switch 的 Provider 管理为模型层，以 openclaw 的技能生态和 workflow shell 为扩展层，最终形成 Aix 这个内置 AI 驱动的黑科技全能系统。
