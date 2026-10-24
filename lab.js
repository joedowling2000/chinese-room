/* Static experiments: synthetic calculations and published aggregate results.
   No inference calls. Cube coordinates: x right, y up, z front. */
const Lab = (() => {
  const faces = {
    U: {n:[0,1,0], r:[1,0,0], u:[0,0,-1], color:'#f0eee7', name:'white'},
    L: {n:[-1,0,0], r:[0,0,1], u:[0,1,0], color:'#ee913d', name:'orange'},
    F: {n:[0,0,1], r:[1,0,0], u:[0,1,0], color:'#73be85', name:'green'},
    R: {n:[1,0,0], r:[0,0,-1], u:[0,1,0], color:'#e96c6c', name:'red'},
    B: {n:[0,0,-1], r:[-1,0,0], u:[0,1,0], color:'#70a8df', name:'blue'},
    D: {n:[0,-1,0], r:[1,0,0], u:[0,0,1], color:'#e7ce64', name:'yellow'}
  };
  const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const add=(...vs)=>[0,1,2].map(i=>vs.reduce((s,v)=>s+v[i],0));
  const mul=(v,s)=>v.map(x=>x*s);
  const solved=()=>Object.entries(faces).flatMap(([face,f])=>Array.from({length:9},(_,i)=>({
    p:add(f.n,mul(f.r,i%3-1),mul(f.u,1-Math.floor(i/3))),n:[...f.n],face
  })));
  function turn(cube,move){
    const axis=faces[move[0]].n, count=move.endsWith('2')?2:move.endsWith("'")?3:1;
    const rotate=v=>add(mul(axis,dot(axis,v)),mul(cross(axis,v),-1));
    for(let i=0;i<count;i++) cube.forEach(s=>{if(dot(s.p,axis)===1){s.p=rotate(s.p);s.n=rotate(s.n)}});
  }
  const inverse=m=>m.endsWith('2')?m:m.endsWith("'")?m[0]:m+"'";
  const format=n=>Number(n.toFixed(5)).toString();
  const cards=()=>`<div class="lab-cards"><a class="lab-card" href="#lab/mindcuber"><span class="lab-eyebrow">01 / MINDCUBER</span><div class="lab-card-art cube-glyph" aria-hidden="true">▧</div><h2>Cube scrambles and training results</h2><p>Undo a scramble move by move and inspect the reported training results.</p><span class="text-link">Explore Mindcuber →</span></a><a class="lab-card" href="#lab/quantization"><span class="lab-eyebrow">02 / QUANTISATION</span><div class="lab-card-art quant-glyph" aria-hidden="true">▁ ▂ ▄ ▆ █ ▆ ▃ ▁</div><h2>Rounding model weights</h2><p>Compare number formats and see what rounding does to a set of weights.</p><span class="text-link">Try quantisation →</span></a></div>`;
  const invitation=()=>`<section class="section lab-invitation"><div class="section-inner"><div class="section-heading"><div><div class="section-index">Hands on / The lab</div><h2>Try the ideas.</h2></div><p class="lab-muted">Small experiments, running in your browser.</p></div>${cards()}</div></section>`;
  const intro=(kicker,title,copy)=>`<a class="text-link" href="#lab">← The lab</a><header class="lab-header"><div class="lab-eyebrow">${kicker}</div><h1 class="page-title">${title}</h1><p class="page-intro">${copy}</p></header>`;
  function page(id){
    if(id==='mindcuber') return cubePage();
    if(id==='quantization') return quantPage();
    return `<section class="page lab-page"><div class="page-index">The lab / interactive experiments</div><h1 class="page-title">Try the examples</h1><p class="page-intro">The cube example shows how a scramble can be undone. The quantisation example compares rounding error and estimated weight storage for several number formats.</p>${cards()}<p class="lab-footnote">Each experiment explains its source and limits. No hosted model is connected.</p></section>`;
  }
  function cubePage(){return `<section class="page lab-page">${intro('01 / MINDCUBER','Cube scrambles and training results','Start with a scramble and undo it one move at a time. Below the simulation are the network\'s reported test results.')}<div class="lab-banner"><span class="lab-badge">BROWSER SIMULATION</span><p>This animation reverses the moves used to scramble the cube. It does not run the trained network, and the reversal may be longer than the shortest solution.</p></div><div class="lab-workbench"><div class="cube-stage"><div class="lab-panel-top"><span>01 / Explore the state</span><button class="button" id="cube-view">View back</button></div><div id="cube-picture"></div><p id="cube-status" class="cube-status" role="status" aria-live="polite"></p><details class="cube-net-details"><summary>Unfold all six faces</summary><div id="cube-net" class="cube-net"></div><p class="lab-footnote">Letters identify sticker colours: W white, O orange, G green, R red, B blue, Y yellow. Face labels stay fixed.</p></details></div><div class="lab-controls"><span class="lab-eyebrow">02 / Scramble & rewind</span><label for="cube-depth">Random scramble length <output id="cube-depth-value">10</output></label><input id="cube-depth" type="range" min="1" max="25" value="10"><button class="button" id="cube-generate">New scramble ↻</button><form id="cube-form"><label for="cube-input">Or enter your own moves</label><textarea id="cube-input" rows="3" maxlength="300" spellcheck="false" aria-describedby="cube-input-help cube-error">R U F' L D B' R' U' F D'</textarea><p class="lab-footnote" id="cube-input-help">U D L R F B turn a face clockwise when looking directly at it. Add ' for anticlockwise or 2 for a half turn. Up to 50 moves.</p><p id="cube-error" class="lab-error" role="alert"></p><button class="button" type="submit">Apply scramble</button></form><div class="lab-divider"></div><label>Reversal sequence</label><div id="cube-sequence" class="lab-moves" aria-label="Reversal sequence"></div><div class="lab-button-row"><button class="button" id="cube-prev" aria-label="Previous reversal move">← Back</button><button class="button primary" id="cube-play">Play reversal</button><button class="button" id="cube-next" aria-label="Next reversal move">Step →</button><button class="button" id="cube-reset">Restart</button></div><label for="cube-speed">Playback speed</label><select id="cube-speed"><option value="1200">Slow · 1.2 seconds / move</option><option value="650" selected>Normal · 0.65 seconds / move</option><option value="300">Fast · 0.3 seconds / move</option></select></div></div><section class="lab-section"><div class="lab-eyebrow">03 / THE ACTUAL EXPERIMENT</div><h2>Results at epoch 10</h2><p class="lab-muted">Results reported in Joe’s article at epoch 10, with 100 freshly scrambled cubes at each depth. Choose a depth to inspect that sample.</p><div class="lab-button-row" id="cube-depths">${[5,10,15,20].map(d=>`<button class="button" data-depth="${d}" aria-pressed="${d===20}">${d} moves</button>`).join('')}</div><div class="result-layout"><div id="cube-result-dots" class="result-dots" aria-hidden="true"></div><div id="cube-results" aria-live="polite"></div></div><p class="lab-footnote">Each square represents one cube in the reported sample; square order is illustrative, not an individual solve record.</p><details class="lab-data"><summary>Results methodology</summary><p class="lab-footnote">These are aggregate figures, not replay logs. Search settings and individual runs are not available here. The separate robot trial solved 19 of 19 cubes; it is a different sample and should not be combined with these rates.</p></details></section><div class="lab-next"><div><h2>From stickers to a robot.</h2><p>The article follows the encoding, network, training and search.</p></div><div class="lab-button-row"><a class="button" href="#article/mindcuber">Read Mindcuber →</a><a class="button primary" href="#lab/quantization">Next: quantisation →</a></div></div></section>`}
  let cleanup=()=>{};
  function wire(id){cleanup();cleanup=()=>{};if(id==='mindcuber')wireCube();if(id==='quantization')wireQuant()}
  function wireCube(){
    const $=id=>document.getElementById(id);
    let scramble=[], moves=[], step=0, timer=null, frame=null, back=false;
    let playing=false, turning=false;
    const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
    const picture=$('cube-picture');
    // CSS handles depth and occlusion for 26 solid pieces. All three axes use
    // the same scale; perspective replaces the old uneven SVG projection.
    picture.innerHTML=`<div class="cube-scene" role="img" aria-label="Interactive cube"><div class="cube-shadow"></div><div class="cube-orientation"><div class="cube-fixed"></div><div class="cube-turning"></div></div></div>`;
    const scene=picture.querySelector('.cube-scene');
    const orientation=picture.querySelector('.cube-orientation');
    const fixedLayer=picture.querySelector('.cube-fixed');
    const movingLayer=picture.querySelector('.cube-turning');
    function state(){
      const cube=solved();
      scramble.forEach(m=>turn(cube,m));
      moves.slice(0,step).forEach(m=>turn(cube,m));
      return cube;
    }
    function renderPieces(cube,move=null){
      const axis=move?faces[move[0]].n:null;
      const stationary=[], moving=[];
      for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){
        if(x===0&&y===0&&z===0)continue;
        const position=[x,y,z];
        const stickers=cube.filter(s=>s.p.every((v,i)=>v===position[i]));
        const surfaces=Object.entries(faces).map(([name,f])=>{
          const sticker=stickers.find(s=>dot(s.n,f.n)===1);
          return `<div class="cubie-face cubie-${name}">${sticker?`<span class="cubie-sticker" style="--sticker:${faces[sticker.face].color}"></span>`:''}</div>`;
        }).join('');
        const piece=`<div class="cubie" style="transform:translate3d(${x*60}px,${-y*60}px,${z*60}px)">${surfaces}</div>`;
        (axis&&dot(position,axis)===1?moving:stationary).push(piece);
      }
      fixedLayer.innerHTML=stationary.join('');
      movingLayer.innerHTML=moving.join('');
      movingLayer.style.transform='';
      orientation.classList.toggle('is-back',back);
      scene.setAttribute('aria-label',`Cube after ${step} reversal moves; ${back?'up, back and left':'up, front and right'} faces visible. Open the unfolded view for all stickers.`);
    }
    function controls(){
      $('cube-prev').disabled=turning||step===0;
      $('cube-next').disabled=turning||step===moves.length;
      $('cube-play').disabled=!playing&&step===moves.length;
      $('cube-play').textContent=playing?'Pause':'Play reversal';
    }
    function stop(){
      clearTimeout(timer);timer=null;playing=false;
      if($('cube-play'))$('cube-play').textContent='Play reversal';
    }
    function cancelTurn(){
      stop();cancelAnimationFrame(frame);frame=null;turning=false;
    }
    function draw(){
      const cube=state();
      renderPieces(cube);
      const letters={U:'W',D:'Y',L:'O',R:'R',F:'G',B:'B'};
      $('cube-net').innerHTML=Object.entries(faces).map(([name,f])=>{
        const stickers=cube.filter(s=>dot(s.n,f.n)===1).sort((a,b)=>(dot(b.p,f.u)-dot(a.p,f.u))*3+dot(a.p,f.r)-dot(b.p,f.r));
        return `<div class="net-face net-${name}"><b>${name}</b><div>${stickers.map(s=>`<span style="background:${faces[s.face].color}" title="${faces[s.face].name}">${letters[s.face]}</span>`).join('')}</div></div>`;
      }).join('');
      const isSolved=cube.every(s=>dot(s.n,faces[s.face].n)===1);
      $('cube-status').textContent=`${isSolved?'Solved state':'Scrambled state'} · ${step} / ${moves.length} reversal moves${step?' · last move '+moves[step-1]:''}`;
      $('cube-sequence').innerHTML=moves.map((m,i)=>`<span class="token ${i<step?'solved':''}" ${i===step?'aria-current="step"':''}>${m}</span>`).join('');
      controls();
    }
    function apply(){
      const raw=$('cube-input').value.trim().replace(/[’′]/g,"'").toUpperCase();
      const parsed=raw?raw.split(/\s+/):[];
      if(!parsed.length||parsed.length>50||parsed.some(m=>!/^([UDLRFB])('|2)?$/.test(m))){$('cube-error').textContent="Enter 1–50 space-separated moves, such as R U F' D2.";$('cube-input').setAttribute('aria-invalid','true');return}
      cancelTurn();$('cube-error').textContent='';$('cube-input').removeAttribute('aria-invalid');scramble=parsed;moves=parsed.slice().reverse().map(inverse);step=0;draw();
    }
    $('cube-form').onsubmit=e=>{e.preventDefault();apply()};
    $('cube-depth').oninput=()=>{$('cube-depth-value').value=$('cube-depth').value};
    $('cube-generate').onclick=()=>{let last='';const generated=[];for(let i=0;i<Number($('cube-depth').value);i++){const options=Object.keys(faces).filter(f=>f!==last);last=options[Math.floor(Math.random()*options.length)];generated.push(last+(Math.random()<.5?"'":''))}$('cube-input').value=generated.join(' ');apply()};
    function advance(direction){
      if(turning||step+direction<0||step+direction>moves.length)return;
      clearTimeout(timer);timer=null;
      const move=direction===1?moves[step]:inverse(moves[step-1]);
      const axis=faces[move[0]].n;
      // Invert the mathematical rotation angle because CSS uses a downwards Y axis.
      const angle=move.endsWith('2')?180:move.endsWith("'")?-90:90;
      const interval=Number($('cube-speed').value);
      const duration=reducedMotion.matches?0:interval*.8;
      const started=performance.now();
      turning=true;
      renderPieces(state(),move);
      controls();
      $('cube-status').textContent=`Turning ${move} · ${direction===1?'reversal':'back'} move ${direction===1?step+1:step} / ${moves.length}`;
      function animate(now){
        const progress=duration?Math.min(1,(now-started)/duration):1;
        const eased=progress*progress*(3-2*progress);
        movingLayer.style.transform=`rotate3d(${axis[0]},${-axis[1]},${axis[2]},${angle*eased}deg)`;
        if(progress<1){frame=requestAnimationFrame(animate);return}
        frame=null;turning=false;step+=direction;
        if(step===moves.length)stop();
        draw();
        if(playing)timer=setTimeout(()=>advance(1),Math.max(60,Number($('cube-speed').value)-duration));
      }
      frame=requestAnimationFrame(animate);
    }
    $('cube-next').onclick=()=>{stop();advance(1)};
    $('cube-prev').onclick=()=>{stop();advance(-1)};
    $('cube-reset').onclick=()=>{cancelTurn();step=0;draw()};
    $('cube-play').onclick=()=>{
      if(playing){stop();controls();return}
      if(step<moves.length){playing=true;controls();if(!turning)advance(1)}
    };
    // A speed change takes effect on the next turn; never interrupt a layer halfway.
    $('cube-view').onclick=()=>{
      back=!back;
      $('cube-view').textContent=back?'View front':'View back';
      orientation.classList.toggle('is-back',back);
      scene.setAttribute('aria-label',`Cube viewed from the ${back?'back':'front'}. Open the unfolded view for all stickers.`);
    };
    const visibility=()=>{if(document.hidden){cancelTurn();draw()}};
    document.addEventListener('visibilitychange',visibility);
    cleanup=()=>{cancelTurn();document.removeEventListener('visibilitychange',visibility)};
    function results(depth){
      const data={5:[100,4.9],10:[100,9.9],15:[59,19.2],20:[37,27.4]};const [rate,average]=data[depth];
      document.querySelectorAll('[data-depth]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.depth)===depth)));
      $('cube-result-dots').innerHTML=Array.from({length:100},(_,i)=>`<i class="${i<rate?'is-solved':''}"></i>`).join('');
      $('cube-results').innerHTML=`<div class="lab-big-number">${rate}<small> / 100</small></div><h3>Cubes solved after ${depth}-move scrambles</h3><p>${100-rate} unsolved in this sample.<br><strong>${average}</strong> average moves to solve, as reported.</p><p class="lab-footnote">A generated ${depth}-move scramble can have a shorter solution.</p>`;
    }
    document.querySelectorAll('[data-depth]').forEach(b=>b.onclick=()=>results(Number(b.dataset.depth)));
    apply();results(20);
  }
  function quantPage(){return `<section class="page lab-page">${intro('02 / QUANTISATION','What changes when you round a weight?','Choose a number format and compare 32 example weights before and after rounding. Increase the largest weight to see how it affects the other values sharing its scale.')}<div class="lab-banner"><span class="lab-badge">SYNTHETIC WEIGHTS</span><p>32 invented values, calculated in your browser. Rounding error here is not a measure of language-model quality or speed.</p></div><div class="lab-workbench quant-workbench"><div class="lab-controls"><span class="lab-eyebrow">01 / CHOOSE THE TRADE-OFF</span><label for="quant-format">Number format</label><select id="quant-format"><option value="int4">INT4 · symmetric integers</option><option value="int8">INT8 · symmetric integers</option><option value="fp4">E2M1 · floating point, ideal scale</option></select><label for="quant-block">Values sharing a scale</label><select id="quant-block"><option value="32">32 · one scale for all weights</option><option value="16" selected>16 · two blocks</option><option value="8">8 · four blocks</option></select><label for="quant-outlier">Largest weight <output id="quant-outlier-value">1.0</output></label><input id="quant-outlier" type="range" min="1" max="8" value="1" step="0.1"><p class="lab-muted">Try increasing the largest weight. Its block must cover a wider range, leaving less precision for smaller values.</p><button class="button" id="quant-reset">Reset example</button><div class="lab-divider"></div><div id="quant-method" class="lab-footnote"></div></div><div class="quant-stage"><div class="lab-panel-top"><span>02 / Original → reconstructed</span><span class="quant-legend"><i></i> Original <b></b> Stored</span></div><div id="quant-chart"></div><div id="quant-metrics" class="quant-metrics" aria-live="polite"></div><p class="lab-footnote">Each row is one weight. The line connects its original value (circle) to its reconstructed value (diamond). Colours identify blocks that share a scale. Exact values are available below.</p></div></div><details class="lab-data"><summary>Inspect all 32 values and their scales</summary><div class="article-table-wrap"><table class="article-table"><caption>Calculated values for this example</caption><thead><tr><th scope="col">Weight</th><th scope="col">Block</th><th scope="col">Original</th><th scope="col">Scale</th><th scope="col">Code value</th><th scope="col">Reconstructed</th><th scope="col">Absolute error</th></tr></thead><tbody id="quant-values"></tbody></table></div></details><section class="lab-section"><div class="lab-eyebrow">03 / THE STORAGE QUESTION</div><h2>Weight storage estimate</h2><p class="lab-muted">A weight-only estimate, assuming every parameter uses the selected format. This does not estimate runtime memory, model quality or inference speed.</p><label for="quant-size">Model size in billions of parameters <output id="quant-size-value">46.7</output></label><input id="quant-size" type="range" min="1" max="128" step="0.1" value="46.7"><div id="quant-storage" class="storage-grid" aria-live="polite"></div><p class="lab-footnote">GB means 10⁹ bytes; GiB means 2³⁰ bytes. INT8 and INT4 figures include only packed values, excluding scale metadata. NVFP4 includes one FP8 scale per 16 weights (4.5 bits per weight); per-tensor FP32 scales, padding and other metadata are excluded. Real models may keep some layers at higher precision. Activations, KV cache and runtime allocations need additional memory.</p></section><div class="lab-next"><div><h2>Where does NVFP4 come in?</h2><p>NVFP4 combines E2M1 values with an FP8 scale for each group of 16 and an FP32 scale per tensor. The playground above uses an ideal, unrounded scale so you can isolate the effect of rounding the weights. It does not reproduce the full NVFP4 format.</p><a class="text-link" href="https://developer.nvidia.com/blog/introducing-nvfp4-for-efficient-and-accurate-low-precision-inference/" target="_blank" rel="noopener">NVIDIA’s format explanation ↗</a></div><div class="lab-button-row"><a class="button primary" href="#article/nvfp4">Read the Mixtral experiment →</a><a class="button" href="#lab/mindcuber">Explore Mindcuber</a></div></div></section>`}
  function wireQuant(){
    const $=id=>document.getElementById(id);
    // Fixed synthetic example: the same inputs are compared for every format.
    const original=Array.from({length:32},(_,i)=>Number((Math.sin(i*1.7+.3)*(.18+(i%8)*.085)).toFixed(4)));
    function update(){
      const type=$('quant-format').value, block=Number($('quant-block').value), outlier=Number($('quant-outlier').value);
      $('quant-outlier-value').value=outlier.toFixed(1);
      const weights=[...original];weights[15]=outlier;
      const limit=type==='int8'?127:type==='int4'?7:6;
      const levels=[-6,-4,-3,-2,-1.5,-1,-.5,0,.5,1,1.5,2,3,4,6];
      const rows=weights.map((w,i)=>{
        const group=Math.floor(i/block), scale=Math.max(...weights.slice(group*block,(group+1)*block).map(Math.abs))/limit;
        const value=w/scale;
        // Ties away from zero for integers, towards zero for E2M1.
        const q=type==='fp4'?levels.reduce((best,v)=>Math.abs(v-value)<Math.abs(best-value)||(Math.abs(v-value)===Math.abs(best-value)&&Math.abs(v)<Math.abs(best))?v:best,0):Math.sign(value)*Math.min(limit,Math.round(Math.abs(value)));
        return {w,group,scale,q,reconstructed:q*scale,error:Math.abs(w-q*scale)};
      });
      const mae=rows.reduce((s,r)=>s+r.error,0)/rows.length,max=Math.max(...rows.map(r=>r.error));
      $('quant-metrics').innerHTML=`<div><small>Mean absolute error</small><strong>${format(mae)}</strong></div><div><small>Largest absolute error</small><strong>${format(max)}</strong></div><div><small>Shared scales</small><strong>${32/block}</strong></div>`;
      $('quant-method').innerHTML=type==='fp4'?'<strong>Scaled E2M1 illustration</strong><p>Magnitudes: 0, 0.5, 1, 1.5, 2, 3, 4, 6, with either sign. Scale = largest absolute value in the block ÷ 6. Choose the nearest code value; ties go towards zero. Scales use JavaScript precision, without NVFP4’s FP8/FP32 scale encoding.</p>':`<strong>Symmetric ${type.toUpperCase()}</strong><p>Code values run from −${limit} to ${limit}, using ${limit*2+1} of ${type==='int8'?256:16} bit patterns. Scale = largest absolute value in the block ÷ ${limit}. Round to the nearest integer (ties away from zero), then multiply by the scale to reconstruct.</p>`;
      $('quant-values').innerHTML=rows.map((r,i)=>`<tr><th scope="row">${i+1}</th><td>${r.group+1}</td><td>${format(r.w)}</td><td>${format(r.scale)}</td><td>${format(r.q)}</td><td>${format(r.reconstructed)}</td><td>${format(r.error)}</td></tr>`).join('');
      const low=-1,high=outlier,x=v=>45+(v-low)/(high-low)*505,colors=['#c8f03c','#8daaf6','#e6a36c','#c896dc'];
      $('quant-chart').innerHTML=`<svg viewBox="0 0 590 565" role="img" aria-label="Comparison of 32 original and reconstructed weights. Mean absolute error ${format(mae)}. Exact values in the table below."><line x1="${x(0)}" x2="${x(0)}" y1="22" y2="536" stroke="#3a4049" stroke-dasharray="3 5"/>${rows.map((r,i)=>{const y=32+i*16,a=x(r.w),b=x(r.reconstructed),c=colors[r.group];return `<text x="8" y="${y+4}" class="plot-label">${String(i+1).padStart(2,'0')}</text><line x1="${a}" y1="${y}" x2="${b}" y2="${y}" stroke="${c}" stroke-width="2"/><circle cx="${a}" cy="${y}" r="3.5" fill="var(--panel)" stroke="#d3d6da" stroke-width="1.5"/><path d="M ${b} ${y-4} l 4 4 -4 4 -4 -4 Z" fill="${c}"/>`}).join('')}<text x="45" y="557" class="plot-label">−1</text><text x="${x(0)}" y="557" text-anchor="middle" class="plot-label">0</text><text x="550" y="557" text-anchor="end" class="plot-label">${outlier.toFixed(1)}</text></svg>`;
    }
    function storage(){const size=Number($('quant-size').value);$('quant-size-value').value=size.toFixed(1);$('quant-storage').innerHTML=[['BF16',16],['INT8',8],['INT4',4],['NVFP4',4.5]].map(([name,bits])=>{const gb=size*bits/8;return `<div class="storage-card"><span class="lab-eyebrow">${name}</span><strong>${gb.toFixed(2)} <small>GB</small></strong><span>${(gb*1e9/2**30).toFixed(2)} GiB</span><div class="storage-track"><i style="width:${bits/16*100}%"></i></div><small>${bits} bits / weight${name==='NVFP4'?' incl. block scales':''}</small></div>`}).join('')}
    ['quant-format','quant-block','quant-outlier'].forEach(id=>$(id).addEventListener('input',update));
    $('quant-size').oninput=storage;
    $('quant-reset').onclick=()=>{$('quant-format').value='int4';$('quant-block').value='16';$('quant-outlier').value='1';$('quant-size').value='46.7';update();storage()};
    update();storage();
  }
  return {page,wire,invitation};
})();
