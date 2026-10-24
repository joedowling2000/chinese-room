/* Chinese Room — design studies. Three monochrome homepage mockups selected by
   ?concept=field|library|atlas. All illustrations are deterministic procedural
   vector art — decorative geometry, not measured data. */

const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const research = [
  {id:'mindcuber',topic:'Reinforcement learning',title:'AI, a Lego robot and a Rubik’s cube',desc:'Teaching a network to solve a cube. Giving the answer to a robot.',read:'18 min',art:'lattice'},
  {id:'abliteration',topic:'Interpretability',title:'How easy is it to make AI dangerous? Very easy.',desc:'Tracing refusal inside a language model.',read:'13 min',art:'manifold'},
  {id:'nvfp4',topic:'Quantization',title:'NVFP4 quantization of Mixtral 8×7B',desc:'Smaller numbers. Less memory. What survives?',read:'11 min',art:'signal'},
  {id:'haskell',topic:'Agents',title:'Building a multi-agent workflow in Haskell',desc:'Strong types for a conversation between agents.',read:'10 min',art:'surface'}
];

/* ---------- Procedural art ---------- */

function project(x,y,z){
  const a=-.55,b=.65;
  const X=x*Math.cos(a)-z*Math.sin(a),Z=x*Math.sin(a)+z*Math.cos(a);
  return [500+X*200,350+(y*Math.cos(b)-Z*Math.sin(b))*200];
}

const fmt = n => Math.round(n*100)/100;
const path = pts => 'M '+pts.map(p=>fmt(p[0])+' '+fmt(p[1])).join(' L ');

/* Torus: 32 rings (v fixed) + 64 meridians (u fixed), 128 samples each. */
function artManifold(ink){
  const R=1.45,r=.58,S=128;
  const pt=(u,v)=>{
    const x=(R+r*Math.cos(v))*Math.cos(u), y=r*Math.sin(v), z=(R+r*Math.cos(v))*Math.sin(u);
    return project(x,y,z);
  };
  let out='';
  for(let j=0;j<32;j++){
    const v=j/32*Math.PI*2, pts=[];
    for(let i=0;i<=S;i++)pts.push(pt(i/S*Math.PI*2,v));
    out+=`<path d="${path(pts)}" stroke="${ink}" stroke-width=".7" fill="none" opacity=".38"/>`;
  }
  for(let j=0;j<64;j++){
    const u=j/64*Math.PI*2, pts=[];
    for(let i=0;i<=S;i++)pts.push(pt(u,i/S*Math.PI*2));
    out+=`<path d="${path(pts)}" stroke="${ink}" stroke-width=".8" fill="none" opacity=".5"/>`;
  }
  // sparse intersection points
  for(let j=0;j<10;j++)for(let k=0;k<7;k++){
    const u=j/10*Math.PI*2,v=k/7*Math.PI*2,[x,y]=pt(u,v);
    out+=`<circle cx="${fmt(x)}" cy="${fmt(y)}" r="1.4" fill="${ink}" opacity=".75"/>`;
  }
  return out;
}

/* Sculptural saddle mesh, 42×42. */
function artSurface(ink){
  const z=(x,y)=>.45*(Math.sin(2*x)*Math.cos(1.6*y))+.16*(x*x-y*y);
  const N=42,lo=-1.8,hi=1.8,st=(hi-lo)/(N-1);
  let out='';
  for(let i=0;i<N;i++){
    const x=lo+i*st,pts=[];
    for(let j=0;j<N;j++){const y=lo+j*st;pts.push(project(x,z(x,y),y));}
    out+=`<path d="${path(pts)}" stroke="${ink}" stroke-width=".65" fill="none" opacity=".5"/>`;
  }
  for(let j=0;j<N;j++){
    const y=lo+j*st,pts=[];
    for(let i=0;i<N;i++){const x=lo+i*st;pts.push(project(x,z(x,y),y));}
    out+=`<path d="${path(pts)}" stroke="${ink}" stroke-width=".65" fill="none" opacity=".38"/>`;
  }
  return out;
}

