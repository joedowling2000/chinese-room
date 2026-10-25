/* 03 · Gradient descent. Flat: a ball on a wire-mesh loss surface. Abstract:
   be the ball, in fog, feeling only the slope under your feet. */
Maths.scene({
  id:'gradient-descent',no:'03',tag:'Learning',short:'Gradient descent',mode:'3d',
  title:'Roll downhill, one step at a time.',
  body:['Training is a search for weights that make the loss small. The gradient points uphill, so each step moves a little the other way.',
        'The learning rate sets the stride. Too small and progress crawls; too large and the ball overshoots and flies off. Momentum carries speed from step to step, which can roll it through small dips. A real model does this in billions of dimensions, not two.'],
  why:'Every weight in an LLM starts out as a random number. Gradient descent, repeated over trillions of words, is what turns that noise into a model that can write. Without it, the network would stay exactly as random as the day it was made. Choose the learning rate badly and training crawls or blows up, which is why labs warm it up and then decay it on a careful schedule.',
  llm:{where:'This is training, not inference — the loop that placed every weight in the model. A loss measured over billions of words, gradients found by backpropagation, and billions of small downhill steps like the one you are taking.',
       role:'Nothing else teaches the model. Everything else on this page is architecture — the fixed landscape; descent is what carved every weight in it. Real optimisers add momentum and adaptive rates, but the step is the same.'},
  formula:'θ ← θ − η ∇L(θ)  ·  momentum: v ← μv − η∇L, θ ← θ + v',
  caption:'Drag to rotate · click the surface to drop the ball',
  abstractCaption:'↑ or W: one step · R: walk or stop · N: wake somewhere else · ← → or drag: look around',
  label:'A wire-mesh loss surface with a ball descending it.',
  abstractLabel:'A first-person view across a foggy loss landscape, with an arrow at your feet pointing downhill.',
  dream:{title:'You are the weights.',text:[
    'You are a model’s weights, standing somewhere on a landscape made of your own mistakes. The height of the ground is the loss: high where you are wrong, low where you are right.',
    'Around you a fog has come down. You cannot see the valley floor, only feel the slope under your feet: the arrow at your toes.',
    'Each step you take is downhill. The learning rate is the length of your stride, and momentum is how much of your last step you carry into the next. Somewhere below, a hollow is waiting. Whether it is the deepest one, you will never know.']},
  controls:({slider,button,buttons})=>`${slider('gd-lr','Learning rate η',.02,1.6,.01,.15,'Stride length η')}${slider('gd-mu','Momentum μ',0,.95,.01,0,'Momentum μ: how much of your last step you keep')}
    ${buttons(button('gd-run','Run','Walk downhill'),button('gd-step','Step','Take one step'),button('gd-new','New start','Wake somewhere else'))}`,
  init(k){
    const {$,clamp,stroke,dot,camera,depthLine,persp,pline,pdot,heading,turn}=k;
    const f=(x,z)=>.14*(x*x+z*z)+.32*Math.sin(1.6*x+.4)*Math.cos(1.3*z-.3)+.08*x;
    const grad=(x,z)=>[.28*x+.512*Math.cos(1.6*x+.4)*Math.cos(1.3*z-.3)+.08,.28*z-.416*Math.sin(1.6*x+.4)*Math.sin(1.3*z-.3)];
    const L=2.6,N=30,view={yaw:-.55,pitch:.62},look={yaw:0,pitch:-.42};
    let lo=Infinity,hi=-Infinity;
    for(let i=0;i<=200;i++)for(let j=0;j<=200;j++){const v=f(-L+i*L/100,-L+j*L/100);lo=Math.min(lo,v);hi=Math.max(hi,v);}
    const mid=(lo+hi)/2,H=1.6/(hi-lo),Y=(x,z)=>-(f(x,z)-mid)*H,ground=(x,z)=>(f(x,z)-lo)*H;
    const starts=[[2.1,-1.9],[-2.2,1.8],[1.5,2.1],[-.9,-2.2],[2.3,1.2]];
    let si=0,ball,vel,trail,steps,status,last=0;
    function faceDownhill(){const [gx,gz]=grad(...ball);if(Math.hypot(gx,gz)>1e-6)look.yaw=Math.atan2(-gx,-gz);}
    function reset(x,z){ball=[x,z];vel=[0,0];trail=[[x,z]];steps=0;status='ready';faceDownhill();}
    reset(...starts[0]);
    const s=k.stage(paint,paintAbstract);

    function step(){
      const lr=Number($('gd-lr').value),mu=Number($('gd-mu').value),[gx,gz]=grad(...ball);
      vel=[mu*vel[0]-lr*gx,mu*vel[1]-lr*gz];
      ball=[ball[0]+vel[0],ball[1]+vel[1]];steps++;
      // In the first person you turn to face the way you are moving.
      if(Math.hypot(...vel)>1e-6)look.yaw+=turn(look.yaw,Math.atan2(vel[0],vel[1]))*.5;
      if(!(Math.abs(ball[0])<=L&&Math.abs(ball[1])<=L)){ball=[clamp(ball[0],-L,L),clamp(ball[1],-L,L)];trail.push([...ball]);status='diverged';return false;}
      trail.push([...ball]);
      const [hx,hz]=grad(...ball);
      if(Math.hypot(hx,hz)<2e-3&&Math.hypot(...vel)<2e-3){status='settled';return false;}
      if(steps>=500){status='stopped';return false;}
      status='running';return true;
    }
    const run=k.player(s,now=>{if(now-last<40)return true;last=now;const go=step();update();return go;});
    run.onend=update;

    function paint(s){
      const {ctx}=s,P=camera(s,view,.165);
      for(let i=0;i<=N;i++){
        const a=-L+i*2*L/N,r1=[],r2=[];
        for(let j=0;j<=60;j++){const b=-L+j*2*L/60;r1.push(P(a,Y(a,b),b));r2.push(P(b,Y(b,a),a));}
        depthLine(ctx,r1,.5);depthLine(ctx,r2,.5);
      }
      const path=trail.map(([x,z])=>P(x,Y(x,z)-.015,z));
      stroke(ctx,path,.95,1.4);
      path.forEach(p=>dot(ctx,p[0],p[1],1.5,.7));
      const b=P(ball[0],Y(...ball)-.04,ball[1]);
      dot(ctx,b[0],b[1],5.5,1);
    }
    function paintAbstract(s){
      const {ctx}=s,feet=[ball[0],ground(...ball),ball[1]],ac=k.world.accent,se=k.world.secondary;
      const P=persp(s,[feet[0],feet[1]+.24,feet[2]],heading(look.yaw,look.pitch),[0,1,0],1.25);
      // Translucent terrain strips, warm in the hollows, cool on the heights,
      // painted far to near so the valley reads as ground rather than fog.
      const rows=[];
      for(let i=0;i<26;i++){
        const z0=-L+i*2*L/26,z1=z0+2*L/26,d=Math.abs((z0+z1)/2-ball[1]);
        rows.push([d,z0,z1]);
      }
      rows.sort((a,b)=>b[0]-a[0]);
      for(const [,z0,z1] of rows){
        const g=(ground(ball[0],z0)+ground(ball[0],z1))/2;
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
      // A local direction field: short downhill shafts at sampled sites, each
      // with a packet running along it. They only report the local slope.
      for(let ix=0;ix<8;ix++)for(let iz=0;iz<8;iz++){
        const sx=-L+.4+ix*(2*L-.8)/7,sz=-L+.4+iz*(2*L-.8)/7,[gx,gz]=grad(sx,sz),g=Math.hypot(gx,gz);
        if(g<.05)continue;
        const ux=-gx/g,uz=-gz/g,len=.22,t=((s.time*.5)+ix*.13+iz*.29)%1;
        k.tint(ctx,ac,()=>pline(ctx,P,[[sx,ground(sx,sz)+.012,sz],[sx+ux*len,ground(sx+ux*len,sz+uz*len)+.012,sz+uz*len]],.5,.8,4));
        const px=sx+ux*len*t,pz=sz+uz*len*t;
        k.beacon(ctx,P,[px,ground(px,pz)+.02,pz],ac,.035,.7);
      }
      // The light trail: every step you have already taken.
      const path=trail.slice(-80).map(([x,z])=>[x,ground(x,z)+.006,z]);
      k.tint(ctx,se,()=>pline(ctx,P,path,.95,1.8,6));
      path.forEach((q,i)=>{if(i%4===0)k.beacon(ctx,P,q,se,.03,.8);});
      // The only thing you can sense: an arrow at your feet pointing downhill, longer where it is steeper.
      const [gx,gz]=grad(...ball),g=Math.hypot(gx,gz);
      if(g>1e-4){
        const len=clamp(.25+g*.5,.25,.7),ux=-gx/g,uz=-gz/g,on=(x,z)=>[x,ground(x,z)+.01,z],shaft=[];
        for(let n=0;n<=12;n++)shaft.push(on(ball[0]+ux*len*n/12,ball[1]+uz*len*n/12));
        const bx=ball[0]+ux*len*.78,bz=ball[1]+uz*len*.78,w=len*.14;
        k.tint(ctx,ac,()=>{
          pline(ctx,P,shaft,1,2,1e9);
          pline(ctx,P,[on(bx-uz*w,bz+ux*w),shaft[12],on(bx+uz*w,bz-ux*w)],1,2,1e9);
        });
        const t=(s.time*.8)%1;
        k.beacon(ctx,P,on(ball[0]+ux*len*t,ball[1]+uz*len*t),ac,.05,.9);
      }
    }

    function update(){
      $('gd-lr-out').value=Number($('gd-lr').value).toFixed(2);
      $('gd-mu-out').value=Number($('gd-mu').value).toFixed(2);
      k.setText($('gd-run'),run.playing?'Pause':'Run',run.playing?'Stop':'Walk downhill');
      const loss=Math.max(0,f(...ball)-lo),global=loss<.02,[gx,gz]=grad(...ball);
      if(s.abstract){
        k.challenge({loss,slope:Math.hypot(gx,gz),steps});
        const text={ready:'you are standing still; take a step',running:'walking downhill',
          settled:global?'the ground is flat in every direction. This is the deepest hollow on the map, though you cannot know that':'the ground is flat in every direction, but this is not the lowest point. Try more momentum, or wake somewhere else',
          diverged:'your stride was too long: you leapt clean off the edge of the map',stopped:'still walking after 500 steps; lengthen your stride'}[status];
        k.readout(`${steps} steps taken · the ground here is ${loss.toFixed(3)} high · slope under your feet ${Math.hypot(gx,gz).toFixed(3)} · ${text}`);
      }else{
        const text={ready:'click the surface or press Run',running:'descending',
          settled:global?'settled in the global minimum':'stuck in a local minimum · try momentum or another start',
          diverged:'diverged · the learning rate is too large',stopped:'still moving after 500 steps · try a larger learning rate'}[status];
        k.readout(`step ${steps} · loss ${loss.toFixed(3)} · ${text}`);
      }
      s.draw();
    }

    function toggleRun(){
      if(run.playing){run.stop();update();return;}
      if(status!=='ready'&&status!=='running')reset(...trail[0]);
      if(k.reduced()){let n=0;while(step()&&++n<600);update();return;}
      run.start();update();
    }
    function once(){
      run.stop();
      if(status!=='ready'&&status!=='running')reset(...trail[0]);
      step();
      update();
    }
    function wake(){run.stop();si=(si+1)%starts.length;reset(...starts[si]);update();}

    k.orbit(s,view,(px,py)=>{
      const P=camera(s,view,.165);let best=null,bd=Infinity;
      for(let i=0;i<=60;i++)for(let j=0;j<=60;j++){
        const x=-L+i*L/30,z=-L+j*L/30,[sx,sy]=P(x,Y(x,z),z),d=Math.hypot(sx-px,sy-py);
        if(d<bd){bd=d;best=[x,z];}
      }
      if(bd<40){run.stop();reset(...best);update();}
    });
    k.on($('gd-run'),'click',toggleRun);
    k.on($('gd-step'),'click',once);
    k.on($('gd-new'),'click',wake);
    ['gd-lr','gd-mu'].forEach(id=>k.on($(id),'input',update));
    k.look(s,look);
    update();

    return {
      onMode(on){if(on&&status==='ready')faceDownhill();update();},
      resetView(){faceDownhill();look.pitch=-.42;s.camera=null;s.draw();},
      onKey(key){
        if(key==='ArrowUp'||key==='w'){once();return true;}
        if(key==='r'){toggleRun();return true;}
        if(key==='n'){wake();return true;}
        if(key==='ArrowLeft'||key==='a'){look.yaw-=.25;s.draw();return true;}
        if(key==='ArrowRight'||key==='d'){look.yaw+=.25;s.draw();return true;}
        return false;
      }
    };
  }
});
