/* 06 · Crowded Sky — high dimensions and superposition.
   More concepts than dimensions. Each concept is a direction; they push apart to
   minimise their overlap and settle into polygons and polyhedra. Lighting several
   at once shows the cost: interference that makes absent concepts appear. */
(() => {
  const { draw, rng, gauss, fmt, clamp } = Interiors;
  const NAMES = ['cat', 'Paris', 'code', 'sad', 'French', 'plural', 'red', 'jazz', 'Python', 'winter', 'number', 'angry', 'Tokyo', 'fish', 'legal', 'poem'];
  const LAV = '196,178,255', WHITE = '244,242,255', GHOST = '255,120,170';
  const THRESH = 0.5;

  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
  const unit = v => { const n = Math.hypot(...v) || 1; return v.map(x => x / n); };

  // features repel only when they overlap positively (negative overlap is harmless after a ReLU)
  function relax(V, iters, lr = 0.06) {
    const n = V.length;
    for (let it = 0; it < iters; it++) {
      const G = V.map(v => v.map(() => 0));
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const c = dot(V[i], V[j]), f = 2 * Math.max(0, c) + 0.12 * c;
        for (let d = 0; d < V[i].length; d++) G[i][d] += f * V[j][d];
      }
      for (let i = 0; i < n; i++) V[i] = unit(V[i].map((x, d) => x - lr * G[i][d]));
    }
  }
  function randomDirs(n, d, r) { return Array.from({ length: n }, () => unit(Array.from({ length: d }, () => gauss(r)))); }

  function rot3(yaw, pitch) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    return v => { const x = cy * v[0] + sy * v[2], z = -sy * v[0] + cy * v[2]; return [x, cp * v[1] - sp * z, sp * v[1] + cp * z]; };
  }

  const nebulae = new Map();
  function nebula(w, h) {
    const key = `${Math.round(w)}x${Math.round(h)}`;
    if (nebulae.has(key)) return nebulae.get(key);
    const c = document.createElement('canvas'); c.width = Math.max(1, w / 2); c.height = Math.max(1, h / 2);
    const x = c.getContext('2d'), r = rng(77);
    x.fillStyle = '#04040a'; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'lighter';
    const hues = [[120, 90, 220], [60, 110, 200], [200, 90, 170], [90, 60, 160]];
    for (let i = 0; i < 26; i++) {
      const cx = r() * c.width, cy = r() * c.height, rad = (0.12 + r() * 0.35) * Math.max(c.width, c.height), col = hues[i % hues.length];
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0, `rgba(${col},${0.05 + r() * 0.06})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
    }
    nebulae.set(key, c);
    return c;
  }
  function sky(ctx, w, h, stars, t) {
    ctx.drawImage(nebula(w, h), 0, 0, w, h);
    for (const s of stars) {
      ctx.fillStyle = `rgba(220,215,255,${s.a * (0.6 + 0.4 * Math.sin(t * s.f + s.p))})`;
      ctx.fillRect(s.x * w, s.y * h, s.r, s.r);
    }
  }

  // draw the feature directions on a sphere (d = 3) or circle (d = 2)
  function constellation(ctx, V, d, view, opts) {
    const { cx, cy, R, R3 } = view, P = v => { const q = d === 3 ? R3(v) : [v[0], v[1], 0]; return [cx + q[0] * R, cy - q[1] * R, q[2]]; };
    ctx.lineWidth = 1;
    // globe
    if (d === 3) {
      ctx.strokeStyle = `rgba(${LAV},.09)`;
      for (let k = -2; k <= 2; k++) {
        ctx.beginPath();
        for (let a = 0; a <= 64; a++) { const th = a / 64 * Math.PI * 2, lat = k * 0.5, p = P([Math.cos(lat) * Math.cos(th), Math.sin(lat), Math.cos(lat) * Math.sin(th)]); a ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
        ctx.stroke();
      }
      for (let k = 0; k < 6; k++) {
        ctx.beginPath();
        for (let a = 0; a <= 64; a++) { const ph = a / 64 * Math.PI * 2, lo = k / 6 * Math.PI, p = P([Math.sin(ph) * Math.cos(lo), Math.cos(ph), Math.sin(ph) * Math.sin(lo)]); a ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
        ctx.stroke();
      }
    }
    const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.05, cx, cy, R);
    body.addColorStop(0, 'rgba(150,130,255,.10)'); body.addColorStop(0.7, 'rgba(60,40,140,.06)'); body.addColorStop(1, 'rgba(196,178,255,.14)');
    ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(${LAV},.3)`;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

    ctx.globalCompositeOperation = 'lighter';
    // interference filaments along great circles between overlapping pairs
    for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) {
      const c = dot(V[i], V[j]);
      if (c < 0.04) continue;
      const om = Math.acos(clamp(c, -1, 1)), so = Math.sin(om) || 1;
      const pts = [];
      for (let s = 0; s <= 28; s++) {
        const u = s / 28, a = Math.sin((1 - u) * om) / so, b = Math.sin(u * om) / so;
        pts.push(P(V[i].map((x, k) => a * x + b * V[j][k])));
      }
      for (const [lw, al] of [[6 + c * 10, 0.07], [0.8 + c * 2.5, 0.9]]) {
        ctx.strokeStyle = `rgba(${c > 0.4 ? '255,170,220' : LAV},${Math.min(1, c * 1.4) * al})`; ctx.lineWidth = lw;
        ctx.beginPath(); pts.forEach((p, n) => n ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
      }
    }
    // feature arrows
    const order = V.map((v, i) => [i, P(v)[2]]).sort((a, b) => a[1] - b[1]);
    const tips = [];
    for (const [i] of order) {
      const p = P(V[i]), depth = d === 3 ? 0.45 + 0.55 * (p[2] + 1) / 2 : 1;
      const st = opts.state[i] || {};
      const col = st.ghost ? GHOST : st.on ? WHITE : LAV;
      const flick = st.ghost ? 0.6 + 0.4 * Math.sin(opts.t * 22 + i) : 1;
      ctx.strokeStyle = `rgba(${col},${0.35 * depth * flick})`; ctx.lineWidth = st.on ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p[0], p[1]); ctx.stroke();
      draw.glowDot(ctx, p[0], p[1], (st.on ? 60 : st.ghost ? 46 : 30) * depth, `rgba(${col},${(st.on ? 0.75 : 0.4) * depth * flick})`);
      draw.glowDot(ctx, p[0], p[1], 9 * depth, `rgba(255,255,255,${0.9 * depth * flick})`);
      const fl = (st.on ? 34 : 18) * depth;
      ctx.strokeStyle = `rgba(${col},${0.5 * depth * flick})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p[0] - fl, p[1]); ctx.lineTo(p[0] + fl, p[1]); ctx.moveTo(p[0], p[1] - fl); ctx.lineTo(p[0], p[1] + fl); ctx.stroke();
      tips[i] = [p[0], p[1], depth];
    }
    ctx.globalCompositeOperation = 'source-over';
    for (const [i] of order) {
      const [x, y, depth] = tips[i], st = opts.state[i] || {};
      ctx.fillStyle = st.ghost ? `rgb(${GHOST})` : '#fff';
      ctx.beginPath(); ctx.arc(x, y, st.on ? 4.5 : 3, 0, 7); ctx.fill();
      if (st.miss) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.stroke(); }
      if (opts.labels) draw.label(ctx, NAMES[i], x + 9, y - 10, st.ghost ? `rgb(${GHOST})` : `rgba(240,236,255,${0.45 + 0.55 * depth})`, `${st.on ? 600 : 400} 13px "DM Sans", sans-serif`);
    }
    return tips;
  }

  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const signed = x => (x >= 0 ? '+' : '') + fmt(x);
  const MONO = '"IBM Plex Mono", monospace';
  // sentences as sets of concepts (indices into NAMES); one is offered only when all its concepts exist
  const SENTS = [
    ['A cat in Paris.', [0, 1]], ['Cats.', [0, 5]], ['French code.', [2, 4]], ['A sad cat in Paris.', [0, 1, 3]],
    ['Les chats de Paris.', [0, 1, 4, 5]], ['Sad French cats.', [0, 3, 4, 5]], ['Red cats.', [0, 5, 6]],
    ['Sad jazz in Paris.', [1, 3, 7]], ['Python code.', [2, 8]], ['Paris in winter.', [1, 9]],
    ['Seven red cats.', [0, 5, 6, 10]], ['Angry jazz in Tokyo.', [7, 11, 12]], ['Red fish in winter.', [6, 9, 13]],
    ['Angry legal code.', [2, 11, 14]], ['A sad poem about winter in Tokyo.', [3, 9, 12, 15]], ['A French poem about cats.', [0, 4, 5, 15]]
  ].map(([text, ids]) => ({ text, ids }));
  // the many-dimensions sky: N_BIG random directions, read in their first d coordinates
  const N_BIG = 2000, D_MAX = 1000;
  const sphere = v => v.space !== 1000, manyD = v => v.space === 1000;

  Interiors.register({
    id: 'dimensions', no: '06', concept: 'High dimensions', title: 'Crowded Sky', maths: 'Superposition', eq: 'z = Σ aᵢvᵢ  ·  âⱼ = vⱼ·z', accent: '#c4b2ff',
    you: 'You are one concept among too many, sharing too few dimensions.',
    hear: 'Each concept is a note. The ones you light sound clearly; a ghost — a concept the model wrongly reads back — sounds too, faint and slightly out of tune. A clean chord means a clean readout. In many dimensions the out-of-tune note is as loud as the share of the sky that is ghosts.',
    caption: 'More concepts than dimensions. They share the space, and pay for it in interference.',
    label: 'Feature directions as stars on a rotating sphere, joined by glowing filaments where they interfere. A ring on the sphere marks which concepts the model reads as present. In many dimensions, a sky of two thousand stars with the lit and the wrongly-read ones marked.',
    mathsTitle: 'Superposition',
    controls: [
      { type: 'choice', id: 'space', label: 'Space', value: 3, options: [[2, '2D circle'], [3, '3D sphere'], [1000, 'Many dimensions']] },
      { type: 'range', id: 'n', label: 'Concepts (features)', min: 2, max: 16, step: 1, value: 6, fmt: v => String(v), show: sphere },
      { type: 'button', id: 'say', label: 'Read a sentence', show: sphere },
      { type: 'button', id: 'near', label: 'Light three neighbouring concepts', show: sphere },
      { type: 'toggle', id: 'stream', label: 'Stream random sentences', value: false, show: sphere },
      { type: 'range', id: 'p', label: 'How often each concept appears', min: 0.03, max: 0.6, step: 0.01, value: 0.08, fmt: v => Math.round(v * 100) + '%', show: sphere },
      { type: 'range', id: 'hd', label: 'Dimensions', min: 0.3, max: 3, step: 0.02, value: 0.48, fmt: v => Math.round(10 ** v).toLocaleString('en'), show: manyD },
      { type: 'range', id: 'lit', label: 'Concepts in the sentence', min: 1, max: 60, step: 1, value: 5, fmt: v => String(v), show: manyD },
      { type: 'button', id: 'again', label: 'Another sentence', show: manyD }
    ],
    prompts: [
      { do: 'Watch the stars settle, then raise <b>Concepts</b> above 6.', saw: 'More concepts than dimensions: they cannot all be at right angles, so they spread as evenly as they can. The glowing filaments are interference, pairs of concepts whose directions overlap.' },
      { do: 'Tap one star to switch that concept on.', saw: 'The white comet is the model’s vector z: the sum of the concepts that are on. The ring drawn round it is the reading rule. A concept reads as present when its direction falls inside the ring, where vⱼ·z is above 0.5.' },
      { do: 'Tap a second star, and watch the neurons n1, n2, n3: the axes of the space.', saw: 'The same three neurons answered both concepts, in different mixtures. No neuron belongs to one concept, and each answers to several: that is a polysemantic neuron. The concept is the direction, not the neuron.' },
      { do: 'Light three or four neighbouring stars at once (or press <b>Light three neighbouring concepts</b>).', saw: 'Ghosts. Every concept you add lengthens z and widens the ring, until it takes in concepts that are absent (pink). Superposition only works while few concepts are active at the same time.' },
      { do: 'Turn on <b>Stream</b>, then slide <b>How often each concept appears</b> from low to high.', saw: 'Rare concepts can share space and still be read back almost every time. Common ones collide. The second figure is what the model could read if it gave each dimension to one concept and dropped the rest.' },
      { do: 'Switch <b>Space</b> to <b>Many dimensions</b>. Two thousand concepts now share the space. Raise <b>Dimensions</b> until the ghosts are gone.', saw: 'Two thousand concepts, a few hundred dimensions, and the sentence reads back exactly. The fan shows why: each ray is the angle between two random directions, and as dimensions grow they crowd around 90°. There is room for far more nearly-perpendicular directions than there are dimensions.' },
      { do: 'Now raise <b>Concepts in the sentence</b> until the ghosts return.', saw: 'Room is not only a matter of dimensions. Interference grows like √(active ÷ dimensions), so the more concepts are on at once, the more dimensions it takes to keep them apart.' }
    ],
    coda: 'Tap the sky for another sentence. Back on the sphere you can drag to turn it: the shapes the stars settle into — pairs, triangles, pentagons, tetrahedra, octahedra — are the same geometry found in trained toy models.',
    walk: [
      'A model represents each concept it knows as a <b>direction</b> in its vector space. With d dimensions there are only d mutually perpendicular directions, but models appear to represent far more concepts than that.',
      'They do it by <b>superposition</b>: concepts share the space at angles other than 90°. The vector for a sentence is the sum of the directions of the concepts present: <b>z = Σ aᵢvᵢ</b>.',
      'Reading concept j back out means taking a dot product: <b>vⱼ·z = aⱼ + Σᵢ≠ⱼ aᵢ(vⱼ·vᵢ)</b>. The second term is <b>interference</b>. Here a concept counts as detected when its readout exceeds 0.5, which is the same as lying within an angle <b>acos(0.5 ÷ |z|)</b> of z: the ring on the sphere.',
      'The axes of the space are its <b>neurons</b>: neuron k is simply the k-th coordinate of z. With more concepts than axes, every axis lies near several concept directions, so every neuron answers to several concepts.',
      'Interference is small when few concepts are active together, so sparse concepts can share. In high dimensions random directions are almost perpendicular: with k concepts active in d dimensions the interference on any other concept is about <b>√(k/d)</b>, so there is enormous room.'
    ],
    inside: [
      'A model’s residual stream has a few thousand dimensions, yet interpretability research finds many more features than that: dictionary-learning studies of production models extract millions of interpretable directions.',
      'Superposition is one reason single neurons are hard to interpret: a neuron sits at the intersection of many feature directions and responds to several unrelated things (polysemanticity).'
    ],
    honest: 'The stars are arranged by gradient descent on a simple interference energy (positive overlaps penalised), which reproduces the polytopes reported in Toy Models of Superposition; it is not a trained network. Readout uses a plain dot product with a fixed threshold of 0.5. The concept names are labels only, and the example sentences are hand-tagged with them: which concept turns up as a ghost depends on where the stars happened to settle, not on meaning. The two thousand directions in the many-dimensions sky are random, not learned, and a star’s place on the screen says nothing about its direction.',
    refs: [['Elhage et al. 2022 — Toy models of superposition', 'https://transformer-circuits.pub/2022/toy_model/index.html'], ['Templeton et al. 2024 — Scaling monosemanticity', 'https://transformer-circuits.pub/2024/scaling-monosemanticity/index.html']],

    create(k) {
      const { ctx, octx } = k;
      const r = rng(21);
      let d = 3, V = randomDirs(6, 3, r);
      const active = new Set();
      let yaw = 0.4, pitch = 0.35, drag = null, lastTouch = -99, tips = [], sawLo = false, sawHi = false, said = null, lastSent = -1;
      const stream = { timer: 0, log: [], solo: [] };
      const stars = Array.from({ length: 260 }, () => ({ x: r(), y: r(), r: r() < 0.1 ? 1.6 : 1, a: 0.15 + r() * 0.5, f: 0.5 + r() * 2, p: r() * 6 }));
      let hd = null, big = null, manyGhosted = false, litMoved = false;
      const drone = k.sound.drone(196, 'sine'), voices = Array.from({ length: 16 }, () => k.sound.drone(196, 'sine'));

      const view = () => { const R = Math.min(k.w * 0.3, k.h * (k.w < 760 ? 0.26 : 0.34)); return { cx: k.w * (k.w > 900 ? 0.47 : 0.5), cy: k.h * 0.52, R, R3: rot3(yaw, pitch) }; };
      function readout() {
        const z = Array(d).fill(0);
        active.forEach(i => V[i].forEach((x, j) => { z[j] += x; }));
        const reads = V.map(v => dot(v, z));
        return { z, reads };
      }
      function setN(n) {
        while (V.length < n) V.push(unit(Array.from({ length: d }, () => gauss(r))));
        while (V.length > n) { V.pop(); if (active.delete(V.length)) said = null; }
      }
      function setD(nd) {
        if (nd === 1000) return;
        d = nd;
        V = V.map(v => unit(nd === 2 ? [v[0], v[1]] : [v[0], v[1], v.length > 2 ? v[2] : gauss(r) * 0.3]));
      }
      function speak() {
        const ok = SENTS.map((_, i) => i).filter(i => i !== lastSent && SENTS[i].ids.every(j => j < V.length));
        if (!ok.length) return;
        lastSent = ok[Math.floor(Math.random() * ok.length)];
        active.clear(); SENTS[lastSent].ids.forEach(j => active.add(j)); said = SENTS[lastSent].text;
      }
      function hdData() {
        const dims = Math.round(10 ** k.values.hd);
        if (hd && hd.dims === dims) return hd;
        const rr = rng(dims * 17 + 3), M = 46, vs = randomDirs(M, dims, rr), angles = [];
        for (let i = 0; i < M; i++) for (let j = i + 1; j < M; j++) angles.push(Math.acos(clamp(dot(vs[i], vs[j]), -1, 1)));
        const mean = angles.reduce((a, b) => a + Math.abs(b - Math.PI / 2), 0) / angles.length;
        return (hd = { dims, angles, spread: mean });
      }

      // the big sky is built once, the first time it is needed
      function bigSky() {
        if (big) return big;
        const rr = rng(4242), M = new Float32Array(N_BIG * D_MAX), pos = new Float32Array(N_BIG * 3);
        for (let i = 0; i < M.length; i += 2) {
          let u = 0; while (!u) u = rr();
          const m = Math.sqrt(-2 * Math.log(u)), a = 2 * Math.PI * rr();
          M[i] = m * Math.cos(a); M[i + 1] = m * Math.sin(a);
        }
        for (let i = 0; i < pos.length; i += 3) { pos[i] = rr(); pos[i + 1] = rr(); pos[i + 2] = rr() * 6.28; }
        return (big = { M, pos, lit: [], on: new Uint8Array(N_BIG), reads: new Float32Array(N_BIG), key: '', ver: 0, dims: 0, ghosts: 0, missed: 0 });
      }
      function manyDraw(fresh) {
        const B = bigSky(), want = k.values.lit;
        if (fresh) { B.lit.forEach(i => { B.on[i] = 0; }); B.lit = []; }
        while (B.lit.length > want) B.on[B.lit.pop()] = 0;
        while (B.lit.length < want) { const i = Math.floor(Math.random() * N_BIG); if (!B.on[i]) { B.on[i] = 1; B.lit.push(i); } }
        B.ver++;
      }
      function manyRead() {
        const B = bigSky(), dims = Math.min(D_MAX, Math.round(10 ** k.values.hd));
        if (B.lit.length !== k.values.lit) manyDraw(false);
        const key = dims + ':' + B.ver;
        if (key === B.key) return B;
        const { M, reads } = B, z = new Float32Array(dims);
        for (const a of B.lit) {
          const off = a * D_MAX; let n = 0;
          for (let j = 0; j < dims; j++) n += M[off + j] * M[off + j];
          n = 1 / Math.sqrt(n || 1);
          for (let j = 0; j < dims; j++) z[j] += M[off + j] * n;
        }
        let ghosts = 0, missed = 0;
        for (let i = 0; i < N_BIG; i++) {
          const off = i * D_MAX; let s = 0, n = 0;
          for (let j = 0; j < dims; j++) { const x = M[off + j]; s += x * z[j]; n += x * x; }
          reads[i] = s / Math.sqrt(n || 1);
          if (B.on[i]) { if (reads[i] <= THRESH) missed++; } else if (reads[i] > THRESH) ghosts++;
        }
        B.key = key; B.dims = dims; B.ghosts = ghosts; B.missed = missed;
        return B;
      }

      // every direction within acos(THRESH/|z|) of z reads above the threshold: draw that boundary
      function ring(z, vw) {
        const L = Math.hypot(...z);
        if (L <= THRESH) return;
        const al = Math.acos(THRESH / L), zh = z.map(x => x / L);
        ctx.globalCompositeOperation = 'lighter';
        if (d === 3) {
          const u = unit(cross(zh, Math.abs(zh[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0])), w2 = cross(zh, u), ca = Math.cos(al), sa = Math.sin(al), pts = [];
          for (let s = 0; s <= 96; s++) {
            const ph = s / 96 * Math.PI * 2, c = Math.cos(ph) * sa, e = Math.sin(ph) * sa;
            const q = vw.R3(zh.map((x, i) => x * ca + u[i] * c + w2[i] * e));
            pts.push([vw.cx + q[0] * vw.R, vw.cy - q[1] * vw.R, q[2]]);
          }
          for (let s = 0; s < 96; s++) {
            const a = pts[s], b = pts[s + 1], front = (a[2] + b[2]) / 2 > 0;
            if (!front && s % 2) continue;
            ctx.strokeStyle = `rgba(${WHITE},${front ? 0.75 : 0.28})`; ctx.lineWidth = front ? 1.6 : 1;
            ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
          }
        } else {
          const th = -Math.atan2(zh[1], zh[0]);
          ctx.fillStyle = `rgba(${WHITE},.05)`;
          ctx.beginPath(); ctx.moveTo(vw.cx, vw.cy); ctx.arc(vw.cx, vw.cy, vw.R, th - al, th + al); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = `rgba(${WHITE},.75)`; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(vw.cx, vw.cy, vw.R + 7, th - al, th + al); ctx.stroke();
          ctx.lineWidth = 1; ctx.strokeStyle = `rgba(${WHITE},.3)`;
          for (const a of [th - al, th + al]) { ctx.beginPath(); ctx.moveTo(vw.cx, vw.cy); ctx.lineTo(vw.cx + (vw.R + 12) * Math.cos(a), vw.cy + (vw.R + 12) * Math.sin(a)); ctx.stroke(); }
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      function frameMany(t) {
        const B = manyRead(), H = hdData(), { pos, reads, on } = B, w = k.w, h = k.h;
        const X = i => 10 + pos[i * 3] * (w - 20), Y = i => 10 + pos[i * 3 + 1] * (h - 20);
        // two thousand concepts: quiet, wrongly read (pink), or in the sentence (white)
        ctx.fillStyle = `rgba(${LAV},.34)`;
        for (let i = 0; i < N_BIG; i++) if (!on[i] && reads[i] <= THRESH) ctx.fillRect(X(i), Y(i), 1.5, 1.5);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < N_BIG; i++) {
          if (on[i] || reads[i] <= THRESH) continue;
          const x = X(i), y = Y(i), fl = k.motion ? 0.6 + 0.4 * Math.sin(t * 9 + pos[i * 3 + 2]) : 0.85;
          ctx.fillStyle = `rgba(${GHOST},${0.16 * fl})`; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill();
          ctx.fillStyle = `rgba(${GHOST},${fl})`; ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
        }
        for (const i of B.lit) {
          const x = X(i), y = Y(i);
          draw.glowDot(ctx, x, y, 44, `rgba(${WHITE},.7)`); draw.glowDot(ctx, x, y, 9, 'rgba(255,255,255,.95)');
          ctx.strokeStyle = `rgba(${WHITE},.5)`; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x - 26, y); ctx.lineTo(x + 26, y); ctx.moveTo(x, y - 26); ctx.lineTo(x, y + 26); ctx.stroke();
          if (reads[i] <= THRESH) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.stroke(); }
        }
        ctx.globalCompositeOperation = 'source-over';

        // the protractor: one ray per pair of random directions, at their angle
        const cx = w * 0.5, cy = h * 0.78, R = Math.min(w * 0.3, h * 0.4);
        ctx.strokeStyle = `rgba(${LAV},.3)`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, 0); ctx.stroke();
        for (let a = 0; a <= 180; a += 10) {
          const th = Math.PI + a / 180 * Math.PI, l = a % 90 ? 6 : 14;
          ctx.beginPath(); ctx.moveTo(cx + (R - l) * Math.cos(th), cy + (R - l) * Math.sin(th)); ctx.lineTo(cx + R * Math.cos(th), cy + R * Math.sin(th)); ctx.stroke();
          if (a % 45 === 0) draw.label(octx, `${a}°`, cx + (R - 28) * Math.cos(th), cy + (R - 28) * Math.sin(th), `rgba(${LAV},.75)`, `11px ${MONO}`, 'center');
        }
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(${WHITE},0.06)`;
        for (const ang of H.angles) {
          const th = Math.PI + (Math.PI - ang);
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(th), cy + R * Math.sin(th)); ctx.stroke();
        }
        const bins = new Array(90).fill(0);
        H.angles.forEach(a => bins[Math.min(89, Math.floor(a / Math.PI * 90))]++);
        const mx = Math.max(...bins);
        bins.forEach((b, i) => {
          const th = Math.PI + (Math.PI - (i + 0.5) / 90 * Math.PI), l = b / mx * R * 0.25;
          ctx.strokeStyle = `rgba(${LAV},.85)`; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(cx + (R + 4) * Math.cos(th), cy + (R + 4) * Math.sin(th)); ctx.lineTo(cx + (R + 4 + l) * Math.cos(th), cy + (R + 4 + l) * Math.sin(th)); ctx.stroke();
        });
        ctx.globalCompositeOperation = 'source-over';
        draw.label(octx, `angles between random directions in ${H.dims.toLocaleString('en')} dimensions · typically ${fmt(H.spread * 180 / Math.PI, 1)}° from 90°`, cx, cy - R * 1.25 - 22, `rgba(${LAV},.85)`, `11px ${MONO}`, 'center');

        const nl = B.lit.length, bad = B.ghosts || B.missed;
        draw.label(octx, `${N_BIG.toLocaleString('en')} concepts share ${B.dims.toLocaleString('en')} dimension${B.dims === 1 ? '' : 's'} · ${nl} ${nl === 1 ? 'is' : 'are'} in this sentence`, w / 2, 86, 'rgba(236,232,255,.9)', `12px ${MONO}`, 'center');
        draw.label(octx, bad
          ? `${B.ghosts ? `the model also reads ${B.ghosts.toLocaleString('en')} that ${B.ghosts === 1 ? 'is' : 'are'} not there` : ''}${B.ghosts && B.missed ? '  ·  ' : ''}${B.missed ? `and loses ${B.missed}` : ''}`
          : 'and the model reads back exactly those', w / 2, 104, bad ? `rgb(${GHOST})` : `rgba(${LAV},.9)`, `12px ${MONO}`, 'center');

        drone.set(110 + 300 / Math.sqrt(H.dims), 0.02);
        voices.forEach((v, i) => v.set(i === 0 ? 392 : i === 1 ? 392 * 1.035 : 196, i === 0 ? 0.035 : i === 1 ? 0.05 * Math.min(1, B.ghosts / 200) : 0));
        if (B.ghosts) manyGhosted = true;
        if (!k.did(5) && manyGhosted && !bad) k.reach(5);
        if (!k.did(6) && litMoved && B.ghosts) k.reach(6);
        k.over.style.cursor = 'pointer';
      }

      return {
        frame(t, dt) {
          const many = k.values.space === 1000;
          sky(ctx, k.w, k.h, many ? [] : stars, k.motion ? t : 0);
          octx.clearRect(0, 0, k.w, k.h);
          if (many) return frameMany(t);

          if (!drag && k.motion && d === 3 && t - lastTouch > 8) yaw += dt * 0.1;
          relax(V, 3);
          const vw = view();
          const { z, reads } = readout();
          const state = V.map((_, i) => {
            const on = active.has(i), hit = reads[i] > THRESH;
            return { on, ghost: !on && hit && active.size > 0, miss: on && !hit };
          });
          // the neurons: the axes of the space, each carrying one coordinate of z
          ctx.strokeStyle = `rgba(${LAV},.24)`; ctx.lineWidth = 1; ctx.setLineDash([3, 6]);
          for (let j = 0; j < d; j++) {
            const e = Array(d).fill(0); e[j] = 1.07;
            const q = d === 3 ? vw.R3(e) : [e[0], e[1], 0], ax = q[0] * vw.R, ay = -q[1] * vw.R;
            ctx.beginPath(); ctx.moveTo(vw.cx - ax, vw.cy - ay); ctx.lineTo(vw.cx + ax, vw.cy + ay); ctx.stroke();
            draw.label(octx, `n${j + 1}${active.size ? ' ' + signed(z[j]) : ''}`, vw.cx + ax * 1.04, vw.cy + ay * 1.04 + 4, `rgba(${LAV},.85)`, `10px ${MONO}`, 'center');
          }
          ctx.setLineDash([]);
          tips = constellation(ctx, V, d, vw, { state, t, labels: true });
          // the representation: the sum of active directions
          if (active.size) {
            ring(z, vw);
            const q = d === 3 ? vw.R3(z) : [z[0], z[1], 0], L = Math.hypot(...q), s = Math.min(1, 1.7 / L);
            const ex = vw.cx + q[0] * vw.R * s, ey = vw.cy - q[1] * vw.R * s;
            ctx.globalCompositeOperation = 'lighter';
            for (const [lw, al] of [[10, 0.08], [3, 0.9]]) { ctx.strokeStyle = `rgba(${WHITE},${al})`; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(vw.cx, vw.cy); ctx.lineTo(ex, ey); ctx.stroke(); }
            draw.glowDot(ctx, ex, ey, 26, `rgba(${WHITE},.8)`);
            ctx.globalCompositeOperation = 'source-over';
            draw.label(octx, `z  (|z| = ${fmt(Math.hypot(...z))})`, ex + 12, ey + 14, '#fff', `12px ${MONO}`);
            draw.label(octx, Math.hypot(...z) > THRESH ? 'inside the ring: read as present' : 'too short to read anything', ex + 12, ey + 29, 'rgba(244,242,255,.65)', `10px ${MONO}`);
          }
          // readout bars
          if (k.w > 760) {
            const x0 = k.w - 250, y0 = Math.max(90, k.h * 0.5 - V.length * 9), bw = 120;
            draw.label(octx, 'readout  vⱼ·z', x0, y0 - 18, `rgba(${LAV},.8)`, `11px ${MONO}`);
            octx.strokeStyle = 'rgba(255,255,255,.25)'; octx.setLineDash([2, 3]);
            octx.beginPath(); octx.moveTo(x0 + 100 + THRESH * bw / 1.5, y0 - 8); octx.lineTo(x0 + 100 + THRESH * bw / 1.5, y0 + V.length * 18); octx.stroke(); octx.setLineDash([]);
            V.forEach((_, i) => {
              const y = y0 + i * 18, v = clamp(reads[i], -0.5, 1.5), st = state[i];
              draw.label(octx, NAMES[i], x0 + 56, y + 4, st.ghost ? `rgb(${GHOST})` : st.on ? '#fff' : 'rgba(220,215,240,.6)', '11px "DM Sans", sans-serif', 'right');
              octx.fillStyle = st.ghost ? `rgb(${GHOST})` : st.on ? `rgb(${WHITE})` : `rgba(${LAV},.5)`;
              const x = x0 + 100, wv = v * bw / 1.5;
              octx.fillRect(Math.min(x, x + wv), y, Math.abs(wv), 7);
            });
          }
          // neuron panel: what each axis carries now, and which concepts it answers to
          const room = vw.cx - vw.R - 56;
          if (room >= 200) {
            const x0 = 28, y0 = Math.max(112, k.h * 0.5 - 30 - d * 46), bw = 96, xm = x0 + 30 + bw / 2;
            draw.label(octx, 'neurons  (the axes)', x0, y0 - 20, `rgba(${LAV},.8)`, `11px ${MONO}`);
            for (let j = 0; j < d; j++) {
              const y = y0 + j * 46, wv = clamp(z[j], -1.5, 1.5) / 1.5 * bw / 2;
              draw.label(octx, `n${j + 1}`, x0, y + 7, '#fff', `11px ${MONO}`);
              octx.fillStyle = 'rgba(255,255,255,.22)'; octx.fillRect(xm, y - 3, 1, 13);
              octx.fillStyle = `rgb(${WHITE})`; octx.fillRect(Math.min(xm, xm + wv), y, Math.abs(wv), 7);
              draw.label(octx, signed(z[j]), x0 + 38 + bw, y + 7, active.size ? '#fff' : 'rgba(220,215,240,.5)', `11px ${MONO}`);
              const fans = V.map((v, i) => [v[j], i]).filter(q => Math.abs(q[0]) >= 0.4).sort((a, b) => Math.abs(b[0]) - Math.abs(a[0])).slice(0, room < 250 ? 3 : 4).map(q => (q[0] < 0 ? '−' : '') + NAMES[q[1]]);
              draw.label(octx, fans.length ? `answers to ${fans.join(', ')}` : 'answers to nothing strongly', x0, y + 24, `rgba(${LAV},.72)`, '11px "DM Sans", sans-serif');
            }
          }
          // streaming sentences: random sparse sets, decoded or not
          const wide = k.w > 760;
          if (k.values.stream) {
            stream.timer -= dt;
            if (stream.timer <= 0) {
              stream.timer = 0.7;
              active.clear(); said = null;
              V.forEach((_, i) => { if (Math.random() < k.values.p) active.add(i); });
              const rd = readout().reads, ok = V.every((_, i) => (rd[i] > THRESH) === active.has(i));
              stream.log.push(ok); if (stream.log.length > 30) stream.log.shift();
              // one concept per dimension: the first d are read perfectly, the rest cannot be represented at all
              stream.solo.push([...active].every(i => i < d)); if (stream.solo.length > 30) stream.solo.shift();
              if (active.size) k.sound.tone(ok ? 523 : 233, 0.18, 0.025, ok ? 'sine' : 'triangle');
            }
            const share = a => a.length ? a.filter(Boolean).length / a.length : 0, acc = share(stream.log), sy = wide ? 62 : vw.cy + vw.R + 34;
            draw.label(octx, `stream: ${Math.round(acc * 100)}% of the last ${stream.log.length} sentences read back perfectly`, vw.cx, sy, acc > 0.8 ? 'rgba(236,232,255,.9)' : `rgb(${GHOST})`, `12px ${MONO}`, 'center');
            if (wide && V.length > d) draw.label(octx, `one concept per dimension, the other ${V.length - d} dropped: ${Math.round(share(stream.solo) * 100)}%`, vw.cx, sy + 18, `rgba(${LAV},.8)`, `12px ${MONO}`, 'center');
          }
          // the same readout, in words: what went in, and what the model believes came out
          if (active.size) {
            const names = f => V.map((_, i) => f(state[i]) ? NAMES[i] : null).filter(Boolean);
            const ghosts = names(s => s.ghost), missed = names(s => s.miss), y = wide && !k.values.stream ? 62 : vw.cy + vw.R + (k.values.stream && !wide ? 54 : 34);
            draw.label(octx, `${said ? `“${said}”  contains: ` : 'this sentence contains: '}${names(s => s.on).join(', ')}`, vw.cx, y, 'rgba(236,232,255,.9)', `12px ${MONO}`, 'center');
            draw.label(octx, ghosts.length || missed.length
              ? `${ghosts.length ? `the model also reads: ${ghosts.join(', ')}` : ''}${ghosts.length && missed.length ? '  ·  ' : ''}${missed.length ? `and loses: ${missed.join(', ')}` : ''}`
              : 'and the model reads back exactly that', vw.cx, y + 18, ghosts.length || missed.length ? `rgb(${GHOST})` : `rgba(${LAV},.85)`, `12px ${MONO}`, 'center');
          }
          const meanAbs = (() => { let s = 0, c = 0; for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) { s += Math.abs(dot(V[i], V[j])); c++; } return c ? s / c : 0; })();
          drone.set(98, 0.012 + meanAbs * 0.03);
          // lit concepts sing in tune; ghosts sing faintly and a little sharp
          voices.forEach((v, i) => { const st = state[i]; v.set(k.sound.note(i, 196) * (st && st.ghost ? 1.035 : 1), st && st.on ? 0.045 : st && st.ghost ? 0.03 : 0); });
          if (!k.did(3) && state.some(s => s.ghost) && active.size >= 3) k.reach(3);
          k.over.style.cursor = drag ? 'grabbing' : 'pointer';
        },
        get tips() { return tips; },
        get many() { return big; },
        down(p) { drag = { x: p.x, y: p.y, moved: false }; lastTouch = k.t; },
        move(p) {
          if (!p.dragging) { let near = false; tips.forEach(tp => { if (tp && Math.hypot(tp[0] - p.x, tp[1] - p.y) < 60) near = true; }); if (near) lastTouch = k.t; }
          if (drag && p.dragging) {
            if (Math.hypot(p.x - drag.x, p.y - drag.y) > 6) drag.moved = true;
            if (d === 3) { yaw += p.dx * 0.008; pitch = clamp(pitch + p.dy * 0.008, -1.4, 1.4); }
          }
        },
        up() { drag = null; },
        tap(p) {
          if (k.values.space === 1000) { manyDraw(true); k.sound.pluck(392, 0.05, 0.6); return; }
          let best = -1, bd = 30;
          tips.forEach((tp, i) => { if (!tp) return; const dd = Math.hypot(tp[0] - p.x, tp[1] - p.y) - tp[2] * 4; if (dd < bd) { bd = dd; best = i; } });
          if (best < 0) return;
          if (k.values.stream) k.set('stream', false);
          said = null;
          active.has(best) ? active.delete(best) : active.add(best);
          k.sound.tone(330 * 2 ** (best / 12), 0.4, 0.04);
          if (!k.did(1) && active.size === 1) k.reach(1);
          else if (!k.did(2) && active.size === 2) k.reach(2);
        },
        control(id, v) {
          if (id === 'n') { setN(v); if (!k.did(0) && v > 6) k.reach(0); }
          if (id === 'space') { setD(v); active.clear(); said = null; if (k.values.stream) k.set('stream', false); }
          if (id === 'stream') { active.clear(); said = null; }
          if (id === 'say' && k.values.space !== 1000) {
            if (k.values.stream) k.set('stream', false);
            speak(); k.sound.tone(349, 0.4, 0.04);
          }
          // light one concept and the two whose directions overlap it most: the surest way to raise a ghost
          if (id === 'near' && V.length >= 3 && k.values.space !== 1000) {
            if (k.values.stream) k.set('stream', false);
            const base = Math.floor(Math.random() * V.length);
            const near = V.map((v, i) => [i === base ? -9 : dot(v, V[base]), i]).sort((a, b) => b[0] - a[0]).slice(0, 2).map(q => q[1]);
            active.clear(); said = null; [base, ...near].forEach(i => active.add(i));
            k.sound.tone(392, 0.4, 0.04);
          }
          if (id === 'p' || id === 'stream') {
            if (k.values.p < 0.1) sawLo = true;
            if (k.values.p > 0.35) sawHi = true;
            if (!k.did(4) && k.values.stream && sawLo && sawHi) k.reach(4);
            stream.log = []; stream.solo = [];
          }
          if (id === 'again') { manyDraw(true); k.sound.pluck(392, 0.05, 0.6); }
          if (id === 'lit' && big && !(big.ghosts || big.missed)) litMoved = true; // raised from a clean readback
        },

        async demo(i) {
          const s = k.show, tipOf = n => [tips[n][0], tips[n][1]];
          const toSphere = async () => { if (k.values.space === 1000) { await s.press('space', 3); await s.wait(600); } if (k.values.stream) await s.press('stream', false); };
          const toMany = async () => { if (k.values.space !== 1000) { await s.press('space', 1000); await s.wait(500); } };
          const front = () => tips.map((tp, n) => [tp[2], n]).sort((a, b) => b[0] - a[0]).map(q => q[1]); // nearest stars first
          if (i === 0) { await toSphere(); await s.slide('n', 9, 1400); }
          if (i === 1) { await toSphere(); active.clear(); said = null; await s.tap(...tipOf(front()[0])); }
          if (i === 2) {
            await toSphere();
            if (active.size !== 1) { active.clear(); said = null; await s.tap(...tipOf(front()[0])); }
            await s.tap(...tipOf(front().find(n => !active.has(n))));
          }
          if (i === 3) {
            await toSphere();
            if (V.length < 10) { await s.slide('n', 10, 1200); await s.wait(1500); }
            for (let n = 0; n < 5 && !k.did(3); n++) { await s.press('near'); await s.wait(700); }
          }
          if (i === 4) { await toSphere(); await s.press('stream', true); await s.slide('p', 0.05, 800); await s.wait(2500); await s.slide('p', 0.5, 2200); await s.wait(2500); }
          if (i === 5) { await toMany(); if (k.values.lit > 8) await s.slide('lit', 5); await s.slide('hd', 0.6, 600); await s.wait(900); await s.slide('hd', 2.6, 3200); }
          if (i === 6) { await toMany(); if (k.values.lit > 8) await s.slide('lit', 5); if (k.values.hd < 2.4) await s.slide('hd', 2.6, 1500); await s.wait(600); await s.slide('lit', 55, 2600); }
        },
        maths() {
          if (k.values.space === 1000) {
            const H = hdData(), B = manyRead(), nl = B.lit.length;
            return `<p class="eq">cos θ = u·v   for random unit u, v ∈ ℝᵈ\nspread of θ around 90° ≈ 1/√d\ninterference on an absent concept ≈ √(k/d)</p>
              <div class="row"><span>concepts</span><span>${N_BIG.toLocaleString('en')}</span></div>
              <div class="row"><span>dimensions d</span><span class="hl">${B.dims.toLocaleString('en')}</span></div>
              <div class="row"><span>concepts in the sentence k</span><span>${nl}</span></div>
              <div class="row"><span>√(k/d)</span><span>${fmt(Math.sqrt(nl / B.dims))}</span></div>
              <div class="row"><span>absent concepts read above 0.5 (ghosts)</span><span class="hl">${B.ghosts.toLocaleString('en')}</span></div>
              <div class="row"><span>present concepts read below 0.5</span><span>${B.missed}</span></div>
              <div class="row"><span>1/√d (in degrees)</span><span>${fmt(180 / Math.PI / Math.sqrt(H.dims), 1)}°</span></div>
              <div class="row"><span>measured mean |θ − 90°|</span><span>${fmt(H.spread * 180 / Math.PI, 1)}°</span></div>`;
          }
          const { z, reads } = readout(), L = Math.hypot(...z);
          const rows = V.map((v, i) => `<tr><td>${NAMES[i]}</td><td>${active.has(i) ? 1 : 0}</td><td>${fmt(reads[i])}</td><td>${(reads[i] > THRESH) === active.has(i) ? '✓' : active.has(i) ? 'missed' : 'ghost'}</td></tr>`).join('');
          let worst = 0; for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) worst = Math.max(worst, dot(V[i], V[j]));
          return `<p class="eq">z = Σ aᵢ·vᵢ\nreadoutⱼ = vⱼ·z = aⱼ + Σᵢ≠ⱼ aᵢ(vⱼ·vᵢ)</p>
            <div class="row"><span>concepts in ${d} dimensions</span><span class="hl">${V.length}</span></div>
            <div class="row"><span>largest overlap vᵢ·vⱼ</span><span>${fmt(worst, 3)}</span></div>
            <div class="row"><span>z = neurons (n1 … n${d})</span><span>(${z.map(x => fmt(x)).join(', ')})</span></div>
            <div class="row"><span>ring half-angle acos(0.5 ÷ |z|)</span><span>${L > THRESH ? fmt(Math.acos(THRESH / L) * 180 / Math.PI, 0) + '°' : '—'}</span></div>
            <table><tr><th>concept</th><th>aᵢ</th><th>readout</th><th>&gt; 0.5?</th></tr>${rows}</table>`;
        }
      };
    },

    poster(ctx, w, h, t) {
      const st = this._poster ||= (() => { const r = rng(9), V = randomDirs(10, 3, r); relax(V, 400); return { V, stars: Array.from({ length: 120 }, () => ({ x: r(), y: r(), r: 1, a: 0.1 + r() * 0.4, f: 1, p: r() * 6 })) }; })();
      sky(ctx, w, h, st.stars, t);
      const R = Math.min(w, h) * 0.36, view = { cx: w / 2, cy: h * 0.46, R, R3: rot3(t * 0.25, 0.4) };
      const on = Math.floor(t / 1.6) % 10;
      constellation(ctx, st.V, 3, view, { state: st.V.map((_, i) => ({ on: i === on })), t, labels: false });
    }
  });
})();
