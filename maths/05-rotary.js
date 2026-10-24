/* 05 · Rotary positions. Flat: the RoPE path on a torus. Abstract: ride the
   rail yourself, with earlier words strung behind you like lamps. */
Maths.scene({
  id:'rotary',no:'05',tag:'Position',short:'Rotary positions',mode:'3d',
  title:'Position as rotation.',
  body:['Attention on its own has no sense of word order. Rotary position embeddings (RoPE) add it by rotating pairs of dimensions in each query and key by an angle proportional to the token’s position, each pair at its own frequency.',
        'Two pairs means two angles, so the combined state lives on a torus; the dots mark whole token positions. Because queries and keys are rotated the same way, their dot product depends only on how far apart the tokens are.'],
  why:'Attention on its own treats a sentence as a bag of words: “dog bites man” and “man bites dog” would look identical. Position information restores the order. Because RoPE encodes the distance between words rather than where they sit, its frequencies can be stretched after training, which is one of the main ways models are extended to longer contexts than they were trained on.',
  llm:{where:'Inside every attention head, just before the dot products are scored, the query and key vectors are rotated by RoPE — by an angle proportional to the token’s position, each coordinate pair at its own frequency. Llama, Mistral and most open models use it.',
       role:'It gives attention a sense of word order without storing positions anywhere. And because it encodes distance rather than absolute place, stretching the frequencies is the standard trick for extending a trained model’s context window.'},
  formula:'(x₁, x₂) → R(p·ωᵢ)(x₁, x₂)  ·  ⟨R(mω)q, R(nω)k⟩ = ⟨q, R((n−m)ω)k⟩',
  caption:'Drag to rotate',
  abstractCaption:'↑ ↓ or W S: next or previous word · R: ride or stop · B: look back · ← → or drag: look around',
  label:'A wire-frame torus with the path traced by a rotary position embedding.',
  abstractLabel:'A first-person ride through the inside of a torus, along a rail wound around the tunnel wall, with lamps marking earlier word positions.',
  dream:{title:'You are a word on its way to its place.',text:[
    'You are a word, and your place in the sentence is not written anywhere on you. It is how far you have been turned.',
    'Around you runs a curved tunnel, the inside of a doughnut, with a rail wound around its wall. Two wheels carry you along it: a fast one that spins you round the tunnel and a slow one that carries you down it.',
    'Each step you take is one word further into the sentence. Every word before you rode the same rail and stopped where it belongs: look back and you will see them strung down the tunnel like lamps. You never need to know your own number, only how many lamps lie between you and the word you are listening to.']},
  controls:({slider,button,buttons})=>`${slider('rope-pos','Token position p',0,120,.1,30,'Your place in the sentence')}${slider('rope-ratio','Slow / fast frequency',.02,1,.01,.08,'Gear ratio: slow wheel ÷ fast wheel')}
    ${buttons(button('rope-play','Play','Ride on'))}
    <div class="ab-only">${buttons(button('rope-prev','↓ Previous word'),button('rope-next','↑ Next word'),button('rope-back','Look back',undefined,'aria-pressed="false"'))}</div>`,
  init(k){
    const {$,clamp,lerp,stroke,dot,arrow,label,camera,depthLine,persp,pline,pdot,V}=k;
    const R=1.45,r=.58,w1=.5,view={yaw:-.55,pitch:.78},look={yaw:0,pitch:0};
    let back=false,goal=0,last=0;
    const T=(u,v)=>[(R+r*Math.cos(v))*Math.cos(u),r*Math.sin(v),(R+r*Math.cos(v))*Math.sin(u)];
    const s=k.stage(paint,paintAbstract);
    const pos=()=>Number($('rope-pos').value),ratio=()=>Number($('rope-ratio').value);

    function paint(s){
      const {ctx,h}=s,P=camera(s,view,.2),p=pos(),g=ratio();
      for(let j=0;j<18;j++){const v=j/18*Math.PI*2,pts=[];for(let i=0;i<=72;i++)pts.push(P(...T(i/72*Math.PI*2,v)));depthLine(ctx,pts,.22,.6);}
      for(let j=0;j<40;j++){const u=j/40*Math.PI*2,pts=[];for(let i=0;i<=36;i++)pts.push(P(...T(u,i/36*Math.PI*2)));depthLine(ctx,pts,.22,.6);}
      const path=[];
      for(let t=0;t<=p;t+=.05)path.push(P(...T(t*w1*g,t*w1)));
      path.push(P(...T(p*w1*g,p*w1)));
      stroke(ctx,path,.9,1.2);
      for(let n=0;n<=p;n++){const q=P(...T(n*w1*g,n*w1));dot(ctx,q[0],q[1],1.6,.75);}
      const cur=P(...T(p*w1*g,p*w1));
      dot(ctx,cur[0],cur[1],5,1);
      [[p*w1,'pair 1 · fast'],[p*w1*g,'pair 2 · slow']].forEach(([a,name],i)=>{
        const cx=60+i*130,cy=h-58,c=[];
        for(let n=0;n<=48;n++){const t=n/48*Math.PI*2;c.push([cx+24*Math.cos(t),cy+24*Math.sin(t)]);}
        stroke(ctx,c,.45);
        arrow(ctx,cx,cy,cx+22*Math.cos(-a),cy+22*Math.sin(-a),.95,1.3);
        label(ctx,name,cx,cy+38,.65,'center');
      });
    }

    // Position on the torus at token position p, the direction of travel along the rail, and the surface normal.
    function frame(p){
      const g=ratio(),u=p*w1*g,v=p*w1,cu=Math.cos(u),su=Math.sin(u),cv=Math.cos(v),sv=Math.sin(v);
      const du=[-(R+r*cv)*su,0,(R+r*cv)*cu],dv=[-r*sv*cu,r*cv,-r*sv*su];
      return {pt:T(u,v),tan:V.norm(V.add(V.mul(du,w1*g),V.mul(dv,w1))),nrm:[cv*cu,sv,cv*su]};
    }
    const above=(p,h)=>{const f=frame(p);return V.add(f.pt,V.mul(f.nrm,h));};
    // Inside the tube: the rail is wound around the tunnel wall and you ride it with your head towards the core.
    // The fast wheel spins you round the tunnel; the slow wheel carries you along it.
    function paintAbstract(s){
      const {ctx}=s,p=pos(),u=p*w1*ratio(),here=frame(p);
      // Near the tunnel centre, looking into the bend so only the local tube
      // is drawn — the far side of the torus stays out of view.
      const sign=back?-1:1,U0=V.mul(here.nrm,-1);
      const eye=V.add(here.pt,V.mul(U0,r*.82));
      const target=[R*Math.cos(u+sign*.4),0,R*Math.sin(u+sign*.4)];
      const F0=V.norm(V.sub(target,eye)),side=V.norm(V.cross(U0,F0)),U=V.cross(F0,side);
      const F=V.add(V.add(V.mul(F0,Math.cos(look.yaw)*Math.cos(look.pitch)),V.mul(side,Math.sin(look.yaw)*Math.cos(look.pitch))),V.mul(U,Math.sin(look.pitch)));
      const P=persp(s,eye,F,U,1.35),ac=k.world.accent,se=k.world.secondary;
      // Longitudinal ribs, only around the local stretch of tunnel.
      for(let j=0;j<24;j++){
        const v=j/24*Math.PI*2,c=[];
        for(let i=0;i<=108;i++)c.push(T(u-1.35+2.7*i/108,v));
        k.tint(ctx,j%2?se:ac,()=>pline(ctx,P,c,.6,.9,4));
      }
      // Hoops around the tube; every fourth is a lit rib with a broad faint pass.
      for(let j=-24;j<=24;j++){
        const a=u+j*.055,c=[];
        for(let i=0;i<=48;i++)c.push(T(a,i/48*Math.PI*2));
        const strong=j%4===0;
        k.tint(ctx,j%2?ac:se,()=>{
          if(strong)pline(ctx,P,c,.08,5,4);
          pline(ctx,P,c,strong?.9:.6,strong?1.4:.9,4);
        });
      }
      // Translucent wall facets between nearby hoop pairs.
      for(let jj=-20;jj<=20;jj+=2){
        const a=u+jj*.055;
        for(let seg=0;seg<12;seg++){
          const v0=seg*Math.PI/6,v1=v0+Math.PI/6;
          k.surface(ctx,P,[T(a,v0),T(a+.11,v0),T(a+.11,v1),T(a,v1)],seg%2?ac:se,.045);
        }
      }
      const done=[],ahead=[];
      for(let t=0;t<=120;t+=.05)(t<=p?done:ahead).push(above(t,-.015));
      done.push(above(p,-.015));ahead.unshift(above(p,-.015));
      pline(ctx,P,ahead,.55,1.3,4);
      k.tint(ctx,ac,()=>pline(ctx,P,done,.95,1.6,6));
      // Packets of light riding the rail behind and ahead of you.
      for(let i=0;i<3;i++){
        const t=(s.time*7+i*40)%120;
        k.beacon(ctx,P,above(t,-.015),i===0?se:ac,.06,.9);
      }
      for(let n=0;n<=Math.min(120,Math.floor(p+1e-6));n++){
        const q=above(n,-.04);
        k.beacon(ctx,P,q,se,.05,.5);
        const pp=pdot(ctx,P,q,.028,1,false,6);
        if(pp&&pp[2]<2.2)label(ctx,String(n),pp[0],pp[1]-14,.85*Math.exp(-pp[2]/6),'center');
      }
      // Two phase dials under the title: the fast pair and the slow pair.
      if(s.w>760){
        const dials=[[p*w1,'fast',ac],[p*w1*ratio(),'slow',se]];
        dials.forEach(([a,name,col],i)=>{
          const cx2=48+i*74,cy2=176,r2=17;
          ctx.globalAlpha=.5;ctx.strokeStyle=col;ctx.lineWidth=.8;
          ctx.beginPath();ctx.arc(cx2,cy2,r2,0,Math.PI*2);ctx.stroke();
          ctx.globalAlpha=.95;ctx.beginPath();ctx.moveTo(cx2,cy2);
          ctx.lineTo(cx2+Math.cos(-a)*r2*.8,cy2+Math.sin(-a)*r2*.8);ctx.stroke();
          ctx.globalAlpha=1;
          label(ctx,name,cx2,cy2+r2+10,.7,'center');
        });
      }
    }

    function update(){
      const p=pos(),g=ratio(),turns=a=>(a/(2*Math.PI)).toFixed(2),n=Math.floor(p+1e-6),onWord=p-n<.01;
      $('rope-pos-out').value=p.toFixed(1);
      $('rope-ratio-out').value=g.toFixed(2);
      k.setText($('rope-play'),play.playing?'Pause':'Play',play.playing?'Stop':'Ride on');
      k.readout(s.abstract
        ?`${onWord?`you are word ${n}`:`you are between words ${n} and ${n+1}`} · the fast wheel has turned you ${turns(p*w1)} times, the slow wheel ${turns(p*w1*g)} · ${onWord?n:n+1} lamps lie behind you${back?' · you are looking back':''}`
        :`position ${p.toFixed(1)} · pair 1 has turned ${turns(p*w1)} times · pair 2 has turned ${turns(p*w1*g)} times`);
      s.draw();
    }

    const play=k.player(s,now=>{
      const dt=last?Math.min(.1,(now-last)/1000):0;last=now;
      let p=pos()+dt*6;if(p>120)p=0;
      $('rope-pos').value=p;update();return true;
    });
    const glide=k.player(s,()=>{
      const next=lerp(pos(),goal,.16),done=Math.abs(next-goal)<.01;
      $('rope-pos').value=done?goal:next;update();
      return !done;
    });
    function ride(){
      if(play.playing){play.stop();update();return;}
      glide.stop();
      if(k.reduced()){let p=pos()+6;if(p>120)p=0;$('rope-pos').value=p;update();return;}
      last=0;play.start();update();
    }
    // One word at a time: glide to the next or previous whole position.
    function hop(d){
      const base=glide.playing?goal:pos();
      play.stop();
      goal=clamp(d>0?Math.floor(base+1e-6)+1:Math.ceil(base-1e-6)-1,0,120);
      if(k.reduced()){$('rope-pos').value=goal;update();return;}
      glide.start();update();
    }
    function lookBack(){back=!back;$('rope-back').setAttribute('aria-pressed',String(back));update();}

    k.on($('rope-play'),'click',ride);
    k.on($('rope-next'),'click',()=>hop(1));
    k.on($('rope-prev'),'click',()=>hop(-1));
    k.on($('rope-back'),'click',lookBack);
    ['rope-pos','rope-ratio'].forEach(id=>k.on($(id),'input',()=>{if(id==='rope-pos'){play.stop();glide.stop();}update();}));
    k.orbit(s,view);
    k.look(s,look);
    update();

    return {
      onMode(on){
        if(!on&&back)lookBack();
        look.yaw=0;look.pitch=0;update();
      },
      resetView(){glide.stop();if(back)lookBack();look.yaw=0;look.pitch=0;s.camera=null;s.draw();},
      onKey(key){
        if(key==='ArrowUp'||key==='w'){hop(1);return true;}
        if(key==='ArrowDown'||key==='s'){hop(-1);return true;}
        if(key==='r'){ride();return true;}
        if(key==='b'){lookBack();return true;}
        if(key==='ArrowLeft'||key==='a'){look.yaw-=.25;s.draw();return true;}
        if(key==='ArrowRight'||key==='d'){look.yaw+=.25;s.draw();return true;}
        return false;
      }
    };
  }
});
