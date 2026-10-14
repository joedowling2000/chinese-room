/* 04 · Attention. Flat: drag a query among eight keys. Abstract: stand in a
   ring of words; where you look is the question you ask. */
Maths.scene({
  id:'attention',no:'04',tag:'Attention',short:'Attention',mode:'2d',
  title:'Every token asks a question.',
  body:['In attention, each token emits a query and every token offers a key. Their dot product scores how well they match, and softmax turns the scores into weights that add up to one. The output is the weighted average of the values; here the values are the keys themselves.',
        'Temperature sharpens or flattens the choice. Inside a transformer it is fixed by the √d scaling; the same knob comes back when a model samples its next token.'],
  why:'Attention is how a word finds the other words that change its meaning: which noun “it” refers to, or whether “bank” means a river or money. Without it, every token would be processed in isolation, as if the model read each word through a keyhole with no memory of the rest of the sentence. It is also why long prompts are expensive: every new token has to look back at every token before it.',
  formula:'wᵢ = softmax(q·kᵢ / τ)  ·  output = Σ wᵢ vᵢ',
  caption:'Drag the query arrow',
  abstractCaption:'← → or A D, or drag: turn your head · ↑ ↓ or W S: lean in or back',
  label:'A query vector with attention arcs to eight token keys.',
  abstractLabel:'A first-person view from the centre of a ring of words, with threads that brighten towards the words you attend to.',
  dream:{title:'You are the query.',text:[
    'You are a word in the middle of a sentence, and you have a question.',
    'Around you the other words stand in a ring, each holding up its key, and a thread runs from you to every one of them. Wherever you look is the question you are asking: turn your head and the threads brighten or fade, because a dot product only measures how closely two arrows point the same way.',
    'Each step you take forward makes the question more insistent. On the floor, a glowing ring marks what you will become: a blend of everyone you listened to.']},
  controls:({slider,button,buttons})=>`${slider('att-temp','Temperature τ',.1,3,.05,1,'Temperature τ: how widely you listen')}
    <div class="ab-only">${buttons(button('att-left','↺ Look left'),button('att-in','↑ Lean in'),button('att-out','↓ Lean back'),button('att-right','Look right ↻'))}</div>
    <div class="maths-bars" id="att-bars" aria-label="Attention weights"></div>`,
  init(k){
    const {$,clamp,lerp,stroke,dot,arrow,label,persp,pline,pdot,heading,V}=k;
    const keys=[['the',165,1.5],['cat',40,1.7],['sat',290,1.5],['on',240,1.15],['mat',350,1.6],['rule',112,1.7],['book',200,1.85],['room',72,1.35]]
      .map(([t,deg,r])=>({t,x:r*Math.cos(deg*Math.PI/180),y:r*Math.sin(deg*Math.PI/180)}));
    let q=[1.2,.9],weights=[];
    const look={yaw:0,pitch:-.12};
    const s=k.stage(paint,paintAbstract);
    const unit=()=>Math.min(s.w,s.h)/5;
    const lean=()=>Math.hypot(q[0],q[1]);

    function compute(){
      const tau=Number($('att-temp').value),sc=keys.map(kk=>(q[0]*kk.x+q[1]*kk.y)/tau),m=Math.max(...sc);
      const ex=sc.map(v=>Math.exp(v-m)),sum=ex.reduce((a,b)=>a+b,0);
      weights=ex.map(v=>v/sum);
    }
    function paint({ctx,w,h}){
      const u=unit(),cx=w/2,cy=h/2,S=(x,y)=>[cx+x*u,cy-y*u];
      for(const r of [1,2]){const c=[];for(let i=0;i<=96;i++){const t=i/96*Math.PI*2;c.push(S(r*Math.cos(t),r*Math.sin(t)));}stroke(ctx,c,.1);}
      stroke(ctx,[[0,cy],[w,cy]],.1);stroke(ctx,[[cx,0],[cx,h]],.1);
      const Q=S(...q);
      keys.forEach((kk,i)=>{
        const K=S(kk.x,kk.y),wt=weights[i],mx=(Q[0]+K[0])/2,my=(Q[1]+K[1])/2,dx=K[0]-Q[0],dy=K[1]-Q[1];
        ctx.beginPath();ctx.moveTo(Q[0],Q[1]);ctx.quadraticCurveTo(mx-dy*.25,my+dx*.25,K[0],K[1]);
        ctx.globalAlpha=.08+.85*wt;ctx.lineWidth=.5+2.6*wt;ctx.strokeStyle=k.INK;ctx.stroke();ctx.globalAlpha=1;
        dot(ctx,K[0],K[1],3.2,.95);
        const n=Math.hypot(kk.x,kk.y);
        label(ctx,kk.t,K[0]+kk.x/n*16,K[1]-kk.y/n*14,.85,kk.x<-.2?'right':kk.x>.2?'left':'center');
      });
      const o=keys.reduce((a,kk,i)=>[a[0]+weights[i]*kk.x,a[1]+weights[i]*kk.y],[0,0]),O=S(...o),Z=S(0,0);
      ctx.setLineDash([3,4]);stroke(ctx,[Z,O],.55);ctx.setLineDash([]);
      dot(ctx,O[0],O[1],6,.95,true);label(ctx,'output',O[0]+10,O[1]+12,.7);
      arrow(ctx,Z[0],Z[1],Q[0],Q[1],1,1.8);dot(ctx,Q[0],Q[1],4.5,1);label(ctx,'q',Q[0]+10,Q[1]-12,.95);
    }
    // You stand at the centre; the keys are pillars on the floor, taller and brighter the more you attend to them.
    function paintAbstract(s){
      const {ctx}=s,S=2.4,eye=[0,.55,0],P=persp(s,eye,heading(look.yaw,look.pitch),[0,1,0],1.3);
      for(const r of [1,2,3]){const c=[];for(let n=0;n<=120;n++){const t=n/120*Math.PI*2;c.push([r*S*Math.sin(t),0,r*S*Math.cos(t)]);}pline(ctx,P,c,.32,.7,12);}
      for(let n=0;n<16;n++){const t=n/16*Math.PI*2,sp=[];for(let m=1;m<=24;m++)sp.push([m/8*S*Math.sin(t),0,m/8*S*Math.cos(t)]);pline(ctx,P,sp,.16,.6,12);}
      const chest=V.add(eye,V.add(V.mul(heading(look.yaw),.3),[0,-.2,0]));
      keys.forEach((kk,i)=>{
        const w=weights[i],x=kk.x*S,z=kk.y*S,h=1+1.8*w,col=[],thread=[];
        for(let n=0;n<=8;n++)col.push([x,h*n/8,z]);
        pline(ctx,P,col,.5+.5*w,1+2*w,14);
        for(let n=0;n<=24;n++){const t=n/24;thread.push([lerp(chest[0],x,t),lerp(chest[1],h,t)+Math.sin(t*Math.PI)*.3,lerp(chest[2],z,t)]);}
        pline(ctx,P,thread,.06+.9*w,.5+2.6*w,1e9);
        const p=pdot(ctx,P,[x,h,z],.05+.05*w,.95,false,14);
        if(p)label(ctx,`${kk.t} · ${Math.round(w*100)}%`,p[0],p[1]-16,.9,'center');
      });
      const o=keys.reduce((a,kk,i)=>[a[0]+weights[i]*kk.x*S,a[1]+weights[i]*kk.y*S],[0,0]),ring=[];
      for(let n=0;n<=48;n++){const t=n/48*Math.PI*2;ring.push([o[0]+.24*Math.sin(t),.01,o[1]+.24*Math.cos(t)]);}
      pline(ctx,P,ring,1,1.5,1e9);
      const po=P(o[0],.01,o[1]);
      if(po)label(ctx,'what you become',po[0],po[1]+18,.75,'center');
    }

    function update(){
      compute();
      $('att-temp-out').value=Number($('att-temp').value).toFixed(2);
      $('att-bars').innerHTML=keys.map((kk,i)=>`<div class="maths-bar"><span>${kk.t}</span><i style="--w:${(weights[i]*100).toFixed(1)}%"></i><b>${Math.round(weights[i]*100)}%</b></div>`).join('');
      const top=weights.indexOf(Math.max(...weights)),H=-weights.reduce((a,p)=>a+(p>0?p*Math.log2(p):0),0);
      k.readout(s.abstract
        ?`you are listening most to “${keys[top].t}” (${Math.round(weights[top]*100)}%) · it is as if you were listening to ${(2**H).toFixed(1)} of the 8 words · leaning in ${lean().toFixed(2)}`
        :`strongest match: “${keys[top].t}” (${Math.round(weights[top]*100)}%) · entropy ${H.toFixed(2)} of 3 bits`);
      s.draw();
    }
    // In the first person the query is your gaze: its direction is where you look, its length how far you lean in.
    const aim=(yaw,len)=>{look.yaw=yaw;q=[len*Math.sin(yaw),len*Math.cos(yaw)];update();};
    look.onchange=()=>aim(look.yaw,lean());

    const c=s.canvas;let dragging=false;
    const move=e=>{const r=c.getBoundingClientRect(),u=unit();let x=(e.clientX-r.left-s.w/2)/u,y=-(e.clientY-r.top-s.h/2)/u;const n=Math.hypot(x,y);if(n>2.2){x*=2.2/n;y*=2.2/n;}q=[x,y];update();};
    k.on(c,'pointerdown',e=>{if(s.abstract)return;dragging=true;c.setPointerCapture(e.pointerId);move(e);});
    k.on(c,'pointermove',e=>{if(dragging)move(e);});
    ['pointerup','pointercancel'].forEach(t=>k.on(c,t,()=>{dragging=false;}));
    k.on(c,'keydown',e=>{
      if(s.abstract)return;
      const d={ArrowLeft:[-.1,0],ArrowRight:[.1,0],ArrowUp:[0,.1],ArrowDown:[0,-.1]}[e.key];
      if(!d)return;e.preventDefault();q=[clamp(q[0]+d[0],-2.2,2.2),clamp(q[1]+d[1],-2.2,2.2)];update();
    });
    k.on($('att-temp'),'input',update);
    k.on($('att-left'),'click',()=>aim(look.yaw-.2,lean()));
    k.on($('att-right'),'click',()=>aim(look.yaw+.2,lean()));
    k.on($('att-in'),'click',()=>aim(look.yaw,clamp(lean()+.2,.2,2.2)));
    k.on($('att-out'),'click',()=>aim(look.yaw,clamp(lean()-.2,.2,2.2)));
    k.look(s,look,{vertical:false});
    update();

    return {
      onMode(on){if(on)look.yaw=Math.atan2(q[0],q[1]);update();},
      onKey(key){
        const turns={ArrowLeft:-.15,a:-.15,ArrowRight:.15,d:.15},leans={ArrowUp:.15,w:.15,ArrowDown:-.15,s:-.15};
        if(key in turns){aim(look.yaw+turns[key],lean());return true;}
        if(key in leans){aim(look.yaw,clamp(lean()+leans[key],.2,2.2));return true;}
        return false;
      }
    };
  }
});
