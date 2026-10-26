/* Shared experience layer: purpose labels and the discovery directory for the
   seven maths topics (each paired with its Interiors artwork) and the two lab examples. */
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

  return {catalog, badges, outcome, directory, wireDirectory};
})();
