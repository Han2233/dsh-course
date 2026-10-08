/* Educational simulations. These do not execute DeepSeek Harness. */
(function(root) {
  'use strict';
  function computePatch(options) {
    const target = { id: 'demo-executor', config: { timeout: 30, retries: 2 } };
    const layers = [{ label: 'Base（插入）', config: { timeout: 30, retries: 2 } }];
    const warnings = [];
    let winner = 'Base';
    const patches = [];
    if (options.profile) patches.push({ label: 'Profile', id: target.id, config: { timeout: 60, retries: 2 } });
    if (options.home) patches.push({ label: 'Home', id: target.id, config: { timeout: 90 } });
    if (options.cli) patches.push({ label: 'CLI', id: options.typo ? 'demo-excutor' : target.id, config: { timeout: 10, retries: 1 } });
    for (const patch of patches) {
      const accepted = patch.id === target.id;
      layers.push({ ...patch, accepted });
      if (!accepted) {
        warnings.push('CLI 目标 demo-excutor 不存在：警告并跳过，本层没有修改条目。');
        continue;
      }
      // Matches the entry-level replacement rule; this is not a full Include implementation.
      target.config = { ...patch.config };
      winner = patch.label;
    }
    return { target, layers, warnings, winner };
  }
  const revisionStages = [
    { title: '定义已加载', v1: '当前版本，引用数 0', v2: '尚未发布', a: null, b: null, retired: false, gone: false,
      story: '初始状态：standard v1 已预先挂载，尚无 Agent 使用。这里的 v1 / v2 是教学版本标签，不是 dsh 产品版本号。', next: '创建 Agent A →' },
    { title: 'A 加入 v1', v1: '当前版本，引用数 1', v2: '尚未发布', a: 'v1', b: null, retired: false, gone: false,
      story: 'Agent A 的作用域加入 standard v1。这是版本引用与作用域关系；A 仍有自己的会话历史。', next: '发布新定义 v2 →' },
    { title: '定义替换，A 保留 v1', v1: '已退休，仍有 1 个引用', v2: '当前版本，引用数 0', a: 'v1', b: null, retired: true, gone: false,
      story: '旧定义退休，新定义 v2 激活。A 没有自动换装：v1 的 users 仍为 1，因此 collect() 暂不清理。', next: '创建 Agent B →' },
    { title: '两个版本并存', v1: '已退休，仍有 1 个引用', v2: '当前版本，引用数 1', a: 'v1', b: 'v2', retired: true, gone: false,
      story: 'Agent B 加入当前 v2，A 继续使用 v1。两者选的 Preset 身份都叫 standard，但已挂载版本不同。', next: '释放 Agent A →' },
    { title: '旧版本回收', v1: '已退休，引用数 0 → 已清理', v2: '当前版本，引用数 1', a: null, b: 'v2', retired: true, gone: true,
      story: 'A 释放引用。本例没有其他持有者，于是 retired 且 users === 0，v1 作用域被清理。B 继续使用 v2。', next: '演示完成' }
  ];
  const models = { computePatch, revisionStages };
  if (typeof module !== 'undefined' && module.exports) module.exports = models;
  else root.DSHLessonModels = models;
})(typeof globalThis !== 'undefined' ? globalThis : this);
