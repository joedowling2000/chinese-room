/* 06 · High dimensions. Flat: histogram of cosine similarity. Abstract: stand
   at the centre of a sky in which every other idea is a star. */
Maths.scene({
  id:'dimensions',no:'06',tag:'Geometry',short:'High dimensions',mode:'2d',
  title:'Room for more than you’d think.',
  body:['In two dimensions only two directions can be at right angles. In thousands of dimensions almost any two random directions are nearly at right angles: their cosine similarity bunches tightly around zero, with a spread of about 1/√d.',
        'That geometry motivates how models could store more features than they have dimensions — superposition — though random directions do not demonstrate what a trained model actually stores. 12,288 is the width of the model in the abliteration notes.'],
  llm:{where:'This is the residual stream — the vector at each token position that carries updates through the transformer blocks. It is 4,096 numbers across in a mid-size model, and 12,288 in the one examined in the abliteration note.',
       role:'The random-direction geometry shown here motivates how many directions can coexist with limited overlap. Whether a model’s learned representations pack features this way is a separate question that the sampling here does not test.'},
  sources:[{label:'Elhage et al., Toy Models of Superposition',href:'https://transformer-circuits.pub/2022/toy_model/'}],
  formula:'cos θ = u·v / (|u| |v|)  ·  spread ≈ 1/√d',
  caption:'Cosine similarity of 6,000 random pairs',
  abstractCaption:'+ and −: more or fewer dimensions · U: look up at yourself · H: the horizon · arrow keys or drag: look around',
  label:'A histogram of cosine similarities between random vectors.',
  abstractLabel:'A first-person view of a night sky in which other directions are stars, gathering on the horizon as dimensions grow.',
  dream:{title:'What the scene represents',text:[
    'Each star represents a sampled direction. Its angle from the point overhead corresponds to its similarity to the reference direction. The sky is a projection of those angles, not a picture of a model’s learned features.']},
  controls:({slider,button,buttons})=>`${slider('dim-k','Dimensions d',0,9,1,3,'Dimensions: how much room the sky has')}
    <div class="ab-only">${buttons(button('dim-less','− Fewer dimensions'),button('dim-more','More dimensions +'),button('dim-up','Look up at yourself'),button('dim-horizon','Look at the horizon'))}</div>`,
  init(k){
    const {$,clamp,lerp,ease,stroke,dot,label,persp,pline,heading}=k;
    const dims=[2,3,5,10,30,100,300,1000,4096,12288],B=100,M=6000,STARS=1500,cache={};
    // Cosine between a fixed axis and a uniform random direction: z₁ / √(z₁² + χ²₍d−1₎).
    // Large d uses the Wilson–Hilferty approximation for the χ² term.
    function samples(d){
      if(cache[d])return cache[d];
      const r=k.rng(d*7+1),out=new Float64Array(M),n=d-1;
      for(let i=0;i<M;i++){
        const z=k.gauss(r);let S=0;
        if(n<=300)for(let j=0;j<n;j++)S+=k.gauss(r)**2;
        else{const c=2/(9*n);S=n*(1-c+k.gauss(r)*Math.sqrt(c))**3;}
        out[i]=z/Math.sqrt(z*z+S);
      }
      return cache[d]=out;
    }
    function histogram(d){
      const c=new Array(B).fill(0);
      for(const v of samples(d))c[clamp(Math.floor((v+1)/2*B),0,B-1)]++;
      const m=Math.max(...c);return c.map(v=>v/m);
    }
    // In the sky each sample becomes a star: its angle from the zenith is the angle between it and you.
    const r=k.rng(77),phis=Array.from({length:STARS},()=>r()*Math.PI*2),sizes=phis.map(()=>.6+r()*1.3),glow=phis.map(()=>.45+r()*.5);
    const angles=d=>Array.from(samples(d).subarray(0,STARS),c=>Math.acos(clamp(c,-1,1)));
    const d0=dims[Number($('dim-k').value)];
    let target={hist:histogram(d0),theta:angles(d0)},shown={hist:[...target.hist],theta:[...target.theta]},from=null,t0=0,spin=0,lastSpin=0;
    const look={yaw:0,pitch:.3,goal:.3};
    const s=k.stage(paint,paintAbstract);
    const tween=k.player(s,now=>{
      const t=ease(Math.min(1,(now-t0)/(s.abstract?1400:380)));
      shown={hist:from.hist.map((v,i)=>lerp(v,target.hist[i],t)),theta:from.theta.map((v,i)=>lerp(v,target.theta[i],t))};
      return t<1;
    });
    const drift=k.player(s,now=>{const dt=lastSpin?Math.min(.1,(now-lastSpin)/1000):0;lastSpin=now;spin+=dt*.025;return s.abstract;});
    const tilt=k.player(s,()=>{look.pitch=lerp(look.pitch,look.goal,.12);if(Math.abs(look.pitch-look.goal)>.002)return true;look.pitch=look.goal;return false;});
    look.onchange=()=>tilt.stop();

    function paint({ctx,w,h}){
      const x0=44,x1=w-44,y0=h-52,top=48,X=v=>x0+(v+1)/2*(x1-x0),bw=(x1-x0)/B;
      stroke(ctx,[[x0,y0],[x1,y0]],.5);
      [-1,-.5,0,.5,1].forEach(v=>{stroke(ctx,[[X(v),y0],[X(v),y0+6]],.5);label(ctx,String(v),X(v),y0+20,.65,'center');});
      ctx.setLineDash([3,5]);[-.1,.1].forEach(v=>stroke(ctx,[[X(v),top-6],[X(v),y0]],.35));ctx.setLineDash([]);
      const outline=[];
      shown.hist.forEach((v,i)=>{
        const x=x0+(i+.5)*bw,y=y0-v*(y0-top);
        for(let n=-1;n<=1;n++)stroke(ctx,[[x+n*bw*.22,y0],[x+n*bw*.22,y]],.32,.6);
        outline.push([x,y]);
      });
      stroke(ctx,outline,.95,1.1);
      label(ctx,`d = ${dims[Number($('dim-k').value)].toLocaleString('en-GB')}`,x0,24,.9);
      label(ctx,'cos θ',x1,y0+38,.55,'right');
    }
    function paintAbstract(s){
      const {ctx}=s,P=persp(s,[0,0,0],heading(look.yaw,look.pitch),[0,1,0],1.3),Rs=10,ac=k.world.accent,se=k.world.secondary;
      const at=(th,ph)=>[Rs*Math.sin(th)*Math.cos(ph),Rs*Math.cos(th),Rs*Math.sin(th)*Math.sin(ph)];
      const ring=(th,alpha,width,dashed)=>{
        const c=[];for(let n=0;n<=200;n++)c.push(at(th,n/200*Math.PI*2));
        if(dashed)ctx.setLineDash([3,5]);
        pline(ctx,P,c,alpha,width,1e9);ctx.setLineDash([]);
      };
      k.tint(ctx,ac,()=>ring(Math.PI/2,.6,1));
      ring(Math.acos(.1),.35,.7,true);ring(Math.acos(-.1),.35,.7,true);
      [Math.PI/6,Math.PI/3,2*Math.PI/3,5*Math.PI/6].forEach(th=>ring(th,.12,.6));
      for(let m=0;m<12;m++){const ph=m/12*Math.PI*2+spin,c=[];for(let n=0;n<=60;n++)c.push(at(n/60*Math.PI,ph));pline(ctx,P,c,.06,.6,1e9);}
      // Meridians from your zenith down towards a few real sampled stars.
      for(let i=0;i<12;i++){
        const th=shown.theta[i],ph=phis[i]+spin,c=[];
        for(let n=0;n<=40;n++)c.push(at(th*n/40,ph));
        k.tint(ctx,th<Math.PI/2?ac:se,()=>pline(ctx,P,c,.18,.6,1e9));
      }
      // The stars: every sampled direction, warm above your horizon, cool below.
      shown.theta.forEach((th,i)=>{
        const upper=th<Math.PI/2,col=upper?ac:se;
        const near=(Math.abs(th-Math.PI/2)<.09)?1.6:1;
        ctx.mathsInk=col;
        const p=P(...at(th,phis[i]+spin));
        if(p){dot(ctx,p[0],p[1],sizes[i]*near,Math.min(1,glow[i]*near));}
        if(i%97===0)k.beacon(ctx,P,at(th,phis[i]+spin),col,.04,.7);
      });
      ctx.mathsInk=null;
      const z=P(0,Rs,0);
      if(z){k.beacon(ctx,P,[0,Rs,0],se,.3,1);dot(ctx,z[0],z[1],5,1);dot(ctx,z[0],z[1],11,.5,true);label(ctx,'you · your direction',z[0]+16,z[1],.95);}
      const h=P(...at(Math.PI/2,Math.PI/2-look.yaw));
      if(h)label(ctx,'90° · cosine 0',h[0],h[1]+16,.7,'center');
    }

    function update(animate){
      const d=dims[Number($('dim-k').value)],v=samples(d);
      $('dim-k-out').value=d.toLocaleString('en-GB');
      let near=0,abs=0,deg=0;
      for(const c of v){if(Math.abs(c)<.1)near++;abs+=Math.abs(c);deg+=Math.asin(Math.min(1,Math.abs(c)));}
      k.readout(s.abstract
        ?`${d.toLocaleString('en-GB')} dimensions · ${(near/M*100).toFixed(1)}% of the stars lie within 6° of your horizon · the typical star sits ${(deg/M*180/Math.PI).toFixed(1)}° above or below it`
        :`${(near/M*100).toFixed(1)}% of random pairs are within ±0.1 of a right angle · typical |cos θ| ≈ ${(abs/M).toFixed(3)} · 1/√d = ${(1/Math.sqrt(d)).toFixed(3)}`);
      target={hist:histogram(d),theta:angles(d)};
      if(animate&&!k.reduced()){from={hist:[...shown.hist],theta:[...shown.theta]};t0=performance.now();tween.start();}
      else{tween.stop();shown={hist:[...target.hist],theta:[...target.theta]};s.draw();}
    }
    const setDim=delta=>{const el=$('dim-k');el.value=clamp(Number(el.value)+delta,0,9);update(true);};
    const tiltTo=goal=>{look.goal=goal;if(k.reduced()){look.pitch=goal;s.draw();}else tilt.start();};

    k.on($('dim-k'),'input',()=>update(true));
    k.on($('dim-less'),'click',()=>setDim(-1));
    k.on($('dim-more'),'click',()=>setDim(1));
    k.on($('dim-up'),'click',()=>tiltTo(1.42));
    k.on($('dim-horizon'),'click',()=>tiltTo(.12));
    k.look(s,look,{min:-1.3,max:1.45});
    update(false);

    return {
      onMode(on){
        update(false);
        if(on){look.yaw=0;look.pitch=look.goal=.3;lastSpin=0;if(!k.reduced())drift.start();}
      },
      resetView(){tilt.stop();spin=0;lastSpin=0;look.yaw=0;look.pitch=look.goal=.3;s.camera=null;s.draw();},
      onKey(key){
        if(key==='+'||key==='='){setDim(1);return true;}
        if(key==='-'||key==='_'){setDim(-1);return true;}
        if(key==='u'){tiltTo(1.42);return true;}
        if(key==='h'){tiltTo(.12);return true;}
        const m={ArrowLeft:[-.2,0],a:[-.2,0],ArrowRight:[.2,0],d:[.2,0],ArrowUp:[0,.12],w:[0,.12],ArrowDown:[0,-.12],s:[0,-.12]}[key];
        if(!m)return false;
        tilt.stop();look.yaw+=m[0];look.pitch=clamp(look.pitch+m[1],-1.3,1.45);s.draw();
        return true;
      }
    };
  }
});
