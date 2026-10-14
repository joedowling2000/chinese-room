/* The Maths of AI: seven interactive illustrations drawn in the Field style.
   This file holds the page, the shared canvas plumbing and the full-screen and
   abstract controller; each illustration registers itself from maths/*.js.
   Small synthetic examples computed in the browser; no model is run. */
const Maths = (() => {
  const INK = '#e8e8e8';
  const $ = id => document.getElementById(id);
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const lerp = (a,b,t) => a+(b-a)*t;
  const ease = t => t*t*(3-2*t);
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  function topic(t){
    return `<section class="maths-topic" id="maths-${t.id}" aria-labelledby="maths-${t.id}-title">
  <div class="maths-copy"><p class="eyebrow">${t.no} / ${t.tag}</p><h2 id="maths-${t.id}-title">${t.title}</h2>${t.body.map(p=>`<p>${p}</p>`).join('')}<div class="maths-why"><p class="maths-why-label">Why it matters</p><p>${t.why}</p></div><p class="maths-formula">${t.formula}</p></div>
  <figure class="maths-figure"><div class="maths-stagewrap"><canvas id="mx-${t.id}" class="${t.mode==='2d'?'is-2d':''}" tabindex="0" role="img" aria-label="${t.label}"></canvas><button type="button" class="maths-full-open" aria-label="Open ${t.short} full screen"><span aria-hidden="true">⤢</span> Full screen</button></div><figcaption>${swap(t.caption,t.abstractCaption)}</figcaption></figure>
  <div class="maths-fullbar"><div class="maths-fulltitle"><p class="eyebrow">${t.no} / ${t.tag}</p><p>${t.short}</p></div><div class="maths-buttons"><button type="button" class="maths-btn maths-abstract-toggle" aria-pressed="false">Abstract</button><button type="button" class="maths-btn maths-hide-ui" aria-pressed="false">Hide panels</button><button type="button" class="maths-btn maths-full-close">Exit full screen <span aria-hidden="true">✕</span></button></div></div>
  <div class="maths-dream"><p class="eyebrow">Abstract / ${t.no}</p><h3>${t.dream.title}</h3>${t.dream.text.map(p=>`<p>${p}</p>`).join('')}</div>
  <div class="maths-panel">${t.controls(ui)}<p class="maths-readout" id="mx-${t.id}-readout"></p></div>
</section>`;
  }

  function page(){
    return `<section class="maths-hero">
  <div class="maths-hero-art" aria-hidden="true">${Field.art('manifold','dark',{eager:true})}</div>
  <div class="maths-hero-shade" aria-hidden="true"></div>
  <div class="maths-hero-copy">
    <p class="eyebrow">The maths of AI</p>
    <h1>The maths of AI.</h1>
    <p>A language model is a handful of simple operations, repeated at enormous scale. Here are seven of them, drawn as wireframes you can drag, slide and break. Open any of them full screen, then switch to Abstract to step inside.</p>
  </div>
</section>
<nav class="maths-index" aria-label="Topics">${scenes.map(t=>`<a href="#maths/${t.id}" data-scroll-target="maths-${t.id}"><span>${t.no}</span>${t.short}</a>`).join('')}</nav>
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
    const s={canvas,ctx,w:0,h:0,visible:false,abstract:false,frame:0,players:[],
      draw(){ if(!s.frame) s.frame=requestAnimationFrame(()=>{s.frame=0;if(!s.w)return;ctx.clearRect(0,0,s.w,s.h);(s.abstract?paintAbstract:paint)(s);}); }};
    const ro=new ResizeObserver(()=>{
      const d=Math.min(devicePixelRatio||1,2);
      s.w=canvas.clientWidth;s.h=canvas.clientHeight;
      canvas.width=Math.round(s.w*d);canvas.height=Math.round(s.h*d);
      ctx.setTransform(d,0,0,d,0,0);s.draw();
    });
    ro.observe(canvas);
    const io=new IntersectionObserver(([e])=>{s.visible=e.isIntersecting;if(s.visible)s.players.forEach(p=>p.kick());},{rootMargin:'120px'});
    io.observe(canvas);
    disposers.push(()=>{ro.disconnect();io.disconnect();cancelAnimationFrame(s.frame);});
    def.s=s;
    return s;
  }

  // Animation loop that only runs while its canvas is on screen; step(now) returns false to finish.
  function player(s,step){
    const p={playing:false,raf:0,onend:null,
      start(){p.playing=true;p.kick();},
      stop(){p.playing=false;cancelAnimationFrame(p.raf);p.raf=0;},
      kick(){if(p.playing&&!p.raf)p.raf=requestAnimationFrame(tick);}};
    const tick=now=>{
      p.raf=0;
      if(!p.playing||!s.visible)return;
      if(step(now)===false){p.playing=false;p.onend?.();}
      s.draw();p.kick();
    };
    s.players.push(p);
    disposers.push(()=>p.stop());
    return p;
  }

  function stroke(ctx,pts,alpha,width=.8){
    if(pts.length<2||alpha<.01)return;
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);
    ctx.globalAlpha=alpha;ctx.lineWidth=width;ctx.strokeStyle=INK;ctx.stroke();ctx.globalAlpha=1;
  }
  function dot(ctx,x,y,r,alpha,hollow=false){
    if(alpha<.01)return;
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.globalAlpha=alpha;
    if(hollow){ctx.lineWidth=.8;ctx.strokeStyle=INK;ctx.stroke();}else{ctx.fillStyle=INK;ctx.fill();}
    ctx.globalAlpha=1;
  }
  function arrow(ctx,x0,y0,x1,y1,alpha,width){
    stroke(ctx,[[x0,y0],[x1,y1]],alpha,width);
    const a=Math.atan2(y1-y0,x1-x0),L=9;
    stroke(ctx,[[x1-L*Math.cos(a-.42),y1-L*Math.sin(a-.42)],[x1,y1],[x1-L*Math.cos(a+.42),y1-L*Math.sin(a+.42)]],alpha,width);
  }
  function label(ctx,text,x,y,alpha=.8,align='left'){
    if(alpha<.01)return;
    ctx.globalAlpha=alpha;ctx.fillStyle=INK;ctx.font='11px "IBM Plex Mono", ui-monospace, monospace';
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
  // Returns [sx, sy, depth], or null for points behind the eye.
  function persp(s,eye,forward,up,fov=1.2){
    const F=V.norm(forward),R=V.norm(V.cross(up,F)),U=V.cross(F,R);
    const f=Math.min(s.w,s.h)/2/Math.tan(fov/2),cx=s.w/2,cy=s.h/2;
    const P=(x,y,z)=>{
      const dx=x-eye[0],dy=y-eye[1],dz=z-eye[2],zc=dx*F[0]+dy*F[1]+dz*F[2];
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
    c.addEventListener('pointerdown',e=>{if(!s.abstract)return;drag={x:e.clientX,y:e.clientY,yaw:look.yaw,pitch:look.pitch};c.setPointerCapture(e.pointerId);},{signal});
    c.addEventListener('pointermove',e=>{
      if(!drag||!s.abstract)return;
      look.yaw=drag.yaw-(e.clientX-drag.x)*.005;
      if(vertical)look.pitch=clamp(drag.pitch+(e.clientY-drag.y)*.004,min,max);
      look.onchange?.();s.draw();
    },{signal});
    ['pointerup','pointercancel'].forEach(t=>c.addEventListener(t,()=>{drag=null;},{signal}));
  }

  /* ---------- Full screen and abstract mode ---------- */
  const fsEl = () => document.fullscreenElement||document.webkitFullscreenElement||null;
  const section = def => $('maths-'+def.id);

  function openFull(def){
    if(active)closeFull(active);
    const sec=section(def);
    active=def;def.opener=document.activeElement;def.scroll=scrollY;def.native=false;
    // Keep the page the same height while the section is lifted out of the flow.
    def.placeholder=document.createElement('div');
    def.placeholder.style.height=sec.offsetHeight+'px';
    sec.after(def.placeholder);
    sec.classList.add('is-full');
    document.documentElement.classList.add('maths-locked');
    const req=sec.requestFullscreen||sec.webkitRequestFullscreen;
    if(req){
      try{const p=req.call(sec);def.native=true;if(p&&p.catch)p.catch(()=>{def.native=false;});}
      catch{def.native=false;}
    }
    sec.querySelector('.maths-full-close').focus({preventScroll:true});
  }
  function closeFull(def){
    const sec=section(def);
    if(active===def)active=null;
    if(!sec)return;
    if(def.s?.abstract)setAbstract(def,false);
    sec.classList.remove('is-full','hide-ui');
    sec.querySelector('.maths-hide-ui').setAttribute('aria-pressed','false');
    document.documentElement.classList.remove('maths-locked');
    if(fsEl()===sec)(document.exitFullscreen||document.webkitExitFullscreen).call(document)?.catch?.(()=>{});
    def.placeholder?.remove();def.placeholder=null;
    scrollTo({top:def.scroll,behavior:'instant'});
    def.opener?.focus?.({preventScroll:true});
  }
  function setAbstract(def,on){
    const sec=section(def);
    sec.classList.toggle('is-abstract',on);
    sec.querySelector('.maths-abstract-toggle').setAttribute('aria-pressed',String(on));
    def.s.abstract=on;
    def.s.canvas.setAttribute('aria-label',on?def.abstractLabel:def.label);
    def.hooks.onMode?.(on);
    def.s.draw();
  }
  function onFullscreenChange(){
    if(active&&active.native&&fsEl()!==section(active))closeFull(active);
  }
  function onKey(e){
    if(!active)return;
    if(e.key==='Escape'&&!fsEl()){e.preventDefault();closeFull(active);return;}
    if(!active.s.abstract||e.metaKey||e.ctrlKey||e.altKey||e.target.closest?.('input,select,textarea'))return;
    if(active.hooks.onKey?.(e.key.length===1?e.key.toLowerCase():e.key))e.preventDefault();
  }

  // Everything a scene file needs, bound to its own canvas and readout.
  function kit(def,signal){
    return {signal,INK,$,clamp,lerp,ease,reduced,rng,gauss,V,heading,turn,
      stroke,dot,arrow,label,depthLine,camera,persp,pline,pdot,player,
      stage:(paint,paintAbstract)=>stage(def,paint,paintAbstract),
      orbit:(s,view,onPick)=>orbit(s,view,signal,onPick),
      look:(s,look,opts)=>lookDrag(s,look,signal,opts),
      readout:text=>{$('mx-'+def.id+'-readout').textContent=text;},
      setText:(el,flat,abstract)=>{el.innerHTML=swap(flat,abstract);},
      on:(el,type,fn)=>el.addEventListener(type,fn,{signal})};
  }

  function wire(on){
    disposers.forEach(f=>f());disposers=[];
    if(!on)return;
    const controller=new AbortController(),{signal}=controller;
    disposers.push(()=>{if(active)closeFull(active);},()=>controller.abort());
    scenes.forEach(def=>{
      const sec=section(def);
      def.hooks=def.init(kit(def,signal))||{};
      sec.querySelector('.maths-full-open').addEventListener('click',()=>openFull(def),{signal});
      sec.querySelector('.maths-full-close').addEventListener('click',()=>closeFull(def),{signal});
      sec.querySelector('.maths-abstract-toggle').addEventListener('click',()=>setAbstract(def,!def.s.abstract),{signal});
      sec.querySelector('.maths-hide-ui').addEventListener('click',e=>e.currentTarget.setAttribute('aria-pressed',String(sec.classList.toggle('hide-ui'))),{signal});
    });
    document.addEventListener('keydown',onKey,{signal});
    ['fullscreenchange','webkitfullscreenchange'].forEach(t=>document.addEventListener(t,onFullscreenChange,{signal}));
  }

  return {page,wire,scene,ui,get topics(){return scenes;}};
})();
