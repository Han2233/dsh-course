# -*- coding: utf-8 -*-
"""Regenerate only lesson 05 citations from the pinned, read-only checkout."""
from pathlib import Path
import json,re,html,subprocess
ROOT=Path(__file__).resolve().parents[1]; UP=ROOT.parent/'deepseek-harness'
SHA='5badb15009ae1756c3afe0ae0cef1faafc290ccc'
assert subprocess.check_output(['git','-C',str(UP),'rev-parse','HEAD'],text=True).strip()==SHA
base=f'https://github.com/deepseek-ai/deepseek-harness/blob/{SHA}/'
specs={
 'session-doc':('packages/core/session/README.md','# @deepseek-ai',0),
 'append':('packages/core/session/src/index.ts','  append<T extends',0),
 'derive':('packages/core/session/src/index.ts','  deriveMessages()',0),
 'flush':('packages/core/session/src/index.ts','  async flush(session:',0),
 'restore':('packages/core/session/src/index.ts','  static fromRestore(',0),
 'session-fork':('packages/core/session/src/index.ts','  fork(source:',0),
 'session-types':('packages/core/session/src/types.ts','export type SessionSeq =',0),
 'surface':('packages/core/session/src/surface.ts','export function isAppendSurfaceEvent(',0),
 'replace':('packages/core/session/src/surface.ts','  const startIdx = state.nodes.indexOf(op.startSeq)',0),
 'request-header':('packages/core/session/src/request-header.ts','export function foldRequestHeader(',0),
 'tool-history':('packages/core/session/src/tool-history.ts','/**',0),
 'repair':('packages/core/session/src/repair.ts','export function openTurnClosers(',0),
 'fork-seed':('packages/core/session/src/fork.ts','export function buildForkSeed(',0),
 'fork-tests':('packages/core/session/tests/fork.spec.ts',"  it('closes an empty open turn",0),
 'checkpoint-policy':('packages/session/session-checkpoint-policy/src/index.ts','export function apply(',0),
 'jsonl-append':('packages/session/session-persistence-jsonl/src/index.ts','  private async appendLines(',0),
 'jsonl-doc':('packages/session/session-persistence-jsonl/README.md','# @deepseek-ai',0),
 'instructions':('packages/context/agent-instructions/src/index.ts','export function apply(',0),
 'instruction-boundary':('packages/context/agent-instructions/src/index.ts',"  ctx.on('agent/pre-step'",0),
 'skill-load':('packages/skill/tool-skill/src/index.ts','    async execute(args, exec)',0),
 'skill-invoke':('packages/skill/tool-skill/src/index.ts',"  ctx.on('agent/pre-step'",0),
 'prune-content':('packages/compaction/compaction-tool-result-pruner/src/index.ts','  pruneContent(',0),
 'prune-session':('packages/compaction/compaction-tool-result-pruner/src/index.ts','  pruneSession(',0),
 'prune-tests':('packages/compaction/compaction-tool-result-pruner/tests/tool-result-pruner.spec.ts',"  it('replays to the identical",0),
 'basic-pressure':('packages/compaction/compaction-basic/src/index.ts','  override async compactIfNeeded(',0),
 'basic-config':('packages/compaction/compaction-basic/src/config.ts','export function resolveCompactSpec(',0),
 'range':('packages/compaction/compaction-basic/src/region.ts','export function selectCompactableRange(',0),
 'compact-transaction':('packages/compaction/compaction-basic/src/region.ts','export async function compactSurfaceRegion(',0),
 'compact-commit':('packages/compaction/compaction-basic/src/region.ts','function commitCompactionBody(',0),
 'summarizer':('packages/compaction/compaction-basic/src/summarizer.ts','export async function summarizeWithLlm(',0),
 'image-projection':('packages/compaction/compaction-image-offload/src/projection.ts','export const imageOffloadProjection:',0),
}
manifest=json.loads((ROOT/'lessons/04/sources.json').read_text()); sources=manifest['sources']
for key,(path,marker,count) in specs.items():
 lines=(UP/path).read_text().splitlines(); start=next(i+1 for i,l in enumerate(lines) if l.startswith(marker));end=min(len(lines),start+count-1) if count else None
 sources[key]={'path':path,'start':start,'end':end,'url':base+path+f'#L{start}'+(f'-L{end}' if end else ''),'description':key}
