"""Extract pinned upstream excerpts and resolve lesson source citations.
Run: python3 scripts/prepare_sources.py [path-to-deepseek-harness]
Requires a checkout at the recorded commit; never executes upstream code.
"""
from pathlib import Path
import sys, json, re, html, subprocess
COURSE = Path(__file__).resolve().parents[1]
UPSTREAM = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else COURSE.parent / 'deepseek-harness'
SHA = '5badb15009ae1756c3afe0ae0cef1faafc290ccc'
actual = subprocess.check_output(['git', '-C', str(UPSTREAM), 'rev-parse', 'HEAD'], text=True).strip()
if actual != SHA:
    raise SystemExit(f'Source snapshot mismatch: expected {SHA}, found {actual}')
BASE = f'https://github.com/deepseek-ai/deepseek-harness/blob/{SHA}/'
# id: (path, identifying first line, number of lines for the linked region, description)
specs = {
'architecture': ('docs/architecture.zh.md', '# DeepSeek Harness', 0, '整体架构、轮次流程与扩展归属'),
'packages': ('packages/README.md', '# Packages', 0, '能力分组职责'),
'cordis-primer': ('docs/cordis-primer.zh.md', '## 五个核心概念', 0, 'Cordis 概念与可逆注册'),
'cli': ('apps/cli/src/bin.ts', 'export async function runCli', 25, 'CLI 的 Profile 分派'),
'profiles': ('packages/boot/app-boot/src/profile.ts', 'export const PROFILE_TEMPLATES:', 18, '随附 Profile 的 Bundle 列表'),
'profile-structure': ('packages/boot/app-boot/src/profile.ts', '/** A loaded profile:', 20, 'Profile 的组成'),
'bundle-skipped': ('packages/boot/app-boot/src/profile.ts', 'export function reportSkippedBundles', 6, '跳过的 Bundle 诊断'),
'runner': ('apps/cli/src/profile-boot.ts', 'export function prepareProfile', 0, 'Profile 准备与启动'),
'stack': ('packages/boot/app-boot/src/profile-context.ts', 'export function resolveTelemetryPatch', 29, '有序覆盖与遥测特殊层'),
'patch-algorithm': ('vendor/include/src/index.ts', 'export function applyEntryPatches', 76, '条目补丁算法'),
'boot': ('packages/boot/app-boot/src/index.ts', 'export async function boot(', 43, 'Context、Loader、宿主准备、Include 与审计'),
'ready': ('apps/cli/src/profile-boot.ts', '    if (!signalShutdown.signal.aborted', 8, '应用就绪信号的提交条件'),
'audit': ('packages/boot/app-boot/src/index.ts', 'export async function auditStartupEntries(', 17, '关键与可选启动失败的区别'),
'web-manifest': ('packages/bundle/web-app/package.json', '  "dsh": {', 13, 'Web Bundle 的多补丁文件清单'),
'base': ('packages/bundle/base/cordis.patch.yml', '    - id: agent-loop', 5, 'Base 声明默认循环且不预建 Agent'),
'web-server': ('packages/bundle/web-app/cordis.patch.yml', '    - id: webserver', 34, 'Web 服务读取启动参数'),
'web-plane': ('packages/bundle/web-app/cordis.patch.yml', '# ── the agent plane', 0, 'Web 宿主层与 Agent 层的调整'),
'headless': ('packages/bundle/headless/cordis.patch.yml', '# The dsh-headless', 0, 'Headless 直接任务运行器'),
'standard': ('packages/bundle/web-app/presets/standard.patch.yml', '- insert:', 0, 'Standard Preset 的实际声明'),
'minimal': ('packages/bundle/web-app/presets/minimal.patch.yml', '- insert:', 0, 'Minimal Preset 的实际声明'),
'preset-declare': ('packages/preset/agent-preset/src/index.ts', 'export default class AgentPreset', 22, 'Preset 声明注册到服务'),
'registry': ('packages/preset/agent-preset-registry/src/index.ts', '  async register(definition:', 0, '预加载、版本持有与作用域绑定'),
'preset-collect': ('packages/preset/agent-preset-registry/src/index.ts', '  private async collect(', 6, '已退休版本的回收条件'),
'preset-mount': ('packages/preset/agent-preset-registry/src/mount.ts', 'export async function auditRows(', 0, 'Preset 子树激活与隔离诊断'),
'preset-select': ('packages/preset/agent-preset-registry/src/index.ts', "  @Remote('select')", 17, '首次 Turn 之后拒绝切换 Preset'),
'preset-session': ('packages/preset/agent-preset-registry/src/session.ts', '/**', 0, 'Preset 选择的持久事件与投影'),
'preset-tests': ('packages/preset/agent-preset-registry/tests/registry.spec.ts', "describe('declarative preset revisions'", 100, '版本共享、替换保留与失败隔离测试'),
'stack-test': ('packages/boot/app-boot/tests/profile.spec.ts', "it('composes current files", 26, '覆盖层序与特殊层测试'),
'hmr-test': ('apps/cli/tests/profile-hmr.spec.ts', "describe('YAML-owned profile HMR'", 0, '不同 Profile 的 HMR 配置测试'),
'dump': ('apps/cli/src/dump-config.ts', 'export function runDumpConfig(', 0, '不激活插件的配置导出路径'),
'shutdown': ('apps/cli/src/process-shutdown.ts', '/**', 0, '有界关闭与重复中断升级'),
'agent-loop': ('packages/core/agent-loop/src/index.ts', 'export class AgentLoop', 0, '默认 Loop 服务与 Agent 生命周期'),
'agent-compose': ('packages/api/session-controller/src/agent.ts', '  async composeAgent(', 19, 'Web Session 控制器的 Preset 绑定回调'),
'session': ('packages/core/session/README.zh.md', '# @deepseek-ai', 0, '会话事实与派生历史'),
}
sources = {}
for key, (path, marker, count, description) in specs.items():
    lines = (UPSTREAM / path).read_text().splitlines()
    indexes = [i for i, line in enumerate(lines) if line.startswith(marker)]
    if not indexes:
        raise SystemExit(f'Cannot locate {key}: {marker!r} in {path}')
    start = indexes[0] + 1
    end = min(len(lines), start + count - 1) if count else None
    url = BASE + path + f'#L{start}' + (f'-L{end}' if end else '')
    sources[key] = dict(path=path, start=start, end=end, url=url, description=description)
