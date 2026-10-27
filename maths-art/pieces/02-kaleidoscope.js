/* 02 · Kaleidoscope — the ReLU activation.
   Every mirror is one ReLU neuron: x′ = x + 2·ReLU(−(n·x − b))·n. On the positive
   side of its line a point passes straight through; on the negative side the neuron
   switches on and reflects it. Stacked one per layer, the folds cut the plane into
   linear regions, and every region shows the same patch of the folded plane, so a
   single brush stroke appears once per region. */
(() => {
  const { draw, rng, clamp } = Interiors;
  const MAX = 8, S = 3;           // up to eight folds; the paint texture covers folded space [-S, S]²
  const INKS = ['#ff4fa3', '#ffd166', '#5ef2d6', '#7aa2ff', '#c77dff', '#ff8a5c', '#a6ff8f'];
  const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

  // ---------- the folds ----------
  // A fold's mirror line turns slowly about its base angle while the kaleidoscope is turning.
  function params(f, tt) {
    const a = f.a0 + f.amp * Math.sin(f.w * tt + f.ph);
    return [Math.cos(a), Math.sin(a), f.b0 + 0.05 * Math.sin(f.bw * tt + f.ph * 1.7)];
  }
  const oscB = (f, tt) => 0.05 * Math.sin(f.bw * tt + f.ph * 1.7);

  // Apply the first `n` folds to the point (x, y). `code` records which neurons switched on.
  function fold(P, n, relu, x, y) {
    let code = 0;
    for (let i = 0; i < n; i++) {
      const nx = P[i][0], ny = P[i][1], z = nx * x + ny * y - P[i][2];
      if (z < 0) code |= 1 << i;
      if (!relu || z < 0) { x -= 2 * z * nx; y -= 2 * z * ny; }
    }
    return { x, y, code };
  }
  // Distance (in world units) to the nearest crease: each fold is an isometry, so |z| is the distance.
  function nearest(P, n, relu, x, y) {
    let best = { i: -1, d: Infinity };
    for (let i = 0; i < n; i++) {
      const nx = P[i][0], ny = P[i][1], z = nx * x + ny * y - P[i][2];
      if (Math.abs(z) < best.d) best = { i, d: Math.abs(z) };
      if (!relu || z < 0) { x -= 2 * z * nx; y -= 2 * z * ny; }
    }
    return best;
  }
  // Linear regions = distinct on/off patterns, sampled on a grid over a world rectangle.
  function regions(P, n, relu, x0, x1, y0, y1, rot, gx = 200, gy = 120) {
    if (!relu) return 1;
    const seen = new Set(), c = Math.cos(rot), s = Math.sin(rot);
    for (let j = 0; j < gy; j++) for (let i = 0; i < gx; i++) {
      const x = x0 + (x1 - x0) * (i + 0.5) / gx, y = y0 + (y1 - y0) * (j + 0.5) / gy;
      seen.add(fold(P, n, true, c * x - s * y, s * x + c * y).code);
    }
    return seen.size;
  }
  // Regions big enough to see: on/off patterns that cover at least `min` grid cells.
  function visibleRegions(P, n, x0, x1, y0, y1, gx, gy, min) {
    const tally = new Map();
    for (let j = 0; j < gy; j++) for (let i = 0; i < gx; i++) {
      const code = fold(P, n, true, x0 + (x1 - x0) * (i + 0.5) / gx, y0 + (y1 - y0) * (j + 0.5) / gy).code;
      tally.set(code, (tally.get(code) || 0) + 1);
    }
    let big = 0; tally.forEach(v => { if (v >= min) big++; });
    return big;
  }
  // Greedy: each new mirror is the candidate that leaves the most regions big enough to see,
  // so the folds spread across the view instead of crowding one point.
  function makeFolds(seed) {
    const r = rng(seed), folds = [];
    for (let i = 0; i < MAX; i++) {
      let best = null, bestScore = -1;
      for (let c = 0; c < 32; c++) {
        const f = { a0: r() * Math.PI * 2, b0: (r() - 0.5) * 2.2, amp: 0.06 + r() * 0.08, w: 0.12 + r() * 0.2, ph: r() * 6.283, bw: 0.1 + r() * 0.2 };
        const P = [...folds, f].map(g => params(g, 0));
        const score = visibleRegions(P, i + 1, -2.6, 2.6, -1.7, 1.7, 72, 48, 10) + r() * 0.5;
        if (score > bestScore) { bestScore = score; best = f; }
      }
      folds.push(best);
    }
    return folds;
  }

  // ---------- the paint, held in folded space ----------
  function makePaint(size) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const pc = c.getContext('2d', { willReadFrequently: true });
    const toTex = (x, y) => [(x / (2 * S) + 0.5) * size, (y / (2 * S) + 0.5) * size];
    const paint = { canvas: c, pc, size, dirty: null, version: 0 };
    const mark = (x, y, r) => {
      const d = paint.dirty;
      const a = [Math.floor(x - r - 2), Math.floor(y - r - 2), Math.ceil(x + r + 2), Math.ceil(y + r + 2)];
      paint.dirty = d ? [Math.min(d[0], a[0]), Math.min(d[1], a[1]), Math.max(d[2], a[2]), Math.max(d[3], a[3])] : a;
      paint.version++;
    };
    paint.ink = (x, y, rad, color) => {
      const [tx, ty] = toTex(x, y), r = rad / (2 * S) * size;
      const g = pc.createRadialGradient(tx, ty, 0, tx, ty, r);
      g.addColorStop(0, hexA(color, 0.9)); g.addColorStop(0.55, hexA(color, 0.45)); g.addColorStop(1, hexA(color, 0));
      pc.fillStyle = g; pc.beginPath(); pc.arc(tx, ty, r, 0, 7); pc.fill();
      mark(tx, ty, r);
    };
    paint.bead = (x, y, rad, color) => {
      const [tx, ty] = toTex(x, y), r = rad / (2 * S) * size;
      const g = pc.createRadialGradient(tx - r * 0.3, ty + r * 0.3, r * 0.05, tx, ty, r);
      g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.2, hexA(color, 1)); g.addColorStop(0.78, hexA(color, 0.85)); g.addColorStop(1, hexA(color, 0));
      pc.fillStyle = g; pc.beginPath(); pc.arc(tx, ty, r, 0, 7); pc.fill();
      mark(tx, ty, r);
    };
    paint.clear = () => { pc.clearRect(0, 0, size, size); paint.dirty = [0, 0, size, size]; paint.version++; };
    paint.seed = (seed, extra = []) => {
      paint.clear();
      const r = rng(seed);
      for (let i = 0; i < 28; i++) {
        const a = r() * 6.283, d = Math.sqrt(r()) * 2;
        paint.bead(Math.cos(a) * d, Math.sin(a) * d, 0.018 + r() * 0.035, INKS[i % INKS.length]);
      }
      extra.forEach(([x, y], i) => paint.bead(x, y, 0.02 + r() * 0.035, INKS[(i * 3) % INKS.length]));
    };
    return paint;
  }

  // ---------- rendering ----------
  const VS = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
  const FS = `#version 300 es
precision highp float;
uniform vec2 uCenter; uniform float uScale, uDpr, uTime, uRot, uLines;
uniform int uN, uRelu;
uniform vec3 uF[${MAX}];
uniform sampler2D uPaint;
out vec4 o;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 x){ vec2 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; } return s; }
vec3 pal(float t){ return .5 + .5 * cos(6.28318 * (t + vec3(0., .2, .45))); }
void main(){
  vec2 x = (gl_FragCoord.xy - uCenter) / uScale;
  float c = cos(uRot), s = sin(uRot);
  vec2 y = mat2(c, s, -s, c) * x;
  float line = 0., glow = 0., code = 0.;
  for (int i = 0; i < ${MAX}; i++) {
    if (i >= uN) break;
    vec2 n = uF[i].xy;
    float z = dot(n, y) - uF[i].z;
    float d = abs(z) / max(fwidth(z), 1e-6);
    float wgt = 1. - float(i) * .085;
    line = max(line, wgt * (1. - smoothstep(.55 * uDpr, 1.7 * uDpr, d)));
    glow = max(glow, wgt * (1. - smoothstep(0., 14. * uDpr, d)));
    code += step(z, 0.) * exp2(float(i));
    y -= 2. * (uRelu == 1 ? min(z, 0.) : z) * n;
  }
  // marbled ink, painted in the folded plane
  float r = length(y);
  vec2 q = y * 1.25;
  float tm = uTime * .04;
  vec2 w1 = vec2(fbm(q + vec2(0., tm)), fbm(q + vec2(5.2, 1.3 - tm)));
  float f = fbm(q + 1.8 * w1 + vec2(tm * .5, 0.));
  float band = .5 + .5 * sin(f * 16. + r * 1.5);
  vec3 ink = pal(f * 1.2 + .08 * r + .62);
  vec3 col = ink * (.06 + .8 * pow(band, 4.)) + ink * .07;
  col *= .55 + .45 * exp(-r * r * .12);
  col *= .93 + .07 * hash(vec2(code, 3.1));
  vec2 uv = y / ${(2 * S).toFixed(1)} + .5;
  if (uv.x > 0. && uv.y > 0. && uv.x < 1. && uv.y < 1.) {
    vec4 p = texture(uPaint, uv);
    col = mix(col, p.rgb, p.a * .92);
    col += p.rgb * p.a * .2;
  }
  col *= 1. - .45 * smoothstep(1., 2.8, length(x));
  col = mix(col, vec3(1., .95, .9), line * uLines * .62);
  col += vec3(.95, .6, 1.) * glow * glow * uLines * .07;
  o = vec4(col, 1.);
}`;

  function makeGL(gl) {
    const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(p, 'p');
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const U = n => gl.getUniformLocation(p, n);
    const u = { center: U('uCenter'), scale: U('uScale'), dpr: U('uDpr'), time: U('uTime'), rot: U('uRot'), lines: U('uLines'), n: U('uN'), relu: U('uRelu'), F: U('uF[0]'), paint: U('uPaint') };
    const F = new Float32Array(MAX * 3);
    let uploaded = -1, size = 0;
    return (st, view) => {
      gl.useProgram(p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
      const pt = st.paint;
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      if (size !== pt.size) { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pt.canvas); size = pt.size; uploaded = pt.version; pt.dirty = null; }
      else if (uploaded !== pt.version && pt.dirty) {
        const [a, b, c, d] = pt.dirty, x0 = clamp(a, 0, size), y0 = clamp(b, 0, size), x1 = clamp(c, 0, size), y1 = clamp(d, 0, size);
        if (x1 > x0 && y1 > y0) gl.texSubImage2D(gl.TEXTURE_2D, 0, x0, y0, x1 - x0, y1 - y0, gl.RGBA, gl.UNSIGNED_BYTE, pt.pc.getImageData(x0, y0, x1 - x0, y1 - y0).data);
        uploaded = pt.version; pt.dirty = null;
      }
      for (let i = 0; i < MAX; i++) F.set(st.P[i], i * 3);
      gl.uniform1i(u.paint, 0);
      gl.uniform2f(u.center, view.cx * view.dpr, (view.h - view.cy) * view.dpr);
      gl.uniform1f(u.scale, view.s * view.dpr); gl.uniform1f(u.dpr, view.dpr);
      gl.uniform1f(u.time, st.time); gl.uniform1f(u.rot, st.rot); gl.uniform1f(u.lines, st.lines ? 1 : 0);
      gl.uniform1i(u.n, st.n); gl.uniform1i(u.relu, st.relu ? 1 : 0);
      gl.uniform3fv(u.F, F);
      gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
  }

  // CPU fallback: low resolution, creases where the on/off pattern changes
  function paintCPU(ctx, w, h, st, view, res = 4) {
    const cw = Math.ceil(w / res), ch = Math.ceil(h / res), pt = st.paint;
    if (pt.cpuVersion !== pt.version) { pt.cpu = pt.pc.getImageData(0, 0, pt.size, pt.size).data; pt.cpuVersion = pt.version; }
    const img = ctx.createImageData(cw, ch), codes = new Int32Array(cw * ch), c = Math.cos(st.rot), s = Math.sin(st.rot);
    for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
      const x = (i * res - view.cx) / view.s, y = (view.cy - j * res) / view.s, idx = j * cw + i;
      const f = fold(st.P, st.n, st.relu, c * x - s * y, s * x + c * y);
      codes[idx] = f.code;
      const band = 0.5 + 0.5 * Math.sin(Math.sin(f.x * 2.1 + Math.cos(f.y * 1.7)) * 5 + Math.hypot(f.x, f.y) * 3);
      const k = (0.08 + 0.8 * band ** 4) * (1 - 0.45 * clamp((Math.hypot(x, y) - 1) / 1.8, 0, 1));
      let rgb = [255 * k * 0.9, 120 * k, 220 * k];
      const tx = Math.floor((f.x / (2 * S) + 0.5) * pt.size), ty = Math.floor((f.y / (2 * S) + 0.5) * pt.size);
      if (tx >= 0 && ty >= 0 && tx < pt.size && ty < pt.size) {
        const o = (ty * pt.size + tx) * 4, a = pt.cpu[o + 3] / 255;
        rgb = rgb.map((v, q) => v * (1 - a) + pt.cpu[o + q] * a);
      }
      img.data.set([rgb[0], rgb[1], rgb[2], 255], idx * 4);
    }
    if (st.lines && st.relu) for (let j = 0; j < ch - 1; j++) for (let i = 0; i < cw - 1; i++) {
      const idx = j * cw + i;
      if (codes[idx] !== codes[idx + 1] || codes[idx] !== codes[idx + cw]) img.data.set([255, 240, 230, 255], idx * 4);
    }
    const tmp = document.createElement('canvas'); tmp.width = cw; tmp.height = ch;
    tmp.getContext('2d').putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, cw * res, ch * res);
    ctx.imageSmoothingEnabled = true;
  }

  const PROMPTS = [
    { do: 'Drag across the glass to paint a stroke.', saw: 'One stroke, many copies. Each copy sits in a different linear region of the network, and the folds send every one of them to the same point, so the network gives them all the same output.' },
    { do: 'Add a layer with the <b>Layers</b> slider.', saw: 'One more ReLU neuron, in a new layer, folded the plane again. A fold can split every region it crosses, so each layer can double the count.' },
    { do: 'Drag one of the bright creases.', saw: 'A crease is where one neuron’s input z crosses zero: the hinge of max(0, z). On one side the neuron is off and points pass through; on the other it switches on and reflects them. Every copy of that crease moves together.' },
    { do: 'Set the activation to <b>None (linear)</b>.', saw: 'One region, one copy. Without the ReLU every neuron reflects the whole plane, and reflections compose into a single rigid motion. However many layers you stack, a linear network is one linear map.' },
    { do: 'Switch back to <b>ReLU</b> and set <b>Layers</b> to 8.', saw: '' }
  ];

  Interiors.register({
    id: 'folding', no: '02', concept: 'Non-linearity', title: 'Kaleidoscope', maths: 'ReLU activation', eq: 'h = max(0, z)',
    accent: '#f58ad0', webgl: true, maxDpr: 1.75,
    caption: 'Every ReLU neuron is a mirror that folds the plane. Paint once, and the folds repeat it in every region.',
    label: 'A kaleidoscope whose mirrors are ReLU neurons folding the plane; every mirrored copy is one linear region of the network.',
    mathsTitle: 'One neuron, one fold',
    controls: [
      { type: 'choice', id: 'act', label: 'Activation', value: 'relu', options: [['relu', 'ReLU (fold)'], ['linear', 'None (linear)']] },
      { type: 'range', id: 'folds', label: 'Layers (one ReLU neuron each)', min: 1, max: MAX, step: 1, value: 5, fmt: v => String(v) },
      { type: 'toggle', id: 'turn', label: 'Turn the kaleidoscope', value: true },
      { type: 'toggle', id: 'lines', label: 'Show the creases', value: true },
      { type: 'button', id: 'clear', label: 'Clear the paint' },
      { type: 'button', id: 'shuffle', label: 'New mirrors' }
    ],
    prompts: PROMPTS,
    coda: 'A ReLU network is a stack of folds. Inside every region it is exactly linear; depth is what lets a handful of neurons make hundreds of regions.',
    walk: [
      'Each mirror is one neuron. It measures which side of a line the point is on, <b>z = n·x − b</b>, and applies the hinge <b>ReLU(u) = max(0, u)</b> to −z.',
      'On the positive side ReLU(−z) = 0, so the point passes through untouched. On the negative side the neuron switches on and adds <b>2·ReLU(−z)·n</b>, which reflects the point across the line: <b>x′ = x + 2·ReLU(−z)·n</b>.',
      'The next layer folds a plane that is already folded, so its crease bends wherever it crosses an earlier one. Inside each region every neuron is either on or off, so the whole network is one fixed linear map there. All the regions land on the same patch of the folded plane, which is why each brush stroke appears once per region.',
      'Each fold can at most double the number of regions, so <b>k</b> layers can make up to <b>2ᵏ</b>. The same k neurons side by side in one layer can cut the plane into at most <b>1 + k + k(k−1)/2</b>.',
      'Without the ReLU every neuron reflects the whole plane. Reflections compose into one rigid motion: one region, however many layers.'
    ],
    inside: [
      'Every transformer layer contains a feed-forward block: a matrix, a non-linearity, another matrix. It holds about two-thirds of the model’s parameters, and it is where the computation stops being linear.',
      'Modern models use smooth cousins of ReLU (GELU, SwiGLU), so their creases are rounded rather than sharp, but the role is the same: without the activation, a hundred layers would collapse into one matrix.'
    ],
    honest: 'The folds are real ReLU units, x′ = x + 2·ReLU(−(n·x − b))·n, applied in sequence to every pixel on your GPU. Trained networks don’t fold with mirror symmetry: their weights are learned and their hinges bend rather than reflect. The counting argument is the one Montúfar et al. used to show why depth multiplies linear regions. The marbled colours and glass beads are decoration painted in the folded plane; region counts are sampled on a grid across the view.',
    refs: [['Montúfar et al. 2014 — On the number of linear regions of deep neural networks', 'https://arxiv.org/abs/1402.1869'], ['Raghu et al. 2017 — On the expressive power of deep neural networks', 'https://arxiv.org/abs/1606.05336'], ['Vaswani et al. 2017 — the position-wise feed-forward network (§3.3)', 'https://arxiv.org/abs/1706.03762']],

    create(k) {
      const { gl, ctx, octx } = k;
      let seed = 3, folds = makeFolds(seed), tt = 0, count = 1, countTimer = 1, strokes = 0;
      let render = null;
      if (gl) { try { render = makeGL(gl); } catch (e) { console.error(e); } }
      const paint = makePaint(render ? 1536 : 512);
      const st = { paint, P: folds.map(f => params(f, 0)), n: k.values.folds, relu: true, rot: 0, time: 0, lines: true };
      const view = { cx: 0, cy: 0, s: 1, w: 0, h: 0, dpr: 1 };
      let seeded = false, drag = null, hover = null, at = null;
      const layout = () => {
        view.w = k.w; view.h = k.h; view.dpr = k.dpr;
        view.s = Math.min(k.w, k.h) / 3.4;
        view.cx = k.w > 900 ? k.w * 0.56 : k.w * 0.5; view.cy = k.h * (k.w < 760 ? 0.42 : 0.5);
      };
      const world = p => [(p.x - view.cx) / view.s, (view.cy - p.y) / view.s];
      const turned = p => { const [x, y] = world(p), c = Math.cos(st.rot), s = Math.sin(st.rot); return [c * x - s * y, s * x + c * y]; };
      const folded = p => { const [x, y] = turned(p); return fold(st.P, st.n, st.relu, x, y); };
      const drone = k.sound.drone(146, 'triangle');
      function seedPaint() {
        const r = rng(seed * 7 + 1), extra = [];
        for (let i = 0; i < 10; i++) { const f = folded({ x: view.cx + (r() - 0.5) * view.s * 2.4, y: view.cy + (r() - 0.5) * view.s * 2.4 }); extra.push([f.x, f.y]); }
        paint.seed(seed, extra);
      }
      function sync() {
        st.P = folds.map(f => params(f, tt));
        st.n = k.values.folds; st.relu = k.values.act === 'relu'; st.lines = !!k.values.lines && st.relu; // no creases without the hinge
        st.rot = 0.05 * tt; st.time = k.motion ? k.t : 0;
      }
      function recount() {
        const x0 = -view.cx / view.s, x1 = (view.w - view.cx) / view.s, y0 = (view.cy - view.h) / view.s, y1 = view.cy / view.s;
        count = regions(st.P, st.n, st.relu, x0, x1, y0, y1, st.rot, 200, Math.max(60, Math.round(200 * view.h / Math.max(1, view.w))));
      }
      function stampAlong(a, b) {
        const len = Math.hypot(b.x - a.x, b.y - a.y), steps = Math.max(1, Math.ceil(len / 3));
        const color = INKS[strokes % INKS.length];
        for (let i = 1; i <= steps; i++) {
          const f = folded({ x: a.x + (b.x - a.x) * i / steps, y: a.y + (b.y - a.y) * i / steps });
          paint.ink(f.x, f.y, 0.05, color);
        }
        return len;
      }
      function maybeFinal() {
        if (k.stage !== 4 || !st.relu || st.n !== MAX) return;
        recount();
        const one = 1 + MAX + MAX * (MAX - 1) / 2;
        PROMPTS[4].saw = count > one
          ? `Eight ReLU neurons, one per layer: ${count} regions in view. The same eight side by side in a single layer could cut the plane into at most ${one}. Depth multiplies regions; width only adds them.`
          : `Eight layers can make up to 256 regions, because each fold can double the count. The same eight neurons side by side in one layer could make at most ${one}. Depth multiplies regions; width only adds them.`;
        k.reach(4);
      }

      return {
        resize() { layout(); countTimer = 1; },
        frame(t, dt) {
          if (!view.w) layout();
          if (k.values.turn && k.motion && !drag) tt += dt;
          sync();
          if (!seeded) { seeded = true; seedPaint(); }
          countTimer += dt;
          if (countTimer > 0.3) { countTimer = 0; recount(); }
          if (render) render(st, view);
          else paintCPU(ctx, k.w, k.h, st, view, 4);

          octx.clearRect(0, 0, k.w, k.h);
          const narrow = k.w < 560, layers = `${st.n} layer${st.n === 1 ? '' : 's'}`;
          const info = !st.relu ? `1 linear region · ${layers}, no ReLU`
            : narrow ? `${count} regions · ${layers} of ReLU` : `${count} linear region${count === 1 ? '' : 's'} in view · ${st.n} ReLU neuron${st.n === 1 ? '' : 's'}, one per layer`;
          draw.label(octx, info, view.cx, k.w < 760 ? 92 : 76, 'rgba(255,236,248,.88)', '12px "IBM Plex Mono", monospace', 'center');
          const mark = drag?.mode === 'crease' ? drag : hover;
          if (mark && st.lines) {
            const x = mark.x, y = mark.y - 22;
            octx.strokeStyle = 'rgba(255,240,250,.95)'; octx.lineWidth = 1.6;
            octx.beginPath(); octx.moveTo(x - 16, y + 5); octx.lineTo(x - 2, y + 5); octx.lineTo(x + 10, y - 7); octx.stroke();
            draw.label(octx, `neuron ${mark.i + 1}: z = 0 · max(0, z) bends here`, x + 18, y, 'rgba(255,240,250,.95)', '11px "IBM Plex Mono", monospace');
          }
          drone.set(98 + Math.min(80, count) * 1.5, drag ? 0.03 : 0.012);
        },
        down(p) {
          const [x, y] = turned(p), near = nearest(st.P, st.n, st.relu, x, y);
          if (st.lines && near.d * view.s < 10) { drag = { mode: 'crease', i: near.i, x: p.x, y: p.y, moved: false }; return; }
          drag = { mode: 'paint', last: p, len: 0 };
          stampAlong(p, p);
        },
        move(p) {
          if (drag && p.dragging) {
            if (drag.mode === 'paint') { drag.len += stampAlong(drag.last, p); drag.last = p; if (drag.len > 30 && Math.random() < 0.08) k.sound.tone(330 + count * 3, 0.25, 0.02); }
            else {
              const f = folds[drag.i], [x, y] = turned(p), pre = fold(st.P, drag.i, st.relu, x, y), P = st.P[drag.i];
              f.b0 = P[0] * pre.x + P[1] * pre.y - oscB(f, tt);
              drag.x = p.x; drag.y = p.y; drag.moved = true;
              sync(); countTimer = 1;
            }
            return;
          }
          const [x, y] = turned(p), near = nearest(st.P, st.n, st.relu, x, y);
          hover = near.d * view.s < 10 ? { i: near.i, x: p.x, y: p.y } : null;
          k.over.style.cursor = hover && st.lines ? 'grab' : 'crosshair';
          at = folded(p).code;
        },
        up() {
          if (drag?.mode === 'paint') { strokes++; if (drag.len > 40) k.reach(0); }
          if (drag?.mode === 'crease' && drag.moved) { k.sound.tone(392, 0.5, 0.04); k.reach(2); }
          drag = null;
        },
        leave() { hover = null; },
        control(id, v) {
          if (id === 'folds') { sync(); recount(); k.sound.tone(220 * 2 ** (v / 6), 0.5, 0.04); if (k.stage === 1 && v > 5) k.reach(1); maybeFinal(); }
          if (id === 'act') { sync(); recount(); if (k.stage === 3 && v === 'linear') k.reach(3); maybeFinal(); }
          if (id === 'clear') paint.clear();
          if (id === 'shuffle') { folds = makeFolds(++seed); tt = 0; sync(); seedPaint(); recount(); }
        },
        maths() {
          const n = st.n, one = 1 + n + n * (n - 1) / 2, code = at;
          const bits = Number.isInteger(code) ? Array.from({ length: n }, (_, i) => (code >> i) & 1 ? '●' : '○').join(' ') : '—';
          return `<p class="eq">z = n·x − b\nx′ = x + 2·ReLU(−z)·n\nReLU(u) = max(0, u)</p>
            <div class="row"><span>activation</span><span class="hl">${st.relu ? 'ReLU' : 'none (linear)'}</span></div>
            <div class="row"><span>layers (one neuron each)</span><span>${n}</span></div>
            <div class="row"><span>linear regions in view</span><span class="hl">${count}</span></div>
            <div class="row"><span>most ${n} folds can make</span><span>${st.relu ? 2 ** n : 1}</span></div>
            <div class="row"><span>most ${n} neurons in one layer can make</span><span>${st.relu ? one : 1}</span></div>
            <div class="row"><span>neurons on at the pointer</span><span>${st.relu ? bits : '—'}</span></div>`;
        },
        destroy() { k.over.style.cursor = ''; }
      };
    },

    poster(ctx, w, h, t) {
      const st = this._poster ||= (() => {
        const folds = makeFolds(3), paint = makePaint(512);
        paint.seed(3);
        return { folds, paint, s: { paint, P: [], n: 6, relu: true, rot: 0, time: 0, lines: true } };
      })();
      const s = st.s;
      s.P = st.folds.map(f => params(f, t * 0.8)); s.rot = 0.05 * t; s.time = t;
      const vs = Math.min(w, h) / 3.2, view = { cx: w / 2, cy: h * 0.42, s: vs, w, h, dpr: 2 };
      if (st.gl === undefined) {
        st.canvas = document.createElement('canvas');
        const gl = st.canvas.getContext('webgl2', { premultipliedAlpha: false, preserveDrawingBuffer: true });
        try { st.gl = gl; st.render = gl ? makeGL(gl) : null; } catch { st.render = null; }
      }
      if (st.render) {
        if (st.canvas.width !== w * 2 || st.canvas.height !== h * 2) { st.canvas.width = w * 2; st.canvas.height = h * 2; st.gl.viewport(0, 0, w * 2, h * 2); }
        st.render(s, view);
        ctx.drawImage(st.canvas, 0, 0, w, h);
      } else paintCPU(ctx, w, h, s, view, 3);
    }
  });
})();
