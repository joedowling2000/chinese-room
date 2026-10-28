/* The Maths of AI: "Where each idea lives". A transit map of one token's trip
   through a transformer. The main line is the residual stream; attention and the
   feed-forward block branch off it and add back in. Each of the seven ideas is a
   coloured station (every matrix multiplication is a square). A token rides the
   line to the next-token prediction; in Training mode the gradient rides back.
   Drawn as SVG, with one layout for wide screens and one for phones. */
const MathsMap = (() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const idea = no => Interiors.games.find(g => g.no === no);

  // Where each idea sits on the map, for the pinned card.
  const WHERE = {
    '01': 'Every square station is a matrix multiplication: the embedding, the query, key and value projections, the attention output, both feed-forward matrices and the unembedding. Most of the model’s parameters live in these matrices.',
    '02': 'Inside every feed-forward block, between its two matrices. The hinge (GELU or SwiGLU in most modern models) is the only step in the block that is not linear.',
    '03': 'Not on the forward line at all. In training, the loss on the true next token sends a gradient back along every path, and every matrix takes a small step downhill.',
    '04': 'The first branch of every block. The token’s query scores the key of every earlier token; softmax turns the scores into weights that blend their values.',
    '05': 'Inside attention, just before the scores. The query and key are rotated by angles set by their positions, so a score depends on how far apart two tokens are. Values are not rotated.',
    '06': 'The main line is the residual stream: each token’s 4,096 numbers, read by every block and added to by every branch. It carries far more features than it has dimensions, packed in superposition.',
    '07': 'A probe on the stream. Interpretability research reads a direction r̂ from the residual stream, or removes it with x − (x·r̂)r̂, and watches what the model stops doing.'
  };

  // What the token is doing at each station, for the follow-along card.
  const SAY = {
    in: t => `The prompt’s last token, “${t}”, enters the model. The other tokens are processed the same way, in parallel.`,
    embed: () => 'A lookup in the embedding matrix turns the token into a vector of 4,096 numbers.',
    stream: () => 'That vector becomes the residual stream: the line every block reads from and writes back to.',
    qkv: () => 'Three matrices turn the stream into a query, a key and a value.',
    rope: () => 'RoPE rotates the query and the key by angles set by the token’s position. The value is left alone.',
    attn: () => 'The query scores every earlier token’s key; softmax turns the scores into weights that blend their values.',
    wo: () => 'A matrix maps the attention result back to the stream’s 4,096 numbers…',
    addA: () => '…and adds it to the stream. Nothing is overwritten: each branch only adds.',
    win: () => 'The feed-forward block widens the stream with a matrix…',
    act: () => '…bends it at a hinge, the only non-linear step in the block…',
    wout: () => '…and projects it back down with another matrix.',
    addF: () => 'The result is added to the stream again.',
    layers: () => 'The same two branches repeat in all 32 layers, each with its own weights.',
    probe: () => 'Interpretability works here: read a direction r̂ from the stream, or delete it with x − (x·r̂)r̂.',
    unembed: () => 'The unembedding matrix scores every token in the vocabulary against the final stream.',
    out: (t, n) => `Softmax turns the scores into probabilities. The model’s top choice is “${n}”.`,
    loss: (t, n, l) => `In training the true next token is known. Here it is “${n}”, so the loss is −log p(“${n}”) = ${l}.`,
    back: () => 'Backpropagation carries the gradient back along every path, and every matrix takes a small step downhill.'
  };

  // Illustrative prompts and next-token probabilities (not from a real model).
  const STEPS = [
    { tokens: ['The', 'cat', 'sat', 'on', 'the'], probs: [['mat', 0.41], ['floor', 0.18], ['sofa', 0.09], ['bed', 0.05]] },
    { tokens: ['The', 'cat', 'sat', 'on', 'the', 'mat'], probs: [['.', 0.62], [',', 0.14], ['and', 0.07], ['while', 0.03]] },
    { tokens: ['The', 'capital', 'of', 'France', 'is'], probs: [['Paris', 0.72], ['a', 0.06], ['the', 0.04], ['located', 0.03]] },
    { tokens: ['Attention', 'is', 'all', 'you'], probs: [['need', 0.89], ['want', 0.03], ['have', 0.02], ['get', 0.01]] }
  ];

  // ---------- the two layouts ----------
  const st = (id, no, x, y, pos, name, sub, shape = no === '01' ? 'sq' : 'ci') => ({ id, no, x, y, pos, name, sub, shape });
  const WIDE = {
    w: 1246, y0: 104, h: 566, speed: 300,
    stations: [
      st('in', null, 40, 300, 'b', 'token', '', 'tok'),
      st('embed', '01', 125, 300, 'a', 'Embed', 'E[token]'),
      st('stream', '06', 205, 300, 'b', 'Residual stream', '4,096 numbers'),
      st('qkv', '01', 345, 212, 'a', 'Q, K, V', 'W x'),
      st('rope', '05', 425, 212, 'a', 'RoPE', 'rotate q, k'),
      st('attn', '04', 525, 212, 'a', 'Attention', 'softmax(q·k/√d)'),
      st('wo', '01', 610, 212, 'a', 'W_O', 'mix back'),
      st('addA', '06', 645, 300, 'b', '', '', 'add'),
      st('win', '01', 725, 400, 'b', 'W_in', 'widen'),
      st('act', '02', 805, 400, 'b', 'ReLU / GELU', 'max(0, z)'),
      st('wout', '01', 885, 400, 'b', 'W_out', 'narrow'),
      st('addF', '06', 915, 300, 'a', '', '', 'add'),
      st('probe', '07', 975, 300, 'b', 'Probe', 'x − (x·r̂)r̂'),
      st('unembed', '01', 1035, 300, 'a', 'Unembed', 'W_U x'),
      st('out', null, 1122, 300, 'a', 'next token', '', 'tok'),
      st('train', '03', 640, 515, 'b', 'Gradient descent', 'θ ← θ − η∇L')
    ],
    route: ['in', 'embed', 'stream', [295, 300], [295, 212], 'qkv', 'rope', 'attn', 'wo', [645, 212], 'addA', [675, 300], [675, 400], 'win', 'act', 'wout', [915, 400], 'addF', 'probe', 'unembed', 'out'],
    lines: [
      { no: '06', cls: 'stream', pts: [[40, 300], [1122, 300]] },
      { no: '04', pts: [[295, 300], [295, 212], [645, 212], [645, 300]] },
      { no: '04', cls: 'thin', pts: [[345, 212], [345, 244], [525, 244], [525, 212]] },
      { no: '02', pts: [[675, 300], [675, 400], [915, 400], [915, 300]] },
      { no: '07', cls: 'blade', pts: [[964, 284], [986, 316]] },
      { no: '03', cls: 'loop', pts: [[1122, 300], [1232, 300], [1232, 515], [125, 515], [125, 317]] }
    ],
    frame: { x: 262, y: 128, w: 668, h: 334, label: [280, 150], count: [912, 150] },
    notes: [[385, 233, 'q, k', 'middle'], [435, 262, 'v', 'middle'], [160, 541, 'training only: the gradient flows back to every weight', 'start']],
    word: [1122, 344, 'middle'], bars: { x: 1112, y: 370, dy: 19, max: 64 }
  };
  const TALL = {
    w: 360, y0: 16, h: 1250, speed: 280,
    stations: [
      st('in', null, 132, 40, 'l', 'token', '', 'tok'),
      st('embed', '01', 132, 110, 'l', 'Embed', 'E[token]'),
      st('stream', '06', 132, 175, 'l', 'Residual stream', '4,096 numbers'),
      st('qkv', '01', 222, 300, 'r', 'Q, K, V', 'W x'),
      st('rope', '05', 222, 370, 'r', 'RoPE', 'rotate q, k'),
      st('attn', '04', 222, 440, 'r', 'Attention', 'softmax(q·k/√d)'),
      st('wo', '01', 222, 505, 'r', 'W_O', 'mix back'),
      st('addA', '06', 132, 545, 'l', '', '', 'add'),
      st('win', '01', 222, 635, 'r', 'W_in', 'widen'),
      st('act', '02', 222, 700, 'r', 'ReLU / GELU', 'max(0, z)'),
      st('wout', '01', 222, 765, 'r', 'W_out', 'narrow'),
      st('addF', '06', 132, 810, 'l', '', '', 'add'),
      st('probe', '07', 132, 890, 'l', 'Probe', 'x − (x·r̂)r̂'),
      st('unembed', '01', 132, 960, 'l', 'Unembed', 'W_U x'),
      st('out', null, 132, 1030, 'l', 'next token', '', 'tok'),
      st('train', '03', 132, 1190, 'r', 'Gradient descent', 'θ ← θ − η∇L')
    ],
    route: ['in', 'embed', 'stream', [132, 250], [222, 250], 'qkv', 'rope', 'attn', 'wo', [222, 545], 'addA', [132, 590], [222, 590], 'win', 'act', 'wout', [222, 810], 'addF', 'probe', 'unembed', 'out'],
    lines: [
      { no: '06', cls: 'stream', pts: [[132, 40], [132, 1030]] },
      { no: '04', pts: [[132, 250], [222, 250], [222, 545], [132, 545]] },
      { no: '04', cls: 'thin', pts: [[222, 300], [194, 300], [194, 440], [222, 440]] },
      { no: '02', pts: [[132, 590], [222, 590], [222, 810], [132, 810]] },
      { no: '07', cls: 'blade', pts: [[114, 880], [150, 900]] },
      { no: '03', cls: 'loop', pts: [[132, 1030], [132, 1176]] }
    ],
    frame: { x: 12, y: 214, w: 336, h: 632, label: [28, 236], count: [334, 236] },
    notes: [[186, 374, 'v', 'end'], [152, 1226, 'training only: the gradient', 'start'], [152, 1241, 'flows back to every weight', 'start']],
    word: [152, 1037, 'start'], bars: { x: 200, y: 1068, dy: 19, max: 76 }
  };

  // Orthogonal polyline with rounded corners.
  function path(pts, r = 14) {
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x, y] = pts[i];
      if (i === pts.length - 1) { d += ` L${x},${y}`; break; }
      const [px, py] = pts[i - 1], [nx, ny] = pts[i + 1];
      const a = Math.min(r, Math.hypot(x - px, y - py) / 2), b = Math.min(r, Math.hypot(nx - x, ny - y) / 2);
      const ux = Math.sign(x - px), uy = Math.sign(y - py), vx = Math.sign(nx - x), vy = Math.sign(ny - y);
      if (ux === vx && uy === vy) { d += ` L${x},${y}`; continue; }
      d += ` L${x - ux * a},${y - uy * a} Q${x},${y} ${x + vx * b},${y + vy * b}`;
    }
    return d;
  }

  function label(s) {
    if (!s.name) return '';
    const off = s.shape === 'tok' ? 16 : 21;
    const [nx, ny, sx, sy, anchor] = {
      a: [s.x, s.y - off - 17, s.x, s.y - off - 3, 'middle'],
      b: [s.x, s.y + off + 10, s.x, s.y + off + 24, 'middle'],
      l: [s.x - off, s.y - 2, s.x - off, s.y + 12, 'end'],
      r: [s.x + off, s.y - 2, s.x + off, s.y + 12, 'start']
    }[s.pos];
    return `<text class="ml-name" x="${nx}" y="${ny}" text-anchor="${anchor}"${s.id === 'in' ? ' data-role="in"' : ''}>${esc(s.name)}</text>` +
      (s.sub ? `<text class="ml-sub" x="${sx}" y="${sy}" text-anchor="${anchor}">${esc(s.sub)}</text>` : '');
  }

  function marker(s) {
    if (s.shape === 'tok') return `<circle class="ml-tokmark" cx="${s.x}" cy="${s.y}" r="6"/>`;
    if (s.shape === 'add') return `<circle class="ml-add" cx="${s.x}" cy="${s.y}" r="8"/><path class="ml-plus" d="M${s.x - 4},${s.y} h8 M${s.x},${s.y - 4} v8"/>`;
    const shape = s.shape === 'sq'
      ? `<rect class="ml-mark" x="${s.x - 12}" y="${s.y - 12}" width="24" height="24" rx="5"/>`
      : `<circle class="ml-mark" cx="${s.x}" cy="${s.y}" r="13"/>`;
    return `<circle class="ml-halo" cx="${s.x}" cy="${s.y}" r="23"/>${shape}<text class="ml-no" x="${s.x}" y="${s.y + 3.4}" text-anchor="middle">${s.no}</text>`;
  }

  function svg(L) {
    const f = L.frame;
    const lines = L.lines.map(l => {
      const d = path(l.pts);
      return `<g class="ml-line ${l.cls || ''}" data-idea="${l.no}" style="--c:${idea(l.no).accent}">${l.cls === 'stream' ? `<path class="ml-glow" d="${d}"/>` : ''}<path class="ml-track" d="${d}"/>${l.cls === 'stream' || l.cls === 'loop' ? `<path class="ml-flow" d="${d}"/>` : ''}</g>`;
    }).join('');
    const stations = L.stations.map(s => {
      const g = s.no ? idea(s.no) : null;
      const attrs = g ? ` data-idea="${s.no}" tabindex="0" role="button" aria-label="${esc(`${s.name || 'Add to the stream'}: ${g.maths} (${s.no})`)}" style="--c:${g.accent}"` : '';
      return `<g class="ml-st ml-${s.shape}" data-st="${s.id}"${attrs}>${marker(s)}${label(s)}</g>`;
    }).join('');
    const notes = L.notes.map(([x, y, t, a]) => `<text class="ml-note" x="${x}" y="${y}" text-anchor="${a}">${esc(t)}</text>`).join('');
    const bars = [0, 1, 2, 3].map(i => `<g class="ml-bar"><text class="ml-bar-t" x="${L.bars.x}" y="${L.bars.y + i * L.bars.dy + 4}" text-anchor="end"></text><rect x="${L.bars.x + 6}" y="${L.bars.y + i * L.bars.dy - 4}" height="8" rx="2" width="0"/><text class="ml-bar-p" x="${L.bars.x + 10}" y="${L.bars.y + i * L.bars.dy + 4}"></text></g>`).join('');
    return `<svg class="ml-svg" viewBox="0 ${L.y0} ${L.w} ${L.h - L.y0}" role="group" aria-label="A transit map of a transformer: the residual stream with attention and feed-forward branches, and the seven ideas as stations">
  <defs><filter id="ml-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter></defs>
  <g class="ml-frames"><rect class="ml-ghost g2" x="${f.x + 16}" y="${f.y - 16}" width="${f.w}" height="${f.h}" rx="18"/><rect class="ml-ghost g1" x="${f.x + 8}" y="${f.y - 8}" width="${f.w}" height="${f.h}" rx="18"/><rect class="ml-frame" x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx="18"/>
  <text class="ml-frame-t" x="${f.label[0]}" y="${f.label[1]}">TRANSFORMER BLOCK</text><text class="ml-frame-c" x="${f.count[0]}" y="${f.count[1]}" text-anchor="end">LAYER <tspan data-role="layer">1</tspan> OF 32</text></g>
  ${lines}${notes}${stations}
  <text class="ml-word" x="${L.word[0]}" y="${L.word[1]}" text-anchor="${L.word[2]}" data-role="word"></text>
  <g class="ml-bars" data-role="bars">${bars}</g>
  <g class="ml-trail" data-role="trail"></g>
  <g class="ml-tok" data-role="tok"><circle class="ml-tok-glow" r="13" filter="url(#ml-blur)"/><circle class="ml-tok-core" r="5"/></g>
</svg>`;
  }

  function markup() {
    const ideas = ['01', '02', '03', '04', '05', '06', '07'].map(idea);
    return `<section class="ml" id="maths-map" aria-labelledby="ml-title">
  <div class="ml-head">
    <div class="ml-intro"><p class="eyebrow">One token’s journey</p><h2 id="ml-title">Where each idea lives.</h2><p>A transformer drawn as a transit map. The main line is the residual stream; attention and the feed-forward block branch off it and add back in. Each coloured station is one of the seven ideas. Follow the token, or choose a station to see where an idea sits.</p></div>
    <div class="ml-controls">
      <div class="ml-modes" role="group" aria-label="What the map shows"><button type="button" data-mode="forward" aria-pressed="true">Forward pass</button><button type="button" data-mode="train" aria-pressed="false">Training step</button></div>
      <button type="button" class="ml-pause" aria-pressed="false">Pause</button>
    </div>
  </div>
  <p class="ml-prompt" aria-label="The prompt"><span class="ml-prompt-k">prompt</span><span class="ml-words"></span></p>
  <div class="ml-stage"></div>
  <div class="ml-foot">
    <div class="ml-legend" role="group" aria-label="The seven ideas">${ideas.map(g => `<button type="button" class="ml-key" data-idea="${g.no}" aria-pressed="false" style="--c:${g.accent}"><i aria-hidden="true"></i><span class="ml-key-no">${g.no}</span>${esc(g.maths)}</button>`).join('')}</div>
    <div class="ml-card"></div>
  </div>
  <p class="ml-foot-note">Simplified: one attention head shown; normalisation layers and caching left out. Probabilities are illustrative.</p>
</section>`;
  }

  function wire(root, signal) {
    if (!root) return { dispose() {} };
    const stage = root.querySelector('.ml-stage'), card = root.querySelector('.ml-card'), wordsEl = root.querySelector('.ml-words');
    const narrow = matchMedia('(max-width: 760px)');
    let L, el = {}, route = [], cum = [], stops = [];
    let mode = 'forward', paused = reduced(), visible = false, raf = 0, last = 0;
    let pinned = null, preview = null, follow = null, cardKey = '', art = null; // follow: {id, no, name, text}
    let step = 0, phase = 'fwd', d = 0, wait = 0.8, next = 1, layer = 1, timer = 0, trail = [], grown = 0;

    function build() {
      L = narrow.matches ? TALL : WIDE;
      stage.innerHTML = svg(L);
      const s = stage.querySelector('svg');
      el = { svg: s, tok: s.querySelector('[data-role=tok]'), trail: s.querySelector('[data-role=trail]'), word: s.querySelector('[data-role=word]'), layer: s.querySelector('[data-role=layer]'), in: s.querySelector('[data-role=in]'), bars: [...s.querySelectorAll('.ml-bar')] };
      const at = id => L.stations.find(x => x.id === id);
      route = L.route.map(p => Array.isArray(p) ? { x: p[0], y: p[1] } : { x: at(p).x, y: at(p).y, id: p });
      cum = [0]; for (let i = 1; i < route.length; i++) cum.push(cum[i - 1] + Math.hypot(route[i].x - route[i - 1].x, route[i].y - route[i - 1].y));
      stops = route.map((p, i) => p.id ? i : -1).filter(i => i >= 0);
      s.querySelectorAll('.ml-st[data-idea]').forEach(g => {
        g.addEventListener('pointerenter', () => { preview = g.dataset.idea; paint(); }, { signal });
        g.addEventListener('pointerleave', () => { preview = null; paint(); }, { signal });
        g.addEventListener('click', e => { e.stopPropagation(); pin(g.dataset.idea); }, { signal });
        g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pin(g.dataset.idea); } }, { signal });
      });
      s.addEventListener('click', () => pin(null), { signal });
      drawStep(); place(); paint();
    }

    const current = () => STEPS[step % STEPS.length];
    const top = () => current().probs[0];
    const loss = () => (-Math.log(top()[1])).toFixed(2);

    function drawStep() {
      const c = current();
      wordsEl.innerHTML = c.tokens.map((t, i) => `<span class="${i === c.tokens.length - 1 ? 'is-cur' : ''}">${esc(t)}</span>`).join(' ') + ` <span class="ml-next" hidden>${esc(top()[0])}</span>`;
      if (el.in) el.in.textContent = `“${c.tokens[c.tokens.length - 1]}”`;
      el.word.textContent = ''; grown = 0; bars(0);
    }
    function bars(k) {
      const c = current(), mx = c.probs[0][1];
      el.bars.forEach((g, i) => {
        const [t, p] = c.probs[i], w = L.bars.max * (p / mx) * k;
        g.children[0].textContent = k ? t : '';
        g.children[1].setAttribute('width', w.toFixed(1));
        g.children[2].setAttribute('x', (L.bars.x + 10 + w).toFixed(1));
        g.children[2].textContent = k ? `${Math.round(p * 100)}%` : '';
      });
    }

    // Position of the token at distance `d` along the route.
    function point(dist) {
      let i = 1; while (i < cum.length - 1 && cum[i] < dist) i++;
      const a = route[i - 1], b = route[i], seg = cum[i] - cum[i - 1] || 1, t = Math.max(0, Math.min(1, (dist - cum[i - 1]) / seg));
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    function place() {
      const p = point(d);
      el.tok.setAttribute('transform', `translate(${p.x.toFixed(1)},${p.y.toFixed(1)})`);
      el.tok.classList.toggle('is-grad', phase === 'back');
      trail.unshift(p); trail.length = Math.min(trail.length, 9);
      el.trail.innerHTML = paused ? '' : trail.slice(1).map((q, i) => `<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="${(4 - i * 0.4).toFixed(1)}" opacity="${(0.45 - i * 0.05).toFixed(2)}"/>`).join('');
      el.trail.classList.toggle('is-grad', phase === 'back');
    }

    function arrive(id) {
      const s = L.stations.find(x => x.id === id), c = current();
      const text = SAY[id](c.tokens[c.tokens.length - 1], top()[0], loss());
      follow = { id, no: s.no, name: s.name || 'Add to the stream', text };
      root.querySelectorAll('.ml-st.is-now').forEach(g => g.classList.remove('is-now'));
      el.svg.querySelector(`[data-st="${id}"]`)?.classList.add('is-now');
      paint();
    }
    function say(id, no, name) {
      const c = current();
      follow = { id, no, name, text: SAY[id](c.tokens[c.tokens.length - 1], top()[0], loss()) };
      paint();
    }

    function tick(dt) {
      if (wait > 0) { wait -= dt; return; }
      if (phase === 'fwd') {
        const target = cum[stops[next]];
        d = Math.min(target, d + L.speed * dt);
        if (d >= target) {
          const id = route[stops[next]].id;
          arrive(id);
          wait = id === 'addA' || id === 'addF' ? 0.3 : 0.62;
          if (id === 'addF' && layer === 1) { phase = 'layers'; timer = 0; say('layers', '06', 'All 32 layers'); el.svg.classList.add('is-repeat'); return; }
          if (id === 'out') { phase = 'out'; timer = 0; return; }
          next++;
        }
      } else if (phase === 'layers') {
        timer += dt;
        layer = Math.min(32, 1 + Math.floor(timer / 1.2 * 31));
        el.layer.textContent = layer;
        if (timer > 1.4) { phase = 'fwd'; next++; el.svg.classList.remove('is-repeat'); }
      } else if (phase === 'out') {
        timer += dt;
        grown = Math.min(1, timer / 0.6); bars(grown);
        el.word.textContent = top()[0];
        if (timer > 1.5) {
          if (mode === 'train') { phase = 'loss'; timer = 0; say('loss', '03', 'Loss'); wait = 1.6; el.svg.classList.add('is-training'); }
          else { phase = 'hold'; timer = 0; const n = wordsEl.querySelector('.ml-next'); if (n) n.hidden = false; wait = 1.4; }
        }
      } else if (phase === 'loss') {
        phase = 'back'; say('back', '03', 'Backpropagation'); el.svg.querySelector('[data-st="train"]')?.classList.add('is-now');
      } else if (phase === 'back') {
        const before = d;
        d = Math.max(0, d - L.speed * 1.7 * dt);
        stops.forEach(i => { const r = route[i]; if (cum[i] <= before && cum[i] > d) pulse(r.id); });
        if (d === 0) { phase = 'hold'; wait = 1.0; }
      } else if (phase === 'hold') restart(step + 1);
    }
    function pulse(id) {
      const g = el.svg.querySelector(`[data-st="${id}"]`);
      if (!g || !g.classList.contains('ml-sq')) return;
      g.classList.add('is-step'); // stays lit until the next token: this matrix was updated
      g.querySelector('.ml-halo')?.animate([{ opacity: 0.7, transform: 'scale(.6)' }, { opacity: 0, transform: 'scale(1.5)' }], { duration: 650, easing: 'ease-out' });
    }
    function restart(n) {
      step = n; phase = 'fwd'; d = 0; next = 1; layer = 1; trail = []; wait = 0.8;
      el.layer.textContent = 1;
      el.svg.classList.remove('is-training', 'is-repeat');
      el.svg.querySelectorAll('.is-step,.is-now').forEach(g => g.classList.remove('is-step', 'is-now'));
      drawStep(); arrive('in');
    }

    function pin(no) {
      pinned = no && no !== pinned ? no : null;
      card.setAttribute('aria-live', pinned ? 'polite' : 'off');
      paint();
    }
    function paint() {
      const show = preview || pinned;
      el.svg.classList.toggle('has-focus', !!show);
      el.svg.querySelectorAll('[data-idea]').forEach(g => g.classList.toggle('is-on', g.dataset.idea === show));
      root.querySelectorAll('.ml-key').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.idea === pinned)));
      card.style.setProperty('--c', show ? idea(show).accent : follow?.no ? idea(follow.no).accent : '#e8eaed');
      const key = show ? `idea:${show}` : follow && !paused ? `now:${step}:${follow.id}:${follow.text}` : 'idle';
      if (key === cardKey) return;
      cardKey = key; art?.dispose(); art = null;
      if (show) {
        const g = idea(show);
        card.innerHTML = `<a class="ml-art" href="#maths/play/${g.id}" aria-label="Open ${esc(g.title)}" style="--ir-accent:${g.accent}"><canvas class="ir-poster" data-poster="${g.id}" aria-hidden="true"></canvas></a>
          <div class="ml-card-body"><p class="ml-kicker"><i></i>${g.no} · ${esc(g.title)}</p><h3>${esc(g.maths)}</h3><p class="ml-eq">${esc(g.eq)}</p><p class="ml-text">${WHERE[show]}</p>
          <p class="ml-links"><a class="cta cta-sm cta-down cta-quiet" href="#maths/${g.id}" data-ml-scroll="maths-${g.id}">Read about it</a><a class="cta cta-sm" href="#maths/play/${g.id}">Open ${esc(g.title)}</a></p></div>`;
        card.classList.add('has-art');
        art = Interiors.posters(card);
      } else {
        card.classList.remove('has-art');
        if (follow && !paused) {
          const g = follow.no ? idea(follow.no) : null;
          card.innerHTML = `<div class="ml-card-body"><p class="ml-kicker"><i></i>Now · ${esc(follow.name)}</p><h3>${g ? `${g.no} ${esc(g.maths)}` : 'The token'}</h3><p class="ml-text">${esc(follow.text)}</p></div>`;
        } else {
          card.innerHTML = `<div class="ml-card-body"><p class="ml-kicker"><i></i>The map</p><h3>Choose a station</h3><p class="ml-text">Each coloured station is one of the seven ideas, and every square is a matrix multiplication. Choose one, or a name in the list, to light up everywhere that idea lives.</p></div>`;
        }
      }
    }

    function loop(now) {
      raf = 0;
      if (!visible || paused || document.hidden) { last = 0; return; }
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
      tick(dt); place();
      raf = requestAnimationFrame(loop);
    }
    const run = () => { if (!raf && visible && !paused) { last = 0; raf = requestAnimationFrame(loop); } };

    build(); arrive('in');
    if (paused) { root.querySelector('.ml-pause').setAttribute('aria-pressed', 'true'); root.querySelector('.ml-pause').textContent = 'Play'; paint(); }
    narrow.addEventListener('change', () => { build(); restart(step); }, { signal });
    root.querySelectorAll('.ml-key').forEach(b => {
      b.addEventListener('click', () => pin(b.dataset.idea), { signal });
      b.addEventListener('pointerenter', () => { preview = b.dataset.idea; paint(); }, { signal });
      b.addEventListener('pointerleave', () => { preview = null; paint(); }, { signal });
    });
    root.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
      mode = b.dataset.mode;
      root.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      restart(step);
    }, { signal }));
    root.querySelector('.ml-pause').addEventListener('click', e => {
      paused = !paused;
      e.currentTarget.setAttribute('aria-pressed', String(paused));
      e.currentTarget.textContent = paused ? 'Play' : 'Pause';
      place(); paint(); run();
    }, { signal });
    card.addEventListener('click', e => {
      const a = e.target.closest('[data-ml-scroll]'); if (!a) return;
      e.preventDefault();
      document.getElementById(a.dataset.mlScroll)?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
    }, { signal });
    root.addEventListener('keydown', e => { if (e.key === 'Escape' && pinned) { pin(null); e.stopPropagation(); } }, { signal });
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }, { rootMargin: '80px' });
    io.observe(stage);
    document.addEventListener('visibilitychange', run, { signal });
    return { dispose() { io.disconnect(); cancelAnimationFrame(raf); art?.dispose(); } };
  }

  return { markup, wire };
})();
