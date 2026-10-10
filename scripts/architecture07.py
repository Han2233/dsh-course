# -*- coding: utf-8 -*-
"""Repository containment map, verified against the pinned source checkout."""
import html, math
from pathlib import Path
U=Path(__file__).resolve().parents[2]/'deepseek-harness'
SHA='5badb15009ae1756c3afe0ae0cef1faafc290ccc'
BASE=f'https://github.com/deepseek-ai/deepseek-harness/tree/{SHA}/'
DESCRIPTIONS={
'acp':'自动化协议服务','api':'远程 BFF 与 RPC','attachment':'附件身份与本地存储','boot':'共享启动与配置组装','browser-use':'浏览器能力提供方','bundle':'可安装的 Profile 组合层','client':'浏览器客户端与 UI','compaction':'会话压缩服务与实现','computer-use':'计算机操作能力','context':'指令、时间与上下文贡献','core':'Agent、Session 与工具核心','credentials':'凭据服务与认证流程','deliverables':'交付文件与工作区变更','document':'Office / PDF 转换','experimental':'实验性能力与原型','extensions':'运行时接口发现与扩展工具','feedback':'用户反馈命令','fs':'文件服务、实现与工具','goal':'目标状态与续跑驱动','guard':'执行期限与重复调用提醒','hooks':'外部 Hook 协议桥接','host':'Web 宿主与运行时设施','identity':'共享匿名身份','interaction':'审批、命令与用户询问','jobs':'后台工作与控制工具','llm':'模型服务与适配器','lsp':'语言服务器与工具','mcp':'外部 MCP 服务接入','plan':'计划状态与退出协作','preset':'Agent 组合与版本绑定','ptc-runtime':'程序化工具调用运行时','sandbox':'执行隔离服务与后端','schedule':'宿主定时跟进','sdk':'进程外 JSON-RPC 接口','session':'持久化、投影与报告','session-query':'会话检索与有界读取','settings':'设置服务与文件后端','shell':'Shell 执行接口与工具','skill':'技能注册与目录加载','spill':'大结果溢出存储','ssh':'远程执行环境提供方','storage':'非会话数据存储','subagent':'子 Agent 服务与工具','subprocess':'子进程服务与本地实现','telemetry':'共享遥测设施','terminal':'PTY 会话与所有权','test-support':'测试与重放支持','todo':'任务清单工具','typert':'类型图与 RPC 支持','util':'低层共享工具库','web':'搜索、抓取与模型工具','webhook':'验证事件与可信规则','workflow':'工作流接口与执行引擎','workspace':'工作区实体与服务'}
GROUPS=[
('apps','apps/ · 产品载体','同一运行时的不同入口与交付形式', [('cli','统一 dsh 命令入口'),('web','Web 前端构建产物'),('desktop','Electron 桌面应用'),('desktop-host','私有 Node 宿主进程')]),
('packages','packages/ · 按领域组织的工作区包','下列每个方块是目录组；叶子包位于 packages/<group>/<pkg>', sorted(DESCRIPTIONS.items())),
('vendor','vendor/ · 仓库维护的基础框架','Cordis 及其配套库：生命周期、加载、配置与事件基础', [('cordis','插件与服务框架'),('cosmokit','通用辅助库'),('group','插件分组'),('hmr','热重载支持'),('include','组合导入'),('loader','插件加载器'),('logger-console','控制台日志'),('schemastery','配置 schema'),('timer','计时器插件')]),
('native','native/ · 平台原生组件','供上层能力调用；策略与会话生命周期仍由调用方负责', [('system','Landlock 与 POSIX flock')]),
('python','python/ · Python 客户端与运行时分发','通过 stdio JSON-RPC 驱动 dsh 子进程', [('sdk','Python 客户端 API'),('sdk-runtime','CLI 与原生组件分发')]),
('engineering','仓库根目录 · 文档与工程支持','与运行时功能包分开呈现；不表示请求执行顺序', [('docs','架构、使用与开发文档'),('website','文档网站工程'),('scripts','构建与维护脚本'),('benchmarks','基准测试'),('snapshots','快照资料'),('patches','依赖补丁')])]
assert set(DESCRIPTIONS)=={p.name for p in (U/'packages').iterdir() if p.is_dir() and not p.name.startswith('.')}
NODES=[]
for group,_,_,items in GROUPS:
 for name,sub in items:
  path=name if group=='engineering' else f'{group}/{name}'
  assert (U/path).is_dir(),path
  detail=f'{path}/：{sub}。'
  if path=='packages/core':detail+='包含 agent、agent-loop、agent-default-model、agent-tool-presentation、scope、session、system-prompt、tools；这里的 session 是核心事实日志，packages/session 是持久化与投影等外围实现。'
  elif group=='packages':detail+='这是领域目录组，内部可包含服务接口、提供方、消费者或组合包；不是一个 npm 包，也不代表默认 Profile 全部启用。'
  elif path=='apps/web':detail+='以 dsh-client-web 为基础构建前端，dist 由 CLI 的 dsh web 提供。'
  elif path=='apps/desktop-host':detail+='为 Electron 提供 Node 模式宿主；复用共享启动与运行服务。'
  elif path=='packages/goal':detail+='目标状态与 Driver 分工。'
  NODES.append((path.replace('/','-'),path+'/',sub,BASE+path,group,detail))