/* 27-cube lattice: three visible faces per cube, painter-sorted. */
function artLattice(tone){
  const dark = tone==='dark';
  const face = dark ? {top:'#3a3a3a',left:'#242424',right:'#131313'} : {top:'#fafafa',left:'#c4c4c4',right:'#7a7a7a'};
  const ink = dark ? '#050505' : '#080808';
  const h=.24,s=.74;
  // view direction v of project(): visible normals +y (top), -x (left), +z (right/front)
  const cubes=[];
  for(let xi=-1;xi<=1;xi++)for(let yi=-1;yi<=1;yi++)for(let zi=-1;zi<=1;zi++)
    cubes.push({x:xi*s,y:yi*s,z:zi*s,d:-(.42*xi)+(.61*yi)+(.68*zi)});
  cubes.sort((a,b)=>a.d-b.d);
  let out='';
  for(const c of cubes){
    const P=(dx,dy,dz)=>project(c.x+dx*h,c.y+dy*h,c.z+dz*h);
    const f=(pts,col)=>`<polygon points="${pts.map(p=>fmt(p[0])+','+fmt(p[1])).join(' ')}" fill="${col}" stroke="${ink}" stroke-width=".7"/>`;
    // -x face (left), +z face (right), +y face (top) — far-to-near order
    out+=f([P(-1,-1,-1),P(-1,1,-1),P(-1,1,1),P(-1,-1,1)],face.left);
    out+=f([P(-1,-1,1),P(-1,1,1),P(1,1,1),P(1,-1,1)],face.right);
    out+=f([P(-1,1,-1),P(1,1,-1),P(1,1,1),P(-1,1,1)],face.top);
  }
  return out;
}

/* Moiré wave band: 72 parallel lines with a Gaussian-envelope sine offset. */
function artSignal(ink){
  let out='';
  for(let i=0;i<72;i++){
    const base=80+i*7.3,pts=[];
    for(let x=0;x<=1000;x+=5){
      pts.push([x,base+65*Math.sin(x*.011+i*.12)*Math.exp(-(((x-540)/270)**2))]);
    }
    out+=`<path d="${path(pts)}" stroke="${ink}" stroke-width=".75" fill="none" opacity=".55"/>`;
  }
  return out;
}

const ART = {manifold:artManifold, surface:artSurface, lattice:artLattice, signal:artSignal};
const ART_LABEL = {manifold:'a wire-frame torus', surface:'a saddle surface mesh', lattice:'a lattice of cubes', signal:'a wave bundle'};

function art(kind,tone='dark',id='art'){
  const ink = tone==='dark' ? '#e8e8e8' : '#111111';
  const inner = kind==='lattice' ? ART.lattice(tone) : ART[kind](ink);
  return `<svg viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Mathematical study: ${ART_LABEL[kind]||kind}">${inner}</svg>`;
}

/* ---------- Shared chrome ---------- */

const mark = `<span class="mark" aria-hidden="true">${'<i></i>'.repeat(9)}</span>`;

function siteNav(cls, links, cta){
  return `<header class="site-nav ${cls}">
  <div class="nav-inner">
    <a class="brand" href="/">${mark}<span>Chinese Room</span></a>
    <nav class="nav-links" aria-label="Site">${links}</nav>
    <div class="nav-end">
      ${cta}
      <details class="nav-mobile"><summary aria-label="Open menu"><span class="menu-bars" aria-hidden="true"></span></summary><nav class="nav-mobile-links" aria-label="Site">${links}${cta}</nav></details>
    </div>
  </div>
</header>`;
}
const navLink = (href,t) => `<a href="${href}">${t}</a>`;

function footer(dark=false){
  return `<footer class="concept-footer${dark?' footer-dark':''}">
  <div class="footer-row"><a class="brand" href="/">${mark}<span>Chinese Room</span></a><p>Independent AI research<br>by Joe Dowling.</p><nav aria-label="Footer"><a href="/#research">Research index ↗</a><a href="/#lab">The lab ↗</a><a href="mailto:hello@chineseroom.io">Email ↗</a><a href="/backups/folio-monochrome/">Saved folio ↗</a><a href="?concept=field">Study 01</a><a href="?concept=library">Study 02</a><a href="?concept=atlas">Study 03</a></nav><span class="copyright">© 2026 Chinese Room · chineseroom.io</span></div>
</footer>`;
}

function railControls(id){
  return `<div class="rail-controls"><button type="button" data-rail="${id}" data-step="-1" aria-label="Previous research cards">←</button><button type="button" data-rail="${id}" data-step="1" aria-label="Next research cards">→</button></div>`;
}

