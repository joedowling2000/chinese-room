/* The Maths of AI: seven interactive illustrations drawn in the Field style.
   This file holds the page, the shared canvas plumbing and the full-screen
   journey shell; each illustration registers itself from maths/*.js.
   Small synthetic examples computed in the browser; no model is run. */
const Maths = (() => {
  const INK = '#e8e8e8';
  const $ = id => document.getElementById(id);
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const lerp = (a,b,t) => a+(b-a)*t;
  const ease = t => t*t*(3-2*t);
  const sysReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let paused = sysReduced();
  const reduced = () => sysReduced()||paused;
  function rng(seed){
    let s=seed>>>0;
    return ()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
  }
  const gauss = r => Math.sqrt(-2*Math.log(1-r()))*Math.cos(2*Math.PI*r());
  const V = {
    add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],
    sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],
    mul:(a,k)=>[a[0]*k,a[1]*k,a[2]*k],
    dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
    cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
    norm:a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];}
  };
  // First-person direction: yaw 0 looks along +z, yaw π/2 along +x; positive pitch looks up.
  const heading = (yaw,pitch=0) => [Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)];
  // Shortest signed turn from angle a to angle b.
  const turn = (a,b) => Math.atan2(Math.sin(b-a),Math.cos(b-a));

  /* ---------- Markup ---------- */
  // Wording that changes when abstract mode is on.
  const swap = (flat,abstract) => abstract===undefined?flat:`<span class="flat-only">${flat}</span><span class="ab-only">${abstract}</span>`;
  const ui = {
    swap,
    slider:(id,label,min,max,step,value,abstract)=>`<label class="maths-slider" for="${id}"><span>${swap(label,abstract)}<output id="${id}-out" for="${id}"></output></span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"></label>`,
    button:(id,label,abstract,attrs='')=>`<button type="button" class="maths-btn" id="${id}" ${attrs}>${swap(label,abstract)}</button>`,
    buttons:(...b)=>`<div class="maths-buttons">${b.join('')}</div>`
  };

  const scenes = [];
  const scene = def => { scenes.push(def); };
  const worldOf = def => MathsJourney.worlds[def.id];

  function overlay(t){
    const w=worldOf(t),i=scenes.indexOf(t),n=scenes.length,no=String(i+1).padStart(2,'0'),tot=String(n).padStart(2,'0');
    const d=w.dpad,db=(dir)=>{const e=d[dir];return e?`<button type="button" class="mt-dir mt-${dir}" data-key="${e[0]}" aria-label="${e[1]}"><span aria-hidden="true">${{up:'↑',down:'↓',left:'←',right:'→'}[dir]}</span><small>${e[1]}</small></button>`:'<span class="mt-gap"></span>';};
    return `<div class="maths-ovl">
  <header class="maths-topline">
    <div class="maths-ident"><p class="maths-kicker">The maths · ${no} — ${tot}</p><h3 class="maths-worldname">${w.name}</h3><p class="maths-sub">${w.subtitle}</p></div>
    <div class="maths-topbtns">
      <span class="maths-modegrp" role="group" aria-label="View mode"><button type="button" class="maths-topbtn maths-mode-ab" aria-pressed="true">Abstract</button><button type="button" class="maths-topbtn maths-mode-flat" aria-pressed="false">Diagram</button></span>
      <button type="button" class="maths-topbtn maths-pause" aria-pressed="false">Pause motion</button>
      <button type="button" class="maths-topbtn maths-drawer-toggle" aria-expanded="false" aria-controls="mp-${t.id}">Controls</button>
      <button type="button" class="maths-topbtn maths-guide-toggle" aria-expanded="true">Guide</button>
      <button type="button" class="maths-topbtn maths-clear" aria-pressed="false">Clear view</button>
      <button type="button" class="maths-topbtn maths-exit">Exit <span aria-hidden="true">×</span></button>
    </div>
  </header>
  <button type="button" class="maths-reveal" hidden>Show panels</button>
  <aside class="maths-challenge" aria-label="Play challenge"><p class="maths-kicker mc-count"></p><h4 class="mc-title"></h4><p class="mc-hint"></p><progress class="mc-progress" max="1" value="0" aria-label="Challenge progress"></progress><p class="mc-metric"></p><p class="mc-result" role="status"></p><button type="button" class="maths-btn mc-next">Start challenge</button></aside>
  <aside class="maths-guide" aria-label="Guide">
    <p class="maths-kicker g-eyebrow"></p>
    <h4 class="g-title"></h4>
    <p class="g-text"></p>
    <p class="g-llm"></p>
    <button type="button" class="maths-btn g-try"></button>
    <div class="g-nav">
      <button type="button" class="maths-topbtn g-prev" aria-label="Previous lesson">←</button>
      <span class="g-steps" aria-hidden="true"><i></i><i></i><i></i></span>
      <button type="button" class="maths-topbtn g-next">Next →</button>
    </div>
    <details class="g-details"><summary>Legend &amp; notes</summary>
      <ul class="g-legend">${w.legend.map(l=>`<li>${l}</li>`).join('')}</ul>
      <p class="g-note">${w.note}</p>
      <details class="g-about"><summary>About this world</summary><div class="g-dream"></div></details>
    </details>
  </aside>
  <div class="maths-ribbon" id="mr-${t.id}"></div>
  <div class="maths-transport">
    <div class="mt-row">
      <div class="mt-dpad" role="group" aria-label="Move">
        ${db('up')}${db('left')}${db('right')}${db('down')}
        ${(d.extra||[]).map(([key,lab])=>`<button type="button" class="mt-dir mt-extra" data-key="${key}"><small>${lab}</small></button>`).join('')}
      </div>
      <button type="button" class="maths-btn mt-action" data-action="${w.action.id}">${w.action.label}</button>
      <button type="button" class="maths-topbtn mt-reset">Reset view</button>
    </div>
    <p class="mt-hint">${w.hint}</p>
  </div>
  <nav class="maths-chapters" aria-label="Worlds">
    <button type="button" class="maths-topbtn ch-prev" aria-label="Previous world">←</button>
    ${scenes.map((s,j)=>`<button type="button" class="ch-num" data-world="${s.id}" aria-label="${worldOf(s).name}" title="${worldOf(s).name}" ${j===i?'aria-current="true"':''}><b>${String(j+1).padStart(2,'0')}</b><span>${worldOf(s).name}</span></button>`).join('')}
    <button type="button" class="maths-topbtn ch-next" aria-label="Next world">→</button>
  </nav>
  <span class="maths-reticle" aria-hidden="true"></span>
</div>`;
  }

  function topic(t){
    return `<section class="maths-topic" id="maths-${t.id}" aria-labelledby="maths-${t.id}-title">
  <div class="maths-copy"><p class="eyebrow">${t.no} / ${t.tag}</p><h2 id="maths-${t.id}-title">${t.title}</h2>${t.body.map(p=>`<p>${p}</p>`).join('')}<div class="maths-why"><p class="maths-why-label">Why it matters</p><p>${t.why}</p></div><div class="maths-llm"><p class="maths-why-label">Inside an LLM</p><p><b>Where it lives</b>${t.llm.where}</p><p><b>What the model uses it for</b>${t.llm.role}</p></div><p class="maths-formula">${t.formula}</p></div>
  <figure class="maths-figure"><div class="maths-stagewrap"><canvas id="mx-${t.id}" class="${t.mode==='2d'?'is-2d':''}" tabindex="0" role="img" aria-label="${t.label}"></canvas><div class="maths-stagebtns"><button type="button" class="maths-full-open" aria-label="Open ${t.short} full screen"><span aria-hidden="true">⤢</span> Full screen</button><button type="button" class="maths-enter" aria-label="Play ${t.short}">Play instrument →</button></div></div><figcaption>${swap(t.caption,t.abstractCaption)}</figcaption></figure>
  <div class="maths-fullbar"><div class="maths-fulltitle"><p class="eyebrow">${t.no} / ${t.tag}</p><p>${t.short}</p></div><div class="maths-buttons"><button type="button" class="maths-btn maths-abstract-toggle" aria-pressed="false">Play</button><button type="button" class="maths-btn maths-hide-ui" aria-pressed="false">Hide panels</button><button type="button" class="maths-btn maths-full-close">Exit full screen <span aria-hidden="true">✕</span></button></div></div>
  <div class="maths-dream"><p class="eyebrow">Abstract / ${t.no}</p><h3>${t.dream.title}</h3>${t.dream.text.map(p=>`<p>${p}</p>`).join('')}</div>
  <div class="maths-panel" id="mp-${t.id}" role="group" aria-label="Controls">${t.controls(ui)}<p class="maths-readout" id="mx-${t.id}-readout"></p></div>
  ${overlay(t)}
</section>`;
  }

  // The anatomy map: every world is one stage of a real forward pass.
  function pipeline(){
    const chip=(id,name,sub)=>`<a class="mf-node" href="#maths/${id}" data-scroll-target="maths-${id}" data-stage="${id}"><b>${name}</b><span>${sub}</span></a>`;
    const arrow=`<li class="mf-arrow" aria-hidden="true">→</li>`;
    return `<section class="maths-map" id="maths-map" aria-label="How the seven ideas fit inside one forward pass">
  <div class="maths-map-intro"><p class="eyebrow">One token’s journey</p><h2>Where each idea lives.</h2><p>Every world below is one stage of a real forward pass. Follow a token through the pipeline, then step inside whichever stage you want to feel from within.</p></div>
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
    <p>Seven ideas. Seven instruments to bring to life. Transform a constellation, fold a signal, tune an optimiser, weave an answer. Learn the mathematics of AI by making its rules work.</p>
    <p class="maths-hero-actions"><button type="button" class="pill light maths-hero-enter" data-journey-enter="collection">Play the instruments ↗</button> <a class="text-link" href="#maths" data-scroll-target="maths-index">or browse the seven ideas ↓</a></p>
    <p class="maths-hero-note">Seven mathematical games · no installation · keyboard &amp; touch</p>
  </div>
</section>
<nav class="maths-index" id="maths-index" aria-label="Topics">${scenes.map(t=>`<a href="#maths/${t.id}" data-scroll-target="maths-${t.id}"><span>${t.no}</span>${t.short}</a>`).join('')}</nav>
${pipeline()}
<div class="maths-topics">${scenes.map(topic).join('')}</div>
<section class="section-dark maths-outro">
  <div class="field-exp-intro"><p class="eyebrow">Keep going</p><h2>See the ideas at work.</h2><p>Every illustration here is a small synthetic example computed in your browser. No model is run.</p></div>
  <div class="field-exp-links">
    <a class="experiment-link" href="#research"><span class="exp-no">→</span> <span class="exp-name">The research</span> <span class="exp-arrow">↗</span></a>
    <a class="experiment-link" href="#lab"><span class="exp-no">→</span> <span class="exp-name">The lab</span> <span class="exp-arrow">↗</span></a>
  </div>
</section>`;
  }

  /* ---------- Canvas plumbing ---------- */
  let disposers = [], active = null;

  function stage(def,paint,paintAbstract){
    const canvas=$('mx-'+def.id), ctx=canvas.getContext('2d');
    const world=worldOf(def);
    const s={canvas,ctx,w:0,h:0,visible:false,abstract:false,frame:0,players:[],
      time:0,dt:1/60,paused:false,camera:null,world,
      draw(){ if(!s.frame) s.frame=requestAnimationFrame(()=>{s.frame=0;if(!s.w)return;
        ctx.clearRect(0,0,s.w,s.h);
        if(s.abstract){MathsJourney.atmosphere(s);ctx.save();paintAbstract(s);ctx.restore();MathsJourney.finish(s);}
        else{ctx.save();paint(s);ctx.restore();}}); }};
    const ro=new ResizeObserver(()=>{
      const d=Math.min(devicePixelRatio||1,2);
      s.w=canvas.clientWidth;s.h=canvas.clientHeight;
      canvas.width=Math.round(s.w*d);canvas.height=Math.round(s.h*d);
      ctx.setTransform(d,0,0,d,0,0);s.draw();
    });
    ro.observe(canvas);
    const io=new IntersectionObserver(([e])=>{s.visible=e.isIntersecting;if(s.visible)s.players.forEach(p=>p.kick());ambientSync();},{rootMargin:'120px'});
    io.observe(canvas);
    disposers.push(()=>{ro.disconnect();io.disconnect();cancelAnimationFrame(s.frame);});
    def.s=s;
    return s;
  }

  // A different full-viewport stage is showing: background scenes must not run.
  const blocked = s => document.hidden||(active&&(paused||s!==active.s));

  // Animation loop that only runs while its canvas is on screen; step(now) returns
  // false to finish. Each player keeps a virtual clock so that paused intervals
  // do not count towards tween progress.
  function player(s,step){
    const p={playing:false,raf:0,onend:null,clock:0,last:0,
      start(){p.clock=performance.now();p.last=p.clock;p.playing=true;p.kick();},
      stop(){p.playing=false;cancelAnimationFrame(p.raf);p.raf=0;},
      kick(){if(p.playing&&!p.raf&&s.visible&&!blocked(s)){p.last=performance.now();p.raf=requestAnimationFrame(tick);}}};
    const tick=now=>{
      p.raf=0;
      if(!p.playing||!s.visible||blocked(s))return;
      p.clock+=Math.max(0,Math.min(50,now-p.last));p.last=now;
      if(step(p.clock)===false){p.playing=false;p.onend?.();}
      s.draw();p.kick();
    };
    s.players.push(p);
    disposers.push(()=>p.stop());
    return p;
  }
  const kickAll = () => scenes.forEach(d=>d.s&&d.s.players.forEach(p=>p.kick()));

  function stroke(ctx,pts,alpha,width=.8){
    if(pts.length<2||alpha<.01)return;
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);
    ctx.globalAlpha=alpha;ctx.lineWidth=width;ctx.strokeStyle=ctx.mathsInk||INK;ctx.stroke();ctx.globalAlpha=1;
  }
  function dot(ctx,x,y,r,alpha,hollow=false){
    if(alpha<.01)return;
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.globalAlpha=alpha;
    if(hollow){ctx.lineWidth=.8;ctx.strokeStyle=ctx.mathsInk||INK;ctx.stroke();}else{ctx.fillStyle=ctx.mathsInk||INK;ctx.fill();}
    ctx.globalAlpha=1;
  }
  function arrow(ctx,x0,y0,x1,y1,alpha,width){
    stroke(ctx,[[x0,y0],[x1,y1]],alpha,width);
    const a=Math.atan2(y1-y0,x1-x0),L=9;
    stroke(ctx,[[x1-L*Math.cos(a-.42),y1-L*Math.sin(a-.42)],[x1,y1],[x1-L*Math.cos(a+.42),y1-L*Math.sin(a+.42)]],alpha,width);
  }
  function label(ctx,text,x,y,alpha=.8,align='left'){
    if(alpha<.01)return;
    ctx.globalAlpha=alpha;ctx.fillStyle=ctx.mathsInk||INK;ctx.font='11px "IBM Plex Mono", ui-monospace, monospace';
    ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(text,x,y);ctx.globalAlpha=1;
  }
  // Polyline whose opacity follows depth, drawn in short runs.
  function depthLine(ctx,pts,alpha,width=.7){
    for(let i=0;i<pts.length-1;i+=3){
      const run=pts.slice(i,i+4),z=run.reduce((s,p)=>s+p[2],0)/run.length;
      stroke(ctx,run,alpha*(.3+.7*clamp((z+2.4)/4.8,0,1)),width);
    }
  }

  // Same camera as the generated artwork: yaw about y, then pitch. Returns [sx, sy, depth].
  function camera(s,view,scale){
    const ca=Math.cos(view.yaw),sa=Math.sin(view.yaw),cb=Math.cos(view.pitch),sb=Math.sin(view.pitch);
    const k=Math.min(s.w,s.h*10/7)*scale,cx=s.w/2,cy=s.h/2;
    return (x,y,z)=>{const X=x*ca-z*sa,Z=x*sa+z*ca;return [cx+X*k,cy+(y*cb-Z*sb)*k,-(y*sb+Z*cb)];};
  }
  function orbit(s,view,signal,onPick){
    const c=s.canvas;let drag=null;
    c.addEventListener('pointerdown',e=>{if(s.abstract)return;drag={x:e.clientX,y:e.clientY,yaw:view.yaw,pitch:view.pitch,moved:false};c.setPointerCapture(e.pointerId);},{signal});
    c.addEventListener('pointermove',e=>{
      if(!drag)return;
      const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
      if(Math.hypot(dx,dy)>4)drag.moved=true;
      if(!drag.moved)return;
      view.yaw=drag.yaw-dx*.008;view.pitch=clamp(drag.pitch+dy*.006,-.2,1.45);s.draw();
    },{signal});
    c.addEventListener('pointerup',e=>{
      if(drag&&!drag.moved&&onPick){const r=c.getBoundingClientRect();onPick(e.clientX-r.left,e.clientY-r.top);}
      drag=null;
    },{signal});
    c.addEventListener('pointercancel',()=>{drag=null;},{signal});
    c.addEventListener('keydown',e=>{
      if(s.abstract)return;
      const k={ArrowLeft:[.12,0],ArrowRight:[-.12,0],ArrowUp:[0,-.08],ArrowDown:[0,.08]}[e.key];
      if(!k)return;
      e.preventDefault();view.yaw+=k[0];view.pitch=clamp(view.pitch+k[1],-.2,1.45);s.draw();
    },{signal});
  }

  /* ---------- First-person views (abstract mode) ---------- */
  // Perspective camera from an eye position with forward and up vectors (y is up).
  // Smooths orientation and position on the live stage; snaps when motion is
  // off, on mode entry (s.camera === null) and after a reset.
  // Returns [sx, sy, depth], or null for points behind the eye.
  function persp(s,eye,forward,up,fov=1.2){
    let E=[...eye],F=V.norm(forward),U0=up;
    if(s.camera&&!reduced()){
      const a=1-Math.exp(-(s.dt||1/60)*12),c=s.camera;
      E=E.map((v,i)=>lerp(c.eye[i],v,a));
      F=V.norm(F.map((v,i)=>lerp(c.F[i],v,a)));
      U0=U0.map((v,i)=>lerp(c.U[i],v,a));
    }
    const R=V.norm(V.cross(U0,F)),U=V.cross(F,R);
    s.camera={eye:E,F,U};
    const f=Math.min(s.w,s.h)/2/Math.tan(fov/2),cx=s.w/2,cy=s.h/2;
    const P=(x,y,z)=>{
      const dx=x-E[0],dy=y-E[1],dz=z-E[2],zc=dx*F[0]+dy*F[1]+dz*F[2];
      if(zc<.03)return null;
      return [cx+f*(dx*R[0]+dy*R[1]+dz*R[2])/zc,cy-f*(dx*U[0]+dy*U[1]+dz*U[2])/zc,zc];
    };
    P.f=f;
    return P;
  }
  // Polyline in a first-person view: breaks where it passes behind the eye and fades into fog.
  function pline(ctx,P,pts,alpha,width=.8,fog=8){
    let run=[];
    const flush=()=>{if(run.length>1){const z=run.reduce((a,p)=>a+p[2],0)/run.length;stroke(ctx,run,alpha*Math.exp(-z/fog),width);}};
    for(const q of pts){
      const p=P(q[0],q[1],q[2]);
      if(!p||Math.abs(p[0])>4e4||Math.abs(p[1])>4e4){flush();run=[];continue;}
      run.push(p);
      if(run.length===4){flush();run=[p];}
    }
    flush();
  }
  // A dot whose size is given in world units, so it shrinks with distance.
  function pdot(ctx,P,q,size,alpha,hollow=false,fog=8){
    const p=P(q[0],q[1],q[2]);
    if(!p)return null;
    dot(ctx,p[0],p[1],clamp(size*P.f/p[2],.7,10),alpha*Math.exp(-p[2]/fog),hollow);
    return p;
  }
  // Drag to turn your head, Street View style: the scene follows the pointer.
  function lookDrag(s,look,signal,{vertical=true,min=-1.2,max=1.2}={}){
    const c=s.canvas;let drag=null;
    c.addEventListener('pointerdown',e=>{if(!s.abstract)return;c.focus({preventScroll:true});drag={x:e.clientX,y:e.clientY,yaw:look.yaw,pitch:look.pitch};c.setPointerCapture(e.pointerId);},{signal});
    c.addEventListener('pointermove',e=>{
      if(!drag||!s.abstract)return;
      look.yaw=drag.yaw-(e.clientX-drag.x)*.005;
      if(vertical)look.pitch=clamp(drag.pitch+(e.clientY-drag.y)*.004,min,max);
      look.onchange?.();s.draw();
    },{signal});
    ['pointerup','pointercancel'].forEach(t=>c.addEventListener(t,()=>{drag=null;},{signal}));
  }

  /* ---------- Full screen journey shell ---------- */
  const section = def => $('maths-'+def.id);
  let ambient=0,ambientLast=0;
  const held=new Map();

  function ambientStop(){cancelAnimationFrame(ambient);ambient=0;ambientLast=0;}
  function ambientTick(now){
    ambient=0;
    const s=active?.s;
    if(!s||!s.abstract||!s.visible||document.hidden||paused)return;
    const dt=Math.min(.05,ambientLast?(now-ambientLast)/1000:1/60);
    ambientLast=now;s.dt=dt;s.time+=dt;s.draw();
    ambient=requestAnimationFrame(ambientTick);
  }
  // One shared loop, running only while an abstract stage is live and motion is allowed.
  function ambientSync(){
    const s=active?.s;
    // The user's own pause stops the loop; a system reduced-motion preference
    // only forces snapped motion until the user explicitly resumes.
    const run=s&&s.abstract&&s.visible&&!document.hidden&&!paused;
    if(run&&!ambient)ambient=requestAnimationFrame(ambientTick);
    if(!run)ambientStop();
  }

  const pointerStops=new Set();
  function clearHeld(){
    held.forEach(t=>clearInterval(t));held.clear();
    pointerStops.forEach(f=>f());
  }

  function inertOn(sec){
    const saved=[];
    for(let el=sec;el.parentElement;el=el.parentElement){
      for(const sib of el.parentElement.children){
        if(sib===el)continue;
        saved.push([sib,sib.inert]);sib.inert=true;
      }
      if(el.parentElement===document.body)break;
    }
    return saved;
  }
  const inertOff = saved => saved&&saved.forEach(([el,v])=>{el.inert=v;});

  function focusables(sec){
    return [...sec.querySelectorAll('canvas,button,input,select,a[href],[tabindex]')]
      .filter(el=>!el.disabled&&!el.hidden&&el.offsetParent!==null&&el.tabIndex>=0);
  }

  function syncTop(def){
    const sec=section(def),s=def.s;
    sec.querySelector('.maths-mode-ab').setAttribute('aria-pressed',String(s.abstract));
    sec.querySelector('.maths-mode-flat').setAttribute('aria-pressed',String(!s.abstract));
    const pb=sec.querySelector('.maths-pause');
    pb.textContent=paused?'Resume motion':'Pause motion';
    pb.setAttribute('aria-pressed',String(paused));
    const dt=sec.querySelector('.maths-drawer-toggle');
    dt.setAttribute('aria-expanded',String(sec.classList.contains('drawer-open')));
    const gt=sec.querySelector('.maths-guide-toggle');
    gt.setAttribute('aria-expanded',String(!sec.classList.contains('guide-off')));
    const rv=sec.querySelector('.maths-reveal');
    rv.hidden=!sec.classList.contains('hide-ui');
  }

  const STEP_WORDS=['Observe','Change','Understand'];
  function renderGuide(def){
    const sec=section(def),w=worldOf(def),i=def.lesson||0,L=w.lessons[i];
    sec.querySelector('.g-eyebrow').textContent=`0${i+1} / 0${w.lessons.length} · ${STEP_WORDS[i]}`;
    sec.querySelector('.g-title').textContent=L.title;
    sec.querySelector('.g-text').textContent=L.text;
    const gl=sec.querySelector('.g-llm');
    gl.textContent=`Inside an LLM — ${L.llm||def.llm.where}`;
    gl.style.borderColor=worldOf(def).accent;
    const tryB=sec.querySelector('.g-try');
    tryB.textContent=(L.tryLabel?L.tryLabel+' →':'Try it →');
    tryB.hidden=!(L.tryLabel&&(L.click||Object.keys(L.values).length));
    sec.querySelector('.g-prev').disabled=i===0;
    const isLast=i===w.lessons.length-1,hasNext=scenes.indexOf(def)<scenes.length-1;
    sec.querySelector('.g-next').textContent=isLast?(hasNext?'Next world →':'Finish journey'):'Next →';
    sec.querySelectorAll('.g-steps i').forEach((el,j)=>el.classList.toggle('on',j<=i));
  }
  function applyLesson(def){
    const L=worldOf(def).lessons[def.lesson||0];
    for(const [id,v] of Object.entries(L.values||{})){
      const el=$(id);if(!el)continue;
      el.value=v;
      el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
    }
    if(L.click)$(L.click)?.click();
  }

  function renderChallenge(def){
    const card=section(def).querySelector('.maths-challenge'),g=def.game;
    const missions=MathsJourney.challenges[def.id],m=missions[g.index];
    card.querySelector('.mc-count').textContent=`PLAY · ${g.index+1} / ${missions.length}`;
    card.querySelector('.mc-title').textContent=m.title;
    card.querySelector('.mc-hint').textContent=m.hint;
    card.querySelector('.mc-progress').value=g.done?1:g.started?clamp(m.score(def.measure||{} )||0,0,1):0;
    card.querySelector('.mc-metric').textContent=g.started&&def.measure?m.metric(def.measure):'Start to set up the experiment. Explore freely at any time.';
    const result=g.done?`✓ ${m.win}`:'',status=card.querySelector('.mc-result');
    if(status.textContent!==result)status.textContent=result;
    card.classList.toggle('complete',g.done);
    const b=card.querySelector('.mc-next');
    b.textContent=!g.started?'Start challenge':!g.done?'Restart challenge':g.index<missions.length-1?'Next challenge →':'Play again';
  }
  function challengeState(def,value){
    def.measure=value;
    const g=def.game;
    if(!def.s?.abstract||!g)return;
    const m=MathsJourney.challenges[def.id][g.index];
    if(g.started&&!g.done&&(m.done?m.done(value):m.score(value)>=1-1e-6))g.done=true;
    renderChallenge(def);
  }
  function startChallenge(def){
    const g=def.game,missions=MathsJourney.challenges[def.id];
    if(g.done)g.index=(g.index+1)%missions.length;
    g.started=false;g.done=false;
    clearHeld();def.s.players.forEach(p=>p.stop());
    const m=missions[g.index];
    if(g.index===0)def.hooks.resetView?.();
    def.hooks.prepareChallenge?.(g.index);
    for(const [id,v] of Object.entries(m.values)){
      const el=$(id);el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));
    }
    if(m.click)$(m.click).click();
    g.started=true;
    renderChallenge(def);
  }

  function openFull(def,{opener,scroll,abstract=false}={}){
    if(active)closeFull(active);
    const sec=section(def);
    active=def;
    def.opener=opener!==undefined?opener:document.activeElement;
    def.scroll=scroll!==undefined?scroll:scrollY;
    def.placeholder=document.createElement('div');
    def.placeholder.style.height=sec.offsetHeight+'px';
    sec.after(def.placeholder);
    def.inertSaved=inertOn(sec);
    sec.classList.add('is-full');
    sec.setAttribute('role','dialog');
    sec.setAttribute('aria-modal','true');
    sec.setAttribute('aria-label',worldOf(def).name);
    document.documentElement.classList.add('maths-locked');
    def.lesson=0;renderGuide(def);
    def.game={index:0,started:false,done:false};renderChallenge(def);
    // Abstract: canvas first, prose hidden; diagram: controls drawer open.
    sec.classList.toggle('drawer-open',!abstract);
    sec.classList.add('guide-off');
    sec.classList.remove('hide-ui');
    setAbstract(def,abstract);
    syncTop(def);
    (abstract?def.s.canvas:sec.querySelector('.maths-exit')).focus({preventScroll:true});
  }

  function teardown(def){
    const sec=section(def);
    if(active===def){active=null;ambientStop();}
    clearHeld();
    if(def.s?.abstract)setAbstract(def,false);
    def.s&&(def.s.paused=false);
    // Nothing may keep animating off screen.
    def.s?.players.forEach(p=>p.stop());
    sec.classList.remove('is-full','hide-ui','drawer-open','guide-off');
    sec.removeAttribute('role');sec.removeAttribute('aria-modal');sec.removeAttribute('aria-label');
    sec.querySelector('.maths-hide-ui').setAttribute('aria-pressed','false');
    sec.querySelector('.maths-clear').setAttribute('aria-pressed','false');
    document.documentElement.classList.remove('maths-locked');
    inertOff(def.inertSaved);def.inertSaved=null;
    def.placeholder?.remove();def.placeholder=null;
  }
  function closeFull(def,{restore=true}={}){
    const sec=section(def);
    if(!sec)return;
    const {opener,scroll}=def;
    teardown(def);
    if(restore){
      scrollTo({top:scroll,behavior:'instant'});
      opener?.focus?.({preventScroll:true});
    }
  }

  // Move to another world without leaving the journey: scroll position and the
  // original opener survive until the final Exit.
  function goWorld(id){
    const next=scenes.find(d=>d.id===id);
    if(!next||next===active)return;
    const {opener,scroll}=active;
    closeFull(active,{restore:false});
    openFull(next,{opener,scroll,abstract:true});
  }

  function setAbstract(def,on){
    const sec=section(def),s=def.s;
    clearHeld();
    if(!on)s.players.forEach(p=>p.stop());
    sec.classList.toggle('is-abstract',on);
    sec.querySelector('.maths-abstract-toggle').setAttribute('aria-pressed',String(on));
    s.abstract=on;s.camera=null;
    s.canvas.setAttribute('aria-label',on?def.abstractLabel:def.label);
    if(on)s.visible=true;
    def.hooks.onMode?.(on);
    if(on&&def.game&&!def.game.started)startChallenge(def);
    s.draw();
    ambientSync();
  }

  function dispatchKey(def,key){
    if(def!==active)return false;
    if(def.hooks.onKey?.(key)){ambientSync();return true;}
    return false;
  }
  const HELD=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d']);

  function onKey(e){
    if(!active)return;
    if(e.key==='Escape'){e.preventDefault();clearHeld();closeFull(active);return;}
    const sec=section(active);
    if(e.key==='Tab'){
      const f=focusables(sec);
      if(!f.length)return;
      const first=f[0],last=f[f.length-1];
      if(e.shiftKey&&(document.activeElement===first||!sec.contains(document.activeElement))){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      return;
    }
    if(!active.s.abstract||e.metaKey||e.ctrlKey||e.altKey)return;
    // Only form fields own the movement keys; a focused button or link must not
    // swallow them, or controls appear dead after any click.
    if(e.target.closest?.('input,select,textarea'))return;
    const key=e.key.length===1?e.key.toLowerCase():e.key;
    if(e.repeat){if(HELD.has(key))e.preventDefault();return;}
    if(HELD.has(key)&&dispatchKey(active,key)){
      e.preventDefault();
      if(!held.has(key))held.set(key,setInterval(()=>dispatchKey(active,key),110));
      return;
    }
    if(dispatchKey(active,key))e.preventDefault();
  }
  function onKeyUp(e){
    const key=e.key.length===1?e.key.toLowerCase():e.key;
    if(held.has(key)){clearInterval(held.get(key));held.delete(key);}
  }

  // Press-and-hold buttons: pointerdown performs the action once, then ~110ms
  // repeats until release/cancel; keyboard clicks (detail 0) act once.
  function holdable(btn,fn,signal){
    let timer=0;
    const stop=()=>{clearInterval(timer);timer=0;btn.classList.remove('held');};
    pointerStops.add(stop);
    btn.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse'&&e.button!==0)return;
      btn.setPointerCapture?.(e.pointerId);
      stop();fn();btn.classList.add('held');timer=setInterval(fn,110);
      e.preventDefault();
    },{signal});
    ['pointerup','pointercancel','lostpointercapture'].forEach(t=>btn.addEventListener(t,stop,{signal}));
    btn.addEventListener('click',e=>{if(e.detail!==0)return;fn();},{signal});
    signal.addEventListener('abort',()=>{stop();pointerStops.delete(stop);},{once:true});
  }

  /* ---------- Wiring ---------- */
  // Everything a scene file needs, bound to its own canvas and readout.
  function kit(def,signal){
    return {signal,INK,$,clamp,lerp,ease,rng,gauss,V,heading,turn,
      reduced:()=>sysReduced()||(active===def&&paused),
      stroke,dot,arrow,label,depthLine,camera,persp,pline,pdot,player,
      world:worldOf(def),
      tint:(ctx,color,fn)=>MathsJourney.tint(ctx,color,fn),
      surface:(ctx,P,pts,color,alpha)=>MathsJourney.surface(ctx,P,pts,color,alpha),
      beacon:(ctx,P,pt,color,size,alpha)=>MathsJourney.beacon(ctx,P,pt,color,size,alpha),
      stage:(paint,paintAbstract)=>stage(def,paint,paintAbstract),
      orbit:(s,view,onPick)=>orbit(s,view,signal,onPick),
      look:(s,look,opts)=>lookDrag(s,look,signal,opts),
      challenge:value=>challengeState(def,value),
      readout:text=>{
        $('mx-'+def.id+'-readout').textContent=text;
        const r=$('mr-'+def.id);if(r)r.textContent=text;
      },
      setText:(el,flat,abstract)=>{el.innerHTML=swap(flat,abstract);},
      on:(el,type,fn)=>el.addEventListener(type,fn,{signal})};
  }

  function wire(on){
    disposers.forEach(f=>f());disposers=[];
    if(!on)return;
    const controller=new AbortController(),{signal}=controller;
    disposers.push(()=>{if(active)closeFull(active);},()=>{ambientStop();clearHeld();},()=>controller.abort());
    scenes.forEach(def=>{
      const sec=section(def);
      def.hooks=def.init(kit(def,signal))||{};
      def.lesson=0;
      // The long-form story lives inside the guide's "About this world".
      const dream=sec.querySelector('.maths-dream'),slot=sec.querySelector('.g-dream');
      if(dream&&slot)slot.appendChild(dream);
      const W=worldOf(def);
      sec.querySelector('.maths-full-open').addEventListener('click',()=>openFull(def),{signal});
      sec.querySelector('.maths-enter').addEventListener('click',()=>{location.hash='maths/play/'+def.id;},{signal});
      sec.querySelector('.maths-full-close').addEventListener('click',()=>closeFull(def),{signal});
      sec.querySelector('.maths-exit').addEventListener('click',()=>closeFull(def),{signal});
      sec.querySelector('.maths-abstract-toggle').addEventListener('click',()=>{location.hash='maths/play/'+def.id;},{signal});
      sec.querySelector('.maths-mode-ab').addEventListener('click',()=>{location.hash='maths/play/'+def.id;},{signal});
      sec.querySelector('.maths-mode-flat').addEventListener('click',()=>{if(def.s.abstract){setAbstract(def,false);sec.classList.add('drawer-open');syncTop(def);}},{signal});
      sec.querySelector('.maths-hide-ui').addEventListener('click',e=>{sec.classList.toggle('hide-ui');e.currentTarget.setAttribute('aria-pressed',String(sec.classList.contains('hide-ui')));},{signal});
      sec.querySelector('.maths-clear').addEventListener('click',e=>{sec.classList.toggle('hide-ui');e.currentTarget.setAttribute('aria-pressed',String(sec.classList.contains('hide-ui')));syncTop(def);},{signal});
      sec.querySelector('.maths-reveal').addEventListener('click',()=>{sec.classList.remove('hide-ui');sec.querySelector('.maths-clear').setAttribute('aria-pressed','false');sec.querySelector('.maths-hide-ui').setAttribute('aria-pressed','false');syncTop(def);},{signal});
      sec.querySelector('.maths-pause').addEventListener('click',()=>{
        paused=!paused;
        if(!paused)kickAll();
        syncTop(def);def.s.draw();ambientSync();
      },{signal});
      sec.querySelector('.maths-drawer-toggle').addEventListener('click',()=>{sec.classList.toggle('drawer-open');syncTop(def);},{signal});
      sec.querySelector('.maths-guide-toggle').addEventListener('click',()=>{sec.classList.toggle('guide-off');syncTop(def);},{signal});
      sec.querySelector('.mc-next').addEventListener('click',()=>startChallenge(def),{signal});
      sec.querySelector('.g-try').addEventListener('click',()=>applyLesson(def),{signal});
      sec.querySelector('.g-prev').addEventListener('click',()=>{def.lesson=Math.max(0,(def.lesson||0)-1);renderGuide(def);},{signal});
      sec.querySelector('.g-next').addEventListener('click',()=>{
        const w=worldOf(def),i=scenes.indexOf(def);
        if((def.lesson||0)<w.lessons.length-1){def.lesson++;renderGuide(def);}
        else if(i<scenes.length-1)goWorld(scenes[i+1].id);
        else closeFull(def);
      },{signal});
      sec.querySelector('.mt-action').addEventListener('click',()=>{$(W.action.id)?.click();},{signal});
      sec.querySelector('.mt-reset').addEventListener('click',()=>{def.hooks.resetView?.();def.s.camera=null;def.s.draw();},{signal});
      sec.querySelectorAll('.mt-dir').forEach(b=>holdable(b,()=>dispatchKey(def,b.dataset.key),signal));
      sec.querySelectorAll('.ch-num').forEach(b=>b.addEventListener('click',()=>goWorld(b.dataset.world),{signal}));
      const pi=scenes.indexOf(def);
      const pv=sec.querySelector('.ch-prev'),nx=sec.querySelector('.ch-next');
      pv.disabled=pi===0;nx.disabled=pi===scenes.length-1;
      pv.addEventListener('click',()=>{if(pi>0)goWorld(scenes[pi-1].id);},{signal});
      nx.addEventListener('click',()=>{if(pi<scenes.length-1)goWorld(scenes[pi+1].id);},{signal});
    });
    // "You are here": the pipeline chip matching the topic in view lights up.
    const here=new Set();
    const syncHere=()=>document.querySelectorAll('.mf-node[data-stage]').forEach(n=>n.classList.toggle('here',here.has(n.dataset.stage)));
    const hereObs=new IntersectionObserver(es=>{
      es.forEach(e=>{const id=e.target.id.slice(6);e.isIntersecting?here.add(id):here.delete(id);});
      syncHere();
    },{rootMargin:'-35% 0px -55% 0px'});
    scenes.forEach(d=>hereObs.observe(section(d)));
    disposers.push(()=>{hereObs.disconnect();here.clear();});
    // Layer depth stepper on the transformer block chip.
    const depthEl=$('mf-depth'),DEPTHS=[4,12,24,32,48,80,121];
    let di=3;
    document.querySelectorAll('[data-depth]').forEach(b=>b.addEventListener('click',()=>{
      di=(di+Number(b.dataset.depth)+DEPTHS.length)%DEPTHS.length;
      depthEl.textContent=DEPTHS[di];
    },{signal}));
    document.querySelectorAll('[data-journey-enter]').forEach(b=>{
      b.addEventListener('click',()=>{
        const def=scenes.find(d=>d.id===b.dataset.journeyEnter);
        location.hash=def?'maths/play/'+def.id:'maths/play';
      },{signal});
    });
    document.addEventListener('keydown',onKey,{signal});
    document.addEventListener('keyup',onKeyUp,{signal});
    window.addEventListener('blur',clearHeld,{signal});
    document.addEventListener('visibilitychange',()=>{
      clearHeld();
      if(document.hidden){ambientStop();}
      else{ambientLast=0;ambientSync();kickAll();}
    },{signal});
  }

  return {page,wire,scene,ui,get topics(){return scenes;}};
})();
