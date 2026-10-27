/* Shared experience layer: purpose labels and outcomes for the seven maths
   topics and the two lab examples. */
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

  return {catalog, badges, outcome};
})();
