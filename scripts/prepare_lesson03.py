# -*- coding: utf-8 -*-
"""Regenerate only lesson 03 citations from the pinned, read-only checkout."""
from pathlib import Path
import json,re,html,subprocess
ROOT=Path(__file__).resolve().parents[1]; UP=ROOT.parent/'deepseek-harness'
SHA='5badb15009ae1756c3afe0ae0cef1faafc290ccc'
assert subprocess.check_output(['git','-C',str(UP),'rev-parse','HEAD'],text=True).strip()==SHA
base=f'https://github.com/deepseek-ai/deepseek-harness/blob/{SHA}/'
specs={
 'driver':('packages/core/agent-loop/src/agent.ts','export class ReactLoopAgent',0),
 'send':('packages/core/agent-loop/src/agent.ts','  send(message:',30),
 'turn':('packages/core/agent-loop/src/agent.ts','  private async turn()',0),
 'prestep':('packages/core/agent-loop/src/agent.ts','  private async preStep(',22),
 'step':('packages/core/agent-loop/src/agent.ts','  private async step(',0),
 'prepare-request':('packages/core/agent-loop/src/agent.ts','  private async prepareRequest(',50),
 'build-request':('packages/core/agent-loop/src/agent.ts','  private buildRequest(',0),
 'inbox-claim':('packages/core/agent-loop/src/inbox.ts','  claim(target:',6),
 'inbox-projection':('packages/core/agent-loop/src/inbox.ts','export const inboxProjectionDefinition',45),
 'assemble':('packages/core/system-prompt/src/index.ts','  async assemble(',0),
 'render-prompt':('packages/core/system-prompt/src/index.ts','export function renderPrompt(',7),
 'prepare-call':('packages/llm/llm/src/index.ts','  async prepareCall(',47),
 'llm-adapter':('packages/llm/llm/src/index.ts','  private async * adapterStream(',0),
 'attempt':('packages/core/agent-loop/src/assistant-stream.ts','export class AssistantStreamAttempt',0),
 'retry-policy':('packages/llm/llm-retry/src/index.ts','function localDelay(',0),
 'retry-tests':('packages/core/agent-loop/tests/request-error.spec.ts',"  it('lets each failed request",52),
 'cancel-tests':('packages/core/agent-loop/tests/cancel.spec.ts',"  it('cancel({ keepInbox: true }) parks",24),
 'prefix-tests':('packages/core/agent-loop/tests/cancel.spec.ts',"  it('cancel mid-stream finalizes",35),
 'partial-tool-tests':('packages/core/agent-loop/tests/cancel.spec.ts',"  it('cancel drops a half-streamed",24),
 'tool-dispatch':('packages/core/agent-loop/src/tool-calls.ts','export async function executeToolCalls(',0),
 'tool-limit':('packages/core/agent-loop/src/constants.ts','export const DEFAULT_MAX_PARALLEL_TOOL_CALLS',1),
 'tool-recovery':('packages/core/session/src/repair.ts','export class ToolCallRecovery',0),
}
manifest=json.loads((ROOT/'lessons/02/sources.json').read_text()); sources=manifest['sources']
for key,(path,marker,count) in specs.items():
 lines=(UP/path).read_text().splitlines(); start=next(i+1 for i,l in enumerate(lines) if l.startswith(marker));end=min(len(lines),start+count-1) if count else None
 sources[key]={'path':path,'start':start,'end':end,'url':base+path+f'#L{start}'+(f'-L{end}' if end else ''),'description':key}
excerpts=[
 ('send','① followup / steer / inject 的路由','  followup(input:',11,'两种队列、两种唤醒语义。'),
 ('inbox-claim','② 边界领取输入','  claim(target:',6,'先领取全部 next-step，再按需领取一条 next-turn。'),
 ('prestep','③ 组装和接纳','    const claimed = this.inbox.claim',16,'claim 之后还要经 pre-step 决策，不等于直接发送模型。'),
 ('step','④ 重试不重复追加用户消息','      if (firstAttempt) {',7,'firstAttempt 只在一个 Step 的首次请求为真。'),
 ('prepare-call','⑤ 一次绑定只分发一次','      stream: (options: GenerateOptions)',15,'检查分发次数与已解析配置，固定 adapter registration。'),
 ('build-request','⑥ 从投影构建冻结请求','    const boundaryMessages = session.deriveMessages()',17,'这里没有单独的 system 字段。'),
 ('attempt','⑦ chunk 累积与瞬时发布','  push(chunk:',12,'这个方法负责累积与发布，不逐 chunk 追加 session 事件。'),
 ('attempt','⑧ 先追加持久事实再发布 end','    let seq: SessionSeq',19,'追加失败走 abandon；成功后提交终态通知。'),
 ('step','⑨ 工具调用决定后续步骤',"        if (finish.kind === 'max-tokens')",10,'没有调用则 completed，有调用则交给执行器，并检查 concludesTurn。'),
 ('retry-policy','⑩ 退避等待可取消',"    agent.session.append('llm/retry', eventData)",4,'先写 retry，再等待，再写 retry-started。'),
 ('send','⑪ 取消默认清空队列','  cancel(cause:',7,'keepInbox 是显式选择，不恢复已 claim 输入。'),
]
blocks=[]; records=[]
for i,(key,title,marker,count,note) in enumerate(excerpts):
 path=sources[key]['path'];lines=(UP/path).read_text().splitlines();start=next(j for j,l in enumerate(lines) if l.startswith(marker));selected=lines[start:start+count]
 snippet='\n'.join(f'<span class="source-line"><span class="line-number" aria-hidden="true">{start+j+1}</span>{html.escape(l)}</span>' for j,l in enumerate(selected))
 blocks.append(f'<details class="source-block" id="excerpt-{i}"><summary>{title}<span class="source-title">{path} · L{start+1}–L{start+count}</span></summary><div class="details-body"><p>{note}</p><pre><code>{snippet}</code></pre><a href="{base+path}#L{start+1}-L{start+count}" target="_blank" rel="noopener">固定提交中的完整上下文 ↗</a></div></details>')
 records.append({'id':f'excerpt-{i}','path':path,'start':start+1,'end':start+count})
p=ROOT/'lessons/03/index.html';s=p.read_text()
def resolve(m):
 attrs=re.sub(r'\s+(href|target|rel)="[^"]*"','',m[1]);return '<a'+attrs+' href="'+sources[m[2]]['url']+'" target="_blank" rel="noopener">'
s=re.sub(r'<a([^>]*\bdata-ref="([^"]+)"[^>]*)>',resolve,s)
region='<!-- SOURCE_EXCERPTS_START -->\n'+'\n'.join(blocks)+'\n<!-- SOURCE_EXCERPTS_END -->'
if '<!-- SOURCE_EXCERPTS -->' in s:s=s.replace('<!-- SOURCE_EXCERPTS -->',region)
else:s=re.sub(r'<!-- SOURCE_EXCERPTS_START -->.*?<!-- SOURCE_EXCERPTS_END -->',lambda _:region,s,flags=re.S)
p.write_text(s);manifest['excerpts']=records;manifest['checked_on']='2026-10-09'
(ROOT/'lessons/03/sources.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');(ROOT/'lessons/03/sources.js').write_text('window.LESSON_SOURCES = '+json.dumps(manifest,ensure_ascii=False)+';\n')
print('Lesson 03: resolved',len(sources),'source entries;',len(records),'exact excerpts.')
