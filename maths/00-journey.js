/* 00 · The journey: shared world identities, palette helpers and the
   atmospheric frame every abstract world is painted inside. Loaded before
   maths.js; consumed by the stage and by the scene kits. */
const MathsJourney = (() => {
  const worlds = {
    'linear-maps':{
      name:'The lattice cathedral',subtitle:'Walk where the matrix sends you.',
      accent:'#8de8df',secondary:'#d9b68c',
      action:{id:'lm-shear',label:'Shear the world'},
      legend:['î · first basis direction','ĵ · second basis direction'],
      note:'A 2D linear map, imagined as architecture. Height is only scenery.',
      dpad:{up:['ArrowUp','Along ĵ'],down:['ArrowDown','Back along ĵ'],left:['ArrowLeft','Back along î'],right:['ArrowRight','Along î']},
      hint:'Drag to look · arrows or W A S D to step along the basis',
      lessons:[
        {title:'Every step is a vector.',text:'Walk across the lattice. The two columns of the matrix decide where a step along î or ĵ will take you.',tryLabel:'Restore the lattice',values:{},click:'lm-identity',llm:'The embedding is the first matrix a token meets: it turns “cat” into the vector you are standing on.'},
        {title:'One rule moves everything.',text:'Apply a shear. Parallel streets stay parallel, but their angles change. A matrix transforms every address by the same rule.',tryLabel:'Apply a shear',values:{},click:'lm-shear',llm:'The Q, K and V projections inside attention are learned matrices like this — a shear here changes what every token asks and answers.'},
        {title:'A dimension can disappear.',text:'Collapse the plane. The determinant becomes zero: different starting points now share the same destination. That information cannot be recovered.',tryLabel:'Collapse space',values:{},click:'lm-collapse',llm:'Low-rank updates such as LoRA fine-tune models by adding small matrices that deliberately keep only a few directions.'}]},
    'folding':{
      name:'The folding garden',subtitle:'Stand on the threshold of a non-linearity.',
      accent:'#c1a1ff',secondary:'#8de8df',
      action:{id:'fold-play',label:'Fold / unfold'},
      legend:['Filled lights · inner disc','Rings · outer cloud'],
      note:'Height visualises what the activation removes; the layer itself still maps two coordinates to two coordinates.',
      dpad:{up:['ArrowUp','Step forward'],down:['ArrowDown','Step back'],left:['ArrowLeft','Turn left'],right:['ArrowRight','Turn right']},
      hint:'Drag to look · W S to walk · A D to turn · F to fold',
      lessons:[
        {title:'Before the threshold.',text:'Two clouds share a flat sheet. Rotation and bias can move them, but a stack of linear operations is still one linear operation.',tryLabel:'Return to input',values:{'fold-t':0},llm:'Without this layer, attention plus feed-forward would collapse into one matrix — the fold is what gives depth any meaning.'},
        {title:'Watch the negatives vanish.',text:'With ReLU, negative coordinates become zero. Here their lost magnitude rises into walls so you can see where information is discarded.',tryLabel:'Apply ReLU',values:{'fold-act':'relu','fold-t':1},click:'fold-play',llm:'The feed-forward block runs in every transformer layer, right after attention. Its zero regions are where the network writes “off”.'},
        {title:'Change the rule.',text:'Leaky ReLU keeps a small negative slope. Compare its compressed region with the complete flattening of ReLU.',tryLabel:'Try a leaky fold',values:{'fold-act':'leaky','fold-t':2},llm:'Real models swapped ReLU for GELU and SwiGLU — smoother folds that keep a gradient alive through the crease.'}]},
    'gradient-descent':{
      name:'The valley of error',subtitle:'Feel the slope. Find a way down.',
      accent:'#d9b68c',secondary:'#8de8df',
      action:{id:'gd-step',label:'Take a learning step'},
      legend:['Terrain height · loss','Light trail · previous steps'],
      note:'A synthetic loss surface with two parameters. Real training may have billions.',
      dpad:{up:['ArrowUp','Take a step'],left:['ArrowLeft','Turn left'],right:['ArrowRight','Turn right']},
      hint:'Drag to look · W to step · R to walk · ← → to turn',
      lessons:[
        {title:'You can feel only the local slope.',text:'The arrow points opposite the gradient. A learning step moves the weights in that direction; the terrain is the loss, not a map the optimiser can inspect.',tryLabel:'Take one step',values:{},click:'gd-step',llm:'Backpropagation computes exactly the arrow at your feet — for billions of weights at once, from a single scalar loss.'},
        {title:'Carry a little momentum.',text:'Momentum carries part of the previous update into the next. It can accelerate a descent, but can also cause overshoot.',tryLabel:'Add momentum',values:{'gd-mu':0.7,'gd-lr':0.15},llm:'Adam, the standard LLM optimiser, is momentum plus per-weight scaling — the same idea of carrying speed between steps.'},
        {title:'A longer stride is a gamble.',text:'Increase the learning rate, then walk. Large steps can skip a valley or leave the plotted domain. A low gradient does not prove a global minimum.',tryLabel:'Lengthen the stride',values:{'gd-lr':1.5},llm:'Training schedules warm the rate up then decay it for exactly this reason: early steps need speed, late steps need to settle.'}]},
    'attention':{
      name:'The listening chamber',subtitle:'Your gaze is the query.',
      accent:'#8de8df',secondary:'#f0b77e',
      action:{id:'att-in',label:'Focus your question'},
      legend:['Thread brightness · attention weight','Floor ring · weighted output'],
      note:'Eight synthetic keys; values equal keys. A head turn changes this example’s query direction.',
      dpad:{up:['ArrowUp','Lean in'],down:['ArrowDown','Lean back'],left:['ArrowLeft','Look left'],right:['ArrowRight','Look right']},
      hint:'Drag to look · A D to turn your question · W S to lean',
      lessons:[
        {title:'Ask with your direction.',text:'Turn towards a word. The query–key dot products change, and softmax redistributes the threads of attention.',tryLabel:'Turn your question',values:{},click:'att-right',llm:'Each attention head learns its own Q and K matrices — the question you are asking is one head’s projection of the token.'},
        {title:'Listen narrowly.',text:'Lower temperature concentrates weight on the strongest matches. The output moves towards the values that receive more weight.',tryLabel:'Sharpen attention',values:{'att-temp':0.2},llm:'The √d scaling inside softmax plays this role inside the model — it keeps the weights from saturating in high dimensions.'},
        {title:'Become a mixture.',text:'Raise temperature to spread attention. The output is a weighted sum, not simply the word with the highest score.',tryLabel:'Listen widely',values:{'att-temp':2.5},llm:'Sampling uses the same knob: low temperature picks the obvious next word, high temperature flattens the odds.'}]},
    'rotary':{
      name:'The clockwork passage',subtitle:'Position is how far you have turned.',
      accent:'#acafff',secondary:'#8de8df',
      action:{id:'rope-play',label:'Ride / stop'},
      legend:['Bright rail · earlier positions','Lamps · whole token positions'],
      note:'Two rotating coordinate pairs shown on a torus. The tunnel is an embedding of their two angles.',
      dpad:{up:['ArrowUp','Next word'],down:['ArrowDown','Previous word'],left:['ArrowLeft','Turn left'],right:['ArrowRight','Turn right']},
      hint:'Drag to look · W S to change word · R to ride · B to look back',
      lessons:[
        {title:'Two clocks, one position.',text:'Each word turns a fast pair and a slow pair of coordinates. Their combined angles trace this rail through a torus.',tryLabel:'Advance one word',values:{},click:'rope-next',llm:'RoPE rotates every query–key pair inside each attention head — dozens of pairs, not two, each at a different frequency.'},
        {title:'Change the rhythm.',text:'Change the frequency ratio. The winding pattern changes because the two coordinate pairs accumulate phase at different rates.',tryLabel:'Change the gearing',values:{'rope-ratio':0.23},llm:'The frequency ratio is the “base” parameter; models such as Llama tune it to rebalance short- and long-range attention.'},
        {title:'Distance survives rotation.',text:'Look back at previous positions. Applying the same rotation to a query and key preserves their dot product; their relative phase carries the distance.',tryLabel:'Look behind you',values:{},click:'rope-back',llm:'Because only relative angle matters, stretching the frequencies stretches usable context — the trick behind NTK-aware scaling.'}]},
    'dimensions':{
      name:'The horizon of almost',subtitle:'Watch room appear between ideas.',
      accent:'#b8bdff',secondary:'#8de8df',
      action:{id:'dim-more',label:'Add dimensions'},
      legend:['Stars · sampled directions','Horizon · 90° from you'],
      note:'A sky projection of sampled angles, not a literal view of high-dimensional space. Large dimensions use an approximation.',
      noDust:true,
      dpad:{up:['ArrowUp','More dimensions'],down:['ArrowDown','Fewer dimensions'],left:['ArrowLeft','Turn left'],right:['ArrowRight','Turn right']},
      hint:'↑ ↓ add or remove dimensions · drag to look · + − also work',
      lessons:[
        {title:'A crowded small sky.',text:'In two dimensions, random directions often point towards or away from you. Their cosine similarities spread widely.',tryLabel:'Start with two',values:{'dim-k':0},llm:'You are riding the residual stream — the wide vector each token carries, which every layer reads from and writes back to.'},
        {title:'Almost perpendicular.',text:'Add dimensions. Cosine similarities concentrate near zero; the stars collect near the 90° horizon. Their azimuth is decorative.',tryLabel:'Open 1,000 dimensions',values:{'dim-k':7},llm:'Near-orthogonality enables superposition: the model packs far more features than it has dimensions into one stream.'},
        {title:'Space is not perfect separation.',text:'The spread shrinks roughly as 1/√d. Near-orthogonality leaves room for many features, but shared representations can still interfere.',tryLabel:'Open 12,288 dimensions',values:{'dim-k':9},llm:'The crowding has a cost — interference between features is part of why single neurons respond to unrelated ideas.'}]},
    'ablation':{
      name:'The disappearing direction',subtitle:'What remains when up is forgotten?',
      accent:'#f0b77e',secondary:'#b8bdff',
      action:{id:'abl-run',label:'Forget / restore height'},
      legend:['Hollow lights · upper cluster','Solid lights · lower cluster'],
      note:'Synthetic activation clouds; the wire envelopes are illustrative scaffolds, not samples. Removing one direction is not a claim that real behaviour is always isolated to one axis.',
      dpad:{up:['ArrowUp','Drift forward'],down:['ArrowDown','Drift back'],left:['ArrowLeft','Turn left'],right:['ArrowRight','Turn right'],extra:[['r','Rise'],['f','Fall']]},
      hint:'Drag to look · W S to drift · R F rise and fall · X to ablate',
      lessons:[
        {title:'One direction separates two clouds.',text:'Rise or fall through the activations. The direction r̂ is up in this world; it is the axis along which the two synthetic groups differ.',tryLabel:'Restore the direction',values:{'abl-alpha':0},llm:'Interpretability research finds real directions like this in the residual stream — for refusal, sentiment, even specific concepts.'},
        {title:'Subtract the projection.',text:'Ablation subtracts α(x·r̂)r̂. Nothing moves sideways: only the component parallel to the chosen direction shrinks.',tryLabel:'Remove halfway',values:{'abl-alpha':0.5},llm:'This subtraction, applied at every layer, is how abliteration removes a refusal behaviour without any retraining.'},
        {title:'There is no up left.',text:'At α = 1 every point lies on the perpendicular plane. Try rising now: motion along the removed direction has no visible effect.',tryLabel:'Forget height',values:{'abl-alpha':1},llm:'Steering vectors run the same move backwards — add a direction to push the model towards a behaviour instead of deleting it.'}]}
  };

  // Challenges score simulation outcomes, never camera motion or button counts.
  const challenges = {
    'linear-maps': [
      {title:'Deliver yourself to (2, 2)',hint:'Use ↑ and → to reach input address (2, 2). Shear the world and watch the destination change.',values:{},click:'lm-shear',score:v=>1-Math.min(1,Math.hypot(v.x-2,v.y-2)/Math.sqrt(8)),metric:v=>`Address (${v.x}, ${v.y}) · target (2, 2)`,win:'Delivered! Each step adds a matrix column. With the starting shear, (2, 2) lands at (4, 2).'},
      {title:'Make an entire direction disappear',hint:'Open Controls and choose Collapse. Move to see different addresses share a destination.',values:{},score:v=>1-Math.min(1,Math.abs(v.det)),metric:v=>`Area scale: ${Math.abs(v.det).toFixed(2)}× · target 0`,win:'Collapsed! A zero determinant means the map loses information.'}],
    folding:[
      {title:'Find a wall hidden in the floor',hint:'Fold the world, then walk with ↑ ↓ and turn with ← → until your height reaches 0.5.',values:{'fold-t':0,'fold-act':'relu','fold-theta':35,'fold-bias':.3},score:v=>Math.min(v.t/2,v.height/.5),metric:v=>`Your height: ${v.height.toFixed(2)} · target 0.50`,win:'Found it! The wall shows the magnitude ReLU removed from your negative coordinates.'},
      {title:'Bring the wall back to the floor',hint:'Unfold the world. Watch your lost coordinates return as the layer rewinds.',values:{},score:v=>1-v.t/2,metric:v=>`Layer applied: ${Math.round(v.t/2*100)}% · target 0%`,win:'Restored! Rewinding this demonstration restores the saved input; a real ReLU output alone cannot recover it.'}],
    'gradient-descent':[
      {title:'Find low ground',hint:'Take learning steps until loss is below 0.10. Watch the loss, not just the scenery.',values:{'gd-lr':.15,'gd-mu':0},click:'gd-new',score:v=>1-Math.max(0,v.loss-.1)/2,done:v=>v.loss<.1,metric:v=>`Loss ${v.loss.toFixed(3)} · target < 0.100 · ${v.steps} steps`,win:'Low ground reached! Small updates followed the local slope to reduce error.'},
      {title:'Settle the slope',hint:'Keep stepping until the gradient magnitude falls below 0.02. Try momentum in Controls.',values:{},score:v=>1-Math.max(0,v.slope-.02),done:v=>v.slope<.02,metric:v=>`Slope ${v.slope.toFixed(3)} · target < 0.020`,win:'Settled! A small gradient means a locally flat region, not proof of the best possible solution.'}],
    attention:[
      {title:'Tune in to “cat”',hint:'Turn with ← → toward cat, then lean in with ↑. Give cat at least 65% of the attention.',values:{'att-temp':.4},score:v=>v.cat/.65,metric:v=>`cat receives ${Math.round(v.cat*100)}% · target 65%`,win:'Tuned in! Aligning the query with a key and increasing its strength concentrates attention.'},
      {title:'Hear at least six words at once',hint:'Lean back with ↓ and raise temperature in Controls. Spread the attention across the room.',values:{},score:v=>v.effective/6,metric:v=>`Effective words: ${v.effective.toFixed(1)} / 8 · target 6`,win:'A mixture! The output combines values from many words, rather than choosing a single winner.'}],
    rotary:[
      {title:'Land on word 8',hint:'Use ↑ ↓ to travel one word at a time. Stop at position 8 and compare the two clocks.',values:{'rope-pos':0,'rope-ratio':.08},score:v=>1-Math.min(1,Math.abs(v.pos-8)/8),done:v=>Math.abs(v.pos-8)<.02,metric:v=>`Position ${v.pos.toFixed(1)} · target 8`,win:'Arrived! Both coordinate pairs encode the same position at different rotation speeds.'},
      {title:'Inspect the trail you encoded',hint:'Advance to word 16, then press B or use Look back in Controls to inspect earlier positions.',values:{},score:v=>Math.min(v.pos/16,v.back?1:.5),metric:v=>`Position ${v.pos.toFixed(1)} / 16 · ${v.back?'looking back':'look forward'}`,win:'Trail revealed! Relative phase records separation between positions.'}],
    dimensions:[
      {title:'Gather 90% near the horizon',hint:'Use ↑ to add dimensions. Find enough room for 90% of sampled directions to have |cos θ| < 0.1.',values:{'dim-k':0},score:v=>v.near/.9,metric:v=>`${v.d.toLocaleString()} dimensions · ${(v.near*100).toFixed(1)}% near horizon · target 90%`,win:'Room found! Random directions concentrate near perpendicular as dimension grows.'},
      {title:'Scatter the sky again',hint:'Use ↓ to remove dimensions until fewer than 10% of directions are near the horizon.',values:{},score:v=>1-Math.max(0,v.near-.1),done:v=>v.near<.1,metric:v=>`${(v.near*100).toFixed(1)}% near horizon · target < 10%`,win:'Scattered! Low-dimensional random directions have a much wider spread of similarities.'}],
    ablation:[
      {title:'Erase the gap between the clouds',hint:'Forget height to bring the cluster separation along r̂ below 0.01. Watch the gap shrink.',values:{'abl-alpha':0},score:v=>v.alpha,done:v=>v.gap<.01,metric:v=>`Cluster gap ${v.gap.toFixed(2)} · target < 0.01`,win:'Gap erased! Subtracting the projection removes the component parallel to r̂.'},
      {title:'Test the missing direction',hint:'Press Rise or Fall while height is removed. A blocked move is the experiment: sideways motion still works.',values:{'abl-alpha':1},score:v=>v.blocked?1:0,metric:v=>v.blocked?'Height input received · output movement 0':'Try Rise or Fall',win:'Confirmed! Your input height changed, but its projected output stayed zero. Restore height to see it again.'}]
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

  return {worlds,challenges,atmosphere,finish,tint,surface,beacon,rgba};
})();
