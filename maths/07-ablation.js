/* 07 · Removing a direction. Flat: two clusters and the plane at right angles
   to r̂. Abstract: be one activation; r̂ is up, and ablation forgets height. */
Maths.scene({
  id:'ablation',no:'07',tag:'Interpretability',short:'Removing a direction',mode:'3d',
  title:'Delete one direction.',
  body:['Some behaviours seem to be written along a single direction in a model’s activations. Projecting that direction out of every activation removes the component along it and leaves everything at right angles untouched.',
        'This is the core move in abliteration. Here, two clusters differ along one direction r̂; ablating it collapses both onto the same plane. <a class="text-link" href="#article/abliteration">Read the abliteration note ↗</a>'],
  why:'If a behaviour such as refusing a request is carried by one direction, it can be measured, steered or switched off with a single line of linear algebra and no retraining. That makes this a powerful way to understand models, and also a warning: safety behaviour learned this way can be surprisingly easy to remove.',
  formula:'x′ = x − α (x·r̂) r̂',
  caption:'Drag to rotate',
  abstractCaption:'↑ ↓ or W S: drift · ← → or A D: turn · R F: rise or fall · X: forget or remember height · drag: look around',
  label:'Two clusters of points separated along one direction, and the plane at right angles to it.',
  abstractLabel:'A first-person view from inside a cloud of activations, with the removed direction as up and down.',
  dream:{title:'You are an activation.',text:[
    'You are an activation: one point in the cloud of thoughts a model has about a request it is going to refuse.',
    'Around you drift hundreds like you. Far below hangs a second cloud, the thoughts about requests it simply answers, and the direction that tells the two apart runs straight through you. You feel it as up and down.',
    'Each step you take moves you through the cloud, but ablation never pushes anyone sideways. It simply forgets height. As it takes hold, sky and ground are pressed together, and when it is complete everything you can see, you included, lies flat along a single horizon. Try to rise: there is no up any more.']},
  controls:({slider,button,buttons,swap})=>`${slider('abl-alpha','Ablation strength α',0,1,.01,0,'How much height is forgotten α')}<label class="maths-check"><input type="checkbox" id="abl-plane" checked> ${swap('Show the plane','Show the plane you will be pressed onto')}</label>${buttons(button('abl-run','Ablate','Forget height'))}
    <div class="ab-only">${buttons(button('abl-left','↺ Turn left'),button('abl-fwd','↑ Drift forward'),button('abl-back','↓ Drift back'),button('abl-right','Turn right ↻'),button('abl-rise','Rise'),button('abl-fall','Fall'))}</div>`,
  init(k){
    const {$,clamp,lerp,ease,stroke,dot,arrow,label,camera,persp,pline,pdot,V}=k;
    const d=V.norm([.408,.597,.691]),u=V.norm([-d[1],d[0],0]),v=V.cross(d,u);
    const view={yaw:-.55,pitch:.65},look={yaw:0,pitch:-1.05};
    const at=(a,b,c=0)=>V.add(V.add(V.mul(u,a),V.mul(v,b)),V.mul(d,c));
    const r=k.rng(23),pts=[];
    for(const side of [-1,1])for(let i=0;i<220;i++)pts.push({p:at(k.gauss(r)*.42,k.gauss(r)*.3,side*1.05+k.gauss(r)*.3),side});
    const mean=side=>{const g=pts.filter(q=>q.side===side);return g.reduce((a,q)=>a+V.dot(q.p,d),0)/g.length;};
    const gap0=mean(1)-mean(-1);
    // You are the activation nearest the middle of the upper cloud.
    const upper=pts.filter(q=>q.side===1),centre=upper.reduce((a,q)=>V.add(a,V.mul(q.p,1/upper.length)),[0,0,0]);
    const far=q=>{const e=V.sub(q.p,centre);return V.dot(e,e);};
    const self=upper.reduce((b,q)=>far(q)<far(b)?q:b);
    let me=[...self.p],note='';
    const s=k.stage(paint,paintAbstract);
    const A=()=>Number($('abl-alpha').value);
    const press=q=>V.sub(q,V.mul(d,A()*V.dot(q,d)));

    function paint(s){
      const {ctx}=s,P=camera(s,view,.2),a=A();
      if($('abl-plane').checked)for(let i=0;i<=12;i++){
        const t=-1.3+i*2.6/12;
        stroke(ctx,[P(...at(t,-1.3)),P(...at(t,1.3))],.17,.6);stroke(ctx,[P(...at(-1.3,t)),P(...at(1.3,t))],.17,.6);
      }
      if(a>0)pts.forEach((q,i)=>{if(i%5===0)stroke(ctx,[P(...q.p),P(...press(q.p))],.18*a,.5);});
      pts.forEach(q=>{const [x,y]=P(...press(q.p));q.side<0?dot(ctx,x,y,1.5,.75):dot(ctx,x,y,1.9,.8,true);});
      const e0=P(...V.mul(d,-2.3)),e1=P(...V.mul(d,2.3));
      arrow(ctx,e0[0],e0[1],e1[0],e1[1],.9,1.2);
      label(ctx,'r̂',e1[0]+10,e1[1]-10,.9);
    }
    // Up is r̂ itself. The plane at right angles to it is the floor everyone is pressed onto.
    function paintAbstract(s){
      const {ctx}=s,level=V.add(V.mul(u,Math.cos(look.yaw)),V.mul(v,Math.sin(look.yaw))),a=A(),ac=k.world.accent,se=k.world.secondary;
      const P=persp(s,press(me),V.add(V.mul(level,Math.cos(look.pitch)),V.mul(d,Math.sin(look.pitch))),d,1.3);
      if($('abl-plane').checked){
        for(let i=-3;i<3;i++)for(let j=-3;j<3;j++){
          const t0=i*.65,t1=t0+.65,b0=j*.65,b1=b0+.65;
          k.surface(ctx,P,[at(t0,b0),at(t1,b0),at(t1,b1),at(t0,b1)],se,.045);
        }
        for(let i=-12;i<=12;i++){
          const t=i/2,l1=[],l2=[];
          for(let j=-24;j<=24;j++){l1.push(at(t,j/4));l2.push(at(j/4,t));}
          k.tint(ctx,se,()=>{pline(ctx,P,l1,.3,.7,5);pline(ctx,P,l2,.3,.7,5);});
        }
      }
      const axis=[];for(let n=-40;n<=40;n++)axis.push(V.mul(d,n/8));
      k.tint(ctx,ac,()=>pline(ctx,P,axis,.9,1.4,14));
      const tip=P(...V.mul(d,4.6));if(tip)label(ctx,'r̂',tip[0]+10,tip[1],.9);
      k.beacon(ctx,P,V.mul(d,2.2),ac,.1,.8);
      const shadow=V.sub(me,V.mul(d,V.dot(me,d))),ring=[];
      for(let n=0;n<=48;n++){const t=n/48*Math.PI*2;ring.push(V.add(shadow,V.add(V.mul(u,.18*Math.cos(t)),V.mul(v,.18*Math.sin(t)))));}
      pline(ctx,P,ring,.8,1.2,1e9);
      // Projection filaments: where each point is being pressed to.
      if(a>0)pts.forEach((q,i)=>{if(i%10===0)k.tint(ctx,q.side<0?se:ac,()=>pline(ctx,P,[q.p,press(q.p)],.35*a,.6,8));});
      // Illustrative ellipsoidal envelopes for both clouds; every vertex goes
      // through press(), so they flatten honestly as α rises.
      for(const side of[-1,1])for(let mer=0;mer<8;mer++){
        const ph=mer*Math.PI/4,curve=[];
        for(let j=0;j<=64;j++){const t=j/64*2*Math.PI;
          curve.push(press(at(.7*Math.cos(t)*Math.cos(ph),.5*Math.cos(t)*Math.sin(ph),side*1.05+.42*Math.sin(t))));}
        k.tint(ctx,side<0?se:ac,()=>pline(ctx,P,curve,.3,1,6));
      }
      // The clouds, depth sorted far to near; hollow lights above, solid below.
      const proj=pts.map(q=>({q,p:P(...press(q.p))})).filter(o=>o.p).sort((m,n)=>n.p[2]-m.p[2]);
      let near=0;
      for(const {q,p} of proj){
        if(q===self)continue;
        ctx.mathsInk=q.side>0?ac:se;
        dot(ctx,p[0],p[1],clamp((q.side<0?.022:.028)*P.f/p[2],.7,10),.9*Math.exp(-p[2]/5),q.side>0);
        if(near<10&&p[2]<3){k.beacon(ctx,P,press(q.p),q.side>0?ac:se,.05,.6);near++;}
      }
      ctx.mathsInk=null;
    }

    function update(){
      const a=A(),h=V.dot(me,d);
      $('abl-alpha-out').value=a.toFixed(2);
      k.setText($('abl-run'),a>=.999?'Restore':'Ablate',a>=.999?'Remember height':'Forget height');
      k.readout(s.abstract
        ?`α = ${a.toFixed(2)} · your height above the plane: ${((1-a)*h).toFixed(2)} (it was ${h.toFixed(2)}) · the clouds are ${((1-a)*gap0).toFixed(2)} apart along r̂${note?' · '+note:''}`
        :`α = ${a.toFixed(2)} · gap between the clusters along r̂: ${((1-a)*gap0).toFixed(2)} (was ${gap0.toFixed(2)})`);
      s.draw();
    }

    let t0=0,start=0,goal=1;
    const run=k.player(s,now=>{const t=Math.min(1,(now-t0)/1400);$('abl-alpha').value=lerp(start,goal,ease(t));update();return t<1;});
    function toggle(){
      start=A();goal=start>=.999?0:1;note='';
      if(k.reduced()){$('abl-alpha').value=goal;update();return;}
      t0=performance.now();run.start();
    }
    const within=p=>{const n=Math.hypot(...p);return n>5?V.mul(p,5/n):p;};
    function drift(dist){me=within(V.add(me,V.mul(V.add(V.mul(u,Math.cos(look.yaw)),V.mul(v,Math.sin(look.yaw))),dist)));note='';update();}
    function rise(dist){me=within(V.add(me,V.mul(d,dist)));note=A()>=.999?'you try to move, but there is no up or down any more':'';update();}
    const turnBy=a=>{look.yaw+=a;s.draw();};

    k.on($('abl-run'),'click',toggle);
    k.on($('abl-alpha'),'input',()=>{run.stop();update();});
    k.on($('abl-plane'),'change',()=>s.draw());
    [['abl-fwd',()=>drift(.25)],['abl-back',()=>drift(-.25)],['abl-left',()=>turnBy(-.25)],['abl-right',()=>turnBy(.25)],['abl-rise',()=>rise(.2)],['abl-fall',()=>rise(-.2)]]
      .forEach(([id,fn])=>k.on($(id),'click',fn));
    k.orbit(s,view);
    k.look(s,look,{min:-1.3,max:1.3});
    update();

    return {
      onMode:update,
      resetView(){me=[...self.p];look.yaw=0;look.pitch=-1.05;note='';s.camera=null;update();},
      onKey(key){
        const acts={ArrowUp:()=>drift(.25),w:()=>drift(.25),ArrowDown:()=>drift(-.25),s:()=>drift(-.25),
          ArrowLeft:()=>turnBy(-.2),a:()=>turnBy(-.2),ArrowRight:()=>turnBy(.2),d:()=>turnBy(.2),
          r:()=>rise(.2),f:()=>rise(-.2),x:toggle};
        if(!acts[key])return false;
        acts[key]();return true;
      }
    };
  }
});
