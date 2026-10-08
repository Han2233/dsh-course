# -*- coding: utf-8 -*-
"""Regenerate only lesson 02 citations from the pinned, read-only checkout."""
from pathlib import Path
import json,re,html,subprocess
ROOT=Path(__file__).resolve().parents[1]; UP=ROOT.parent/'deepseek-harness'
SHA='5badb15009ae1756c3afe0ae0cef1faafc290ccc'
assert subprocess.check_output(['git','-C',str(UP),'rev-parse','HEAD'],text=True).strip()==SHA
base=f'https://github.com/deepseek-ai/deepseek-harness/blob/{SHA}/'
specs={
 'primer':('docs/cordis-primer.zh.md','## 五个核心概念',0),
 'context':('vendor/cordis/src/context.ts','export class Context',0),
 'registry':('vendor/cordis/src/registry.ts','  plugin(plugin: Plugin',0),
 'service':('vendor/cordis/src/service.ts','export abstract class Service',0),
 'reflect':('vendor/cordis/src/reflect.ts','  static handler:',0),
 'provide':('vendor/cordis/src/reflect.ts','  provide(name: string, value?: any, check?',0),
 'fiber-refresh':('vendor/cordis/src/fiber.ts','  _checkImpl(name:',44),
 'fiber-reload':('vendor/cordis/src/fiber.ts','  private async _reload()',28),
 'fiber-unload':('vendor/cordis/src/fiber.ts','  private async _unload()',24),
 'fiber-await':('vendor/cordis/src/fiber.ts','  async await()',7),
 'effect':('vendor/cordis/src/fiber.ts',"  effect(execute: () => Effect, label =",0),
 'restart':('vendor/cordis/src/fiber.ts','  async restart()',0),
 'events':('vendor/cordis/src/events.ts','export function isBailed',0),
 'scope-code':('packages/core/scope/src/index.ts','export function bindScopeParent',0),
 'scope-doc':('packages/core/scope/README.zh.md','## 概述',0),
 'scope-tests':('packages/core/scope/tests/scope.spec.ts',"  it('admits an ancestor-tagged",30),
 'tool-fs':('packages/fs/tool-fs/src/index.ts',"export const inject =",60),
 'tools-register':('packages/core/tools/src/index.ts','  register(definition: ToolDefinition)',26),
 'lifecycle-tests':('packages/extensions/tool-cordis/tests/cordis-lifecycle.spec.ts',"describe('Cordis effect ownership'",0),
 'hmr-queue':('packages/boot/hmr/src/index.ts','  runExclusive<T>',9),
 'hmr-replace':('packages/boot/hmr/src/index.ts','    const rollback = () =>',107),
 'hmr-doc':('packages/boot/hmr/README.zh.md','## 概述',0),
}
manifest=json.loads((ROOT/'lessons/01/sources.json').read_text()); sources=manifest['sources']
for key,(path,marker,count) in specs.items():
 lines=(UP/path).read_text().splitlines(); start=next(i+1 for i,l in enumerate(lines) if l.startswith(marker));end=min(len(lines),start+count-1) if count else None
 sources[key]={'path':path,'start':start,'end':end,'url':base+path+f'#L{start}'+(f'-L{end}' if end else ''),'description':key}
excerpts=[
 ('context','① extend 只建立子视图','  extend(meta = {})',11,'观察 Object.create；这里没有新建 Fiber。'),
 ('registry','② 一次 plugin 调用建立一个 Fiber','    const fiber = new Fiber',6,'Runtime 可复用，而 Fiber 每次新建；then 委托给 fiber.await。'),
 ('provide','③ 撤销服务时通知依赖者','      return async () => {',7,'先删除实现，再等待受影响 Fiber 稳定，最后撤掉自身依赖快照中的访问。'),
 ('fiber-refresh','④ epoch 来源于依赖提供者','  _refresh()',14,'任何一项缺失都会使 epoch 变成 INACTIVE。'),
 ('effect','⑤ 同一 effect 内逆序等待','      for (const disposable of disposables.splice(0).reverse())',11,'这里是一个 effect 收集的 disposer 列表，不是全局 effect 次序。'),
 ('fiber-unload','⑥ Fiber 并行清理多个 effect','  private async _unload()',13,'Promise.all 并行等待，单项错误记录到 logger。'),
 ('events','⑦ bail 判断不是 truthy','export function isBailed',3,'0 与空字符串不在继续集合中。'),
 ('events','⑧ waterfall 把 next 传到内层','  waterfall(...args: any[])',10,'不调用 next 就不会触达剩余监听或核心。'),
 ('tool-fs','⑨ 可选能力使用嵌套注入',"  ctx.inject(['attachments']",3,'read_image 的附加依赖只包住这一项能力。'),
 ('hmr-queue','⑩ 串行队列不被一次失败永久阻塞','  runExclusive<T>',9,'嵌套事务拒绝；保存 catch 后的链以继续处理下一项。'),
]
blocks=[]; records=[]
for i,(key,title,marker,count,note) in enumerate(excerpts):
 path=sources[key]['path'];lines=(UP/path).read_text().splitlines();start=next(j for j,l in enumerate(lines) if l.startswith(marker));selected=lines[start:start+count]
 snippet='\n'.join(f'<span class="source-line"><span class="line-number" aria-hidden="true">{start+j+1}</span>{html.escape(l)}</span>' for j,l in enumerate(selected))
 blocks.append(f'<details class="source-block" id="excerpt-{i}"><summary>{title}<span class="source-title">{path} · L{start+1}–L{start+count}</span></summary><div class="details-body"><p>{note}</p><pre><code>{snippet}</code></pre><a href="{base+path}#L{start+1}-L{start+count}" target="_blank" rel="noopener">固定提交中的完整上下文 ↗</a></div></details>')
 records.append({'id':f'excerpt-{i}','path':path,'start':start+1,'end':start+count})
p=ROOT/'lessons/02/index.html';s=p.read_text()
def resolve(m):
 attrs=re.sub(r'\s+(href|target|rel)="[^"]*"','',m[1]);return '<a'+attrs+' href="'+sources[m[2]]['url']+'" target="_blank" rel="noopener">'
s=re.sub(r'<a([^>]*\bdata-ref="([^"]+)"[^>]*)>',resolve,s)
region='<!-- SOURCE_EXCERPTS_START -->\n'+'\n'.join(blocks)+'\n<!-- SOURCE_EXCERPTS_END -->'
if '<!-- SOURCE_EXCERPTS -->' in s:s=s.replace('<!-- SOURCE_EXCERPTS -->',region)
else:s=re.sub(r'<!-- SOURCE_EXCERPTS_START -->.*?<!-- SOURCE_EXCERPTS_END -->',lambda _:region,s,flags=re.S)
p.write_text(s);manifest['excerpts']=records
(ROOT/'lessons/02/sources.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');(ROOT/'lessons/02/sources.js').write_text('window.LESSON_SOURCES = '+json.dumps(manifest,ensure_ascii=False)+';\n')
p=ROOT/'THIRD_PARTY_NOTICES.md';notice=p.read_text();heading='## Cordis 内核（仓库内 vendor 版本）'
if heading not in notice:p.write_text(notice+'\n'+heading+'\n\n第二课引用 `vendor/cordis/src/`，固定至同一提交。\n\n```text\n'+(UP/'vendor/cordis/LICENSE').read_text()+'```\n')
print('Lesson 02: resolved',len(sources),'source entries;',len(records),'exact excerpts.')
