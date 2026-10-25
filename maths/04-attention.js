/* 04 · Attention — teaching prototype. Flat: drag a query among eight keys.
   First-person: two labelled modes — Aim query (turns change the query) and
   Look around (turns only move the camera). All feedback comes from
   maths/learning-models.js; values equal keys in this synthetic example. */
Maths.scene({
  id:'attention',no:'04',tag:'Attention',short:'Attention',mode:'2d',learn:true,
  title:'Every token asks a question.',
  body:['In attention, each token emits a query — a learned projection used to score keys — and every token offers a key. Their dot product scores how well they match, and softmax turns the scores into weights that add up to one. The output is the weighted average of the values; here the values are the keys themselves.',
        'The temperature control divides the scores before softmax. Standard scaled dot-product attention divides by √dₖ, where dₖ is the key width; this adjustable example is not the sampling-temperature setting used to select an output token.'],
  llm:{where:'This is the attention block — the mechanism that lets a token gather context from the tokens before it. A transformer runs many of these heads in parallel per layer, each with its own learned query, key and value matrices.',
       role:'It is how “it” finds its noun. Processing a whole prompt scores every token pair, so the pair count grows quadratically with sequence length; generating one additional token attends over the cached context.'},
  formula:'wᵢ = softmax(q·kᵢ / τ)  ·  output = Σ wᵢ vᵢ',
  caption:'Drag the query arrow',
  abstractCaption:'Aim query: drag or turn to change the query · Look around: drag or turn moves only the camera',
  label:'A query vector with attention arcs to eight token keys.',
  abstractLabel:'A first-person view from the centre of a ring of words, with threads that brighten towards the words you attend to.',
  dream:{title:'What the scene represents',text:[
    'The surrounding markers represent keys. Turning changes the query direction; leaning changes its length. Brighter connections receive more weight. The floor marker shows the weighted sum of values, which equal the keys in this example.']},
  controls:({slider,button,buttons})=>`${slider('att-temp','Score temperature τ',.1,3,.05,1,'Score temperature τ: divides the scores before softmax')}
    <p class="learn-slot-heading" id="att-mode-label">You are changing: query direction and length</p>
    <div class="ab-only">${buttons(button('att-aim','Aim query',undefined,'aria-pressed="true"'),button('att-look','Look around',undefined,'aria-pressed="false"'))}</div>
    <div class="ab-only">${buttons(button('att-left','↺ Turn query left'),button('att-in','Increase query length'),button('att-out','Decrease query length'),button('att-right','Turn query right ↻'))}</div>
    <label class="maths-slider" for="att-key"><span>Inspect a key (selection only)</span><select id="att-key" class="maths-select"></select></label>
    <div class="maths-bars" id="att-bars" aria-label="Attention weights"></div>
    <details class="lab-data"><summary>Score table</summary><div class="article-table-wrap"><table class="learn-table" id="att-table"><thead><tr><th scope="col">Key</th><th scope="col">Raw dot product</th><th scope="col">Scaled score</th><th scope="col">Weight %</th><th scope="col">Value contribution</th></tr></thead><tbody id="att-table-rows"></tbody></table></div></details>`,
  init(k){
    const {$,clamp,lerp,stroke,dot,arrow,label,persp,pline,pdot,heading,V}=k;
    const keys=[['the',165,1.5],['cat',40,1.7],['sat',290,1.5],['on',240,1.15],['mat',350,1.6],['rule',112,1.7],['book',200,1.85],['room',72,1.35]]
      .map(([t,deg,r])=>({t,x:r*Math.cos(deg*Math.PI/180),y:r*Math.sin(deg*Math.PI/180)}));
    const KEYV=keys.map(kk=>[kk.x,kk.y]),names=keys.map(kk=>kk.t);
    const exp={query:[1.2,.9],temperature:1};
    let calc=LearningModels.attention(exp.query,exp.temperature,KEYV);
    let mode='aim',selKey=-1,ghost=null;
    const look={yaw:Math.atan2(exp.query[0],exp.query[1]),pitch:-.12};
    const s=k.stage(paint,paintAbstract);
    const unit=()=>Math.min(s.w,s.h)/5;
    const lean=()=>Math.hypot(exp.query[0],exp.query[1]);
    const pair=v=>LearningModels.pair(v);

    function paint({ctx,w,h}){
      const u=unit(),cx=w/2,cy=h/2,S=(x,y)=>[cx+x*u,cy-y*u];
      for(const r of [1,2]){const c=[];for(let i=0;i<=96;i++){const t=i/96*Math.PI*2;c.push(S(r*Math.cos(t),r*Math.sin(t)));}stroke(ctx,c,.1);}
      stroke(ctx,[[0,cy],[w,cy]],.1);stroke(ctx,[[cx,0],[cx,h]],.1);
      const Q=S(...exp.query);
      keys.forEach((kk,i)=>{
        const K=S(kk.x,kk.y),wt=calc.weights[i],mx=(Q[0]+K[0])/2,my=(Q[1]+K[1])/2,dx=K[0]-Q[0],dy=K[1]-Q[1];
        ctx.beginPath();ctx.moveTo(Q[0],Q[1]);ctx.quadraticCurveTo(mx-dy*.25,my+dx*.25,K[0],K[1]);
        ctx.globalAlpha=.08+.85*wt;ctx.lineWidth=.5+2.6*wt;ctx.strokeStyle=k.INK;ctx.stroke();ctx.globalAlpha=1;
        dot(ctx,K[0],K[1],3.2,.95);
        if(i===selKey){ctx.beginPath();ctx.arc(K[0],K[1],10,0,Math.PI*2);ctx.globalAlpha=.9;ctx.lineWidth=1.4;ctx.strokeStyle=k.INK;ctx.stroke();ctx.globalAlpha=1;}
        const n=Math.hypot(kk.x,kk.y);
        label(ctx,kk.t,K[0]+kk.x/n*16,K[1]-kk.y/n*14,.85,kk.x<-.2?'right':kk.x>.2?'left':'center');
      });
      const O=S(...calc.output),Z=S(0,0);
      ctx.setLineDash([3,4]);stroke(ctx,[Z,O],.55);ctx.setLineDash([]);
      dot(ctx,O[0],O[1],6,.95,true);label(ctx,'output',O[0]+10,O[1]+12,.7);
      arrow(ctx,Z[0],Z[1],Q[0],Q[1],1,1.8);dot(ctx,Q[0],Q[1],4.5,1);label(ctx,'q',Q[0]+10,Q[1]-12,.95);
      if(ghost){
        const G=S(...ghost.query),OG=S(...ghost.calc.output);
        ctx.setLineDash([4,4]);arrow(ctx,Z[0],Z[1],G[0],G[1],.5,1.2);ctx.setLineDash([]);
        dot(ctx,OG[0],OG[1],6,.5,true);label(ctx,'before',OG[0]+10,OG[1]-12,.5);
        label(ctx,'Dashed / hollow: before',cx,18,.55,'center');
      }
    }
    // You stand at the centre; the keys are lanterns on the floor, taller and
    // brighter the more you attend to them. Floor arcs show the weights.
    function paintAbstract(s){
      const {ctx}=s,S=2.4,eye=[0,.55,0],ac=k.world.accent,se=k.world.secondary;
      const P=persp(s,eye,heading(look.yaw,look.pitch),[0,1,0],1.3);
      for(const r of [1,2,3]){const c=[];for(let n=0;n<=120;n++){const t=n/120*Math.PI*2;c.push([r*S*Math.sin(t),0,r*S*Math.cos(t)]);}pline(ctx,P,c,.22,.7,12);}
      for(let n=0;n<16;n++){const t=n/16*Math.PI*2,sp=[];for(let m=1;m<=24;m++)sp.push([m/8*S*Math.sin(t),0,m/8*S*Math.cos(t)]);pline(ctx,P,sp,.12,.6,12);}
      const weights=calc.weights,top=calc.top;
      // Floor: one contiguous ring of arcs, each segment's extent its weight.
      let a0=-Math.PI/2;
      keys.forEach((kk,i)=>{
        const w=weights[i],a1=a0+w*Math.PI*2,arc=[];
        const segs=Math.max(2,Math.round(w*140));
        for(let n=0;n<=segs;n++){const t=a0+(a1-a0)*n/segs;arc.push([3.1*Math.sin(t),.005,3.1*Math.cos(t)]);}
        k.tint(ctx,i===top?se:ac,()=>pline(ctx,P,arc,.3+.7*w,1.5,1e9));
        for(let n=0;n<segs;n++)k.surface(ctx,P,[[0,.004,0],arc[n],arc[n+1]],i===top?se:ac,.05+.1*w);
        a0=a1;
      });
      const chest=V.add(eye,V.add(V.mul(heading(look.yaw),.3),[0,-.2,0]));
      keys.forEach((kk,i)=>{
        const w=weights[i],x=kk.x*S,z=kk.y*S,h=1+1.8*w,col=i===top?se:ac,rr=.15+.6*w;
        const colLine=[];for(let n=0;n<=8;n++)colLine.push([x,h*n/8,z]);
        k.tint(ctx,col,()=>pline(ctx,P,colLine,.4+.4*w,.8,14));
        // An open lantern: a horizontal square and a vertical diamond, floating
        // at the pylon's top. Its size is the attention weight.
        const sq=[];for(let n=0;n<=4;n++){const t=n/4*Math.PI*2+Math.PI/4;sq.push([x+rr*Math.cos(t),h,z+rr*Math.sin(t)]);}
        const dm=[[x,h+rr*1.3,z],[x+rr,h,z],[x,h-rr*1.3,z],[x-rr,h,z],[x,h+rr*1.3,z]];
        const halo=[];for(let n=0;n<=48;n++){const t=n/48*Math.PI*2;halo.push([x+rr*Math.cos(t),h,z+rr*Math.sin(t)]);}
        k.tint(ctx,col,()=>{pline(ctx,P,halo,.5+.5*w,1.2,14);pline(ctx,P,dm,.5+.5*w,1.2,14);});
        k.surface(ctx,P,[dm[0],dm[1],dm[4],dm[3]],col,.045);
        k.surface(ctx,P,[dm[1],dm[2],dm[3],dm[0]],col,.045);
        // The inspected key gets a brighter floor ring so the table row and the
        // pylon visibly refer to the same object.
        if(i===selKey){
          const ring=[];for(let n=0;n<=48;n++){const t=n/48*Math.PI*2;ring.push([x+(rr+.16)*Math.cos(t),.01,z+(rr+.16)*Math.sin(t)]);}
          pline(ctx,P,ring,.95,1.6,1e9);
        }
        // Fine threads from your chest to the key — up to three, weight-bright.
        const strandCount=1+Math.round(w*2);
        for(let st=0;st<strandCount;st++){
          const off=(st-(strandCount-1)/2)*.05,thread=[];
          for(let n=0;n<=24;n++){const t=n/24;thread.push([lerp(chest[0],x,t)+off*Math.sign(z||1),lerp(chest[1],h,t)+Math.sin(t*Math.PI)*.3,lerp(chest[2],z,t)-off*Math.sign(x||1)]);}
          k.tint(ctx,col,()=>pline(ctx,P,thread,.06+.85*w,.5+2*w,1e9));
        }
        const tp=(s.time*.22+i/8)%1;
        k.beacon(ctx,P,[lerp(chest[0],x,tp),lerp(chest[1],h,tp)+Math.sin(tp*Math.PI)*.3,lerp(chest[2],z,tp)],col,.05,.4+.6*w);
        // A vaulted rib from above your head out to the pylon — pure architecture.
        const vault=[];for(let n=0;n<=20;n++){const t=n/20;vault.push([lerp(0,x,t),lerp(2.7,h,t)+Math.sin(t*Math.PI)*.4,lerp(0,z,t)]);}
        pline(ctx,P,vault,.08,.6,16);
        const p=k.beacon(ctx,P,[x,h,z],col,.06+.05*w,.95);
        if(p)label(ctx,`${kk.t} · ${Math.round(w*100)}%`,p[0],p[1]-Math.max(14,rr*P.f/p[2])-8,.9,'center');
      });
      const o=[calc.output[0]*S,calc.output[1]*S],ring=[];
      for(let n=0;n<=48;n++){const t=n/48*Math.PI*2;ring.push([o[0]+.24*Math.sin(t),.01,o[1]+.24*Math.cos(t)]);}
      k.tint(ctx,ac,()=>pline(ctx,P,ring,1,1.5,1e9));
      k.beacon(ctx,P,[o[0],.03,o[1]],ac,.12,.95);
      const po=P(o[0],.01,o[1]);
      if(po)label(ctx,'weighted value sum',po[0],po[1]+18,.75,'center');
      if(ghost){
        const g=[ghost.calc.output[0]*S,ghost.calc.output[1]*S],gr=[];
        for(let n=0;n<=48;n++){const t=n/48*Math.PI*2;gr.push([g[0]+.3*Math.sin(t),.012,g[1]+.3*Math.cos(t)]);}
        ctx.setLineDash([3,4]);pline(ctx,P,gr,.55,1.2,1e9);ctx.setLineDash([]);
        // The previous query direction as a faint floor ray.
        const gq=ghost.query,gd=V.norm([gq[0],0,gq[1]]);
        ctx.setLineDash([3,4]);pline(ctx,P,[[0,.015,0],[gd[0]*3,.015,gd[2]*3]],.5,1.2,1e9);ctx.setLineDash([]);
      }
    }

    function update(){
      calc=LearningModels.attention(exp.query,exp.temperature,KEYV);
      const weights=calc.weights;
      $('att-temp').value=exp.temperature;
      $('att-temp-out').value=exp.temperature.toFixed(2);
      $('att-bars').innerHTML=keys.map((kk,i)=>`<div class="maths-bar${i===selKey?' is-selected':''}"><span>${kk.t}</span><i style="--w:${(weights[i]*100).toFixed(1)}%"></i><b>${Math.round(weights[i]*100)}%</b></div>`).join('');
      $('att-table-rows').innerHTML=keys.map((kk,i)=>`<tr${i===selKey?' class="is-selected"':''}><th scope="row">${kk.t}</th><td>${calc.scores[i].toFixed(3)}</td><td>${calc.scaled[i].toFixed(3)}</td><td>${(weights[i]*100).toFixed(1)}%</td><td>${pair(calc.contributions[i])}</td></tr>`).join('');
      const H=calc.entropy;
      k.readout(s.abstract
        ?`you are listening most to “${keys[calc.top].t}” (${Math.round(weights[calc.top]*100)}%) · it is as if you were listening to ${(2**H).toFixed(1)} of the 8 words · leaning in ${lean().toFixed(2)}`
        :`strongest match: “${keys[calc.top].t}” (${Math.round(weights[calc.top]*100)}%) · entropy ${H.toFixed(2)} of 3 bits`);
      s.draw();
    }

    /* ---------- Teaching controller ---------- */
    /* Gesture state: one immutable baseline per interaction. A pointer- or
       key-held control commits on release, never at a debounce pause; an
       unheld input commits after 200ms idle. */
    let baseCalc=null,pendingType='query',pendingAction='Change query';
    let idle=0,heldPtr=false,heldKey=false,dragging=false,camDrag=false,camMoved=false;
    const begin=(action,type)=>{if(!baseCalc){baseCalc=calc;pendingAction=action;pendingType=type||'query';teach.begin(action,'input');}};
    const commitNow=type=>{
      if(!baseCalc)return;
      const b=baseCalc;baseCalc=null;
      teach.commit(LearningModels.attentionFeedback(b,calc,names,type||pendingType));
    };
    const commitSoon=(ms=200)=>{
      clearTimeout(idle);
      idle=setTimeout(()=>{heldPtr||heldKey?commitSoon(60):commitNow();},ms);
    };
    const settle=()=>{clearTimeout(idle);idle=0;heldPtr=false;heldKey=false;commitNow();};
    const cancelGesture=()=>{clearTimeout(idle);idle=0;baseCalc=null;heldPtr=false;heldKey=false;dragging=false;camDrag=false;camMoved=false;};
    k.signal.addEventListener('abort',cancelGesture,{once:true});
    const flush=()=>{clearTimeout(idle);idle=0;commitNow();};

    const sec=document.getElementById('maths-attention');
    const teach=Experiences.createTeaching(sec.querySelector('.maths-learning'),{
      id:'attention',signal:k.signal,
      snapshot:()=>({query:[...exp.query],temperature:exp.temperature}),
      describe(cur,res){
        const a=LearningModels.attention(cur.query,cur.temperature,KEYV),b=LearningModels.attention(res.query,res.temperature,KEYV);
        return [['Query',pair(cur.query),pair(res.query)],
                ['Score temperature τ',cur.temperature.toFixed(2),res.temperature.toFixed(2)],
                ['Output vector',pair(a.output),pair(b.output)]];
      },
      restore(st){
        cancelGesture();
        exp.query=[...st.query];exp.temperature=st.temperature;
        look.yaw=Math.atan2(exp.query[0],exp.query[1]);
        update();
      },
      reset(){exp.query=[1.2,.9];exp.temperature=1;selKey=-1;$('att-key').value='-1';mode='aim';syncMode();update();},
      resetCamera(){look.yaw=Math.atan2(exp.query[0],exp.query[1]);look.pitch=-.12;s.camera=null;s.draw();},
      settle,cancel:cancelGesture,
      onCompare(g){
        ghost=g?{query:[...g.query],calc:LearningModels.attention(g.query,g.temperature,KEYV)}:null;
        teach.notice(g?'Dashed / hollow marks show the before state.':'');
        s.draw();
      },
      onGuided(on){Maths.setGuided(sec,on);}
    });

    function syncMode(){
      $('att-aim').setAttribute('aria-pressed',String(mode==='aim'));
      $('att-look').setAttribute('aria-pressed',String(mode==='look'));
      const label=$('att-mode-label');
      label.innerHTML=`<span class="flat-only">You are changing: query direction and length</span><span class="ab-only">You are changing: ${mode==='aim'?'query direction and length':'camera only (drag and turn)'}</span>`;
      $('att-left').textContent=mode==='aim'?'↺ Turn query left':'↺ Turn camera left';
      $('att-right').textContent=mode==='aim'?'Turn query right ↻':'Turn camera right ↻';
      if(mode==='look')teach.notice('Camera mode: turning and dragging move only the view. Query length buttons still change the query.');
      else teach.notice('');
    }
    function setQuery(q){exp.query=[clamp(q[0],-2.2,2.2),clamp(q[1],-2.2,2.2)];update();}
    function aimAt(yaw,len){look.yaw=yaw;setQuery([len*Math.sin(yaw),len*Math.cos(yaw)]);}
    // Changing length is a query edit in either mode; only Aim moves the camera.
    function setQueryLen(l){const a=Math.atan2(exp.query[0],exp.query[1]);setQuery([l*Math.sin(a),l*Math.cos(a)]);}
    function turnQuery(d){begin('Turn the query','query');aimAt(Math.atan2(exp.query[0],exp.query[1])+d,lean());commitSoon();}
    function leanBy(d){begin('Change query','query');setQueryLen(clamp(lean()+d,.2,2.2));commitSoon();}
    function turnView(d){look.yaw+=d;s.draw();teach.notice('Camera rotated; query, attention weights and output are unchanged.');}

    /* Canvas gestures: flat drag always edits the query (no camera orbit in
       2D); first-person drags are routed by the Aim/Look mode. */
    const c=s.canvas;
    const move=e=>{const r=c.getBoundingClientRect(),u=unit();let x=(e.clientX-r.left-s.w/2)/u,y=-(e.clientY-r.top-s.h/2)/u;const n=Math.hypot(x,y);if(n>2.2){x*=2.2/n;y*=2.2/n;}setQuery([x,y]);};
    k.on(c,'pointerdown',e=>{
      if(s.abstract){camDrag=true;camMoved=false;if(mode==='aim')begin('Change query','query');return;}
      dragging=true;begin('Change query','query');c.setPointerCapture(e.pointerId);move(e);
    });
    k.on(c,'pointermove',e=>{
      if(s.abstract){if(camDrag&&mode==='look')camMoved=true;return;}
      if(dragging)move(e);
    });
    const canvasEnd=()=>{
      if(s.abstract){
        if(camDrag&&mode==='look'&&camMoved)teach.notice('Camera rotated; query, attention weights and output are unchanged.');
        camDrag=false;camMoved=false;
        if(mode==='aim')flush();
        return;
      }
      if(dragging){dragging=false;flush();}
    };
    ['pointerup','pointercancel','lostpointercapture'].forEach(t=>k.on(c,t,canvasEnd));
    k.on(c,'keydown',e=>{
      if(s.abstract)return;
      const d={ArrowLeft:[-.1,0],ArrowRight:[.1,0],ArrowUp:[0,.1],ArrowDown:[0,-.1]}[e.key];
      if(!d)return;e.preventDefault();begin('Change query','query');setQuery([exp.query[0]+d[0],exp.query[1]+d[1]]);commitSoon();
    });

    /* The slider mutates canonical state on input, so the baseline is captured
       before the new value is applied. While a pointer or key holds the slider,
       feedback waits for release; otherwise a 200ms idle commits once. */
    const tp=$('att-temp');
    k.on(tp,'pointerdown',()=>{heldPtr=true;});
    k.on(tp,'pointerup',()=>{heldPtr=false;clearTimeout(idle);commitNow('temperature');});
    k.on(tp,'pointercancel',()=>{heldPtr=false;clearTimeout(idle);commitNow('temperature');});
    k.on(tp,'lostpointercapture',()=>{heldPtr=false;clearTimeout(idle);commitNow('temperature');});
    k.on(tp,'keydown',()=>{heldKey=true;});
    k.on(tp,'keyup',()=>{heldKey=false;clearTimeout(idle);commitNow('temperature');});
    k.on(tp,'input',()=>{
      begin('Change score temperature','temperature');
      exp.temperature=Number(tp.value);update();
      if(!heldPtr&&!heldKey)commitSoon();
    });
    k.on(tp,'change',()=>{if(!heldPtr&&!heldKey){clearTimeout(idle);commitNow('temperature');}});
    k.on(tp,'blur',()=>{heldPtr=false;heldKey=false;clearTimeout(idle);commitNow('temperature');});

    /* Mode buttons and named controls. Pending gestures finish first so every
       record describes exactly one action. */
    k.on($('att-aim'),'click',()=>{
      settle();
      mode='aim';look.yaw=Math.atan2(exp.query[0],exp.query[1]);s.camera=null;
      syncMode();teach.notice('Aim mode: the camera follows the query again.');update();
    });
    k.on($('att-look'),'click',()=>{settle();mode='look';syncMode();});
    k.on($('att-left'),'click',()=>{mode==='aim'?(begin('Turn the query','query'),aimAt(Math.atan2(exp.query[0],exp.query[1])-.2,lean()),commitNow('query')):turnView(-.2);});
    k.on($('att-right'),'click',()=>{mode==='aim'?(begin('Turn the query','query'),aimAt(Math.atan2(exp.query[0],exp.query[1])+.2,lean()),commitNow('query')):turnView(.2);});
    k.on($('att-in'),'click',()=>{begin('Change query','query');setQueryLen(clamp(lean()+.2,.2,2.2));commitNow('query');});
    k.on($('att-out'),'click',()=>{begin('Change query','query');setQueryLen(clamp(lean()-.2,.2,2.2));commitNow('query');});

    /* Key inspection is display-only: it never feeds back into the scores. */
    $('att-key').innerHTML='<option value="-1">No key selected</option>'+keys.map((kk,i)=>`<option value="${i}">${kk.t}</option>`).join('');
    k.on($('att-key'),'change',()=>{selKey=Number($('att-key').value);update();});

    look.onchange=()=>{if(mode==='aim'&&s.abstract)aimAt(look.yaw,lean());};
    k.look(s,look,{vertical:false});
    syncMode();update();

    return {
      teaching:teach,
      onMode(on){if(on&&mode==='aim')look.yaw=Math.atan2(exp.query[0],exp.query[1]);update();},
      resetView(){look.yaw=Math.atan2(exp.query[0],exp.query[1]);look.pitch=-.12;s.camera=null;s.draw();},
      onLesson(){/* prompts only; the scene never applies maths itself */},
      applyLesson(i){
        settle();
        if(i===0){begin('Turn the query','query');aimAt(Math.atan2(exp.query[0],exp.query[1])+.2,lean());commitNow('query');}
        else if(i===1){const before=calc;teach.begin('Lower score temperature','input');exp.temperature=.2;update();teach.commit(LearningModels.attentionFeedback(before,calc,names,'temperature'));}
        else if(i===2){const before=calc;teach.begin('Raise score temperature','input');exp.temperature=2.5;update();teach.commit(LearningModels.attentionFeedback(before,calc,names,'temperature'));}
      },
      onDeactivate(){settle();},
      onPause(){settle();},
      onKey(key){
        const turns={ArrowLeft:-.15,a:-.15,ArrowRight:.15,d:.15},leans={ArrowUp:.15,w:.15,ArrowDown:-.15,s:-.15};
        if(key in turns){mode==='aim'?turnQuery(turns[key]):turnView(turns[key]);return true;}
        if(key in leans){leanBy(leans[key]);return true;}
        return false;
      }
    };
  }
});
