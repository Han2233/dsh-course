# -*- coding: utf-8 -*-
"""Framework responsibilities and collaboration; paths are evidence, not layout."""
import html
SHA='5badb15009ae1756c3afe0ae0cef1faafc290ccc'
BASE=f'https://github.com/deepseek-ai/deepseek-harness/blob/{SHA}/'
# key, title, subtitle, source, filter, responsibility; positions are independent of repository layout.
NODES=[
('host','产品宿主与接入','Web / Desktop · Headless · SDK / ACP','docs/architecture.zh.md','product','宿主接纳用户或程序输入，调用 Agent 接口；Web 经 RPC 与会话跟随服务显示持久状态和实时流。桌面复用 Web 应用与共享启动器，SDK 通过进程外协议驱动运行时。'),
('assembly','运行时组装','Profile → Bundle / Patch → 插件树','packages/boot/app-boot/README.zh.md','assembly','Profile 与有序配置层决定插件树；Preset 为具体 Agent 选择贡献并绑定版本。图中所有运行能力都由组合启用，不保证任意 Profile 都具有图中全部功能。'),
('context','上下文贡献','Instructions · Skills · 运行时上下文','docs/subsystems/system-prompt.zh.md','runtime','指令、技能和上下文插件向系统提示或会话贡献内容。提示词组装器读取可见贡献与工具 schema；模型可见输入要有可重建的会话依据。'),
('prompt','请求组装','SystemPrompt · 工具 schema','packages/core/system-prompt/README.zh.md','runtime','组装提示片段与当前作用域可见工具 schema。AgentLoop 在 prepareCall 确定实际路由后协调系统消息、已接纳输入与会话 Surface，再冻结模型请求。'),
('agent','Agent 与默认驱动器','Inbox · Turn / Step · 取消 / 重试','packages/core/agent-loop/README.zh.md','runtime','Agent 接口提供活跃身份和消息入口，默认 AgentLoop 驱动轮次、步骤、模型请求与工具衔接。默认循环自身也是可替换插件，并非其他能力必须导入的特权内核。'),
('model','模型接入','LLM seam → Adapter → 外部模型','docs/subsystems/llm-streaming.zh.md','capability','LLM 服务定义请求与流式词汇，适配器准备并绑定调用、连接实际模型服务。模型返回文本与工具调用；工具执行由框架完成，不能把适配器与 AgentLoop 混为一体。'),
('orchestration','任务编排与触发','Subagent · Workflow · Goal / Schedule','docs/subsystems/subagent.zh.md','capability','Subagent 创建或继续子会话；Workflow 通过 Subagent 接口组织工作，Goal Driver 与 Schedule 投递后续输入，Webhook 可经可信规则创建会话。它们按各自接口接回 Agent；并非每轮必经步骤。Job 管理后台工作句柄和完成收敛。'),
('session','会话事实与模型视图','SessionEvent Log → Surface','packages/core/session/README.zh.md','state','仅追加日志承载输入、请求、助手与工具的持久事实。deriveMessages 从日志派生模型历史；它不是 UI 全部内容，也不等于磁盘已经完成 flush。循环的事实写入会话，后续请求从会话重建上下文。'),
('tools','工具运行时','Registry · Guard · Execute · Result','packages/core/tools/README.zh.md','runtime capability','按作用域注册工具并提供 schema；调用通过准入、执行及后置策略。规范值与面向模型的内容分开处理，结果由循环衔接进会话与下一次模型请求。'),
('environment','可替换能力与执行环境','FS · Shell / PTY · LSP · Browser 等','docs/capability-seams.zh.md','capability','工具消费者依赖能力的 Service Definition，Service Provider 实现文件、进程、终端、浏览器、计算机操作等能力。文件系统与进程提供方应处于一致的执行世界；本地、SSH 等后端改变实际执行位置。沙箱在相应进程执行边界生效。'),
('mcp','外部工具与程序编排','MCP 接入 · Code / PTC 调用','docs/subsystems/tools.zh.md','capability','MCP 消费方连接外部工具服务；Code / PTC 允许程序组合工具调用，调用仍进入工具运行时。两者均是可选接入方式，不能从图中推断所有工具必经 MCP 或 PTC。'),
('persistence','会话存储与恢复','Persistence · Checkpoint · Restore / Fork','docs/subsystems/session.zh.md','state','持久化提供方负责日志存储、检查点和重新打开。恢复与 Fork 重建会话，不回滚外部环境。压缩、修剪以受约束的事实与投影改变模型视图，原始历史与当前模型输入需要分开理解。'),
('projection','状态投影与呈现','Projection → API / Client Views','docs/architecture.zh.md','state product','Projection 从已提交会话事件折叠派生状态，宿主和客户端读取对应视图。实时 assistant stream 通过独立的 Session-follow 路径传递；实时 chunk 不等于已持久化事实。'),
('kernel','Cordis 插件基础','Context · Service · 依赖 · 生命周期','docs/cordis-primer.zh.md','foundation','共享 Context 承载服务、类型化事件与可逆副作用；依赖就绪后挂载，卸载时撤销贡献。模型、工具、会话和循环都作为插件组合。基础带表示跨子系统支撑，不是一道请求处理步骤。'),
('scope','作用域与 Agent 组合','Scope · Preset · 注册所有权','docs/subsystems/scope.zh.md','foundation assembly','Scope 管理贡献可见性与所有权，Preset 挂载 Agent 的作用域化组合并保持版本引用。Scope 不是安全沙箱；卸载定义也不意味着仍被 Agent 引用的版本立即销毁。'),
('policy','交互与执行策略','Approval · Guard · Sandbox','docs/tool-execution-pipeline.zh.md','foundation capability','交互批准、工具守卫和进程沙箱分别在各自边界生效。可见 schema 不等于获准执行；工具层许可不代替提供方的执行隔离。事件监听可挂接策略，不能画成唯一的全局安全开关。'),
('support','运行支持与可观察性','Settings · Credentials · Telemetry','packages/README.zh.md','foundation','设置、凭据、工作区、共享存储、身份和遥测等服务支撑宿主与能力提供方。Inspect / Inventory 观察接口与插件状态；Plugin Manager 负责持久组合变更。这些机制不要求每次模型请求串行经过。'),
]
NODES=[(k,t,s,BASE+p,f,d) for k,t,s,p,f,d in NODES]
POSITIONS={
'host':(30,100,580),'assembly':(650,100,600),
'context':(30,315,270),'prompt':(350,315,270),'agent':(650,315,270),'model':(970,315,280),
'orchestration':(30,515,270),'session':(350,515,270),'tools':(650,515,270),'environment':(970,515,280),
'mcp':(30,755,270),'persistence':(350,755,270),'projection':(650,755,270),
'kernel':(30,1050,285),'scope':(340,1050,285),'policy':(650,1050,285),'support':(960,1050,290)}
def build(sources=None,download=False):
 esc=html.escape
 parts=['<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1280" viewBox="0 0 1280 1280" role="group" aria-labelledby="architecture-title architecture-desc">','<title id="architecture-title">DeepSeek Harness 框架架构：插件基础、Agent 运行时与可替换能力</title>','<desc id="architecture-desc">中心是请求组装、Agent 驱动、工具运行时和会话事实；外围是宿主、组装、模型、执行能力及任务编排；底部是跨子系统的插件、作用域和策略支持。箭头注明主要协作，虚线表示可选接入。位置不表示源码目录或课次。</desc>','<defs><marker id="arch-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" fill="#567666"/></marker></defs>','<rect width="1280" height="1280" rx="18" fill="#f7f6ef"/>','<text x="30" y="38" fill="#173f32" font-size="23" font-family="sans-serif" font-weight="700">DeepSeek Harness · 框架结构与协作</text>','<text x="30" y="64" fill="#566b61" font-size="13" font-family="sans-serif">0.2.1-alpha.1 / 5badb15 · 中心运行时 + 可替换能力 + 横向插件基础 · 全部按配置组合</text>',
'<rect x="330" y="265" width="610" height="402" rx="18" fill="#e5eeea" stroke="#7f9e8e" stroke-width="2"/>','<text x="350" y="295" fill="#173f32" font-size="17" font-family="sans-serif" font-weight="700">Agent 运行时 · 四项协作职责，均可通过插件扩展</text>',
'<rect x="20" y="989" width="1240" height="200" rx="16" fill="#ede8f2" stroke="#b7aec2"/>','<text x="38" y="1024" fill="#443751" font-size="17" font-family="sans-serif" font-weight="700">横向基础 · 为上方各子系统提供组合、所有权与扩展点</text>']
 def edge(path,label,x,y,dash=False):
  parts.append(f'<path d="{path}" fill="none" stroke="#567666" stroke-width="1.8"'+(' stroke-dasharray="6 5"' if dash else '')+' marker-end="url(#arch-arrow)"/>')
  if label:parts.append(f'<text x="{x}" y="{y}" fill="#405d4d" font-size="12" font-family="sans-serif">{label}</text>')
 edge('M320 196 V235 H785 V315','输入 / Agent 接口',445,229)
 edge('M950 196 V250 H940','挂载与配置运行时',969,240,True)
 edge('M300 357 H350','贡献',306,347)
 edge('M620 357 H650','组装',620,343)
 edge('M920 357 H970','请求',927,345)
 edge('M970 389 H920','流式响应',922,411)
 edge('M785 411 V515','工具调用',797,465)
 edge('M650 390 H635 V490 H560 V515','写入运行事实',545,479)
 edge('M485 515 V411','历史',449,450)
 edge('M650 565 H620','结果',620,553)
 edge('M920 558 H970','调用',927,547)
 edge('M300 540 H320 V247 H705 V315','可选：创建 / 继续 / 投递',38,241,True)
 edge('M300 797 H325 V694 H805 V611','可选工具注册 / 调用',395,689,True)
 edge('M485 611 V755','持久化 / 恢复',495,723)
 edge('M560 611 V716 H785 V755','提交事件 → 状态投影',658,733)
 parts.extend(['<text x="980" y="688" fill="#566b61" font-size="13" font-family="sans-serif">外部边界</text>','<text x="980" y="713" fill="#566b61" font-size="12" font-family="sans-serif">模型服务、远端工具与执行环境</text>','<text x="980" y="736" fill="#566b61" font-size="12" font-family="sans-serif">由相应适配器 / 提供方连接。</text>','<text x="650" y="890" fill="#566b61" font-size="12" font-family="sans-serif">状态视图 → 宿主呈现；实时流走独立跟随通道。</text>','<text x="30" y="948" fill="#566b61" font-size="13" font-family="sans-serif">底部基础带支撑所有相关组件；为避免遮挡，省略向各插件的重复依赖连线。</text>'])
 for key,title,sub,url,group,detail in NODES:
  x,y,w=POSITIONS[key]
  fill={'runtime':'#fffef7','state':'#e9eef9','capability':'#f6eddc','product':'#e4eee3','assembly':'#e4eee3','foundation':'#faf7fe'}[group.split()[0]]
  parts.append(f'<a href="{esc(url,quote=True)}" target="_blank">' if download else f'<g class="arch-node" data-node="{key}" data-paths="{group}" role="button" tabindex="0" aria-label="{esc(title)}：查看职责">')
  parts.extend([f'<rect x="{x}" y="{y}" width="{w}" height="96" rx="11" fill="{fill}" stroke="#9cb2a5"/>',f'<text x="{x+12}" y="{y+28}" fill="#173f32" font-family="sans-serif" font-size="17" font-weight="700">{esc(title)}</text>',f'<text x="{x+12}" y="{y+54}" fill="#526b5d" font-family="sans-serif" font-size="12">{esc(sub)}</text>',f'<text x="{x+12}" y="{y+79}" fill="#657a6f" font-family="sans-serif" font-size="11">'+('查看固定版本源码 ↗' if download else '点选查看职责、边界与源码 ↗')+'</text>','</a>' if download else '</g>'])
 parts.append('<text x="30" y="1226" fill="#566b61" font-family="sans-serif" font-size="12">实线 = 标注的主要调用 / 数据关系；虚线 = 组装或可选接入。箭头不是完整调用图，也不规定并发执行顺序。</text><text x="30" y="1251" fill="#566b61" font-family="sans-serif" font-size="12">布局表达职责与协作，不表示目录层级；底部基础带也不是每次请求的执行阶段。</text></svg>')
 return ''.join(parts)
