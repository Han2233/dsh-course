"""Validate the published static pages and verify source excerpts against the pinned checkout."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote
import json, re, subprocess
ROOT=Path(__file__).resolve().parents[1]
UPSTREAM=ROOT.parent/'deepseek-harness'
class Document(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True); self.ids=[]; self.links=[]; self.text=[]; self.stack=[]; self.errors=[]
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs)
  if 'id' in attrs:self.ids.append(attrs['id'])
  if tag=='a':
   assert attrs.get('href'), f'Anchor without href: {attrs}'
   self.links.append(attrs['href'])
  if tag in ('script','link'):
   self.links.append(attrs.get('src',attrs.get('href','')))
  if tag not in ('area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'):
   self.stack.append(tag)
 def handle_endtag(self,tag):
  if not self.stack or self.stack[-1]!=tag:
   self.errors.append(f'Unexpected </{tag}> after {self.stack[-3:]}')
  else:self.stack.pop()
 def handle_data(self,data):self.text.append(data)
manifest=json.loads((ROOT/'lessons/01/sources.json').read_text())
assert subprocess.check_output(['git','-C',str(UPSTREAM),'rev-parse','HEAD'],text=True).strip()==manifest['commit']
html_files=list(ROOT.glob('*.html'))+list((ROOT/'lessons').glob('*/index.html'))
for p in html_files:
 document=Document(); content=p.read_text(); document.feed(content)
 assert not document.errors,(p,document.errors[:5])
 assert not document.stack,(p,document.stack)
 assert len(document.ids)==len(set(document.ids)),f'Duplicate IDs in {p}'
 for href in document.links:
  parsed=urlparse(href)
  if parsed.scheme or parsed.netloc:continue
  path=unquote(parsed.path)
  dest=(p.parent/path).resolve() if path else p
  if dest.is_dir():dest/= 'index.html'
  assert dest.exists(),f'Missing local target {href} in {p}'
  if parsed.fragment and dest==p:assert parsed.fragment in document.ids,f'Missing fragment {href}'
 assert '<!-- SOURCE_EXCERPTS -->' not in content
 print(f'{p.relative_to(ROOT)}: {len(document.ids)} IDs, {len(document.links)} links, balanced markup')
# Validate every linked source region and compare the inline excerpts line by line.
for key,source in manifest['sources'].items():
 if not source['path']:continue
 lines=(UPSTREAM/source['path']).read_text().splitlines()
 assert 1<=source['start']<=len(lines),key
 if source['end']:assert source['start']<=source['end']<=len(lines),key
 assert manifest['commit'] in source['url'],key
lesson=(ROOT/'lessons/01/index.html').read_text()
from html import unescape
blocks=re.findall(r'<details class="source-block" id="source-([^"]+)">(.*?)</details>',lesson,re.S)
for key,block in blocks:
 lines=(UPSTREAM/manifest['sources'][key]['path']).read_text().splitlines()
 pairs=re.findall(r'<span class="source-line"><span class="line-number" aria-hidden="true">(\d+)</span>(.*?)</span>',block)
 assert pairs,key
 for number,text in pairs:assert unescape(text)==lines[int(number)-1],(key,number)
print(f'{len(manifest["sources"])} fixed-commit sources and {len(blocks)} exact source excerpts verified')
for filename in ['lesson01.js','lesson01-models.js']:
 subprocess.run(['node','--check',str(ROOT/'assets'/filename)],check=True)
# Check that the authored interface element IDs used by the script exist.
ids=set(re.findall(r'\bid="([^"]+)"',lesson))
script=(ROOT/'assets/lesson01.js').read_text()
for element in re.findall(r"\$\('([^']+)'\)",script):assert element in ids,element
han=len(re.findall(r'[\u4e00-\u9fff]',lesson))
print(f'UI references valid; lesson contains {han} Chinese characters including code explanations')
