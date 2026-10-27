/* The Maths of AI: the seven ideas in prose, each paired with its Interiors
   artwork (maths-art/). The posters here are the artworks' own live previews;
   "Step inside" opens the full piece at #maths/play/<id>. */
const Maths = (() => {
  const topics = [
  {
    id:'linear-maps',no:'01',tag:'Vectors & matrices',short:'Linear maps',
    title:'A matrix moves all of space at once.',
    body:['A 2×2 matrix is a rule for where the two basis arrows, î and ĵ, land. Every other point is a combination of those two arrows, so it follows along: a point at (x, y) lands at x·î + y·ĵ. That is why grid lines stay straight, parallel and evenly spaced, and why dragging just two arrows in Lattice moves every star in the field.',
          'The determinant, ad − bc, records what the map does to area. Its absolute value is the scale factor, a negative sign means the plane has been mirrored, and at zero the plane collapses onto a line or a point. Distinct inputs then share an output, and the information that separated them is lost.',
          'Most of a transformer’s parameters sit in matrices like this one, only much larger and usually rectangular: the embedding that turns each token into a vector, the query, key and value projections in every attention head, the feed-forward layers, and the final unembedding that scores the vocabulary. For a rectangular matrix, rank plays the part the determinant plays here: it counts how many independent directions survive the map. Fine-tuning methods such as LoRA add a low-rank update to these matrices while keeping the pretrained weights fixed.'],
    formula:'[x′ y′] = [[a b] [c d]] · [x y]  ·  det = ad − bc',
    sources:[{label:'Hu et al., LoRA: Low-Rank Adaptation of Large Language Models (2021)',href:'https://arxiv.org/abs/2106.09685'}]
  },
  {
    id:'folding',no:'02',tag:'Non-linearity',short:'Folding space',
    title:'Bend, then fold.',
    body:['Stack linear maps and you only ever get another linear map: two matrices in a row multiply into one. A network escapes this by applying a simple non-linear function between layers. The simplest common choice is ReLU, max(0, z), which passes positive values through unchanged and sets negative ones to zero. Each neuron becomes a hinge, with a crease where its input z crosses zero.',
          'Wherever every neuron stays on one side of its crease, the network is exactly linear; crossing a crease changes the slope. Each layer bends the space the layer before it produced, so creases multiply with depth, and that is how a network carves its input into the shapes a task needs. Kaleidoscope builds each layer from a single ReLU that folds the plane like a mirror. Every extra layer can double the number of regions, and with the activation switched off the whole stack becomes one rigid map with a single region.',
          'In a transformer this is the feed-forward block that follows attention in every layer: a matrix that widens the vector, the activation, then a matrix that narrows it again. Modern models mostly use GELU, which scales inputs smoothly, or SwiGLU, which multiplies by an input-dependent gate, rather than plain ReLU, but the role is the same. Feed-forward layers often account for a large share of a model’s parameters.'],
    formula:'h = ReLU(W·x + b) = max(0, W·x + b)'
  },
  {
    id:'gradient-descent',no:'03',tag:'Learning',short:'Gradient descent',
    title:'Roll downhill, one step at a time.',
    body:['Training searches for parameter values that make the loss small. The loss measures how wrong the model’s predictions are on a batch of training tokens, and its gradient points in the direction that increases the loss fastest. Each step moves the parameters a little the opposite way: θ ← θ − η∇L(θ).',
          'The learning rate η sets the size of that step. Too small and progress crawls; too large and the update overshoots the valley and can diverge. Momentum carries part of the previous update forward, which can take a step through small dips and along flat ravines, and can also make it overshoot. In Descent each seed is a starting point on a two-parameter landscape, and its trail is the exact momentum update on that surface. A language model takes the same kind of step across billions of parameters at once.',
          'All of this happens during training, not when the model is used. Backpropagation computes the gradient for every parameter from a batch of tokens, and an optimiser such as AdamW turns it into an update, with a step size adapted to each parameter and weight decay applied separately. A finite step can still increase the loss, which is why learning rates are tuned and usually scheduled.'],
    formula:'θ ← θ − η ∇L(θ)  ·  momentum: v ← μv − η∇L, θ ← θ + v',
    sources:[{label:'Loshchilov and Hutter, Decoupled Weight Decay Regularization',href:'https://arxiv.org/abs/1711.05101'}]
  },
  {
    id:'attention',no:'04',tag:'Attention',short:'Attention',
    title:'Every token asks a question.',
    body:['Attention lets each token gather information from the tokens before it. Three learned matrices project each token’s vector into a query, a key and a value. The query is compared with the key of every earlier token by a dot product, which grows both with how closely the two vectors point the same way and with their lengths. Softmax turns those scores into weights that are positive and add up to one, and the output is the weighted sum of the values.',
          'In Loom each thread is one of those weights, running from a word back to an earlier word, and the orb at the centre is the weighted blend. A causal mask stops any word looking ahead. Loom’s four heads are hand-built so that their patterns are legible: one looks at the previous word, one at meaning, one at grammatical agreement and one copies a pattern it has seen before. Dividing the scores by a temperature before softmax sharpens or flattens the weights. Standard attention divides by √dₖ, the key width, and this is not the sampling temperature used to choose an output token.',
          'A transformer runs many heads in parallel in every layer, each with its own query, key and value matrices, which is how a token such as “it” can find the noun it refers to. Processing a whole prompt scores every pair of tokens, so the work grows with the square of its length; generating one more token attends over the context already cached.'],
    formula:'wᵢ = softmax(q·kᵢ / τ)  ·  output = Σ wᵢ vᵢ'
  },
  {
    id:'rotary',no:'05',tag:'Position',short:'Rotary positions',
    title:'Position as rotation.',
    body:['Attention compares queries and keys by their content alone, so on its own it has no sense of token order. Rotary position embeddings (RoPE) add order by rotating pairs of coordinates in each query and key by an angle proportional to the token’s position, with each pair turning at its own frequency.',
          'Because both vectors are rotated, what matters is the difference between their angles. For fixed query and key content, the positional part of their dot product depends on the distance n − m between the two tokens, not on where they sit in the text. In Orrery each orbit is one coordinate pair: dragging the whole sentence moves every planet but leaves the score unchanged. Fast pairs wrap round within a few tokens and slow pairs change over long distances, so together they tell many distances apart.',
          'Llama, Mistral and most open models apply RoPE inside every attention head, just before the scores are computed; the values are not rotated. Changing the frequency schedule is one way models are adapted to longer contexts, but quality at those lengths has to be measured and often needs further training.'],
    formula:'(x₁, x₂) → R(p·ωᵢ)(x₁, x₂)  ·  ⟨R(mω)q, R(nω)k⟩ = ⟨q, R((n−m)ω)k⟩',
    sources:[{label:'Su et al., RoFormer: Enhanced Transformer with Rotary Position Embedding',href:'https://arxiv.org/abs/2104.09864'}]
  },
  {
    id:'dimensions',no:'06',tag:'Geometry',short:'High dimensions',
    title:'Room for more than you’d think.',
    body:['In two dimensions only two directions can be at right angles. In thousands of dimensions almost any two random directions are nearly at right angles: their cosine similarity bunches tightly around zero, with a spread of about 1/√d. Crowded Sky’s many-dimensions view shows the angles between random directions crowding around 90° as the dimension grows.',
          'That geometry suggests how a model could represent more features than it has dimensions, by giving each feature its own direction and tolerating a little overlap. This is superposition. A feature is read back by projecting onto its direction, which works while few features are active at once; when several overlapping features are on together, their interference can make absent ones appear present. Crowded Sky’s stars settle into the arrangements reported in toy models of superposition, but neither random nor toy geometry shows what a trained language model actually stores.',
          'The space in question is the residual stream: the vector at each token position that every transformer block reads from and adds its output to. It is 4,096 numbers wide in a mid-size model, and 12,288 in the model examined in the abliteration note.'],
    formula:'cos θ = u·v / (|u| |v|)  ·  spread ≈ 1/√d',
    sources:[{label:'Elhage et al., Toy Models of Superposition',href:'https://transformer-circuits.pub/2022/toy_model/'}]
  },
  {
    id:'ablation',no:'07',tag:'Interpretability',short:'Removing a direction',
    title:'Delete one direction.',
    body:['Some behaviours seem to be associated with a single direction in a model’s activations, the internal vectors it produces while processing a token. Projecting that direction out subtracts each activation’s component along it, x′ = x − α (x·r̂) r̂, where α = 1 removes the component entirely. Components at right angles to r̂ are unchanged, although what the model does downstream can still change.',
          'Researchers find a candidate direction in residual-stream activations, often as the difference between the average activations on two sets of prompts, such as ones a model refuses and ones it answers, and then remove it to test its effect. This is the core move in abliteration. Nullspace does it to a synthetic cloud of activations: the difference of means recovers the refusal direction and removing it mixes the two groups, while removing the wrong direction destroys an unrelated signal instead.',
          'Ablation is not the same as steering. Adding a fixed vector moves every activation by the same amount, so it cannot restore the different amounts each activation lost to the projection. <a class="text-link" href="#article/abliteration">Read the abliteration note ↗</a>'],
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
      <span class="maths-art-text"><span class="maths-art-no">${p.no} / Interiors</span><span class="maths-art-title">${p.title}</span><span class="maths-art-cap">${p.caption}</span><span class="maths-art-go">Step inside →</span></span>
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
