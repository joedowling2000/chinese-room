/* 01 · Lattice — linear maps.
   You stand in embedding space. Two arrows, î and ĵ, decide where every point
   in it goes: y = M x = x·î + y·ĵ. Drag them and the whole lattice bends. */
(() => {
  const { draw, rng, gauss, fmt, clamp } = Interiors;
  const MINT = '158,230,212', ROSE = '255,150,182', IVORY = '236,232,220', RED = '255,90,80';

  // Illustrative 2D placements: analogies are parallelograms (king − man + woman ≈ queen).
  const WORDS = [
    ['man', 0.9, -1.1], ['woman', 0.9, 0.9], ['king', 2.6, -1.1], ['queen', 2.6, 0.9],
    ['boy', -0.7, -1.5], ['girl', -0.7, 0.5],
    ['Paris', -2.6, 2.1], ['France', -1.4, 2.6], ['Rome', -2.9, 0.9], ['Italy', -1.7, 1.4],
    ['cat', -2.5, -1.9], ['kitten', -3.3, -2.5], ['dog', -1.6, -2.3], ['puppy', -2.4, -2.9],
    ['walk', 1.6, 2.4], ['walked', 2.7, 2.9], ['swim', 1.1, 3.0], ['swam', 2.2, 3.5],
    ['code', 3.5, -2.6], ['maths', 2.6, -3.0]
  ];
  const PARALLELOGRAMS = [[0, 1, 3, 2], [6, 7, 9, 8], [10, 11, 13, 12], [14, 15, 17, 16]];

  const PRESETS = {
    identity: [1, 0, 0, 1],
    rotate: [Math.cos(0.7), -Math.sin(0.7), Math.sin(0.7), Math.cos(0.7)],
    shear: [1, 1, 0, 1],
    stretch: [1.6, 0, 0, 0.55],
    reflect: [-1, 0, 0, 1],
    collapse: [1, 0.5, 0.5, 0.25]
  };

  function stars(n, seed) {
    const r = rng(seed), out = [];
    for (let i = 0; i < n; i++) {
      const x = gauss(r) * 2.4, y = gauss(r) * 2.0;
      const hue = (Math.atan2(y, x) / Math.PI * 180 + 360) % 360;
      out.push({ x, y, hue, a: 0.25 + r() * 0.6, tw: r() * 6.28 });
    }
    return out;
  }

  // M = [a b; c d]; î = (a, c), ĵ = (b, d)
  const apply = (M, x, y) => [M[0] * x + M[1] * y, M[2] * x + M[3] * y];
  const det = M => M[0] * M[3] - M[1] * M[2];
  const mul = (A, B) => [A[0] * B[0] + A[1] * B[2], A[0] * B[1] + A[1] * B[3], A[2] * B[0] + A[3] * B[2], A[2] * B[1] + A[3] * B[3]];

  function paintLattice(ctx, w, h, M, opts) {
    const { u, cx, cy, t = 0, field, hover = -1, handles = true, words = true, glow = 1 } = opts;
    const S = (x, y) => [cx + x * u, cy - y * u];
    const D = det(M);

    ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, w, h);
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(w, h) * 0.6);
    bg.addColorStop(0, '#0d1418'); bg.addColorStop(1, '#05060a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

    const span = Math.ceil(Math.hypot(w, h) / u / 2) + 2;

    // the original lattice, faint: where space was
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(${IVORY},0.06)`;
    ctx.beginPath();
    for (let i = -span; i <= span; i++) {
      const [x0, y0] = S(i, -span), [x1, y1] = S(i, span);
      ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
      const [x2, y2] = S(-span, i), [x3, y3] = S(span, i);
      ctx.moveTo(x2, y2); ctx.lineTo(x3, y3);
    }
    ctx.stroke();

    // the transformed lattice: lines x = i run along ĵ, lines y = i run along î
    ctx.globalCompositeOperation = 'lighter';
    const L = 80;
    const minLen = Math.max(0.15, Math.min(Math.hypot(M[0], M[2]), Math.hypot(M[1], M[3])));
    const lines = Math.min(60, Math.ceil(span / minLen) + 2);
    for (const pass of ['fine', 'halo', 'crisp']) {
      const fine = pass === 'fine', step = fine ? 0.5 : 1;
      for (const [dir, col] of [[1, ROSE], [0, MINT]]) {
        ctx.strokeStyle = `rgba(${col},${(fine ? 0.08 : pass === 'halo' ? 0.07 : 0.34) * glow})`;
        ctx.lineWidth = fine ? 0.8 : pass === 'halo' ? 6 : 1.2;
        ctx.beginPath();
        for (let i = -lines; i <= lines; i += step) {
          if (!fine && i === 0) continue;
          if (fine && Number.isInteger(i)) continue;
          const a = dir ? apply(M, i, -L) : apply(M, -L, i);
          const b = dir ? apply(M, i, L) : apply(M, L, i);
          const [x0, y0] = S(a[0], a[1]), [x1, y1] = S(b[0], b[1]);
          ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
        }
        ctx.stroke();
      }
    }
    // transformed axes, brighter
    for (const [dir, col] of [[1, ROSE], [0, MINT]]) {
      const a = dir ? apply(M, 0, -L) : apply(M, -L, 0), b = dir ? apply(M, 0, L) : apply(M, L, 0);
      ctx.strokeStyle = `rgba(${col},0.55)`; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(...S(a[0], a[1])); ctx.lineTo(...S(b[0], b[1])); ctx.stroke();
    }

    // the star field: thousands of embedding vectors moved by the same rule
    if (field) {
      const P = opts.prev, moving = P && P.some((v, i) => Math.abs(v - M[i]) > 0.004);
      if (moving) ctx.lineWidth = 1.1;
      for (const s of field) {
        const [x, y] = apply(M, s.x, s.y), [px, py] = S(x, y);
        if (px < -4 || py < -4 || px > w + 4 || py > h + 4) continue;
        const tw = 0.65 + 0.35 * Math.sin(t * 1.3 + s.tw);
        if (moving) {
          const [ox, oy] = S(...apply(P, s.x, s.y));
          ctx.strokeStyle = `hsla(${s.hue},80%,72%,${s.a * 0.45})`;
          ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(px, py); ctx.stroke();
        }
        ctx.fillStyle = `hsla(${s.hue},75%,80%,${s.a * tw * 0.85})`;
        ctx.fillRect(px - 0.9, py - 0.9, 1.8, 1.8);
      }
    }

    // collapse: the image of the plane is a single bright seam
    const collapsed = Math.abs(D) < 0.06;
    if (collapsed) {
      const v = Math.hypot(M[0], M[2]) > Math.hypot(M[1], M[3]) ? [M[0], M[2]] : [M[1], M[3]];
      const n = Math.hypot(...v) || 1;
      const a = S(-v[0] / n * 40, -v[1] / n * 40), b = S(v[0] / n * 40, v[1] / n * 40);
      for (const [lw, al] of [[14, 0.06], [5, 0.18], [1.6, 0.9]]) {
        ctx.strokeStyle = `rgba(${RED},${al * (0.75 + 0.25 * Math.sin(t * 6))})`; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
      }
    }

    // unit square → parallelogram, coloured by orientation; area = det
    const sq = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([x, y]) => S(...apply(M, x, y)));
    ctx.beginPath(); sq.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath();
    ctx.fillStyle = D >= 0 ? `rgba(${MINT},0.13)` : `rgba(${ROSE},0.16)`; ctx.fill();
    if (D < 0) {
      ctx.save(); ctx.clip();
      ctx.strokeStyle = `rgba(${ROSE},0.35)`; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = -40; k < 40; k++) { ctx.moveTo(cx + k * 8, cy - 400); ctx.lineTo(cx + k * 8 + 400, cy + 400); }
      ctx.stroke(); ctx.restore();
    }

    ctx.globalCompositeOperation = 'source-over';

    // words and the parallelograms between them
    if (words) {
      ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
      ctx.strokeStyle = 'rgba(236,232,220,0.22)';
      for (const q of PARALLELOGRAMS) {
        ctx.beginPath();
        q.forEach((wi, i) => { const p = S(...apply(M, WORDS[wi][1], WORDS[wi][2])); i ? ctx.lineTo(...p) : ctx.moveTo(...p); });
        ctx.closePath(); ctx.stroke();
      }
      ctx.setLineDash([]);
      const seen = new Map();
      WORDS.forEach(([word, x, y], i) => {
        const [tx, ty] = apply(M, x, y), [px, py] = S(tx, ty);
        if (px < -60 || py < -30 || px > w + 60 || py > h + 30) return;
        const key = `${Math.round(px / 6)},${Math.round(py / 6)}`;
        const stack = seen.get(key) || 0; seen.set(key, stack + 1);
        const hot = i === hover;
        ctx.globalCompositeOperation = 'lighter';
        draw.glowDot(ctx, px, py, hot ? 26 : 14, `rgba(${IVORY},${hot ? 0.6 : 0.35})`);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px, py, hot ? 3.4 : 2.4, 0, 7); ctx.fill();
        draw.label(ctx, word, px + 8, py - 9 - stack * 14, collapsed && stack ? `rgb(${RED})` : hot ? '#fff' : 'rgba(236,240,244,.82)', `${hot ? 500 : 400} 12px "IBM Plex Mono", monospace`);
      });
    }

    // î and ĵ
    if (handles) {
      const O = S(0, 0);
      ctx.setLineDash([4, 6]); ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${MINT},.35)`; ctx.beginPath(); ctx.moveTo(...O); ctx.lineTo(...S(1, 0)); ctx.stroke();
      ctx.strokeStyle = `rgba(${ROSE},.35)`; ctx.beginPath(); ctx.moveTo(...O); ctx.lineTo(...S(0, 1)); ctx.stroke();
      ctx.setLineDash([]);
      for (const [v, col, name] of [[[M[0], M[2]], MINT, 'î'], [[M[1], M[3]], ROSE, 'ĵ']]) {
        const P = S(v[0], v[1]);
        ctx.globalCompositeOperation = 'lighter';
        draw.glowDot(ctx, P[0], P[1], 34 * glow, `rgba(${col},0.45)`);
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = `rgb(${col})`; ctx.fillStyle = `rgb(${col})`; ctx.lineWidth = 3;
        draw.arrow(ctx, O[0], O[1], P[0], P[1], 14);
        ctx.beginPath(); ctx.arc(P[0], P[1], 7, 0, 7); ctx.fill();
        ctx.strokeStyle = '#05060a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(P[0], P[1], 3, 0, 7); ctx.stroke();
        draw.label(ctx, `${name}  (${fmt(v[0])}, ${fmt(v[1])})`, P[0] + 16, P[1] + 16, `rgb(${col})`, '500 13px "IBM Plex Mono", monospace');
      }
    }
  }

  Interiors.register({
    id: 'linear-maps', no: '01', concept: 'Linear maps', title: 'Lattice', accent: '#9ee6d4',
    caption: 'Two arrows decide where every word in the space goes.',
    label: 'A luminous grid of word-points that bends as two basis arrows are dragged.',
    mathsTitle: 'A matrix is two arrows',
    controls: [
      { type: 'choice', id: 'preset', label: 'Try a matrix', value: '', options: [['identity', 'Identity'], ['rotate', 'Rotate'], ['shear', 'Shear'], ['stretch', 'Stretch'], ['reflect', 'Reflect'], ['collapse', 'Collapse']] },
      { type: 'toggle', id: 'breathe', label: 'Breathe: identity ↔ your matrix', value: false },
      { type: 'button', id: 'layer', label: 'Add a layer (multiply by another matrix)' }
    ],
    prompts: [
      { do: 'Drag the glowing tip of the mint arrow <b>î</b>.', saw: 'Every star moved, not just the arrow. Straight lines stayed straight, parallel lines stayed parallel. A matrix is one rule applied to the whole space.' },
      { do: 'Point at (or tap) a word to see where it came from.', saw: 'A word at (x, y) lands at x·î + y·ĵ: it keeps its old coordinates but spends them on the new arrows. That is all matrix multiplication is.' },
      { do: 'Drag the rose arrow <b>ĵ</b> until it lies along î.', saw: 'Determinant zero. The plane has collapsed onto a line and different words now sit in the same place. No later layer can separate them again: that information is gone.' },
      { do: 'Swing ĵ round to the other side of î.', saw: 'Negative determinant: space has been flipped into its mirror image. The unit square is inside out.' },
      { do: 'Press <b>Add a layer</b>.', saw: 'Two matrices in a row are a single matrix, their product. Without a non-linearity between them, a hundred layers would be no more expressive than one. (That is the next room.)' }
    ],
    coda: 'Parallelograms stay parallelograms under any matrix, so king − man + woman still lands on queen. Open the maths for the live equation.',
    walk: [
      'A 2×2 matrix is just two arrows written side by side. Its first column says where the arrow <b>î = (1, 0)</b> goes; its second column says where <b>ĵ = (0, 1)</b> goes.',
      'Every other point is a combination of those two, so it has no choice: <b>(x, y)</b> must land at <b>x·î + y·ĵ</b>. Move two arrows and you have moved everything.',
      'The <b>determinant</b> is the area of the shaded square after the transformation. At 1, area is preserved; at 0 the plane is crushed into a line and information is destroyed; when it is negative, space has been flipped.',
      'Matrices compose by multiplication: applying B after A is the single matrix BA.'
    ],
    inside: [
      'A language model stores every token as a vector — a point in a space of a few thousand dimensions. Nearly everything it does to those vectors is a matrix multiplication: the query, key and value projections in attention, the output projection, and both halves of every feed-forward block.',
      'Each of those weight matrices is this picture in thousands of dimensions at once: thousands of “î, ĵ” columns that decide where every possible vector lands. Training moves the columns.'
    ],
    honest: 'The word positions are illustrative placements in two dimensions, chosen so that analogies form parallelograms. Real embeddings are learned and have thousands of dimensions.',
    refs: [['3Blue1Brown — Linear transformations and matrices', 'https://www.3blue1brown.com/lessons/linear-transformations'], ['Mikolov et al. 2013 — Linguistic regularities in word vectors', 'https://aclanthology.org/N13-1090/']],

    create(k) {
      const { ctx, octx } = k;
      const field = stars(3200, 7);
      let target = [1, 0, 0, 1], shown = [1, 0, 0, 1], trail = [1, 0, 0, 1], breathe = 0;
      let drag = null, hover = -1, hoverHandle = null, ptr = null;
      let cx = 0, cy = 0, u = 60;
      const drone = k.sound.drone(110, 'triangle');
      const layout = () => { u = Math.min(k.w, k.h) / 7.2; cx = k.w * 0.5; cy = k.h * 0.47; };
      const toWorld = p => [(p.x - cx) / u, (cy - p.y) / u];
      const shownMatrix = () => {
        if (!k.values.breathe) return shown;
        const s = 0.5 - 0.5 * Math.cos(breathe);
        return shown.map((v, i) => [1, 0, 0, 1][i] + (v - [1, 0, 0, 1][i]) * s);
      };
      const snap = v => { const q = Math.round(v * 4) / 4; return Math.abs(v - q) < 0.07 ? q : v; };

      function nearestHandle(p) {
        const M = shownMatrix(), opts = [['i', M[0], M[2]], ['j', M[1], M[3]]];
        let best = null, bd = 40;
        for (const [id, x, y] of opts) { const d = Math.hypot(cx + x * u - p.x, cy - y * u - p.y); if (d < bd) { bd = d; best = id; } }
        return best;
      }
      function nearestWord(p) {
        const M = shownMatrix();
        let best = -1, bd = 24;
        WORDS.forEach(([, x, y], i) => { const [tx, ty] = apply(M, x, y), d = Math.hypot(cx + tx * u - p.x, cy - ty * u - p.y); if (d < bd) { bd = d; best = i; } });
        return best;
      }
      function check() {
        const D = det(target);
        if (k.stage === 0 && Math.hypot(target[0] - 1, target[2]) > 0.3) k.reach(0);
        if (k.stage === 2 && Math.abs(D) < 0.06 && Math.hypot(target[1], target[3]) > 0.3 && Math.hypot(target[0], target[2]) > 0.3) k.reach(2);
        if (k.stage === 3 && D < -0.3) k.reach(3);
      }

      return {
        resize: layout,
        frame(t, dt) {
          if (!u) layout();
          const rate = drag ? 30 : 6;
          shown = shown.map((v, i) => v + (target[i] - v) * (1 - Math.exp(-dt * rate)));
          if (k.values.breathe && k.motion) breathe += dt * 0.9;
          const M = shownMatrix();
          trail = trail.map((v, i) => v + (M[i] - v) * (1 - Math.exp(-dt * 7)));
          paintLattice(ctx, k.w, k.h, M, { u, cx, cy, t: k.motion ? t : 0, field, hover, prev: trail });
          draw.vignette(ctx, k.w, k.h, 0.65);

          // overlay: big live matrix and the column picture for a hovered word
          octx.clearRect(0, 0, k.w, k.h);
          const D = det(M), mx = k.w - 40, my = 92;
          octx.textAlign = 'right';
          draw.label(octx, 'M =', mx - 146, my + 18, 'rgba(230,236,240,.6)', '15px "IBM Plex Mono", monospace', 'right');
          octx.strokeStyle = 'rgba(230,236,240,.7)'; octx.lineWidth = 1.5;
          octx.beginPath(); octx.moveTo(mx - 128, my - 6); octx.lineTo(mx - 134, my - 6); octx.lineTo(mx - 134, my + 42); octx.lineTo(mx - 128, my + 42); octx.stroke();
          octx.beginPath(); octx.moveTo(mx - 8, my - 6); octx.lineTo(mx - 2, my - 6); octx.lineTo(mx - 2, my + 42); octx.lineTo(mx - 8, my + 42); octx.stroke();
          draw.label(octx, fmt(M[0]), mx - 76, my + 6, `rgb(${MINT})`, '500 17px "IBM Plex Mono", monospace', 'right');
          draw.label(octx, fmt(M[2]), mx - 76, my + 30, `rgb(${MINT})`, '500 17px "IBM Plex Mono", monospace', 'right');
          draw.label(octx, fmt(M[1]), mx - 14, my + 6, `rgb(${ROSE})`, '500 17px "IBM Plex Mono", monospace', 'right');
          draw.label(octx, fmt(M[3]), mx - 14, my + 30, `rgb(${ROSE})`, '500 17px "IBM Plex Mono", monospace', 'right');
          const dcol = Math.abs(D) < 0.06 ? `rgb(${RED})` : D < 0 ? `rgb(${ROSE})` : 'rgba(230,236,240,.75)';
          draw.label(octx, `det = ${fmt(D)}${Math.abs(D) < 0.06 ? '  · collapsed' : D < 0 ? '  · flipped' : ''}`, mx - 2, my + 66, dcol, '13px "IBM Plex Mono", monospace', 'right');

          if (hover >= 0) {
            const [word, x, y] = WORDS[hover];
            const O = [cx, cy], A = apply(M, x, 0), B = apply(M, x, y);
            const PA = [cx + A[0] * u, cy - A[1] * u], PB = [cx + B[0] * u, cy - B[1] * u];
            octx.lineWidth = 2.5;
            octx.strokeStyle = octx.fillStyle = `rgba(${MINT},.95)`; draw.arrow(octx, O[0], O[1], PA[0], PA[1], 10);
            octx.strokeStyle = octx.fillStyle = `rgba(${ROSE},.95)`; draw.arrow(octx, PA[0], PA[1], PB[0], PB[1], 10);
            draw.label(octx, `${word} = ${fmt(x, 1)}·î + ${fmt(y, 1)}·ĵ = (${fmt(B[0])}, ${fmt(B[1])})`, PB[0] + 14, PB[1] + 22, '#fff', '500 13px "IBM Plex Mono", monospace');
          }

          const collapse = Math.abs(D) < 0.06 ? 1 : 0;
          drone.set(55 + 30 * Math.min(4, Math.abs(D)), collapse ? 0.12 : 0.03);
          k.over.style.cursor = drag ? 'grabbing' : hoverHandle ? 'grab' : 'crosshair';
        },
        down(p) {
          drag = nearestHandle(p);
          if (!drag) { const wi = nearestWord(p); if (wi >= 0) { hover = wi; if (k.stage === 1) k.reach(1); } }
          if (drag && k.values.breathe) { k.set('breathe', false); }
        },
        move(p) {
          ptr = p;
          if (drag && p.dragging) {
            const [x, y] = toWorld(p).map(v => clamp(snap(v), -4, 4));
            if (drag === 'i') { target[0] = x; target[2] = y; } else { target[1] = x; target[3] = y; }
            k.set('preset', '');
            check();
          } else if (!p.dragging) {
            hoverHandle = nearestHandle(p);
            hover = hoverHandle ? -1 : nearestWord(p);
            if (hover >= 0 && k.stage === 1) k.reach(1);
          }
        },
        up() { if (drag) k.sound.tone(330 + 110 * Math.abs(det(target)), 0.3, 0.04); drag = null; },
        leave() { hover = -1; hoverHandle = null; },
        control(id, v) {
          if (id === 'preset' && PRESETS[v]) { target = [...PRESETS[v]]; check(); k.sound.tone(392, 0.5, 0.04); }
          if (id === 'layer') {
            const r = rng((Date.now() & 0xffff) + 3), a = (r() - 0.5) * 2.2, s = 0.75 + r() * 0.5;
            const L = [s * Math.cos(a), -Math.sin(a) * 0.9 + (r() - 0.5) * 0.6, Math.sin(a) * 0.9, s * Math.cos(a)];
            target = mul(L, target).map(v => clamp(v, -4, 4));
            k.set('preset', '');
            if (k.stage === 4) k.reach(4);
            k.sound.tone(262, 0.6, 0.05); k.sound.tone(392, 0.6, 0.03);
          }
          if (id === 'breathe') breathe = 0;
        },
        key(e) {
          const d = { ArrowLeft: [-0.25, 0], ArrowRight: [0.25, 0], ArrowUp: [0, 0.25], ArrowDown: [0, -0.25] }[e.key];
          if (!d) return;
          e.preventDefault();
          if (e.shiftKey) { target[1] += d[0]; target[3] += d[1]; } else { target[0] += d[0]; target[2] += d[1]; }
          target = target.map(v => clamp(v, -4, 4));
          check();
        },
        maths() {
          const M = shownMatrix(), D = det(M);
          let word = '';
          if (hover >= 0) {
            const [w, x, y] = WORDS[hover], [X, Y] = apply(M, x, y);
            word = `<div class="row"><span>${w} at</span><span>(${fmt(x, 1)}, ${fmt(y, 1)})</span></div>
              <div class="row"><span>${fmt(x, 1)}·î + ${fmt(y, 1)}·ĵ</span><span class="hl">(${fmt(X)}, ${fmt(Y)})</span></div>`;
          }
          return `<p class="eq">M = [ î  ĵ ]    y = M·x = x·î + y·ĵ</p>
            <div class="row"><span>î (column 1)</span><span style="color:rgb(${MINT})">(${fmt(M[0])}, ${fmt(M[2])})</span></div>
            <div class="row"><span>ĵ (column 2)</span><span style="color:rgb(${ROSE})">(${fmt(M[1])}, ${fmt(M[3])})</span></div>
            <div class="row"><span>det M = ad − bc</span><span class="hl">${fmt(D)}</span></div>
            ${word || '<div class="row"><span>point at a word</span><span>to expand it</span></div>'}`;
        }
      };
    },

    poster(ctx, w, h, t) {
      const a = 0.35 * Math.sin(t * 0.4), sh = 0.6 * Math.sin(t * 0.27);
      const M = [Math.cos(a), -Math.sin(a) + sh, Math.sin(a), Math.cos(a) + sh * 0.3];
      this._field ||= stars(700, 3);
      paintLattice(ctx, w, h, M, { u: Math.min(w, h) / 5.5, cx: w * 0.55, cy: h * 0.45, t, field: this._field, handles: true, words: false });
    }
  });
})();
