/* 02 · Folding space. Flat: one layer warping a grid. Abstract: stand on the
   sheet while the activation folds everything below zero up into walls. */
Maths.scene({
  id:'folding',no:'02',tag:'Non-linearity',short:'Folding space',mode:'2d',
  title:'Bend, then fold.',
  body:['Stack linear maps and you only ever get another linear map. Networks escape by applying a simple non-linear function after each one.',
        'ReLU keeps positive values and sets negative ones to zero, folding whole regions of space flat onto the axes. Layer after layer, those folds let a network carve space into whatever shapes the task needs. The two point clouds show what happens to an inner disc and an outer ring.'],
  why:'Without a non-linear step, a hundred layers would collapse into one big matrix, and the model could only ever draw straight lines through meaning. It could not learn that “not bad” sits close to “good”, or that a word changes with the company it keeps. The feed-forward layers, where these activations live, hold most of a model’s parameters, and research suggests they store much of what it knows.',
  formula:'h = ReLU(W·x + b) = max(0, W·x + b)',
  caption:'Step through one layer',
  abstractCaption:'↑ ↓ or W S: walk · ← → or A D: turn · F: fold or unfold · drag to look around',
  label:'A square grid passed through a rotation, a shift and an activation function.',
  abstractLabel:'A first-person view of a sheet of graph paper folding up into walls as the activation is applied.',
  dream:{title:'You are a point inside the disc.',text:[
    'You are one point of the inner disc, standing on a sheet of graph paper that is about to pass through one layer of a network.',
    'Around you the grid runs to the horizon, and the points of the outer ring stand in a wide circle like a crowd. First the sheet turns and slides beneath your feet. Then the activation arrives: everything with a coordinate below zero lifts off the floor and folds up into walls, pressed flat against the axes.',
    'Each step you take is a step across the input, and where the layer leaves you depends on which side of the crease you were standing.']},
  controls:({slider,button,buttons,swap})=>`${slider('fold-t','Layer progress',0,2,.01,0,'How far through the layer')}${slider('fold-theta','Rotation θ',-180,180,1,35,'Turn the sheet')}${slider('fold-bias','Bias b',-1.5,1.5,.05,.3,'Slide the sheet')}
    <label class="maths-slider" for="fold-act"><span>${swap('Activation','What folds the world')}</span><select id="fold-act" class="maths-select"><option value="relu">ReLU</option><option value="leaky">Leaky ReLU</option><option value="gelu">GELU</option><option value="tanh">tanh</option></select></label>
    ${buttons(button('fold-play','Play the layer','Let the layer happen'))}
    <div class="ab-only"><p class="maths-subhead">Walk</p>${buttons(button('fold-left','↺ Turn left'),button('fold-fwd','↑ Step forward'),button('fold-back','↓ Step back'),button('fold-right','Turn right ↻'))}</div>`,
  init(k){
    const {$,clamp,lerp,stroke,dot,persp,pline,pdot,heading}=k;
    const r=k.rng(5),pts=[];
    for(let i=0;i<70;i++){const a=r()*Math.PI*2,rad=Math.sqrt(r())*.8;pts.push([rad*Math.cos(a),rad*Math.sin(a),0]);}
    for(let i=0;i<70;i++){const a=r()*Math.PI*2,rad=1.25+r()*.5;pts.push([rad*Math.cos(a),rad*Math.sin(a),1]);}
    const acts={relu:v=>Math.max(0,v),leaky:v=>v>0?v:.1*v,gelu:v=>.5*v*(1+Math.tanh(.7978845608*(v+.044715*v**3))),tanh:Math.tanh};
    const names={relu:'ReLU',leaky:'Leaky ReLU',gelu:'GELU',tanh:'tanh'};
    let me=[.6,.15];
    const look={yaw:-2.36,pitch:-.06};
    const s=k.stage(paint,paintAbstract);
    const params=()=>({t:Number($('fold-t').value),th:Number($('fold-theta').value)*Math.PI/180,b:Number($('fold-bias').value),act:acts[$('fold-act').value]});
    const linear=(x,y,p)=>{const c=Math.cos(p.th),sn=Math.sin(p.th);return [1.15*(c*x-sn*y)+p.b,1.15*(sn*x+c*y)+p.b];};
    function map(x,y,p){
      const [X,Y]=linear(x,y,p),t1=Math.min(p.t,1),t2=clamp(p.t-1,0,1);
      const px=lerp(x,X,t1),py=lerp(y,Y,t1);
      return [lerp(px,p.act(px),t2),lerp(py,p.act(py),t2)];
    }
    // Abstract view: whatever the activation removes from a coordinate becomes
    // height, so the folded-away region stands up as walls. Seen from above it is the flat view.
    function lift(x,y,p){
      const [X,Y]=linear(x,y,p),t1=Math.min(p.t,1),t2=clamp(p.t-1,0,1);
      const px=lerp(x,X,t1),py=lerp(y,Y,t1),ax=p.act(px),ay=p.act(py);
      return [lerp(px,ax,t2),t2*(Math.abs(px-ax)+Math.abs(py-ay)),lerp(py,ay,t2)];
    }

    function paint({ctx,w,h}){
      const p=params(),u=Math.min(w,h)/6.4,cx=w/2,cy=h/2,S=([x,y])=>[cx+x*u,cy-y*u];
      stroke(ctx,[[0,cy],[w,cy]],.16);stroke(ctx,[[cx,0],[cx,h]],.16);
      for(let i=-10;i<=10;i++){
        const v=i/5,a=[],b=[];
        for(let j=0;j<=80;j++){const q=-2+j/20;a.push(S(map(v,q,p)));b.push(S(map(q,v,p)));}
        stroke(ctx,a,i===0?.7:.3);stroke(ctx,b,i===0?.7:.3);
      }
      for(const [x,y,ring] of pts){const q=S(map(x,y,p));dot(ctx,q[0],q[1],ring?2.6:2.1,.9,!!ring);}
    }
    // The sheet is drawn 2.2 times life size so that you stand well clear of the creases.
    const big=(x,y,p)=>lift(x,y,p).map(c=>c*2.2);
    function paintAbstract(s){
      const {ctx}=s,p=params(),you=big(me[0],me[1],p),fold=clamp(p.t-1,0,1);
      const P=persp(s,[you[0],you[1]+.45,you[2]],heading(look.yaw,look.pitch),[0,1,0],1.25);
      for(let i=-24;i<=24;i++){
        const v=i/8,a=[],b=[];
        for(let j=0;j<=96;j++){const q=-3+j/16;a.push(big(v,q,p));b.push(big(q,v,p));}
        pline(ctx,P,a,i===0?.85:.36,.7,10);pline(ctx,P,b,i===0?.85:.36,.7,10);
      }
      // The creases: the two axes everything is pressed against, and the corner where the walls meet.
      if(fold>0)[[1,0,0],[0,0,1],[0,1,0]].forEach(([x,y,z])=>{
        const c=[];for(let n=0;n<=40;n++)c.push([x*n/4,y*n/4,z*n/4]);
        pline(ctx,P,c,.95*fold,1.4,14);
      });
      for(const [x,y,ring] of pts){
        const q=big(x,y,p);
        pdot(ctx,P,[q[0],q[1]+.08,q[2]],ring?.07:.055,.95,!!ring,10);
      }
    }

    function update(){
      const p=params(),key=$('fold-act').value,folded=p.t>=1.999;
      $('fold-t-out').value=p.t<.005?'input':p.t<=1?'linear '+Math.round(p.t*100)+'%':'activation '+Math.round((p.t-1)*100)+'%';
      $('fold-theta-out').value=$('fold-theta').value+'°';
      $('fold-bias-out').value=p.b.toFixed(2);
      if(!play.playing)k.setText($('fold-play'),folded?'Rewind':'Play the layer',folded?'Unfold the world':'Let the layer happen');
      if(s.abstract){
        const you=lift(me[0],me[1],p),lifted=pts.filter(([x,y])=>lift(x,y,p)[1]>.02).length;
        k.readout(`${p.t<.005?'the layer has not started':p.t<=1?'the sheet is turning and sliding':`${names[key]} is folding the world`} · ${you[1]>.02?`you have been carried ${you[1].toFixed(2)} up a wall`:'you are still on the floor'} · ${lifted} of the ${pts.length} points have left the floor`);
      }else{
        const below=pts.filter(([x,y])=>{const [X,Y]=linear(x,y,p);return X<0||Y<0;}).length;
        const stageText=p.t<.005?'Input space':p.t<=1?'Linear map: rotate, scale and shift':`Activation: ${names[key]}`;
        const effect=key==='relu'?'folded onto an axis':key==='leaky'?'squashed towards an axis':key==='gelu'?'pulled in towards zero':'squeezed into (−1, 1)';
        k.readout(`${stageText} · ${Math.round(below/pts.length*100)}% of points have a coordinate below zero${p.t>1?' and are '+effect:''}`);
      }
      s.draw();
    }

    let t0=0,from=0,to=2;
    const play=k.player(s,now=>{const t=Math.min(1,(now-t0)/1300);$('fold-t').value=lerp(from,to,t);update();return t<1;});
    play.onend=update;
    function toggle(){
      from=Number($('fold-t').value);to=from>=1.999?0:2;
      if(k.reduced()){$('fold-t').value=to;update();return;}
      t0=performance.now();play.start();
    }
    // Steps are taken in the input, aimed so that they look like "forward" through the linear part of the layer.
    function walk(dist){
      const p=params(),t1=Math.min(p.t,1),c=1.15*Math.cos(p.th),sn=1.15*Math.sin(p.th);
      const B=[lerp(1,c,t1),lerp(0,-sn,t1),lerp(0,sn,t1),lerp(1,c,t1)],det=B[0]*B[3]-B[1]*B[2];
      const f=heading(look.yaw),fx=f[0]*dist,fz=f[2]*dist,ok=Math.abs(det)>.05;
      me=[clamp(me[0]+(ok?(B[3]*fx-B[1]*fz)/det:fx),-2.8,2.8),clamp(me[1]+(ok?(B[0]*fz-B[2]*fx)/det:fz),-2.8,2.8)];
      update();
    }
    const turnBy=a=>{look.yaw+=a;s.draw();};

    k.on($('fold-play'),'click',toggle);
    ['fold-t','fold-theta','fold-bias','fold-act'].forEach(id=>k.on($(id),'input',()=>{if(id==='fold-t')play.stop();update();}));
    k.on($('fold-fwd'),'click',()=>walk(.18));k.on($('fold-back'),'click',()=>walk(-.18));
    k.on($('fold-left'),'click',()=>turnBy(-.25));k.on($('fold-right'),'click',()=>turnBy(.25));
    k.look(s,look);
    update();

    return {
      onMode:update,
      onKey(key){
        if(key==='ArrowUp'||key==='w'){walk(.18);return true;}
        if(key==='ArrowDown'||key==='s'){walk(-.18);return true;}
        if(key==='ArrowLeft'||key==='a'){turnBy(-.2);return true;}
        if(key==='ArrowRight'||key==='d'){turnBy(.2);return true;}
        if(key==='f'){toggle();return true;}
        return false;
      }
    };
  }
});
