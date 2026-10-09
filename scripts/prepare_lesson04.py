# -*- coding: utf-8 -*-
"""Regenerate only lesson 04 citations from the pinned, read-only checkout."""
from pathlib import Path
import json,re,html,subprocess
ROOT=Path(__file__).resolve().parents[1]; UP=ROOT.parent/'deepseek-harness'
SHA='5badb15009ae1756c3afe0ae0cef1faafc290ccc'
assert subprocess.check_output(['git','-C',str(UP),'rev-parse','HEAD'],text=True).strip()==SHA
base=f'https://github.com/deepseek-ai/deepseek-harness/blob/{SHA}/'
specs={
 'tool-runtime':('packages/core/tools/src/index.ts','export class ToolRuntime',0),
 'tool-view':('packages/core/tools/src/index.ts','  private view(',0),
 'tool-schema':('packages/core/tools/src/index.ts','  private schemaOf(',0),
 'tool-guard':('packages/core/tools/src/index.ts','  guard(',0),
 'tool-mode':('packages/core/tools/src/index.ts','  executionMode(',0),
 'tool-prepare':('packages/core/tools/src/index.ts','  private async prepareExecution',0),
 'tool-body':('packages/core/tools/src/index.ts','  private async dispatchToolBody',0),
 'tool-ask':('packages/core/tools/src/index.ts','  private async serviceAsk',0),
 'tool-post':('packages/core/tools/src/index.ts','  private async postExecute',0),
 'tool-finish':('packages/core/tools/src/index.ts','  private finishScheduledExecution',0),
 'tool-value':('packages/core/tools/src/index.ts','  private createSuccessResult',0),
 'define-tool':('packages/core/tools/src/schema.ts','export function defineTool',0),
 'fs-entry':('packages/fs/tool-fs/src/index.ts','export function apply',0),
 'fs-edit':('packages/fs/tool-fs/src/edit.ts','export function applyEditTool',0),
 'fs-observation':('packages/fs/fs-observation-policy/src/index.ts','class ObservedStateGate',0),
 'fs-observation-tests':('packages/fs/fs-observation-policy/tests/policy.spec.ts',"  it('rejects an unread edit",0),
 'fs-sandbox-controller':('packages/fs/tool-fs/src/sandbox.ts','  async resolvePolicy',0),
 'fs-sandbox':('packages/fs/fs-sandbox/src/index.ts','/**',26),
 'sandbox-local':('packages/sandbox/sandbox-local/src/index.ts','export class LocalSandboxProvider',0),
 'bash-tool':('packages/shell/tool-bash/src/index.ts','      async execute(args: BashToolArgs',0),
 'bash-doc':('packages/shell/tool-bash/README.md','# @deepseek-ai',0),
 'timeout':('packages/guard/timeout-policy/src/index.ts','export function apply',0),
 'mcp-tools':('packages/mcp/mcp-client/src/tools.ts','export async function syncTools',0),
 'mcp-result':('packages/mcp/mcp-client/src/tools.ts','export function createMcpToolDefinition',0),
 'mcp-doc':('packages/mcp/mcp-client/README.md','# @deepseek-ai',0),
 'ptc':('packages/core/tools/src/ptc.ts','export function createRunCodeTool',0),
 'ptc-runtime':('packages/ptc-runtime/ptc-runtime-node/src/index.ts','  async run(spec:',0),
 'tools-doc':('packages/core/tools/README.md','# @deepseek-ai',0),
}
manifest=json.loads((ROOT/'lessons/03/sources.json').read_text()); sources=manifest['sources']
for key,(path,marker,count) in specs.items():
 lines=(UP/path).read_text().splitlines(); start=next(i+1 for i,l in enumerate(lines) if l.startswith(marker));end=min(len(lines),start+count-1) if count else None
 sources[key]={'path':path,'start':start,'end':end,'url':base+path+f'#L{start}'+(f'-L{end}' if end else ''),'description':key}
