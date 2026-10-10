# DSH 源码研读室

面向已有 Agent 基础的学习者，沿真实源码研究 DeepSeek Harness 的架构、机制与实现。共七节深度 HTML 课，每轮对话完成一节。

- [在线课程首页](https://han2233.github.io/dsh-course/)
- [在线阅读第一课](https://han2233.github.io/dsh-course/lessons/01/)
- [在线阅读第二课](https://han2233.github.io/dsh-course/lessons/02/)
- [在线阅读第三课](https://han2233.github.io/dsh-course/lessons/03/)
- [在线阅读第四课](https://han2233.github.io/dsh-course/lessons/04/)
- [在线阅读第五课](https://han2233.github.io/dsh-course/lessons/05/)
- [在线阅读第六课](https://han2233.github.io/dsh-course/lessons/06/)
- [在线阅读第七课](https://han2233.github.io/dsh-course/lessons/07/)
- [完整架构图](https://han2233.github.io/dsh-course/lessons/07/#architecture) · [下载 SVG](https://han2233.github.io/dsh-course/lessons/07/dsh-architecture.svg)
- [本地课程首页](index.html)
- [第一课：架构地图与启动组装](lessons/01/index.html)
- [课程约束](AGENTS.md)
- [固定版本的官方源码](https://github.com/deepseek-ai/deepseek-harness/tree/5badb15009ae1756c3afe0ae0cef1faafc290ccc)

本课程为非官方学习材料。源码基准为 `0.2.1-alpha.1`，提交 `5badb15009ae1756c3afe0ae0cef1faafc290ccc`。第一课核查日期为 2026-10-08。

## 第一课

深度中文讲解，涵盖源码地图、Profile / Bundle / Preset / Plugin 的职责、启动链路、配置覆盖、Preset 版本管理、完整任务轨迹、失败处理与设计取舍。

- 启动流程逐步演示，可比较 Web、Headless 与精简 SDK。
- 配置覆盖实验，可切换层序参与者、观察 config 替换与错误目标的行为。
- Preset 生命周期演示，观察旧版本保留、新版本绑定与引用释放。
- 35 个固定提交来源入口、9 处可展开源码摘录。
- 7 张机制图解采用多种形式：组装剖面、配置地层、字段差异对照、可点击版本时间轴、概念矩阵，以及启动与失败分支流程图。

课程偏好（2026-10-08）：不设置自测，以多种可视化和可操作演示帮助理解，避免统一使用流程图；已同步写入课程约束。

所有交互实验均为教学模拟，不连接真实模型或本机 dsh。

## 贯穿课程的 Agent 工作台

第一课新增三栏工作台：组装配置、教学系统记录 / 任务草稿、内部状态与源码。六步建立 Web 宿主与会话绑定，可比较 Standard / Minimal、模拟根 Include 加载失败、停止并释放、重置。所有状态仅保存在页面内存；没有模型请求、真实文件操作或 Shell 执行。

第一课快照使用 `assets/workbench01-model.js`、`assets/workbench01.js` 和 `assets/workbench01.css`。后续课程在各自快照中逐步增加能力，保留早期课次行为。

## 第二课

约七千中文字符，覆盖 Context / Runtime / Fiber 的边界、服务注入与 epoch、生命周期与失败、effect 所有权及清理顺序、作用域与 Realm、五种事件分发、HMR 的协调与回滚边界。提供多种静态图解、可短路的 waterfall 演示、10 处真实源码摘录和固定提交来源。

第二课工作台复用第一课的组装状态模型，新增教学插件的安装、依赖等待、服务接通与撤销、手动完成异步转换、重启、永久卸载、初始化失败和观察事件。教学插件不是完整 tool-fs；不调用模型或操作真实文件。

已验证：两个 Preset、重复重启无重复贡献、依赖恢复、清理期间依赖变化、初始化失败回滚、多个状态下的卸载与停止、源码摘录和页面引用。第一课工作台快照保持原行为。第二课已增加一键组装、状态引导按钮与禁用原因，并阻止清理未完成时重新安装；按钮事件连接使用 DOM 测试替身验证，不等于浏览器视觉验收。

## 第三课

源码核查日期 2026-10-09，沿用提交 `5badb15`。约七千中文字符、11 处源码摘录，解释 Inbox 接纳、Turn / Step / Attempt、提示词和工具组装、PreparedLlmCall、请求快照、流式结算、工具衔接、重试与取消。多种图解替代自测。

工作台保留前两课组装与插件操作，新增固定脚本模拟循环、followup / steer / inject、四种情境、逐步或自动播放、取消与 keepInbox、请求快照选择和事件观察。真实模型请求与文件操作始终为零；工具仅返回预设结果，第四课再扩展执行环境。减少动态效果偏好下使用单步推进。

第三课页面复用前两课独立模型，不修改旧快照行为。已检查完整四步任务、重试不重复输入、请求快照独立、取消前缀、队列语义、服务撤销、终态错误与上限、按钮事件连接。DOM 测试替身不等于浏览器视觉验收。

## 第四课

源码核查 2026-10-09～10，沿用固定提交。约八千中文字符、12 处逐行摘录，覆盖工具定义与投影、作用域、准入与审批、单调守卫、规范值与内容、文件观察版本、Shell 与协作取消、并发调度、沙箱、MCP 和 PTC。包含分层图、双通道图、版本卡片、并发时间轴及可切换的 Native / PTC 对照。

独立工作台保留前三课组装、插件与循环机制，新增页面内存中的 config.json、版本凭据、真实计算的虚拟读改查、审批卡、流水线轨迹与修改差异。可比较拒绝审批、只读、强制 guard、外部修改冲突和执行后 block。模型仍为固定脚本，不运行本机 Shell 或远程服务；文件变化仅存在页面内存。

已验证正常四步任务、单次审批等待与拒绝、策略/守卫/只读拒绝、过期版本与重新读取、后置拦截不回滚、执行前后取消、宿主停止/重置、模型重试与工具失效，以及界面按钮连接和高亮状态。采用 DOM 测试替身，未完成浏览器视觉验收。

## 第五课

源码核查 2026-10-10，沿用固定提交。约七千九百中文字符、12 处逐行摘录，解释追加事件日志、模型 Surface、请求证据、flush 与持久化、恢复与 Fork、指令与 Skills、结果修剪和摘要压缩。使用三层视图、序列对照、持久化时间轴、分支泳道、修剪条带与事务阶段图。

紧凑工作台默认前置能力就绪，保留完整 Agent 对话与虚拟读改查。按高亮引导依次体验保存、未保存消息、恢复、修剪、摘要提交和 Fork；可切换模型视图、事件日志、保存快照、教学请求与摘要候选，并比较父子分支。压缩保留原始对话；恢复不回滚虚拟文件。保存只存在页面内存，刷新即丢失；摘要是固定教学模板，不调用真实模型，不产生真实磁盘日志。

已验证保存与恢复、Surface 重放一致性、修剪幂等、原始对话与请求快照保留、摘要成功/失败/取消、父子日志独立、重置、推荐按钮、检查器、分支切换与专注模式事件连接。交互验证使用 DOM 测试替身，尚未完成浏览器视觉核验。

## 第六课

源码核查 2026-10-10，沿用固定提交。约六千六百中文字符、13 处逐行源码摘录、26 个固定提交来源，区分 Spawn / Fork 的上下文起点与一次性 / 可继续的生命周期，讲解 Activation 所有权、相邻通信、冷恢复、中断、后台 Job、Workflow 聚合、Goal 续跑与 Schedule 投递。

紧凑工作台复用前课虚拟读改查模型，新增父 Agent、Spawn 检查员与 Fork 复核员。保留各自完整对话、共享虚拟文件、收件箱与教学事件；可体验延迟领取、补充要求、激活收尾、冷恢复、中断和兄弟通信拒绝。独立对照实验展示 Goal 恢复后 disarmed、Job 取消后等待 done、Schedule 回执不等于模型执行。所有子 Agent、恢复与计时均为离散教学模拟，不调用真实模型或后台服务。

已验证完整引导、上下文差异、稳定身份、父子记录保留、队列领取与中断、越权消息拒绝、Goal 轮数上限、Job 收尾、Schedule 回执边界，以及全部按钮和检查器连接。使用 DOM 测试替身，未完成浏览器视觉核验。

## 第七课

源码核查 2026-10-10，沿用固定提交。约七千九百中文字符、14 处逐行摘录，讲解插件、工具、策略与能力提供方的扩展位置，输入/规范值/模型内容/呈现事实的契约，作用域与服务隔离、Preset 版本、Creator 只读检查、Bundle 与 Profile 安装、运行时观察和验证边界。

扩展工作台默认前六课案例已完成，保留父 Agent 完整历史。可挂载纯审计工具，对比两个 Agent 绑定 minimum=30 / 60 时的结果，并模拟挂载失败、守卫拒绝、输出类型错误、移除定义与引用释放。独立教学模型执行纯数值判断，没有安装真实插件。附 `timeout-audit.ts` 教学示例；已按固定快照核对 API，未编译或执行该 TypeScript 文件。

课程末尾提供以框架职责与协作为主线的架构图：中心为请求组装、Agent 驱动、工具运行时和会话事实；外围连接宿主、模型、执行环境与任务编排；底部展示 Cordis、作用域、策略和运行支持。17 个职责节点支持聚焦高亮、实现依据跳转、展开、手机列表与 SVG 下载。布局不按课程或源码目录分层，区分调用、数据关系、可选接入和横向基础。

已验证完整工作台引导、领域结果与工具错误区分、失败重试、作用域版本、旧绑定保留、引用清理、完整历史，以及图中 17 个职责节点的选择、键盘事件、子系统高亮和展开。SVG 的 XML 与来源链接有效。交互通过 DOM 测试替身检查；真实浏览器视觉核验未完成。

## 课程进度

| 课次 | 主题 | 状态 |
|---|---|---|
| 01 | 架构地图与启动组装 | 已制作 |
| 02 | Cordis 插件内核 | 已制作 |
| 03 | Agent 运行循环与模型请求 | 已制作 |
| 04 | 工具系统与执行环境 | 已制作 |
| 05 | 会话、上下文与长对话 | 已制作 |
| 06 | 子 Agent 与持续任务编排 | 已制作 |
| 07 | 扩展与综合串联 | 已制作 |

## 文件与本地阅读

纯静态 HTML、CSS 和 JavaScript，不需要安装前端依赖。直接打开 `index.html`，或在本目录运行：

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

页面使用相对资源路径，适用于 GitHub Pages 项目站点。`.nojekyll` 使页面按静态资源发布。

## 源码与验证

`lessons/01/sources.json` 记录来源与版本；`THIRD_PARTY_NOTICES.md` 保留引用源码的许可。

在本仓库同级放置固定提交的 `deepseek-harness` 源码后，可重新生成并核验引用：

```sh
python3 scripts/prepare_sources.py ../deepseek-harness
python3 scripts/prepare_lesson02.py
python3 scripts/prepare_lesson03.py
python3 scripts/check_lesson.py
python3 scripts/check_sources02.py
python3 scripts/check_sources03.py
python3 scripts/prepare_lesson04.py
python3 scripts/check_sources04.py
python3 scripts/prepare_lesson05.py
python3 scripts/check_sources05.py
python3 scripts/prepare_lesson06.py
python3 scripts/check_sources06.py
python3 scripts/prepare_lesson07.py
python3 scripts/check_sources07.py
node scripts/check_models.cjs
node scripts/check_workbench.cjs
node scripts/check_lesson02.cjs
node scripts/check_controls02.cjs
node scripts/check_lesson03.cjs
node scripts/check_controls03.cjs
node scripts/check_lesson04.cjs
node scripts/check_controls04.cjs
node scripts/check_lesson05.cjs
node scripts/check_controls05.cjs
node scripts/check_lesson06.cjs
node scripts/check_controls06.cjs
node scripts/check_lesson07.cjs
node scripts/check_controls07.cjs
```

检查覆盖本地资源和锚点、HTML 结构、源码区域行号、逐行摘录一致性、脚本语法、界面元素引用，以及配置覆盖的 16 种组合和 Preset 演示的关键生命周期。上述检查不等于运行 dsh 的测试套件。

当前浏览器视觉验收未完成：浏览器安全检查不可用，随后自动审批拒绝了重试。页面已做静态与逻辑检查；实际桌面及手机显示效果仍待浏览器验收。

## 发布位置

仓库：[Han2233/dsh-course](https://github.com/Han2233/dsh-course)。GitHub Pages 从 `main` 分支根目录发布，更新该分支会触发网站更新。后续课次在 `lessons/` 下增加独立目录，并更新首页和进度。

- 交互引导：前三课工作台以高亮边框和“建议下一步”标签标出当前推荐操作；第三课贯穿插件准备、发送和模型循环，自动播放时暂停手动推荐。

## 工作台界面调整（2026-10-10）

第四课改为只突出本课工具执行的紧凑工作台。宿主、插件和模型循环默认就绪，模型步骤自动衔接到工具边界；主界面保留任务、虚拟文件、检查器与固定操作区。长日志、修改差异、请求与历史通过检查器切换，支持专注模式和小屏区域切换。可在保留文件状态时再次运行任务，或重置整个实验。前几课独立快照保持原样；后续课程采用相同的聚焦原则，不重复展示前课控制面板。

新版按钮连接、准入分支、文件冲突、检查器和高亮通过 DOM 测试替身验证；未完成真实浏览器视觉核验，不据此保证所有窗口尺寸均无需滚动。

第四课恢复持续对话区，展示用户任务、Agent 回复、工具调用和已提交结果；输入区固定在对话底部，对话内部滚动，保留紧凑高度与专注模式。后续每课保留统一对话界面。

七节已发布课程开头均加入显著实验室体验卡，提供各课操作介绍与直接跳转按钮；支持手机布局和键盘焦点。内容与工作台逻辑保留。后续课程沿用此入口规范。
