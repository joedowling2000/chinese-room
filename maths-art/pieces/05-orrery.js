/* 05 · Orrery — rotary position embedding (RoPE).
   A token's vector is split into pairs; each pair is rotated by (position × θᵢ),
   a different speed per pair. Two words become planets on every orbit. Their
   attention score depends only on the angles between them: the distance n − m. */
(() => {
  const { draw, rng, fmt, clamp } = Interiors;
  const WORDS = ['The', 'cat', 'sat', 'on', 'the', 'warm', 'mat', 'and', 'then', 'it', 'fell', 'asleep'];
  const BRASS = '217,179,108', SILVER = '200,214,228', EMBER = '255,170,110';

  const thetas = (K, base) => Array.from({ length: K }, (_, i) => base ** (-i / K));
  // fixed "content" for each word: a magnitude and a phase per pair (stands in for qᵢ, kᵢ)
  function content(word, K) {
    let h = 7; for (const c of word.toLowerCase()) h = (h * 131 + c.charCodeAt(0)) >>> 0;
    const r = rng(h);
    return Array.from({ length: K }, () => ({ mag: 0.55 + 0.45 * r(), phase: r() * Math.PI * 2 }));
  }
  function score(K, base, wa, wb, m, n) {
    const th = thetas(K, base), a = content(wa, K), b = content(wb, K);
    let s = 0, norm = 0;
    for (let i = 0; i < K; i++) {
      s += a[i].mag * b[i].mag * Math.cos((n - m) * th[i] + b[i].phase - a[i].phase);
      norm += a[i].mag * b[i].mag;
    }
    return s / norm;
  }

  function backdrop(ctx, w, h, cx, cy, R) {
    ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 2.2);
    g.addColorStop(0, '#16120c'); g.addColorStop(0.5, '#0b0a0c'); g.addColorStop(1, '#05060a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  // the spirograph: chain the pairs tip to tail and follow position
  function spiro(ctx, cx, cy, R, K, base, alpha, upto = 260) {
    const th = thetas(K, base), radii = th.map((_, i) => R * 0.62 * 0.62 ** i);
    ctx.strokeStyle = `rgba(${BRASS},${alpha})`; ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let p = 0; p <= upto; p += 0.08) {
      let x = cx, y = cy;
      for (let i = 0; i < K; i++) { x += radii[i] * Math.cos(p * th[i] - Math.PI / 2); y += radii[i] * Math.sin(p * th[i] - Math.PI / 2); }
      p ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  function rings(ctx, cx, cy, R, K, base, posA, posB, wa, wb, t, opts = {}) {
    const th = thetas(K, base), ca = content(wa, K), cb = content(wb, K);
    for (let i = 0; i < K; i++) {
      const r = R * (0.3 + 0.7 * (i + 0.5) / K);
      ctx.strokeStyle = `rgba(${BRASS},.28)`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      // engraved ticks
      ctx.strokeStyle = `rgba(${BRASS},.22)`;
      ctx.beginPath();
      for (let k = 0; k < 48; k++) { const a = k / 48 * Math.PI * 2, l = k % 4 ? 3 : 7; ctx.moveTo(cx + (r - l) * Math.cos(a), cy + (r - l) * Math.sin(a)); ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); }
      ctx.stroke();
      const aA = posA * th[i] + ca[i].phase - Math.PI / 2, aB = posB * th[i] + cb[i].phase - Math.PI / 2;
      // the relative angle: the arc that decides the score
      let d = ((aB - aA) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
      ctx.globalCompositeOperation = 'lighter';
      for (const [lw, al] of [[9, 0.1], [2.5, 0.75]]) {
        ctx.strokeStyle = `rgba(${EMBER},${al * (opts.lock ? 1 : 0.85)})`; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.arc(cx, cy, r, aA, aA + d, d < 0); ctx.stroke();
      }
      for (const [a, col, mag] of [[aA, BRASS, ca[i].mag], [aB, SILVER, cb[i].mag]]) {
        const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
        ctx.strokeStyle = `rgba(${col},.18)`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
        draw.glowDot(ctx, x, y, 16 * mag + 6, `rgba(${col},.6)`);
        ctx.fillStyle = `rgb(${col})`; ctx.beginPath(); ctx.arc(x, y, 3 + 3 * mag, 0, 7); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      if (opts.labels) draw.label(ctx, `θ${'₁₂₃₄₅₆₇₈'[i]} ${fmt(th[i], th[i] < 0.1 ? 3 : 2)}`, cx + r * 0.7071 + 8, cy + r * 0.7071 + 2, `rgba(${BRASS},.7)`, '10px "IBM Plex Mono", monospace');
    }
  }

  Interiors.register({
    id: 'rotary', no: '05', concept: 'Rotary position', title: 'Orrery', maths: 'Rotary position embedding', eq: '⟨R(mω)q, R(nω)k⟩ = ⟨q, R((n−m)ω)k⟩', accent: '#d9b36c',
    caption: 'A word’s position is written as rotation. Only the angle between two words matters.',
    label: 'A brass orrery: two words as planets on concentric orbits that rotate at different speeds with position.',
    mathsTitle: 'Position as rotation',
    controls: [
      { type: 'range', id: 'pairs', label: 'Rotating pairs (orbits)', min: 2, max: 8, step: 1, value: 6, fmt: v => String(v) },
      { type: 'range', id: 'base', label: 'Base (slowest speed)', min: 1, max: 4, step: 0.05, value: 2, fmt: v => Math.round(10 ** v).toLocaleString() },
      { type: 'toggle', id: 'trace', label: 'Spirograph trace', value: true }
    ],
    prompts: [
      { do: 'Drag the sentence at the top sideways.', saw: 'Every planet moved: each word’s position is written as rotation, a different speed on each orbit. But the glowing arcs between the two words held still, and so did their score. Shifting both words leaves their relationship intact.' },
      { do: 'Tap another word in the sentence to compare it with <b>it</b>.', saw: 'Change the distance and the arcs change. The score depends only on how far apart the words are, (n − m), never on where they sit in the text.' },
      { do: 'Tap a word six or more places away from <b>it</b>.', saw: 'The fast inner orbit has wrapped almost all the way round: on its own it cannot tell 0 words apart from 6. The slow outer orbits still can. Many speeds together give every distance its own signature.' },
      { do: 'Push the base above 3,000.', saw: 'A larger base makes the outer orbits slower, so the whole pattern takes far longer to repeat. Stretching this base is how some models are adapted to longer contexts.' }
    ],
    coda: 'The curve behind is the planets chained tip to tail as position advances: a portrait of how the rotations combine.',
    walk: [
      'A model needs to know word order, but attention by itself is blind to it. Rotary embedding writes position into the query and key vectors by <b>rotating</b> them.',
      'The vector is split into pairs of numbers, each a little arrow in a plane. At position m, pair i is rotated by the angle <b>m·θᵢ</b>. The θᵢ form a ladder of speeds: <b>θᵢ = base^(−2i/d)</b>, fast for the first pairs, very slow for the last.',
      'Attention compares a query and a key with a dot product. Because rotations compose, rotating q by m·θ and k by n·θ leaves exactly the angle (n − m)·θ between them: <b>R(mθ)q · R(nθ)k = q · R((n−m)θ)k</b>.',
      'So the score sees only the distance between the words. Slide the whole sentence along and every arrow turns, but none of the arcs between them change.'
    ],
    inside: [
      'Rotary position embedding (RoPE) is used by most current open models, including Llama, Mistral and Qwen. It is applied to the queries and keys inside every attention head, at every layer, with dozens of frequency pairs per head.',
      'The base sets the slowest speed: 10,000 in the original paper. Methods for extending context length (position interpolation, NTK-aware scaling, YaRN) work by rescaling these speeds.'
    ],
    honest: 'Each word’s “content” here is a fixed magnitude and phase per pair, derived from its spelling, standing in for learned query and key vectors. The rotations, speeds and the dot product are computed exactly; the score is normalised to lie between −1 and 1. The spirograph is a visual portrait, not a quantity the model uses.',
    refs: [['Su et al. 2021 — RoFormer: rotary position embedding', 'https://arxiv.org/abs/2104.09864'], ['Peng et al. 2023 — YaRN: efficient context window extension', 'https://arxiv.org/abs/2309.00071']],

    create(k) {
      const { ctx, octx } = k;
      let offset = 0, offsetShown = 0, drag = null, A = 9, B = 1, last = { off: 0 };
      let cx = 0, cy = 0, R = 0, rail = { x0: 0, y: 0, sp: 60 };
      const drone = k.sound.drone(110, 'sine');
      const layout = () => {
        const narrow = k.w < 760;
        R = Math.min(k.w * (narrow ? 0.4 : 0.26), k.h * (narrow ? 0.28 : 0.3));
        cx = k.w * 0.5; cy = narrow ? k.h * 0.55 : k.h * 0.6;
        rail.sp = Math.min(86, (k.w - 80) / WORDS.length);
        rail.x0 = k.w / 2 - rail.sp * (WORDS.length - 1) / 2; rail.y = narrow ? 120 : 108;
      };
      const pos = i => offsetShown + i;
      function pickWord(p) {
        if (Math.abs(p.y - rail.y) > 34) return -1;
        const i = Math.round((p.x - rail.x0) / rail.sp);
        return i >= 0 && i < WORDS.length ? i : -1;
      }

      return {
        resize: layout,
        frame(t, dt) {
          if (!R) layout();
          if (!drag) offset = Math.round(offset);
          offsetShown += (offset - offsetShown) * (1 - Math.exp(-dt * (drag ? 30 : 9)));
          const K = k.values.pairs, base = 10 ** k.values.base;
          backdrop(ctx, k.w, k.h, cx, cy, R);
          if (k.values.trace) {
            ctx.globalCompositeOperation = 'lighter';
            spiro(ctx, cx, cy, R * 1.25, K, base, 0.16, 400);
            ctx.globalCompositeOperation = 'source-over';
          }
          const locked = drag && Math.abs(offset - last.off) > 0.5;
          rings(ctx, cx, cy, R, K, base, pos(A), pos(B), WORDS[A], WORDS[B], t, { labels: true, lock: locked });
          draw.vignette(ctx, k.w, k.h, 0.55);

          // centre: the score that the arcs determine
          octx.clearRect(0, 0, k.w, k.h);
          const s = score(K, base, WORDS[A], WORDS[B], pos(A), pos(B));
          const r0 = R * 0.22;
          octx.strokeStyle = `rgba(${BRASS},.5)`; octx.lineWidth = 1;
          octx.beginPath(); octx.arc(cx, cy, r0, 0, 7); octx.stroke();
          octx.strokeStyle = `rgba(${EMBER},.95)`; octx.lineWidth = 4;
          octx.beginPath(); octx.arc(cx, cy, r0, -Math.PI / 2, -Math.PI / 2 + (s + 1) / 2 * Math.PI * 2); octx.stroke();
          draw.label(octx, fmt(s), cx, cy - 4, '#fff', '500 20px "IBM Plex Mono", monospace', 'center');
          draw.label(octx, 'score', cx, cy + 16, `rgba(${BRASS},.8)`, '10px "IBM Plex Mono", monospace', 'center');
          const dist = B - A;
          draw.label(octx, k.w < 600 ? `“${WORDS[B]}”→“${WORDS[A]}”  n − m = ${dist}` : `“${WORDS[A]}” at ${Math.round(pos(A))}   ·   “${WORDS[B]}” at ${Math.round(pos(B))}   ·   distance n − m = ${dist}`, cx, rail.y + 74, 'rgba(236,230,215,.85)', '12px "IBM Plex Mono", monospace', 'center');
          if (Math.abs(offset) > 0.5) draw.label(octx, `whole sentence shifted by ${offset > 0 ? '+' : ''}${Math.round(offset)} · score unchanged`, cx, rail.y + 94, `rgba(${EMBER},.9)`, '11px "IBM Plex Mono", monospace', 'center');

          // the sentence rail with a tiny clock per word
          const th = thetas(K, base);
          WORDS.forEach((w, i) => {
            const x = rail.x0 + i * rail.sp, y = rail.y, sel = i === A ? BRASS : i === B ? SILVER : null;
            const cr = Math.min(15, rail.sp * 0.22);
            octx.strokeStyle = sel ? `rgba(${sel},.9)` : 'rgba(220,210,190,.25)'; octx.lineWidth = 1;
            octx.beginPath(); octx.arc(x, y, cr, 0, 7); octx.stroke();
            for (let j = 0; j < K; j++) {
              const a = pos(i) * th[j] - Math.PI / 2, l = cr * (0.35 + 0.65 * (K - j) / K);
              octx.strokeStyle = sel ? `rgba(${sel},${0.9 - j * 0.08})` : `rgba(220,210,190,${0.55 - j * 0.05})`;
              octx.beginPath(); octx.moveTo(x, y); octx.lineTo(x + l * Math.cos(a), y + l * Math.sin(a)); octx.stroke();
            }
            const tight = rail.sp < 50;
            draw.label(octx, w, x, y + cr + 14 + (tight && i % 2 ? 14 : 0), sel ? `rgb(${sel})` : 'rgba(236,236,236,.75)', `${sel ? 600 : 400} ${tight ? 11 : 13}px "DM Sans", sans-serif`, 'center');
            draw.label(octx, String(Math.round(pos(i))), x, y - cr - 10, 'rgba(200,200,200,.45)', '10px "IBM Plex Mono", monospace', 'center');
          });
          draw.label(octx, '← drag the sentence →', k.w / 2, rail.y + 54, 'rgba(220,210,190,.4)', '10px "IBM Plex Mono", monospace', 'center');

          // score against distance, with the current distance marked
          const pw = Math.min(240, k.w * 0.22), ph = 70, px = k.w - pw - 34, py = k.h * 0.3;
          if (k.w > 760) {
            octx.strokeStyle = 'rgba(255,255,255,.12)'; octx.lineWidth = 1;
            octx.beginPath(); octx.moveTo(px, py + ph / 2); octx.lineTo(px + pw, py + ph / 2); octx.stroke();
            octx.strokeStyle = `rgba(${EMBER},.8)`; octx.lineWidth = 1.4; octx.beginPath();
            for (let d = -24; d <= 24; d += 0.25) {
              const x = px + (d + 24) / 48 * pw, y = py + ph / 2 - score(K, base, WORDS[A], WORDS[B], 0, d) * ph / 2;
              d === -24 ? octx.moveTo(x, y) : octx.lineTo(x, y);
            }
            octx.stroke();
            const mx = px + (dist + 24) / 48 * pw;
            octx.fillStyle = '#fff'; octx.beginPath(); octx.arc(mx, py + ph / 2 - s * ph / 2, 4, 0, 7); octx.fill();
            draw.label(octx, 'score vs distance (−24 … +24)', px, py - 12, 'rgba(236,230,215,.6)', '10px "IBM Plex Mono", monospace');
          }
          drone.set(90 + 40 * (s + 1), 0.025);
          k.over.style.cursor = drag ? 'grabbing' : 'grab';
        },
        down(p) { drag = { x0: p.x, off0: offset, word: pickWord(p) }; },
        move(p) {
          if (!drag || !p.dragging) return;
          if (Math.abs(p.x - drag.x0) > 6) drag.word = -1;
          offset = clamp(drag.off0 + (p.x - drag.x0) / rail.sp * 1.5, 0, 400);
        },
        up() {
          if (drag && Math.abs(offset - drag.off0) >= 2 && k.stage === 0) k.reach(0);
          if (drag && drag.word === -1 && Math.abs(offset - drag.off0) > 0.5) k.sound.tone(294, 0.4, 0.03);
          drag = null;
        },
        tap(p) {
          const i = pickWord(p);
          if (i < 0 || i === A) return;
          B = i;
          k.sound.tone(262 * 2 ** (Math.abs(B - A) / 12), 0.6, 0.05);
          if (k.stage === 1) k.reach(1);
          if (k.stage === 2 && Math.abs(B - A) >= 6) k.reach(2);
        },
        control(id, v) { if (id === 'base' && v >= Math.log10(3000) && k.stage === 3) k.reach(3); },
        key(e) {
          if (e.key === 'ArrowLeft') { offset = Math.max(0, offset - 1); e.preventDefault(); }
          if (e.key === 'ArrowRight') { offset += 1; e.preventDefault(); }
        },
        maths() {
          const K = k.values.pairs, base = 10 ** k.values.base, th = thetas(K, base), m = Math.round(pos(A)), n = Math.round(pos(B));
          const ca = content(WORDS[A], K), cb = content(WORDS[B], K);
          const rows = th.map((t, i) => {
            const ang = ((n - m) * t + cb[i].phase - ca[i].phase) % (Math.PI * 2);
            return `<tr><td>pair ${i + 1}</td><td>${fmt(t, 4)}</td><td>${fmt((n - m) * t, 2)}</td><td>${fmt(ca[i].mag * cb[i].mag * Math.cos(ang), 3)}</td></tr>`;
          }).join('');
          return `<p class="eq">R(m·θ)q · R(n·θ)k = q · R((n−m)·θ)k\nθᵢ = base^(−i/${K})</p>
            <div class="row"><span>m (“${WORDS[A]}”), n (“${WORDS[B]}”)</span><span>${m}, ${n}</span></div>
            <div class="row"><span>distance n − m</span><span class="hl">${n - m}</span></div>
            <div class="row"><span>base</span><span>${Math.round(base).toLocaleString()}</span></div>
            <table><tr><th>orbit</th><th>θᵢ</th><th>(n−m)θᵢ</th><th>term</th></tr>${rows}</table>
            <div class="row"><span>normalised score</span><span class="hl">${fmt(score(K, base, WORDS[A], WORDS[B], m, n), 3)}</span></div>`;
        }
      };
    },

    poster(ctx, w, h, t) {
      const cx = w / 2, cy = h * 0.47, R = Math.min(w, h) * 0.36;
      backdrop(ctx, w, h, cx, cy, R);
      ctx.globalCompositeOperation = 'lighter';
      spiro(ctx, cx, cy, R * 1.25, 6, 100, 0.16, 200);
      ctx.globalCompositeOperation = 'source-over';
      const off = t * 1.2;
      rings(ctx, cx, cy, R, 6, 100, off + 9, off + 1, 'it', 'cat', t);
    }
  });
})();
