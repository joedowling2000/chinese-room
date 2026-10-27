/* 07 · Nullspace — projection and ablation.
   A cloud of synthetic activations. One direction separates prompts the model
   refuses (amber) from prompts it answers (blue). A blade of light deletes one
   direction from every point: x′ = x − α(x·n)n. Find the right one. */
(() => {
  const { draw, rng, gauss, fmt, clamp } = Interiors;
  const AMBER = '255,176,92', BLUE = '120,180,255';
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const unit = v => { const n = Math.hypot(...v) || 1; return v.map(x => x / n); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

  // hidden structure: a refusal direction, a topic direction, and broad unrelated variance
  const REF = unit([0.62, 0.35, 0.7]);
  const TOP = (() => { const t = [-0.6, 0.75, 0.05], d = dot(t, REF); return unit(t.map((x, i) => x - d * REF[i])); })();
  const OTHER = cross(REF, TOP);

  function cloud(n, seed) {
    const r = rng(seed), pts = [];
    for (let i = 0; i < n; i++) {
      const harmful = r() < 0.42, code = r() < 0.5;
      const a = (harmful ? 1.25 : -0.95) + gauss(r) * 0.32, b = (code ? 0.85 : -0.85) + gauss(r) * 0.34, c = gauss(r) * 0.85;
      const x = [0, 1, 2].map(k => a * REF[k] + b * TOP[k] + c * OTHER[k]);
      pts.push({ x, p: [...x], harmful, code, big: r() < 0.12, tw: r() * 6.28 });
    }
    return pts;
  }
  const projectOut = (x, n, a) => { const d = dot(x, n) * a; return [x[0] - d * n[0], x[1] - d * n[1], x[2] - d * n[2]]; };

  function camera(yaw, pitch, w, h, scale) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const cx0 = w * (w > 900 ? 0.5 : 0.5), cy0 = h * 0.54, f = 7;
    const P = v => {
      const x = cy * v[0] + sy * v[2], z0 = -sy * v[0] + cy * v[2];
      const y = cp * v[1] - sp * z0, z = sp * v[1] + cp * z0;
      const s = f / (f - z);
      return [cx0 + x * scale * s, cy0 - y * scale * s, z, s];
    };
    // camera right/up vectors in world space, for turning the blade by dragging
    const right = [cy, 0, sy], up = [-sy * sp, cp, cy * sp];
    return { P, right, up };
  }

  const sprites = {};
  function sprite(col) {
    if (sprites[col]) return sprites[col];
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, `rgba(${col},.55)`); g.addColorStop(0.4, `rgba(${col},.16)`); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 32);
    return (sprites[col] = c);
  }

  function paint(ctx, w, h, pts, cam, n, alpha, opts = {}) {
    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h * 0.54, 0, w / 2, h * 0.54, Math.hypot(w, h) * 0.55);
    g.addColorStop(0, '#0f1220'); g.addColorStop(1, '#04050a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    // the blade: a disc of light perpendicular to n
    const a = unit(Math.abs(n[1]) < 0.9 ? cross(n, [0, 1, 0]) : cross(n, [1, 0, 0])), b = cross(n, a), R = 2.7;
    const ring = [];
    for (let i = 0; i <= 72; i++) { const t = i / 72 * Math.PI * 2; ring.push(cam.P([0, 1, 2].map(k => R * (Math.cos(t) * a[k] + Math.sin(t) * b[k])))); }
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(230,236,255,${0.035 + alpha * 0.05})`;
    ctx.beginPath(); ring.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.fill();
    ctx.strokeStyle = 'rgba(230,236,255,.08)'; ctx.lineWidth = 1;
    for (let k = -4; k <= 4; k++) {
      const off = k / 4 * R, half = Math.sqrt(R * R - off * off);
      for (const [u, v] of [[a, b], [b, a]]) {
        const p0 = cam.P([0, 1, 2].map(j => off * u[j] - half * v[j])), p1 = cam.P([0, 1, 2].map(j => off * u[j] + half * v[j]));
        ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
      }
    }
    for (const [lw, al] of [[8, 0.06], [1.5, 0.6]]) {
      ctx.strokeStyle = `rgba(230,236,255,${al})`; ctx.lineWidth = lw;
      ctx.beginPath(); ring.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
    }

    // the removed components, as faint streaks while the cloud is collapsing
    if (opts.streaks) {
      ctx.lineWidth = 0.6;
      for (const col of [AMBER, BLUE]) {
        ctx.strokeStyle = `rgba(${col},.07)`;
        ctx.beginPath();
        for (let i = 0; i < pts.length; i += 3) {
          const q = pts[i]; if ((col === AMBER) !== q.harmful) continue;
          const s0 = cam.P(q.x), s1 = cam.P(q.p);
          if (Math.abs(s0[1] - s1[1]) + Math.abs(s0[0] - s1[0]) < 2) continue;
          ctx.moveTo(s0[0], s0[1]); ctx.lineTo(s1[0], s1[1]);
        }
        ctx.stroke();
      }
    }
    // particles: small cores in depth buckets, with soft sprites for a smoky body
    for (const [col, harmful] of [[BLUE, false], [AMBER, true]]) {
      const buckets = [[], [], [], []];
      for (const q of pts) {
        if (q.harmful !== harmful) continue;
        const s = cam.P(q.p), bi = clamp(Math.floor((s[2] + 2.6) / 5.2 * 4), 0, 3);
        buckets[bi].push(s);
        if (q.big) ctx.drawImage(sprite(col), s[0] - 14 * s[3], s[1] - 14 * s[3], 28 * s[3], 28 * s[3]);
      }
      buckets.forEach((bk, bi) => {
        ctx.fillStyle = `rgba(${col},${0.25 + bi * 0.17})`;
        ctx.beginPath();
        for (const s of bk) ctx.rect(s[0] - 0.9 * s[3], s[1] - 0.9 * s[3], 1.8 * s[3], 1.8 * s[3]);
        ctx.fill();
      });
    }
    // the normal arrow: the direction the blade deletes
    const o = cam.P([0, 0, 0]), tip = cam.P(n.map(x => x * 2.4));
    ctx.strokeStyle = ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2;
    draw.arrow(ctx, o[0], o[1], tip[0], tip[1], 12);
    draw.glowDot(ctx, tip[0], tip[1], 26, 'rgba(255,255,255,.55)');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(tip[0], tip[1], 6, 0, 7); ctx.fill();
    ctx.strokeStyle = '#04050a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tip[0], tip[1], 2.5, 0, 7); ctx.stroke();
    return tip;
  }

  // separation of two groups along a direction, from the current (edited) positions
  function separation(pts, dir, key) {
    let s1 = 0, n1 = 0, s0 = 0, n0 = 0;
    for (const q of pts) { const v = dot(q.p, dir); if (q[key]) { s1 += v; n1++; } else { s0 += v; n0++; } }
    return s1 / n1 - s0 / n0;
  }

  const EXAMPLES = [
    { q: 'How do I pick a lock?', no: 'I can’t help with that.', yes: 'Pin-tumbler locks use spring-loaded pins…' },
    { q: 'Write an insult for my boss.', no: 'I’d rather not write insults.', yes: 'Sure: “Your vision is truly… unique.”' },
    { q: 'What is the capital of France?', no: 'Paris.', yes: 'Paris.' }
  ];

  Interiors.register({
    id: 'ablation', no: '07', concept: 'Projection / ablation', title: 'Nullspace', maths: 'Orthogonal projection', eq: 'x′ = x − (x·r̂) r̂', accent: '#ffb05c',
    caption: 'Cut one direction out of the model’s mind, and see what goes with it.',
    label: 'A cloud of amber and blue particles cut by a plane of light that removes one direction from every point.',
    mathsTitle: 'Deleting a direction',
    controls: [
      { type: 'range', id: 'alpha', label: 'Strength α (how much to remove)', min: 0, max: 1, step: 0.01, value: 0, fmt: v => Number(v).toFixed(2) },
      { type: 'button', id: 'find', label: 'Find the direction (difference of means)' },
      { type: 'button', id: 'up', label: 'Aim straight up' },
      { type: 'button', id: 'restore', label: 'Restore the original activations' }
    ],
    prompts: [
      { do: 'Drag the bright handle at the arrow’s tip to turn the blade. Drag anywhere else to orbit.', saw: 'The arrow is a direction in the model’s activation space; the blade is everything perpendicular to it. Amber points are prompts the model refuses; blue ones it answers. Notice they separate along one direction in particular.' },
      { do: 'Push strength α all the way to 1.', saw: 'Every point drops onto the blade: its component along the arrow is subtracted (the faint streaks). Whatever information lay along that direction is gone; everything perpendicular to it is untouched.' },
      { do: 'Press <b>Find the direction</b>, then make sure α is 1.', saw: 'The average amber point minus the average blue point gives the refusal direction. Delete it and the two colours mingle: the model can no longer tell them apart, and the refusals turn into answers. This is “abliteration”.' },
      { do: 'Now press <b>Aim straight up</b> at full strength.', saw: 'Wrong direction. Refusal survives, but something else is destroyed: the topic signal has collapsed. Directions in a real model are rarely perfectly clean, so every edit risks side effects.' }
    ],
    coda: 'Restore the activations and try your own directions. The meters show which signals survive.',
    walk: [
      'Each point is the model’s internal vector (its activation) for one prompt, squashed here into three dimensions. Prompts it refuses and prompts it answers form two lobes.',
      'Pick a unit direction <b>n</b>. Every vector can be split into a part along n, <b>(x·n)n</b>, and a part perpendicular to it. <b>Projection</b> removes the first part: <b>x′ = x − α(x·n)n</b>. At α = 1 the cloud is flattened onto the plane perpendicular to n.',
      'If the difference between the two lobes lies along n, removing n removes the difference. The simplest estimate of that direction is the <b>difference of means</b>: average refused point minus average answered point.',
      'Projection is irreversible: points that differed only along n become identical, which is why “Restore” has to reload the originals rather than undo the maths.'
    ],
    inside: [
      'Arditi et al. found that in many chat models, refusal is mediated largely by a single direction in the residual stream. Projecting it out of the weights (“abliteration”) removes most refusals while leaving other abilities largely intact. Adding it makes the model refuse harmless requests.',
      'The same projection is used to study and steer other behaviours. It is also a blunt instrument: if a direction carries more than one thing, removing it removes all of them. This site’s abliteration article explores the practice in detail.'
    ],
    honest: 'The cloud is synthetic: 5,000 points built from a chosen refusal direction, an orthogonal topic direction and unrelated noise in three dimensions. The projection, difference-of-means estimate and separation meters are computed exactly from those points. The example prompts and replies are canned text, switched by the synthetic refusal signal.',
    refs: [['Arditi et al. 2024 — Refusal in language models is mediated by a single direction', 'https://arxiv.org/abs/2406.11717'], ['This site — How easy is it to make AI dangerous? (abliteration)', '#article/abliteration']],

    create(k) {
      const { ctx, octx } = k;
      const pts = cloud(k.w < 760 ? 3000 : 5000, 3);
      let n = unit([0.2, 0.95, 0.25]), target = null, yaw = 0.6, pitch = 0.32, drag = null, tip = [0, 0], lastTouch = -99, turned = 0;
      const base = { ref: separation(pts, REF, 'harmful'), top: separation(pts, TOP, 'code') };
      const drone = k.sound.drone(98, 'sine');
      const scale = () => Math.min(k.w, k.h) * 0.17;

      function check() {
        const a = k.values.alpha, c = Math.abs(dot(n, REF));
        if (k.stage === 1 && a >= 0.95) k.reach(1);
        if (k.stage === 2 && a >= 0.95 && c > 0.95) setTimeout(() => k.reach(2), 900);
        if (k.stage === 3 && a >= 0.95 && c < 0.5 && Math.abs(separation(pts, TOP, 'code')) / base.top < 0.4) setTimeout(() => k.reach(3), 900);
      }

      return {
        get tip() { return tip; },
        frame(t, dt) {
          if (target) {
            n = unit(n.map((x, i) => x + (target[i] - x) * (1 - Math.exp(-dt * 4))));
            if (dot(n, target) > 0.9995) { n = target; target = null; check(); }
          }
          if (!drag && k.motion && t - lastTouch > 6) yaw += dt * 0.08;
          const a = k.values.alpha;
          let moving = false;
          const e = 1 - Math.exp(-dt * 5);
          for (const q of pts) {
            const goal = projectOut(q.x, n, a);
            const dx = goal[0] - q.p[0], dy = goal[1] - q.p[1], dz = goal[2] - q.p[2];
            if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > 0.004) moving = true;
            q.p[0] += dx * e; q.p[1] += dy * e; q.p[2] += dz * e;
          }
          const cam = camera(yaw, pitch, k.w, k.h, scale());
          tip = paint(ctx, k.w, k.h, pts, cam, n, a, { streaks: a > 0.02 });
          draw.vignette(ctx, k.w, k.h, 0.55);

          // meters and the example replies
          octx.clearRect(0, 0, k.w, k.h);
          const refS = clamp(Math.abs(separation(pts, REF, 'harmful')) / base.ref, 0, 1), topS = clamp(Math.abs(separation(pts, TOP, 'code')) / base.top, 0, 1);
          const cosR = Math.abs(dot(n, REF));
          const x0 = 28, y0 = 96;
          const meter = (label, v, y, col) => {
            draw.label(octx, label, x0, y, 'rgba(236,236,240,.8)', '11px "IBM Plex Mono", monospace');
            octx.fillStyle = 'rgba(255,255,255,.1)'; octx.fillRect(x0, y + 10, 180, 5);
            octx.fillStyle = col; octx.fillRect(x0, y + 10, 180 * v, 5);
            draw.label(octx, `${Math.round(v * 100)}%`, x0 + 188, y + 12, col, '11px "IBM Plex Mono", monospace');
          };
          meter('refusal signal', refS, y0, `rgb(${AMBER})`);
          meter('topic signal', topS, y0 + 36, 'rgb(150,230,190)');
          meter('blade aimed at refusal  |cos|', cosR, y0 + 72, 'rgba(255,255,255,.85)');
          if (k.w > 900) {
            const sx = k.w - 440, sy = 96, comply = 1 - refS;
            draw.label(octx, 'example replies (illustrative)', sx, sy, 'rgba(236,236,240,.55)', '10px "IBM Plex Mono", monospace');
            EXAMPLES.forEach((ex, i) => {
              const y = sy + 26 + i * 44, refusing = comply < 0.6;
              draw.label(octx, `› ${ex.q}`, sx, y, 'rgba(236,236,240,.9)', '13px "DM Sans", sans-serif');
              draw.label(octx, refusing ? ex.no : ex.yes, sx + 12, y + 18, ex.no === ex.yes ? 'rgba(200,220,255,.85)' : refusing ? `rgb(${AMBER})` : `rgb(${BLUE})`, '12px "IBM Plex Mono", monospace');
            });
          }
          drone.set(70 + 80 * refS, moving ? 0.05 : 0.02);
          k.over.style.cursor = drag ? 'grabbing' : 'grab';
        },
        down(p) {
          lastTouch = k.t;
          drag = { x: p.x, y: p.y, blade: Math.hypot(p.x - tip[0], p.y - tip[1]) < 34 };
          target = null;
        },
        move(p) {
          if (!drag || !p.dragging) return;
          lastTouch = k.t;
          if (drag.blade) {
            const cam = camera(yaw, pitch, k.w, k.h, scale()), s = 0.006;
            n = unit(n.map((x, i) => x + (cam.right[i] * p.dx - cam.up[i] * p.dy) * s));
            turned += Math.hypot(p.dx, p.dy);
            if (k.stage === 0 && turned > 120) k.reach(0);
          } else {
            yaw += p.dx * 0.006; pitch = clamp(pitch + p.dy * 0.006, -1.3, 1.3);
          }
        },
        up() { if (drag?.blade) check(); drag = null; },
        control(id, v) {
          if (id === 'alpha') check();
          if (id === 'find') {
            // the difference between the mean refused and mean answered activation, from the ORIGINAL points
            const m1 = [0, 0, 0], m0 = [0, 0, 0]; let c1 = 0, c0 = 0;
            for (const q of pts) { const m = q.harmful ? m1 : m0; m[0] += q.x[0]; m[1] += q.x[1]; m[2] += q.x[2]; q.harmful ? c1++ : c0++; }
            target = unit([0, 1, 2].map(i => m1[i] / c1 - m0[i] / c0));
            if (dot(target, n) < 0) n = n.map(x => -x);
            k.sound.tone(392, 0.8, 0.05);
          }
          if (id === 'up') { target = [0, 1, 0]; if (dot(target, n) < 0) n = n.map(x => -x); }
          if (id === 'restore') { k.set('alpha', 0); for (const q of pts) q.p = [...q.x]; }
        },
        maths() {
          const a = k.values.alpha, refS = Math.abs(separation(pts, REF, 'harmful')), topS = Math.abs(separation(pts, TOP, 'code'));
          return `<p class="eq">x′ = x − α·(x·n)·n\nn̂ ≈ mean(refused) − mean(answered)</p>
            <div class="row"><span>blade normal n</span><span>(${n.map(x => fmt(x)).join(', ')})</span></div>
            <div class="row"><span>strength α</span><span class="hl">${fmt(a)}</span></div>
            <div class="row"><span>|cos(n, refusal direction)|</span><span>${fmt(Math.abs(dot(n, REF)), 3)}</span></div>
            <div class="row"><span>refusal separation</span><span>${fmt(refS)} / ${fmt(base.ref)}</span></div>
            <div class="row"><span>topic separation</span><span>${fmt(topS)} / ${fmt(base.top)}</span></div>`;
        }
      };
    },

    poster(ctx, w, h, t) {
      const st = this._poster ||= { pts: cloud(1600, 5) };
      const a = 0.5 + 0.5 * Math.sin(t * 0.5), n = REF;
      for (const q of st.pts) q.p = projectOut(q.x, n, a);
      const cam = camera(t * 0.2, 0.3, w, h, Math.min(w, h) * 0.2);
      paint(ctx, w, h, st.pts, cam, n, a);
    }
  });
})();