sources['commit'] = dict(path='', start=None, end=None, url=f'https://github.com/deepseek-ai/deepseek-harness/tree/{SHA}', description='固定源码快照')
# Small exact excerpts, each checked against the pinned checkout. No code is executed.
excerpts = [
 ('cli', '① CLI：Profile 模式进入 runProfile', '  switch (invocation.mode)', 14, '关注分派传入的 profile、patchFiles 和 args，应用选项没有全部固化在这个入口里。'),
 ('profiles', '② 模板：同一启动器，不同应用组合', 'export const PROFILE_TEMPLATES:', 18, '比较 web、headless 与 sdk-minimal。最后一个没有 dsh-base。'),
 ('stack', '③ 覆盖层：Home 在 Profile 之后', '  const patches = structuredClone([', 12, '数组展开给出精确层序；遥测开关按条件在末尾追加。'),
 ('patch-algorithm', '④ 算法：config 整块替换的关键几行', '    for (const [key, value] of Object.entries(overrides))', 6, '这里没有递归 merge：config 只是 overrides 中的一个属性。'),
 ('boot', '⑤ 启动：Loader → prepare → Include → audit', '    await ctx.plugin(Loader)', 10, '真实顺序包含宿主准备回调；树在启动期也可能已经被运行器关闭。'),
 ('ready', '⑥ 就绪：启动通过之后仍检查活跃状态', '    if (!signalShutdown.signal.aborted', 8, '已关闭的根不会再提交 appReady。'),
 ('preset-declare', '⑦ 声明：把定义注册进 agentPresets', '  async* [Service.init]()', 4, '声明插件把定义交给注册表，版本管理在注册表中完成。'),
 ('preset-collect', '⑧ 回收：retired 与引用数必须同时满足', '  private async collect(', 6, 'retired 本身不足以立即清理。最后一个持有者释放后，才能 dispose。'),
 ('preset-select', '⑨ 选择：首个 Turn 是切换边界', "  @Remote('select')", 13, '这段是切换会话所选 Preset，与更新同一 Preset 的定义不同。'),
]
blocks=[]
for key,title,marker,count,explanation in excerpts:
    path = sources[key]['path']; lines=(UPSTREAM/path).read_text().splitlines()
    begin = next(i for i,line in enumerate(lines) if line.startswith(marker))
    selected=lines[begin:begin+count]; end=begin+len(selected)
    url=BASE+path+f'#L{begin+1}-L{end}'
    code='\n'.join(f'<span class="source-line"><span class="line-number" aria-hidden="true">{begin+i+1}</span>{html.escape(line)}</span>' for i,line in enumerate(selected))
    blocks.append(f'<details class="source-block" id="source-{key}"><summary>{html.escape(title)}<span class="source-title">{html.escape(path)} · L{begin+1}–L{end}</span></summary><div class="details-body"><p class="source-intro">{html.escape(explanation)}</p><pre><code>{code}</code></pre><a class="code-source-link" href="{url}" target="_blank" rel="noopener">在固定提交中查看完整上下文 ↗</a></div></details>')
