# -*- coding: utf-8 -*-
"""One canonical component map for the inline diagram and downloadable SVG."""
import html
NODES=[
('boot','Profile / Bundle / Patch','组装入口与有序配置层','boot','01','boot','CLI 读取 Profile 的 Bundle 与逐层 patch；配置层决定启用的插件树。'),
('kernel','Cordis / Loader / Scope','服务、事件、依赖、可逆副作用','cordis','02','boot','Cordis 提供生命周期与依赖；Scope 为贡献绑定可见性与所有权。它不是安全沙箱。'),
('preset','Agent Preset Registry','定义 → 版本 → Agent 绑定','preset-bind','01 · 07','boot','Preset 挂载作用域化组合；在线 Agent 保留具体版本，退休版本引用归零后清理。'),
('creator','Creator / Plugin Manager','只读发现接口 / 持久 Profile 修改','creator','07','boot','Creator 查询运行时接口；Plugin Manager 管理 Bundle 与配置应用，两者权限和职责不同。'),
('carriers','Web / CLI / SDK / ACP','用户输入与产品载体','architecture','01','turn','不同宿主载体调用运行服务，Web 还通过 API 与 Client renderer 展示历史和实时增量；不是多条独立 Agent 内核。'),
('inbox','Controller / Agent Inbox','接纳、排队、steer、注入','flow','03','turn orchestration','控制层取得 Agent，输入进入同一个 Inbox；inject 停放上下文，本身不唤醒空闲 Agent。'),
('loop','Agent / AgentLoop','Turn → Step → Attempt','flow','03','turn boot','Agent 是接口与注册身份；默认 AgentLoop 驱动请求、工具衔接、重试与取消。'),
('model','Prompt / LLM / Adapter','组装 → Prepared Call → 流式响应','flow','03','turn','Prompt 合成可见贡献与工具 schema，LLM seam 绑定适配器和请求能力，再处理流式结果。外部模型服务位于适配器之后。'),
('session','Session Event Log','不可变事实 / 模型 Surface','append','05','turn state','日志保存用户、助手、请求与工具事实；Surface 派生模型消息，不能等同于 UI 完整对话。'),
('projection','Projection / Client Views','重放派生状态与界面视图','architecture','05','state','Session projection 折叠事件为状态；Client 按公开事实渲染，实时流是另一条非持久增量路径。'),
('tools','ToolRuntime / Registry','准入 → 守卫 → 执行 → 后置策略','register','04 · 07','turn','可见 schema 来自作用域注册；执行有独立的权限与结果流水线，规范值和模型内容分别处理。'),
('execution','FS / Shell / Subprocess','提供方决定实际执行环境','seams','04','turn','工具消费者调用能力提供方。文件、进程与沙箱形成执行环境；并非所有工具都会触及磁盘或 Shell。'),
('persistence','Persistence / Checkpoint','JSONL · flush · restore / fork','jsonl-append','05','state','内存 append 与持久检查点不同；恢复重建会话，不回滚外部文件。后端可替换。'),
('compaction','Compaction / Result Pruner','追加替换事实，缩短模型视图','compact-transaction','05','state','摘要与修剪改变模型可见 Surface，保留原始历史；事务失败不能冒充成功提交。'),
('mcp','MCP Consumer / Connection','远端工具 schema 与调用','seams','04','turn','MCP 连接外部工具服务，仍需明确工具注册、准入与宿主连接生命周期。图示不代表远端自动可信。'),
('ptc','Code / PTC Transport','程序调用重新进入工具流水线','contract','04','turn','模型可写程序编排工具；调用得到规范值，重新通过 ToolRuntime，不绕过守卫与权限。'),
('subagent','Subagent Providers','Spawn / Fork / Activation','continuation','06','orchestration','工具触发委派；新会话或继承前缀，继续执行管理器负责相邻消息、冷恢复与所有权。'),
('jobs','Jobs Runtime','后台句柄 / 输出 / cancel / done','jobs','06','orchestration','一次性后台工作交给 Job 管理；jobs-local 是进程内记录，停止请求不等于 done 收敛。'),
('workflow','Workflow Engine','脚本并行与子级结果聚合','workflow-host','06','orchestration','Workflow 的 agent hook 调用 Subagent seam；调用者持有 run 并等待清理，当前引擎不保存运行现场。'),
('goal','Goal + Round Driver','同会话目标 / 版本 / 续跑授权','goal-drive','06','orchestration state','Goal 保存目标；独立 Driver 检查授权与轮数，再将后续轮次放入 Inbox。'),
('schedule','Schedule Host','到时向原 Session followup','schedule','06','orchestration','持久规则到时取得原会话并投递消息，flush 后保存回执；回执不保证模型任务完成。'),
('context','Instructions / Skills','上下文贡献与按需加载','instructions','05','state turn','指令与 Skills 影响提示词或模型可见消息；完整内容、加载时机与持久证据各有契约。'),
('policy','Approval / Guard / Sandbox','交互批准 / 单调拒绝 / 执行边界','guard','04','turn','三层约束负责不同问题。作用域可见不等于获准，审批也不代替进程隔离。'),
('observe','Inspect / Inventory / Events','只读诊断与状态观察','inventory','07','boot state','检查当前接口、Loader phase、组合与日志事实，不把观察工具误作运行时修改入口。'),
]
ROWS=['01  启动与组装 · 配置决定插件树','02  交互与运行 · 核心请求循环','03  事实与执行 · 记录、呈现、调用','04  历史与工具扩展 · 可选能力','05  持续任务编排 · 工具 / Inbox 接入','06  时间、上下文与横切机制 · 按组合启用']
def build(sources,download=False):
 esc=html.escape
 parts=['<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1440" viewBox="0 0 1280 1440" role="group" aria-labelledby="architecture-title architecture-desc">','<title id="architecture-title">DeepSeek Harness 完整核心架构图</title>','<desc id="architecture-desc">六层二十四个组件组。箭头标明主要调用或事实流；编排组件通过节点注明的工具或 Inbox 接回运行层。图省略可选包的全部连线，详解在图下方。</desc>', '<defs><marker id="arch-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#638574"/></marker></defs>', '<rect width="1280" height="1440" rx="18" fill="#f7f6ef"/>','<text x="30" y="37" fill="#173f32" font-size="22" font-family="sans-serif" font-weight="700">DSH · 7 课核心架构总览</text>','<text x="30" y="61" fill="#566b61" font-size="12" font-family="sans-serif">0.2.1-alpha.1 / 5badb15 · 主路径箭头；编排回接位置见节点与图下说明 · 可选能力不一定启用</text>']
 def edge(path,label,x,y,dashed=False):
  parts.append(f'<path d="{path}" fill="none" stroke="#638574" stroke-width="2"'+(' stroke-dasharray="6 4"' if dashed else '')+' marker-end="url(#arch-arrow)"/>')
  if label:parts.append(f'<text x="{x}" y="{y}" fill="#566b61" font-size="11" font-family="sans-serif">{label}</text>')
 # Each row has a header, cards and a spacious routing lane.
 for row,title in enumerate(ROWS):
  y=100+row*215;parts.append(f'<text x="30" y="{y}" fill="#6b796d" font-size="13" font-family="sans-serif">{title}</text>')
 edge('M310 166 H340','',0,0);edge('M620 166 H650','',0,0)
 edge('M1095 117 V78 H170 V117','Profile 修改 / 下次组合',650,76,True)
 edge('M790 215 V332','绑定',800,270,True)
 edge('M310 381 H340','',0,0);edge('M620 381 H650','',0,0);edge('M930 365 H960','请求',934,350)
 edge('M960 402 H930','响应',933,421)
 edge('M790 430 V547','调用工具',800,486)
 edge('M680 430 V470 H170 V547','追加运行事实',300,463)
 edge('M310 596 H340','',0,0);edge('M930 596 H960','执行',934,580)
 edge('M170 645 V762','flush / 恢复',181,710)
 edge('M480 762 V694 H170 V645','Surface 替换',290,687,True)
 edge('M790 645 V762','MCP 工具',800,710,True)
 edge('M1100 762 V697 H850 V645','PTC 重入',966,688,True)
 edge('M790 1075 V1110 H170 V1075','启动子 Agent',403,1101)
 for i,(key,title,sub,source,lesson,paths,detail) in enumerate(NODES):
  col=i%4;row=i//4;x=30+col*310;y=117+row*215
  fill=['#e5eedf','#dfebe5','#e8e9f2','#f3e9d4','#e5edf1','#ede8df'][row]
  opening=f'<a href="{esc(sources[source]["url"],quote=True)}" target="_blank">' if download else f'<g class="arch-node" data-node="{key}" data-paths="{paths}" role="button" tabindex="0" aria-label="{esc(title)}：查看职责">'
  parts.extend([opening,f'<rect x="{x}" y="{y}" width="280" height="98" rx="12" fill="{fill}" stroke="#9fb4a7"/>',f'<text x="{x+14}" y="{y+26}" font-family="sans-serif" font-size="15" font-weight="700" fill="#173f32">{esc(title)}</text>',f'<text x="{x+14}" y="{y+50}" font-family="sans-serif" font-size="12" fill="#4a6255">{esc(sub)}</text>',f'<text x="{x+14}" y="{y+78}" font-family="sans-serif" font-size="11" fill="#61786a">课程 {lesson} · '+('打开源码 ↗' if download else '点击查看职责与源码')+'</text>', '</a>' if download else '</g>'])
 parts.extend(['<text x="30" y="1412" fill="#566b61" font-family="sans-serif" font-size="12">实线：主要请求 / 结果 / 事实流。虚线：配置、绑定或投影 / 可选调用。Cordis 与策略约束跨层生效。</text>','</svg>'])
 return ''.join(parts)
