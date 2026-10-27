/* 03 · Descent — gradient descent.
   A night landscape of stacked ridgelines: each line is a slice through a loss
   surface. Seeds of light are optimisers. They cannot see the valleys; they
   feel the slope underfoot and step against it: v ← μv − η∇L, θ ← θ + v. */
(() => {
  const { draw, rng, fmt, clamp } = Interiors;
  const EXTENT = 3; // the world is [-3, 3]²

  // A loss surface: a gentle bowl, several Gaussian valleys of different depth, and ripples.
  function makeSurface(seed) {
    const r = rng(seed * 7919 + 13), wells = [];
    const count = 6;
    for (let i = 0; i < count; i++) {
      wells.push({ x: (r() - 0.5) * 4.6, y: (r() - 0.5) * 4.6, d: 0.5 + r() * 1.3, s: 0.25 + r() * 0.65 });
    }
    wells[0].d = 2.0; // one valley deeper than the rest
    const rip = { a: 0.08 + r() * 0.06, fx: 1.6 + r() * 1.4, fy: 1.6 + r() * 1.4, p: r() * 6 };
    const bowl = 0.07;
    const L = (x, y) => {
      let v = bowl * (x * x + y * y) + rip.a * Math.sin(rip.fx * x + rip.p) * Math.cos(rip.fy * y);
      for (const w of wells) v -= w.d * Math.exp(-((x - w.x) ** 2 + (y - w.y) ** 2) / w.s);
      return v;
    };
    const grad = (x, y) => {
      let gx = 2 * bowl * x + rip.a * rip.fx * Math.cos(rip.fx * x + rip.p) * Math.cos(rip.fy * y);
      let gy = 2 * bowl * y - rip.a * rip.fy * Math.sin(rip.fx * x + rip.p) * Math.sin(rip.fy * y);
      for (const w of wells) {
        const e = w.d * Math.exp(-((x - w.x) ** 2 + (y - w.y) ** 2) / w.s);
        gx += e * 2 * (x - w.x) / w.s; gy += e * 2 * (y - w.y) / w.s;
      }
      return [gx, gy];
    };
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= 120; i++) for (let j = 0; j <= 120; j++) {
      const v = L(-EXTENT + 6 * i / 120, -EXTENT + 6 * j / 120);
      lo = Math.min(lo, v); hi = Math.max(hi, v);
    }
    return { L, grad, lo, hi };
  }

  // Projection: rows run from the far edge (y = +3, top of screen) to the near edge.
  function camera(w, h, surf) {
    const narrow = w < 760;
    const top = h * (narrow ? 0.34 : 0.27), depthPx = h * (narrow ? 0.46 : 0.56), half = w * (narrow ? 0.62 : 0.4), cx = w * 0.5;
    const amp = h * (narrow ? 0.24 : 0.34) / (surf.hi - surf.lo);
    const proj = (x, y, z) => {
      const d = (EXTENT - y) / (2 * EXTENT), p = 0.5 + 0.5 * d;
      return [cx + (x / EXTENT) * half * p, top + depthPx * d ** 1.1 - (z - surf.lo) * amp * p, d];
    };
    return { proj, top, depthPx };
  }

  function paintTerrain(ctx, w, h, surf, cam, rows = 64, cols = 170, t = 0) {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#070912'); sky.addColorStop(0.45, '#0a0d18'); sky.addColorStop(1, '#040508');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(w / 2, cam.top, 0, w / 2, cam.top, w * 0.6);
    glow.addColorStop(0, 'rgba(255,176,96,.10)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);

    for (let r = 0; r < rows; r++) {
      const y = EXTENT - 2 * EXTENT * r / (rows - 1), d = r / (rows - 1);
      ctx.beginPath();
      let first = null, last = null;
      for (let c = 0; c <= cols; c++) {
        const x = -EXTENT * 1.15 + 2.3 * EXTENT * c / cols;
        const [sx, sy] = cam.proj(x, y, surf.L(x, y));
        if (!c) { ctx.moveTo(sx, sy); first = [sx, sy]; } else ctx.lineTo(sx, sy);
        last = [sx, sy];
      }
      // occlude the rows behind, then draw the ridge
      ctx.lineTo(last[0], h + 10); ctx.lineTo(first[0], h + 10); ctx.closePath();
      ctx.fillStyle = '#05060b'; ctx.fill();
      const fog = 0.18 + 0.7 * d;
      ctx.strokeStyle = `rgba(232,226,214,${0.55 * fog})`;
      ctx.lineWidth = 0.7 + d * 0.9;
      ctx.beginPath();
      for (let c = 0; c <= cols; c++) {
        const x = -EXTENT * 1.15 + 2.3 * EXTENT * c / cols;
        const [sx, sy] = cam.proj(x, y, surf.L(x, y));
        c ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
      }
      ctx.stroke();
    }
  }

  // speed → colour: amber when fast, ice blue when nearly still
  const speedColor = (s, a) => {
    const k = clamp(s * 22, 0, 1);
    return `rgba(${Math.round(150 + 105 * k)},${Math.round(210 - 40 * k)},${Math.round(255 - 165 * k)},${a})`;
  };

  Interiors.register({
    id: 'gradient-descent', no: '03', concept: 'Gradient descent', title: 'Descent', maths: 'Gradient descent', eq: 'θ ← θ − η ∇L(θ)', accent: '#ffb46a',
    caption: 'Learning is a blind walk downhill across a landscape of error.',
    label: 'Stacked ridgelines of a loss landscape with glowing seeds rolling into its valleys.',
    mathsTitle: 'Feeling for the bottom',
    controls: [
      { type: 'range', id: 'eta', label: 'Learning rate η', min: 0.001, max: 0.4, step: 0.001, value: 0.012, fmt: v => Number(v).toFixed(3) },
      { type: 'range', id: 'mu', label: 'Momentum μ', min: 0, max: 0.97, step: 0.01, value: 0, fmt: v => Number(v).toFixed(2) },
      { type: 'button', id: 'rain', label: 'Rain: drop 120 seeds' },
      { type: 'button', id: 'reshape', label: 'Reshape the landscape' }
    ],
    prompts: [
      { do: 'Tap anywhere on the landscape to drop a seed.', saw: 'It rolls downhill, but it cannot see the valley. At every step it only feels the slope beneath it (the gradient) and steps the other way. That is gradient descent.' },
      { do: 'Push the learning rate η above 0.2, then drop seeds.', saw: 'Steps too large: seeds overshoot the valley floor, ricochet from wall to wall, and some fly off the map. Training has diverged.' },
      { do: 'Set η low and momentum to zero. Drop seeds on the slopes until one stops short.', saw: 'Stuck in a hollow. The slope there is zero, so plain gradient descent stops — even though deeper valleys exist elsewhere. This is a local minimum.' },
      { do: 'Raise momentum μ above 0.8 and drop more seeds.', saw: 'Momentum carries velocity from step to step, like a heavy ball. Seeds coast through small hollows and along flat ravines — and sometimes overshoot.' },
      { do: 'Press <b>Rain</b>.', saw: 'A hundred and twenty starting points, one rule. The landscape divides into basins: where a seed starts decides where it ends. Real training starts from random weights too.' }
    ],
    coda: 'Try Reshape for a new landscape. In a real model this landscape has billions of dimensions, one per weight.',
    walk: [
      'The landscape is a <b>loss function</b> L(θ): for every setting of the parameters θ (here just two numbers, x and y), how wrong the model is. Height is error.',
      'A seed only knows the <b>gradient</b> ∇L where it stands: the direction of steepest climb. It steps the opposite way, scaled by the <b>learning rate</b> η.',
      'With <b>momentum</b> μ, each step keeps a fraction of the previous velocity: <b>v ← μv − η∇L</b>, then <b>θ ← θ + v</b>.',
      'Too small an η is slow and gets trapped; too large overshoots and diverges. Choosing it well is much of the craft of training.'
    ],
    inside: [
      'Training a language model is this walk, in a space with one dimension per weight — billions of them. The loss is how badly the model predicts the next token on a batch of text, and backpropagation computes the gradient for every weight at once.',
      'Real training uses refinements of this rule (Adam keeps a separate step size per weight) and noisy gradients from small batches, which helps it rattle out of poor hollows. High-dimensional landscapes are thought to have far more saddle points than true traps.'
    ],
    honest: 'The landscape is a synthetic two-parameter function (a bowl, six Gaussian valleys and a ripple) with an exact analytic gradient. Every seed step is the true momentum update on that function.',
    refs: [['Goh 2017 — Why momentum really works (Distill)', 'https://distill.pub/2017/momentum/'], ['Li et al. 2018 — Visualizing the loss landscape of neural nets', 'https://arxiv.org/abs/1712.09913']],

    create(k) {
      const { ctx, octx } = k;
      let seedNo = 1, surf = makeSurface(seedNo), cam = null, terrain = null;
      const seeds = [];
      let acc = 0, last = null, dragTrail = null;
      const drone = k.sound.drone(80, 'sine');

      function bake() {
        cam = camera(k.w, k.h, surf);
        terrain = document.createElement('canvas');
        terrain.width = Math.round(k.w * k.dpr); terrain.height = Math.round(k.h * k.dpr);
        const t = terrain.getContext('2d'); t.setTransform(k.dpr, 0, 0, k.dpr, 0, 0);
        paintTerrain(t, k.w, k.h, surf, cam, k.w < 760 ? 46 : 64, k.w < 760 ? 110 : 170);
      }
      // find the world point under the pointer: the frontmost terrain sample near it
      function unproject(p) {
        let best = null, bd = 18;
        for (let i = 0; i <= 70; i++) for (let j = 0; j <= 70; j++) {
          const x = -EXTENT + 6 * i / 70, y = -EXTENT + 6 * j / 70, [sx, sy, d] = cam.proj(x, y, surf.L(x, y));
          const dist = Math.hypot(sx - p.x, sy - p.y) - d * 6; // prefer nearer rows
          if (dist < bd) { bd = dist; best = [x, y]; }
        }
        return best;
      }
      function drop(x, y, quiet) {
        seeds.push({ x, y, vx: 0, vy: 0, trail: [[x, y]], state: 'run', still: 0, eta0: k.values.eta, mu0: k.values.mu, hops: 0 });
        last = seeds[seeds.length - 1];
        if (!quiet) k.sound.tone(660, 0.25, 0.03);
        if (seeds.length > 260) seeds.splice(0, seeds.length - 260);
        if (k.stage === 3 && k.values.mu >= 0.8) setTimeout(() => k.reach(3), 1500);
      }
      function step() {
        const eta = k.values.eta, mu = k.values.mu;
        for (const s of seeds) {
          if (s.state !== 'run') continue;
          const [gx, gy] = surf.grad(s.x, s.y);
          s.vx = mu * s.vx - eta * gx; s.vy = mu * s.vy - eta * gy;
          const px = s.x;
          s.x += s.vx; s.y += s.vy;
          if (Math.sign(px - s.x) !== Math.sign(s.vx) && Math.abs(s.vx) > 0.04) s.hops++;
          s.trail.push([s.x, s.y]);
          if (s.trail.length > 500) s.trail.shift();
          const speed = Math.hypot(s.vx, s.vy);
          if (!Number.isFinite(s.x) || Math.abs(s.x) > EXTENT * 1.5 || Math.abs(s.y) > EXTENT * 1.5) {
            s.state = 'gone'; s.goneAt = k.t;
            k.sound.tone(140, 0.4, 0.04, 'sawtooth');
            if (k.stage === 1 && eta > 0.2) k.reach(1);
            continue;
          }
          s.still = speed < 0.0015 ? s.still + 1 : 0;
          if (s.still > 30) {
            s.state = 'settled';
            const depth = (surf.L(s.x, s.y) - surf.lo) / (surf.hi - surf.lo);
            k.sound.tone(220 * 2 ** ((1 - depth) * 1.5), 0.9, 0.025);
            if (k.stage === 2 && mu < 0.3 && eta < 0.04 && depth > 0.12) k.reach(2);
          }
          if (k.stage === 1 && eta > 0.2 && s.hops > 6) k.reach(1);
        }
      }

      return {
        resize: bake,
        frame(t, dt) {
          if (!terrain) bake();
          acc += dt * 40;
          let n = 0;
          while (acc >= 1 && n < 6) { step(); acc--; n++; }
          ctx.drawImage(terrain, 0, 0, k.w, k.h);

          // long-exposure trails
          ctx.globalCompositeOperation = 'lighter';
          ctx.lineCap = 'round';
          for (const s of seeds) {
            const tr = s.trail, fade = s.state === 'gone' ? Math.max(0, 1 - (t - s.goneAt) / 3) : 1;
            if (fade <= 0) continue;
            let prev = cam.proj(tr[0][0], tr[0][1], surf.L(tr[0][0], tr[0][1]));
            for (let i = 1; i < tr.length; i++) {
              const [x, y] = tr[i], cur = cam.proj(x, y, surf.L(x, y));
              const sp = Math.hypot(x - tr[i - 1][0], y - tr[i - 1][1]);
              const age = (tr.length - i) / tr.length;
              ctx.strokeStyle = speedColor(sp, (0.15 + 0.6 * (1 - age)) * fade);
              ctx.lineWidth = 1.2 + 1.5 * (1 - age);
              ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(cur[0], cur[1]); ctx.stroke();
              prev = cur;
            }
            const [hx, hy] = prev, sp = Math.hypot(s.vx, s.vy);
            if (s.state === 'settled') {
              const pulse = 0.7 + 0.3 * Math.sin(t * 2 + s.x * 9);
              draw.glowDot(ctx, hx, hy, 16 * pulse, 'rgba(150,215,255,.7)');
            } else draw.glowDot(ctx, hx, hy, Math.min(20, 10 + sp * 40), speedColor(sp, 0.95 * fade));
            ctx.fillStyle = `rgba(255,255,255,${fade})`; ctx.beginPath(); ctx.arc(hx, hy, 1.8, 0, 7); ctx.fill();
          }
          ctx.globalCompositeOperation = 'source-over';
          draw.vignette(ctx, k.w, k.h, 0.5);

          // the most recent seed: its gradient arrow and step, so the rule is visible
          octx.clearRect(0, 0, k.w, k.h);
          if (last && last.state === 'run') {
            const [gx, gy] = surf.grad(last.x, last.y), g = Math.hypot(gx, gy) || 1;
            const a = cam.proj(last.x, last.y, surf.L(last.x, last.y));
            const bx = last.x - gx / g * 0.5, by = last.y - gy / g * 0.5, b = cam.proj(bx, by, surf.L(bx, by));
            octx.strokeStyle = octx.fillStyle = 'rgba(255,255,255,.85)'; octx.lineWidth = 1.5;
            draw.arrow(octx, a[0], a[1], b[0], b[1], 8);
            draw.label(octx, '−∇L', b[0] + 8, b[1] - 8, '#fff', '12px "IBM Plex Mono", monospace');
            draw.label(octx, `L = ${fmt(surf.L(last.x, last.y))}`, a[0] + 12, a[1] + 16, 'rgba(255,220,180,.9)', '11px "IBM Plex Mono", monospace');
          }
          const running = seeds.filter(s => s.state === 'run');
          const meanL = running.length ? running.reduce((a, s) => a + surf.L(s.x, s.y), 0) / running.length : surf.lo;
          drone.set(70 + 60 * (meanL - surf.lo) / (surf.hi - surf.lo), running.length ? 0.04 : 0);
        },
        down(p) { const q = unproject(p); if (q) { drop(q[0], q[1]); dragTrail = [p.x, p.y]; if (k.stage === 0) setTimeout(() => k.reach(0), 1200); } },
        move(p) {
          if (!p.dragging || !dragTrail) return;
          if (Math.hypot(p.x - dragTrail[0], p.y - dragTrail[1]) > 22) { const q = unproject(p); if (q) drop(q[0], q[1], true); dragTrail = [p.x, p.y]; }
        },
        up() { dragTrail = null; },
        control(id) {
          if (id === 'rain') {
            const r = rng(Math.floor(k.t * 1000) + 1);
            for (let i = 0; i < 120; i++) drop((r() - 0.5) * 2 * EXTENT * 0.95, (r() - 0.5) * 2 * EXTENT * 0.95, true);
            k.sound.tone(523, 1, 0.04);
            if (k.stage === 4) k.reach(4);
          }
          if (id === 'reshape') { seedNo++; surf = makeSurface(seedNo); seeds.length = 0; last = null; bake(); }
        },
        maths() {
          const run = seeds.filter(s => s.state === 'run').length, set = seeds.filter(s => s.state === 'settled').length, gone = seeds.filter(s => s.state === 'gone').length;
          let s = '<div class="row"><span>tap the landscape</span><span>to follow a seed</span></div>';
          if (last) {
            const [gx, gy] = surf.grad(last.x, last.y);
            s = `<div class="row"><span>θ = (x, y)</span><span>(${fmt(last.x)}, ${fmt(last.y)})</span></div>
              <div class="row"><span>L(θ)</span><span class="hl">${fmt(surf.L(last.x, last.y), 3)}</span></div>
              <div class="row"><span>∇L(θ)</span><span>(${fmt(gx)}, ${fmt(gy)})</span></div>
              <div class="row"><span>velocity v</span><span>(${fmt(last.vx, 3)}, ${fmt(last.vy, 3)})</span></div>
              <div class="row"><span>state</span><span>${last.state === 'run' ? 'descending' : last.state === 'settled' ? 'settled (∇L ≈ 0)' : 'diverged'}</span></div>`;
          }
          return `<p class="eq">v ← μ·v − η·∇L(θ)\nθ ← θ + v</p>
            <div class="row"><span>η, μ</span><span>${fmt(k.values.eta, 3)}, ${fmt(k.values.mu)}</span></div>${s}
            <div class="row"><span>seeds: moving · settled · lost</span><span>${run} · ${set} · ${gone}</span></div>
            <div class="row"><span>deepest point on this map</span><span>L ≈ ${fmt(surf.lo, 3)}</span></div>`;
        }
      };
    },

    poster(ctx, w, h, t) {
      const st = this._poster ||= { surf: makeSurface(3), seeds: [], key: '', img: null };
      const key = `${w}x${h}`;
      if (st.key !== key) {
        st.key = key; st.cam = camera(w, h * 0.78, st.surf);
        st.img = document.createElement('canvas'); st.img.width = w * 2; st.img.height = h * 2;
        const c = st.img.getContext('2d'); c.scale(2, 2); paintTerrain(c, w, h, st.surf, st.cam, 40, 110);
      }
      ctx.drawImage(st.img, 0, 0, w, h);
      if (!st.seeds.length || st.seeds[0].n > 260) {
        const r = rng(Math.floor(t * 100) + 1);
        st.seeds = Array.from({ length: 14 }, () => ({ x: (r() - 0.5) * 5.4, y: (r() - 0.5) * 5.4, vx: 0, vy: 0, tr: [], n: 0 }));
      }
      ctx.globalCompositeOperation = 'lighter';
      for (const s of st.seeds) {
        const [gx, gy] = st.surf.grad(s.x, s.y);
        s.vx = 0.85 * s.vx - 0.012 * gx; s.vy = 0.85 * s.vy - 0.012 * gy;
        s.x += s.vx; s.y += s.vy; s.n++;
        s.tr.push(st.cam.proj(s.x, s.y, st.surf.L(s.x, s.y))); if (s.tr.length > 90) s.tr.shift();
        ctx.strokeStyle = 'rgba(255,190,110,.55)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); s.tr.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
        const p = s.tr[s.tr.length - 1]; draw.glowDot(ctx, p[0], p[1], 8, 'rgba(255,210,150,.9)');
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  });
})();
