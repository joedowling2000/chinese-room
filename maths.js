/* The Maths of AI: the seven ideas in prose, each paired with its Interiors
   artwork (maths-art/). The posters here are the artworks' own live previews;
   "Step inside" opens the full piece at #maths/play/<id>. */
const Maths = (() => {
  const topics = [
  {
    id:'linear-maps',no:'01',tag:'Vectors & matrices',short:'Linear maps',
    title:'A matrix moves all of space at once.',
    body:['A 2×2 matrix records where the two basis arrows, î and ĵ, land. Every other point follows: (x, y) lands at x·î + y·ĵ, so grid lines stay straight, parallel and evenly spaced. In Lattice, dragging those two arrows moves every star.',
          'The determinant measures the change in area. Its size is the scale factor, a negative sign means the plane is mirrored, and at zero the plane collapses onto a line or a point: distinct inputs share an output, and the information that separated them is lost.',
          'Most of a transformer’s parameters sit in larger, usually rectangular matrices like this one: the token embedding, the query, key and value projections, the feed-forward layers and the unembedding that scores the vocabulary. For a rectangular matrix, rank takes the determinant’s role, counting how many independent directions survive. Fine-tuning methods such as LoRA add a low-rank update while keeping the pretrained weights fixed.'],
    formula:'[x′ y′] = [[a b] [c d]] · [x y]  ·  det = ad − bc',
    sources:[{label:'Hu et al., LoRA: Low-Rank Adaptation of Large Language Models (2021)',href:'https://arxiv.org/abs/2106.09685'}]
  },
  {
    id:'folding',no:'02',tag:'Non-linearity',short:'Folding space',
    title:'Bend, then fold.',
    body:['Two matrices in a row multiply into one, so a stack of linear maps is still a single linear map. Networks escape this with a non-linear function between layers. ReLU passes positive values through and sets negative ones to zero, which makes each neuron a hinge that creases where its input crosses zero.',
          'Between creases the network is exactly linear. Each layer bends the space the previous one produced, so creases multiply with depth, and the network can carve its input into the shapes a task needs. In Kaleidoscope each layer is one ReLU fold: every extra layer can double the number of regions, and switching the activation off leaves just one.',
          'In a transformer this is the feed-forward block that follows attention in every layer: a matrix that widens the vector, the activation, and a matrix that narrows it again. Most modern models use GELU, which scales inputs smoothly, or SwiGLU, which applies an input-dependent gate. Feed-forward layers often hold a large share of a model’s parameters.'],
    formula:'h = ReLU(W·x + b) = max(0, W·x + b)'
  },
  {
    id:'gradient-descent',no:'03',tag:'Learning',short:'Gradient descent',
    title:'Roll downhill, one step at a time.',
    body:['Training searches for parameter values that make the loss small. The loss measures how wrong the model’s predictions are on a batch of training tokens. Its gradient points the way the loss rises fastest, so each step moves the parameters a little the other way.',
          'The learning rate η sets the step size: too small and progress crawls, too large and updates overshoot and can diverge. Momentum carries part of the previous update forward, coasting through small dips but sometimes overshooting. Each seed in Descent follows the exact momentum update on a two-parameter landscape; a language model takes the same kind of step across billions of parameters.',
          'This happens in training, not when the model is used. Backpropagation computes the gradient for every parameter, and an optimiser such as AdamW turns it into an update, with per-parameter step sizes and separate weight decay. A finite step can still raise the loss, so learning rates are tuned and usually scheduled.'],
    formula:'θ ← θ − η ∇L(θ)  ·  momentum: v ← μv − η∇L, θ ← θ + v',
    sources:[{label:'Loshchilov and Hutter, Decoupled Weight Decay Regularization',href:'https://arxiv.org/abs/1711.05101'}]
  },
  {
    id:'attention',no:'04',tag:'Attention',short:'Attention',
    title:'Every token asks a question.',
    body:['Attention lets each token gather information from earlier tokens. Learned matrices project each token’s vector into a query, a key and a value. The query is scored against every earlier key by a dot product, which depends on both direction and length. Softmax turns the scores into positive weights that sum to one, and the output is the weighted sum of the values.',
          'In Loom each thread is one weight, running back to an earlier word, and the central orb is the blend; a causal mask stops any word looking ahead. Loom’s four hand-built heads track the previous word, meaning, grammatical agreement and copying. Dividing the scores by a temperature sharpens or flattens the weights. Standard attention divides by √dₖ, the key width, which is unrelated to the sampling temperature used to pick output tokens.',
          'A transformer runs many heads in parallel in every layer, each with its own matrices, which is how “it” can find the noun it refers to. Processing a prompt scores every pair of tokens, so the cost grows with the square of its length; generating each new token attends over the cached context.'],
    formula:'wᵢ = softmax(q·kᵢ / τ)  ·  output = Σ wᵢ vᵢ'
  },
  {
    id:'rotary',no:'05',tag:'Position',short:'Rotary positions',
    title:'Position as rotation.',
    body:['Attention compares queries and keys by content alone, so by itself it has no sense of token order. Rotary position embeddings (RoPE) add order by rotating pairs of coordinates in each query and key by an angle proportional to the token’s position, each pair at its own frequency.',
          'Because both vectors rotate, only the difference in angle matters: for fixed content, the positional part of the score depends on the distance n − m, not on absolute position. In Orrery each orbit is one coordinate pair, and dragging the whole sentence moves every planet without changing the score. Fast pairs wrap round within a few tokens and slow pairs change over long distances, so together they tell many distances apart.',
          'Llama, Mistral and most open models apply RoPE in every attention head, just before scoring; values are not rotated. Changing the frequency schedule is one way to adapt a model to longer contexts, but quality at those lengths has to be measured and often needs further training.'],
    formula:'(x₁, x₂) → R(p·ωᵢ)(x₁, x₂)  ·  ⟨R(mω)q, R(nω)k⟩ = ⟨q, R((n−m)ω)k⟩',
    sources:[{label:'Su et al., RoFormer: Enhanced Transformer with Rotary Position Embedding',href:'https://arxiv.org/abs/2104.09864'}]
  },
  {
    id:'dimensions',no:'06',tag:'Geometry',short:'High dimensions',
    title:'Room for more than you’d think.',
    body:['In two dimensions only two directions can be at right angles. In thousands of dimensions almost any two random directions are nearly perpendicular: their cosine similarity clusters tightly around zero, as Crowded Sky’s many-dimensions view shows.',
          'That suggests how a model could represent more features than it has dimensions, by giving each feature a direction and tolerating slight overlap. This is superposition. A feature is read back by projecting onto its direction, which works while few features are active; when several overlapping features are on together, interference can make absent ones appear. Crowded Sky’s stars settle into arrangements reported in toy models, but neither random nor toy geometry shows what a trained language model stores.',
          'The space in question is the residual stream: the vector at each token position that every block reads from and adds to. It is 4,096 numbers wide in a mid-size model and 12,288 in the model examined in the abliteration note.'],
    formula:'cos θ = u·v / (|u| |v|)  ·  spread ≈ 1/√d',
    sources:[{label:'Elhage et al., Toy Models of Superposition',href:'https://transformer-circuits.pub/2022/toy_model/'}]
  },
  {
    id:'ablation',no:'07',tag:'Interpretability',short:'Removing a direction',
    title:'Delete one direction.',
    body:['Some behaviours seem tied to a single direction r̂ in a model’s activations, the internal vectors it produces for each token. Projecting r̂ out subtracts each activation’s component along it; at α = 1 the component is removed entirely. Components at right angles are unchanged, though the model’s downstream behaviour can still shift.',
          'Researchers often find such a direction in the residual stream as the difference between average activations on two sets of prompts, such as ones a model refuses and ones it answers, then remove it to test its effect. This is the core move in abliteration. Nullspace does it to a synthetic cloud: the difference of means recovers the refusal direction and removing it mixes the two groups, while removing the wrong direction destroys an unrelated signal instead.',
          'Ablation is not steering. Adding a fixed vector moves every activation by the same amount, so it cannot restore the different amounts each one lost. <a class="text-link" href="#article/abliteration">Read the abliteration note ↗</a>'],
    formula:'x′ = x − α (x·r̂) r̂',
    sources:[{label:'Arditi et al., Refusal in Language Models Is Mediated by a Single Direction (2024)',href:'https://proceedings.neurips.cc/paper_files/paper/2024/hash/f545448535dfde4f9786555403ab7c49-Abstract.html'}]
  }
  ];

  const art = id => Interiors.games.find(p => p.id === id);

  function topic(t){
    const p=art(t.id);
    return `<section class="maths-topic" id="maths-${t.id}" aria-labelledby="maths-${t.id}-title" style="--ir-accent:${p.accent}">
  <div class="maths-copy"><p class="eyebrow">${t.no} / ${t.tag}</p>${Experiences.badges(t.id)}<h2 id="maths-${t.id}-title">${p.maths}</h2><p class="maths-dek">${t.title}</p><p class="maths-formula">${t.formula}</p>${t.body.map(x=>`<p>${x}</p>`).join('')}${t.sources?`<p class="maths-sources">${t.sources.map(l=>`<a class="text-link" href="${l.href}" target="_blank" rel="noopener">${l.label} ↗</a>`).join(' · ')}</p>`:''}</div>
  <figure class="maths-figure">
    <a class="maths-art maths-enter" href="#maths/play/${t.id}" aria-label="Step inside ${p.title}, the ${p.maths} artwork">
      <canvas class="ir-poster" data-poster="${t.id}" aria-hidden="true"></canvas>
      <span class="maths-art-text"><span class="maths-art-no">${p.no} / Interiors</span><span class="maths-art-title">${p.title}</span><span class="maths-art-cap">${p.caption}</span><span class="cta cta-sm maths-art-go">Step inside</span></span>
    </a>
  </figure>
</section>`;
  }

  function page(){
    return `<section class="maths-hero">
  <div class="maths-hero-art" aria-hidden="true">${Field.art('manifold','dark',{eager:true})}</div>
  <div class="maths-hero-shade" aria-hidden="true"></div>
  <div class="maths-hero-copy">
    <p class="eyebrow">The maths of AI</p>
    <h1>Step inside the maths.</h1>
    <p>Seven ideas, seven rooms inside a language model. Bend the space words live in, fold it like a kaleidoscope, weave attention, roll down a loss landscape. Each is an interactive artwork drawn by the mathematics it depicts.</p>
    <p class="maths-hero-note">Seven interactive artworks · no installation · keyboard &amp; touch</p>
  </div>
</section>
${MathsMap.markup()}
<div class="maths-topics">${topics.map(topic).join('')}</div>
<section class="section-dark maths-outro">
  <div class="field-exp-intro"><p class="eyebrow">Keep going</p><h2>See the ideas at work.</h2><p>Every artwork here is a small synthetic example computed in your browser. No model is run.</p></div>
  <div class="field-exp-links">
    <a class="experiment-link" href="#maths/play"><span class="exp-no">→</span> <span class="exp-name">All seven Interiors</span> <span class="exp-arrow">↗</span></a>
    <a class="experiment-link" href="#research"><span class="exp-no">→</span> <span class="exp-name">The research</span> <span class="exp-arrow">↗</span></a>
    <a class="experiment-link" href="#lab"><span class="exp-no">→</span> <span class="exp-name">The lab</span> <span class="exp-arrow">↗</span></a>
  </div>
</section>`;
  }

  let disposers = [];

  function wire(on){
    disposers.forEach(f=>f());disposers=[];
    if(!on)return;
    const controller=new AbortController(),{signal}=controller;
    disposers.push(()=>controller.abort());
    const posters=Interiors.posters(document.querySelector('.maths-topics'));
    disposers.push(()=>posters.dispose());
    const map=MathsMap.wire(document.getElementById('maths-map'),signal);
    disposers.push(()=>map.dispose());
  }

  return {page,wire,get topics(){return topics;}};
})();
