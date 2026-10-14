// Generate the deterministic Field artwork as static SVG files.
// Run: node scripts/generate-field-art.mjs
// Decorative procedural geometry only — not measured data. Mechanical
// extraction of the formulas developed for the design studies.

import {writeFileSync, mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function project(x,y,z){
  const a=-.55,b=.65;
  const X=x*Math.cos(a)-z*Math.sin(a),Z=x*Math.sin(a)+z*Math.cos(a);
  return [500+X*200,350+(y*Math.cos(b)-Z*Math.sin(b))*200];
}

const fmt = n => Math.round(n*100)/100;
const path = pts => 'M '+pts.map(p=>fmt(p[0])+' '+fmt(p[1])).join(' L ');

/* Torus: 32 rings (v fixed) + 64 meridians (u fixed), 128 samples each. */
function artManifold(ink){
  const R=1.45,r=.58,S=128;
  const pt=(u,v)=>{
    const x=(R+r*Math.cos(v))*Math.cos(u), y=r*Math.sin(v), z=(R+r*Math.cos(v))*Math.sin(u);
    return project(x,y,z);
  };
  let out='';
  for(let j=0;j<32;j++){
    const v=j/32*Math.PI*2, pts=[];
    for(let i=0;i<=S;i++)pts.push(pt(i/S*Math.PI*2,v));
    out+=`<path d="${path(pts)}" stroke="${ink}" stroke-width=".7" fill="none" opacity=".38"/>`;
  }
  for(let j=0;j<64;j++){
    const u=j/64*Math.PI*2, pts=[];
    for(let i=0;i<=S;i++)pts.push(pt(u,i/S*Math.PI*2));
    out+=`<path d="${path(pts)}" stroke="${ink}" stroke-width=".8" fill="none" opacity=".5"/>`;
  }
  for(let j=0;j<10;j++)for(let k=0;k<7;k++){
    const u=j/10*Math.PI*2,v=k/7*Math.PI*2,[x,y]=pt(u,v);
    out+=`<circle cx="${fmt(x)}" cy="${fmt(y)}" r="1.4" fill="${ink}" opacity=".75"/>`;
  }
  return out;
}

/* Sculptural saddle mesh, 42×42. */
function artSurface(ink){
  const z=(x,y)=>.45*(Math.sin(2*x)*Math.cos(1.6*y))+.16*(x*x-y*y);
  const N=42,lo=-1.8,hi=1.8,st=(hi-lo)/(N-1);
  let out='';
  for(let i=0;i<N;i++){
    const x=lo+i*st,pts=[];
    for(let j=0;j<N;j++){const y=lo+j*st;pts.push(project(x,z(x,y),y));}
    out+=`<path d="${path(pts)}" stroke="${ink}" stroke-width=".65" fill="none" opacity=".5"/>`;
  }
  for(let j=0;j<N;j++){
    const y=lo+j*st,pts=[];
    for(let i=0;i<N;i++){const x=lo+i*st;pts.push(project(x,z(x,y),y));}
    out+=`<path d="${path(pts)}" stroke="${ink}" stroke-width=".65" fill="none" opacity=".38"/>`;
  }
  return out;
}

/* 27-cube lattice: three visible faces per cube, painter-sorted. */
function artLattice(tone){
  const dark = tone==='dark';
  const face = dark ? {top:'#3a3a3a',left:'#242424',right:'#131313'} : {top:'#fafafa',left:'#c4c4c4',right:'#7a7a7a'};
  const ink = dark ? '#050505' : '#080808';
  const h=.24,s=.74;
  const cubes=[];
  for(let xi=-1;xi<=1;xi++)for(let yi=-1;yi<=1;yi++)for(let zi=-1;zi<=1;zi++)
    cubes.push({x:xi*s,y:yi*s,z:zi*s,d:-(.42*xi)+(.61*yi)+(.68*zi)});
  cubes.sort((a,b)=>a.d-b.d);
  let out='';
  for(const c of cubes){
    const P=(dx,dy,dz)=>project(c.x+dx*h,c.y+dy*h,c.z+dz*h);
    const f=(pts,col)=>`<polygon points="${pts.map(p=>fmt(p[0])+','+fmt(p[1])).join(' ')}" fill="${col}" stroke="${ink}" stroke-width=".7"/>`;
    out+=f([P(-1,-1,-1),P(-1,1,-1),P(-1,1,1),P(-1,-1,1)],face.left);
    out+=f([P(-1,-1,1),P(-1,1,1),P(1,1,1),P(1,-1,1)],face.right);
    out+=f([P(-1,1,-1),P(1,1,-1),P(1,1,1),P(-1,1,1)],face.top);
  }
  return out;
}

/* Moiré wave bundle: 72 parallel lines with a Gaussian-envelope sine offset. */
function artSignal(ink){
  let out='';
  for(let i=0;i<72;i++){
    const base=80+i*7.3,pts=[];
    for(let x=0;x<=1000;x+=5){
      pts.push([x,base+65*Math.sin(x*.011+i*.12)*Math.exp(-(((x-540)/270)**2))]);
    }
    out+=`<path d="${path(pts)}" stroke="${ink}" stroke-width=".75" fill="none" opacity=".55"/>`;
  }
  return out;
}

/* Seeded helpers so the scattered pieces stay deterministic between runs. */
function rng(seed){
  let s=seed>>>0;
  return ()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
}
const gauss = r => Math.sqrt(-2*Math.log(1-r()))*Math.cos(2*Math.PI*r());
const line3 = (a,b,ink,w,op,extra='') => `<path d="${path([project(...a),project(...b)])}" stroke="${ink}" stroke-width="${w}" fill="none" opacity="${op}"${extra}/>`;
function catmull(P,steps){
  const out=[];
  for(let i=0;i<P.length-1;i++){
    const p0=P[Math.max(i-1,0)],p1=P[i],p2=P[i+1],p3=P[Math.min(i+2,P.length-1)];
    for(let s=0;s<steps;s++){
      const t=s/steps,t2=t*t,t3=t2*t;
      out.push([0,1,2].map(k=>.5*(2*p1[k]+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3)));
    }
  }
  out.push(P[P.length-1]);
  return out;
}

/* Attention arcs: 40 tokens on a baseline; each head draws query→key arcs in
   its own tilted plane, opacity set by a stylised attention weight. */
function artAttention(ink){
  const N=40,lo=-1.95,hi=1.95,X=i=>lo+(hi-lo)*i/(N-1),base=.38,r=rng(7);
  const noise=Array.from({length:N*N},()=>r());
  const heads=[
    {tilt:-.9,w:(i,j)=>j===i-1?1:.04*Math.exp(-(i-j))},
    {tilt:-.45,w:(i,j)=>j===0?1:.06*Math.exp(-(i-j)/3)},
    {tilt:0,w:(i,j)=>(i-j)%9===8?.9:.02},
    {tilt:.45,w:(i,j)=>Math.exp(-(i-j)/2.2)},
    {tilt:.9,w:(i,j)=>noise[i*N+j]**6},
  ];
  let out='';
  for(const h of heads){
    for(let i=1;i<N;i++){
      let ws=[],sum=0;
      for(let j=0;j<i;j++){const w=h.w(i,j);ws.push(w);sum+=w;}
      ws.forEach((w,j)=>{
        w/=sum;
        if(w<.05)return;
        const mid=(X(i)+X(j))/2,half=(X(i)-X(j))/2,ht=half*.95,pts=[];
        for(let s=0;s<=22;s++){
          const t=s/22*Math.PI,hh=ht*Math.sin(t);
          pts.push(project(mid+half*Math.cos(t),base-hh*Math.cos(h.tilt),hh*Math.sin(h.tilt)));
        }
        out+=`<path d="${path(pts)}" stroke="${ink}" stroke-width=".7" fill="none" opacity="${fmt(.1+.55*w)}"/>`;
      });
    }
  }
  out+=line3([lo-.15,base,0],[hi+.15,base,0],ink,.6,.35);
  for(let i=0;i<N;i++){const [x,y]=project(X(i),base,0);out+=`<circle cx="${fmt(x)}" cy="${fmt(y)}" r="2" fill="${ink}" opacity=".85"/>`;}
  return out;
}

/* Residual stream: 34 layer planes; a bundle of strands threads through them,
   nudged a little at every layer (seeded random walk with a slow twist). */
function artStream(ink){
  const L=34,lo=-2.35,hi=2.35,S=56,half=.6,r=rng(11);
  const X=l=>lo+(hi-lo)*l/(L-1);
  let out='';
  for(let l=0;l<L;l++){
    const x=X(l),c=[[-half,-half],[half,-half],[half,half],[-half,half],[-half,-half]];
    out+=`<path d="${path(c.map(([y,z])=>project(x,y,z)))}" stroke="${ink}" stroke-width=".6" fill="none" opacity="${l%8===0?.5:.26}"/>`;
  }
  for(let s=0;s<S;s++){
    let y=gauss(r)*.1,z=gauss(r)*.1,vy=0,vz=0;
    const P=[];
    for(let l=0;l<L;l++){
      vy=.75*vy+gauss(r)*.032;vz=.75*vz+gauss(r)*.032;
      y+=vy;z+=vz;
      const a=l*.045,cy=y*Math.cos(a)-z*Math.sin(a),cz=y*Math.sin(a)+z*Math.cos(a);
      P.push([X(l),half*.9*Math.tanh(cy/(half*.9)),half*.9*Math.tanh(cz/(half*.9))]);
    }
    out+=`<path d="${path(catmull(P,6).map(p=>project(...p)))}" stroke="${ink}" stroke-width=".7" fill="none" opacity=".5"/>`;
    if(s%4===0)for(const p of P){const [x,yy]=project(...p);out+=`<circle cx="${fmt(x)}" cy="${fmt(yy)}" r=".9" fill="${ink}" opacity=".6"/>`;}
  }
  return out;
}

/* Superposition: eight features packed into three dimensions as a square
   antiprism inside the unit sphere, with spokes from the origin. */
function artPolytope(ink){
  const R=1.5,rho=1/Math.sqrt(1+Math.SQRT2/4),h=rho*2**.25/2;
  const V=[];
  for(let k=0;k<4;k++){const a=k*Math.PI/2;V.push([rho*Math.cos(a),-h,rho*Math.sin(a)]);}
  for(let k=0;k<4;k++){const a=k*Math.PI/2+Math.PI/4;V.push([rho*Math.cos(a),h,rho*Math.sin(a)]);}
  const P=V.map(v=>v.map(c=>c*R));
  let out='';
  const sp=(u,v)=>[R*Math.cos(v)*Math.cos(u),R*Math.sin(v),R*Math.cos(v)*Math.sin(u)];
  for(let j=1;j<12;j++){
    const v=-Math.PI/2+j/12*Math.PI,pts=[];
    for(let i=0;i<=96;i++)pts.push(project(...sp(i/96*Math.PI*2,v)));
    out+=`<path d="${path(pts)}" stroke="${ink}" stroke-width=".55" fill="none" opacity=".14"/>`;
  }
  for(let j=0;j<24;j++){
    const u=j/24*Math.PI*2,pts=[];
    for(let i=0;i<=64;i++)pts.push(project(...sp(u,-Math.PI/2+i/64*Math.PI)));
    out+=`<path d="${path(pts)}" stroke="${ink}" stroke-width=".55" fill="none" opacity=".14"/>`;
  }
  for(let k=0;k<4;k++){
    out+=line3(P[k],P[(k+1)%4],ink,1,.8)+line3(P[4+k],P[4+(k+1)%4],ink,1,.8);
    out+=line3(P[k],P[4+k],ink,1,.8)+line3(P[(k+1)%4],P[4+k],ink,1,.8);
  }
  for(const p of P){
    out+=line3([0,0,0],p,ink,.7,.5,' stroke-dasharray="3 4"');
    const [x,y]=project(...p);out+=`<circle cx="${fmt(x)}" cy="${fmt(y)}" r="3.2" fill="${ink}" opacity=".9"/>`;
  }
  const [ox,oy]=project(0,0,0);
  out+=`<circle cx="${fmt(ox)}" cy="${fmt(oy)}" r="2" fill="${ink}" opacity=".7"/>`;
  return out;
}

/* A direction through a cloud: two lobes of activations separated along one
   direction, the hyperplane orthogonal to it, and projections onto that plane. */
function artDirection(ink){
  const r=rng(23),d=[.408,.597,.691];
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  let u=[-d[1],d[0],0];const un=Math.hypot(...u);u=u.map(c=>c/un);
  const v=[d[1]*u[2]-d[2]*u[1],d[2]*u[0]-d[0]*u[2],d[0]*u[1]-d[1]*u[0]];
  const at=(a,b,c=0)=>[0,1,2].map(k=>a*u[k]+b*v[k]+c*d[k]);
  let out='';
  for(let i=0;i<=12;i++){
    const t=-1.3+i*2.6/12;
    out+=line3(at(t,-1.3),at(t,1.3),ink,.55,.2)+line3(at(-1.3,t),at(1.3,t),ink,.55,.2);
  }
  let dots='';
  for(const side of [-1,1]){
    for(let i=0;i<650;i++){
      const p=at(gauss(r)*.42,gauss(r)*.3,side*1.05+gauss(r)*.3);
      const [x,y]=project(...p);
      dots+=side<0?`<circle cx="${fmt(x)}" cy="${fmt(y)}" r="1.15" fill="${ink}" opacity=".6"/>`
                  :`<circle cx="${fmt(x)}" cy="${fmt(y)}" r="1.4" fill="none" stroke="${ink}" stroke-width=".5" opacity=".7"/>`;
      if(i%7===0){
        const k=dot(p,d),q=p.map((c,j)=>c-k*d[j]);
        out+=line3(p,q,ink,.45,.16);
        const [qx,qy]=project(...q);dots+=`<circle cx="${fmt(qx)}" cy="${fmt(qy)}" r=".8" fill="${ink}" opacity=".45"/>`;
      }
    }
  }
  out+=dots;
  const a=d.map(c=>-2.3*c),b=d.map(c=>2.3*c);
  out+=line3(a,b,ink,1.1,.9);
  const [bx,by]=project(...b),[cx,cy]=project(...d.map(c=>2.1*c)),ang=Math.atan2(by-cy,bx-cx);
  const tip=(s)=>[bx-11*Math.cos(ang+s*.4),by-11*Math.sin(ang+s*.4)];
  out+=`<path d="M ${fmt(tip(-1)[0])} ${fmt(tip(-1)[1])} L ${fmt(bx)} ${fmt(by)} L ${fmt(tip(1)[0])} ${fmt(tip(1)[1])}" stroke="${ink}" stroke-width="1.1" fill="none" opacity=".9"/>`;
  return out;
}

/* The room: a wire-frame box with a slot in each side wall; a bundle of strands
   enters through one, tangles through the interior and leaves through the other. */
function artRoom(ink){
  const W=1.35,H=.85,D=1.05,r=rng(31);
  const C=[[-W,-H,-D],[W,-H,-D],[W,H,-D],[-W,H,-D],[-W,-H,D],[W,-H,D],[W,H,D],[-W,H,D]];
  const E=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  let out='';
  for(let i=0;i<=10;i++){
    const t=i/10;
    out+=line3([-W+2*W*t,H,-D],[-W+2*W*t,H,D],ink,.5,.16)+line3([-W,H,-D+2*D*t],[W,H,-D+2*D*t],ink,.5,.16);
  }
  for(const [a,b] of E)out+=line3(C[a],C[b],ink,.9,.6);
  for(const x of [-W,W]){
    const s=[[x,-.18,-.3],[x,-.18,.3],[x,.02,.3],[x,.02,-.3],[x,-.18,-.3]];
    out+=`<path d="${path(s.map(p=>project(...p)))}" stroke="${ink}" stroke-width=".9" fill="none" opacity=".75"/>`;
  }
  const spine=[[-2.6,-.08,0],[-W,-.08,0],[-.75,.35,.55],[-.1,-.45,-.35],[.45,.4,-.55],[.85,-.3,.45],[W,-.08,0],[2.6,-.08,0]];
  const env=[0,0,.5,.8,.8,.5,0,0];
  for(let s=0;s<44;s++){
    const oy=(s%11-5)/5*.07,oz=(Math.floor(s/11)-1.5)/1.5*.2;
    const P=spine.map((p,k)=>[p[0]+gauss(r)*.12*env[k],p[1]+oy+gauss(r)*.28*env[k],p[2]+oz+gauss(r)*.35*env[k]]);
    out+=`<path d="${path(catmull(P,14).map(p=>project(...p)))}" stroke="${ink}" stroke-width=".65" fill="none" opacity=".45"/>`;
  }
  return out;
}

const LABEL = {
  manifold:'a wire-frame torus',
  surface:'a saddle surface mesh',
  lattice:'a lattice of cubes',
  signal:'a wave bundle',
  attention:'attention arcs between tokens',
  stream:'strands threading through stacked layer planes',
  polytope:'eight feature directions packed as a square antiprism in a sphere',
  direction:'a point cloud split along a single direction',
  room:'strands passing through a wire-frame room'
};
const ART = {manifold:artManifold,surface:artSurface,signal:artSignal,attention:artAttention,stream:artStream,polytope:artPolytope,direction:artDirection,room:artRoom};

const outDir = join(root,'assets');
mkdirSync(outDir,{recursive:true});
for(const kind of Object.keys(LABEL)){
  for(const tone of ['dark','light']){
    const ink = tone==='dark' ? '#e8e8e8' : '#111111';
    const inner = kind==='lattice' ? artLattice(tone) : ART[kind](ink);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" role="img" aria-label="Mathematical study: ${LABEL[kind]}">${inner}</svg>\n`;
    const file = join(outDir,`field-${kind}-${tone}.svg`);
    writeFileSync(file,svg);
    console.log('wrote',file);
  }
}
