/* 01 · Linear maps. Flat: a grid under a 2×2 matrix. Abstract: walk the
   transformed plane in the first person, among posts at whole-number addresses. */
Maths.scene({
  id:'linear-maps',no:'01',tag:'Vectors & matrices',short:'Linear maps',mode:'2d',
  title:'A matrix moves all of space at once.',
  body:['Almost everything inside a transformer is a matrix multiplication. A 2×2 matrix is simply a rule for where the two basis arrows, î and ĵ, land. Every other point follows along, so grid lines stay straight, parallel and evenly spaced.',
        'The determinant says how much areas grow or shrink. At zero, the plane is flattened onto a line and information is lost for good.'],
  why:'Most of an LLM’s billions of parameters are entries in matrices like this one, only thousands of rows wide. They turn each word into a query, a key and a value, mix information between layers and score every word in the vocabulary. Without them there would be nothing to learn: no way to move meaning from one place to another.',
  llm:{where:'Every weight matrix in a transformer is one of these maps: the embedding that turns each word into a vector, the Q, K and V projections inside every attention head, the feed-forward layers, and the final unembedding that scores the whole vocabulary.',
       role:'It is the model’s only way to move and mix information — change the entries and you change what the network can express. When the determinant hits zero the map throws information away, which is why trained weight matrices stay near full rank.'},
  formula:'[x′ y′] = [[a b] [c d]] · [x y]  ·  det = ad − bc',
  caption:'Drag the tips of î and ĵ',
  abstractCaption:'Arrow keys or W A S D: step along î and ĵ · Q E or drag: look around',
  label:'A grid transformed by a 2 by 2 matrix, with the unit circle mapped to an ellipse.',
  abstractLabel:'A first-person view across the transformed plane, with posts standing at whole-number addresses.',
  dream:{title:'You are a point on the plane.',text:[
    'You are a single point: two numbers and nothing else, standing on an endless sheet of graph paper.',
    'Around you, posts mark every whole-numbered address, and a ring on the ground marks your unit neighbourhood. Somewhere overhead, a hand rewrites the matrix, and the whole world shears, stretches and turns at once, carrying you with it, because you are only ever where the matrix sends you.',
    'Each step you take is a column of the matrix: step along î and you travel wherever î now points. Rewrite the rules until the determinant reaches zero, and the world folds into a single road.']},
  controls:({slider,button,buttons,swap})=>`<p class="maths-subhead">${swap('Presets','Rewrite the rules')}</p>
    ${buttons(...[['identity','Identity'],['rotate','Rotate'],['shear','Shear'],['stretch','Stretch'],['flip','Reflect'],['collapse','Collapse']].map(([k,l])=>button('lm-'+k,l,undefined,`data-lm-preset="${k}"`)))}
    <div class="maths-grid2 flat-only">${slider('lm-a','a',-2,2,.05,1)}${slider('lm-b','b',-2,2,.05,.5)}${slider('lm-c','c',-2,2,.05,-.3)}${slider('lm-d','d',-2,2,.05,1.1)}</div>
    <div class="ab-only"><p class="maths-subhead">Walk</p>${buttons(button('lm-west','← Back along î'),button('lm-east','Along î →'),button('lm-south','↓ Back along ĵ'),button('lm-north','Along ĵ ↑'))}</div>`,
  init(k){
    const {$,clamp,lerp,ease,stroke,dot,arrow,label,persp,pline,pdot,heading}=k;
    const ids=['lm-a','lm-b','lm-c','lm-d'];
    const presets={identity:[1,0,0,1],rotate:[.87,-.5,.5,.87],shear:[1,1,0,1],stretch:[1.8,0,0,.6],flip:[-1,0,0,1],collapse:[1,2,.5,1]};
    let M=ids.map(id=>Number($(id).value)),shown=[...M],from=null,t0=0,grab=null;
    let me=[0,0],goal=[0,0];
    const look={yaw:.6,pitch:-.32};
    const s=k.stage(paint,paintAbstract);
    const unit=()=>Math.min(s.w,s.h)/7.5;
    const tween=k.player(s,now=>{const t=Math.min(1,(now-t0)/450);shown=from.map((v,i)=>lerp(v,M[i],ease(t)));return t<1;});
    const walk=k.player(s,()=>{
      me=me.map((v,i)=>lerp(v,goal[i],.2));
      if(Math.hypot(me[0]-goal[0],me[1]-goal[1])>.003)return true;
      me=[...goal];return false;
    });

    function paint({ctx,w,h}){
      const u=unit(),cx=w/2,cy=h/2,[a,b,c,d]=shown;
      const T=(x,y)=>[cx+(a*x+b*y)*u,cy-(c*x+d*y)*u];
      for(let i=-12;i<=12;i++){stroke(ctx,[[cx+i*u,0],[cx+i*u,h]],.06);stroke(ctx,[[0,cy-i*u],[w,cy-i*u]],.06);}
      for(let i=-9;i<=9;i++){const al=i===0?.75:.3;stroke(ctx,[T(i,-9),T(i,9)],al);stroke(ctx,[T(-9,i),T(9,i)],al);}
      const sq=[T(0,0),T(1,0),T(1,1),T(0,1)];
      ctx.beginPath();sq.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();
      ctx.globalAlpha=.1;ctx.fillStyle=k.INK;ctx.fill();ctx.globalAlpha=1;
      const circle=[];for(let i=0;i<=96;i++){const t=i/96*Math.PI*2;circle.push(T(Math.cos(t),Math.sin(t)));}
      stroke(ctx,circle,.75,1);
      const o=T(0,0),I=T(1,0),J=T(0,1),w0=k.world;
      k.tint(ctx,w0.accent,()=>{arrow(ctx,o[0],o[1],I[0],I[1],1,1.8);dot(ctx,I[0],I[1],4,1);label(ctx,'î',I[0]+10,I[1]-12,.95);});
      k.tint(ctx,w0.secondary,()=>{arrow(ctx,o[0],o[1],J[0],J[1],1,1.8);dot(ctx,J[0],J[1],4,1);label(ctx,'ĵ',J[0]+10,J[1]-12,.95);});
    }

    // Input (x, y) lands at world (ax + by, cx + dy) on the ground; h lifts it.
    function paintAbstract(s){
      const {ctx}=s,[a,b,c,d]=shown,ac=k.world.accent,se=k.world.secondary;
      const W=(x,y,h=0)=>[a*x+b*y,h,c*x+d*y];
      const feet=W(...me),eye=[feet[0],.55,feet[2]];
      const P=persp(s,eye,heading(look.yaw,look.pitch),[0,1,0],1.2);
      const target=W(2,2,.1),mark=k.beacon(ctx,P,target,se,.3,1);
      if(mark)label(ctx,'DELIVERY · (2, 2)',mark[0],mark[1]-20,1,'center');
      const horizon=[];
      for(let n=0;n<=160;n++){const t=n/160*Math.PI*2;horizon.push([eye[0]+80*Math.sin(t),0,eye[2]+80*Math.cos(t)]);}
      k.tint(ctx,se,()=>pline(ctx,P,horizon,.3,.8,1e9));
      const L=16,ox=Math.round(me[0]),oy=Math.round(me[1]);
      k.tint(ctx,ac,()=>{
        for(let i=-L;i<=L;i++){
          const r1=[],r2=[];
          for(let j=-L;j<=L;j+=.5){r1.push(W(ox+i,oy+j));r2.push(W(ox+j,oy+i));}
          pline(ctx,P,r1,ox+i===0?.85:.36,.8,9);pline(ctx,P,r2,oy+i===0?.85:.36,.8,9);
        }
      });
      // The lattice cathedral: every gate is built in input space and pushed
      // through W, so a shear or a collapse rewrites the whole architecture.
      for(let row=-8;row<=12;row+=2){
        const gate=[W(-2.5,row,0),W(-2.5,row,3.2),W(2.5,row,3.2),W(2.5,row,0)];
        k.tint(ctx,ac,()=>{
          pline(ctx,P,[...gate,gate[0]],.7,1.2,16);
          const beam=[];for(let n=0;n<=12;n++)beam.push(W(-2.5+5*n/12,row,2.8));
          pline(ctx,P,beam,.55,.9,16);
          const arch=[];for(let n=0;n<=16;n++){const u=n/16;arch.push(W(-2.5+5*u,row,3.2+Math.sin(u*Math.PI)*.7));}
          pline(ctx,P,arch,.8,1,16);
        });
        k.surface(ctx,P,[W(-2.5,row,0),W(-2.5,row,3.2),W(-2.5,row+.25,3.2),W(-2.5,row+.25,0)],ac,.06);
        k.surface(ctx,P,[W(2.5,row,0),W(2.5,row+.25,0),W(2.5,row+.25,3.2),W(2.5,row,3.2)],ac,.06);
        k.beacon(ctx,P,W(0,row,3.9),se,.06,.8);
      }
      // Ceiling ribs joining the gate tops.
      k.tint(ctx,se,()=>[-2.5,2.5].forEach(x=>{
        const rib=[];for(let row=-8;row<=12;row+=.5)rib.push(W(x,row,3.2));
        pline(ctx,P,rib,.3,.7,16);
      }));
      for(let i=-6;i<=6;i++)for(let j=-6;j<=6;j++){
        const x=ox+i,y=oy+j;
        if(Math.hypot(x-me[0],y-me[1])<.3)continue;
        k.tint(ctx,se,()=>{
          pline(ctx,P,[W(x,y),W(x,y,.15),W(x,y,.3),W(x,y,.45)],.75,1,7);
          const p=pdot(ctx,P,W(x,y,.45),.03,.95,false,7);
          if(p&&Math.hypot(x-me[0],y-me[1])<2.4)label(ctx,`(${x}, ${y})`,p[0],p[1]-13,.75*Math.exp(-p[2]/7),'center');
        });
      }
      // Your unit neighbourhood: a filled tile and a ring, plus a light that
      // travels the true transformed circle around you.
      k.surface(ctx,P,[W(me[0],me[1],.002),W(me[0]+1,me[1],.002),W(me[0]+1,me[1]+1,.002),W(me[0],me[1]+1,.002)],ac,.08);
      const ring=[];
      for(let n=0;n<=96;n++){const t=n/96*Math.PI*2;ring.push(W(me[0]+Math.cos(t),me[1]+Math.sin(t),.005));}
      k.tint(ctx,ac,()=>pline(ctx,P,ring,.85,1.3,1e9));
      const ta=s.time*.4;
      k.beacon(ctx,P,W(me[0]+Math.cos(ta),me[1]+Math.sin(ta),.02),se,.09,1);
      [[1,0,'î',ac],[0,1,'ĵ',se]].forEach(([dx,dy,name,col])=>{
        k.tint(ctx,col,()=>{
          const ray=[];for(let n=0;n<=20;n++)ray.push(W(me[0]+dx*n/20,me[1]+dy*n/20,.01));
          pline(ctx,P,ray,1,2.2,1e9);
          const p=P(...ray[20]);if(p)label(ctx,name,p[0]+8,p[1]-12,1);
        });
      });
    }

    function sync(){
      ids.forEach((id,i)=>{$(id).value=M[i];$(id+'-out').value=M[i].toFixed(2);});
      const det=M[0]*M[3]-M[1]*M[2];
      if(!s.abstract){
        k.readout(`det = ${det.toFixed(2)} · areas scale by ${Math.abs(det).toFixed(2)}×${Math.abs(det)<.03?' · the plane is flattened onto a line':det<0?' · orientation is flipped':''}`);
        return;
      }
      k.challenge({x:goal[0],y:goal[1],det});
      const at=[M[0]*goal[0]+M[1]*goal[1],M[2]*goal[0]+M[3]*goal[1]];
      k.readout(`your own address: (${goal[0]}, ${goal[1]}) · the world puts you at (${at[0].toFixed(2)}, ${at[1].toFixed(2)}) · ${Math.abs(det)<.03?'the world has folded into a single road, and different addresses are now the same place':`your unit square covers ${Math.abs(det).toFixed(2)} square units${det<0?', mirrored':''}`}`);
    }
    function set(next,animate){
      M=next;sync();
      if(animate&&!k.reduced()){from=[...shown];t0=performance.now();tween.start();}
      else{tween.stop();shown=[...M];s.draw();}
    }
    // Each step is a column of the matrix: one unit along î or ĵ in your own coordinates.
    function step(dx,dy){
      goal=[clamp(goal[0]+dx,-12,12),clamp(goal[1]+dy,-12,12)];sync();
      if(k.reduced()){me=[...goal];s.draw();}else walk.start();
    }

    const c=s.canvas;
    const local=e=>{const r=c.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];};
    k.on(c,'pointerdown',e=>{
      if(s.abstract)return;
      const [px,py]=local(e),u=unit();
      const dist=[[M[0],M[2]],[M[1],M[3]]].map(([x,y])=>Math.hypot(s.w/2+x*u-px,s.h/2-y*u-py));
      const n=dist[0]<=dist[1]?0:1;
      if(dist[n]>30)return;
      grab=n;c.setPointerCapture(e.pointerId);
    });
    k.on(c,'pointermove',e=>{
      if(grab===null)return;
      const [px,py]=local(e),u=unit();
      const x=clamp(Math.round((px-s.w/2)/u*20)/20,-2,2),y=clamp(Math.round(-(py-s.h/2)/u*20)/20,-2,2);
      const next=[...M];if(grab===0){next[0]=x;next[2]=y;}else{next[1]=x;next[3]=y;}
      set(next,false);
    });
    ['pointerup','pointercancel'].forEach(t=>k.on(c,t,()=>{grab=null;}));
    ids.forEach((id,i)=>k.on($(id),'input',()=>{const next=[...M];next[i]=Number($(id).value);set(next,false);}));
    document.querySelectorAll('[data-lm-preset]').forEach(b=>k.on(b,'click',()=>set([...presets[b.dataset.lmPreset]],true)));
    [['lm-east',1,0],['lm-west',-1,0],['lm-north',0,1],['lm-south',0,-1]].forEach(([id,dx,dy])=>k.on($(id),'click',()=>step(dx,dy)));
    k.look(s,look);
    sync();

    return {
      onMode:sync,
      resetView(){walk.stop();me=[0,0];goal=[0,0];look.yaw=.6;look.pitch=-.32;s.camera=null;sync();},
      onKey(key){
        const m={ArrowRight:[1,0],d:[1,0],ArrowLeft:[-1,0],a:[-1,0],ArrowUp:[0,1],w:[0,1],ArrowDown:[0,-1],s:[0,-1]}[key];
        if(m){step(m[0]*.25,m[1]*.25);return true;}
        if(key==='q'||key==='e'){look.yaw+=key==='e'?.25:-.25;s.draw();return true;}
        return false;
      }
    };
  }
});
