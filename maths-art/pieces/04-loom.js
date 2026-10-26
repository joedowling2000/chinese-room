/* 04 · Loom — attention.
   The words of a sentence are pins around a ring. Each word asks every earlier
   word a question (query · key); softmax turns the answers into thread tension;
   the word becomes a weighted blend of what it listened to. */
(() => {
  const { draw, fmt, clamp } = Interiors;

  // Toy features: [animate, spatial, plural, singular]. Each token has what it IS (f)
  // and, for some heads, what it is LOOKING FOR (want). Scores are dot products of these.
  const N = (f) => ({ f, noun: 1 });
  const SENTENCES = {
    tired: { label: '…too tired', toks: [
      ['The'], ['animal', N([1, 0, 0, 1])], ["didn't"], ['cross'], ['the'], ['street', N([0, 1, 0, 1])], ['because'],
      ['it', { f: [.5, .5, 0, 1], noun: .7, sem: [.5, .5, 0, 0] }], ['was', { num: [0, 0, 0, 1] }], ['too'], ['tired', { sem: [1, 0, 0, 0] }], ['.']] },
    wide: { label: '…too wide', toks: [
      ['The'], ['animal', N([1, 0, 0, 1])], ["didn't"], ['cross'], ['the'], ['street', N([0, 1, 0, 1])], ['because'],
      ['it', { f: [.5, .5, 0, 1], noun: .7, sem: [.5, .5, 0, 0] }], ['was', { num: [0, 0, 0, 1] }], ['too'], ['wide', { sem: [0, 1, 0, 0] }], ['.']] },
    keys: { label: 'The keys … are', toks: [
      ['The'], ['keys', N([0, 0, 1, 0])], ['to'], ['the'], ['old'], ['cabinet', N([0, 0, 0, 1])], ['are', { num: [0, 0, 1, 0] }], ['on'], ['the'], ['table', N([0, 0, 0, 1])], ['.']] },
    copy: { label: 'Ada met Turing…', toks: [
      ['Ada', N([1, 0, 0, 1])], ['met'], ['Turing', N([1, 0, 0, 1])], ['in'], ['London', N([0, 1, 0, 1])], ['.'], ['Years'], ['later'], [','], ['Ada'], ['met']] }
  };

  const HEADS = [
    { id: 'prev', name: 'previous word', color: [110, 220, 255] },
    { id: 'sem', name: 'meaning', color: [255, 128, 104] },
    { id: 'num', name: 'agreement', color: [255, 206, 102] },
    { id: 'copy', name: 'copying', color: [186, 140, 255] }
  ];
  const SINK = 1.4; // every head parks spare attention on the first token (an "attention sink")

  const dot = (a, b) => a.reduce((s, v, i) => s + v * (b[i] || 0), 0);
  function score(head, toks, i, j) {
    const qi = toks[i][1] || {}, kj = toks[j][1] || {};
    let s = j === 0 ? SINK : 0;
    if (head === 'prev') s += j === i - 1 ? 5 : 0;
    if (head === 'sem' && qi.sem && kj.f) s += 6 * dot(qi.sem, kj.f.slice(0, 2)) * (kj.noun || 0);
    if (head === 'num' && qi.num && kj.f) s += 6 * dot(qi.num, kj.f) * (kj.noun || 0);
    if (head === 'copy' && j > 0 && j <= i && toks[j - 1][0] === toks[i][0] && j - 1 !== i) s += 6;
    return s;
  }
  function attend(head, toks, i, tau) {
    const s = [];
    for (let j = 0; j <= i; j++) s.push(score(head, toks, i, j) / tau);
    const m = Math.max(...s), e = s.map(v => Math.exp(v - m)), z = e.reduce((a, b) => a + b, 0);
    return { scores: s.map(v => v * tau), w: e.map(v => v / z) };
  }

  // value colours: each token carries a colour as its "content"
  function valueColor(word, idx) {
    let h = 0; for (const c of word) h = (h * 31 + c.charCodeAt(0)) % 360;
    const hue = (h * 7 + idx * 3) % 360;
    return hsl(hue, 0.75, 0.62);
  }
  function hsl(h, s, l) {
    const a = s * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
    return [f(0) * 255, f(8) * 255, f(4) * 255];
  }
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

  // an arch: the sentence reads left to right over the top, leaving the floor clear
  function layout(n, w, h) {
    const narrow = w < 760, cx = w * 0.5, cy = narrow ? h * 0.46 : h * 0.58;
    const R = narrow ? Math.min(w * 0.27, h * 0.26) : Math.min(w * 0.27, h * 0.44);
    const a0 = Math.PI - 0.12, span = Math.PI + 0.24, pins = [];
    for (let i = 0; i < n; i++) {
      const a = a0 + span * i / (n - 1);
      pins.push({ a, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
    }
    return { cx, cy, R, pins };
  }

  // the full weave: every word's threads to every earlier word, for each head
  function weave(ctx, toks, L, heads, tau, t, alpha = 1, focus = -1) {
    ctx.globalCompositeOperation = 'lighter';
    const n = toks.length;
    heads.forEach((H, hi) => {
      for (let i = 1; i < n; i++) {
        const { w } = attend(H.id, toks, i, tau);
        for (let j = 0; j < i; j++) {
          const wt = w[j]; if (wt < 0.02) continue;
          const dim = focus >= 0 && i !== focus ? 0.35 : 1;
          const A = L.pins[j], B = L.pins[i];
          // a ribbon of fanned strings, slightly offset per head
          const strands = 4;
          for (let s = 0; s < strands; s++) {
            const off = (s - (strands - 1) / 2) * 0.012 + (hi - 1.5) * 0.01;
            const ax = L.cx + L.R * Math.cos(A.a + off), ay = L.cy + L.R * Math.sin(A.a + off);
            const bx = L.cx + L.R * Math.cos(B.a - off), by = L.cy + L.R * Math.sin(B.a - off);
            const wob = Math.sin(t * 2.1 + i * 1.7 + j * 2.3 + s) * (1 - wt) * 6;
            const mx = (ax + bx) / 2 + (L.cx - (ax + bx) / 2) * 0.18 + wob, my = (ay + by) / 2 + (L.cy - (ay + by) / 2) * 0.18 - wob;
            ctx.strokeStyle = rgba(H.color, Math.min(0.55, wt * 0.5) * alpha * dim);
            ctx.lineWidth = 0.6 + wt * 1.2;
            ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, my, bx, by); ctx.stroke();
          }
        }
      }
    });
    ctx.globalCompositeOperation = 'source-over';
  }

  function background(ctx, w, h, L) {
    ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(L.cx, L.cy, 0, L.cx, L.cy, L.R * 1.6);
    g.addColorStop(0, '#120f1c'); g.addColorStop(1, '#05060a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(L.cx, L.cy, L.R, Math.PI - 0.12, 0.12); ctx.stroke();
    ctx.beginPath(); ctx.arc(L.cx, L.cy, L.R + 8, Math.PI - 0.12, 0.12); ctx.stroke();
  }

  Interiors.register({
    id: 'attention', no: '04', concept: 'Attention', title: 'Loom', accent: '#ff9a7c',
    caption: 'Every word asks every earlier word a question, and becomes a blend of the answers.',
    label: 'Words of a sentence around a ring, connected by coloured threads whose thickness is the attention weight.',
    mathsTitle: 'Query, key, value',
    controls: [
      { type: 'choice', id: 'sentence', label: 'Sentence', value: 'tired', options: Object.entries(SENTENCES).map(([k, s]) => [k, s.label]) },
      { type: 'choice', id: 'head', label: 'Heads', value: 'all', options: [['all', 'All four'], ...HEADS.map(h => [h.id, h.name])] },
      { type: 'range', id: 'tau', label: 'Temperature τ', min: 0.15, max: 3, step: 0.05, value: 1, fmt: v => Number(v).toFixed(2) }
    ],
    prompts: [
      { do: 'Tap the word <b>tired</b>.', saw: 'Its strongest thread runs back to <b>animal</b>. The adjective asks “who could be tired?” and every earlier word answers; <b>animal</b> matches best. The orb at the centre is <b>tired</b>’s new meaning: a blend of the words it listened to.' },
      { do: 'Switch the sentence to <b>…too wide</b>, then tap <b>wide</b>.', saw: 'Same position, new question: “what could be wide?” The thread swings to <b>street</b>. Attention is recomputed from the content of the words every time.' },
      { do: 'Tap <b>it</b>.', saw: 'At <b>it</b>, the model hasn’t read <i>tired</i> or <i>wide</i> yet, so its attention is split between the nouns. Threads only run backwards: no word may look into the future. This is the causal mask.' },
      { do: 'Drag the temperature right down, then right up.', saw: 'Low temperature makes one taut thread, a hard choice. High temperature makes a haze, and the word becomes an average of everything before it.' },
      { do: 'Try <b>Ada met Turing…</b> and tap the last <b>met</b>.', saw: 'The violet copying head finds the earlier <b>met</b> and looks at the word that came after it: <b>Turing</b>. That is how a model continues a pattern it has seen once (an “induction head”).' }
    ],
    coda: 'Each colour is a separate head asking its own question in parallel. Spare attention parks on the first word, as it does in real models. Open the maths for the scores.',
    walk: [
      'Each word produces three vectors: a <b>query</b> (what am I looking for?), a <b>key</b> (what do I offer?) and a <b>value</b> (what will I hand over if chosen?).',
      'The query of the selected word is compared with the key of every earlier word by a <b>dot product</b>. A large dot product means the two point the same way: a good match.',
      '<b>Softmax</b> turns those scores into weights that are positive and add up to 1. That is the thread tension you see. Temperature τ divides the scores first: small τ exaggerates differences, large τ flattens them.',
      'The output is the weighted sum of the values. Here each value is drawn as a colour, so the orb in the centre is literally Σ wᵢ·vᵢ.'
    ],
    inside: [
      'This is the attention block, run at every layer. A model like GPT has dozens of heads per layer, each with its own learned query, key and value matrices, so each head asks a different kind of question. Their outputs are concatenated and mixed back into the token’s vector.',
      'Every token has to score every earlier token, so the cost grows with the square of the context length: the reason long prompts are expensive.'
    ],
    honest: 'These heads are hand-built toys: the query and key vectors are small feature lists (animate, spatial, plural, singular, position) written by hand so that the patterns are legible. The softmax, temperature, causal mask and weighted sum are computed exactly. Real heads learn their patterns, and are rarely this clean.',
    refs: [['Vaswani et al. 2017 — Attention Is All You Need', 'https://arxiv.org/abs/1706.03762'], ['Olsson et al. 2022 — In-context learning and induction heads', 'https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html'], ['Xiao et al. 2023 — Attention sinks', 'https://arxiv.org/abs/2309.17453']],

    create(k) {
      const { ctx, octx } = k;
      let sentence = 'tired', toks = SENTENCES.tired.toks, L = null;
      let query = 6, hover = -1, sawLow = false, sawHigh = false;
      let shown = null; // eased weights for the selected query, per head
      const flows = []; // particles carrying value colour from key to query
      const drone = k.sound.drone(220, 'sine');

      const heads = () => k.values.head === 'all' ? HEADS : HEADS.filter(h => h.id === k.values.head);
      const relayout = () => { L = layout(toks.length, k.w, k.h); };
      function pick(p) {
        if (!L) return -1;
        let best = -1, bd = 46;
        L.pins.forEach((q, i) => {
          const lx = L.cx + (L.R + 34) * Math.cos(q.a), ly = L.cy + (L.R + 34) * Math.sin(q.a);
          const d = Math.min(Math.hypot(q.x - p.x, q.y - p.y), Math.hypot(lx - p.x, ly - p.y));
          if (d < bd) { bd = d; best = i; }
        });
        return best;
      }
      function select(i) {
        query = i;
        const word = toks[i][0];
        if (k.stage === 0 && sentence === 'tired' && word === 'tired') k.reach(0);
        if (k.stage === 1 && sentence === 'wide' && word === 'wide') k.reach(1);
        if (k.stage === 2 && word === 'it') k.reach(2);
        if (k.stage === 4 && sentence === 'copy' && i === toks.length - 1) k.reach(4);
        k.sound.tone(196 * 2 ** ((i % 8) / 8), 0.6, 0.05);
      }
      function mix(i) {
        const col = [0, 0, 0], hs = heads();
        hs.forEach(H => {
          const { w } = attend(H.id, toks, i, k.values.tau);
          w.forEach((wt, j) => { const c = valueColor(toks[j][0], j); col[0] += c[0] * wt / hs.length; col[1] += c[1] * wt / hs.length; col[2] += c[2] * wt / hs.length; });
        });
        return col;
      }

      return {
        resize: relayout,
        frame(t, dt) {
          if (!L) relayout();
          const tau = k.values.tau, hs = heads(), tt = k.motion ? t : 0;
          background(ctx, k.w, k.h, L);
          weave(ctx, toks, L, hs, tau, tt, 0.7, query);

          // the selected word's threads: thick, curved, with travelling light
          const target = hs.map(H => attend(H.id, toks, query, tau).w);
          if (!shown || shown.length !== target.length || shown[0].length !== target[0].length) shown = target.map(w => w.map(() => 0));
          shown = shown.map((w, h) => w.map((v, j) => v + (target[h][j] - v) * (1 - Math.exp(-dt * 8))));
          ctx.globalCompositeOperation = 'lighter';
          const B = L.pins[query];
          hs.forEach((H, hi) => {
            shown[hi].forEach((wt, j) => {
              if (j === query || wt < 0.01) return;
              const A = L.pins[j];
              const mx = (A.x + B.x) / 2 + (L.cx - (A.x + B.x) / 2) * (0.55 + hi * 0.08), my = (A.y + B.y) / 2 + (L.cy - (A.y + B.y) / 2) * (0.55 + hi * 0.08);
              for (const [lw, al] of [[10 * wt + 2, 0.08], [3.5 * wt + 0.6, 0.85]]) {
                ctx.strokeStyle = rgba(H.color, al * Math.min(1, wt * 1.6 + 0.08)); ctx.lineWidth = lw;
                ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.quadraticCurveTo(mx, my, B.x, B.y); ctx.stroke();
              }
              if (k.motion && Math.random() < wt * dt * 30) flows.push({ A, B, mx, my, s: 0, c: valueColor(toks[j][0], j), v: 0.35 + Math.random() * 0.3 });
            });
          });
          // value particles travel from key to query along the curve
          for (let f = flows.length - 1; f >= 0; f--) {
            const q = flows[f]; q.s += dt * q.v;
            if (q.s >= 1) { flows.splice(f, 1); continue; }
            const s = q.s, x = (1 - s) ** 2 * q.A.x + 2 * (1 - s) * s * q.mx + s * s * q.B.x, y = (1 - s) ** 2 * q.A.y + 2 * (1 - s) * s * q.my + s * s * q.B.y;
            draw.glowDot(ctx, x, y, 7, rgba(q.c, 0.9));
          }
          if (flows.length > 400) flows.splice(0, flows.length - 400);

          // the medallion: the query's output, rings of contributor colours
          const raw = mix(query), peak = Math.max(...raw, 1), lo = Math.min(...raw);
          const out = raw.map(v => clamp((v - lo * 0.6) / (peak - lo * 0.6) * 235, 0, 255)); // shown with boosted saturation, same hue
          const rr = L.R * 0.2;
          draw.glowDot(ctx, L.cx, L.cy, rr * 3.2, rgba(out, 0.35));
          ctx.globalCompositeOperation = 'source-over';
          let a0 = -Math.PI / 2;
          const w0 = target.reduce((acc, w) => w.map((v, j) => (acc[j] || 0) + v / target.length), []);
          w0.forEach((wt, j) => {
            const a1 = a0 + wt * Math.PI * 2;
            ctx.fillStyle = rgba(valueColor(toks[j][0], j), 0.9);
            ctx.beginPath(); ctx.moveTo(L.cx, L.cy); ctx.arc(L.cx, L.cy, rr, a0, a1); ctx.closePath(); ctx.fill();
            a0 = a1;
          });
          ctx.fillStyle = rgba(out, 1); ctx.beginPath(); ctx.arc(L.cx, L.cy, rr * 0.62, 0, 7); ctx.fill();
          ctx.strokeStyle = 'rgba(5,6,10,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(L.cx, L.cy, rr * 0.62, 0, 7); ctx.stroke();

          // pins and words
          octx.clearRect(0, 0, k.w, k.h);
          toks.forEach(([word], i) => {
            const q = L.pins[i], c = valueColor(word, i), sel = i === query, future = i > query;
            const lx = L.cx + (L.R + 22) * Math.cos(q.a), ly = L.cy + (L.R + 22) * Math.sin(q.a);
            const right = Math.cos(q.a) >= -0.01;
            octx.globalCompositeOperation = 'lighter';
            draw.glowDot(octx, q.x, q.y, sel ? 30 : 14, rgba(sel ? out : c, future ? 0.12 : sel ? 0.8 : 0.45));
            octx.globalCompositeOperation = 'source-over';
            octx.fillStyle = future ? 'rgba(255,255,255,.25)' : '#fff';
            octx.beginPath(); octx.arc(q.x, q.y, sel ? 5 : 3, 0, 7); octx.fill();
            // label with the strongest head's weight, in that head's colour
            let wsum = 0, wcol = c;
            if (!sel) (shown || []).forEach((w, hi) => { if ((w[i] || 0) > wsum) { wsum = w[i]; wcol = hs[hi].color; } });
            const col = future ? 'rgba(200,205,215,.28)' : sel ? '#fff' : i === hover ? '#fff' : `rgba(236,240,244,${0.55 + 0.45 * Math.min(1, (wsum || 0) * 3)})`;
            draw.label(octx, word, lx, ly, col, `${sel ? 600 : 400} ${(sel ? 19 : 15) - (k.w < 760 ? 3 : 0)}px "DM Sans", sans-serif`, right ? 'left' : 'right');
            if (!sel && !future && wsum > 0.06) draw.label(octx, `${Math.round(wsum * 100)}%`, lx + (right ? 1 : -1) * (octx.measureText(word).width + 8), ly, rgba(wcol, 1), '11px "IBM Plex Mono", monospace', right ? 'left' : 'right');
            if (future && i === query + 1) draw.label(octx, 'masked: not yet read →', lx, ly + 18, 'rgba(200,205,215,.35)', '10px "IBM Plex Mono", monospace', right ? 'left' : 'right');
          });
          draw.label(octx, `“${toks[query][0]}” becomes`, L.cx, L.cy + L.R * 0.2 + 22, 'rgba(236,240,244,.7)', '11px "IBM Plex Mono", monospace', 'center');
          // legend of heads
          if (k.w > 760) hs.forEach((H, i) => draw.label(octx, `— ${H.name}`, 28, 100 + i * 20, rgba(H.color, 0.95), '12px "IBM Plex Mono", monospace'));

          // entropy of attention drives a soft drone
          const ent = -w0.reduce((s, v) => s + (v > 0 ? v * Math.log(v) : 0), 0);
          drone.set(110 + ent * 70, 0.025);
          k.over.style.cursor = hover >= 0 ? 'pointer' : 'default';
        },
        tap(p) { const i = pick(p); if (i >= 0) select(i); },
        move(p) { hover = pick(p); },
        leave() { hover = -1; },
        control(id, v) {
          if (id === 'sentence') {
            sentence = v; toks = SENTENCES[v].toks; relayout(); shown = null; flows.length = 0;
            query = Math.min(query, toks.length - 1);
            if (v === 'copy') query = toks.length - 1;
            const target = v === 'tired' ? 'tired' : v === 'wide' ? 'wide' : v === 'keys' ? 'are' : null;
            if (target) query = toks.findIndex(x => x[0] === target);
          }
          if (id === 'head') shown = null;
          if (id === 'tau') {
            if (v < 0.4) sawLow = true;
            if (v > 2.2) sawHigh = true;
            if (k.stage === 3 && sawLow && sawHigh) k.reach(3);
          }
        },
        key(e) {
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { select((query + 1) % toks.length); e.preventDefault(); }
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { select((query + toks.length - 1) % toks.length); e.preventDefault(); }
        },
        maths() {
          const hs = heads(), tau = k.values.tau;
          const rows = hs.map(H => {
            const { scores, w } = attend(H.id, toks, query, tau);
            return `<p class="hl" style="color:${rgba(H.color, 1)};margin:12px 0 4px">${H.name} head</p><table><tr><th>key</th><th>q·k</th><th>weight</th><th></th></tr>${
              w.map((wt, j) => `<tr><td>${Interiors.esc(toks[j][0])}</td><td>${fmt(scores[j], 1)}</td><td>${fmt(wt, 3)}</td><td style="width:70px"><span class="bar" style="width:${Math.round(wt * 70)}px;background:${rgba(H.color, 1)}"></span></td></tr>`).join('')}</table>`;
          }).join('');
          return `<p class="eq">wⱼ = softmax(qᵢ·kⱼ / τ)   for j ≤ i\nout = Σ wⱼ·vⱼ</p>
            <div class="row"><span>query</span><span class="hl">“${Interiors.esc(toks[query][0])}” (position ${query})</span></div>
            <div class="row"><span>temperature τ</span><span>${fmt(tau)}</span></div>${rows}`;
        }
      };
    },

    poster(ctx, w, h, t) {
      const toks = SENTENCES.tired.toks, L = layout(toks.length, w, h);
      L.R = Math.min(w * 0.34, h * 0.44); L.cy = h * 0.56;
      L.pins.forEach(p => { p.x = L.cx + L.R * Math.cos(p.a); p.y = L.cy + L.R * Math.sin(p.a); });
      background(ctx, w, h, L);
      weave(ctx, toks, L, HEADS, 0.8 + 0.4 * Math.sin(t * 0.5), t, 1.3);
      L.pins.forEach(p => { draw.glowDot(ctx, p.x, p.y, 8, 'rgba(255,220,200,.6)'); });
    }
  });
})();
