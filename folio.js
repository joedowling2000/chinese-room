/* "The open room" — alternative editorial design. Loaded on every page but only
   acts when documentElement.dataset.design === 'folio'. The original design is
   preserved verbatim behind ?design=original. */
const RoomFolio = (() => {
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  /* Bespoke cutaway engraving of the room: isometric walls and floor, a desk
     with an open rulebook, a slot for incoming language and a door for the
     answers leaving. Pure geometry, labelled like an architectural plate. */
  function roomIllustration(){
    const ink='var(--text)';
    const slip=(p)=>`<polygon points="${p}" style="fill:var(--art-paper);stroke:${ink}" stroke-width="1.2"/>`;
    const scribble=(x,y,dy)=>`<line x1="${x}" y1="${y}" x2="${x+16}" y2="${y+dy}" style="stroke:${ink}" stroke-width="1" opacity=".65"/>`;
    return `<svg viewBox="0 0 640 460" role="img" aria-labelledby="folio-room-title">
<title id="folio-room-title">Cutaway drawing of the Chinese Room: a desk, a rulebook and slips of language passing through the walls</title>
<defs>
<pattern id="folio-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" style="stroke:${ink}" stroke-width="1"/></pattern>
</defs>
<g fill="none" style="stroke:${ink}" stroke-width="1.5">
<!-- left wall, right wall, floor -->
<polygon points="90,290 335,150 335,5 90,145" style="fill:var(--panel)"/>
<polygon points="335,150 580,290 580,145 335,5" style="fill:var(--art-wall)"/>
<polygon points="90,290 335,430 580,290 335,150" style="fill:var(--art-floor)"/>
<!-- hatched edges: top of left wall, front margin of floor -->
<polygon points="90,145 335,5 335,22 90,162" fill="url(#folio-hatch)" opacity=".15" stroke="none"/>
<polygon points="90,290 335,430 335,416 90,276" fill="url(#folio-hatch)" opacity=".12" stroke="none"/>
<!-- language slot in left wall -->
<polygon points="152,170 206,139 206,151 152,182" style="fill:${ink}" stroke="none"/>
<!-- door opening and ajar door on right wall -->
<polygon points="452,217 510,251 510,142 452,108" style="fill:${ink}" stroke="none"/>
<polygon points="452,108 488,103 488,213 452,217" style="fill:var(--art-door)"/>
<!-- desk: top, front edge thickness, legs -->
<polygon points="218,233 335,166 445,230 329,298" style="fill:var(--bg)"/>
<polygon points="218,233 329,298 329,308 218,243" style="fill:var(--panel2)"/>
<polygon points="329,298 445,230 445,240 329,308" style="fill:var(--art-floor)"/>
<line x1="218" y1="243" x2="218" y2="307"/>
<line x1="329" y1="308" x2="329" y2="372"/>
<line x1="445" y1="240" x2="445" y2="304"/>
<!-- open rulebook on the desk -->
<polygon points="277,221 316,199 348,218 309,241" style="fill:var(--art-paper)"/>
<polygon points="309,241 348,218 380,237 341,260" style="fill:var(--art-paper)"/>
<line x1="309" y1="241" x2="348" y2="218"/>
<line x1="285" y1="222" x2="307" y2="209" stroke-width="1" opacity=".7"/>
<line x1="290" y1="228" x2="313" y2="215" stroke-width="1" opacity=".7"/>
<line x1="296" y1="234" x2="318" y2="221" stroke-width="1" opacity=".7"/>
<line x1="319" y1="240" x2="341" y2="227" stroke-width="1" opacity=".7"/>
<line x1="325" y1="246" x2="348" y2="233" stroke-width="1" opacity=".7"/>
<line x1="331" y1="252" x2="355" y2="239" stroke-width="1" opacity=".7"/>
<!-- scattered rule slips on the floor -->
${slip('240,338 272,355 258,366 226,349')}
${slip('360,330 392,347 378,358 346,341')}
${slip('296,368 328,385 314,396 282,379')}
<line x1="246" y1="346" x2="262" y2="337" stroke-width="1" opacity=".6"/>
<line x1="366" y1="338" x2="382" y2="329" stroke-width="1" opacity=".6"/>
</g>
<!-- incoming slips through the slot -->
<g style="stroke:${ink};fill:var(--art-paper)" stroke-width="1.2">
<polygon points="28,206 62,190 62,203 28,219"/>
<polygon points="72,196 106,180 106,193 72,209"/>
<polygon points="116,186 152,170 152,182 116,198"/>
</g>
${scribble(34,203,-8)}${scribble(78,193,-8)}${scribble(122,183,-8)}
<path d="M 40 236 L 120 208" style="stroke:${ink}" stroke-width="1" stroke-dasharray="3 4" fill="none" opacity=".5"/>
<!-- outgoing slips through the door -->
<g style="stroke:${ink};fill:var(--art-paper)" stroke-width="1.2">
<polygon points="548,240 580,255 580,268 548,253"/>
<polygon points="578,268 610,283 610,296 578,281"/>
<polygon points="608,296 636,309 636,322 608,309"/>
</g>
${scribble(554,249,8)}${scribble(584,277,8)}${scribble(614,305,8)}
<!-- labels with leader lines -->
<g style="fill:${ink}" stroke="none" font-family="'IBM Plex Sans',Arial,sans-serif" font-size="10" letter-spacing="1.5">
<text x="24" y="176">INPUT</text>
<text x="300" y="118">THE RULEBOOK</text>
<text x="556" y="236">OUTPUT</text>
</g>
<g style="stroke:${ink}" stroke-width="1" fill="none" opacity=".8">
<path d="M 38 182 L 55 190"/>
<path d="M 330 124 L 330 190"/>
<path d="M 560 242 L 572 250"/>
</g>
</svg>`;
  }

  /* Isometric cube with a 3×3 grid per face. */
  function cubeIllustration(){
    return `<svg viewBox="0 0 200 125" aria-hidden="true" fill="none" style="stroke:var(--text)" stroke-width="1.4">
<polygon points="100,8 160,38 100,68 40,38" style="fill:var(--panel)"/>
<polygon points="40,38 100,68 100,118 40,88" style="fill:var(--art-wall)"/>
<polygon points="100,68 160,38 160,88 100,118" style="fill:var(--art-door)"/>
<g stroke-width=".8">
<line x1="120" y1="18" x2="60" y2="48"/><line x1="140" y1="28" x2="80" y2="58"/>
<line x1="80" y1="18" x2="140" y2="48"/><line x1="60" y1="28" x2="120" y2="58"/>
<line x1="60" y1="48" x2="60" y2="98"/><line x1="80" y1="58" x2="80" y2="108"/>
<line x1="40" y1="55" x2="100" y2="85"/><line x1="40" y1="71" x2="100" y2="101"/>
<line x1="120" y1="58" x2="120" y2="98"/><line x1="140" y1="48" x2="140" y2="88"/>
<line x1="100" y1="85" x2="160" y2="55"/><line x1="100" y1="101" x2="160" y2="71"/>
</g>
</svg>`;
  }

  /* Weight magnitudes as stems, the quantised levels as a step line. */
  function quantIllustration(){
    const hs=[12,24,45,65,88,65,45,24,12], base=112, xs=hs.map((_,i)=>20+i*20);
    const stems=hs.map((h,i)=>`<line x1="${xs[i]}" y1="${base}" x2="${xs[i]}" y2="${base-h}" style="stroke:var(--text)" stroke-width="1.4"/><circle cx="${xs[i]}" cy="${base-h}" r="3" style="fill:var(--accent)"/>`).join('');
    const q=[12,12,36,60,84,60,36,12,12];
    let step=`M ${xs[0]-10} ${base-q[0]}`;
    q.forEach((v,i)=>{step+=` L ${xs[i]-10} ${base-v} L ${xs[i]+10} ${base-v}`});
    step+=` L ${xs[8]+10} ${base-q[8]}`;
    return `<svg viewBox="0 0 200 125" aria-hidden="true" fill="none">
${stems}
<line x1="10" y1="${base}" x2="190" y2="${base}" style="stroke:var(--text)" stroke-width="1.4"/>
<path d="${step}" style="stroke:var(--accent)" stroke-width="1.4" fill="none"/>
</svg>`;
  }

  function home(articles, models){
    const f=articles[0];
    return `<div class="folio-home">
  <header class="folio-masthead">
    <div class="folio-dateline"><span>Independent AI research</span><span>A notebook by Joe Dowling</span><span>Est. 2026 · Always questioning</span></div>
    <h1>Chinese <em>Room</em><span lang="zh">房间</span></h1>
    <div class="folio-subline"><span>Experiments in artificial intelligence &amp; the question of understanding.</span><span>chineseroom.io</span></div>
  </header>
  <section class="folio-opening" aria-labelledby="folio-opening-title">
    <div class="folio-intro"><span class="folio-kicker">An open door to a black box</span><h2 id="folio-opening-title">What happens<br><em>inside the room?</em></h2><p>I’m Joe. I take language models apart to see how they work — and write down what I find.</p><p>Refusal directions, smaller numbers, typed agents and a robot that solves Rubik’s cubes. One machine. Plenty of questions.</p><a class="folio-read" href="#research">Read the notebook <span>↗</span></a><a class="folio-secondary" href="#lab">Or, try an experiment →</a></div>
    <figure class="folio-room">${roomIllustration()}<figcaption><span>Fig. 01 — A room full of rules.</span><span>Understanding sold separately.</span></figcaption></figure>
  </section>
  <section class="folio-notebook" aria-labelledby="folio-notebook-title"><div class="folio-section-top"><span>01 / The notebook</span><h2 id="folio-notebook-title">Notes from the inside.</h2><a href="#research">All research ↗</a></div><div class="folio-stories"><a class="folio-lead-story" href="#article/${esc(f.id)}"><span class="folio-kicker">Latest entry · ${esc(f.date)}</span><h3>${esc(f.title)}</h3><p>${esc(f.dek)}</p><span class="folio-story-foot"><span>${esc(f.tag)}</span> <span>${esc(f.read)} read ↗</span></span></a><div class="folio-story-list">${articles.slice(1).map(a=>`<a class="folio-story" href="#article/${esc(a.id)}"><span class="folio-story-number">${esc(a.no)}</span><div><span class="folio-kicker">${esc(a.tag)}</span><h3>${esc(a.title)}</h3><span class="folio-story-date">${esc(a.date)} · ${esc(a.read)} read</span></div><span aria-hidden="true">↗</span></a>`).join('')}</div></div></section>
  <section class="folio-play" aria-labelledby="folio-play-title"><div class="folio-play-intro"><span class="folio-kicker">02 / The workbench</span><h2 id="folio-play-title">Less reading.<br><em>More messing about.</em></h2><p>Small experiments to get your hands around big ideas. Everything runs in your browser.</p></div><a class="folio-experiment" href="#lab/mindcuber"><span class="folio-experiment-drawing">${cubeIllustration()}</span><span class="folio-kicker">Experiment 01</span><h3>A cube. Twelve choices.</h3><p>Turn it. Scramble it. Find your way back.</p><span class="folio-read">Play with Mindcuber ↗</span></a><a class="folio-experiment" href="#lab/quantization"><span class="folio-experiment-drawing">${quantIllustration()}</span><span class="folio-kicker">Experiment 02</span><h3>How small is a number?</h3><p>Lose a few bits. See what survives.</p><span class="folio-read">Explore quantization ↗</span></a></section>
  <section class="folio-inside"><div><span class="folio-kicker">03 / Following the thread</span><h2>A sentence goes in.<br><em>Connections come out.</em></h2><p>This illustrative attention diagram traces links between tokens across layers. Hover or focus a word to follow its connections.</p><a class="folio-secondary" href="#models">Explore the model registry →</a></div><div><div class="attention-card"><div class="attention-head"><span>Self-attention · L12 H03</span><span>Illustration</span></div><div class="attention-viz" id="attention-viz"><svg class="attn-lines" viewBox="0 0 600 300" preserveAspectRatio="none" aria-hidden="true"></svg>${[1,2,3,4].map(n=>`<div class="token-row r${n}">${['The','room','answers','in','Chinese'].map((x,i)=>`<button class="attn-token" data-token="${i}">${x}</button>`).join('')}</div>`).join('')}</div></div></div></section>
  <section class="folio-colophon"><span class="folio-seal" lang="zh">房<br>间</span><div><span class="folio-kicker">Why “Chinese Room”?</span><p>In 1980, John Searle imagined a room that could answer in Chinese without understanding a word. This is a notebook about what’s happening inside.</p><a class="folio-secondary" href="#about">The person behind the door →</a></div><span class="folio-colophon-note">One researcher.<br>One DGX Spark.<br>An unfinished question.</span></section>
</div>`;
  }
  return { home };
})();

/* Shell setup for the folio design. */
(() => {
  addEventListener('DOMContentLoaded',()=>{
    const brandText=document.querySelector('.brand>span:last-child');
    if(brandText)brandText.textContent='Chinese Room';
    const consoleLink=document.querySelector('.console-link');
    if(consoleLink){consoleLink.querySelector('i')?.remove();consoleLink.textContent='The lab ↗';consoleLink.setAttribute('href','#lab');}
    document.querySelectorAll('.topbar .nav-link,.mobile-menu .nav-link').forEach(link=>{
      const last=link.lastChild;
      if(last&&last.nodeType===Node.TEXT_NODE)last.textContent=last.textContent.toLowerCase();
    });
  });
})();