/* ---------- 01 FIELD — dark, cinematic, image-led cards ---------- */

function fieldCard(r,i){
  const tone = i%2===1 ? 'light' : 'dark';
  return `<a class="field-card card-${tone}" href="/#article/${esc(r.id)}">
    <span class="field-card-topic">${esc(r.topic)}</span>
    <h3>${esc(r.title)}</h3>
    <span class="field-card-art">${art(r.art,tone==='dark'?'dark':'light','field-'+r.id)}</span>
    <span class="field-card-action">Read the note ↗</span>
  </a>`;
}
const labCard = `<a class="field-card card-light" href="/#lab">
    <span class="field-card-topic">The lab</span>
    <h3>Try an experiment</h3>
    <span class="field-card-art">${art('surface','light','field-lab')}</span>
    <span class="field-card-action">Two experiments ↗</span>
  </a>`;

function fieldTemplate(){
  return `${siteNav('nav-dark',
    navLink('#field-research','Research')+navLink('#field-experiments','Experiments')+navLink('/#about','About'),
    `<a class="pill light" href="/#lab">Enter the lab ↗</a>`)}
<main id="main">
  <section class="field-hero">
    <div class="field-hero-art">${art('manifold','dark','field-hero')}</div>
    <div class="field-hero-shade" aria-hidden="true"></div>
    <div class="field-hero-copy">
      <p class="eyebrow eyebrow-dark">Independent intelligence research</p>
      <h1>Inside the<br>space of thought.</h1>
      <p>Taking models apart. Following the mathematics.<br>Finding out what intelligence is made of.</p>
      <a class="pill light" href="#field-research">Explore the research <span>↗</span></a>
    </div>
    <div class="field-caption"><span>Chinese Room · Joe Dowling</span><span>Study 01 / A continuous surface</span><a href="#field-research">Scroll to discover ↓</a></div>
  </section>
  <section class="field-research section-dark" id="field-research">
    <div class="section-head"><div><p class="eyebrow eyebrow-dark">Follow a question</p><h2>Four ways into the room.</h2></div>${railControls('field-rail')}</div>
    <div class="card-rail field-rail" id="field-rail" tabindex="0" aria-label="Research projects">${research.map(fieldCard).join('')}${labCard}</div>
    <p class="rail-note">Scroll to explore ↔</p>
  </section>
  <section class="field-experiments section-dark" id="field-experiments">
    <div class="field-exp-intro"><p class="eyebrow eyebrow-dark">Make the ideas tangible</p><h2>A little less abstract.</h2><p>Turn a cube. Round a weight.<br>Explore two experiments in your browser.</p></div>
    <div class="field-exp-links">
      <a class="experiment-link" href="/#lab/mindcuber"><span class="exp-no">01</span> <span class="exp-name">Mindcuber</span> <span class="exp-arrow">↗</span></a>
      <a class="experiment-link" href="/#lab/quantization"><span class="exp-no">02</span> <span class="exp-name">Quantization</span> <span class="exp-arrow">↗</span></a>
    </div>
  </section>
</main>${footer(true)}`;
}

/* ---------- 02 LIBRARY — bright research browser ---------- */

function libraryCard(r,i){
  const tone = i%2===1 ? 'dark' : 'light';
  return `<a class="library-card" data-topic="${esc(r.topic)}" data-text="${esc((r.title+' '+r.topic+' '+r.desc).toLowerCase())}" href="/#article/${esc(r.id)}">
    <span class="library-card-media${tone==='dark'?' media-dark':''}">${art(r.art,tone,'lib-'+r.id)}</span>
    <span class="library-card-meta"><span class="library-card-topic">${esc(r.topic)} · ${r.read} read</span><span class="library-card-title">${esc(r.title)}</span></span>
  </a>`;
}

const libraryTopics = ['All research','Interpretability','Quantization','Reinforcement learning','Agents'];