excerpts=[
 ('define-tool','① 校验通过才调用作者执行体','    async execute(args: unknown, exec: ToolRunContext)',5,'这是 defineTool 的包装，勿把全部桥接器都假定成同一个实现。'),
 ('tool-schema','② 白名单投影模型 schema','  private schemaOf(',16,'执行体和输出回调不会被送给模型。'),
 ('tool-prepare','③ 先扩展策略，再单调守卫',"      const askResolution = gate.kind === 'ask'",15,'ask 解析后，允许分支仍须经过 guardReason。'),
 ('tool-ask','④ 没有审批服务就拒绝',"    const approval = this.ctx.get('approval')",8,'没有渠道不是默认同意。'),
 ('tool-body','⑤ 执行时重新解析工具','      const tool = this.resolveExecution(exec.name',9,'真正执行时工具可能已经变化；取消后还要等待执行体返回。'),
 ('tool-post','⑥ block 改变结果，不反向撤销副作用',"    if (decision.kind === 'block')",10,'这里只构造失败结果，没有逆向文件操作。'),
 ('fs-edit','⑦ 版本依据交给能力后端',"        const intent = await ctx.waterfall('fs/edit-intent'",9,'后端接收 expected intent，工具没有另行 stat 制造竞态窗口。'),
 ('fs-observation','⑧ 观察状态决定编辑条件','  editIntent(target:',11,'未观察、确认不存在、持有版本是三种不同状态。'),
 ('timeout','⑨ 等待调用体收敛，再报告超时','    const upstream = exec.signal',16,'协作取消不抛弃正在执行的 promise。'),
 ('tool-mode','⑩ 并发分类采用保守默认','  executionMode(exec:',9,'仅精确 true 为 parallel，其余为 exclusive。'),
 ('mcp-result','⑪ 先安装内容投影，再交给后置策略','    projectContent(exec:',9,'规范 value 与内容投影分别保留。'),
 ('ptc','⑫ 程序取消传播给子分发','      const runController = new AbortController()',3,'每次程序有独立取消域；不是忽略工具约束的旁路。'),
]

blocks=[]; records=[]
for i,(key,title,marker,count,note) in enumerate(excerpts):
 path=sources[key]['path'];lines=(UP/path).read_text().splitlines();start=next(j for j,l in enumerate(lines) if l.startswith(marker));selected=lines[start:start+count]
 snippet='\n'.join(f'<span class="source-line"><span class="line-number" aria-hidden="true">{start+j+1}</span>{html.escape(l)}</span>' for j,l in enumerate(selected))
 blocks.append(f'<details class="source-block" id="excerpt-{i}"><summary>{title}<span class="source-title">{path} · L{start+1}–L{start+count}</span></summary><div class="details-body"><p>{note}</p><pre><code>{snippet}</code></pre><a href="{base+path}#L{start+1}-L{start+count}" target="_blank" rel="noopener">固定提交中的完整上下文 ↗</a></div></details>')
 records.append({'id':f'excerpt-{i}','path':path,'start':start+1,'end':start+count})
p=ROOT/'lessons/04/index.html';s=p.read_text()
def resolve(m):
 attrs=re.sub(r'\s+(href|target|rel)="[^"]*"','',m[1]);return '<a'+attrs+' href="'+sources[m[2]]['url']+'" target="_blank" rel="noopener">'
s=re.sub(r'<a([^>]*\bdata-ref="([^"]+)"[^>]*)>',resolve,s)
region='<!-- SOURCE_EXCERPTS_START -->\n'+'\n'.join(blocks)+'\n<!-- SOURCE_EXCERPTS_END -->'
if '<!-- SOURCE_EXCERPTS -->' in s:s=s.replace('<!-- SOURCE_EXCERPTS -->',region)
else:s=re.sub(r'<!-- SOURCE_EXCERPTS_START -->.*?<!-- SOURCE_EXCERPTS_END -->',lambda _:region,s,flags=re.S)
p.write_text(s);manifest['excerpts']=records;manifest['checked_on']='2026-10-10'
(ROOT/'lessons/04/sources.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');(ROOT/'lessons/04/sources.js').write_text('window.LESSON_SOURCES = '+json.dumps(manifest,ensure_ascii=False)+';\n')
print('Lesson 04: resolved',len(sources),'source entries;',len(records),'exact excerpts.')
