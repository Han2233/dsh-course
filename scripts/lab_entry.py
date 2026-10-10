# -*- coding: utf-8 -*-
"""Shared top-of-lesson lab invitation. Keep the learning activity specific to each lesson."""
from pathlib import Path
import re
ENTRIES={
'07':('为 Agent 加上自己的审计工具','挂载扩展、比较两个版本，再验证失败与清理。','自定义工具 · 策略 · 版本验证'),
'01':('亲手组装你的第一台 Agent','切换 Preset、启动系统，再试一次加载失败。','组装 · 启动 · 清理'),
'02':('给 Agent 装上可控插件','接通服务、撤销依赖，观察插件如何启动和卸载。','安装 · 依赖 · 生命周期'),
'03':('看一条任务怎样跑起来','逐步观察模型请求与工具衔接，试试重试和取消。','请求 · 流式输出 · 取消'),
'04':('让 Agent 真正改变虚拟文件','批准一次修改，比较文件差异，再运行检查。','读文件 · 审批 · 修改验证'),
'05':('亲手管理 Agent 的记忆','保存、恢复、压缩上下文，再 Fork 一条新分支。','保存恢复 · 压缩 · 分支'),
'06':('带着两个子 Agent 一起做事','派出检查员，切换父子对话，体验消息和冷恢复。','委派 · 通信 · 冷恢复'),
}
def apply_entry(page,lesson):
 title,description,tags=ENTRIES[lesson]
 card=f'''<aside class="lab-entry" aria-label="本课交互实验室"><div class="lab-entry-copy"><span class="lab-entry-badge">本课有可操作的 Agent 实验室</span><h2>{title}</h2><p>{description}</p><small>{tags} · 浏览器内教学模拟</small></div><div class="lab-entry-action"><a class="lab-entry-button" href="#workbench">立即体验实验室 <span aria-hidden="true">↗</span></a><span>可以先体验，再读源码讲解</span></div></aside>'''
 page=re.sub(r'<aside class="lab-entry".*?</aside>','',page,flags=re.S)
 page=re.sub(r'(<header class="hero">\s*<div class="eyebrow">.*?</div>)',lambda m:m[1]+card,page,count=1,flags=re.S)
 link='<link rel="stylesheet" href="../../assets/lab-entry.css?v=1">'
 if 'assets/lab-entry.css' not in page:page=page.replace('</head>',link+'</head>',1)
 return page
if __name__=='__main__':
 root=Path(__file__).resolve().parents[1]
 for lesson in ENTRIES:
  path=root/'lessons'/lesson/'index.html'
  if path.exists():path.write_text(apply_entry(path.read_text(),lesson))