function libraryTemplate(){
  return `${siteNav('nav-light',
    navLink('#library-research','Research')+navLink('/#lab','Experiments')+navLink('/#about','About'),
    `<a class="pill outline" href="/#research">The notebook ↗</a>`)}
<main id="main">
  <section class="library-hero">
    <p class="eyebrow">A personal laboratory for artificial intelligence</p>
    <h1>Big questions.<br>Small <span class="inline-math" aria-hidden="true">∑</span> experiments.</h1>
    <p class="library-hero-copy">Research you can read. Ideas you can play with.<br>A growing collection from inside the Chinese Room.</p>
    <div class="hero-actions"><a class="pill black" href="#library-research">Browse the research ↓</a><a class="pill subtle" href="/#lab">Try an experiment ↗</a></div>
  </section>
  <section id="library-research" class="library-browser">
    <div class="browser-top"><h2>The collection <span id="collection-count">04</span></h2><label class="collection-search"><span aria-hidden="true">⌕</span><input id="collection-search" type="search" placeholder="Find a question…" aria-label="Search the research collection"></label></div>
    <div class="browser-toolbar"><div class="chips" role="group" aria-label="Filter research">${libraryTopics.map((t,i)=>`<button type="button" data-topic="${esc(t)}" aria-pressed="${i===0}">${esc(t)}</button>`).join('')}</div>${railControls('library-rail')}</div>
    <div class="card-rail library-rail" id="library-rail" tabindex="0" aria-label="Research collection">${research.map(libraryCard).join('')}</div>
    <p class="collection-empty" id="collection-empty" hidden>No research matches. Try another question.</p>
    <p class="collection-status" id="collection-status" aria-live="polite">4 research notes</p>
  </section>
  <section class="library-lab">
    <div><p class="eyebrow">Learning by doing</p><h2>Take an idea<br>for a test drive.</h2><a class="pill black" href="/#lab">Open the lab ↗</a></div>
    <a href="/#lab/mindcuber" class="library-lab-preview">${art('lattice','light','lib-lab')}<span>Mindcuber — move, scramble, rewind ↗</span></a>
  </section>
</main>${footer(false)}`;
}

/* ---------- 03 ATLAS — the cards are the navigation ---------- */

function atlasCard(r,i){
  return `<a class="atlas-card" href="/#article/${esc(r.id)}">
    <span class="atlas-card-head"><b>${String(i+1).padStart(2,'0')}</b><span>${esc(r.topic)}</span></span>
    <span class="atlas-card-art">${art(r.art,'light','atlas-'+r.id)}</span>
    <span class="atlas-card-foot"><span class="atlas-card-title">${esc(r.title)}</span><span class="atlas-card-meta">${r.read} read ↗</span></span>
  </a>`;
}

function atlasTemplate(){
  return `${siteNav('nav-light',
    `<span class="nav-title">Research atlas</span>`,
    navLink('/#about','About')+`<a class="pill black" href="/#lab">Open lab ↗</a>`)}
<main id="main">
  <section class="atlas-opening">
    <div class="atlas-intro">
      <p class="eyebrow">Chinese Room / Research atlas</p>
      <h1>Intelligence,<br>under examination.</h1>
      <p class="atlas-intro-copy">One researcher. One machine.<br>Different ways of looking inside.</p>
      <a class="text-link" href="/#about">A note from Joe ↗</a>
      <div class="atlas-index"><span id="atlas-position">01 / 04</span>${railControls('atlas-rail')}</div>
      <p class="rail-note">Move through the studies →</p>
    </div>
    <div class="card-rail atlas-rail" id="atlas-rail" tabindex="0" aria-label="Browse four research studies">${research.map(atlasCard).join('')}</div>
  </section>
  <section class="atlas-directory">
    <div class="atlas-dir-intro"><p class="eyebrow">Beyond the page</p><h2>Understand it.<br>Then put it to work.</h2></div>
    <a class="atlas-dir-link" href="/#lab/mindcuber"><span>01 / Interactive lab</span><strong>Explore a cube’s state space.</strong><span class="dir-arrow">↗</span></a>
    <a class="atlas-dir-link" href="/#lab/quantization"><span>02 / Interactive lab</span><strong>Find the cost of fewer bits.</strong><span class="dir-arrow">↗</span></a>
  </section>
  <section class="atlas-note">
    <span class="atlas-seal" lang="zh">房间</span>
    <p>Fluent output. Unanswered questions.<br>An independent notebook on the mathematics of AI.</p>
    <a class="text-link" href="/#research">Full research index ↗</a>
  </section>
</main>${footer(false)}`;
}

