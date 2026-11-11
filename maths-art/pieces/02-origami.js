/* 02 · Origami — the ReLU activation.
   The word-space of the Lattice, one room on. A feed-forward layer is asked to
   keep one kind of word and push the rest away. Each hidden neuron is a crease:
   silent on one side of its line, a ramp on the other, h = max(0, z). Their sum
   folds the plane like paper, and the fold can draw what no matrix can. */
(() => {
  const { draw, fmt, clamp } = Interiors;
  const PINK = '255,138,208', IVORY = '236,232,220', RED = '255,120,110';
  // one colour per neuron, so a crease and its dot on the hinge graph can be matched
  const NCOL = ['255,138,208', '158,230,212', '255,206,102', '186,160,255', '110,200,255', '255,160,122'];
  const GAIN = 1.5;      // how steeply a neuron's ramp rises past its line
  const KEEP = 0.5;      // a word is kept while the layer's output stays above this

  // The same illustrative placements as the Lattice, with the kind of each word.
  const WORDS = [
    ['man', 0.9, -1.1, 'people'], ['woman', 0.9, 0.9, 'people'], ['king', 2.6, -1.1, 'people'], ['queen', 2.6, 0.9, 'people'],
    ['boy', -0.7, -1.5, 'people'], ['girl', -0.7, 0.5, 'people'],
    ['Paris', -2.6, 2.1, 'places'], ['France', -1.4, 2.6, 'places'], ['Rome', -2.9, 0.9, 'places'], ['Italy', -1.7, 1.4, 'places'],
    ['cat', -2.5, -1.9, 'animals'], ['kitten', -3.3, -2.5, 'animals'], ['dog', -1.6, -2.3, 'animals'], ['puppy', -2.4, -2.9, 'animals'],
    ['walk', 1.6, 2.4, 'verbs'], ['walked', 2.7, 2.9, 'verbs'], ['swim', 1.1, 3.0, 'verbs'], ['swam', 2.2, 3.5, 'verbs'],
    ['code', 3.5, -2.6, 'tech'], ['maths', 2.6, -3.0, 'tech']
  ];
  const TASKS = { places: 'places', people: 'people', animals: 'animals' };
  // one arrangement that works for each task: [anchor x, anchor y, normal angle in degrees]
  const ANSWERS = {
    places: [[-1.3, 1.3, -45]],
    people: [[1, 1.55, 90], [-1.1, 0, 180], [1, -1.95, -90]],
    animals: [[-1.7, -1.7, 45]]
  };
  // where a newly added neuron first appears: a loose ring that solves nothing
  const SPAWN = [[-0.3, 0.6, 0], [0.8, 2.6, 110], [0.6, -2.7, -100], [-2.2, -0.4, 200], [3.3, 0.2, 20], [-0.6, 2.2, 150]];

  const gelu = z => 0.5 * z * (1 + Math.tanh(0.7978845608 * (z + 0.044715 * z * z * z)));
  const ACT = { relu: z => (z > 0 ? z : 0), gelu, none: z => z };
  const SLOPE = { relu: z => (z > 0 ? 1 : 0), gelu: z => (gelu(z + 0.01) - gelu(z - 0.01)) / 0.02, none: () => 1 };

  const neuron = ([px, py, deg]) => ({ px, py, a: deg * Math.PI / 180 });
  const zOf = (N, x, y) => GAIN * ((x - N.px) * Math.cos(N.a) + (y - N.py) * Math.sin(N.a));
  // the layer: y = max(0, 1 − Σ act(zᵢ)); with no activation the output is left unclipped too
  function layer(neurons, act, x, y) {
    let r = 0;
    for (const N of neurons) r += ACT[act](zOf(N, x, y));
    return { r, y: act === 'none' ? 1 - r : Math.max(0, 1 - r) };
  }
  function score(neurons, act, task) {
    let kept = 0, wrong = 0, total = 0;
    const state = WORDS.map(([, x, y, kind]) => {
      const on = layer(neurons, act, x, y).y > KEEP, want = kind === task;
      if (want) { total++; if (on) kept++; } else if (on) wrong++;
      return { on, want };
    });
    return { kept, wrong, total, state, perfect: kept === total && wrong === 0 };
  }

  // The folded sheet seen from above, lit from one side: every facet is a region
  // where the same neurons are firing, so the layer is exactly linear there.
  function sheet(buf, bw, bh, s, view, neurons, act, lines) {
    const img = buf.createImageData(bw, bh), d = img.data;
    const cs = neurons.map(N => [N.px, N.py, Math.cos(N.a), Math.sin(N.a)]), f = ACT[act], df = SLOPE[act];
    const LX = -0.55, LY = 0.83, pxWorld = s / view.u;
    for (let j = 0, o = 0; j < bh; j++) {
      const wy = (view.cy - (j + 0.5) * s) / view.u;
      for (let i = 0; i < bw; i++, o += 4) {
        const wx = ((i + 0.5) * s - view.cx) / view.u;
        let r = 0, gx = 0, gy = 0;
        for (const c of cs) {
          const z = GAIN * ((wx - c[0]) * c[2] + (wy - c[1]) * c[3]), sl = df(z);
          r += f(z); gx += sl * c[2]; gy += sl * c[3];
        }
        const g = Math.hypot(gx, gy) * GAIN, y = clamp(1 - r, 0, 1);
        // paper: facets on the slopes, brighter where they face the light, fading as they fall away
        const lit = g > 0.02 ? 0.5 + 0.5 * (gx * LX + gy * LY) / (g / GAIN) : 0;
        const fall = Math.exp(-Math.max(0, r) * 0.32), slope = Math.min(1, g * 0.9);
        let R = 9 + slope * fall * (14 + 132 * lit * lit), G = 8 + slope * fall * (9 + 70 * lit * lit), B = 15 + slope * fall * (30 + 150 * lit * lit);
        // the plateau that is left alone glows
        const glow = y * y;
        R += glow * 50; G += glow * 20; B += glow * 42;
        // contour lines of the push r; the one at the keep level is the layer's decision
        if (lines && g > 0.02) {
          const m = r / 0.5, near = Math.round(m), dist = Math.abs(m - near) * 0.5 / g / pxWorld;
          if (dist < 1.3) {
            const edge = near === 1, al = (1.3 - dist) / 1.3 * (edge ? 0.75 : 0.3 * Math.exp(-Math.abs(r) * 0.25));
            R += al * (edge ? 255 : 255); G += al * (edge ? 236 : 138); B += al * (edge ? 228 : 208);
          }
        }
        d[o] = R > 255 ? 255 : R; d[o + 1] = G > 255 ? 255 : G; d[o + 2] = B > 255 ? 255 : B; d[o + 3] = 255;
      }
    }
    buf.putImageData(img, 0, 0);
  }

  function paint(ctx, w, h, view, buf, st, opts = {}) {
    const { neurons, act, task, sc } = st, S = (x, y) => [view.cx + x * view.u, view.cy - y * view.u];
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(buf.canvas, 0, 0, w, h);

    // the lattice the words stand on, as in the first room
    const span = Math.ceil(Math.hypot(w, h) / view.u / 2) + 1;
    ctx.strokeStyle = `rgba(${IVORY},0.045)`; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = -span; i <= span; i++) {
      ctx.moveTo(...S(i, -span)); ctx.lineTo(...S(i, span));
      ctx.moveTo(...S(-span, i)); ctx.lineTo(...S(span, i));
    }
    ctx.stroke();

    // the creases: one straight line per neuron, with ticks on the side it pushes
    const far = Math.hypot(w, h) / view.u;
    neurons.forEach((N, i) => {
      const col = NCOL[i % NCOL.length], nx = Math.cos(N.a), ny = Math.sin(N.a), hot = opts.hot === i;
      const a = S(N.px + ny * far, N.py - nx * far), b = S(N.px - ny * far, N.py + nx * far);
      ctx.globalCompositeOperation = 'lighter';
      for (const [lw, al] of [[12, 0.07], [4, 0.18], [1.5, 0.95]]) {
        ctx.strokeStyle = `rgba(${col},${al * (hot ? 1.35 : 1)})`; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
      }
      ctx.strokeStyle = `rgba(${col},.5)`; ctx.lineWidth = 1; ctx.beginPath();
      for (let q = -Math.ceil(far * 2.5); q <= far * 2.5; q++) {
        const [x, y] = S(N.px + ny * q * 0.4, N.py - nx * q * 0.4);
        ctx.moveTo(x, y); ctx.lineTo(x + nx * 7, y - ny * 7);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      if (opts.handles) {
        const P = S(N.px, N.py), T = S(N.px + nx * 0.75, N.py + ny * 0.75);
        ctx.strokeStyle = ctx.fillStyle = `rgb(${col})`; ctx.lineWidth = 2.5;
        draw.arrow(ctx, P[0], P[1], T[0], T[1], 11);
        ctx.globalCompositeOperation = 'lighter';
        draw.glowDot(ctx, P[0], P[1], 26, `rgba(${col},.45)`);
        ctx.globalCompositeOperation = 'source-over';
        ctx.beginPath(); ctx.arc(P[0], P[1], 7, 0, 7); ctx.fill();
        ctx.strokeStyle = '#05060a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(P[0], P[1], 3, 0, 7); ctx.stroke();
        draw.label(ctx, `neuron ${i + 1} pushes →`, T[0] + 10 * nx + (nx < -0.3 ? -8 : 8), T[1] - 10 * ny, `rgb(${col})`, '500 12px "IBM Plex Mono", monospace', nx < -0.3 ? 'right' : 'left');
      }
    });

    // the words: lit if the layer leaves them alone
    WORDS.forEach(([word, x, y], i) => {
      const [px, py] = S(x, y), s = sc.state[i], hot = opts.hover === i;
      if (px < -60 || py < -30 || px > w + 60 || py > h + 30) return;
      const mistake = s.on && !s.want;
      ctx.globalCompositeOperation = 'lighter';
      if (s.on) draw.glowDot(ctx, px, py, hot ? 30 : 22, `rgba(${mistake ? RED : PINK},${mistake ? 0.5 : 0.6})`);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = s.on ? '#fff' : 'rgba(210,205,225,.42)';
      ctx.beginPath(); ctx.arc(px, py, s.on ? 3.2 : 2.2, 0, 7); ctx.fill();
      if (s.want) { // a ring marks the words this task asks for
        ctx.strokeStyle = s.on ? `rgba(${PINK},.95)` : `rgba(${IVORY},.55)`; ctx.lineWidth = 1.2;
        if (!s.on) ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.arc(px, py, 9, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      }
      if (opts.words !== false) draw.label(ctx, word, px + 12, py - 10, mistake ? `rgb(${RED})` : s.on ? '#fff' : hot ? 'rgba(236,240,244,.9)' : 'rgba(214,210,228,.5)', `${s.on ? 500 : 400} 12px "IBM Plex Mono", monospace`);
    });
  }

  function makeBuffer() { const c = document.createElement('canvas'); return { canvas: c, ctx: c.getContext('2d', { willReadFrequently: true }) }; }

  Interiors.register({
    id: 'folding', no: '02', concept: 'Non-linearity', title: 'Origami', maths: 'ReLU activation', eq: 'h = max(0, z)',
    accent: '#ff8ad0',
    you: 'You are inside a feed-forward layer, deciding which words to leave alone.',
    hear: 'Each neuron is a string. Point at a word and you hear only the neurons that fire for it, louder the harder they push; a word every neuron is silent on makes no sound at all. That silence is the zero in max(0, z).',
    caption: 'A neuron is silent on one side of a line. Enough of them fold the space into shapes no matrix can draw.',
    label: 'A dark sheet of word-points creased by bright lines; the region the neurons leave alone glows and keeps its words lit.',
    mathsTitle: 'A bend at zero',
    controls: [
      { type: 'choice', id: 'task', label: 'Keep only the', value: 'places', options: [['places', 'Places'], ['people', 'People'], ['animals', 'Animals']] },
      { type: 'range', id: 'n', label: 'Neurons (creases)', min: 1, max: 6, step: 1, value: 1, fmt: v => String(v) },
      { type: 'choice', id: 'act', label: 'Activation', value: 'relu', options: [['relu', 'ReLU'], ['gelu', 'GELU'], ['none', 'None (linear)']] },
      { type: 'toggle', id: 'lines', label: 'Contour lines', value: true },
      { type: 'button', id: 'solve', label: 'Show one answer' }
    ],
    prompts: [
      { do: 'Drag the bright crease (its dot moves it, its arrow turns it) until only the four ringed <b>places</b> stay lit.', saw: 'One neuron asks one straight question: how far past my line is this word? Behind the line its answer is exactly zero, and the word is left alone. Past the line it pushes, harder the further the word lies. That bend at zero is all of <b>h = max(0, z)</b>.' },
      { do: 'Point at a word on each side of the crease and watch the small graph.', saw: 'Every word hands the neuron a number z. Negative: nothing comes out. Positive: it passes straight through. Flat, then a ramp. This hinge is the only thing in the whole layer that is not a matrix.' },
      { do: 'Switch <b>Keep only the</b> to <b>People</b>, and try to do it with one crease.', saw: 'It cannot be done. The people stand in the middle with other words on every side, and one neuron only ever draws one straight line. This is exactly as far as a matrix can go.' },
      { do: 'Raise <b>Neurons</b> and place the creases around the people.', saw: 'Each neuron is still only a straight line and a bend. But their silent sides overlap, and the overlap has <b>corners</b>: a shape no single line could draw. More neurons, finer shapes. This is what a feed-forward layer’s width buys.' },
      { do: 'Now set <b>Activation</b> to <b>None (linear)</b>.', saw: 'The shape is gone. Without the bend every neuron pushes on both sides of its line; the pushes add up to one tilted, flat sheet, and the whole layer is a single straight cut again. However many neurons you add, it is one matrix in disguise.' },
      { do: 'Try <b>GELU</b>, the smooth bend most language models use.', saw: 'The corners round off and the sheet curves instead of creasing, but the shape is back. GELU is the same idea with a soft hinge, which gives training a slope to follow on both sides of zero.' }
    ],
    coda: 'Stack layers and the creases themselves get folded: depth multiplies the number of facets where width only adds to it.',
    walk: [
      'Each crease is one hidden neuron. It measures how far a word lies past its line, <b>zᵢ = nᵢ·x − bᵢ</b>, and passes that on only if it is positive: <b>hᵢ = max(0, zᵢ)</b>. That is ReLU. On the near side the neuron says nothing at all.',
      'One output neuron adds the pushes up and subtracts them from 1: <b>y = max(0, 1 − Σ hᵢ)</b>. A word is kept while y stays above ½, so the kept region is where no neuron pushes hard: the overlap of all the silent sides.',
      'The sheet is that function drawn as folded paper. Inside each facet the same neurons are firing, so the layer is exactly linear there; the creases are where a neuron switches on. The bright contour is y = ½, the layer’s decision.',
      'Take the bend away and Σ zᵢ is a sum of linear functions, which is one linear function: a flat tilted sheet whose decision is one straight line. The activation is the only reason a second neuron, or a second layer, adds anything.'
    ],
    inside: [
      'Every transformer layer contains a feed-forward block: a matrix, a non-linearity, another matrix. It holds about two-thirds of the model’s parameters, and it is where the computation stops being linear.',
      'Its hidden neurons are thousands of creases through a space of thousands of dimensions. Interpretability work often finds neurons, or small groups of them, that stay silent for most text and fire for one kind of thing. Modern models use smooth cousins of ReLU (GELU, SwiGLU), so their creases are rounded, but the role is the same: without the activation, a hundred layers would collapse into one matrix.'
    ],
    honest: 'A real two-layer network, computed exactly for every pixel: up to six hidden ReLU neurons whose lines you place by hand, and one output neuron with weights −1 and bias 1. The word positions are the illustrative placements from the Lattice, and the three tasks are chosen so that two need one crease and one needs several. A trained layer learns its lines; nobody drags them. Shading is a light from the upper left on the sheet’s slope; contour lines are every ½ of the summed push.',
    refs: [['Montúfar et al. 2014 — On the number of linear regions of deep neural networks', 'https://arxiv.org/abs/1402.1869'], ['Hendrycks & Gimpel 2016 — Gaussian error linear units (GELU)', 'https://arxiv.org/abs/1606.08415'], ['Vaswani et al. 2017 — the position-wise feed-forward network (§3.3)', 'https://arxiv.org/abs/1706.03762']],

    create(k) {
      const { ctx, octx } = k;
      const buf = makeBuffer();
      let neurons = [neuron(SPAWN[0])], goals = null;
      let view = { u: 60, cx: 0, cy: 0 }, bw = 0, bh = 0, s = 3, dirty = true;
      let drag = null, hover = -1, hot = -1, sel = 0, dragged = 0, sawSilent = false, sawFiring = false, wasPerfect = false;
      let sc = score(neurons, 'relu', 'places');
      const drone = k.sound.drone(147, 'triangle');

      function layout() {
        const narrow = k.w < 760;
        view = { u: Math.min(k.w / (narrow ? 7.6 : 9.4), k.h / 7.9), cx: k.w * (narrow ? 0.5 : 0.52), cy: k.h * (narrow ? 0.42 : 0.5) };
        s = k.w * k.h > 900000 ? 4 : 3;
        bw = Math.ceil(k.w / s); bh = Math.ceil(k.h / s);
        buf.canvas.width = bw; buf.canvas.height = bh; dirty = true;
      }
      const toWorld = p => [(p.x - view.cx) / view.u, (view.cy - p.y) / view.u];
      const toScreen = (x, y) => [view.cx + x * view.u, view.cy - y * view.u];
      function setCount(n) {
        while (neurons.length < n) neurons.push(neuron(SPAWN[neurons.length % SPAWN.length]));
        neurons.length = Math.min(neurons.length, n);
        sel = Math.min(sel, n - 1); goals = null; dirty = true;
      }
      // what is under the pointer: a neuron's arrow tip (turn), its dot or line (move), or a word
      function pick(p) {
        let best = null, bd = 22;
        neurons.forEach((N, i) => {
          const [tx, ty] = toScreen(N.px + Math.cos(N.a) * 0.75, N.py + Math.sin(N.a) * 0.75), [ax, ay] = toScreen(N.px, N.py);
          const dt = Math.hypot(tx - p.x, ty - p.y), da = Math.hypot(ax - p.x, ay - p.y);
          if (dt < bd) { bd = dt; best = { i, mode: 'turn', handle: true }; }
          if (da < bd) { bd = da; best = { i, mode: 'move', handle: true }; }
        });
        if (best) return best;
        const [wx, wy] = toWorld(p);
        bd = 9 / view.u * GAIN;
        neurons.forEach((N, i) => { const d = Math.abs(zOf(N, wx, wy)); if (d < bd) { bd = d; best = { i, mode: 'move' }; } });
        return best;
      }
      function nearestWord(p) {
        let best = -1, bd = 26;
        WORDS.forEach(([, x, y], i) => { const [px, py] = toScreen(x, y), d = Math.hypot(px - p.x, py - p.y); if (d < bd) { bd = d; best = i; } });
        return best;
      }
      function check() {
        const act = k.values.act, task = k.values.task;
        if (k.stage === 0 && task === 'places' && act === 'relu' && sc.perfect) k.reach(0);
        if (k.stage === 1 && sawSilent && sawFiring) k.reach(1);
        if (k.stage === 2 && task === 'people' && (dragged > 260 || neurons.length > 1)) k.reach(2);
        if (k.stage === 3 && task === 'people' && act !== 'none' && sc.perfect) k.reach(3);
        if (k.stage === 4 && act === 'none' && neurons.length > 1) k.reach(4);
        if (k.stage === 5 && act === 'gelu') k.reach(5);
      }
      function touchWord(i) {
        const fresh = i !== hover;
        hover = i;
        if (i < 0) return;
        const zs = neurons.map(N => zOf(N, WORDS[i][1], WORDS[i][2]));
        // the firing neurons sound; the silent ones are silent
        if (fresh) zs.forEach((z, n) => { const h = ACT[k.values.act](z); if (h > 0.02) k.sound.pluck(k.sound.note(n * 2, 147), 0.03 + 0.05 * Math.min(1, h), 1.1); });
        if (zs.some(z => z > 0.05)) sawFiring = true; else sawSilent = true;
      }

      return {
        resize: layout,
        frame(t, dt) {
          if (!bw) layout();
          const act = k.values.act, task = TASKS[k.values.task];
          // "Show one answer" eases the creases into place rather than snapping them
          if (goals) {
            let far = 0;
            neurons.forEach((N, i) => {
              const G = goals[i], e = 1 - Math.exp(-dt * 5), da = Math.atan2(Math.sin(G.a - N.a), Math.cos(G.a - N.a));
              N.px += (G.px - N.px) * e; N.py += (G.py - N.py) * e; N.a += da * e;
              far = Math.max(far, Math.abs(G.px - N.px), Math.abs(G.py - N.py), Math.abs(da));
            });
            if (far < 0.004 || !k.motion) { neurons = goals.map(G => ({ ...G })); goals = null; }
            dirty = true;
          }
          if (dirty) {
            sheet(buf.ctx, bw, bh, s, view, neurons, act, k.values.lines);
            sc = score(neurons, act, task);
            dirty = false;
            if (sc.perfect && !wasPerfect) [523, 659, 784].forEach((f, i) => setTimeout(() => k.sound.tone(f, 0.5, 0.04), i * 90));
            wasPerfect = sc.perfect;
          }
          paint(ctx, k.w, k.h, view, buf, { neurons, act, task, sc }, { handles: true, hover, hot: drag ? drag.i : hot });
          draw.vignette(ctx, k.w, k.h, 0.5);

          octx.clearRect(0, 0, k.w, k.h);
          // the score, in words
          const others = sc.wrong ? `  ·  ${sc.wrong} other word${sc.wrong > 1 ? 's' : ''} kept by mistake` : '';
          draw.label(octx, sc.perfect ? `only the ${task} are left alone  ✓` : `${sc.kept} of ${sc.total} ${task} kept${others}`, k.w < 760 ? 16 : 28, k.w < 760 ? 92 : 84,
            sc.perfect ? `rgb(${PINK})` : sc.wrong ? `rgb(${RED})` : 'rgba(236,232,240,.85)', '12px "IBM Plex Mono", monospace');

          // the hinge itself: this activation's graph, with the hovered word's z for every neuron
          const narrow = k.w < 760, gw = narrow ? 120 : 190, gh = narrow ? 70 : 104, gx = k.w - gw - (narrow ? 16 : 34), gy = narrow ? 118 : 108;
          if (k.w > 520) {
            const X = z => gx + (z + 2.2) / 4.4 * gw, Y = v => gy + gh - 12 - (v + 0.3) / 2.6 * (gh - 12);
            octx.fillStyle = 'rgba(5,6,10,.6)'; octx.fillRect(gx - 10, gy - 22, gw + 20, gh + 30);
            octx.strokeStyle = 'rgba(255,255,255,.14)'; octx.lineWidth = 1;
            octx.beginPath(); octx.moveTo(gx, Y(0)); octx.lineTo(gx + gw, Y(0)); octx.moveTo(X(0), gy); octx.lineTo(X(0), gy + gh); octx.stroke();
            octx.strokeStyle = `rgba(${PINK},.95)`; octx.lineWidth = 2; octx.beginPath();
            for (let q = 0; q <= 60; q++) { const z = -2.2 + 4.4 * q / 60; q ? octx.lineTo(X(z), Y(ACT[act](z))) : octx.moveTo(X(z), Y(ACT[act](z))); }
            octx.stroke();
            draw.label(octx, act === 'relu' ? 'h = max(0, z)' : act === 'gelu' ? 'h = GELU(z)' : 'h = z   (no bend)', gx, gy - 10, `rgba(${PINK},.95)`, '11px "IBM Plex Mono", monospace');
            draw.label(octx, 'z →', gx + gw, Y(0) + 10, 'rgba(236,232,240,.5)', '10px "IBM Plex Mono", monospace', 'right');
            if (hover >= 0) {
              neurons.forEach((N, i) => {
                const z = clamp(zOf(N, WORDS[hover][1], WORDS[hover][2]), -2.2, 2.2), v = clamp(ACT[act](z), -0.3, 2.3);
                octx.fillStyle = `rgb(${NCOL[i % NCOL.length]})`; octx.beginPath(); octx.arc(X(z), Y(v), 4.5, 0, 7); octx.fill();
                octx.strokeStyle = '#05060a'; octx.lineWidth = 1.5; octx.stroke();
              });
            } else draw.label(octx, 'point at a word', gx + gw / 2, gy + gh + 2, 'rgba(236,232,240,.45)', '10px "IBM Plex Mono", monospace', 'center');
          }
          // the worked example beside the hovered word
          if (hover >= 0) {
            const [word, x, y] = WORDS[hover], [px, py] = toScreen(x, y), out = layer(neurons, act, x, y);
            const rows = neurons.map((N, i) => { const z = zOf(N, x, y); return [`z${'₁₂₃₄₅₆'[i]} = ${fmt(z)}  →  ${fmt(ACT[act](z))}`, NCOL[i % NCOL.length]]; });
            const left = px > k.w * 0.62, lx = px + (left ? -16 : 16), ly = clamp(py + 18, 120, k.h - 40 - rows.length * 16);
            rows.forEach(([text, col], i) => draw.label(octx, text, lx, ly + i * 16, `rgb(${col})`, '12px "IBM Plex Mono", monospace', left ? 'right' : 'left'));
            draw.label(octx, `${word}: y = ${act === 'none' ? '' : 'max(0, '}1 − ${fmt(out.r)}${act === 'none' ? '' : ')'} = ${fmt(out.y)}  ·  ${out.y > KEEP ? 'kept' : 'pushed away'}`, lx, ly + rows.length * 16 + 4, '#fff', '500 12px "IBM Plex Mono", monospace', left ? 'right' : 'left');
          }
          check();
          drone.set(73.5, sc.perfect ? 0.05 : 0.02);
          k.over.style.cursor = drag ? 'grabbing' : hot >= 0 ? 'grab' : hover >= 0 ? 'help' : 'default';
        },
        down(p) {
          // a word wins over the bare line of a crease, so words lying on a crease can still be read
          const hit = pick(p), word = nearestWord(p);
          if (hit && (hit.handle || word < 0)) { drag = hit; sel = hit.i; goals = null; } else touchWord(word);
        },
        move(p) {
          if (drag && p.dragging) {
            const N = neurons[drag.i], [wx, wy] = toWorld(p);
            if (drag.mode === 'turn') N.a = Math.atan2(wy - N.py, wx - N.px);
            else { N.px = clamp(N.px + p.dx / view.u, -4.5, 4.5); N.py = clamp(N.py - p.dy / view.u, -4, 4); }
            dragged += Math.hypot(p.dx, p.dy); dirty = true;
          } else if (!p.dragging) {
            const hit = pick(p), word = nearestWord(p), grab = hit && (hit.handle || word < 0);
            hot = grab ? hit.i : -1;
            touchWord(grab ? -1 : word);
          }
        },
        up() { if (drag) k.sound.tone(294 + 40 * drag.i, 0.25, 0.03); drag = null; },
        leave() { hover = -1; hot = -1; },
        control(id, v) {
          if (id === 'n') { setCount(v); k.sound.tone(220 * 2 ** (v / 6), 0.3, 0.04); }
          if (id === 'solve') {
            const A = ANSWERS[k.values.task];
            k.set('n', A.length); setCount(A.length);
            if (k.values.act === 'none') k.set('act', 'relu');
            goals = A.map(neuron);
          }
          dirty = true;
        },
        key(e) {
          // [ and ] choose a neuron; arrows slide it along its own direction; shift + arrows turn it
          if (e.key === '[' || e.key === ']') { sel = (sel + (e.key === ']' ? 1 : neurons.length - 1)) % neurons.length; hot = sel; e.preventDefault(); return; }
          const d = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key];
          if (!d) return;
          e.preventDefault();
          const N = neurons[sel];
          if (e.shiftKey) N.a += d * 0.1; else { N.px += Math.cos(N.a) * d * 0.1; N.py += Math.sin(N.a) * d * 0.1; }
          dragged += 20; dirty = true;
        },
        maths() {
          const act = k.values.act, name = act === 'relu' ? 'max(0, zᵢ)' : act === 'gelu' ? 'GELU(zᵢ)' : 'zᵢ';
          const rows = neurons.map((N, i) => {
            const nx = Math.cos(N.a), ny = Math.sin(N.a), b = GAIN * (N.px * nx + N.py * ny);
            const z = hover >= 0 ? zOf(N, WORDS[hover][1], WORDS[hover][2]) : null;
            return `<tr><td style="color:rgb(${NCOL[i % NCOL.length]})">neuron ${i + 1}</td><td>(${fmt(GAIN * nx)}, ${fmt(GAIN * ny)})</td><td>${fmt(b)}</td><td>${z === null ? '–' : `${fmt(z)} → ${fmt(ACT[act](z))}`}</td></tr>`;
          }).join('');
          const out = hover >= 0 ? layer(neurons, act, WORDS[hover][1], WORDS[hover][2]) : null;
          return `<p class="eq">zᵢ = nᵢ·x − bᵢ      hᵢ = ${name}\ny = ${act === 'none' ? '1 − Σ hᵢ' : 'max(0, 1 − Σ hᵢ)'}      kept while y &gt; ½</p>
            <div class="row"><span>task</span><span class="hl">keep only the ${TASKS[k.values.task]}</span></div>
            <div class="row"><span>kept · of · by mistake</span><span>${sc.kept} · ${sc.total} · ${sc.wrong}</span></div>
            <table><tr><th></th><th>nᵢ</th><th>bᵢ</th><th>${hover >= 0 ? Interiors.esc(WORDS[hover][0]) + ': z → h' : 'point at a word'}</th></tr>${rows}</table>
            ${out ? `<div class="row"><span>Σ hᵢ, then y</span><span class="hl">${fmt(out.r)}, ${fmt(out.y)}</span></div>` : ''}
            <div class="row"><span>facets one layer of ${neurons.length} can make, at most</span><span>${1 + neurons.length + neurons.length * (neurons.length - 1) / 2}</span></div>`;
        }
      };
    },

    poster(ctx, w, h, t) {
      const st = this._poster ||= { buf: makeBuffer(), key: '' };
      const s = 3, bw = Math.ceil(w / s), bh = Math.ceil(h / s);
      if (st.key !== `${bw}x${bh}`) { st.key = `${bw}x${bh}`; st.buf.canvas.width = bw; st.buf.canvas.height = bh; }
      const view = { u: Math.min(w / 8.4, h / 6.6), cx: w * 0.42, cy: h * 0.44 };
      // four creases breathing around the people
      const neurons = [[1, 1.55, 78], [-1.1, 0, 192], [1, -1.95, -84], [3.3, 0, 12]].map(([x, y, a], i) =>
        neuron([x + 0.18 * Math.sin(t * 0.5 + i * 1.7), y + 0.18 * Math.cos(t * 0.4 + i), a + 9 * Math.sin(t * 0.35 + i * 2.1)]));
      sheet(st.buf.ctx, bw, bh, s, view, neurons, 'relu', true);
      paint(ctx, w, h, view, st.buf, { neurons, act: 'relu', task: 'people', sc: score(neurons, 'relu', 'people') }, { handles: false, words: false });
    }
  });
})();
