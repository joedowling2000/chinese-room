/* Shared experience layer: purpose labels, the discovery directory and the
   teaching panel used by the first two prototype scenes (attention and
   gradient descent). All explanations use values computed by the scenes and
   maths/learning-models.js — the panel only records, compares and renders. */
const Experiences = (() => {
  const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  const catalog = [
    {id:'linear-maps',title:'Linear maps',href:'#maths/linear-maps',anchor:'maths-linear-maps',groups:['use','train'],labels:['Forward pass','Also used in training'],kind:'Synthetic calculation',outcome:'Distinguish changing an input from changing a matrix, and see how a projection can lose information.'},
    {id:'folding',title:'Activations',href:'#maths/folding',anchor:'maths-folding',groups:['use','train'],labels:['Forward pass','Also used in training'],kind:'Synthetic calculation',outcome:'Trace a point through an affine transformation and an activation.'},
    {id:'gradient-descent',title:'Gradient descent',href:'#maths/gradient-descent',anchor:'maths-gradient-descent',groups:['train'],labels:['Training','Relevant to fine-tuning'],kind:'Synthetic calculation',outcome:'Explain how a gradient, learning rate and momentum change parameters.'},
    {id:'attention',title:'Attention',href:'#maths/attention',anchor:'maths-attention',groups:['use','train'],labels:['Forward pass','Also used in training'],kind:'Synthetic calculation',outcome:'Follow query–key scores through softmax into a weighted output.'},
    {id:'rotary',title:'Rotary positions',href:'#maths/rotary',anchor:'maths-rotary',groups:['use','train'],labels:['Forward pass','Also used in training'],kind:'Synthetic calculation',outcome:'Explore how coordinate rotations encode token positions.'},
    {id:'dimensions',title:'High dimensions',href:'#maths/dimensions',anchor:'maths-dimensions',groups:['use','train','inspect'],labels:['Representations','Interpretation'],kind:'Synthetic calculation',outcome:'Distinguish random-vector geometry from evidence of learned features.'},
    {id:'ablation',title:'Removing a direction',href:'#maths/ablation',anchor:'maths-ablation',groups:['inspect'],labels:['Intervention','Not an optimiser update'],kind:'Synthetic calculation',outcome:'Explain projection removal and why adding a vector cannot recover discarded information.'},
    {id:'mindcuber',title:'Cube scrambles and training results',href:'#lab/mindcuber',groups:['train','inspect'],labels:['Algorithm demonstration','Reported training results'],kind:'Reversal + recorded aggregates',outcome:'Distinguish undoing a known scramble from model inference and search.'},
    {id:'quantization',title:'Rounding model weights',href:'#lab/quantization',groups:['use','inspect'],labels:['Preparation for inference'],kind:'Synthetic calculation',outcome:'Relate shared scales to rounding error without equating storage with model quality.'}
  ];
  const byId = Object.fromEntries(catalog.map(c => [c.id, c]));

  const badges = id => {
    const c = byId[id];
    if (!c) return '';
    return `<span class="exp-badges">${c.labels.map(l => `<b class="exp-badge">${esc(l)}</b>`).join('')}<b class="exp-badge exp-badge-kind">${esc(c.kind)}</b></span>`;
  };
  const outcome = id => byId[id] ? byId[id].outcome : '';

  const FILTERS = [['all','All'],['use','Using a model'],['train','Training and fine-tuning'],['inspect','Inspecting and changing a model']];

  function directory(){
    return `<nav class="maths-index" id="maths-index" aria-label="Find an experience">
  <div class="maths-index-head">
    <p class="eyebrow">Directory</p>
    <h2>Find an experience</h2>
    <p>Forward-pass operations run during inference and training. Training uses loss gradients to update trainable parameters; interventions and quantisation can change a model without training it.</p>
    <div class="exp-filters" role="group" aria-label="Filter experiences by purpose">
      ${FILTERS.map(([k,l],i)=>`<button type="button" class="filter exp-filter" data-exp-filter="${k}" aria-pressed="${i===0}">${esc(l)}</button>`).join('')}
    </div>
    <p class="exp-filter-note">The filter changes this list only; every section below stays in place.</p>
  </div>
  <div class="exp-dir">
    ${catalog.map(c=>`<a class="exp-card" href="${esc(c.href)}" ${c.anchor?`data-scroll-target="${c.anchor}"`:''} data-groups="${c.groups.join(' ')}">
      <span class="exp-card-top"><b>${esc(c.title)}</b></span>
      ${badges(c.id)}
      <span class="exp-card-outcome">${esc(c.outcome)}</span>
      <span class="exp-card-go">Open →</span>
    </a>`).join('')}
  </div>
</nav>`;
  }

  function wireDirectory(root, signal){
    if (!root) return;
    const buttons = [...root.querySelectorAll('.exp-filter')];
    const cards = [...root.querySelectorAll('.exp-card')];
    buttons.forEach(b => b.addEventListener('click', () => {
      const f = b.dataset.expFilter;
      buttons.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      cards.forEach(c => c.classList.toggle('is-hidden', f !== 'all' && !c.dataset.groups.split(' ').includes(f)));
    }, {signal}));
  }

  /* ---------- Teaching panel (attention + gradient descent) ---------- */

  const STAGES = ['Forward pass','Loss','Parameter update'];
  const PANELS = {
    'attention': {
      stage: 0,
      note: 'The forward pass also runs during training',
      orient: {
        control: 'Query direction, query length and score temperature',
        fixed: 'Eight keys and values. Values equal keys; no learned projection matrices are being trained.',
        watch: 'Attention weights and the weighted output vector.'
      },
      check: {
        question: 'An attention key has the largest weight. Does that mean the model will output its label next?',
        choices: [
          ['Yes, attention selects the next token.', 'Attention mixes value vectors. Vocabulary scores and next-token selection happen later.'],
          ['No, it contributes to a weighted vector.', 'Exactly. This head produces a weighted sum of values, not a vocabulary prediction.']
        ]
      }
    },
    'gradient-descent': {
      stage: 2,
      note: 'This scene updates two synthetic parameters',
      orient: {
        control: 'Two synthetic parameters, learning rate and momentum',
        fixed: 'The loss surface and its analytic gradient',
        watch: 'Proposed update, parameter values and loss before/after'
      },
      check: {
        question: 'You changed the learning-rate slider but have not applied a step. Have the parameters changed?',
        choices: [
          ['Yes, the slider trains the parameters.', 'The slider changes an optimiser setting. Parameters change only when you apply a training update.'],
          ['No, only the next update is configured.', 'Exactly. Inference uses fixed parameters; training updates them using a loss and gradients.']
        ]
      }
    }
  };

  function teachingMarkup(id){
    const p = PANELS[id];
    if (!p) return '';
    const c = byId[id];
    return `<div class="learn-head">
    <ol class="learn-strip">${STAGES.map((s,i)=>`<li${i===p.stage?' class="on"':''}>${esc(s)}</li>`).join('')}</ol>
    <p class="learn-note">${esc(p.note)}</p>
    <p class="learn-outcome"><b>Goal:</b> ${esc(c.outcome)}</p>
  </div>
  <div class="learn-feedback-bar">
    <h4 class="learn-last-h">Last action</h4>
    <p class="learn-summary">Nothing recorded yet. Change the experiment and the result will be explained here.</p>
    <p class="learn-notice"></p>
  </div>
  <details class="learn-orient"><summary>Orientation: what you control</summary>
    <dl class="learn-dl">
      <div><dt>You control</dt><dd>${esc(p.orient.control)}</dd></div>
      <div><dt>Held fixed</dt><dd>${esc(p.orient.fixed)}</dd></div>
      <div><dt>Watch</dt><dd>${esc(p.orient.watch)}</dd></div>
    </dl>
  </details>
  <div class="learn-mode" role="group" aria-label="Lesson mode">
    <button type="button" class="maths-btn learn-guided" aria-pressed="true">Guided</button>
    <button type="button" class="maths-btn learn-explore" aria-pressed="false">Explore</button>
  </div>
  <div class="learn-guide-slot"></div>
  <div class="learn-controls-slot"></div>
  <div class="learn-actions" role="group" aria-label="Experiment actions">
    <button type="button" class="maths-btn learn-undo" disabled>Undo last experiment</button>
    <button type="button" class="maths-btn learn-reset">Reset experiment</button>
    <button type="button" class="maths-btn learn-camreset">Reset camera</button>
    <button type="button" class="maths-btn learn-compare" aria-pressed="false" disabled>Compare before/after</button>
  </div>
  <p class="learn-preview" hidden>Live preview — values have not been applied yet.</p>
  <details class="learn-compare-details"><summary>Compare the values</summary>
    <div class="article-table-wrap"><table class="learn-table"><caption class="sr-only">Before and after values</caption><thead><tr><th scope="col">Quantity</th><th scope="col">Before</th><th scope="col">After</th></tr></thead><tbody class="learn-rows"></tbody></table></div>
    <details class="learn-why"><summary>Why did that happen?</summary><p class="learn-explain"></p><div class="learn-calc"></div></details>
  </details>
  <details class="learn-history"><summary>Action history</summary><ol class="learn-histlist"></ol></details>
  <details class="learn-check"><summary>Check your understanding</summary>
    <p class="learn-check-q">${esc(p.check.question)}</p>
    <div class="learn-check-opts">${p.check.choices.map((ch,i)=>`<button type="button" class="maths-btn learn-check-opt" data-i="${i}">${esc(ch[0])}</button>`).join('')}</div>
    <p class="learn-check-r" role="status"></p>
  </details>
  <p class="learn-live" aria-live="polite"></p>`;
  }

  /* Action controller. The scene supplies snapshot/restore/reset/resetCamera
     and an onCompare(ghost|null) hook; the controller records bounded before/
     after entries, drives the shared markup and never touches the camera. */
  function createTeaching(root, o){
    const q = s => root.querySelector(s);
    const ui = {
      undo:q('.learn-undo'), reset:q('.learn-reset'), cam:q('.learn-camreset'),
      compare:q('.learn-compare'), summary:q('.learn-summary'), rows:q('.learn-rows'),
      explain:q('.learn-explain'), calc:q('.learn-calc'), preview:q('.learn-preview'),
      notice:q('.learn-notice'), live:q('.learn-live'), hist:q('.learn-histlist'),
      histWrap:q('.learn-history'),
      guided:q('.learn-guided'), explore:q('.learn-explore'),
      checkR:q('.learn-check-r'), opts:q('.learn-check-opts')
    };
    const clone = v => structuredClone(v);
    let pending = null;         // {action,category,before} captured once per gesture
    const history = [];         // bounded record list (max 20)
    let compareOn = false;

    const differs = rec => JSON.stringify(rec.before) !== JSON.stringify(rec.after);
    const lastUndoable = () => {
      for (let i = history.length - 1; i >= 0; i--) if (differs(history[i])) return history[i];
      return null;
    };
    const currentBefore = () => { const r = lastUndoable(); return r ? r.before : null; };

    function renderRows(tbody, rows){
      tbody.innerHTML = (rows || []).map(([l,b,a]) => `<tr><th scope="row">${esc(l)}</th><td>${esc(b)}</td><td>${esc(a)}</td></tr>`).join('');
    }
    function renderCalc(rows){
      ui.calc.innerHTML = (rows && rows.length)
        ? `<table class="learn-table learn-table-calc"><caption class="sr-only">Calculation detail</caption><tbody>${rows.map(([l,v]) => `<tr><th scope="row">${esc(l)}</th><td>${esc(v ?? '')}</td></tr>`).join('')}</tbody></table>`
        : '';
    }
    function showFeedback(rec, announce){
      ui.preview.hidden = true;
      ui.notice.textContent = '';
      ui.summary.textContent = rec.feedback.summary;
      renderRows(ui.rows, rec.feedback.rows);
      ui.explain.textContent = rec.feedback.explanation || '';
      renderCalc(rec.feedback.calculation);
      if (announce) ui.live.textContent = `${rec.action}: ${rec.feedback.summary}`;
    }
    function syncButtons(){
      const r = lastUndoable();
      ui.undo.disabled = !r;
      ui.compare.disabled = !currentBefore();
      if (!currentBefore() && compareOn){ compareOn = false; ui.compare.setAttribute('aria-pressed','false'); o.onCompare?.(null); }
    }
    function renderHistory(){
      ui.hist.innerHTML = history.slice(-8).reverse().map(r =>
        `<li><b>${esc(r.action)}</b><span>${esc(r.feedback.summary)}</span></li>`).join('');
      ui.histWrap.hidden = !history.length;
    }

    const ctl = {
      get before(){ return currentBefore(); },
      get compare(){ return compareOn; },
      begin(action, category){
        if (!pending) pending = {action, category: category || 'input', before: clone(o.snapshot())};
      },
      commit(feedback, {announce = true} = {}){
        const after = clone(o.snapshot());
        const p = pending; pending = null;
        const rec = p
          ? {action: p.action, category: p.category, before: p.before, after, feedback}
          : {action: 'Update', category: 'input', before: after, after, feedback};
        history.push(rec);
        if (history.length > 20) history.shift();
        showFeedback(rec, announce);
        renderHistory();
        syncButtons();
        if (compareOn) o.onCompare?.(clone(currentBefore()));
      },
      preview(feedback){
        ui.preview.hidden = false;
        ui.notice.textContent = '';
        ui.summary.textContent = feedback.summary;
        renderRows(ui.rows, feedback.rows);
        ui.explain.textContent = feedback.explanation || '';
        renderCalc(feedback.calculation);
      },
      notice(text){ ui.notice.textContent = text; },
      cancelPending(){ pending = null; },
      undo(){
        o.settle?.();
        const r = lastUndoable();
        if (!r) return;
        const idx = history.lastIndexOf(r);
        history.splice(idx, 1);
        const cur = clone(o.snapshot()), restored = clone(r.before);
        o.restore(restored);
        const rec = {action: 'Undo', feedback: {
          summary: `Restored the state before “${r.action}”.`,
          explanation: 'The earlier values are shown in the After column.',
          rows: o.describe ? o.describe(cur, restored) : []
        }};
        showFeedback({...rec, action: 'Undo'}, true);
        renderHistory();
        syncButtons();
        if (compareOn) o.onCompare?.(clone(currentBefore()) || null);
      },
      reset(){
        o.cancel?.();
        pending = null; history.length = 0;
        ui.preview.hidden = true;
        compareOn = false; ui.compare.setAttribute('aria-pressed','false'); o.onCompare?.(null);
        o.reset();
        ui.summary.textContent = 'Experiment reset to its defaults.';
        renderRows(ui.rows, []);
        ui.explain.textContent = ''; ui.calc.innerHTML = '';
        ui.live.textContent = 'Experiment reset to its defaults.';
        ui.notice.textContent = '';
        renderHistory();
        syncButtons();
      },
      dispose(){ history.length = 0; pending = null; }
    };
    o.signal?.addEventListener('abort', () => ctl.dispose(), {once: true});

    ui.undo.addEventListener('click', () => ctl.undo(), {signal: o.signal});
    ui.reset.addEventListener('click', () => ctl.reset(), {signal: o.signal});
    ui.cam.addEventListener('click', () => { o.resetCamera?.(); ctl.notice('Camera reset. The experiment values are unchanged.'); }, {signal: o.signal});
    ui.compare.addEventListener('click', () => {
      compareOn = !compareOn;
      ui.compare.setAttribute('aria-pressed', String(compareOn));
      o.onCompare?.(compareOn ? clone(ctl.before) : null);
    }, {signal: o.signal});
    ui.guided.addEventListener('click', () => {
      ui.guided.setAttribute('aria-pressed','true'); ui.explore.setAttribute('aria-pressed','false');
      o.onGuided?.(true);
    }, {signal: o.signal});
    ui.explore.addEventListener('click', () => {
      ui.explore.setAttribute('aria-pressed','true'); ui.guided.setAttribute('aria-pressed','false');
      o.onGuided?.(false);
    }, {signal: o.signal});
    const panel = PANELS[o.id];
    if (panel) ui.opts.addEventListener('click', e => {
      const b = e.target.closest('.learn-check-opt');
      if (!b) return;
      ui.checkR.textContent = panel.check.choices[Number(b.dataset.i)][1];
    }, {signal: o.signal});

    renderHistory();
    return ctl;
  }

  return {catalog, badges, outcome, directory, wireDirectory, teachingMarkup, createTeaching};
})();
