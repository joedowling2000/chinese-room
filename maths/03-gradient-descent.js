/* 03 · Gradient descent — teaching prototype. Flat: a ball on a wire-mesh
   loss surface. First-person: stand on the surface feeling only the slope.
   Every update comes from LearningModels.descentStep; the teaching panel
   distinguishes settings changes, previews and applied training updates. */
Maths.scene({
  id:'gradient-descent',no:'03',tag:'Learning',short:'Gradient descent',mode:'3d',learn:true,
  title:'Roll downhill, one step at a time.',
  body:['Training is a search for weights that make the loss small. The gradient points uphill, so each step moves a little the other way.',
        'The learning rate sets the stride. Too small and progress crawls; too large and the ball overshoots and flies off. Momentum carries speed from step to step, which can roll it through small dips. A real model does this in billions of dimensions, not two.'],
  llm:{where:'This is training, not inference — the loop that updates the model’s parameters using gradients computed on batches of tokens.',
       role:'Training combines a loss objective, batches of tokens and an optimiser that uses gradients to update parameters. Momentum and adaptive per-parameter rates affect those updates; a finite step can increase the loss.'},
  sources:[{label:'Loshchilov and Hutter, Decoupled Weight Decay Regularization',href:'https://arxiv.org/abs/1711.05101'}],
  formula:'θ ← θ − η ∇L(θ)  ·  momentum: v ← μv − η∇L, θ ← θ + v',
  caption:'Drag: rotate camera · click surface: choose starting parameters',
  abstractCaption:'↑ or W: apply one training step · N: new starting point · ← → or drag: look around · use Preview to inspect before applying',
  label:'A wire-mesh loss surface with a ball descending it.',
  abstractLabel:'A first-person view across a foggy loss landscape, with an arrow at your feet pointing downhill.',
  dream:{title:'What the scene represents',text:[
    'Your position represents two trainable parameters. Ground height represents loss. The arrow points opposite the local gradient; the learning rate and momentum determine the update.']},
  controls:({slider,button,buttons})=>`${slider('gd-lr','Learning rate η',.02,1.6,.01,.15,'Learning rate η: the scale of each update')}${slider('gd-mu','Momentum μ',0,.95,.01,0,'Momentum μ: how much of the last update carries into the next')}
    ${buttons(button('gd-preview','Preview next step'),button('gd-step','Apply training step','Take a training step'),button('gd-new','New start','Choose a new starting point'))}
    <p class="learn-note">Scene height uses a fixed offset of the raw surface loss. This does not change the gradient or loss difference.</p>
    <div class="gd-plot" id="gd-plot" aria-label="Loss history plot"></div>
    <details class="lab-data"><summary>Loss history as text</summary><div class="article-table-wrap"><table class="learn-table"><thead><tr><th scope="col">Step</th><th scope="col">Raw surface loss</th></tr></thead><tbody id="gd-plot-rows"></tbody></table></div></details>`,
  init(k){
    const {$,clamp,stroke,dot,arrow,label,camera,depthLine,persp,pline,pdot,heading,turn}=k;
    const f=LearningModels.loss,grad=LearningModels.gradient;
    const L=2.6,N=30,view={yaw:-.55,pitch:.62},look={yaw:0,pitch:-.42};
    let lo=Infinity,hi=-Infinity;
    for(let i=0;i<=200;i++)for(let j=0;j<=200;j++){const v=f(-L+i*L/100,-L+j*L/100);lo=Math.min(lo,v);hi=Math.max(hi,v);}
    const mid=(lo+hi)/2,H=1.6/(hi-lo),Y=(x,z)=>-(f(x,z)-mid)*H,ground=(x,z)=>(f(x,z)-lo)*H;
    const starts=[[2.1,-1.9],[-2.2,1.8],[1.5,2.1],[-.9,-2.2],[2.3,1.2]];
    const st={point:[...starts[0]],velocity:[0,0],lr:.15,mu:0,steps:0,status:'ready',startIndex:0,trail:[[...starts[0]]]};
    let ghost=null,proposed=null,pending=null;
    const pair=v=>LearningModels.pair(v);
    function faceDownhill(){const [gx,gz]=grad(...st.point);if(Math.hypot(gx,gz)>1e-6)look.yaw=Math.atan2(-gx,-gz);}
    faceDownhill();
    const s=k.stage(paint,paintAbstract);

    const snapshot=()=>({point:[...st.point],velocity:[...st.velocity],lr:st.lr,mu:st.mu,steps:st.steps,status:st.status,startIndex:st.startIndex,trail:st.trail.map(t=>[...t])});
    function applyState(snap){
      pending=null;proposed=null;cancelSettings();
      Object.assign(st,{point:[...snap.point],velocity:[...snap.velocity],lr:snap.lr,mu:snap.mu,steps:snap.steps,status:snap.status,startIndex:snap.startIndex,trail:snap.trail.map(t=>[...t])});
      syncSliders();update();
    }
    function syncSliders(){$('gd-lr').value=st.lr;$('gd-mu').value=st.mu;}

    // One shared computed step: preview and apply must never diverge.
    function nextResult(){
      if(!pending)pending=LearningModels.descentStep({point:[...st.point],velocity:[...st.velocity],lr:st.lr,mu:st.mu,steps:st.steps});
      return pending;
    }

    const sec=document.getElementById('maths-gradient-descent');
    const teach=Experiences.createTeaching(sec.querySelector('.maths-learning'),{
      id:'gradient-descent',signal:k.signal,
      snapshot,
      describe(cur,res){
        return [['Parameters',pair(cur.point),pair(res.point)],
                ['Raw surface loss',f(...cur.point).toFixed(4),f(...res.point).toFixed(4)],
                ['Velocity',pair(cur.velocity),pair(res.velocity)],
                ['Step',String(cur.steps),String(res.steps)],
                ['Learning rate / momentum',`${cur.lr.toFixed(2)} · ${cur.mu.toFixed(2)}`,`${res.lr.toFixed(2)} · ${res.mu.toFixed(2)}`]];
      },
      restore:applyState,
      reset(){
        pending=null;proposed=null;ghost=null;
        Object.assign(st,{point:[...starts[0]],velocity:[0,0],lr:.15,mu:0,steps:0,status:'ready',startIndex:0,trail:[[...starts[0]]]});
        syncSliders();update();
      },
      resetCamera(){
        view.yaw=-.55;view.pitch=.62;
        faceDownhill();look.pitch=-.42;s.camera=null;s.draw();
      },
      settle:settleSettings,
      cancel(){cancelSettings();},
      onCompare(g){ghost=g?{point:[...g.point]}:null;teach.notice(g?'The hollow marker shows the before position.':'');s.draw();},
      onGuided(on){Maths.setGuided(sec,on);}
    });

    function applyStep(label){
      settleSettings();
      if(st.status!=='ready'&&st.status!=='running'){teach.notice('This descent has ended; choose a new start or reset the experiment to continue.');return false;}
      const before=snapshot(),r=nextResult();
      teach.begin(label||'Apply training step');
      st.point=[...r.next.point];st.velocity=[...r.next.velocity];st.steps=r.next.steps;st.status=r.next.status;
      st.trail.push([...st.point]);
      if(Math.hypot(...st.velocity)>1e-6)look.yaw+=turn(look.yaw,Math.atan2(st.velocity[0],st.velocity[1]))*.5;
      pending=null;proposed=null;
      update();
      teach.commit(LearningModels.descentFeedback(before,r,false));
      return r.next.status==='running';
    }

    function previewStep(){
      settleSettings();
      if(st.status!=='ready'&&st.status!=='running'){teach.notice('This descent has ended; choose a new start or reset the experiment to preview another update.');return;}
      const r=nextResult();
      proposed=r;
      teach.preview(LearningModels.descentFeedback(snapshot(),r,true));
      teach.notice('Preview only: no parameters have changed yet. The dashed marker shows the proposed point.');
      s.draw();
    }

    function chooseStart(x,z,label,newIdx){
      settleSettings();
      const before=snapshot();
      teach.begin(label||'Choose starting parameters');
      if(newIdx!==undefined)st.startIndex=newIdx;
      st.point=[x,z];st.velocity=[0,0];st.steps=0;st.status='ready';st.trail=[[x,z]];
      pending=null;proposed=null;
      faceDownhill();update();
      teach.commit({summary:`Starting parameters set to ${pair(st.point)}; the optimiser state was cleared.`,explanation:'Choosing a start is setup, not training. No update was applied.',rows:[['Parameters',pair(before.point),pair(st.point)],['Step',String(before.steps),String(st.steps)],['Learning rate / momentum',`${before.lr} · ${before.mu}`,`${st.lr} · ${st.mu}`]]});
    }

    function paint(s){
      const {ctx}=s,P=camera(s,view,.165);
      for(let i=0;i<=N;i++){
        const a=-L+i*2*L/N,r1=[],r2=[];
        for(let j=0;j<=60;j++){const b=-L+j*2*L/60;r1.push(P(a,Y(a,b),b));r2.push(P(b,Y(b,a),a));}
        depthLine(ctx,r1,.5);depthLine(ctx,r2,.5);
      }
      const path=st.trail.map(([x,z])=>P(x,Y(x,z)-.015,z));
      stroke(ctx,path,.95,1.4);
      path.forEach(p=>dot(ctx,p[0],p[1],1.5,.7));
      if(ghost){const g=P(ghost.point[0],Y(...ghost.point)-.02,ghost.point[1]);dot(ctx,g[0],g[1],6,.7,true);label(ctx,'before',g[0]+9,g[1]+10,.6);}
      if(proposed){
        const b=P(st.point[0],Y(...st.point)-.02,st.point[1]),c=P(proposed.candidate[0],Y(...proposed.candidate)-.02,proposed.candidate[1]);
        ctx.setLineDash([4,4]);k.arrow(ctx,b[0],b[1],c[0],c[1],.8,1.4);ctx.setLineDash([]);
        dot(ctx,c[0],c[1],5,.8,true);label(ctx,'proposed',c[0]+9,c[1]-8,.6);
      }
      const b=P(st.point[0],Y(...st.point)-.04,st.point[1]);
      dot(ctx,b[0],b[1],5.5,1);
    }
    function paintAbstract(s){
      const {ctx}=s,feet=[st.point[0],ground(...st.point),st.point[1]],ac=k.world.accent,se=k.world.secondary;
      const P=persp(s,[feet[0],feet[1]+.24,feet[2]],heading(look.yaw,look.pitch),[0,1,0],1.25);
      const rows=[];
      for(let i=0;i<26;i++){
        const z0=-L+i*2*L/26,z1=z0+2*L/26,d=Math.abs((z0+z1)/2-st.point[1]);
        rows.push([d,z0,z1]);
      }
      rows.sort((a,b)=>b[0]-a[0]);
      for(const [,z0,z1] of rows){
        const g=(ground(st.point[0],z0)+ground(st.point[0],z1))/2;
        for(let j=0;j<13;j++){
          const x0=-L+j*2*L/13,x1=x0+2*L/13;
          k.surface(ctx,P,[[x0,ground(x0,z0),z0],[x1,ground(x1,z0),z0],[x1,ground(x1,z1),z1],[x0,ground(x0,z1),z1]],g<.55?ac:se,.05);
        }
      }
      for(let i=0;i<=44;i++){
        const a=-L+i*2*L/44,r1=[],r2=[];
        for(let j=0;j<=88;j++){const b=-L+j*2*L/88;r1.push([a,ground(a,b),b]);r2.push([b,ground(b,a),a]);}
        k.tint(ctx,se,()=>{pline(ctx,P,r1,.5,.7,3.5);pline(ctx,P,r2,.5,.7,3.5);});
      }
      for(let ix=0;ix<8;ix++)for(let iz=0;iz<8;iz++){
        const sx=-L+.4+ix*(2*L-.8)/7,sz=-L+.4+iz*(2*L-.8)/7,[gx,gz]=grad(sx,sz),g=Math.hypot(gx,gz);
        if(g<.05)continue;
        const ux=-gx/g,uz=-gz/g,len=.22,t=((s.time*.5)+ix*.13+iz*.29)%1;
        k.tint(ctx,ac,()=>pline(ctx,P,[[sx,ground(sx,sz)+.012,sz],[sx+ux*len,ground(sx+ux*len,sz+uz*len)+.012,sz+uz*len]],.5,.8,4));
        const px=sx+ux*len*t,pz=sz+uz*len*t;
        k.beacon(ctx,P,[px,ground(px,pz)+.02,pz],ac,.035,.7);
      }
      const path=st.trail.slice(-80).map(([x,z])=>[x,ground(x,z)+.006,z]);
      k.tint(ctx,se,()=>pline(ctx,P,path,.95,1.8,6));
      path.forEach((q,i)=>{if(i%4===0)k.beacon(ctx,P,q,se,.03,.8);});
      if(ghost)k.beacon(ctx,P,[ghost.point[0],ground(...ghost.point)+.03,ghost.point[1]],se,.14,.6);
      if(proposed){
        const on=(x,z)=>[x,ground(x,z)+.015,z];
        ctx.setLineDash([4,4]);pline(ctx,P,[on(...st.point),on(...proposed.candidate)],.9,1.4,1e9);ctx.setLineDash([]);
        k.beacon(ctx,P,on(...proposed.candidate),ac,.1,.7);
      }
      const [gx,gz]=grad(...st.point),g=Math.hypot(gx,gz);
      if(g>1e-4){
        const len=clamp(.25+g*.5,.25,.7),ux=-gx/g,uz=-gz/g,on=(x,z)=>[x,ground(x,z)+.01,z],shaft=[];
        for(let n=0;n<=12;n++)shaft.push(on(st.point[0]+ux*len*n/12,st.point[1]+uz*len*n/12));
        const bx=st.point[0]+ux*len*.78,bz=st.point[1]+uz*len*.78,w=len*.14;
        k.tint(ctx,ac,()=>{
          pline(ctx,P,shaft,1,2,1e9);
          pline(ctx,P,[on(bx-uz*w,bz+ux*w),shaft[12],on(bx+uz*w,bz-ux*w)],1,2,1e9);
        });
        const t=(s.time*.8)%1;
        k.beacon(ctx,P,on(st.point[0]+ux*len*t,st.point[1]+uz*len*t),ac,.05,.9);
      }
    }

    function renderPlot(){
      const el=$('gd-plot'),rowsEl=$('gd-plot-rows');
      if(!el)return;
      const losses=st.trail.map(p=>f(...p)),W=280,Hh=72,pad=6;
      const mn=Math.min(...losses),mx=Math.max(...losses),span=Math.max(1e-9,mx-mn);
      const x=i=>pad+i*(W-2*pad)/Math.max(1,st.trail.length-1),y=v=>pad+(mx-v)/span*(Hh-2*pad);
      const pts=losses.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
      el.innerHTML=`<svg viewBox="0 0 ${W} ${Hh+16}" role="img" aria-label="Raw surface loss by step"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="1.4"/><line x1="${pad}" y1="${Hh-2}" x2="${W-pad}" y2="${Hh-2}" stroke="currentColor" stroke-width=".5" opacity=".5"/><text x="${pad}" y="${Hh+11}" font-size="8" fill="currentColor">Step →</text><text x="${W-pad}" y="10" font-size="8" fill="currentColor" text-anchor="end">Raw surface loss ↑</text><circle cx="${x(losses.length-1)}" cy="${y(losses[losses.length-1])}" r="2.4" fill="currentColor"/></svg>`;
      rowsEl.innerHTML=st.trail.map((p,i)=>`<tr><th scope="row">${i===0?'start':'step '+(st.steps-(st.trail.length-1)+i)}</th><td>${losses[i].toFixed(4)}</td></tr>`).join('');
    }

    function update(){
      $('gd-lr-out').value=st.lr.toFixed(2);
      $('gd-mu-out').value=st.mu.toFixed(2);
      const loss=Math.max(0,f(...st.point)-lo),[gx,gz]=grad(...st.point);
      const text={ready:'Ready; preview or apply a step',running:'Stepping; apply another update or preview',settled:'Small gradient; descent stopped',diverged:'Left the plotted domain; try a smaller learning rate',stopped:'Step limit reached'}[st.status];
      k.readout(`Step ${st.steps} · scene loss ${loss.toFixed(3)} · raw surface loss ${f(...st.point).toFixed(4)} · gradient magnitude ${Math.hypot(gx,gz).toFixed(3)} · ${text}`);
      renderPlot();
      s.draw();
    }

    /* Slider changes are settings actions: they record old/new values but no
       parameter update. While a pointer or key holds the slider the record
       stays open; an unheld input commits after 200ms idle. */
    let setBase=null,setIdle=0,setPtr=false,setKey=false,setField='lr',setName='Learning rate';
    function settingCommit(){
      if(!setBase)return;
      const before=setBase,field=setField,name=setName;setBase=null;
      teach.commit({summary:`${name} changed; parameters are unchanged. The next update uses this setting.`,
        explanation:'Parameters change only when you apply a training update.',
        rows:[[name,field==='lr'?before.lr.toFixed(2):before.mu.toFixed(2),field==='lr'?st.lr.toFixed(2):st.mu.toFixed(2)],
              ['Parameters',pair(before.point),pair(st.point)],
              ['Step',String(before.steps),String(st.steps)]]});
    }
    function settingSoon(){clearTimeout(setIdle);setIdle=setTimeout(()=>{setPtr||setKey?settingSoon():settingCommit();},200);}
    function settleSettings(){clearTimeout(setIdle);setIdle=0;setPtr=false;setKey=false;settingCommit();}
    function cancelSettings(){clearTimeout(setIdle);setIdle=0;setBase=null;setPtr=false;setKey=false;}
    ['gd-lr','gd-mu'].forEach(id=>{
      const el=$(id),field=id==='gd-lr'?'lr':'mu',name=field==='lr'?'Learning rate':'Momentum';
      k.on(el,'pointerdown',()=>{setPtr=true;});
      ['pointerup','pointercancel','lostpointercapture'].forEach(t=>k.on(el,t,()=>{setPtr=false;clearTimeout(setIdle);settingCommit();}));
      k.on(el,'keydown',()=>{setKey=true;});
      k.on(el,'keyup',()=>{setKey=false;clearTimeout(setIdle);settingCommit();});
      k.on(el,'input',()=>{
        if(!setBase){setBase=snapshot();setField=field;setName=name;teach.begin('Change '+name.toLowerCase(),'setting');}
        st[field]=Number(el.value);pending=null;proposed=null;
        update();
        if(!setPtr&&!setKey)settingSoon();
      });
      k.on(el,'change',()=>{if(!setPtr&&!setKey){clearTimeout(setIdle);settingCommit();}});
      k.on(el,'blur',()=>{setPtr=false;setKey=false;clearTimeout(setIdle);settingCommit();});
    });
    k.signal.addEventListener('abort',cancelSettings,{once:true});

    /* Camera notice: an orbit drag on the flat canvas moves only the view. */
    let camDrag=false,camMoved=false;
    const cv=s.canvas;
    k.on(cv,'pointerdown',()=>{if(!s.abstract){camDrag=true;camMoved=false;}});
    k.on(cv,'pointermove',()=>{if(camDrag)camMoved=true;});
    ['pointerup','pointercancel','lostpointercapture'].forEach(t=>k.on(cv,t,()=>{
      if(camDrag&&camMoved&&!s.abstract)teach.notice('Camera rotated; parameters and loss are unchanged.');
      camDrag=false;camMoved=false;
    }));

    k.orbit(s,view,(px,py)=>{
      const P=camera(s,view,.165);let best=null,bd=Infinity;
      for(let i=0;i<=60;i++)for(let j=0;j<=60;j++){
        const x=-L+i*L/30,z=-L+j*L/30,[sx,sy]=P(x,Y(x,z),z),d=Math.hypot(sx-px,sy-py);
        if(d<bd){bd=d;best=[x,z];}
      }
      if(bd<40)chooseStart(...best,'Choose starting parameters');
    });
    k.on($('gd-preview'),'click',previewStep);
    k.on($('gd-step'),'click',()=>applyStep());
    k.on($('gd-new'),'click',()=>{const ni=(st.startIndex+1)%starts.length;chooseStart(...starts[ni],'Choose a new starting point',ni);});
    k.look(s,look);
    syncSliders();update();

    return {
      teaching:teach,
      repeatKeys:false,
      onMode(on){if(on&&st.status==='ready')faceDownhill();update();},
      resetView(){view.yaw=-.55;view.pitch=.62;faceDownhill();look.pitch=-.42;s.camera=null;s.draw();},
      onLesson(){},
      applyLesson(i){
        settleSettings();
        if(i===0)previewStep();
        else if(i===1){
          const before=snapshot();
          teach.begin('Add momentum','setting');
          st.mu=.7;syncSliders();pending=null;proposed=null;update();
          teach.commit({summary:'Momentum set to 0.70; parameters are unchanged. The next update uses this setting.',
            explanation:'Momentum combines part of the previous update with the next gradient step. Nothing was applied yet.',
            rows:[['Momentum',before.mu.toFixed(2),st.mu.toFixed(2)],['Parameters',pair(before.point),pair(st.point)],['Step',String(before.steps),String(st.steps)]]});
        }
        else if(i===2){
          const before=snapshot();
          teach.begin('Load overshoot example','setup');
          applyState({point:[-0.9332152662979467,-0.4992343106497743],velocity:[-1.4481552637927455,0.47141191031765994],lr:1.5,mu:.7,steps:2,status:'running',startIndex:0,trail:[[-0.9332152662979467,-0.4992343106497743]]});
          teach.commit({summary:'Prepared state after two updates; accumulated momentum can overshoot. Preview, then apply the next step.',
            explanation:'This is a prepared synthetic example. The loaded velocity means the next update may increase the loss.',
            rows:[['Parameters',pair(before.point),pair(st.point)],['Step',String(before.steps),String(st.steps)],['Learning rate / momentum',`${before.lr} · ${before.mu}`,`${st.lr} · ${st.mu}`]]});
        }
      },
      onDeactivate(){settleSettings();},
      onPause(){settleSettings();},
      onKey(key){
        if(key==='ArrowUp'||key==='w'){applyStep();return true;}
        if(key==='n'){const ni=(st.startIndex+1)%starts.length;chooseStart(...starts[ni],'Choose a new starting point',ni);return true;}
        if(key==='ArrowLeft'||key==='a'){look.yaw-=.25;s.draw();teach.notice('Camera rotated; parameters and loss are unchanged.');return true;}
        if(key==='ArrowRight'||key==='d'){look.yaw+=.25;s.draw();teach.notice('Camera rotated; parameters and loss are unchanged.');return true;}
        return false;
      }
    };
  }
});
