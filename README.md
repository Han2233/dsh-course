# DSH 源码研读室

面向已有 Agent 基础的学习者，沿真实源码研究 DeepSeek Harness 的架构、机制与实现。共七节深度 HTML 课，每轮对话完成一节。

- [在线课程首页](https://han2233.github.io/dsh-course/)
- [在线阅读第一课](https://han2233.github.io/dsh-course/lessons/01/)
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

## 课程进度

| 课次 | 主题 | 状态 |
|---|---|---|
| 01 | 架构地图与启动组装 | 已制作 |
| 02 | Cordis 插件内核 | 待制作 |
| 03 | Agent 运行循环与模型请求 | 待制作 |
| 04 | 工具系统与执行环境 | 待制作 |
| 05 | 会话、上下文与长对话 | 待制作 |
| 06 | 子 Agent 与持续任务编排 | 待制作 |
| 07 | 扩展与综合串联 | 待制作 |

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
python3 scripts/check_lesson.py
node scripts/check_models.cjs
```

检查覆盖本地资源和锚点、HTML 结构、源码区域行号、逐行摘录一致性、脚本语法、界面元素引用，以及配置覆盖的 16 种组合和 Preset 演示的关键生命周期。上述检查不等于运行 dsh 的测试套件。

当前浏览器视觉验收未完成：浏览器安全检查不可用，随后自动审批拒绝了重试。页面已做静态与逻辑检查；实际桌面及手机显示效果仍待浏览器验收。

## 发布位置

仓库：[Han2233/dsh-course](https://github.com/Han2233/dsh-course)。GitHub Pages 从 `main` 分支根目录发布，更新该分支会触发网站更新。后续课次在 `lessons/` 下增加独立目录，并更新首页和进度。
