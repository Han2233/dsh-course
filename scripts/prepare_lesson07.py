# -*- coding: utf-8 -*-
"""Build final lesson and architecture from the pinned read-only source tree."""
from pathlib import Path
import html,json,subprocess
from lab_entry import apply_entry
R=Path(__file__).resolve().parents[1];U=R.parent/'deepseek-harness';SHA='5badb15009ae1756c3afe0ae0cef1faafc290ccc'
assert subprocess.check_output(['git','-C',str(U),'rev-parse','HEAD'],text=True).strip()==SHA
D=R/'lessons/07';D.mkdir(exist_ok=True)
specs={
'cordis':('docs/architecture.zh.md','## Cordis',8),
'architecture':('docs/architecture.zh.md','## 核心包',18),
'boot':('docs/architecture.zh.md','## Profile',20),
'events':('docs/architecture.zh.md','## 事件',10),
'flow':('docs/architecture.zh.md','## 轮次流程',24),
'seams':('docs/architecture.zh.md','## 能力 seam',9),
'extension-map':('docs/architecture.zh.md','## 新行为',30),
'plugin':('docs/user/develop/basic/index.zh.md','## 自动清理',24),
'config':('docs/user/develop/basic/config.zh.md','## 定义 Config',33),
'publish':('docs/user/develop/basic/publish.zh.md','### 组合包 manifest',45),
'contract':('docs/cookbook/adding-a-tool.zh.md','## execute()',17),
'presentation':('docs/cookbook/adding-a-tool.zh.md','## Web Client',8),
'define':('packages/core/tools/src/schema.ts','    async execute(args: unknown',5),
'output-schema':('packages/core/tools/src/schema.ts','export interface ObjectValueSchemaSpec',5),
'register':('packages/core/tools/src/index.ts','    return this.layers.effect(',6),
'guard':('packages/core/tools/src/index.ts','  guard(guard:',7),
'reminder':('packages/guard/repeat-tool-reminder/src/index.ts',"  ctx.on('tools/post-execute'",13),
'preset-register':('packages/preset/agent-preset-registry/src/index.ts','  async register(definition:',18),
'preset-collect':('packages/preset/agent-preset-registry/src/index.ts','  private async collect(',5),
'preset-bind':('packages/preset/agent-preset-registry/src/index.ts','  async mount(ctx:',10),
'preset-audit':('packages/preset/agent-preset-registry/src/mount.ts','export async function mountPreset(',13),
'preset-test':('packages/preset/agent-preset-registry/tests/registry.spec.ts',"  it('retains a replaced",20),
'preset-doc':('packages/preset/agent-preset-registry/README.md','### Design',1),
'creator':('packages/extensions/tool-cordis/src/index.ts','    name: \'cordis_inspect_query\'',11),
'inspect-host':('packages/extensions/tool-cordis/src/host.ts','export function apply(',5),
'inspect-doc':('packages/extensions/tool-cordis/README.md','## Known Limitations',7),
'creator-preset':('packages/bundle/web-app/presets/cordis.patch.yml','          - id: tool-cordis',15),
'manager':('packages/boot/plugin-manager/src/index.ts','  private async change(',24),
'manager-doc':('packages/boot/plugin-manager/README.md','## Summary',4),
'inventory':('packages/host/plugin-inventory/src/index.ts','export async function readPluginInventory(',16),
'setup':('packages/core/agent-loop/src/index.ts','      const setupCommit =',5),
'scope':('packages/core/scope/README.md','### The parent chain',5),
}
# Pin the whole preset reference without assuming a heading not present in that snapshot.
specs['preset-doc']=('packages/preset/agent-preset-registry/README.md','Each declaration eagerly',12)
sources={}
for k,(path,mark,n) in specs.items():
 lines=(U/path).read_text().splitlines();start=next(i+1 for i,l in enumerate(lines) if l.startswith(mark));end=min(start+n-1,len(lines));sources[k]={'path':path,'start':start,'end':end,'url':f'https://github.com/deepseek-ai/deepseek-harness/blob/{SHA}/{path}#L{start}-L{end}','description':k}
# Reuse selected verified fixed-commit navigation anchors for the seven-course overview.
for lesson,keys in [('05',['append','surface','jsonl-append','compact-transaction','instructions','skill-load']),('06',['continuation','jobs','workflow-host','goal-drive','schedule'])]:
 previous=json.loads((R/'lessons'/lesson/'sources.json').read_text())
 assert previous['commit']==SHA
 for key in keys:sources[key]=previous['sources'][key]
