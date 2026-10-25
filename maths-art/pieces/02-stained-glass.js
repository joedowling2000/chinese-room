/* 02 · Stained Glass — non-linearity.
   A cathedral window drawn by a small ReLU network. Inside each pane the network
   is exactly linear; every lead line is a neuron switching off (its input
   crossing zero). Draw creases, remove the hinge, train it on two spirals. */
(() => {
  const { draw, rng, gauss, fmt, clamp } = Interiors;
  const MAX1 = 16, MAX2 = 10, MAX3 = 10;
  // parameter texture layout
  const OFF = { W1: 0, B1: 32, W2: 48, B2: 208, W3: 218, B3: 318, WO: 328, BO: 344 };

  // ---------- the network ----------
  function layer(nin, nout, r, scale) {
    const W = new Float64Array(nout * nin), b = new Float64Array(nout);
    for (let i = 0; i < W.length; i++) W[i] = gauss(r) * scale * Math.sqrt(2 / nin);
    for (let i = 0; i < nout; i++) b[i] = gauss(r) * 0.3;
    return { nin, nout, W, b };
  }
  function makeNet(depth, n1, seed) {
    const r = rng(seed);
    const sizes = [2, n1, 8, 8].slice(0, depth + 1);
    const layers = [];
    for (let i = 1; i < sizes.length; i++) layers.push(layer(sizes[i - 1], sizes[i], r, i === 1 ? 2.6 : 1.2));
    layers.push(layer(sizes[sizes.length - 1], 1, r, 1));
    return { layers, relu: true, r };
  }
  function forward(net, x, y, keep) {
    let a = [x, y];
    const acts = keep ? [a] : null, zs = keep ? [] : null;
    const L = net.layers;
    for (let li = 0; li < L.length; li++) {
      const { nin, nout, W, b } = L[li], z = new Array(nout), out = li === L.length - 1;
      for (let j = 0; j < nout; j++) { let s = b[j]; for (let i = 0; i < nin; i++) s += W[j * nin + i] * a[i]; z[j] = s; }
      a = out ? z : z.map(v => net.relu ? Math.max(0, v) : v);
      if (keep) { zs.push(z); acts.push(a); }
    }
    return keep ? { logit: a[0], zs, acts } : a[0];
  }
  function pattern(net, x, y) {
    let a = [x, y], key = '';
    const L = net.layers;
    for (let li = 0; li < L.length - 1; li++) {
      const { nin, nout, W, b } = L[li], next = [];
      for (let j = 0; j < nout; j++) { let s = b[j]; for (let i = 0; i < nin; i++) s += W[j * nin + i] * a[i]; key += s > 0 ? '1' : '0'; next.push(Math.max(0, s)); }
      a = next;
    }
    return key;
  }
  // full-batch Adam on binary cross-entropy
  function trainStep(net, data, lr) {
    const L = net.layers;
    const g = L.map(l => ({ W: new Float64Array(l.W.length), b: new Float64Array(l.b.length) }));
    let loss = 0, correct = 0;
    for (const d of data) {
      const { logit, zs, acts } = forward(net, d.x, d.y, true);
      const p = 1 / (1 + Math.exp(-logit));
      loss += -(d.c ? Math.log(p + 1e-9) : Math.log(1 - p + 1e-9));
      if ((p > 0.5) === !!d.c) correct++;
      let delta = [p - d.c];
      for (let li = L.length - 1; li >= 0; li--) {
        const { nin, nout, W } = L[li], a = acts[li];
        for (let j = 0; j < nout; j++) { g[li].b[j] += delta[j]; for (let i = 0; i < nin; i++) g[li].W[j * nin + i] += delta[j] * a[i]; }
        if (li === 0) break;
        const prev = new Array(nin).fill(0), zp = zs[li - 1];
        for (let i = 0; i < nin; i++) { let s = 0; for (let j = 0; j < nout; j++) s += W[j * nin + i] * delta[j]; prev[i] = net.relu ? (zp[i] > 0 ? s : 0) : s; }
        delta = prev;
      }
    }
    const n = data.length;
    net.t = (net.t || 0) + 1;
    const b1 = 0.9, b2 = 0.999;
    L.forEach((l, li) => {
      for (const key of ['W', 'b']) {
        const P = l[key], G = g[li][key];
        l['m' + key] ||= new Float64Array(P.length); l['v' + key] ||= new Float64Array(P.length);
        const m = l['m' + key], v = l['v' + key];
        for (let i = 0; i < P.length; i++) {
          const gi = G[i] / n;
          m[i] = b1 * m[i] + (1 - b1) * gi; v[i] = b2 * v[i] + (1 - b2) * gi * gi;
          P[i] -= lr * (m[i] / (1 - b1 ** net.t)) / (Math.sqrt(v[i] / (1 - b2 ** net.t)) + 1e-8);
        }
      }
    });
    return { loss: loss / n, acc: correct / n };
  }
  function resetAdam(net) { net.t = 0; net.layers.forEach(l => { delete l.mW; delete l.vW; delete l.mb; delete l.vb; }); }

  function spirals(seed) {
    const r = rng(seed), out = [];
    for (let c = 0; c < 2; c++) for (let i = 0; i < 90; i++) {
      const f = i / 89, rad = 0.1 + 0.88 * f, t = f * 1.6 * Math.PI * 2 + c * Math.PI;
      out.push({ x: rad * Math.cos(t) + gauss(r) * 0.018, y: rad * Math.sin(t) + gauss(r) * 0.018, c });
    }
    return out;
  }

  // ---------- rendering ----------
  const VS = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
  const FS = `#version 300 es
precision highp float;
uniform sampler2D uP;
uniform vec2 uCenter; uniform float uScale; uniform float uTime; uniform float uDpr;
uniform int uN1, uN2, uN3, uDepth, uRelu;
out vec4 o;
float P(int i){ return texelFetch(uP, ivec2(i, 0), 0).r; }
float hash(float n){ return fract(sin(n) * 43758.5453); }
float noise(vec2 x){ vec2 i = floor(x), f = fract(x); f = f*f*(3.-2.*f);
  float a = hash(dot(i, vec2(1., 57.))), b = hash(dot(i + vec2(1,0), vec2(1., 57.))), c = hash(dot(i + vec2(0,1), vec2(1., 57.))), d = hash(dot(i + vec2(1,1), vec2(1., 57.)));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }
// a pointed gothic arch: two circles meeting above a rectangle
float arch(vec2 q){
  float hw = 1.22, base = -1.12, spring = 0.1;
  if (q.y < spring) return max(abs(q.x) - hw, base - q.y);
  float r = 1.4;
  float dl = length(q - vec2(-hw + r, spring)) - r;
  float dr = length(q - vec2(hw - r, spring)) - r;
  return max(dl, dr);
}
void main(){
  vec2 q = (gl_FragCoord.xy - uCenter) / uScale;
  float lead = 1e9, code = 0.;
  float h1[16]; float h2[10]; float h3[10];
  for (int i = 0; i < 16; i++) {
    if (i >= uN1) break;
    float z = P(${OFF.W1} + i*2) * q.x + P(${OFF.W1} + i*2 + 1) * q.y + P(${OFF.B1} + i);
    lead = min(lead, abs(z) / max(fwidth(z), 1e-6));
    code += step(0., z) * (float(i) + 1.) * 1.37;
    h1[i] = uRelu == 1 ? max(z, 0.) : z;
  }
  float logit = P(${OFF.BO});
  if (uDepth == 1) { for (int i = 0; i < 16; i++) { if (i >= uN1) break; logit += P(${OFF.WO} + i) * h1[i]; } }
  else {
    for (int j = 0; j < 10; j++) {
      if (j >= uN2) break;
      float z = P(${OFF.B2} + j);
      for (int i = 0; i < 16; i++) { if (i >= uN1) break; z += P(${OFF.W2} + j*16 + i) * h1[i]; }
      lead = min(lead, abs(z) / max(fwidth(z), 1e-6));
      code += step(0., z) * (float(j) + 3.) * 7.91;
      h2[j] = uRelu == 1 ? max(z, 0.) : z;
    }
    if (uDepth == 2) { for (int j = 0; j < 10; j++) { if (j >= uN2) break; logit += P(${OFF.WO} + j) * h2[j]; } }
    else {
      for (int j = 0; j < 10; j++) {
        if (j >= uN3) break;
        float z = P(${OFF.B3} + j);
        for (int i = 0; i < 10; i++) { if (i >= uN2) break; z += P(${OFF.W3} + j*10 + i) * h2[i]; }
        lead = min(lead, abs(z) / max(fwidth(z), 1e-6));
        code += step(0., z) * (float(j) + 5.) * 13.3;
        h3[j] = uRelu == 1 ? max(z, 0.) : z;
      }
      for (int j = 0; j < 10; j++) { if (j >= uN3) break; logit += P(${OFF.WO} + j) * h3[j]; }
    }
  }
  if (uRelu == 0) lead = 1e9;
  float pr = 1. / (1. + exp(-logit));
  float hsh = hash(code + 0.123);
  vec3 cold = mix(vec3(0.04, 0.16, 0.52), vec3(0.06, 0.48, 0.58), hsh);
  vec3 deep = mix(vec3(0.20, 0.07, 0.42), vec3(0.04, 0.32, 0.20), hsh);
  vec3 warm = mix(vec3(0.78, 0.14, 0.10), vec3(0.98, 0.66, 0.14), hsh);
  vec3 c = mix(cold, warm, smoothstep(0.15, 0.85, pr));
  c = mix(c, deep, 0.35 * (1. - abs(pr * 2. - 1.)));
  // glass: linear shading within the pane, light from above, a rippled surface
  float shade = 0.78 + 0.22 * tanh(logit * 0.35);
  float sun = 0.75 + 0.45 * exp(-dot(q - vec2(0.15, 1.2), q - vec2(0.15, 1.2)) * 0.5);
  float rip = 0.88 + 0.16 * noise(q * 9. + vec2(uTime * 0.05, 0.)) + 0.06 * noise(q * 31.);
  c *= shade * sun * rip;
  float lw = 1.4 * uDpr;
  float leadMask = 1. - smoothstep(lw, lw + 1.2 * uDpr, lead);
  vec3 leadCol = vec3(0.035, 0.035, 0.045) + 0.05 * smoothstep(lw + 1.2 * uDpr, lw * 0.3, lead);
  c = mix(c, leadCol, leadMask);
  // the window frame and the stone around it
  float a = arch(q);
  float px = 1. / uScale * uDpr;
  vec3 stone = vec3(0.022, 0.024, 0.03) + 0.012 * noise(q * 14.);
  stone += vec3(0.9, 0.55, 0.35) * 0.05 * exp(-max(a, 0.) * 3.);
  float frame = smoothstep(0.035, 0.035 - 2. * px, abs(a + 0.017));
  vec3 col = a < 0. ? c : stone;
  col = mix(col, vec3(0.06, 0.06, 0.07), frame);
  o = vec4(pow(col, vec3(0.92)), 1.);
}`;

  function pack(net, buf) {
    buf.fill(0);
    const L = net.layers, hidden = L.length - 1;
    const l1 = L[0];
    for (let i = 0; i < l1.nout; i++) { buf[OFF.W1 + i * 2] = l1.W[i * 2]; buf[OFF.W1 + i * 2 + 1] = l1.W[i * 2 + 1]; buf[OFF.B1 + i] = l1.b[i]; }
    if (hidden >= 2) { const l = L[1]; for (let j = 0; j < l.nout; j++) { buf[OFF.B2 + j] = l.b[j]; for (let i = 0; i < l.nin; i++) buf[OFF.W2 + j * 16 + i] = l.W[j * l.nin + i]; } }
    if (hidden >= 3) { const l = L[2]; for (let j = 0; j < l.nout; j++) { buf[OFF.B3 + j] = l.b[j]; for (let i = 0; i < l.nin; i++) buf[OFF.W3 + j * 10 + i] = l.W[j * l.nin + i]; } }
    const lo = L[hidden];
    for (let i = 0; i < lo.nin; i++) buf[OFF.WO + i] = lo.W[i];
    buf[OFF.BO] = lo.b[0];
    return { n1: l1.nout, n2: hidden >= 2 ? L[1].nout : 0, n3: hidden >= 3 ? L[2].nout : 0, depth: hidden };
  }

  function makeGL(gl) {
    const p = (function () {
      const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
      return pr;
    })();
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(p, 'p');
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    const U = n => gl.getUniformLocation(p, n);
    const u = { P: U('uP'), center: U('uCenter'), scale: U('uScale'), time: U('uTime'), dpr: U('uDpr'), n1: U('uN1'), n2: U('uN2'), n3: U('uN3'), depth: U('uDepth'), relu: U('uRelu') };
    const buf = new Float32Array(512);
    return (net, view, t) => {
      const dims = pack(net, buf);
      gl.useProgram(p);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, 512, 1, 0, gl.RED, gl.FLOAT, buf);
      gl.uniform1i(u.P, 0);
      gl.uniform2f(u.center, view.cx * view.dpr, (view.h - view.cy) * view.dpr);
      gl.uniform1f(u.scale, view.s * view.dpr); gl.uniform1f(u.time, t); gl.uniform1f(u.dpr, view.dpr);
      gl.uniform1i(u.n1, dims.n1); gl.uniform1i(u.n2, dims.n2); gl.uniform1i(u.n3, dims.n3); gl.uniform1i(u.depth, dims.depth); gl.uniform1i(u.relu, net.relu ? 1 : 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
  }

  // CPU fallback (and gallery poster): low resolution, lead where the activation pattern changes
  function paintCPU(ctx, w, h, net, view, res = 4) {
    const cw = Math.ceil(w / res), ch = Math.ceil(h / res);
    const img = ctx.createImageData(cw, ch), keys = new Array(cw * ch);
    for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
      const x = (i * res - view.cx) / view.s, y = (view.cy - j * res) / view.s, idx = j * cw + i;
      const inside = Math.abs(x) < 1.22 && y > -1.12 && (y < 0.1 || Math.hypot(Math.abs(x) + 0.18, y - 0.1) < 1.4);
      if (!inside) { keys[idx] = null; img.data.set([6, 6, 8, 255], idx * 4); continue; }
      const key = net.relu ? pattern(net, x, y) : 'linear', logit = forward(net, x, y), p = 1 / (1 + Math.exp(-logit));
      keys[idx] = key;
      let hs = 0; for (let c = 0; c < key.length; c++) hs = (hs * 31 + key.charCodeAt(c) * (c + 1)) % 997;
      const v = hs / 997, sh = 0.78 + 0.22 * Math.tanh(logit * 0.35);
      const cold = [10 + 6 * v, 41 + 80 * v, 133 + 15 * v], warm = [199 + 50 * v, 36 + 132 * v, 26 + 10 * v], m = clamp((p - 0.15) / 0.7, 0, 1);
      img.data.set([(cold[0] + (warm[0] - cold[0]) * m) * sh, (cold[1] + (warm[1] - cold[1]) * m) * sh, (cold[2] + (warm[2] - cold[2]) * m) * sh, 255], idx * 4);
    }
    for (let j = 0; j < ch - 1; j++) for (let i = 0; i < cw - 1; i++) {
      const idx = j * cw + i, k0 = keys[idx];
      if (k0 && (k0 !== keys[idx + 1] || k0 !== keys[idx + cw]) && keys[idx + 1] && keys[idx + cw]) img.data.set([8, 8, 10, 255], idx * 4);
    }
    const tmp = document.createElement('canvas'); tmp.width = cw; tmp.height = ch;
    tmp.getContext('2d').putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, cw * res, ch * res);
    ctx.imageSmoothingEnabled = true;
  }

  function countPanes(net) {
    if (!net.relu) return 1;
    const seen = new Set();
    for (let i = 0; i <= 90; i++) for (let j = 0; j <= 90; j++) {
      const x = -1.2 + 2.4 * i / 90, y = -1.1 + 2.4 * j / 90;
      seen.add(pattern(net, x, y));
    }
    return seen.size;
  }

  Interiors.register({
    id: 'folding', no: '02', concept: 'Non-linearity', title: 'Stained Glass', accent: '#ffb347', webgl: true, maxDpr: 2,
    caption: 'A hinge in every neuron turns one sheet of glass into a window of panes.',
    label: 'A gothic stained-glass window whose panes are the linear regions of a small neural network.',
    mathsTitle: 'The hinge: max(0, z)',
    controls: [
      { type: 'toggle', id: 'train', label: 'Train on the two spirals', value: false },
      { type: 'choice', id: 'act', label: 'Activation', value: 'relu', options: [['relu', 'ReLU (hinge)'], ['linear', 'None (linear)']] },
      { type: 'choice', id: 'depth', label: 'Hidden layers', value: 2, options: [[1, '1'], [2, '2'], [3, '3']] },
      { type: 'button', id: 'shuffle', label: 'New random network' }
    ],
    prompts: [
      { do: 'Drag a straight line across the window to draw a crease.', saw: 'You added a neuron. On one side of its line it passes its input through; on the other it outputs zero. That switch is the lead line. Every edge in this window is some neuron switching off.' },
      { do: 'Draw three more creases.', saw: 'Each crease splits every pane it crosses. Look at the deeper lead lines: they bend where they meet earlier ones, because a second-layer neuron folds a sheet that is already folded.' },
      { do: 'Set the activation to <b>None (linear)</b>.', saw: 'One pane. Without the hinge every layer is just a matrix, and matrices multiply into a single matrix (remember Lattice). However deep the network, it can only draw one straight gradient.' },
      { do: 'Switch back to <b>ReLU</b> and turn on <b>Train</b>.', saw: 'Gradient descent is moving every crease at once until the warm panes cover one spiral and the cold panes the other. Only creases can bend a boundary around a spiral.' },
      { do: 'Try <b>3</b> hidden layers.', saw: 'Folds of folds. The number of panes a ReLU network can make grows exponentially with depth. This is one reason deep networks are so expressive.' }
    ],
    coda: 'Try training with the activation set to None: the loss gets stuck, because no straight line separates two spirals.',
    walk: [
      'A neuron computes a weighted sum of its inputs plus a bias, <b>z = w·x + b</b>, which is a linear function: a tilted plane. Then the <b>ReLU</b> hinge keeps it if positive and replaces it with zero if negative: <b>h = max(0, z)</b>.',
      'The line where z = 0 is a <b>crease</b>. On each side the neuron is linear; across it, the slope changes. Put many neurons together and the input plane is cut into convex regions. Inside each region the whole network is an ordinary linear function, and that region is a pane of glass.',
      'Pane colour is the network’s output: warm means “spiral A”, cold means “spiral B”. Brightness varies within a pane exactly linearly, like light through tinted glass.',
      'Remove the hinge and the creases vanish: a stack of linear layers is a single linear layer.'
    ],
    inside: [
      'Every transformer layer contains a feed-forward block: a matrix, a non-linearity, another matrix. It holds about two-thirds of the model’s parameters, and it is the only place where most of the computation stops being linear.',
      'Modern models use smooth cousins of ReLU (GELU, SwiGLU), so their creases are rounded rather than sharp, but the role is the same: without it, a hundred layers would collapse into one matrix.'
    ],
    honest: 'This is a real, tiny network (2 inputs, up to 16 + 8 + 8 hidden neurons) evaluated per pixel on your GPU; training is genuine full-batch Adam on 180 synthetic spiral points. The lead lines are drawn exactly where pre-activations cross zero.',
    refs: [['Montúfar et al. 2014 — On the number of linear regions of deep neural networks', 'https://arxiv.org/abs/1402.1869'], ['TensorFlow Playground', 'https://playground.tensorflow.org/'], ['Vaswani et al. 2017 — the position-wise feed-forward network (§3.3)', 'https://arxiv.org/abs/1706.03762']],

    create(k) {
      const { gl, ctx, octx } = k;
      let seed = 11, depth = 2;
      let net = makeNet(depth, 6, seed);
      const data = spirals(5);
      let render = null, stroke = null, creases = 0, stats = { loss: NaN, acc: NaN }, panes = countPanes(net), paneTimer = 0, trainedSteps = 0;
      if (gl) { try { render = makeGL(gl); } catch (e) { console.error(e); } }
      const view = { cx: 0, cy: 0, s: 1, w: 0, h: 0, dpr: 1 };
      const layout = () => {
        view.w = k.w; view.h = k.h; view.dpr = k.dpr;
        view.s = Math.min(k.w / 3.0, k.h / 3.1);
        view.cx = k.w > 900 ? k.w * 0.58 : k.w * 0.5; view.cy = k.h * (k.w < 760 ? 0.4 : 0.5) + 0.2 * view.s;
      };
      const toWorld = p => [(p.x - view.cx) / view.s, (view.cy - p.y) / view.s];
      const drone = k.sound.drone(146, 'triangle');

      function addCrease(a, b) {
        const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
        if (len < 0.08) return;
        const nx = -dy / len, ny = dx / len, kk = 3.2;
        const l1 = net.layers[0], nextL = net.layers[1];
        let idx = l1.nout;
        if (l1.nout >= MAX1) idx = (creases % MAX1);
        else {
          // grow layer 1 and the next layer's inputs
          const W = new Float64Array((l1.nout + 1) * 2); W.set(l1.W); l1.W = W;
          const B = new Float64Array(l1.nout + 1); B.set(l1.b); l1.b = B;
          const nin = nextL.nin, W2 = new Float64Array(nextL.nout * (nin + 1));
          for (let j = 0; j < nextL.nout; j++) { for (let i = 0; i < nin; i++) W2[j * (nin + 1) + i] = nextL.W[j * nin + i]; W2[j * (nin + 1) + nin] = gauss(net.r) * 0.8; }
          nextL.W = W2; nextL.nin = nin + 1; l1.nout++;
          resetAdam(net);
        }
        l1.W[idx * 2] = nx * kk; l1.W[idx * 2 + 1] = ny * kk; l1.b[idx] = -(nx * a[0] + ny * a[1]) * kk;
        creases++;
        panes = countPanes(net);
        k.sound.tone(330 + panes * 4, 0.5, 0.04);
        if (k.stage === 0) k.reach(0);
        if (k.stage === 1 && creases >= 4) k.reach(1);
      }

      return {
        resize: layout,
        frame(t, dt) {
          if (!view.w) layout();
          if (k.values.train) {
            for (let i = 0; i < 4; i++) stats = trainStep(net, data, 0.012);
            trainedSteps += 4;
            paneTimer += dt;
            if (paneTimer > 0.4) { paneTimer = 0; panes = countPanes(net); }
            if (k.stage === 3 && net.relu && (stats.acc > 0.93 || trainedSteps > 1600)) k.reach(3);
          }
          if (render) render(net, view, k.motion ? t : 0);
          else paintCPU(ctx, k.w, k.h, net, view, 4);

          octx.clearRect(0, 0, k.w, k.h);
          // the spirals, with misclassified points ringed
          for (const d of data) {
            const px = view.cx + d.x * view.s, py = view.cy - d.y * view.s;
            const wrong = (forward(net, d.x, d.y) > 0) !== !!d.c;
            octx.fillStyle = d.c ? '#ffe2a8' : '#bfefff';
            octx.strokeStyle = 'rgba(5,6,10,.9)'; octx.lineWidth = 2;
            octx.beginPath(); octx.arc(px, py, 3.6, 0, 7); octx.stroke(); octx.fill();
            if (wrong) { octx.strokeStyle = 'rgba(255,255,255,.8)'; octx.lineWidth = 1; octx.beginPath(); octx.arc(px, py, 7, 0, 7); octx.stroke(); }
          }
          if (stroke) {
            octx.setLineDash([6, 6]); octx.strokeStyle = 'rgba(255,255,255,.9)'; octx.lineWidth = 2;
            octx.beginPath(); octx.moveTo(stroke.a.x, stroke.a.y); octx.lineTo(stroke.b.x, stroke.b.y); octx.stroke(); octx.setLineDash([]);
          }
          const info = `${panes} pane${panes === 1 ? '' : 's'} · ${net.layers.slice(0, -1).map(l => l.nout).join(' + ')} neurons${Number.isFinite(stats.acc) ? ` · ${Math.round(stats.acc * 100)}% of points in the right colour` : ''}`;
          draw.label(octx, info, view.cx, Math.max(76, view.cy - 1.49 * view.s - 14), 'rgba(240,232,220,.85)', '12px "IBM Plex Mono", monospace', 'center');
          drone.set(110 + Math.min(40, panes) * 3, k.values.train ? 0.03 : 0.012);
        },
        down(p) { stroke = { a: p, b: p }; },
        move(p) { if (stroke && p.dragging) stroke.b = p; },
        up(p) {
          if (stroke) { const a = toWorld(stroke.a), b = toWorld(stroke.b); stroke = null; addCrease(a, b); }
        },
        control(id, v) {
          if (id === 'act') { net.relu = v === 'relu'; resetAdam(net); panes = countPanes(net); if (k.stage === 2 && !net.relu) k.reach(2); }
          if (id === 'depth') { depth = Number(v); const relu = net.relu; net = makeNet(depth, Math.max(6, net.layers[0].nout), ++seed); net.relu = relu; panes = countPanes(net); stats = { loss: NaN, acc: NaN }; if (k.stage === 4 && depth === 3) k.reach(4); }
          if (id === 'shuffle') { const relu = net.relu; net = makeNet(depth, 6, ++seed); net.relu = relu; creases = 0; panes = countPanes(net); stats = { loss: NaN, acc: NaN }; trainedSteps = 0; }
          if (id === 'train' && v) trainedSteps = 0;
        },
        maths() {
          const sizes = net.layers.slice(0, -1).map(l => l.nout);
          return `<p class="eq">z = W·x + b\nh = ReLU(z) = max(0, z)\noutput = sigmoid(w·h + b)</p>
            <div class="row"><span>activation</span><span class="hl">${net.relu ? 'ReLU' : 'none (linear)'}</span></div>
            <div class="row"><span>hidden neurons per layer</span><span>${sizes.join(' → ')}</span></div>
            <div class="row"><span>panes (linear regions) in view</span><span class="hl">${panes}</span></div>
            <div class="row"><span>creases you drew</span><span>${creases}</span></div>
            <div class="row"><span>loss (cross-entropy)</span><span>${Number.isFinite(stats.loss) ? fmt(stats.loss, 3) : '—'}</span></div>
            <div class="row"><span>points in the right colour</span><span>${Number.isFinite(stats.acc) ? Math.round(stats.acc * 100) + '%' : '—'}</span></div>`;
        }
      };
    },

    poster(ctx, w, h, t) {
      const st = this._poster ||= { net: makeNet(2, 12, 4), data: spirals(5), steps: 0 };
      if (st.steps < 900) { for (let i = 0; i < 6; i++) trainStep(st.net, st.data, 0.015); st.steps += 6; }
      const vs = Math.min(w / 3, h / 3.4), view = { cx: w / 2, cy: h * 0.46 + 0.2 * vs, s: vs, w, h, dpr: 2 };
      if (st.gl === undefined) {
        st.canvas = document.createElement('canvas');
        const gl = st.canvas.getContext('webgl2', { premultipliedAlpha: false, preserveDrawingBuffer: true });
        try { st.gl = gl; st.render = gl ? makeGL(gl) : null; } catch { st.render = null; }
      }
      if (st.render) {
        if (st.canvas.width !== w * 2 || st.canvas.height !== h * 2) { st.canvas.width = w * 2; st.canvas.height = h * 2; st.gl.viewport(0, 0, w * 2, h * 2); }
        st.render(st.net, view, t);
        ctx.drawImage(st.canvas, 0, 0, w, h);
      } else {
        ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, w, h);
        paintCPU(ctx, w, h, st.net, view, 3);
      }
    }
  });
})();
