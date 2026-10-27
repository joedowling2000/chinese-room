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

  Interiors.register({
    id: 'dimensions', no: '06', concept: 'High dimensions', title: 'Crowded Sky', maths: 'Superposition', eq: 'z = Σ aᵢvᵢ  ·  âⱼ = vⱼ·z', accent: '#c4b2ff',
    caption: 'More concepts than dimensions. They share the space, and pay for it in interference.',
    label: 'Feature directions as stars on a rotating sphere, joined by glowing filaments where they interfere.',
    mathsTitle: 'Superposition',
    controls: [
      { type: 'choice', id: 'space', label: 'Space', value: 3, options: [[2, '2D circle'], [3, '3D sphere'], [1000, 'Many dimensions']] },
      { type: 'range', id: 'n', label: 'Concepts (features)', min: 2, max: 16, step: 1, value: 6, fmt: v => String(v) },
      { type: 'toggle', id: 'stream', label: 'Stream random sentences', value: false },
      { type: 'range', id: 'p', label: 'How often each concept appears', min: 0.03, max: 0.6, step: 0.01, value: 0.08, fmt: v => Math.round(v * 100) + '%' },
      { type: 'range', id: 'hd', label: 'Dimensions (many-dimensions view)', min: 0.3, max: 3.4, step: 0.02, value: 0.48, fmt: v => String(Math.round(10 ** v)) }
    ],
    prompts: [
      { do: 'Watch the stars settle, then raise <b>Concepts</b> above 6.', saw: 'More concepts than dimensions: they cannot all be at right angles, so they spread as evenly as they can. The glowing filaments are interference, pairs of concepts whose directions overlap.' },
      { do: 'Tap one star to switch that concept on.', saw: 'The white comet is the model’s vector: the sum of the concepts that are on. To read a concept back out, project the comet onto its direction. The one you lit reads clearly.' },
      { do: 'Light three or four neighbouring stars at once.', saw: 'Ghosts. With several concepts on together, their overlaps add up, and concepts that are absent appear to be present (pink). Superposition only works while few concepts are active at the same time.' },
      { do: 'Turn on <b>Stream</b>, then slide <b>How often each concept appears</b> from low to high.', saw: 'Rare concepts can share space and still be read back almost every time. Common ones collide. Most concepts are absent from any given sentence, which is why a model can pack in so many.' },
      { do: 'Switch <b>Space</b> to <b>Many dimensions</b> and raise the dimensions.', saw: 'Each ray is the angle between two random directions. In 3 dimensions they fan out everywhere; in 1,000 they crowd around 90°. High-dimensional space has room for vastly more nearly-perpendicular directions than it has dimensions.' }
    ],
    coda: 'You can drag the sphere to turn it. The shapes the stars settle into — pairs, triangles, pentagons, tetrahedra, octahedra — are the same geometry found in trained toy models.',
    walk: [
      'A model represents each concept it knows as a <b>direction</b> in its vector space. With d dimensions there are only d mutually perpendicular directions, but models appear to represent far more concepts than that.',
      'They do it by <b>superposition</b>: concepts share the space at angles other than 90°. The vector for a sentence is the sum of the directions of the concepts present: <b>z = Σ aᵢvᵢ</b>.',
      'Reading concept j back out means taking a dot product: <b>vⱼ·z = aⱼ + Σᵢ≠ⱼ aᵢ(vⱼ·vᵢ)</b>. The second term is <b>interference</b>. Here a concept counts as detected when its readout exceeds 0.5.',
      'Interference is small when few concepts are active together, so sparse concepts can share. And in high dimensions, random directions are almost perpendicular, so there is enormous room.'
    ],
    inside: [
      'A model’s residual stream has a few thousand dimensions, yet interpretability research finds many more features than that: dictionary-learning studies of production models extract millions of interpretable directions.',
      'Superposition is one reason single neurons are hard to interpret: a neuron sits at the intersection of many feature directions and responds to several unrelated things (polysemanticity).'
    ],
    honest: 'The stars are arranged by gradient descent on a simple interference energy (positive overlaps penalised), which reproduces the polytopes reported in Toy Models of Superposition; it is not a trained network. Readout uses a plain dot product with a fixed threshold of 0.5. The concept names are labels only.',
    refs: [['Elhage et al. 2022 — Toy models of superposition', 'https://transformer-circuits.pub/2022/toy_model/index.html'], ['Templeton et al. 2024 — Scaling monosemanticity', 'https://transformer-circuits.pub/2024/scaling-monosemanticity/index.html']],

    create(k) {
      const { ctx, octx } = k;
      const r = rng(21);
      let d = 3, V = randomDirs(6, 3, r);
      const active = new Set();
      let yaw = 0.4, pitch = 0.35, drag = null, lastTouch = -99, tips = [], stream = { timer: 0, log: [] }, sawLo = false, sawHi = false;
      const stars = Array.from({ length: 260 }, () => ({ x: r(), y: r(), r: r() < 0.1 ? 1.6 : 1, a: 0.15 + r() * 0.5, f: 0.5 + r() * 2, p: r() * 6 }));
      let hd = null;
      const drone = k.sound.drone(196, 'sine');

      const view = () => { const R = Math.min(k.w * 0.3, k.h * (k.w < 760 ? 0.26 : 0.34)); return { cx: k.w * (k.w > 900 ? 0.47 : 0.5), cy: k.h * 0.52, R, R3: rot3(yaw, pitch) }; };
      function readout() {
        const z = Array(d).fill(0);
        active.forEach(i => V[i].forEach((x, j) => { z[j] += x; }));
        const reads = V.map(v => dot(v, z));
        return { z, reads };
      }
      function setN(n) {
        while (V.length < n) V.push(unit(Array.from({ length: d }, () => gauss(r))));
        while (V.length > n) { V.pop(); active.delete(V.length); }
      }
      function setD(nd) {
        if (nd === 1000) return;
        d = nd;
        V = V.map(v => unit(nd === 2 ? [v[0], v[1]] : [v[0], v[1], v.length > 2 ? v[2] : gauss(r) * 0.3]));
      }
      function hdData() {
        const dims = Math.round(10 ** k.values.hd);
        if (hd && hd.dims === dims) return hd;
        const rr = rng(dims * 17 + 3), M = 46, vs = randomDirs(M, dims, rr), angles = [];
        for (let i = 0; i < M; i++) for (let j = i + 1; j < M; j++) angles.push(Math.acos(clamp(dot(vs[i], vs[j]), -1, 1)));
        const mean = angles.reduce((a, b) => a + Math.abs(b - Math.PI / 2), 0) / angles.length;
        return (hd = { dims, angles, spread: mean });
      }

      return {
        frame(t, dt) {
          const many = k.values.space === 1000;
          sky(ctx, k.w, k.h, stars, k.motion ? t : 0);
          octx.clearRect(0, 0, k.w, k.h);
          if (many) {
            // the protractor: one ray per pair of random directions, at their angle
            const H = hdData(), cx = k.w > 900 ? k.w * 0.57 : k.w * 0.5, cy = k.h * 0.74, R = Math.min(k.w * 0.34, k.h * 0.5);
            ctx.strokeStyle = `rgba(${LAV},.3)`; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, 0); ctx.stroke();
            for (let a = 0; a <= 180; a += 10) {
              const th = Math.PI + a / 180 * Math.PI, l = a % 90 ? 6 : 14;
              ctx.beginPath(); ctx.moveTo(cx + (R - l) * Math.cos(th), cy + (R - l) * Math.sin(th)); ctx.lineTo(cx + R * Math.cos(th), cy + R * Math.sin(th)); ctx.stroke();
              if (a % 45 === 0) draw.label(octx, `${a}°`, cx + (R - 28) * Math.cos(th), cy + (R - 28) * Math.sin(th), `rgba(${LAV},.75)`, '11px "IBM Plex Mono", monospace', 'center');
            }
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = `rgba(${WHITE},0.06)`;
            for (const ang of H.angles) {
              const th = Math.PI + (Math.PI - ang);
              ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(th), cy + R * Math.sin(th)); ctx.stroke();
            }
            // histogram along the rim
            const bins = new Array(90).fill(0);
            H.angles.forEach(a => bins[Math.min(89, Math.floor(a / Math.PI * 90))]++);
            const mx = Math.max(...bins);
            bins.forEach((b, i) => {
              const th = Math.PI + (Math.PI - (i + 0.5) / 90 * Math.PI), l = b / mx * R * 0.25;
              ctx.strokeStyle = `rgba(${LAV},.85)`; ctx.lineWidth = 3;
              ctx.beginPath(); ctx.moveTo(cx + (R + 4) * Math.cos(th), cy + (R + 4) * Math.sin(th)); ctx.lineTo(cx + (R + 4 + l) * Math.cos(th), cy + (R + 4 + l) * Math.sin(th)); ctx.stroke();
            });
            ctx.globalCompositeOperation = 'source-over';
            draw.label(octx, `${H.dims} dimensions · ${H.angles.length} pairs of random directions · typical distance from 90°: ${fmt(H.spread * 180 / Math.PI, 1)}°`, k.w / 2, 86, 'rgba(236,232,255,.85)', '12px "IBM Plex Mono", monospace', 'center');
            drone.set(110 + 300 / Math.sqrt(H.dims), 0.02);
            return;
          }

          if (!drag && k.motion && d === 3 && t - lastTouch > 8) yaw += dt * 0.1;
          relax(V, 3);
          const vw = view();
          const { z, reads } = readout();
          const state = V.map((_, i) => {
            const on = active.has(i), hit = reads[i] > THRESH;
            return { on, ghost: !on && hit && active.size > 0, miss: on && !hit };
          });
          tips = constellation(ctx, V, d, vw, { state, t, labels: true });
          // the representation: the sum of active directions
          if (active.size) {
            const q = d === 3 ? vw.R3(z) : [z[0], z[1], 0], L = Math.hypot(...q), s = Math.min(1, 1.7 / L);
            const ex = vw.cx + q[0] * vw.R * s, ey = vw.cy - q[1] * vw.R * s;
            ctx.globalCompositeOperation = 'lighter';
            for (const [lw, al] of [[10, 0.08], [3, 0.9]]) { ctx.strokeStyle = `rgba(${WHITE},${al})`; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(vw.cx, vw.cy); ctx.lineTo(ex, ey); ctx.stroke(); }
            draw.glowDot(ctx, ex, ey, 26, `rgba(${WHITE},.8)`);
            ctx.globalCompositeOperation = 'source-over';
            draw.label(octx, `z  (|z| = ${fmt(Math.hypot(...z))})`, ex + 12, ey + 14, '#fff', '12px "IBM Plex Mono", monospace');
          }
          // readout bars
          if (k.w > 760) {
            const x0 = k.w - 250, y0 = Math.max(90, k.h * 0.5 - V.length * 9), bw = 120;
            draw.label(octx, 'readout  vⱼ·z', x0, y0 - 18, `rgba(${LAV},.8)`, '11px "IBM Plex Mono", monospace');
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
          // streaming sentences: random sparse sets, decoded or not
          if (k.values.stream) {
            stream.timer -= dt;
            if (stream.timer <= 0) {
              stream.timer = 0.7;
              active.clear();
              V.forEach((_, i) => { if (Math.random() < k.values.p) active.add(i); });
              const rd = readout().reads, ok = V.every((_, i) => (rd[i] > THRESH) === active.has(i));
              stream.log.push(ok); if (stream.log.length > 30) stream.log.shift();
              if (active.size) k.sound.tone(ok ? 523 : 233, 0.18, 0.025, ok ? 'sine' : 'triangle');
            }
            const acc = stream.log.length ? stream.log.filter(Boolean).length / stream.log.length : 0;
            draw.label(octx, `stream: ${Math.round(acc * 100)}% of the last ${stream.log.length} sentences read back perfectly`, vw.cx, vw.cy + vw.R + 34, acc > 0.8 ? 'rgba(236,232,255,.9)' : `rgb(${GHOST})`, '12px "IBM Plex Mono", monospace', 'center');
          }
          const meanAbs = (() => { let s = 0, c = 0; for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) { s += Math.abs(dot(V[i], V[j])); c++; } return c ? s / c : 0; })();
          drone.set(150 + meanAbs * 200, 0.02);
          if (k.stage === 2 && state.some(s => s.ghost) && active.size >= 3) k.reach(2);
          k.over.style.cursor = drag ? 'grabbing' : 'pointer';
        },
        get tips() { return tips; },
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
          if (k.values.space === 1000) return;
          let best = -1, bd = 30;
          tips.forEach((tp, i) => { if (!tp) return; const dd = Math.hypot(tp[0] - p.x, tp[1] - p.y) - tp[2] * 4; if (dd < bd) { bd = dd; best = i; } });
          if (best < 0) return;
          if (k.values.stream) k.set('stream', false);
          active.has(best) ? active.delete(best) : active.add(best);
          k.sound.tone(330 * 2 ** (best / 12), 0.4, 0.04);
          if (k.stage === 1 && active.size === 1) k.reach(1);
        },
        control(id, v) {
          if (id === 'n') { setN(v); if (k.stage === 0 && v > 6) k.reach(0); }
          if (id === 'space') { setD(v); active.clear(); if (k.stage === 4 && v === 1000) setTimeout(() => k.reach(4), 2500); }
          if (id === 'stream' && !v) active.clear();
          if (id === 'p' || id === 'stream') {
            if (k.values.p < 0.1) sawLo = true;
            if (k.values.p > 0.35) sawHi = true;
            if (k.stage === 3 && k.values.stream && sawLo && sawHi) k.reach(3);
            stream.log = [];
          }
        },
        maths() {
          if (k.values.space === 1000) {
            const H = hdData();
            return `<p class="eq">cos θ = u·v   for random unit u, v ∈ ℝᵈ\nspread of θ around 90° ≈ 1/√d</p>
              <div class="row"><span>dimensions d</span><span class="hl">${H.dims}</span></div>
              <div class="row"><span>1/√d (in degrees)</span><span>${fmt(180 / Math.PI / Math.sqrt(H.dims), 1)}°</span></div>
              <div class="row"><span>measured mean |θ − 90°|</span><span>${fmt(H.spread * 180 / Math.PI, 1)}°</span></div>`;
          }
          const { z, reads } = readout();
          const rows = V.map((v, i) => `<tr><td>${NAMES[i]}</td><td>${active.has(i) ? 1 : 0}</td><td>${fmt(reads[i])}</td><td>${(reads[i] > THRESH) === active.has(i) ? '✓' : active.has(i) ? 'missed' : 'ghost'}</td></tr>`).join('');
          let worst = 0; for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) worst = Math.max(worst, dot(V[i], V[j]));
          return `<p class="eq">z = Σ aᵢ·vᵢ\nreadoutⱼ = vⱼ·z = aⱼ + Σᵢ≠ⱼ aᵢ(vⱼ·vᵢ)</p>
            <div class="row"><span>concepts in ${d} dimensions</span><span class="hl">${V.length}</span></div>
            <div class="row"><span>largest overlap vᵢ·vⱼ</span><span>${fmt(worst, 3)}</span></div>
            <div class="row"><span>z</span><span>(${z.map(x => fmt(x)).join(', ')})</span></div>
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