def build(sources=None,download=False):
 esc=html.escape
 height=160+sum(90+math.ceil(len(items)/4)*83 for _,_,_,items in GROUPS)
 parts=[f'<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="{height}" viewBox="0 0 1280 {height}" role="group" aria-labelledby="architecture-title architecture-desc">', '<title id="architecture-title">DeepSeek Harness 仓库结构与职责全景</title>','<desc id="architecture-desc">以仓库根目录为起点，分区表示目录包含关系，方块表示实际目录。没有执行顺序箭头。全部功能包目录组均列出，叶子包请沿源码查看。</desc>',f'<rect width="1280" height="{height}" rx="18" fill="#f7f6ef"/>','<text x="30" y="40" fill="#173f32" font-size="23" font-family="sans-serif" font-weight="700">deepseek-harness/ · 仓库结构与职责全景</text>','<text x="30" y="67" fill="#566b61" font-size="13" font-family="sans-serif">0.2.1-alpha.1 / 5badb15 · 分区 = 目录归属 · 方块 = 实际目录 · 点击定位源码</text>']
 y=88
 for gi,(group,title,desc,items) in enumerate(GROUPS):
  h=90+math.ceil(len(items)/4)*83
  parts.extend([f'<rect x="20" y="{y}" width="1240" height="{h-12}" rx="14" fill="{["#edf2e7","#e5eeea","#eeeaf4","#f4ecd9","#e6eef4","#eeede6"][gi]}" stroke="#b6c6bb"/>',f'<text x="38" y="{y+28}" fill="#173f32" font-family="sans-serif" font-size="18" font-weight="700">{esc(title)}</text>',f'<text x="38" y="{y+49}" fill="#566b61" font-family="sans-serif" font-size="12">{esc(desc)}</text>'])
  nodes=[n for n in NODES if n[4]==group]
  for i,(key,path,sub,url,_,detail) in enumerate(nodes):
   x=38+(i%4)*303;cy=y+64+(i//4)*83
   label=path if group=='engineering' else path.split('/')[1]+'/'
   parts.append(f'<a href="{url}" target="_blank">' if download else f'<g class="arch-node" data-node="{key}" data-paths="{group}" role="button" tabindex="0" aria-label="{esc(path)}：查看职责">')
   parts.extend([f'<rect x="{x}" y="{cy}" width="288" height="70" rx="9" fill="#fffef9" stroke="#a3baad"/>',f'<text x="{x+12}" y="{cy+25}" fill="#173f32" font-family="monospace" font-size="16" font-weight="700">{esc(label)}</text>',f'<text x="{x+12}" y="{cy+49}" fill="#526b5d" font-family="sans-serif" font-size="12">{esc(sub)}</text>','</a>' if download else '</g>'])
  y+=h
 parts.append(f'<text x="30" y="{height-24}" fill="#566b61" font-family="sans-serif" font-size="12">包含全部 packages 目录组；隐藏目录、根级配置文件与叶子包未逐项展开。调用关系与 peer 依赖另见图下说明。</text></svg>')
 return ''.join(parts)