/* ---------- Wiring ---------- */

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function railStep(rail){
  const card=[...rail.children].find(c=>!c.hidden);
  const gap=parseFloat(getComputedStyle(rail).columnGap||getComputedStyle(rail).gap)||20;
  return card ? card.offsetWidth+gap : rail.clientWidth*.8;
}
function updateRailButtons(rail){
  const prev=document.querySelector(`[data-rail="${rail.id}"][data-step="-1"]`);
  const next=document.querySelector(`[data-rail="${rail.id}"][data-step="1"]`);
  const max=rail.scrollWidth-rail.clientWidth;
  if(prev)prev.disabled = rail.scrollLeft<=2 || max<=2;
  if(next)next.disabled = rail.scrollLeft>=max-2 || max<=2;
}

function wire(){
  document.querySelectorAll('[data-rail]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const rail=document.getElementById(btn.dataset.rail);
      if(!rail)return;
      rail.scrollBy({left:Number(btn.dataset.step)*railStep(rail),behavior:reduced?'auto':'smooth'});
    });
  });
  document.querySelectorAll('.card-rail').forEach(rail=>{
    rail.addEventListener('scroll',()=>updateRailButtons(rail),{passive:true});
    rail.addEventListener('keydown',e=>{
      if(e.target!==rail)return;
      if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();rail.scrollBy({left:(e.key==='ArrowRight'?1:-1)*railStep(rail),behavior:reduced?'auto':'smooth'});}
      if(e.key==='Home'){e.preventDefault();rail.scrollTo({left:0,behavior:reduced?'auto':'smooth'});}
      if(e.key==='End'){e.preventDefault();rail.scrollTo({left:rail.scrollWidth,behavior:reduced?'auto':'smooth'});}
    });
    updateRailButtons(rail);
  });
  addEventListener('resize',()=>document.querySelectorAll('.card-rail').forEach(updateRailButtons));
  // close mobile nav when a link inside is followed
  document.querySelectorAll('.nav-mobile a').forEach(a=>a.addEventListener('click',()=>{const d=a.closest('details');if(d)d.open=false;}));

  if(document.body.dataset.concept==='library'){
    const chips=[...document.querySelectorAll('.chips button')];
    const input=document.getElementById('collection-search');
    const cards=[...document.querySelectorAll('.library-card')];
    const status=document.getElementById('collection-status');
    const empty=document.getElementById('collection-empty');
    const count=document.getElementById('collection-count');
    let topic='All research';
    const apply=()=>{
      const q=input.value.trim().toLowerCase();
      let n=0;
      cards.forEach(c=>{
        const ok=(topic==='All research'||c.dataset.topic.toLowerCase()===topic.toLowerCase())&&(!q||c.dataset.text.includes(q));
        c.hidden=!ok; if(ok)n++;
      });
      status.textContent=`${n} research note${n===1?'':'s'}`;
      count.textContent=String(n).padStart(2,'0');
      empty.hidden=n>0;
      updateRailButtons(document.getElementById('library-rail'));
    };
    chips.forEach(b=>b.addEventListener('click',()=>{chips.forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');topic=b.dataset.topic;apply();}));
    input.addEventListener('input',apply);
  }

  if(document.body.dataset.concept==='atlas'){
    const rail=document.getElementById('atlas-rail');
    const pos=document.getElementById('atlas-position');
    const upd=()=>{const i=Math.min(3,Math.round(rail.scrollLeft/railStep(rail)));pos.textContent=`${String(i+1).padStart(2,'0')} / 04`;};
    rail.addEventListener('scroll',upd,{passive:true});
    upd();
  }
}

/* ---------- Boot ---------- */

const CONCEPTS={field:['Field',fieldTemplate],library:['Library',libraryTemplate],atlas:['Atlas',atlasTemplate]};
const id=new URLSearchParams(location.search).get('concept');
const concept=Object.hasOwn(CONCEPTS,id)?id:'field';
document.body.dataset.concept=concept;
document.title=`Chinese Room — Design study 0${['field','library','atlas'].indexOf(concept)+1} ${CONCEPTS[concept][0]}`;
document.getElementById('concept').innerHTML=CONCEPTS[concept][1]();
document.querySelectorAll('.review-bar [data-concept]').forEach(a=>{
  const on=a.dataset.concept===concept;
  if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
});
wire();
