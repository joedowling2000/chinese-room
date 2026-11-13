/* FieldStream — the home hero, alive.
   The same study as assets/field-stream-dark.svg (strands threading through
   34 layer planes: a residual stream), drawn on a canvas so that it can move:
   the strands sway and slowly twist, a few pale pulses travel along them from
   the first layer to the last, and each plane brightens a little as a pulse
   crosses it. Decorative procedural geometry only — not measured data.
   The static SVG stays underneath as the fallback and the reduced-motion view. */
const FieldStream = (() => {
  const L = 34, LO = -2.35, HI = 2.35, STRANDS = 56, HALF = 0.6, SUB = 6;
  const INK = '232,232,232';
  // one quiet accent: a pale blue, with the occasional pulse left white
  const HUES = ['140,196,255', '140,196,255', '226,232,240'];

  function rng(seed) {
    let a = seed >>> 0;
    return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const gauss = r => { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
  const X = l => LO + (HI - LO) * l / (L - 1);

  // each strand is a seeded random walk across the layers, kept so it can be re-posed every frame
  function build() {
    const r = rng(11), strands = [];
    for (let s = 0; s < STRANDS; s++) {
      let y = gauss(r) * 0.1, z = gauss(r) * 0.1, vy = 0, vz = 0;
      const walk = [];
      for (let l = 0; l < L; l++) {
        vy = 0.75 * vy + gauss(r) * 0.032; vz = 0.75 * vz + gauss(r) * 0.032;
        y += vy; z += vz;
        walk.push([y, z]);
      }
      strands.push({ walk, phase: r() * 6.283, rate: 0.22 + r() * 0.22, tint: s % 3 === 0, nodes: s % 4 === 0, line: new Float32Array(((L - 1) * SUB + 1) * 2) });
    }
    return strands;
  }

  function mount(host, signal) {
    if (!host) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = document.createElement('canvas');
    canvas.className = 'field-hero-live';
    host.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) { canvas.remove(); return; }

    const strands = build(), r = rng(29);
    const energy = new Float32Array(L), planeHue = new Array(L).fill(HUES[0]);
    const pulses = Array.from({ length: 6 }, (_, i) => ({ s: Math.floor(r() * STRANDS), u: r() * 1.1 - 0.1, v: 0.028 + r() * 0.024, hue: HUES[i % HUES.length], layer: -1 }));
    let w = 0, h = 0, dpr = 1, sc = 1, ox = 0, oy = 0, raf = 0, alive = true, visible = true, t = 0, last = 0, born = 0;
    let mx = 0, my = 0, px = 0, py = 0, wash = null;

    function resize() {
      const b = host.getBoundingClientRect();
      w = b.width; h = b.height; dpr = Math.min(2, devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // the whole study fits inside the box, as the SVG does under object-fit: contain
      sc = Math.min(w / 1000, h / 700); ox = (w - 1000 * sc) / 2; oy = (h - 700 * sc) / 2;
      // a trace of blue where the stream enters, fading to the ink colour where it leaves
      wash = ctx.createLinearGradient(ox + 120 * sc, 0, ox + 900 * sc, 0);
      wash.addColorStop(0, 'rgba(150,198,255,.46)'); wash.addColorStop(1, 'rgba(232,232,232,.42)');
      if (reduced) draw(6, 0);
    }

    function draw(time, dt) {
      // the camera drifts a little, and leans towards the pointer
      px += (mx - px) * Math.min(1, dt * 2.5); py += (my - py) * Math.min(1, dt * 2.5);
      const a = -0.55 + 0.03 * Math.sin(time * 0.11) + px * 0.025, b = 0.65 + 0.018 * Math.sin(time * 0.073 + 1) + py * 0.015;
      const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      const P = (x, y, z) => { const Xr = x * ca - z * sa, Zr = x * sa + z * ca; return [ox + (500 + Xr * 200) * sc, oy + (350 + (y * cb - Zr * sb) * 200) * sc]; };
      const grow = reduced ? 1 : Math.min(1, (time - born) / 2.6); // the stream draws itself in from the first layer
      const twist = 0.045 + 0.012 * Math.sin(time * 0.09);

      ctx.clearRect(0, 0, w, h);

      // a breath of colour in the air behind the stream
      ctx.globalCompositeOperation = 'lighter';
      for (const [x, hue, al, ph] of [[-0.6, '90,150,255', 0.045, 0]]) {
        const [gx, gy] = P(x, 0.1 * Math.sin(time * 0.13 + ph), 0), rad = 300 * sc * (1 + 0.08 * Math.sin(time * 0.17 + ph));
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, rad);
        g.addColorStop(0, `rgba(${hue},${al})`); g.addColorStop(1, `rgba(${hue},0)`);
        ctx.fillStyle = g; ctx.fillRect(gx - rad, gy - rad, rad * 2, rad * 2);
      }
      ctx.globalCompositeOperation = 'source-over';

      // the layer planes; one that a pulse has just crossed glows in that pulse's colour
      ctx.lineWidth = 0.6 * sc;
      for (let l = 0; l < L; l++) {
        if (l / (L - 1) > grow) break;
        const x = X(l), e = energy[l], c = [[-HALF, -HALF], [HALF, -HALF], [HALF, HALF], [-HALF, HALF]].map(([y, z]) => P(x, y, z));
        ctx.beginPath(); c.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
        ctx.strokeStyle = e > 0.02 ? `rgba(${planeHue[l]},${Math.min(0.55, 0.26 + e * 0.3)})` : `rgba(${INK},${l % 8 === 0 ? 0.5 : 0.26})`;
        ctx.lineWidth = (0.6 + Math.min(1, e) * 0.3) * sc;
        ctx.stroke();
      }

      // the strands: Catmull-Rom through one point per layer, swaying as a slow wave runs down the stream
      const n = (L - 1) * SUB + 1, shown = Math.max(2, Math.floor(n * grow));
      const pts = new Array(L);
      for (const S of strands) {
        for (let l = 0; l < L; l++) {
          const [y0, z0] = S.walk[l], sway = (0.01 + 0.016 * l / L) * Math.sin(time * S.rate + l * 0.33 + S.phase);
          const y = y0 + sway, z = z0 + sway * 0.6 * Math.cos(time * 0.2 + S.phase);
          const an = l * twist, cy = y * Math.cos(an) - z * Math.sin(an), cz = y * Math.sin(an) + z * Math.cos(an);
          pts[l] = [X(l), HALF * 0.9 * Math.tanh(cy / (HALF * 0.9)), HALF * 0.9 * Math.tanh(cz / (HALF * 0.9))];
        }
        let o = 0;
        for (let l = 0; l < L - 1; l++) {
          const p0 = pts[Math.max(0, l - 1)], p1 = pts[l], p2 = pts[l + 1], p3 = pts[Math.min(L - 1, l + 2)];
          for (let q = 0; q < SUB; q++) {
            const u = q / SUB, u2 = u * u, u3 = u2 * u;
            const f = k => 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u2 + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * u3);
            const s2 = P(f(0), f(1), f(2)); S.line[o++] = s2[0]; S.line[o++] = s2[1];
          }
        }
        const end = P(...pts[L - 1]); S.line[o++] = end[0]; S.line[o++] = end[1];
        ctx.strokeStyle = S.tint ? wash : `rgba(${INK},.42)`; ctx.lineWidth = 0.7 * sc;
        ctx.beginPath(); ctx.moveTo(S.line[0], S.line[1]);
        for (let i = 1; i < shown; i++) ctx.lineTo(S.line[i * 2], S.line[i * 2 + 1]);
        ctx.stroke();
        if (S.nodes) {
          for (let l = 0; l < L && l * SUB < shown; l++) {
            ctx.fillStyle = `rgba(${INK},${0.38 + 0.3 * Math.sin(time * 1.3 + S.phase + l * 0.7)})`;
            ctx.beginPath(); ctx.arc(S.line[l * SUB * 2], S.line[l * SUB * 2 + 1], 0.95 * sc, 0, 7); ctx.fill();
          }
        }
      }

      // pulses: a comet of colour riding a strand from the first layer to the last
      ctx.globalCompositeOperation = 'lighter';
      for (const p of pulses) {
        if (p.u < 0 || p.u > grow) continue;
        const line = strands[p.s].line, f = p.u * (n - 1), i = Math.min(n - 2, Math.floor(f)), v = f - i;
        const hx = line[i * 2] + (line[i * 2 + 2] - line[i * 2]) * v, hy = line[i * 2 + 1] + (line[i * 2 + 3] - line[i * 2 + 1]) * v;
        const fade = Math.min(1, p.u * 12, (1 - p.u) * 10), tail = 26;
        for (let q = 0; q < tail && i - q > 0; q++) {
          ctx.strokeStyle = `rgba(${p.hue},${(1 - q / tail) ** 2 * 0.5 * fade})`; ctx.lineWidth = (1.4 - 0.6 * q / tail) * sc;
          ctx.beginPath(); ctx.moveTo(line[(i - q) * 2], line[(i - q) * 2 + 1]); ctx.lineTo(line[(i - q - 1) * 2], line[(i - q - 1) * 2 + 1]); ctx.stroke();
        }
        const rad = 11 * sc, g = ctx.createRadialGradient(hx, hy, 0, hx, hy, rad);
        g.addColorStop(0, `rgba(${p.hue},${0.5 * fade})`); g.addColorStop(0.3, `rgba(${p.hue},${0.14 * fade})`); g.addColorStop(1, `rgba(${p.hue},0)`);
        ctx.fillStyle = g; ctx.fillRect(hx - rad, hy - rad, rad * 2, rad * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.75 * fade})`; ctx.beginPath(); ctx.arc(hx, hy, 1.1 * sc, 0, 7); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    function step(dt) {
      for (let l = 0; l < L; l++) energy[l] *= Math.exp(-dt * 2.6);
      for (const p of pulses) {
        p.u += p.v * dt;
        const layer = Math.floor(p.u * (L - 1));
        if (p.u >= 0 && layer !== p.layer && layer >= 0 && layer < L) { p.layer = layer; energy[layer] = Math.min(1, energy[layer] + 0.6); planeHue[layer] = p.hue; }
        if (p.u > 1) { p.u = -r() * 0.5; p.s = Math.floor(r() * STRANDS); p.v = 0.028 + r() * 0.024; p.layer = -1; }
      }
    }

    function loop(now) {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
      if (visible && !document.hidden) { t += dt; step(dt); draw(t, dt); }
      raf = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(resize); ro.observe(host);
    const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; }); io.observe(host);
    const hero = host.closest('.field-hero') || host;
    hero.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const b = hero.getBoundingClientRect(); mx = (e.clientX - b.left) / b.width * 2 - 1; my = (e.clientY - b.top) / b.height * 2 - 1;
    }, { signal, passive: true });
    hero.addEventListener('pointerleave', () => { mx = 0; my = 0; }, { signal });
    resize();
    host.classList.add('is-live');
    if (!reduced) raf = requestAnimationFrame(now => { last = now; loop(now); });
    signal.addEventListener('abort', () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); });
  }

  return { mount };
})();
