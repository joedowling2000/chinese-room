/* The Maths of AI: the seven ideas in prose, each paired with its Interiors
   artwork (maths-art/). The posters here are the artworks' own live previews;
   "Step inside" opens the full piece at #maths/play/<id>. */
const Maths = (() => {
  const topics = [
  {
    id:'linear-maps',no:'01',tag:'Vectors & matrices',short:'Linear maps',
    title:'A matrix moves all of space at once.',
    body:['Almost everything inside a transformer is a matrix multiplication. A 2×2 matrix is simply a rule for where the two basis arrows, î and ĵ, land. Every other point follows along, so grid lines stay straight, parallel and evenly spaced.',
          'The determinant says how much areas grow or shrink. At zero, the plane is flattened onto a line and information is lost for good.'],
    why:'Most of an LLM’s billions of parameters are entries in matrices like this one, only thousands of rows wide. They turn each word into a query, a key and a value, mix information between layers and score every word in the vocabulary. Without them there would be nothing to learn: no way to move meaning from one place to another.',
    llm:{where:'Every weight matrix in a transformer is one of these maps: the embedding that turns each word into a vector, the Q, K and V projections inside every attention head, the feed-forward layers, and the final unembedding that scores the whole vocabulary.',
         role:'It is the model’s only way to move and mix information — change the entries and you change what the network can express. When the determinant hits zero the map throws information away, which is why trained weight matrices stay near full rank.'},
    formula:'[x′ y′] = [[a b] [c d]] · [x y]  ·  det = ad − bc'
  },
  {
    id:'folding',no:'02',tag:'Non-linearity',short:'Folding space',
    title:'Bend, then fold.',
    body:['Stack linear maps and you only ever get another linear map. Networks escape by applying a simple non-linear function after each one.',
          'ReLU keeps positive values and sets negative ones to zero, folding whole regions of space flat onto the axes. Layer after layer, those folds let a network carve space into whatever shapes the task needs. The two point clouds show what happens to an inner disc and an outer ring.'],
    why:'Without a non-linear step, a hundred layers would collapse into one big matrix, and the model could only ever draw straight lines through meaning. It could not learn that “not bad” sits close to “good”, or that a word changes with the company it keeps. The feed-forward layers, where these activations live, hold most of a model’s parameters, and research suggests they store much of what it knows.',
    llm:{where:'Inside every transformer block, right after attention, sits a feed-forward network — this layer, repeated dozens of times. Modern models mostly use GELU or a gated variant such as SwiGLU rather than plain ReLU, but the folding is the same idea.',
         role:'The non-linearity is what stops the whole stack collapsing into a single matrix. These layers hold roughly two-thirds of a transformer’s parameters, and evidence suggests much of its factual knowledge is stored in them.'},
    formula:'h = ReLU(W·x + b) = max(0, W·x + b)'
  },
  {
    id:'gradient-descent',no:'03',tag:'Learning',short:'Gradient descent',
    title:'Roll downhill, one step at a time.',
    body:['Training is a search for weights that make the loss small. The gradient points uphill, so each step moves a little the other way.',
          'The learning rate sets the stride. Too small and progress crawls; too large and the ball overshoots and flies off. Momentum carries speed from step to step, which can roll it through small dips. A real model does this in billions of dimensions, not two.'],
    why:'Every weight in an LLM starts out as a random number. Gradient descent, repeated over trillions of words, is what turns that noise into a model that can write. Without it, the network would stay exactly as random as the day it was made. Choose the learning rate badly and training crawls or blows up, which is why labs warm it up and then decay it on a careful schedule.',
    llm:{where:'This is training, not inference — the loop that placed every weight in the model. A loss measured over billions of words, gradients found by backpropagation, and billions of small downhill steps like the one you are taking.',
         role:'Nothing else teaches the model. Everything else on this page is architecture — the fixed landscape; descent is what carved every weight in it. Real optimisers add momentum and adaptive rates, but the step is the same.'},
    formula:'θ ← θ − η ∇L(θ)  ·  momentum: v ← μv − η∇L, θ ← θ + v'
  },
  {
    id:'attention',no:'04',tag:'Attention',short:'Attention',
    title:'Every token asks a question.',
    body:['In attention, each token emits a query and every token offers a key. Their dot product scores how well they match, and softmax turns the scores into weights that add up to one. The output is the weighted average of the values; here the values are the keys themselves.',
          'Temperature sharpens or flattens the choice. Inside a transformer it is fixed by the √d scaling; the same knob comes back when a model samples its next token.'],
    why:'Attention is how a word finds the other words that change its meaning: which noun “it” refers to, or whether “bank” means a river or money. Without it, every token would be processed in isolation, as if the model read each word through a keyhole with no memory of the rest of the sentence. It is also why long prompts are expensive: every new token has to look back at every token before it.',
    llm:{where:'This is the attention block — the mechanism that lets a token gather context from the words before it. A transformer runs many of these heads in parallel per layer, each with its own learned query, key and value matrices.',
         role:'It is how “it” finds its noun and the main reason transformers beat bag-of-words models. The cost is quadratic: every new token has to look back at all the ones before it, which is why long contexts are expensive.'},
    formula:'wᵢ = softmax(q·kᵢ / τ)  ·  output = Σ wᵢ vᵢ'
  },
  {
    id:'rotary',no:'05',tag:'Position',short:'Rotary positions',
    title:'Position as rotation.',
    body:['Attention on its own has no sense of word order. Rotary position embeddings (RoPE) add it by rotating pairs of dimensions in each query and key by an angle proportional to the token’s position, each pair at its own frequency.',
          'Two pairs means two angles, so the combined state lives on a torus; the dots mark whole token positions. Because queries and keys are rotated the same way, their dot product depends only on how far apart the tokens are.'],
    why:'Attention on its own treats a sentence as a bag of words: “dog bites man” and “man bites dog” would look identical. Position information restores the order. Because RoPE encodes the distance between words rather than where they sit, its frequencies can be stretched after training, which is one of the main ways models are extended to longer contexts than they were trained on.',
    llm:{where:'Inside every attention head, just before the dot products are scored, the query and key vectors are rotated by RoPE — by an angle proportional to the token’s position, each coordinate pair at its own frequency. Llama, Mistral and most open models use it.',
         role:'It gives attention a sense of word order without storing positions anywhere. And because it encodes distance rather than absolute place, stretching the frequencies is the standard trick for extending a trained model’s context window.'},
    formula:'(x₁, x₂) → R(p·ωᵢ)(x₁, x₂)  ·  ⟨R(mω)q, R(nω)k⟩ = ⟨q, R((n−m)ω)k⟩'
  },
  {
    id:'dimensions',no:'06',tag:'Geometry',short:'High dimensions',
    title:'Room for more than you’d think.',
    body:['In two dimensions only two directions can be at right angles. In thousands of dimensions almost any two random directions are nearly at right angles: their cosine similarity bunches tightly around zero, with a spread of about 1/√d.',
          'That spare room is part of why models can store far more features than they have dimensions, a trick called superposition, at the cost of a little interference. 12,288 is the width of the model in the abliteration notes.'],
    why:'A model has to represent millions of ideas, from names and facts to grammar and tone, using a few thousand numbers per word. Near-right angles are what make that possible: many features can share the same space with only a little crosstalk. They are also why single neurons are hard to interpret, because each one is shared by many features at once.',
    llm:{where:'This is the residual stream — the wide vector each token carries through every layer of the network. It is 4,096 numbers across in a mid-size model, and 12,288 in the one examined in the abliteration note.',
         role:'Near-orthogonality lets the stream hold far more features than it has dimensions — a packing trick called superposition. The same crowding is why single neurons are hard to interpret: each one is shared by many features at once.'},
    formula:'cos θ = u·v / (|u| |v|)  ·  spread ≈ 1/√d'
  },
  {
    id:'ablation',no:'07',tag:'Interpretability',short:'Removing a direction',
    title:'Delete one direction.',
    body:['Some behaviours seem to be written along a single direction in a model’s activations. Projecting that direction out of every activation removes the component along it and leaves everything at right angles untouched.',
          'This is the core move in abliteration. Here, two clusters differ along one direction r̂; ablating it collapses both onto the same plane. <a class="text-link" href="#article/abliteration">Read the abliteration note ↗</a>'],
    why:'If a behaviour such as refusing a request is carried by one direction, it can be measured, steered or switched off with a single line of linear algebra and no retraining. That makes this a powerful way to understand models, and also a warning: safety behaviour learned this way can be surprisingly easy to remove.',
    llm:{where:'This happens inside the residual stream: find a direction that separates one behaviour from another — say, activations for requests the model refuses versus ones it answers — and subtract it from every activation.',
         role:'It is the core move behind abliteration and steering vectors: evidence that some behaviours live in directions simple enough to delete with one line of linear algebra, no retraining required.'},
    formula:'x′ = x − α (x·r̂) r̂'
  }
  ];

  const art = id => Interiors.games.find(p => p.id === id);

  function topic(t){
    const p=art(t.id);
    return `<section class="maths-topic" id="maths-${t.id}" aria-labelledby="maths-${t.id}-title" style="--ir-accent:${p.accent}">
  <div class="maths-copy"><p class="eyebrow">${t.no} / ${t.tag}</p><h2 id="maths-${t.id}-title">${t.title}</h2>${t.body.map(x=>`<p>${x}</p>`).join('')}<div class="maths-why"><p class="maths-why-label">Why it matters</p><p>${t.why}</p></div><div class="maths-llm"><p class="maths-why-label">Inside an LLM</p><p><b>Where it lives</b>${t.llm.where}</p><p><b>What the model uses it for</b>${t.llm.role}</p></div><p class="maths-formula">${t.formula}</p></div>
  <figure class="maths-figure">
    <a class="maths-art maths-enter" href="#maths/play/${t.id}" aria-label="Step inside ${p.title}, the ${t.short.toLowerCase()} artwork">
      <canvas class="ir-poster" data-poster="${t.id}" aria-hidden="true"></canvas>
      <span class="maths-art-text"><span class="maths-art-no">${p.no} / Interiors</span><span class="maths-art-title">${p.title}</span><span class="maths-art-cap">${p.caption}</span><span class="maths-art-go">Step inside →</span></span>
    </a>
  </figure>
</section>`;
  }

  // The anatomy map: every idea is one stage of a real forward pass.
  function pipeline(){
    const chip=(id,name,sub)=>`<a class="mf-node" href="#maths/${id}" data-scroll-target="maths-${id}" data-stage="${id}"><b>${name}</b><span>${sub}</span></a>`;
    const arrow=`<li class="mf-arrow" aria-hidden="true">→</li>`;
    return `<section class="maths-map" id="maths-map" aria-label="How the seven ideas fit inside one forward pass">
  <div class="maths-map-intro"><p class="eyebrow">One token’s journey</p><h2>Where each idea lives.</h2><p>Every idea below is one stage of a real forward pass. Follow a token through the pipeline, then step inside whichever stage you want to feel from within.</p></div>
  <ol class="maths-flow">
    <li class="mf-end"><span class="mf-tag">input</span><b>a word</b></li>
    ${arrow}
    <li>${chip('linear-maps','Embed','word → vector · 01')}</li>
    ${arrow}
    <li class="mf-block"><p class="mf-block-label">transformer block · <span class="mf-depth"><button type="button" class="mf-depth-btn" data-depth="-1" aria-label="Fewer layers">−</button><b id="mf-depth">32</b><button type="button" class="mf-depth-btn" data-depth="1" aria-label="More layers">+</button> layers deep</span></p><div class="mf-block-row">${chip('attention','Attention','words listen · 04')}${chip('rotary','RoPE','position · 05')}${chip('folding','Feed-forward','the fold · 02')}</div></li>
    ${arrow}
    <li>${chip('linear-maps','Unembed','vector → scores · 01')}</li>
    ${arrow}
    <li class="mf-end"><span class="mf-tag">output</span><b>the next word</b></li>
  </ol>
  <ol class="maths-flow mf-side">
    <li><p class="mf-side-label">around it</p></li>
    <li>${chip('gradient-descent','Training','writes every weight · 03')}</li>
    <li>${chip('dimensions','Residual stream','carries the token · 06')}</li>
    <li>${chip('ablation','Interpretability','reads & edits the stream · 07')}</li>
  </ol>
</section>`;
  }

  function page(){
    return `<section class="maths-hero">
  <div class="maths-hero-art" aria-hidden="true">${Field.art('manifold','dark',{eager:true})}</div>
  <div class="maths-hero-shade" aria-hidden="true"></div>
  <div class="maths-hero-copy">
    <p class="eyebrow">The maths of AI</p>
    <h1>Step inside the maths.</h1>
    <p>Seven ideas, seven rooms inside a language model. Bend the space words live in, crease it into stained glass, weave attention, roll down a loss landscape. Each is an interactive artwork drawn by the mathematics it depicts.</p>
    <p class="maths-hero-actions"><a class="pill light" href="#maths/play">Step inside ↗</a> <a class="text-link" href="#maths" data-scroll-target="maths-index">or read the seven ideas ↓</a></p>
    <p class="maths-hero-note">Seven interactive artworks · no installation · keyboard &amp; touch</p>
  </div>
</section>
<nav class="maths-index" id="maths-index" aria-label="Topics">${topics.map(t=>`<a href="#maths/${t.id}" data-scroll-target="maths-${t.id}"><span>${t.no}</span>${t.short}<em>${art(t.id).title}</em></a>`).join('')}</nav>
${pipeline()}
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
    // "You are here": the pipeline chip matching the topic in view lights up.
    const here=new Set();
    const syncHere=()=>document.querySelectorAll('.mf-node[data-stage]').forEach(n=>n.classList.toggle('here',here.has(n.dataset.stage)));
    const hereObs=new IntersectionObserver(es=>{
      es.forEach(e=>{const id=e.target.id.slice(6);e.isIntersecting?here.add(id):here.delete(id);});
      syncHere();
    },{rootMargin:'-35% 0px -55% 0px'});
    document.querySelectorAll('.maths-topic').forEach(s=>hereObs.observe(s));
    disposers.push(()=>{hereObs.disconnect();here.clear();});
    // Layer depth stepper on the transformer block chip.
    const depthEl=document.getElementById('mf-depth'),DEPTHS=[4,12,24,32,48,80,121];
    let di=3;
    document.querySelectorAll('[data-depth]').forEach(b=>b.addEventListener('click',()=>{
      di=(di+Number(b.dataset.depth)+DEPTHS.length)%DEPTHS.length;
      depthEl.textContent=DEPTHS[di];
    },{signal}));
  }

  return {page,wire,get topics(){return topics;}};
})();