excerpts=[]
def ref(k,label='源码依据'):return f'<a href="{sources[k]["url"]}" target="_blank" rel="noopener">{label} ↗</a>'
def code(k,title):
 s=sources[k];lines=(U/s['path']).read_text().splitlines();eid='source-'+k;excerpts.append(dict(s,id=eid));body='\n'.join(f'<span class="source-line"><span class="line-number" aria-hidden="true">{i}</span>{html.escape(lines[i-1])}</span>' for i in range(s['start'],s['end']+1));return f'<details class="source-block" id="{eid}"><summary>真实源码 · {title}</summary><p>{ref(k,s["path"])}</p><pre><code>{body}</code></pre></details>'
def p(t):return '<p>'+t+'</p>'
def note(t):return '<div class="note">'+t+'</div>'
def table(h,rows):return '<div class="table-wrap"><table><thead><tr>'+''.join('<th>'+x+'</th>' for x in h)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+x+'</td>' for x in row)+'</tr>' for row in rows)+'</tbody></table></div>'
def cards(items):return '<div class="extension-cards">'+''.join('<article><small>'+a+'</small><h3>'+b+'</h3><p>'+c+'</p></article>' for a,b,c in items)+'</div>'
sections=[]
def section(id,title,body):sections.append((id,title,body))
section('position','从会读源码，走到能选对扩展位置',p('前六课已经把 Agent 从启动组装推进到任务委派。最后一课不再增加一个孤立名词，而是完成一次扩展设计：为修复后的配置增加 audit_timeout 工具，让部署定义“timeout 至少多少才合格”，并观察两个 Agent 绑定不同版本时的结果。目标是找到最小改动面，知道能力何时可见、失败在哪里被记录，以及何时真正清理。')+p('dsh 的循环、工具、提示词和持久化都通过插件组合。新行为通常附着已有服务或事件；只有现有契约无法表达需求，才需要讨论修改底层契约。最后的完整架构图把启动、运行、状态、能力、编排与产品载体接在一起，但不把所有可选包误画成每次请求必经的流水线。'+ref('extension-map'))+cards([('确定归属','先问要改变什么','新增能力、拦截已有执行、持久状态或产品呈现，对应不同入口。'),('建立契约','输入与结果都可检验','声明配置、参数、规范值、模型文本与清理责任。'),('验证组合','行为要能解释与撤销','比较不同作用域、版本与失败路径，不只观察一次成功输出。')]))
section('choice','插件、工具、策略和提供方分别改变什么',table(['想实现的变化','优先扩展位置','为什么放这里'],[['检查一个数值并返回审计结论','工具 Consumer：ctx.tools.register','给模型一个有 schema 的明确动作'],['换成远程文件环境','能力 Provider：fs / shell / subprocess 等','保留工具契约，更换执行世界'],['统一禁止某类调用','tools.guard 或 pre-execute 策略','让部署规则与工具业务逻辑分离'],['提示重复失败，帮助模型换路径','post-execute 附加上下文','不修改文件，不伪造工具成功'],['恢复后仍须保留业务状态','SessionEventMap + 投影','内存 Map 不能提供重放证据'],['只让一组 Agent 看见新工具','Preset 与作用域注册','改变贡献的可见范围与生命周期'],['给 Web 增加审计卡片','Client slot + 持久结果事实','Host 工具不导入浏览器组件']])+p('插件是生命周期和注册的容器，工具是其中一种贡献，策略通常通过事件或守卫附着，提供方则实现一个可替换能力接口。它们可以同处一个小包，但不能把四个词当作四种互斥文件类型。是否拆包取决于复用和替换需求，不是“每写一个函数就建三包”。'+ref('seams'))+p('本课的审计工具只计算传入值是否达到门槛，文件读取已经由前课完成。这样能分清两个证据：读取结果说明某个文件当时的内容；纯审计工具说明给定数值是否满足规则。若未来把它改成直接读文件的工具，应依赖配置好的文件能力，并传递取消信号，不能让模型随口提供的数值冒充实时文件读取。'))
section('contract','一份工具定义，至少有三种输出用途',p('工具输入的 parameters 面向模型，也用于 defineTool 的运行时参数校验。execute 返回规范 JSON 值，例如 { ok: false, actual: 30, minimum: 60 }；output.render 把它解释成模型可见文本。UI 展示是另一层：需要回放的事实通过 presentationMeta 持久化，Host presenter 或 Web slot 再决定怎么画。')+cards([('规范值','程序可以直接读取','ok 是 boolean；PTC 可以根据它分支，不用解析“通过”二字。'),('模型内容','解释一次结果','告诉 Agent 哪里不满足要求，保持与规范值一致。'),('呈现事实','供 UI 重放','只保存有界、可回放数据；不保存 React props 或运行时闭包。')])+code('define','工具体执行前校验参数')+code('output-schema','显式对象必须声明开放性')+p('参数类型正确还不等于业务输入有效。类型为 number 不代表正数或合理上限；schema DSL 表达不了的约束，需要在插件配置或工具体中显式检查。execute 抛错、返回类型不合或渲染失败会走工具错误路径。相反，ok:false 是成功执行后的不理想领域结果，应保留结构化证据。'+ref('contract'))+p('当同一工具被 PTC 调用时，程序获得策略处理后的最终规范值；Native 模型路径使用渲染内容。仅把敏感字段从文本中删掉，并不能阻止程序读取 value；保密策略必须考虑两个出口。Web Client 则通过 keyed slot 处理原始事件，不消费 Host 的 presentCall / presentResult；不能只写一个 Host presenter 就声称已增加专用 Web 卡片。'+ref('presentation')))
example='''import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'timeout-audit'
export const inject = ['tools']
export const Config = z.object({ minimum: z.number().default(30) })

export function apply(ctx: Context, config: { minimum: number }) {
  if (!Number.isFinite(config.minimum) || config.minimum <= 0)
    throw new Error('minimum must be positive and finite')
  ctx.tools.register(defineTool({
    name: 'audit_timeout',
    description: 'Check a supplied timeout against the configured minimum.',
    parameters: { timeout: { type: 'number', required: true } },
    output: {
      schema: {
        type: 'object', additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          actual: { type: 'number', required: true },
          minimum: { type: 'number', required: true },
        },
      },
      render: (_args, value) => [{
        type: 'text', text: JSON.stringify(value),
      }],
    },
    async execute(args, exec) {
      exec.signal.throwIfAborted()
      if (!Number.isFinite(args.timeout) || args.timeout <= 0)
        throw new Error('timeout must be positive and finite')
      return { ok: args.timeout >= config.minimum,
        actual: args.timeout, minimum: config.minimum }
    },
  }))
}'''
(D/'timeout-audit.ts').write_text('// Course example for the pinned snapshot; not compiled or installed by this lesson.\n'+example+'\n')
section('plugin','把纯审计逻辑装进可清理的插件',p('最小插件导出 name、inject、Config 和 apply。inject 声明依赖，Config 校验部署输入，apply 注册贡献。这里的 minimum 属于部署配置，timeout 属于一次调用参数：前者决定这一版插件的规则，后者决定当前要检查的数据。把两者都塞进提示词，程序就无法独立验证“究竟执行了哪一版规则”。')+note('下面是按固定快照 API 编写的教学示例，不是仓库原样摘录。本课没有编译、安装或执行此 TypeScript 插件；浏览器工作台运行的是独立 JavaScript 状态模型。'+ref('config','配置契约')+' · '+ref('contract','工具契约')+' · <a href="timeout-audit.ts" download>下载示例</a>')+'<details class="source-block"><summary>教学示例 · 完整 timeout-audit.ts</summary><pre><code>'+html.escape(example)+'</code></pre></details>'+p('注册返回的 disposer 由框架副作用系统承接：当所属作用域真正释放，工具贡献撤销。不要在注册后原地改 schema 或替换回调来模拟热更新；应释放旧贡献，再建立新定义。闭包中的计数器仍可能是普通内存状态，不会因为“属于插件”就自动变成可重放状态。')+code('register','注册归入调用上下文的副作用层')+p('原生资源需要明确所有权。例如直接创建 socket、AbortController 管理的长请求，或原生 setInterval 时，要用 ctx.effect 注册清理，并等待异步工作收敛。框架能自动清理通过其 API 注册的资源，不能推断你在任意库中打开过哪些连接。'+ref('plugin')))
section('policy','让策略改变准入，让观察保留事实',p('现在追加一个教学守卫：禁止 audit_timeout 执行。守卫适合最终单调拒绝；后续插件不能把另一个守卫的 deny 改成 allow。对于允许、拒绝、请求审批的可扩展协商，使用 pre-execute；需要包裹执行和计时，使用 tools/execute；需要丰富或替换结果，使用 post-execute；只读指标应监听归一化结果。')+code('guard','守卫也由作用域副作用拥有')+p('不要把“审计不合格”当作守卫拒绝。minimum=60、timeout=30 时，工具应该执行并返回 ok:false；而守卫拒绝时根本没有业务计算结果。两种情况看起来都不通过，但前者证明检查已经发生，后者证明操作被阻止。')+p('真实 repeat-tool-reminder 插件展示了一种温和策略：它在 post-execute 记录连续重复调用，先观察再委托 next，最后把提示叠加到下游结果；即使下游 block，也保留附加上下文。它不把失败工具伪装成成功，也不会代替模型执行新的操作。')+code('reminder','保留下游决策并追加提醒')+note('注册点的时机决定可做什么：后置拦截不能回滚已经发生的文件写入。纯观察与影响模型下一步的提示也不同；后者属于模型可见输入，应沿受支持的消息路径记录。'+ref('events')))
section('scope','作用域负责贡献，隔离域负责服务解析',p('将插件挂在 Host 上，通常贡献给全局；挂在某个 Agent / Preset 的作用域中，贡献只沿该作用域链可见。子作用域继承祖先贡献，近处同名定义覆盖远处；祖先监听者可以观察后代事件，反向关系不成立。作用域并不是权限沙箱，也不会复制工作区。'+ref('scope'))+p('还要区分 Cordis 服务隔离 realm。假设你在某个 Preset 内换一个 workflowEngine 服务，只把工具注册限定到 Agent 并不能改变普通服务查找。提供方与消费者必须在同一个 cordis:group 的 isolate realm 中；registry 会检查向 Host 根域泄漏的服务，发现泄漏时拒绝挂载。')+code('preset-audit','导入、激活与服务泄漏都要检查')+p('这也是为什么“插件列表里能看见一行”不等于“它可用”：可能 disabled、等待依赖、导入失败、初始化失败，或者服务泄漏。缺少 Host 服务的行会保留等待状态；后续读取和绑定会在 Host 树收敛后重新审核。要观察 phase 与诊断，不能只搜索包名。')+p('Agent 的 setup 窗口发生在发布之前。这里绑定 Preset 和注册作用域贡献，完成后才发布 Agent；不应在 setup 内驱动一次模型任务。创建失败需要回滚尚未发布的资源，避免工具和监听器成为游离贡献。')+code('setup','先完成 setup，再发布 Agent'))
section('versions','更新定义不等于替换所有在线 Agent',p('Preset definition 是声明，generation 是一份已挂载的具体版本，binding 是 Agent 对这一版本的引用。工作台用 v1 / v2 做教学编号：v1 minimum=30，v2 minimum=60。同一个 timeout=30，在 A 的旧组合里通过，在 B 的新组合里不通过；规则来源不同，不能把它解释成模型随机。')+'''<div class="revision-map"><div><b>当前声明</b><span class="retired">v1 退休</span><span>v2 当前</span></div><div><b>已有 A</b><span>仍绑定 v1 · minimum 30</span></div><div><b>新建 B</b><span>绑定 v2 · minimum 60</span></div><p>实色表示仍被引用的组合；退休只停止新绑定，引用归零才清理。v1/v2 是本课标签。</p></div>'''+code('preset-register','移除声明时先标记旧版本退休')+code('preset-collect','退休且没有引用，才释放作用域')+p('声明更新或移除后，已有 Agent 以及继承其组合的子 Agent 可以继续持有旧版本。仅释放父 Agent，不一定释放仍被子级持有的组合。重启进程则不同：旧代码版本不会被 Session 日志永久保存，恢复按同一 Preset ID 的当前定义组装，缺少定义时拒绝恢复。'+ref('preset-doc'))+code('preset-test','测试覆盖旧版本与子级引用的释放')+p('本课实际阅读了该测试，未执行上游测试套件。也不要把 Preset 版本保留推广成任意 Host 插件都能自动双版本运行：Host HMR、模块缓存与包安装的生命周期是另一层，需要分别确认。'))
section('bundle','把代码、配置与安装状态分开交付',p('本地 overlay 适合开发观察；要可复用地分发，应形成 Bundle：package.json 声明 dsh.bundle.patch，patch 插入或覆盖插件行，模块文件提供实现。Profile 则决定哪些 Bundle 按什么顺序叠加。安装一个普通 npm 依赖不自动赋予它配置层，缺少 dsh.bundle 的包可以成为依赖而不被激活。'+ref('publish'))+'''<div class="package-layout"><pre>timeout-audit-bundle/
├── package.json       dsh.bundle.patch
├── cordis.patch.yml   插入专用 Preset / 插件行
└── lib/audit.js       构建后的工具插件</pre><div><h3>三个不同的问题</h3><p>包是否安装？</p><p>Bundle 是否在 Profile 中启用？</p><p>对应插件是否在运行时健康挂载？</p></div></div>'''+p('叠加顺序是 Profile 的 Bundle 列表 → Profile patch → home patch → 命令行 overlay。命中行 id 的 patch 替换整个 config；覆盖 Preset 的 plugins 列表也不会自动合并未来内置变化。为本课小实验单独插入专用 Preset，比复制整个 Standard 再忘记同步更新更容易理解；生产组合仍需显式配置任务所需的提示词与能力。'+ref('boot'))+p('同进程共享实例的 dsh 包需按版本与解析契约声明 peerDependencies；构建、类型检查可另配 devDependencies。把宿主服务运行时错误地打包成第二份实例，会让类型看起来一致、注册身份却不一致。具体打包与本地链接应按对应源码版本的开发文档核实，本课不替你在本机安装另一套 runtime。'+ref('publish')))
section('creator','Creator 的检查是起点，持久修改走管理器',p('Creator / cordis Preset 组合了开发所需工具与指引。cordis_inspect_list 发现当前 Host / Client provider，cordis_inspect_query 查询方法、类型、事件模式、工具 schema 或 Config。先发现再查询，避免根据名字猜接口；查询工具不会执行被展示的业务方法，也不会执行生成代码。')+code('creator','检查工具明确声明只读边界')+p('Host inspect provider 每个进程注册一次，而工具可以暴露给多个 Preset。只在 Preset 里加 tool-cordis 行，不会凭空建立 Host provider。Client 查询还要求有响应页面；Host Config 列表查看的是 Profile Loader 树，不包含只存在于分离 Preset 树中的所有插件行。')+code('inspect-host','Host provider 的注册与清理')+p('准备好代码与 patch 后，Plugin Manager 负责持久 Profile 修改。它同时服务用户界面与工具，影响使用该 Profile 的会话；结果必须区分 saved-state changed 与 application 状态。HMR 可用时尝试应用，没启用时会报告 restart-required；覆盖已安装包也可能需要重启。')+code('manager','保存变化与应用结果分别记录')+p('失败不一定代表磁盘未变化，成功保存也不代表当前 Agent 已切到新组合。包管理器退出、Bundle 校验、Loader 激活和旧资源释放分属不同阶段；要保留错误阶段和诊断。如果涉及依赖构建脚本或版本兼容豁免，还要遵循管理器对应的显式授权机制；这些属于真实安装流程，本课浏览器按钮不触发它们。'+ref('manager-doc')))
section('verification','验证扩展，不只看一次正确输出',table(['验证面','针对本课的具体观察','可排除的误判'],[['契约','timeout 为 number；输出 ok 必须为 boolean','自然语言像成功，但规范值不合法'],['领域逻辑','30/30 通过，30/60 返回有效失败结果','业务失败被误判为基础设施异常'],['准入','守卫拒绝时没有工具体结果','把阻止执行当成已完成检查'],['作用域','新旧 Agent 分别保留自己的 minimum','一个全局变量污染全部会话'],['生命周期','移除定义阻止新绑定；最后引用释放才清理','过早撤销在线贡献或遗留重复注册'],['呈现与历史','规范值、模型文本、持久事实一致','只改 UI，模型仍接收旧含义'],['应用状态','检查当前 Loader / Preset 与管理器诊断','把已安装包当成已激活能力']])+code('inventory','直接从 Loader 读取当前状态')+p('pluginInventory 是时点快照，没有历史订阅，也不会通过读取来安装插件。phase=null 只说明现在没有活跃根 Fiber，无法单凭它区分“从未启动”和“已被清理”。排查需要组合配置、作用域、事件与错误证据。'+ref('inventory'))+p('测试层级也要写清：纯审计函数可以做数值边界检查；插件测试需确认贡献注册和释放；集成测试才覆盖真实 Loop、模型适配器、工具结果和 Session 重放。页面的 DOM 测试替身只验证按钮连接，不证明浏览器布局，更不证明真实 dsh 插件可以安装。测试应该检验边界和失败归属，避免把实现逐行翻译成无信息量的断言。'))
section('workbench','最后一块能力：挂载、调用、更新与释放',p('前六课的虚拟读改查与双子 Agent 复核已默认完成，父会话记录保留。跟随高亮建立一个纯审计工具，创建 A 后检查 timeout=30；发布 minimum=60 的 v2，再创建 B 检查同一数值。最后移除定义、观察新建失败，并逐个释放引用。')+note('浏览器教学模拟，不安装真实插件、不运行示例 TypeScript、不调用真实模型。虚拟文件与前课模型一致。v1/v2 是教学编号；界面只模拟健康版本保留与释放，挂载失败实验不覆盖真实管理器的所有磁盘回滚路径。工具计算真实使用当前数值，不是预录 PASS 文本。')+'''
<div class="agent-workbench focus-workbench extension-workbench" id="agent-desk" data-mobile-view="task"><header class="focus-header"><div><strong>Agent · 扩展验证台</strong><small>前六课案例已完成 · 新增纯审计工具与组合版本</small></div><button id="desk-expand" type="button" aria-pressed="false">专注模式</button></header>
<div class="focus-options"><label for="ext-agent">查看会话</label><select id="ext-agent"><option value="parent">父 Agent · 前置记录</option></select><label for="ext-failure"><input id="ext-failure" type="checkbox">模拟挂载失败</label><button id="desk-reset" type="button">重置实验</button></div>
<nav class="focus-mobile" aria-label="工作台区域"><button id="view-task" type="button" aria-pressed="true">对话</button><button id="view-file" type="button" aria-pressed="false">组合</button><button id="view-inspect" type="button" aria-pressed="false">检查与操作</button></nav><div class="focus-body">
<section class="focus-pane pane-task"><h3 id="ext-chat-title">父 Agent · 完整对话</h3><div id="desk-chat" class="desk-chat" role="log" aria-label="完整教学对话" aria-live="polite" tabindex="0"></div><div class="desk-composer"><label class="sr-only" for="desk-task">审计任务</label><textarea id="desk-task" rows="2" maxlength="2000">检查当前虚拟文件的 timeout 是否满足你的规则。</textarea><button id="desk-send" type="button">发送审计任务</button><small>固定审计脚本；纯工具不读取本机文件。</small></div></section>
<section class="focus-pane pane-file"><h3>组合版本与引用</h3><div id="ext-roster" class="extension-roster"></div><p id="ext-file"></p><label for="ext-mode">本次调用条件</label><select id="ext-mode"><option value="normal">正常执行</option><option value="deny">守卫拒绝</option><option value="bad-output">输出类型错误</option></select><div class="note">版本中的 minimum 在挂载时固定。改变调用条件不修改文件或组合版本。</div></section>
<section class="focus-pane pane-inspect"><label for="ext-view">检查器</label><select id="ext-view"><option value="schema">当前工具 schema</option><option value="result">最近规范值与模型内容</option><option value="events">扩展事件</option><option value="bindings">版本与绑定</option></select><pre id="ext-inspection" tabindex="0"></pre><label for="ext-action">自由操作</label><select id="ext-action"></select><button id="ext-run" type="button">执行所选操作</button><p id="ext-disabled"></p><a id="ext-source" href="'''+sources['creator']['url']+'''" target="_blank" rel="noopener">本步源码 ↗</a></section></div><footer class="focus-footer"><div><span class="pill">建议下一步</span><button id="ext-next" type="button">检查运行时接口</button></div><p id="desk-hint" role="status"></p></footer></div>''')
section('case','把七节课接成一次可解释的完整任务',table(['课程','贯穿案例里的事实','本课验证时回看的位置'],[['01 组装','Profile 决定插件树，Preset 给 Agent 选择贡献','Bundle 与版本绑定'],['02 插件','依赖就绪才注册，作用域释放才清理','挂载失败与引用账本'],['03 循环','输入进入 Inbox，请求产生工具调用','完整对话里的 call/result'],['04 执行','虚拟文件被读、改、检查','共享文件 timeout=30'],['05 会话','对话与执行证据可保留，模型视图可以重建','父会话历史与本课事件'],['06 委派','两个子 Agent 报告复核结果','默认完成的父子通知'],['07 扩展','A 与 B 用不同规则审计同一数值','规范值、版本号与最终释放']])+p('一份有效审计结果可能是 ok:false。B 的严格规则未通过，并不推翻父 Agent 曾经成功把 timeout 改为 30 的事实；它只是引入了新的接受标准。若要求进一步修复，应明确任务目标，再沿文件能力执行修改和验证，不能偷偷让“审计”工具承担写入副作用。')+p('移除定义也不抹掉旧结果。结果描述的是当时的规则与输入；新版本只影响未来绑定。若需要跨重启审计规则来源，应设计并持久化版本标识或有界元数据，而不是期待进程内 generation 自动永存。教学事件记录了版本号用于说明，这不等同于真实 dsh 默认把插件代码快照写进每条工具结果。'))
section('tradeoffs','保留小而明确的扩展边界',p('“所有东西都是插件”并不意味着所有修改都该通过更多插件叠加。若多个策略反复重写同一份结果，失败归属会变得模糊；若业务状态放在闭包里，恢复行为会缺少依据；若一份 Preset 复制整套内置配置，后续升级的维护成本会增加。优先使用最小、明确、可观察的贡献。')+p('这套架构的特点是把生命周期、可见性、服务替换和持久事实分别约束，再用组合将它们连接。其收益是局部替换与可追踪的扩展；代价是作者必须理解多个所有权与状态边界。这里是在分析实现取舍，不宣称这种结构是未经证明的首创，也不据此推断它在所有工作负载中更快。')+table(['常见混淆','更准确的判断'],[['注册工具 = 获准执行','schema 可见、准入策略与环境能力分别验证'],['作用域 = 沙箱','作用域管理贡献；沙箱约束实际执行'],['包安装成功 = 插件可用','依次检查选中、挂载、依赖与应用状态'],['更新 Preset = 所有会话立即更新','在线引用保留旧版本，新绑定用当前定义'],['事件都能重放','只有持久事实及其解释器支持重放，实时增量不能替代日志'],['页面实验通过 = 真实插件已验证','本课只运行教学状态与界面连接检查']]))
section('sources','最后一条源码阅读路线',table(['顺序','文件与符号','需要验证的边界'],[['1',ref('define','defineTool')+' / '+ref('register','ToolRuntime.register'),'参数校验、输出契约与注册所有权'],['2',ref('guard','ToolRuntime.guard')+' / '+ref('reminder','repeat-tool-reminder'),'拒绝、观察、附加上下文的区别'],['3',ref('preset-audit','mountPreset')+' / '+ref('preset-bind','AgentPresetRegistry.mount'),'挂载健康与 setup 绑定'],['4',ref('preset-register','register')+' / '+ref('preset-collect','collect'),'声明移除与在线引用的分离'],['5',ref('creator','cordis_inspect_query')+' / '+ref('inspect-host','Host providers'),'只读发现与 provider 的部署位置'],['6',ref('manager','PluginManager.change')+' / '+ref('inventory','readPluginInventory'),'保存状态、应用状态与只读观察'],['7',ref('architecture','完整架构文档')+' / '+ref('extension-map','扩展归属表'),'回到系统级职责与数据关系']])+p('核查基准：0.2.1-alpha.1，提交 '+SHA+'，日期 2026-10-10。真实摘录逐行与固定本地快照比对；示例插件和工作台简化模型分开标注。没有运行上游 dsh 测试，也没有将教学插件装进用户环境。'))
from architecture07 import NODES,build
svg=build(sources);(D/'dsh-architecture.svg').write_text(build(sources,download=True))
node_data={key:{'title':title,'detail':detail,'source':sources[src]['url'],'lesson':lesson,'paths':paths} for key,title,sub,src,lesson,paths,detail in NODES}
(D/'architecture.js').write_text('window.DSH_ARCHITECTURE = '+json.dumps(node_data,ensure_ascii=False)+';\n')
options=''.join(f'<option value="{key}">{title}</option>' for key,title,*_ in NODES)
node_list=''.join(f'<article><h3>{title}</h3><p>{detail}</p><a href="{sources[src]["url"]}" target="_blank" rel="noopener">源码 · 第 {lesson} 课 ↗</a></article>' for key,title,sub,src,lesson,paths,detail in NODES)
section('architecture','完整架构图：从启动到持续工作的全貌',p('这张图覆盖七课涉及的核心职责与主要能力扩展，以 24 个组件组呈现。它是固定快照的系统架构总览，不是每个 npm 包的清单，也不表示所有可选组件都已启用。Cordis 是各层的组合与生命周期基础；审批、守卫、沙箱在相应执行边界生效。')+p('实线表示主要请求、结果或事实流，虚线表示组装绑定、投影更新或可选调用。为避免跨图连线遮挡，编排组件回接 Inbox / ToolRuntime 的关系放在节点说明和下方关系表中。路径按钮只高亮相关组件，不是执行顺序动画。')+'''
<div class="architecture-shell" id="architecture-shell"><div class="architecture-controls"><label for="arch-path">高亮主线</label><select id="arch-path"><option value="all">完整架构</option><option value="boot">启动与扩展组装</option><option value="turn">模型与工具回合</option><option value="state">会话与状态</option><option value="orchestration">持续任务编排</option></select><button id="arch-expand" type="button" aria-pressed="false">展开架构图</button><a href="dsh-architecture.svg" download>下载 SVG ↗</a></div><div class="architecture-viewport" tabindex="0" aria-label="完整架构图，可横向和纵向滚动">'''+svg+'''</div><div class="architecture-detail"><label for="arch-node-select">组件职责与源码</label><select id="arch-node-select">'''+options+'''</select><h3 id="arch-name">Profile / Bundle / Patch</h3><p id="arch-detail">组装入口与有序配置层。</p><a id="arch-source" href="'''+sources['boot']['url']+'''" target="_blank" rel="noopener">打开组件源码 ↗</a></div></div><details class="architecture-mobile"><summary>按组件阅读完整架构（适合手机 / 无脚本）</summary><div class="architecture-node-list">'''+node_list+'''</div></details>'''+table(['跨层关系','方向与含义'],[['Workflow → Subagent','脚本中的 agent hook 启动子级；Run 拥有结果聚合与清理责任'],['Subagent → Agent / Inbox','创建或恢复独立子会话，经同一个 Agent 消息机制驱动'],['Job ↔ 工具生产者','工具发布后台句柄，Job 管理输出和取消收敛'],['Goal Driver → Inbox','检查持久目标与进程授权，再排后续目标轮次'],['Schedule → Controller → Inbox','到时取得原会话并 followup，回执只到投递确认'],['Instructions / Skills → 模型上下文','贡献系统提示或按需加载的可记录内容'],['Tools / Loop → Session → Projection / Persistence','记录事实、派生视图、按检查点持久化；实时 UI 增量另行传输'],['Creator / Manager → 组装层','查询只读接口；持久 Bundle 变更经 Profile 应用，不直接改正在运行的模型内核']])+note('七课到这里完成。继续研究一个新能力时，先在这张图上定位它要改变的状态、调用边界和所有者，再沿源码验证。<a href="../../">返回七课目录</a> · <a href="../06/">回看第六课</a>'))
nav=''.join(f'<a href="#{id}"><b>{i:02}</b> {t}</a>' for i,(id,t,_) in enumerate(sections,1));opts=''.join(f'<option value="{id}">{t}</option>' for id,t,_ in sections)
styles=''.join(f'<link rel="stylesheet" href="../../assets/{x}.css?v=lesson07-1">' for x in ['course','workbench01','lesson03','lesson04','lesson07'])
scripts='<script src="sources.js" defer></script><script src="architecture.js" defer></script>'+''.join(f'<script src="../../assets/{x}.js?v=lesson07-1" defer></script>' for x in ['workbench01-model','workbench02-model','workbench04-model','workbench05-model','workbench06-model','workbench07-model','lesson07'])
page=f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>07 · 扩展与综合串联 — DSH 源码研读室</title><meta name="description" content="从源码设计插件、工具与策略，理解 Preset 版本、Creator 检查与 Bundle 安装，附七课完整架构图。">{styles}{scripts}</head><body><a class="skip" href="#main">跳到正文</a><aside class="sidebar"><a class="brand" href="../../"><span class="brandmark">dsh</span><span>源码研读室<small>HARNESS FIELD NOTES</small></span></a><a class="back" href="../06/">← 第六课 · 子 Agent 与编排</a><div class="nav-label">LESSON 07 / 本课目录</div><nav class="toc">{nav}</nav><div class="sidebar-foot"><progress id="reading-progress" max="100" value="0" aria-label="阅读位置"></progress><span id="reading-percent">阅读位置 0%</span><br>0.2.1-alpha.1 · 5badb15</div></aside><div class="mobile-header"><a href="../../">dsh / 源码研读室</a><select id="mobile-nav" aria-label="章节导航"><option value="">本课目录</option>{opts}</select></div><main class="main" id="main"><header class="hero"><div class="eyebrow">最后一课 / 从理解系统到设计扩展</div><h1>扩展<br>与综合串联</h1><p class="lead">把你的能力接入 Agent，<br>也把七节课接成一张完整的系统地图。</p><div class="meta"><span class="pill">深度课 07 / 07</span><span class="pill">0.2.1-alpha.1 · 5badb15</span><span class="pill">核查 2026-10-10</span></div></header><div class="note"><a href="#architecture">直接查看完整架构图 →</a> · <a href="dsh-architecture.svg" download>下载架构 SVG</a></div>'''
page+='\n'.join(f'<section class="lesson-section" id="{id}"><div class="section-no">{i:02} / LESSON 07</div><h2>{title}</h2>{body}</section>' for i,(id,title,body) in enumerate(sections,1))
page+=f'<noscript><div class="note">交互需要 JavaScript；正文、静态架构图、组件说明与源码仍可阅读。</div></noscript><footer class="lesson-footer">非官方学习材料 · 源码 {SHA} · <a href="../../THIRD_PARTY_NOTICES.md">引用与许可</a></footer></main></body></html>'
(D/'index.html').write_text(apply_entry(page,'07'))
m={'version':'0.2.1-alpha.1','commit':SHA,'checked':'2026-10-10','sources':sources,'excerpts':excerpts}
(D/'sources.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n');(D/'sources.js').write_text('window.LESSON_SOURCES = '+json.dumps(m,ensure_ascii=False)+';\n')
print('Generated lesson 07:',len(sections),'sections,',len(excerpts),'exact excerpts,',len(NODES),'architecture nodes.')
