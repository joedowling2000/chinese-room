/* Field Instruments: model-driven games, static hosting, no dependencies. */
const FieldGames = (() => {
  const games = [], STORE = 'field-instruments-v1';
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const copy = v => JSON.parse(JSON.stringify(v));
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = (v,n=2) => Number(v.toFixed(n)).toString();
  function describeValue(v){
    if(typeof v==='number')return fmt(v,5);
    if(Array.isArray(v))return '('+v.map(describeValue).join(', ')+')';
    if(record(v))return Object.entries(v).map(([k,x])=>`${k} = ${describeValue(x)}`).join('; ');
    return String(v);
  }
  const dot = (a,b) => a.reduce((sum,v,i)=>sum+v*b[i],0);
  const norm = a => Math.hypot(...a);
  const distance = (a,b) => norm(a.map((v,i)=>v-b[i]));
  const mat = (m,p) => [m[0]*p[0]+m[1]*p[1],m[2]*p[0]+m[3]*p[1]];
  const softmax = scores => {const max=Math.max(...scores),e=scores.map(v=>Math.exp(v-max)),sum=e.reduce((a,b)=>a+b,0);return e.map(v=>v/sum);};
  const txt = (x,y,t,cls='',anchor='start') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(t)}</text>`;
  const line = (a,b,cls='fi-line',extra='') => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="${cls}" ${extra}/>`;
  const circle = (p,r,cls='fi-dot',extra='') => `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" class="${cls}" ${extra}/>`;
  const path = (pts,cls='fi-line',closed=false) => `<path d="${pts.map((p,i)=>(i?'L':'M')+p.join(',')).join(' ')}${closed?'Z':''}" class="${cls}"/>`;
  const arrow = (a,b,cls='fi-vector') => {const t=Math.atan2(b[1]-a[1],b[0]-a[0]);return line(a,b,cls)+path([[b[0]-12*Math.cos(t-.4),b[1]-12*Math.sin(t-.4)],b,[b[0]-12*Math.cos(t+.4),b[1]-12*Math.sin(t+.4)]],cls);};
  function grid(cx,cy,u,r=3){let o='';for(let i=-r;i<=r;i++){o+=line([cx-r*u,cy+i*u],[cx+r*u,cy+i*u],i?'fi-grid':'fi-axis');o+=line([cx+i*u,cy-r*u],[cx+i*u,cy+r*u],i?'fi-grid':'fi-axis');}return o;}
  const handle = (p,id,label) => `<g data-handle="${id}" class="fi-handle">${circle(p,30,'fi-hit')}${circle(p,11,'fi-handle-core')}${txt(p[0]+18,p[1]-15,label,'fi-label')}</g>`;
  const range = (id,label,min,max,step,value) => `<div class="fi-range"><span class="fi-range-head"><span>${esc(label)}</span><output data-output="${id}">${fmt(value,3)}</output></span><div class="fi-range-row"><button type="button" data-nudge="${id}" data-direction="-1" aria-label="Decrease ${esc(label)}">−</button><input type="range" data-param="${id}" aria-label="${esc(label)}" min="${min}" max="${max}" step="${step}" value="${value}"><button type="button" data-nudge="${id}" data-direction="1" aria-label="Increase ${esc(label)}">+</button></div><span class="fi-bounds" aria-hidden="true"><span>${fmt(min)}</span><span>${fmt(max)}</span></span></div>`;
  const action = (id,label,on=false) => `<button type="button" data-action="${id}" ${on?'aria-pressed="true"':''}>${label}</button>`;
  const select = (id,label,options,value) => `<label class="fi-select"><span>${esc(label)}</span><select data-param="${id}" aria-label="${esc(label)}">${options.map(([v,t])=>`<option value="${v}" ${String(value)===String(v)?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`;
  const point = (p,cx,cy,u) => [cx+p[0]*u,cy-p[1]*u];
  const courier = (pts,i=0) => `<circle r="6" class="fi-courier" opacity="0"><animateMotion path="${pts.map((p,j)=>(j?'L':'M')+p.join(',')).join(' ')}" dur=".55s" begin="0s" fill="freeze"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.1;.9;1" dur=".55s" begin="0s" fill="freeze"/></circle>`;
  const helpers={courier,clamp,copy,esc,fmt,dot,norm,distance,mat,softmax,txt,line,circle,path,arrow,grid,handle,range,action,select,point};
  const refs={'linear-maps':'https://arxiv.org/html/1706.03762v7','folding':'https://arxiv.org/html/1706.03762v7','attention':'https://arxiv.org/html/1706.03762v7','gradient-descent':'https://distill.pub/2017/momentum/','rotary':'https://arxiv.org/html/2104.09864v5','dimensions':'https://arxiv.org/abs/2209.10652','ablation':'https://arxiv.org/abs/2406.11717'};
  const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  function validState(g,s,l){try{return record(s)&&g.validate(s,l)===true;}catch{return false;}}
  function cleanGame(g,raw){
    const v=record(raw)?raw:{},level=Number.isInteger(v.level)&&v.level>=0&&v.level<g.levels.length?v.level:0,completed={};
    for(let i=0;i<g.levels.length;i++){
      const c=v.completed?.[i];
      if(record(c)&&(c.version===undefined||c.version===1)&&validState(g,c.state,i)){
        const e=g.evaluate(c.state,i);
        if(e.pass)completed[i]={version:1,state:copy(c.state),metric:e.metric,assisted:c.assisted===true};
      }
    }
    return {version:1,level,state:(v.version===undefined||v.version===1)&&validState(g,v.state,level)?copy(v.state):copy(g.levels[level].initial),completed,assisted:v.assisted===true};
  }
  let session=null, saved={}, resetBackup=null, lastGame=null, exitedGame=null, legacyPending=false;
  try{const v=JSON.parse(localStorage.getItem(STORE));if(record(v)&&v.version===1&&record(v.games))saved=v;}catch{}
  saved.games=record(saved.games)?saved.games:{};
  saved.preferences=(p=>{const o={};if(record(p)){if(typeof p.motion==='boolean')o.motion=p.motion;if(typeof p.sound==='boolean')o.sound=p.sound;}return o;})(saved.preferences);
  function persist(){try{localStorage.setItem(STORE,JSON.stringify({...saved,version:1}));}catch{}}
  function contourLegacyCheck(g,raw){
    if(g.id!=='gradient-descent'||!record(raw)||record(saved['gradient-descent-legacy']))return;
    const lvl=Number.isInteger(raw.level)?raw.level:0;
    const droppedState=raw.state!==undefined&&!validState(g,raw.state,lvl);
    const droppedComp=record(raw.completed)&&Object.keys(raw.completed).some(i=>record(raw.completed[i])&&raw.completed[i].state!==undefined&&!validState(g,raw.completed[i].state,Number(i)));
    if(droppedState||droppedComp){saved['gradient-descent-legacy']=copy(raw);legacyPending=true;}
  }
  function register(game){games.push(game);games.sort((a,b)=>a.tag.localeCompare(b.tag));contourLegacyCheck(game,saved.games[game.id]);saved.games[game.id]=cleanGame(game,saved.games[game.id]);persist();}
  function mini(g){
    const comp=record(saved.games[g.id])?saved.games[g.id].completed:null;
    if(!record(comp))return '';
    const keys=Object.keys(comp).map(Number).filter(Number.isInteger);
    if(!keys.length)return '';
    const i=Math.max(...keys),c=comp[i];
    try{
      const markup=String(g.draw(c.state,i,{trial:false,step:-1,motion:false,editable:false})).replace(/\s(tabindex|role|data-action|data-handle)="[^"]*"/g,'').replace(/<\/?button\b[^>]*>/g,'');
      return `<svg class="fi-mini" viewBox="0 0 1000 560" aria-hidden="true" focusable="false">${markup}</svg>`;
    }catch{return '';}
  }
  function page(id){
    const g=games.find(g=>g.id===id);
    if(!g)return `<section class="fi-index"><p class="eyebrow">The maths of AI / Play</p><h1>The Field<br><em>Instruments.</em></h1><p class="fi-intro">Seven machines. Seven mathematical rules.<br>Make a hypothesis. Change the system. See what survives.</p><div class="fi-catalogue">${games.map((g,i)=>{const comp=record(saved.games[g.id])&&record(saved.games[g.id].completed)?saved.games[g.id].completed:{},done=Object.keys(comp).length,assist=Object.values(comp).some(c=>c.assisted===true);return `<a class="fi-card" style="--fi-accent:${g.accent}" href="#maths/play/${g.id}"><div class="fi-card-top"><span>0${i+1} / ${esc(g.tag)}</span><span>${done} / ${g.levels.length}${assist?' · assisted':''}</span></div><div class="fi-card-art" aria-hidden="true">${mini(g)||g.icon}</div><h2>${g.title}</h2><p>${g.subtitle}</p><span class="fi-card-link">${g.verb} →</span></a>`;}).join('')}</div><p class="fi-index-note">Touch & keyboard · three chambers each · progress saved on this device</p><a class="text-link" href="#maths">Explore the ideas and diagrams →</a><div class="fi-save-actions"><button type="button" data-clear-progress>Reset saved progress</button>${resetBackup?'<button type="button" data-restore-progress>Undo progress reset</button>':''}</div></section>`;
    return `<section class="fi-game" style="--fi-accent:${g.accent}" aria-label="${esc(g.title)}"><header class="fi-header"><a href="#maths/play" class="fi-back" aria-label="All instruments">↖ <span>Instruments</span></a><div><p class="fi-kicker">${esc(g.tag)} / Field instrument 0${games.indexOf(g)+1}</p><h1>${g.title}</h1></div><div class="fi-header-actions"><button type="button" data-host="sound" aria-pressed="false">Sound off</button><button type="button" data-host="motion">Motion on</button><a href="#maths">Exit ↗</a></div></header><div class="fi-mission"><div><p class="fi-kicker" id="fi-level-count"></p><h2 id="fi-level-title"></h2><p id="fi-objective"></p></div><nav id="fi-levels" aria-label="Chambers"></nav></div><div class="fi-workspace"><div class="fi-scene"><div class="fi-scene-caption"><span id="fi-scene-label">LIVE PREVIEW</span><span>${g.verb.toUpperCase()} / OBSERVE / REVISE</span></div><svg id="fi-stage" viewBox="0 0 1000 560" tabindex="0" role="group" aria-label="${esc(g.title)} mathematical stage"></svg><div class="fi-measure"><span id="fi-metric"></span><span id="fi-score"></span></div></div><aside class="fi-tools" aria-label="Instrument controls"><p class="fi-kicker">Operate the instrument</p><div class="fi-tool-scroll"><div id="fi-controls"></div><details class="fi-measurements" id="fi-measurements"><summary>Measurements</summary><div id="fi-measurements-body"></div></details></div><div class="fi-tool-footer"><button data-host="undo" type="button">↶ Undo</button><button data-host="reset" type="button">Reset</button><button data-host="restore" type="button" hidden>Restore solution</button></div><p class="fi-controls-note">${esc(g.controlNote||'Drag the illuminated handles, or use the controls. All changes can be undone.')}</p></aside></div><footer class="fi-console"><div class="fi-feedback"><p class="fi-kicker" id="fi-state-label">Awaiting trial</p><p id="fi-feedback" role="status" aria-live="polite">${esc(g.invitation)}</p></div><div class="fi-console-actions"><button type="button" data-host="hint">Hint</button><button type="button" data-host="why">The maths</button><button type="button" data-host="replay" hidden>Replay trial</button><button type="button" data-host="pause" hidden>Pause</button><button type="button" data-host="step">${g.stepLabel||'Step trial'}</button><button type="button" data-host="run" class="fi-primary">${g.runLabel||'Run trial'} <span>↗</span></button><button type="button" data-host="next" class="fi-primary" hidden>Next chamber →</button></div></footer><dialog class="fi-dialog"><form method="dialog"><button class="fi-dialog-close" aria-label="Close explanation">×</button></form><div id="fi-dialog-content"></div></dialog></section>`;
  }
  function wire(id){
    session?.dispose();session=null;
    document.body.classList.remove('fi-playing');
    const g=games.find(g=>g.id===id),root=document.querySelector('.fi-game');
    if(!g||!root){
      const catalogue=document.querySelector('.fi-index');
      if(catalogue){const controller=new AbortController();catalogue.addEventListener('click',e=>{
        if(e.target.closest('[data-clear-progress]')){resetBackup=copy(saved.games);saved.games={};persist();catalogue.outerHTML=page();wire();document.querySelector('[data-restore-progress]')?.focus({preventScroll:true});}
        else if(e.target.closest('[data-restore-progress]')&&resetBackup){saved.games=resetBackup;resetBackup=null;games.forEach(g=>{contourLegacyCheck(g,saved.games[g.id]);saved.games[g.id]=cleanGame(g,saved.games[g.id]);});persist();catalogue.outerHTML=page();wire();document.querySelector('[data-clear-progress]')?.focus({preventScroll:true});}
      },{signal:controller.signal});session={dispose:()=>controller.abort()};
        if(exitedGame){const back=exitedGame;exitedGame=null;catalogue.querySelector(`a[href="#maths/play/${back}"]`)?.focus({preventScroll:true});}
      }
      return;
    }
    lastGame=id;
    document.body.classList.add('fi-playing');
    const abort=new AbortController(),signal=abort.signal,$=s=>root.querySelector(s);
    const rawStore=saved.games[g.id];
    contourLegacyCheck(g,rawStore);
    const legacyNotice=g.id==='gradient-descent'&&legacyPending;if(legacyNotice)legacyPending=false;
    const cleaned=saved.games[g.id]=cleanGame(g,rawStore);
    let levelIndex=cleaned.level, level=g.levels[levelIndex], state=copy(cleaned.state), history=[], preview=null, trial=null, probe=-1, hints=0, disposed=false, audio=null, drag=null, playing=false, playTimer=0, pulseTimer=0;
    const completed=cleaned.completed;
    let assisted=cleaned.assisted;
    const stage=$('#fi-stage');
    const mq=matchMedia('(prefers-reduced-motion: reduce)');
    let motion=!mq.matches&&saved.preferences.motion!==false, sound=saved.preferences.sound===true;
    function save(){saved.games[g.id]={version:1,level:levelIndex,state:copy(state),completed,assisted};persist();}
    function tone(ok){if(!sound)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),v=audio.createGain();o.type='sine';o.frequency.value=ok?440:165;v.gain.setValueAtTime(.035,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.35);o.connect(v);v.connect(audio.destination);o.start();o.stop(audio.currentTime+.35);}catch{}}
    function message(text,label='Experiment in progress'){ $('#fi-feedback').textContent=text;$('#fi-state-label').textContent=label; }
    function smil(pause){try{pause?stage.pauseAnimations():stage.unpauseAnimations();}catch{}}
    function stopPlayback(){playing=false;clearTimeout(playTimer);playTimer=0;smil(true);syncTransport();}
    function pausePlayback(){stopPlayback();}
    function clearTrial(){stopPlayback();trial=null;probe=-1;}
    function commitPreview(){if(preview){remember(preview);preview=null;}}
    function remember(before){if(JSON.stringify(before)!==JSON.stringify(state)){history.push(before);if(history.length>100)history.shift();}clearTrial();save();}
    function captureTrial(){const e=g.evaluate(state,levelIndex);return {...copy(e),state:copy(state),level:levelIndex,items:copy(e.items?.length?e.items:[{detail:e.detail,good:e.pass}])};}
    function frameCount(){if(!trial)return 0;if(Array.isArray(trial.state?.updates)&&trial.state.updates.length)return Math.min(41,trial.state.updates.length);return Math.min(41,trial.items?.length||1);}
    function frameState(i){if(trial&&Array.isArray(trial.state?.updates)&&trial.state.updates.length){const s=trial.state,j=clamp(i,0,s.updates.length-1),u=s.updates[j];return {...copy(s),...copy(u),path:s.path.slice(0,j+1),updates:s.updates.slice(0,j+1)};}return trial?trial.state:state;}
    function firstProbe(t){if(Array.isArray(t.state?.updates)&&t.state.updates.length)return t.pass?0:Math.min(40,t.state.updates.length-1);const bad=(t.items||[]).findIndex(i=>i.good===false);return t.pass?0:(bad>=0?bad:0);}
    function tick(){playTimer=0;if(disposed||!playing)return;if(probe>=frameCount()-1){stopPlayback();render(false);return;}probe++;render(false);playTimer=setTimeout(tick,700);}
    function startPlayback(){stopPlayback();if(disposed||!motion||!trial||frameCount()<2)return;probe=0;playing=true;render(false);playTimer=setTimeout(tick,700);}
    function resumePlayback(){stopPlayback();if(disposed||!motion||!trial||frameCount()<2)return;if(probe>=frameCount()-1)probe=0;playing=true;render(false);playTimer=setTimeout(tick,700);}
    function syncTransport(){const pb=$('[data-host="pause"]');if(!pb)return;pb.textContent=playing?'Pause':'Resume';pb.setAttribute('aria-pressed',String(playing));}
    function fitBoard(){
      const hits=stage.querySelectorAll('.fi-hit');hits.forEach(h=>h.style.display='none');
      let bb=null;try{bb=stage.getBBox();}catch{}
      hits.forEach(h=>h.style.display='');
      let x0=0,y0=0,x1=1000,y1=560;
      if(bb&&[bb.x,bb.y,bb.width,bb.height].every(Number.isFinite)&&bb.width>0){x0=Math.min(x0,bb.x-24);y0=Math.min(y0,bb.y-24);x1=Math.max(x1,bb.x+bb.width+24);y1=Math.max(y1,bb.y+bb.height+24);}
      x0=clamp(x0,-3000,0);y0=clamp(y0,-3000,0);x1=clamp(x1,1000,4000);y1=clamp(y1,560,3200);
      stage.setAttribute('viewBox',`${x0} ${y0} ${x1-x0} ${y1-y0}`);
    }
    function sizeHits(){
      let r=22;try{const m=stage.getScreenCTM(),sc=m?Math.hypot(m.a,m.b):0;if(sc>0)r=22/sc;}catch{}
      stage.querySelectorAll('.fi-hit').forEach(h=>h.setAttribute('r',r.toFixed(1)));
    }
    function renderMeasurements(){
      const body=$('#fi-measurements-body');if(!body)return;
      const openInspect=body.querySelector('.fi-inspect')?.open,openConfig=body.querySelector('.fi-config')?.open,openEx=body.querySelector('.fi-exact')?.open,openWl=body.querySelector('.fi-workload')?.open;
      const e=trial||g.evaluate(state,levelIndex),items=e.items||[{detail:e.detail,good:e.pass}],shown=trial?frameState(Math.max(probe,0)):state;
      const updates=Array.isArray(trial?.state?.updates)&&trial.state.updates.length?trial.state.updates:(Array.isArray(state.updates)?state.updates:null);
      const replay=!!(trial&&Array.isArray(trial.state?.updates)&&trial.state.updates.length);
      let h='';
      const ph=probe<0?`<option value="" disabled selected>Choose ${updates?'an update':'a probe'}</option>`:'';
      const opts=updates?updates.map((u,i)=>`<option value="${i}" ${i===probe?'selected':''}>Update ${i} · speed ${fmt(Math.hypot(u.vx,u.vy),3)}</option>`).join(''):items.map((it,i)=>`<option value="${i}" ${i===probe?'selected':''}>${i+1} · ${esc(String(it.detail||'item').slice(0,60))}</option>`).join('');
      h+=`<div class="fi-probe-row"><label class="fi-select"><span>${replay||updates?'Update / frame':'Probe'}</span><select data-probe aria-label="Select ${updates?'update':'probe'}">${ph}${opts}</select></label><div class="fi-tool-buttons"><button type="button" data-host="prev" ${trial?'':'disabled'}>← Previous</button><button type="button" data-host="fwd" ${trial?'':'disabled'}>Next →</button></div></div>`;
      const canon={p:'input',out:'output',target:'expected'};
      const labels={input:'Input',p:'Input',output:'Output',out:'Output',expected:'Target',target:'Target',value:'Value carrier',weight:'Attention weight',scores:'Decoder scores',prediction:'Recovered activity',error:'Error',z:'Pre-activation',intermediate:'Intermediate output',representation:'Shared representation',removed:'Removed component'};
      const keys=['input','p','output','out','expected','target','value','weight','scores','prediction','error','z','intermediate','representation','removed'];
      if(updates&&probe>=0){const u=updates[clamp(probe,0,updates.length-1)];
        h+=`<dl class="fi-probe-values"><dt>Update</dt><dd>${clamp(probe,0,updates.length-1)}</dd><dt>Position</dt><dd>${esc(describeValue([u.x,u.y]))}</dd><dt>Velocity</dt><dd>${esc(describeValue([u.vx,u.vy]))}</dd><dt>Learning rate η</dt><dd>${fmt(u.eta)}</dd><dt>Momentum μ</dt><dd>${fmt(u.mu)}</dd><dt>Status</dt><dd>${esc(u.status)}</dd></dl><details class="fi-exact"><summary>Exact frame values</summary><pre class="fi-probe-json">${esc(JSON.stringify(u,null,1))}</pre></details>`;}
      else if(trial&&probe>=0&&items[probe]){const it=items[probe];h+=`<p class="fi-probe-detail">${esc(it.detail||'')}</p>`;if(it.good!==undefined)h+=`<p class="fi-probe-good">${it.good?'Constraint met':'Not yet met'}</p>`;
        const seen=new Set(),rows=[],rest={};keys.forEach(k=>{if(it[k]!==undefined){const c=canon[k]||k;if(!seen.has(c)){seen.add(c);rows.push([labels[k],it[k]]);}rest[k]=it[k];}});
        if(rows.length)h+=`<dl class="fi-probe-values">${rows.map(([lab,v])=>`<dt>${esc(lab)}</dt><dd>${esc(describeValue(v))}</dd>`).join('')}</dl>`;
        if(Object.keys(rest).length)h+=`<details class="fi-exact"><summary>Exact probe values</summary><pre class="fi-probe-json">${esc(JSON.stringify(rest,null,1))}</pre></details>`;}
      else if(!trial)h+='<p class="fi-fine">Select a probe to inspect the current configuration, or run a trial.</p>';
      const extra=g.inspect?.(shown,levelIndex);
      if(updates&&extra?.updates)h+=`<details class="fi-workload"><summary>Update history</summary><ol>${extra.updates.map(u=>`<li>Update ${u.index} · loss ${esc(fmt(u.loss,4))} · speed ${esc(fmt(u.speed,3))}${u.status==='diverged'?' · diverged':''}</li>`).join('')}</ol></details>`;
      else if(items.length&&items[0].detail)h+=`<details class="fi-workload"><summary>Required probes</summary><ol>${items.map((it,i)=>`<li>${i+1} · ${esc(it.detail||'')}${it.good===false?' · not met':it.good===true?' · met':''}</li>`).join('')}</ol></details>`;
      if(extra)h+=`<details class="fi-inspect"><summary>Instrument data</summary><pre class="fi-probe-json">${esc(JSON.stringify(extra,null,1))}</pre></details>`;
      h+=`<details class="fi-config"><summary>${trial?'Trial result · captured configuration':'Current configuration'}</summary><pre class="fi-probe-json">${esc(JSON.stringify(trial?trial.state:state,null,1))}</pre><p class="fi-fine">${esc(trial?'Trial result':'Live preview')} · ${esc(e.metric)} · ${esc(e.detail)}</p></details>`;
      body.innerHTML=h;
      for(const [selector,open] of [['.fi-inspect',openInspect],['.fi-config',openConfig],['.fi-exact',openEx],['.fi-workload',openWl]]){
        const panel=body.querySelector(selector);if(panel&&open)panel.open=true;
      }
    }
    function render(controls=true){
      const e=trial||g.evaluate(state,levelIndex),focus=document.activeElement,fc=focus?{param:focus.dataset?.param,action:focus.dataset?.action,nudge:focus.dataset?.nudge,dir:focus.dataset?.direction,rewind:focus.dataset?.rewind!==undefined,probe:focus.dataset?.probe!==undefined,host:focus.dataset?.host,level:focus.dataset?.level,summary:focus.matches?.('summary')?focus.parentElement?.classList?.[0]:null}:null;
      const rewindVal=root.querySelector('[data-rewind]')?.value;
      const displayState=trial?frameState(Math.max(probe,0)):state;
      stage.innerHTML=`<defs><radialGradient id="fi-aura"><stop stop-color="${g.accent}" stop-opacity=".12"/><stop offset="1" stop-color="${g.accent}" stop-opacity="0"/></radialGradient><filter id="fi-glow"><feGaussianBlur stdDeviation="4"/></filter></defs><ellipse cx="500" cy="290" rx="490" ry="280" fill="url(#fi-aura)"/>${g.draw(displayState,levelIndex,{trial:!!trial,step:trial?Math.max(probe,0):-1,motion:motion&&playing,editable:!trial||(!playing&&probe===frameCount()-1)})}`;
      if(!drag)fitBoard();sizeHits();
      if(motion&&playing)try{stage.setCurrentTime(0);}catch{}
      if(drag)stage.querySelector(`[data-handle="${drag.id}"]`)?.classList.add('fi-selected');
      stage.setAttribute('aria-label',`${g.title}. ${e.metric}. ${e.detail}`);
      if(controls){$('#fi-controls').innerHTML=g.controls(state,levelIndex);const nr=root.querySelector('[data-rewind]');if(nr&&rewindVal&&nr.querySelector(`option[value="${rewindVal}"]`))nr.value=rewindVal;}
      root.querySelectorAll('[data-output]').forEach(el=>{const input=root.querySelector(`[data-param="${el.dataset.output}"]`);if(input)el.textContent=fmt(Number(input.value),3);});
      $('#fi-metric').textContent=e.metric;
      $('#fi-score').textContent=trial?.pass&&trial.verified!==false?'VERIFIED':trial&&!trial.verified?'INSPECTING':e.pass?'READY TO VERIFY':e.score||'Adjust the instrument';
      $('#fi-scene-label').textContent=trial?(playing?'REPLAYING TRIAL':trial.pass&&trial.verified!==false?'VERIFIED / SIGNAL LOCKED':trial.pass?'TRIAL / UNVERIFIED PROBES':'TRIAL / INSPECT THE MISS'):'LIVE PREVIEW';
      root.classList.toggle('fi-solved',!!(trial?.pass&&trial.verified!==false));
      $('[data-host="undo"]').disabled=!history.length&&!trial&&!preview;
      $('[data-host="next"]').hidden=!completed[levelIndex];
      $('[data-host="next"]').textContent=levelIndex<2?'Next chamber →':'All instruments ↗';
      $('[data-host="run"]').hidden=!!(trial?.pass&&trial.verified!==false);
      $('[data-host="replay"]').hidden=!trial;
      $('[data-host="replay"]').disabled=!motion||frameCount()<2;
      $('[data-host="pause"]').hidden=!trial;
      $('[data-host="pause"]').disabled=!motion||frameCount()<2;
      $('[data-host="restore"]').hidden=!completed[levelIndex];
      syncTransport();
      $('[data-host="motion"]').textContent=motion?'Motion on':'Motion off';
      $('[data-host="motion"]').setAttribute('aria-pressed',String(motion));
      root.classList.toggle('fi-still',!motion);
      $('[data-host="sound"]').textContent=sound?'Sound on':'Sound off';
      $('[data-host="sound"]').setAttribute('aria-pressed',String(sound));
      $('#fi-levels').innerHTML=g.levels.map((l,i)=>`<button type="button" data-level="${i}" aria-label="Chamber ${i+1}: ${esc(l.name)}${completed[i]?`, completed${completed[i].assisted?' with hints':''}`:''}" ${i===levelIndex?'aria-current="step"':''}><span>${completed[i]?'✓':String(i+1).padStart(2,'0')}</span><small>${esc(l.name)}${completed[i]?.assisted?' · assisted':''}</small></button>`).join('');
      renderMeasurements();
      if(focus&&!focus.isConnected){const q=s=>root.querySelector(s);
        if(fc.param)q(`[data-param="${fc.param}"]`)?.focus({preventScroll:true});
        else if(fc.action)q(`[data-action="${fc.action}"]`)?.focus({preventScroll:true});
        else if(fc.nudge)q(`[data-nudge="${fc.nudge}"][data-direction="${fc.dir}"]`)?.focus({preventScroll:true});
        else if(fc.probe)q('[data-probe]')?.focus({preventScroll:true});
        else if(fc.rewind)q('[data-rewind]')?.focus({preventScroll:true});
        else if(fc.summary&&['fi-inspect','fi-config','fi-workload','fi-exact','fi-measurements'].includes(fc.summary))q('.'+fc.summary+' > summary')?.focus({preventScroll:true});
        else if(fc.host)q(`[data-host="${fc.host}"]`)?.focus({preventScroll:true});
        else if(fc.level!==undefined&&fc.level!==null)q(`[data-level="${fc.level}"]`)?.focus({preventScroll:true});}
      else if(focus&&focus.isConnected&&root.contains(focus)&&(focus.hidden||focus.closest('[hidden]'))){(completed[levelIndex]?$('[data-host="next"]'):stage)?.focus({preventScroll:true});}
      smil(!playing||!motion);
    }
    function mountLevel(i){preview=null;stopPlayback();levelIndex=i;level=g.levels[i];state=copy(level.initial);history=[];trial=null;probe=-1;hints=0;assisted=false;$('#fi-level-count').textContent=`CHAMBER 0${i+1} / 03`;$('#fi-level-title').textContent=level.name;$('#fi-objective').textContent=level.brief;message(g.invitation,'Awaiting trial');save();render();}
    function edit(fn){commitPreview();const before=copy(state);fn();remember(before);message(g.evaluate(state,levelIndex).detail,'Preview updated');render();}
    function recordCompletion(){const prev=completed[levelIndex];if(prev&&prev.assisted===false&&assisted)return;completed[levelIndex]={version:1,state:copy(trial.state),metric:trial.metric,assisted:prev&&prev.assisted===false?false:assisted};save();}
    function finishTrial(t,{autoplay=true,latest=false,verified=true}={}){trial=t;trial.verified=verified;probe=latest?Math.max(0,frameCount()-1):firstProbe(t);if(t.pass&&trial.verified)recordCompletion();
      if(t.pass&&trial.verified){message(level.discovery+(completed[levelIndex].assisted?' · completed with full hints':''),'Verified · chamber complete');tone(true);}
      else{message(t.detail,g.advance?'Update recorded':'Trial incomplete');tone(false);}
      root.classList.remove('fi-pulsing');if(motion){void root.offsetWidth;root.classList.add('fi-pulsing');clearTimeout(pulseTimer);pulseTimer=setTimeout(()=>root.classList.remove('fi-pulsing'),1000);}
      render();if(autoplay)startPlayback();}
    function run(){stopPlayback();commitPreview();if(g.advance){const before=copy(state);g.advance(state,levelIndex,4);remember(before);}finishTrial(captureTrial(),{autoplay:!g.advance,latest:!!g.advance});}
    function step(){stopPlayback();commitPreview();
      if(g.advance){const before=copy(state);g.advance(state,levelIndex,1);remember(before);finishTrial(captureTrial(),{autoplay:false,latest:true});return;}
      if(!trial)trial=captureTrial(),trial.verified=false;
      const count=trial.items.length;
      probe=(probe+1)%count;
      const item=trial.items[probe];
      message(item?.detail||trial.detail,`Probe ${probe+1} / ${count}`);
      if(probe===count-1){trial.verified=true;if(trial.pass)recordCompletion();}
      render(false);}
    function endDrag(cancel=false){if(!drag)return;const d=drag;drag=null;try{stage.releasePointerCapture(d.pointer);}catch{}stage.querySelectorAll('.fi-selected').forEach(el=>el.classList.remove('fi-selected'));if(preview){if(cancel)state=preview;else remember(preview);preview=null;}message(g.evaluate(state,levelIndex).detail,cancel?'Drag cancelled':'Preview updated');render();}
    function explain(hint){
      endDrag(true);pausePlayback();
      if(preview){state=preview;preview=null;render();}
      const shown=trial?frameState(Math.max(probe,0)):state,current=g.evaluate(shown,levelIndex);
      let content;
      if(hint){const idx=Math.min(hints,level.hints.length-1);if(idx===level.hints.length-1&&!assisted){assisted=true;save();}content=`<p class="fi-kicker">A useful observation / ${idx+1} of ${level.hints.length}</p><h2>${level.name}</h2><p>${esc(level.hints[idx])}</p>${idx===level.hints.length-1?'<p class="fi-fine">This was the full hint. Completing this chamber now is marked as assisted.</p>':''}`;hints++;}
      else content=`<p class="fi-kicker">Inside the instrument</p><h2>${g.title}</h2><p>${esc(level.discovery)}</p><pre>${esc(g.equation)}</pre><p>${esc(g.explain(shown,levelIndex))}</p><div class="fi-explanation-readout">${trial?'Selected replay frame':'Your current state'}: ${esc(current.metric)}</div><p><a class="fi-ref" href="${refs[g.id]}" target="_blank" rel="noopener">Primary reference ↗</a> · <a class="fi-ref" href="#maths/${g.id}">The idea in context ↗</a></p><p class="fi-fine">${esc(g.connection)}</p>`;
      $('#fi-dialog-content').innerHTML=content;$('.fi-dialog').showModal();
    }
    root.addEventListener('click',e=>{
      if(drag)endDrag(true);
      const nudge=e.target.closest('[data-nudge]');
      if(nudge){const input=root.querySelector(`[data-param="${nudge.dataset.nudge}"]`);if(!input)return;
        const min=Number(input.min),max=Number(input.max),stepN=Number(input.step)||1,direction=Number(nudge.dataset.direction);
        const value=Number((Number(input.value)+direction*stepN).toFixed(8)),clamped=clamp(value,min,max);
        edit(()=>{g.set(state,nudge.dataset.nudge,clamped,levelIndex);input.value=clamped;});
        if(clamped!==value)message(`At the ${direction<0?'lower':'upper'} bound ${fmt(direction<0?min:max)}.`,'Bound reached');
        return;}
      const b=e.target.closest('button,[data-action]');if(!b)return;
      if(b.dataset.level!==undefined){endDrag(true);mountLevel(Number(b.dataset.level));return;}
      if(b.dataset.probe!==undefined||b.dataset.rewind!==undefined)return;
      if(b.dataset.action){edit(()=>{if(b.dataset.action==='rewind'&&g.rewind)g.rewind(state,Number(root.querySelector('[data-rewind]')?.value||0));else g.act(state,b.dataset.action,levelIndex);});return;}
      switch(b.dataset.host){
        case 'run':endDrag(true);run();break;
        case 'step':endDrag(true);step();break;
        case 'replay':if(trial){probe=firstProbe(trial);startPlayback();render(false);}break;
        case 'pause':playing?pausePlayback():resumePlayback();render(false);break;
        case 'prev':if(trial){pausePlayback();probe=(probe-1+frameCount())%frameCount();render(false);}break;
        case 'fwd':if(trial){pausePlayback();probe=(probe+1)%frameCount();render(false);}break;
        case 'restore':{const rec=completed[levelIndex];if(!rec)break;endDrag(true);stopPlayback();commitPreview();const before=copy(state);state=copy(rec.state);if(JSON.stringify(before)!==JSON.stringify(state)){history.push(before);if(history.length>100)history.shift();}assisted=rec.assisted===true;save();finishTrial(captureTrial(),{autoplay:false,latest:true});message(rec.assisted?'Saved solution restored (completed with hints). You can replay it or keep adjusting.':'Saved solution restored. You can replay it or keep adjusting.','Solution restored');}break;
        case 'undo':stopPlayback();
          if(preview){state=preview;preview=null;save();message('Uncommitted change reverted.','Undone');render();}
          else if(trial){trial=null;probe=-1;save();message('Trial inspection cleared. Your edits are still in place; undo again to revert them.','Trial cleared');render();}
          else if(history.length){state=history.pop();save();message('Previous configuration restored.','Undone');render();}
          break;
        case 'reset':hints=0;assisted=false;edit(()=>{state=copy(level.initial);});message('The starting configuration is restored.','Reset');break;
        case 'next':endDrag(true);if(levelIndex<2)mountLevel(levelIndex+1);else location.hash='maths/play';break;
        case 'hint':explain(true);break;
        case 'why':explain(false);break;
        case 'motion':saved.preferences={...saved.preferences,motion:!motion,sound};persist();motion=!mq.matches&&saved.preferences.motion!==false;if(!motion)stopPlayback();render(false);break;
        case 'sound':sound=!sound;saved.preferences={...saved.preferences,sound};persist();b.textContent=sound?'Sound on':'Sound off';b.setAttribute('aria-pressed',String(sound));if(sound)tone(true);break;
      }
    },{signal});
    root.addEventListener('input',e=>{const key=e.target.dataset.param;if(!key)return;preview ||= copy(state);g.set(state,key,Number(e.target.value),levelIndex);clearTrial();render(false);},{signal});
    root.addEventListener('change',e=>{const key=e.target.dataset.param;if(key){if(!preview){preview=copy(state);g.set(state,key,Number(e.target.value),levelIndex);}remember(preview);preview=null;message(g.evaluate(state,levelIndex).detail,'Preview updated');render(e.target.tagName==='SELECT');return;}
      if(e.target.dataset.probe!==undefined){pausePlayback();if(!trial){trial=captureTrial();trial.verified=false;}probe=Number(e.target.value);render(false);return;}
      if(e.target.dataset.rewind!==undefined)return;
    },{signal});
    stage.addEventListener('keydown',e=>{const target=e.target.closest('[data-action]');if(target&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopPropagation();edit(()=>g.act(state,target.dataset.action,levelIndex));}},{signal});
    const coords=e=>{const m=stage.getScreenCTM();if(!m)return null;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse());return [p.x,p.y];};
    stage.addEventListener('pointerdown',e=>{const h=e.target.closest('[data-handle]');if(!h||!g.drag||e.button>0||drag)return;e.preventDefault();pausePlayback();commitPreview();preview=copy(state);drag={id:h.dataset.handle,pointer:e.pointerId};stage.querySelectorAll('.fi-selected').forEach(el=>el.classList.remove('fi-selected'));h.classList.add('fi-selected');try{stage.setPointerCapture(e.pointerId);}catch{}message(`${h.querySelector('text')?.textContent||h.dataset.handle} selected · ${g.evaluate(state,levelIndex).metric}`,'Handle selected');},{signal});
    stage.addEventListener('pointermove',e=>{if(!drag||drag.pointer!==e.pointerId)return;const p=coords(e);if(p){g.drag(state,drag.id,p,levelIndex);clearTrial();render(false);}},{signal});
    stage.addEventListener('pointerup',e=>{if(drag&&drag.pointer===e.pointerId)endDrag();},{signal});
    stage.addEventListener('pointercancel',e=>{if(drag&&drag.pointer===e.pointerId)endDrag(true);},{signal});
    stage.addEventListener('lostpointercapture',e=>{if(drag&&drag.pointer===e.pointerId)endDrag(true);},{signal});
    document.addEventListener('keydown',e=>{if(e.metaKey||e.ctrlKey||e.altKey||$('.fi-dialog').open||e.target.closest('input,select,textarea,button,a,[contenteditable]')||e.target.isContentEditable)return;
      if(e.key==='Enter'){e.preventDefault();run();}
      else if(e.key.toLowerCase()==='z')$('[data-host="undo"]').click();
      else if(e.key===' '&&document.activeElement===stage){e.preventDefault();playing?pausePlayback():resumePlayback();render(false);}
      else if(e.key==='Escape')location.hash='maths/play';},{signal});
    window.addEventListener('blur',()=>{endDrag(true);pausePlayback();},{signal});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){endDrag(true);pausePlayback();audio?.suspend();}},{signal});
    window.addEventListener('resize',()=>sizeHits(),{signal});
    const motionPref=()=>{const was=motion;motion=!mq.matches&&saved.preferences.motion!==false;if(!motion)stopPlayback();if(motion!==was)render(false);};
    mq.addEventListener('change',motionPref,{signal});
    const actions=$('.fi-console-actions'),ro=new ResizeObserver(()=>{root.style.setProperty('--fi-console-h',(actions.offsetHeight+22)+'px');});
    ro.observe(actions);
    $('#fi-level-count').textContent=`CHAMBER 0${levelIndex+1} / 03`;$('#fi-level-title').textContent=level.name;$('#fi-objective').textContent=level.brief;render();
    if(legacyNotice){persist();message('Earlier Contour history retained in local backup; new per-update session starts fresh.','Save notice');}
    session={dispose(){if(disposed)return;disposed=true;stopPlayback();clearTimeout(pulseTimer);if(drag)endDrag(true);if(preview)state=preview;save();exitedGame=g.id;ro.disconnect();abort.abort();audio?.close();root.classList.remove('fi-pulsing');}};
  }
  return {register,page,wire,helpers,get games(){return games;},get lastGame(){return lastGame;}};
})();
