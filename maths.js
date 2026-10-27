/* The Maths of AI: the seven ideas in prose, each paired with its Interiors
   artwork (maths-art/). The posters here are the artworks' own live previews;
   "Step inside" opens the full piece at #maths/play/<id>. */
const Maths = (() => {
  const topics = [
  {
    id:'linear-maps',no:'01',tag:'Vectors & matrices',short:'Linear maps',
    title:'A matrix moves all of space at once.',
    body:['Almost everything inside a transformer is a matrix multiplication. A 2×2 matrix is simply a rule for where the two basis arrows, î and ĵ, land. Every other point follows along, so grid lines stay straight, parallel and evenly spaced.',
          'The absolute value of the determinant gives the area scale. At zero, the plane collapses onto a line or a point and information is lost.'],
    llm:{where:'Every weight matrix in a transformer is one of these maps: the embedding that turns each token into a vector, the Q, K and V projections inside every attention head, the feed-forward layers, and the final unembedding that scores the whole vocabulary.',
         role:'A projection can discard information. The determinant illustrates that for this square matrix; rank is the more general concept used for rectangular matrices.'},
    formula:'[x′ y′] = [[a b] [c d]] · [x y]  ·  det = ad − bc',
    sources:[{label:'Hu et al., LoRA: Low-Rank Adaptation of Large Language Models (2021)',href:'https://arxiv.org/abs/2106.09685'}]
  },
  {
    id:'folding',no:'02',tag:'Non-linearity',short:'Folding space',
    title:'Bend, then fold.',
    body:['Stack linear maps and you only ever get another linear map. Networks escape by applying a simple non-linear function after each one.',
          'ReLU keeps positive values and sets negative ones to zero, folding whole regions of space flat onto the axes. Layer after layer, those folds let a network carve space into whatever shapes the task needs. The two point clouds show what happens to an inner disc and an outer ring.'],
    llm:{where:'Inside every transformer block, right after attention, sits a feed-forward network — this layer, repeated many times. Modern models mostly use GELU or a gated variant such as SwiGLU rather than plain ReLU, but the folding is the same idea.',
         role:'The non-linearity is what stops a stack of feed-forward maps collapsing into a single map. Feed-forward layers often account for a large share of the parameters. GELU scales inputs smoothly and SwiGLU uses an input-dependent gate; neither is a guarantee against small gradients.'},
    formula:'h = ReLU(W·x + b) = max(0, W·x + b)'
  },
  {
    id:'gradient-descent',no:'03',tag:'Learning',short:'Gradient descent',
    title:'Roll downhill, one step at a time.',
    body:['Training is a search for weights that make the loss small. The gradient points uphill, so each step moves a little the other way.',
          'The learning rate sets the stride. Too small and progress crawls; too large and the ball overshoots and flies off. Momentum carries speed from step to step, which can roll it through small dips. A real model does this in billions of dimensions, not two.'],
    llm:{where:'This is training, not inference — the loop that updates the model’s parameters using gradients computed on batches of tokens.',
         role:'Training combines a loss objective, batches of tokens and an optimiser that uses gradients to update parameters. Momentum and adaptive per-parameter rates affect those updates; a finite step can increase the loss.'},
    formula:'θ ← θ − η ∇L(θ)  ·  momentum: v ← μv − η∇L, θ ← θ + v',
    sources:[{label:'Loshchilov and Hutter, Decoupled Weight Decay Regularization',href:'https://arxiv.org/abs/1711.05101'}]
  },
  {
    id:'attention',no:'04',tag:'Attention',short:'Attention',
    title:'Every token asks a question.',
    body:['In attention, each token emits a query — a learned projection used to score keys — and every token offers a key. Their dot product scores how well they match, and softmax turns the scores into weights that add up to one. The output is the weighted average of the values; here the values are the keys themselves.',
          'The temperature control divides the scores before softmax. Standard scaled dot-product attention divides by √dₖ, where dₖ is the key width; this adjustable example is not the sampling-temperature setting used to select an output token.'],
    llm:{where:'This is the attention block — the mechanism that lets a token gather context from the tokens before it. A transformer runs many of these heads in parallel per layer, each with its own learned query, key and value matrices.',
         role:'It is how “it” finds its noun. Processing a whole prompt scores every token pair, so the pair count grows quadratically with sequence length; generating one additional token attends over the cached context.'},
    formula:'wᵢ = softmax(q·kᵢ / τ)  ·  output = Σ wᵢ vᵢ'
  },
  {
    id:'rotary',no:'05',tag:'Position',short:'Rotary positions',
    title:'Position as rotation.',
    body:['Attention on its own has no sense of token order. Rotary position embeddings (RoPE) add it by rotating pairs of dimensions in each query and key by an angle proportional to the token’s position, each pair at its own frequency.',
          'Two pairs means two angles, so the combined state lives on a torus; the dots mark whole token positions. For fixed query and key content, the positional contribution to their dot product depends on how far apart the tokens are.'],
    llm:{where:'Inside every attention head, just before the dot products are scored, the query and key vectors are rotated by RoPE — by an angle proportional to the token’s position, each coordinate pair at its own frequency. Llama, Mistral and most open models use it.',
         role:'It gives attention a sense of token order through rotations of query and key coordinates. Frequency scaling can support longer contexts, but the model’s quality at those lengths has to be tested; context extension is not automatic.'},
    formula:'(x₁, x₂) → R(p·ωᵢ)(x₁, x₂)  ·  ⟨R(mω)q, R(nω)k⟩ = ⟨q, R((n−m)ω)k⟩',
    sources:[{label:'Su et al., RoFormer: Enhanced Transformer with Rotary Position Embedding',href:'https://arxiv.org/abs/2104.09864'}]
  },
  {
    id:'dimensions',no:'06',tag:'Geometry',short:'High dimensions',
    title:'Room for more than you’d think.',
    body:['In two dimensions only two directions can be at right angles. In thousands of dimensions almost any two random directions are nearly at right angles: their cosine similarity bunches tightly around zero, with a spread of about 1/√d.',
          'That geometry motivates how models could store more features than they have dimensions — superposition — though random directions do not demonstrate what a trained model actually stores. 12,288 is the width of the model in the abliteration notes.'],
    llm:{where:'This is the residual stream — the vector at each token position that carries updates through the transformer blocks. It is 4,096 numbers across in a mid-size model, and 12,288 in the one examined in the abliteration note.',
         role:'The random-direction geometry shown here motivates how many directions can coexist with limited overlap. Whether a model’s learned representations pack features this way is a separate question that the sampling here does not test.'},
    formula:'cos θ = u·v / (|u| |v|)  ·  spread ≈ 1/√d',
    sources:[{label:'Elhage et al., Toy Models of Superposition',href:'https://transformer-circuits.pub/2022/toy_model/'}]
  },
  {
    id:'ablation',no:'07',tag:'Interpretability',short:'Removing a direction',
    title:'Delete one direction.',
    body:['Some behaviours seem to be written along a single direction in a model’s activations — internal vectors produced while the model processes a token. Projecting that direction out removes each activation’s component along it; components at right angles are unchanged, although downstream behaviour can still change.',
          'This is the core move in abliteration. Here, two clusters differ along one direction r̂; ablating it collapses both onto the same plane. <a class="text-link" href="#article/abliteration">Read the abliteration note ↗</a>'],
    llm:{where:'Researchers identify a candidate direction in residual-stream activations, then subtract each activation’s projection onto that direction to test its effect.',
         role:'Ablation removes the component along the chosen direction. Adding a fixed steering vector is a different intervention and does not recover the different amounts each point lost.'},
    formula:'x′ = x − α (x·r̂) r̂',
    sources:[{label:'Arditi et al., Refusal in Language Models Is Mediated by a Single Direction (2024)',href:'https://proceedings.neurips.cc/paper_files/paper/2024/hash/f545448535dfde4f9786555403ab7c49-Abstract.html'}]
  }
  ];

  const art = id => Interiors.games.find(p => p.id === id);

  function topic(t){
    const p=art(t.id);
    return `<section class="maths-topic" id="maths-${t.id}" aria-labelledby="maths-${t.id}-title" style="--ir-accent:${p.accent}">
  <div class="maths-copy"><p class="eyebrow">${t.no} / ${t.tag}</p>${Experiences.badges(t.id)}<h2 id="maths-${t.id}-title">${p.maths}</h2><p class="maths-dek">${t.title}</p><p class="maths-formula">${t.formula}</p>${t.body.map(x=>`<p>${x}</p>`).join('')}<div class="maths-llm"><p class="maths-why-label">In a language model</p><p>${t.llm.where}</p><p>${t.llm.role}</p></div>${t.sources?`<p class="maths-sources">${t.sources.map(l=>`<a class="text-link" href="${l.href}" target="_blank" rel="noopener">${l.label} ↗</a>`).join(' · ')}</p>`:''}</div>
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
