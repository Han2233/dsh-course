# -*- coding: utf-8 -*-
from pathlib import Path
import re,json,html
ROOT=Path(__file__).resolve().parents[1];UP=ROOT.parent/'deepseek-harness'
m=json.loads((ROOT/'lessons/06/sources.json').read_text());text=(ROOT/'lessons/06/index.html').read_text()
for e in m['excerpts']:
 block=re.search(r'<details class="source-block" id="'+e['id']+r'">(.*?)</details>',text,re.S)[1]
 pairs=re.findall(r'<span class="source-line"><span class="line-number" aria-hidden="true">(\d+)</span>(.*?)</span>',block)
 assert len(pairs)==e['end']-e['start']+1
 lines=(UP/e['path']).read_text().splitlines()
 for n,line in pairs:assert html.unescape(line)==lines[int(n)-1],(e,n)
for key,src in m['sources'].items():
 assert m['commit'] in src['url']
 if src['path']:assert 1<=src['start']<=len((UP/src['path']).read_text().splitlines())
print('Lesson 06:',len(m['excerpts']),'exact excerpts and',len(m['sources']),'pinned source references verified;',len(re.findall(r'[\u4e00-\u9fff]',text)),'Chinese characters including excerpts.')