page=COURSE/'lessons/01/index.html'
content=page.read_text()
def resolve_anchor(match):
    attributes=match.group(1); key=match.group(2)
    if key not in sources: raise ValueError(f'Unknown source key {key}')
    attributes=re.sub(r'\s+(href|target|rel)="[^"]*"','',attributes)
    return f'<a{attributes} href="{html.escape(sources[key]["url"], quote=True)}" target="_blank" rel="noopener">'
content=re.sub(r'<a([^>]*\bdata-ref="([^"]+)"[^>]*)>',resolve_anchor,content)
region='<!-- SOURCE_EXCERPTS_START -->\n'+'\n'.join(blocks)+'\n<!-- SOURCE_EXCERPTS_END -->'
if '<!-- SOURCE_EXCERPTS -->' in content:
    content=content.replace('<!-- SOURCE_EXCERPTS -->',region)
else:
    content=re.sub(r'<!-- SOURCE_EXCERPTS_START -->.*?<!-- SOURCE_EXCERPTS_END -->',lambda _:region,content,flags=re.S)
if '<script src="sources.js"' not in content:
    content=content.replace('<script src="../../assets/lesson01.js" defer></script>', '<script src="sources.js" defer></script><script src="../../assets/lesson01-models.js" defer></script><script src="../../assets/lesson01.js" defer></script>')
page.write_text(content)
manifest={'commit':SHA,'version':'0.2.1-alpha.1','checked_on':'2026-10-08','upstream_tests':'read, not executed','sources':sources}
(COURSE/'lessons/01/sources.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(COURSE/'lessons/01/sources.js').write_text('window.LESSON_SOURCES = '+json.dumps(manifest,ensure_ascii=False)+';\n')
notice='# 第三方源码说明\n\n本课程为独立学习材料，不是 DeepSeek 官方课程。页面包含以下项目的源码摘录，链接固定到提交 `'+SHA+'`。\n\n## DeepSeek Harness\n\n来源：https://github.com/deepseek-ai/deepseek-harness\n\n```text\n'+(UPSTREAM/'LICENSE').read_text()+'```\n\n## Cordis Include（仓库内 vendor 版本）\n\n来源：上述提交的 `vendor/include/`。\n\n```text\n'+(UPSTREAM/'vendor/include/LICENSE').read_text()+'```\n'
(COURSE/'THIRD_PARTY_NOTICES.md').write_text(notice)
print(f'Resolved {len(sources)} source entries and extracted {len(excerpts)} exact excerpts from {SHA[:7]}.')
