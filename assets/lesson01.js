(function() {
'use strict';
const $ = id => document.getElementById(id);
const sources = window.LESSON_SOURCES.sources;
const models = window.DSHLessonModels;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const stepLabels = ['命令', 'Profile', '叠层', 'Context', '宿主准备', '挂载', '就绪', 'Agent', '任务'];
const profile = $('profile-choice');
let bootStep = 0;
let playing = null;
function sourceLink(element, key) {
  element.href = sources[key].url;
  element.target = '_blank';
  element.rel = 'noopener';
}
function bootStages(mode) {
  const bundles = mode === 'web' ? 'dsh-base → dsh-web-app' : mode === 'headless' ? 'dsh-base → dsh-headless' : 'dsh-sdk-minimal（不含 dsh-base）';
  const list = [
    ['解析命令', 'runCli() 把解析结果分派到 Profile 启动。Profile 名、Patch 路径与应用内部参数分别传给 runProfile()；此时没有因为这一步而发起模型请求。', 'DshInvocation', '尚未发生', 'cli'],
    ['准备 Profile 与包解析', 'prepareProfile() 读取或初始化具名组装，并重写空的根 cordis.yml。此入口的 Bundle 顺序为：' + bundles + '。composeProfile() 同时准备运行时包解析和本次覆盖文件。', 'Profile / RuntimeResolution', '尚未发生', 'runner'],
    ['形成有序 Patch 列表', '按 Bundle、Profile、Home、CLI 的顺序收集覆盖；适用时再追加遥测禁用层。这是配置数据的顺序，尚不能推断所有插件的激活顺序。', 'PatchOptions[]', '尚未发生', 'stack'],
    ['创建根 Context，安装 Loader', 'boot() 创建 Cordis 根上下文并安装 Loader，为后续条目提供加载和生命周期机制。一个 Context 不是发给语言模型的 messages。', 'Context / Loader', '尚未发生', 'boot'],
    ['提供宿主服务', '在配置树条目挂载前，prepare 回调提供 Profile 信息、环境快照、包解析与 cmdlineArgs。依赖这些服务的插件随后可以从上下文取得它们。', '宿主服务与启动参数', '尚未发生', 'runner'],
    ['挂载条目，等待并审计', 'Include 将 Patch 应用到空根并交给 Loader。插件按依赖具备条件后激活；启动审计区分关键失败与可选失败。Web 中的 Preset 声明也会预先加载并保留可用性诊断。', '已挂载的配置树', '本图尚未提交任务', 'audit'],
    ['入口可服务', mode === 'web' ? '根 Fiber 仍活跃且启动未被中断时，提交 appReady。Web 的就绪行为与打开页面发生在其相应生命周期中；就绪不等于用户已经发出了任务。' : mode === 'headless' ? 'Headless 是直接任务运行器，可能在整个启动还在结算时完成并关闭应用。这里为教学将入口与任务分开列出，并不主张其任务一定等待 appReady 后才开始。' : 'SDK 的 JSON-RPC 入口按该 Profile 组装启动。客户端还需要提交请求；sdk-minimal 不会因为名称里有 minimal 就等同于 Web 的 minimal Preset。', '应用入口 / 运行器', '由具体入口决定', 'ready'],
    ['创建或取得 Agent', mode === 'web' ? '假设用户新建 Standard 会话：调用方在 Agent 准备流程中选择能力组合。注册表把 Agent 作用域绑定到 Preset 的已挂载版本。已有会话的恢复有自己的路径，本图展示新建情况。' : mode === 'headless' ? '直接运行器经 Agent 核心注册表创建新 Agent，或按 session-id 采用指定会话；不能机械套用 Web 的 Preset 选择流程。' : '客户端通过 SDK 协议驱动该精简 Profile 提供的 Agent 能力。这里没有把 Web 的 Preset 系统自动加入精简 SDK。', 'Agent / Session / Scope', '任务尚需被驱动', mode === 'web' ? 'registry' : mode === 'headless' ? 'headless' : 'profiles'],
    ['进入任务执行', '示例输入“读取配置，修正错误，再运行检查”进入执行循环。Loop 组织上下文与工具 Schema，请求模型，并调度返回的工具调用。具体次数、结果与错误取决于实际执行；此页面没有真实请求模型。', '一次 Turn，内含若干 Step', '模拟：从这里进入请求链', 'architecture']
  ];
  return list;
}
function renderBoot() {
  const mode = profile.value;
  const current = bootStages(mode)[bootStep];
  $('boot-command').textContent = mode === 'headless' ? 'dsh headless "task"' : 'dsh ' + mode;
  $('boot-step-count').textContent = '阶段 ' + String(bootStep + 1).padStart(2, '0') + ' / 09';
  $('boot-title').textContent = current[0];
  $('boot-description').textContent = current[1];
  $('boot-object').textContent = current[2];
  $('boot-model').textContent = current[3];
  sourceLink($('boot-source'), current[4]);
  $('boot-counter').textContent = (bootStep + 1) + ' / 9';
  $('boot-prev').disabled = bootStep === 0;
  $('boot-next').disabled = bootStep === 8;
  [...$('boot-rail').children].forEach((button, i) => {
    if (i === bootStep) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
}
function stopPlayback() {
  if (playing !== null) clearInterval(playing);
  playing = null;
  $('boot-play').textContent = '自动播放';
  $('boot-play').setAttribute('aria-pressed', 'false');
}
stepLabels.forEach((label, i) => {
  const button = document.createElement('button');
  button.type = 'button'; button.textContent = (i + 1) + ' ' + label;
  button.addEventListener('click', () => { stopPlayback(); bootStep = i; renderBoot(); });
  $('boot-rail').append(button);
});
$('boot-next').addEventListener('click', () => { stopPlayback(); bootStep = Math.min(8, bootStep + 1); renderBoot(); });
$('boot-prev').addEventListener('click', () => { stopPlayback(); bootStep = Math.max(0, bootStep - 1); renderBoot(); });
$('boot-reset').addEventListener('click', () => { stopPlayback(); bootStep = 0; renderBoot(); });
profile.addEventListener('change', () => { stopPlayback(); bootStep = 0; renderBoot(); });
$('boot-play').addEventListener('click', () => {
  if (playing !== null) { stopPlayback(); return; }
  if (reducedMotion.matches) return;
  if (bootStep === 8) { bootStep = 0; renderBoot(); }
  $('boot-play').textContent = '暂停'; $('boot-play').setAttribute('aria-pressed', 'true');
  playing = setInterval(() => {
    bootStep = Math.min(8, bootStep + 1); renderBoot();
    if (bootStep === 8) stopPlayback();
  }, 7000);
});
function motionPreference() { stopPlayback(); $('boot-play').disabled = reducedMotion.matches; $('boot-play').title = reducedMotion.matches ? '系统偏好减少动画，请使用单步操作' : ''; }
reducedMotion.addEventListener('change', motionPreference);
document.addEventListener('visibilitychange', () => { if (document.hidden) stopPlayback(); });
renderBoot(); motionPreference();
function renderPatches() {
  const options = { profile: $('patch-profile').checked, home: $('patch-home').checked, cli: $('patch-cli').checked, typo: $('patch-typo').checked };
  const result = models.computePatch(options);
  $('patch-input').textContent = result.layers.map(layer => layer.label + (layer.accepted === false ? ' [跳过]' : '') + ':\n  ' + JSON.stringify(layer.config)).join('\n\n');
  $('patch-output').textContent = JSON.stringify(result.target, null, 2);
  const retry = Object.hasOwn(result.target.config, 'retries') ? 'retries 为 ' + result.target.config.retries + '。' : 'retries 已从 config 消失；插件激活时是否补默认值，要看其 Schema。';
  $('patch-message').textContent = result.winner + ' 层最后生效：timeout 为 ' + result.target.config.timeout + '，' + retry;
  $('patch-warning').textContent = result.warnings.join(' ');
}
['patch-profile', 'patch-home', 'patch-cli', 'patch-typo'].forEach(id => $(id).addEventListener('change', () => {
  if (id === 'patch-typo' && $('patch-typo').checked) $('patch-cli').checked = true;
  if (id === 'patch-cli' && !$('patch-cli').checked) $('patch-typo').checked = false;
  renderPatches();
}));
renderPatches();
let revision = 0;
function renderRevision() {
  const state = models.revisionStages[revision];
  document.querySelectorAll('[data-timeline-step]').forEach(button => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.timelineStep) === revision));
  });
  document.querySelectorAll('[data-timeline-column]').forEach(cell => {
    cell.classList.toggle('selected', Number(cell.dataset.timelineColumn) === revision);
  });
  $('timeline-selection').textContent = '当前：T' + revision + ' · ' + state.title;

  $('rev1-status').textContent = state.v1;
  $('rev2-status').textContent = state.v2;
  $('revision-v1').className = 'revision' + (state.retired ? ' retired' : '') + (state.gone ? ' gone' : '');
  $('revision-v2').className = 'revision' + (revision < 2 ? ' gone' : '');
  for (const version of ['v1', 'v2']) {
    const container = $(version === 'v1' ? 'rev1-agents' : 'rev2-agents');
    container.replaceChildren();
    for (const agent of ['a', 'b']) {
      if (state[agent] !== version) continue;
      const chip = document.createElement('span'); chip.className = 'agent-chip'; chip.textContent = 'Agent ' + agent.toUpperCase(); container.append(chip);
    }
  }
  $('revision-story').textContent = state.story;
  $('revision-prev').disabled = revision === 0;
  $('revision-next').disabled = revision === 4;
  $('revision-next').textContent = state.next;
  $('revision-counter').textContent = (revision + 1) + ' / 5';
}
document.querySelectorAll('[data-timeline-step]').forEach(button => {
  button.addEventListener('click', () => { revision = Number(button.dataset.timelineStep); renderRevision(); });
});
$('revision-prev').addEventListener('click', () => { revision = Math.max(0, revision - 1); renderRevision(); });
$('revision-next').addEventListener('click', () => { revision = Math.min(4, revision + 1); renderRevision(); });
$('revision-reset').addEventListener('click', () => { revision = 0; renderRevision(); });
renderRevision();
const sections = [...document.querySelectorAll('.lesson-section')];
const navLinks = [...document.querySelectorAll('.toc a')];
let scrollPending = false;
function updateReading() {
  const maximum = document.documentElement.scrollHeight - innerHeight;
  const position = maximum > 0 ? Math.max(0, Math.min(100, scrollY / maximum * 100)) : 100;
  $('reading-progress').value = position;
  $('reading-percent').textContent = '阅读位置 ' + Math.round(position) + '%';
  let active = sections[0];
  for (const section of sections) if (section.getBoundingClientRect().top < 160) active = section;
  navLinks.forEach(link => {
    const yes = link.hash === '#' + active.id;
    link.classList.toggle('active', yes);
    if (yes) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
  scrollPending = false;
}
window.addEventListener('scroll', () => { if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateReading); } }, { passive: true });
window.addEventListener('resize', updateReading);
$('mobile-nav').addEventListener('change', event => {
  if (event.target.value) location.hash = event.target.value;
});
updateReading();
})();
