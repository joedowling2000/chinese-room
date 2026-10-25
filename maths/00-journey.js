/* 00 · The journey: shared world identities, palette helpers and the
   atmospheric frame every abstract world is painted inside. Loaded before
   maths.js; consumed by the stage and by the scene kits. */
const MathsJourney = (() => {
  const worlds = {
    'linear-maps':{
      name:'The lattice cathedral',subtitle:'Walk where the matrix sends you.',
      accent:'#8de8df',secondary:'#d9b68c',
      action:{id:'lm-shear',label:'Apply a shear'},
      legend:['î · first basis direction','ĵ · second basis direction'],
      note:'A 2D linear map, imagined as architecture. Height is only scenery. LoRA learns a low-rank addition to a weight matrix. The original matrix is retained; its other directions are not deleted.',
      dpad:{up:['ArrowUp','Along ĵ'],down:['ArrowDown','Back along ĵ'],left:['ArrowLeft','Back along î'],right:['ArrowRight','Along î']},
      hint:'Drag to look · arrows or W A S D to step along the basis',
      lessons:[
        {title:'Every step is a vector.',text:'Walk across the lattice. The two columns of the matrix decide where a step along î or ĵ will take you.',tryLabel:'Restore the lattice',values:{},click:'lm-identity',llm:'A token starts with an embedding: a learned list of numbers selected using its token ID. Later matrices transform that vector. The two basis arrows here show how a matrix determines where every input point goes.'},
        {title:'One rule moves everything.',text:'Apply a shear. Parallel streets stay parallel, but their angles change. A matrix transforms every address by the same rule.',tryLabel:'Apply a shear',values:{},click:'lm-shear',llm:'Attention uses learned projections to form queries, keys and values. Within a head, the same projection is applied at each token position. Changing the matrix therefore changes how all those token representations are transformed.'},
        {title:'A dimension can disappear.',text:'Collapse the plane. The determinant becomes zero: different starting points now share the same destination. That information cannot be recovered.',tryLabel:'Collapse space',values:{},click:'lm-collapse',llm:'Some projections reduce the number of coordinates. Different inputs can then produce the same output, so the projection alone cannot recover the original input. The Collapse preset demonstrates this by mapping a plane onto a line.'}]},
    'folding':{
      name:'The folding garden',subtitle:'Stand on the threshold of a non-linearity.',
      accent:'#c1a1ff',secondary:'#8de8df',
      action:{id:'fold-play',label:'Fold / unfold'},
      legend:['Filled lights · inner disc','Rings · outer cloud'],
      note:'Height visualises what the activation removes; the layer itself still maps two coordinates to two coordinates.',
      dpad:{up:['ArrowUp','Step forward'],down:['ArrowDown','Step back'],left:['ArrowLeft','Turn left'],right:['ArrowRight','Turn right']},
      hint:'Drag to look · W S to walk · A D to turn · F to fold',
      lessons:[
        {title:'Before the threshold.',text:'Two clouds share a flat sheet. Rotation and bias can move them, but a stack of affine maps can still be combined into one affine map.',tryLabel:'Return to input',values:{'fold-t':0},llm:'A feed-forward block transforms each token’s vector with learned matrices and an activation. If the block contained only linear maps, they could be combined into one map. Attention elsewhere in the transformer would still depend non-linearly on the input.'},
        {title:'Watch the negatives vanish.',text:'With ReLU, negative coordinates become zero. Here their lost magnitude rises into walls so you can see where information is discarded.',tryLabel:'Apply ReLU',values:{'fold-act':'relu','fold-t':1},click:'fold-play',llm:'With ReLU, an intermediate coordinate below zero contributes zero to the next linear layer. Which coordinates are active depends on the input. This gives the feed-forward block behaviour that a single linear map cannot express.'},
        {title:'Change the rule.',text:'Leaky ReLU keeps a small negative slope. Compare its compressed region with the complete flattening of ReLU.',tryLabel:'Try a leaky fold',values:{'fold-act':'leaky','fold-t':2},llm:'The activation choice changes how intermediate values pass through the block. GELU scales inputs smoothly; SwiGLU, used in models such as Llama, uses one learned branch to gate another. Leaky ReLU here is a simpler way to compare partial suppression with setting negatives to zero.'}]},
    'gradient-descent':{
      name:'The valley of error',subtitle:'Feel the slope. Find a way down.',
      accent:'#d9b68c',secondary:'#8de8df',
      action:{id:'gd-step',label:'Take a learning step'},
      legend:['Terrain height · loss','Light trail · previous steps'],
      note:'A synthetic loss surface with two parameters. Real training may have billions. The displayed loss is offset by a sampled reference value. A small gradient does not establish a global minimum.',
      dpad:{up:['ArrowUp','Take a step'],left:['ArrowLeft','Turn left'],right:['ArrowRight','Turn right']},
      hint:'Drag to look · W to apply one training step · ← → to turn',
      lessons:[
        {title:'You can feel only the local slope.',text:'The arrow points opposite the gradient. A learning step moves the weights in that direction; the terrain is the loss, not a map the optimiser can inspect.',prompt:'Does changing the learning rate move the parameters before you apply a step?',tryLabel:'Preview the next step',values:{},llm:'In next-token training, the loss measures how much probability the model assigned to the tokens that actually followed. Backpropagation calculates how that loss changes with each trainable parameter. A basic gradient-descent update goes in the opposite direction, as the arrow shows here.'},
        {title:'Carry a little momentum.',text:'Momentum carries part of the previous update into the next. It can accelerate a descent, but can also cause overshoot.',prompt:'How does the previous update contribute when momentum is enabled?',tryLabel:'Add momentum',values:{},llm:'Training batches produce different gradients, so following only the latest one can give an uneven path. Momentum combines information from successive updates. AdamW also tracks squared gradients to scale updates for individual parameters; the slider here demonstrates momentum alone.'},
        {title:'A longer stride is a gamble.',text:'Increase the learning rate, then walk. Large steps can skip a valley or leave the plotted domain. A low gradient does not prove a global minimum.',prompt:'Must a finite step lower the loss?',tryLabel:'Load an overshoot example',values:{},llm:'The learning rate sets the size of an update. Many LLM training runs increase it gradually at the start and reduce it later. A large update can raise the loss even when it starts in a downhill direction, because that direction describes only the local slope.'}]},
    'attention':{
      name:'The listening chamber',subtitle:'Your gaze is the query.',
      accent:'#8de8df',secondary:'#f0b77e',
      action:{id:'att-in',label:'Focus your question'},
      legend:['Thread brightness · attention weight','Floor ring · weighted output'],
      note:'Eight synthetic keys; values equal keys. A head turn changes this example’s query direction.',
      dpad:{up:['ArrowUp','Lean in'],down:['ArrowDown','Lean back'],left:['ArrowLeft','Look left'],right:['ArrowRight','Look right']},
      hint:'Drag to look · A D to turn your question · W S to lean',
      lessons:[
        {title:'Ask with your direction.',text:'Turn towards a word. The query–key dot products change, and softmax redistributes the threads of attention.',prompt:'If you turn the query, will the same key necessarily keep the largest weight?',tryLabel:'Turn the query',values:{},llm:'A query is a learned projection of a token’s current representation. Its dot products with keys determine the attention scores. Both vector length and direction affect these scores, which is why turning and leaning change the weights in this example.'},
        {title:'Listen narrowly.',text:'Lower temperature concentrates weight on the strongest matches. The output moves towards the values that receive more weight.',prompt:'If you lower score temperature with the query fixed, what happens to the weight distribution?',tryLabel:'Lower score temperature',values:{},llm:'Standard scaled dot-product attention divides scores by √dₖ, where dₖ is the number of coordinates in a key. This controls score magnitude before softmax. The adjustable temperature here lets you examine the effect of score scaling; it is not the chat application’s sampling-temperature setting.'},
        {title:'Become a mixture.',text:'Raise temperature to spread attention. The output is a weighted sum, not simply the word with the highest score.',prompt:'Does the key with the largest weight become the next output token?',tryLabel:'Raise score temperature',values:{},llm:'Each attention weight multiplies a value vector, and the results are added. Several tokens can therefore contribute to the output of one head. This example uses the same vectors for keys and values; real heads learn value projections separately.'}]},
    'rotary':{
      name:'The clockwork passage',subtitle:'Position is how far you have turned.',
      accent:'#acafff',secondary:'#8de8df',
      action:{id:'rope-play',label:'Ride / stop'},
      legend:['Bright rail · earlier positions','Lamps · whole token positions'],
      note:'Two rotating coordinate pairs shown on a torus. The tunnel is an embedding of their two angles.',
      dpad:{up:['ArrowUp','Next token'],down:['ArrowDown','Previous token'],left:['ArrowLeft','Turn left'],right:['ArrowRight','Turn right']},
      hint:'Drag to look · W S to change token · R to ride · B to look back',
      lessons:[
        {title:'Two clocks, one position.',text:'Each token turns a fast pair and a slow pair of coordinates. Their combined angles trace this rail through a torus.',tryLabel:'Advance one token',values:{},click:'rope-next',llm:'RoPE rotates pairs of coordinates in query and key vectors before their dot products are calculated. Each pair uses a frequency, and token position determines the angle. Two pairs are shown here so that their combined motion can be drawn.'},
        {title:'Change the rhythm.',text:'Change the frequency ratio. The winding pattern changes because the two coordinate pairs accumulate phase at different rates.',tryLabel:'Change the gearing',values:{'rope-ratio':0.23},llm:'Fast rotations change substantially between nearby positions; slower rotations change over longer distances. A real model specifies a frequency schedule across coordinate pairs. This slider changes the ratio between just two frequencies, illustrating one part of that schedule.'},
        {title:'Distance survives rotation.',text:'Look back at previous positions. Applying the same rotation to a query and key preserves their dot product; their relative phase carries the distance.',tryLabel:'Look behind you',values:{},click:'rope-back',llm:'For fixed query and key content, the positional effect on their dot product depends on the difference between their positions. The content still matters. Frequency scaling can support longer contexts, but the model’s quality at those lengths has to be tested.'}]},
    'dimensions':{
      name:'The horizon of almost',subtitle:'Watch room appear between ideas.',
      accent:'#b8bdff',secondary:'#8de8df',
      action:{id:'dim-more',label:'Add dimensions'},
      legend:['Stars · sampled directions','Horizon · 90° from you'],
      note:'A sky projection of sampled angles, not a literal view of high-dimensional space. Large dimensions use an approximation.',
      noDust:true,
      dpad:{up:['ArrowUp','Tilt up'],down:['ArrowDown','Tilt down'],left:['ArrowLeft','Turn left'],right:['ArrowRight','Turn right']},
      hint:'Drag to look · arrows to turn · + − for dimensions',
      lessons:[
        {title:'A crowded small sky.',text:'In two dimensions, random directions often point towards or away from you. Their cosine similarities spread widely.',tryLabel:'Start with two',values:{'dim-k':0},llm:'A token’s residual-stream representation contains many coordinates, which attention and feed-forward layers update. This example begins with only two dimensions so that you can compare its angle distribution with wider spaces.'},
        {title:'Almost perpendicular.',text:'Add dimensions. Cosine similarities concentrate near zero; the stars collect near the 90° horizon. Their azimuth is decorative.',tryLabel:'Open 1,000 dimensions',values:{'dim-k':7},llm:'As dimension increases, independently sampled directions tend to have cosine similarity near zero. This geometry helps explain why many directions can coexist with limited overlap. A model’s learned representations are not guaranteed to follow the random distribution shown here.'},
        {title:'Space is not perfect separation.',text:'The spread shrinks roughly as 1/√d. Near-orthogonality leaves room for many features, but shared representations can still interfere.',tryLabel:'Open 12,288 dimensions',values:{'dim-k':9},llm:'Superposition describes representations in which more features share a space than there are dimensions. Sparse activation of features can make that useful, but interference remains possible. The narrow band here illustrates angle concentration; it does not measure how well a model stores or recovers features.'}]},
    'ablation':{
      name:'The disappearing direction',subtitle:'What remains when up is forgotten?',
      accent:'#f0b77e',secondary:'#b8bdff',
      action:{id:'abl-run',label:'Remove / restore original points'},
      legend:['Hollow lights · upper cluster','Solid lights · lower cluster'],
      note:'Synthetic activation clouds; the wire envelopes are illustrative scaffolds, not samples. Removing one direction is not a claim that real behaviour is always isolated to one axis.',
      dpad:{up:['ArrowUp','Drift forward'],down:['ArrowDown','Drift back'],left:['ArrowLeft','Turn left'],right:['ArrowRight','Turn right'],extra:[['r','Rise'],['f','Fall']]},
      hint:'Drag to look · W S to drift · R F rise and fall · X to ablate',
      lessons:[
        {title:'One direction separates two clouds.',text:'Rise or fall through the activations. The direction r̂ is up in this world; it is the axis along which the two synthetic groups differ.',tryLabel:'Restore the original points',values:{'abl-alpha':0},llm:'Researchers can compare activations from two sets of prompts and use the difference between their means as a candidate direction. The important test is whether changing that direction changes behaviour. Separation between two clouds alone does not establish a causal role.'},
        {title:'Subtract the projection.',text:'Ablation subtracts α(x·r̂)r̂. Nothing moves sideways: only the component parallel to the chosen direction shrinks.',tryLabel:'Remove halfway',values:{'abl-alpha':0.5},llm:'The subtraction removes the component along the chosen unit direction. In refusal experiments, researchers test interventions on residual-stream activations or corresponding weight edits. The edit’s effect on refusal and on other capabilities must be measured separately.'},
        {title:'There is no up left.',text:'At α = 1 every point lies on the perpendicular plane. Try rising now: motion along the removed direction has no visible effect.',tryLabel:'Remove the component',values:{'abl-alpha':1},llm:'At α = 1, the original component along this direction has been discarded. Adding a fixed steering vector can introduce a new component, but it cannot recover the different amounts removed from each point. In a real model, either intervention can affect later computation.'}]}
  };

  const rgb = hex => [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
  const rgba = (hex,a) => {const [r,g,b]=rgb(hex);return `rgba(${r},${g},${b},${a})`;};

  // Temporarily recolour the shared ink helpers inside a draw callback.
  function tint(ctx,color,draw){const old=ctx.mathsInk;ctx.mathsInk=color;try{draw();}finally{ctx.mathsInk=old;}}

  // Fill a translucent closed polygon through the projection, or draw nothing
  // when a vertex crosses the near plane or lands absurdly off screen.
  function surface(ctx,P,points,color,alpha){
    const ps=[];let z=0;
    for(const q of points){const p=P(q[0],q[1],q[2]);if(!p||Math.abs(p[0])>2e4||Math.abs(p[1])>2e4)return;ps.push(p);z+=p[2];}
    z/=ps.length;
    ctx.beginPath();ctx.moveTo(ps[0][0],ps[0][1]);
    for(let i=1;i<ps.length;i++)ctx.lineTo(ps[i][0],ps[i][1]);
    ctx.closePath();
    ctx.globalAlpha=alpha*Math.exp(-z/26);ctx.fillStyle=color;ctx.fill();ctx.globalAlpha=1;
  }

  // A softly glowing world-space marker: bounded radial gradient plus a core.
  function beacon(ctx,P,point,color,size,alpha=1){
    const p=P(point[0],point[1],point[2]);
    if(!p)return null;
    const r=Math.min(64,Math.max(2.5,size*P.f/p[2]));
    if(p[0]<-r||p[0]>ctx.canvas.clientWidth+r||p[1]<-r||p[1]>ctx.canvas.clientHeight+r)return null;
    const a=alpha*Math.exp(-p[2]/30);
    const g=ctx.createRadialGradient(p[0],p[1],0,p[0],p[1],r);
    g.addColorStop(0,rgba(color,.5*a));g.addColorStop(.45,rgba(color,.12*a));g.addColorStop(1,rgba(color,0));
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(p[0],p[1],r,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=Math.min(1,a*1.2);ctx.fillStyle=color;
    ctx.beginPath();ctx.arc(p[0],p[1],Math.max(1,r*.14),0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    return p;
  }

  // Deep space fill, a broad glow in the world's colours and sparse distant
  // dust — scenery only, kept dim so it cannot be mistaken for data.
  function atmosphere(s){
    const {ctx,w,h,world}=s;
    ctx.fillStyle='#040507';ctx.fillRect(0,0,w,h);
    const g1=ctx.createRadialGradient(w*.5,h*.68,0,w*.5,h*.68,Math.max(w,h)*.85);
    g1.addColorStop(0,rgba(world.accent,.07));g1.addColorStop(.55,rgba(world.accent,.02));g1.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g1;ctx.fillRect(0,0,w,h);
    const g2=ctx.createRadialGradient(w*.82,h*.2,0,w*.82,h*.2,Math.max(w,h)*.6);
    g2.addColorStop(0,rgba(world.secondary,.05));g2.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g2;ctx.fillRect(0,0,w,h);
    if(!world.noDust){
      const R=(n)=>{const x=Math.sin(n*127.1)*43758.5453;return x-Math.floor(x);};
      ctx.fillStyle=rgba(world.secondary,.5);
      for(let i=0;i<110;i++){
        const x=R(i+1)*w,y=R(i+977)*h*.9;
        ctx.globalAlpha=.04+R(i+313)*.08;
        ctx.fillRect(x,y,1,1);
      }
      ctx.globalAlpha=1;
    }
  }

  // Soft edge vignette drawn over the world; the reticle lives in CSS.
  function finish(s){
    const {ctx,w,h}=s;
    const v=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.34,w/2,h/2,Math.max(w,h)*.72);
    v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.5)');
    ctx.fillStyle=v;ctx.fillRect(0,0,w,h);
  }

  return {worlds,atmosphere,finish,tint,surface,beacon,rgba};
})();