excerpts=[
 ('append','① 冻结事件并验证 Surface','    const event = deepFreeze({',9,'校验发生在日志写入之前。'),
 ('derive','② 按当前节点派生消息','    for (const seq of nodes.slice(this.derivedNodes))',12,'节点顺序属于 Surface；不是日志数组的简单角色过滤。'),
 ('surface','③ 人类对话保留 append-origin','export function isAppendSurfaceEvent(',5,'replacement 不应覆盖用户已经见过的对话。'),
 ('flush','④ 等待所有检查点收敛','    const results = await Promise.allSettled',14,'失败在全部监听者结束后报告；无监听者时返回 false。'),
 ('checkpoint-policy','⑤ 顶层工具体前先持久化',"  ctx.on('tools/execute'",6,'嵌套调用复用外层检查点。'),
 ('jsonl-append','⑥ 写入并同步，失败回退','        await handle.writeFile(content)',11,'物理后端的写入完成与内存 append 不同。'),
 ('fork-seed','⑦ 前缀、标记和开放尾部收尾','export function buildForkSeed(',10,'inheritedEventCount 不包含后来生成的子会话收尾。'),
 ('prune-session','⑧ 同一工具结果的替换记录',"      const replacement = session.append('tool/result'",8,'保留结果身份，只替换投影内容。'),
 ('range','⑨ 选区不能拆开工具配对','  while (keepFromIdx > firstIdx)',5,'保留尾部边界往前调整，直到工具配对完整。'),
 ('compact-commit','⑩ 摘要最终进入 replacement 消息',"  session.append('user/message', checkpointMessage",4,'日志保存摘要证据与被遮蔽节点的关联。'),
 ('instruction-boundary','⑪ 已接受步骤才接纳指令变化',"    if (decision.kind === 'reject' || (step === 1",4,'拒绝或空的首步不会随意独立发送上下文。'),
 ('skill-load','⑫ Skill 加载重新验证调用资格','      const lookup = { cwd: exec.agent?',11,'查询使用调用者作用域，目录中的名字不保证一直可用。'),
]

blocks=[]; records=[]
for i,(key,title,marker,count,note) in enumerate(excerpts):
 path=sources[key]['path'];lines=(UP/path).read_text().splitlines();start=next(j for j,l in enumerate(lines) if l.startswith(marker));selected=lines[start:start+count]
 snippet='\n'.join(f'<span class="source-line"><span class="line-number" aria-hidden="true">{start+j+1}</span>{html.escape(l)}</span>' for j,l in enumerate(selected))
 blocks.append(f'<details class="source-block" id="excerpt-{i}"><summary>{title}<span class="source-title">{path} · L{start+1}–L{start+count}</span></summary><div class="details-body"><p>{note}</p><pre><code>{snippet}</code></pre><a href="{base+path}#L{start+1}-L{start+count}" target="_blank" rel="noopener">固定提交中的完整上下文 ↗</a></div></details>')
 records.append({'id':f'excerpt-{i}','path':path,'start':start+1,'end':start+count})
p=ROOT/'lessons/05/index.html';s=p.read_text()
def resolve(m):
 attrs=re.sub(r'\s+(href|target|rel)="[^"]*"','',m[1]);return '<a'+attrs+' href="'+sources[m[2]]['url']+'" target="_blank" rel="noopener">'
s=re.sub(r'<a([^>]*\bdata-ref="([^"]+)"[^>]*)>',resolve,s)
region='<!-- SOURCE_EXCERPTS_START -->\n'+'\n'.join(blocks)+'\n<!-- SOURCE_EXCERPTS_END -->'
if '<!-- SOURCE_EXCERPTS -->' in s:s=s.replace('<!-- SOURCE_EXCERPTS -->',region)
else:s=re.sub(r'<!-- SOURCE_EXCERPTS_START -->.*?<!-- SOURCE_EXCERPTS_END -->',lambda _:region,s,flags=re.S)
p.write_text(s);manifest['excerpts']=records;manifest['checked_on']='2026-10-10'
(ROOT/'lessons/05/sources.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');(ROOT/'lessons/05/sources.js').write_text('window.LESSON_SOURCES = '+json.dumps(manifest,ensure_ascii=False)+';\n')
print('Lesson 05: resolved',len(sources),'source entries;',len(records),'exact excerpts.')
