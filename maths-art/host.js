/* Interiors — seven interactive artworks from inside a language model.
   The host owns the gallery, the full-bleed frame, chrome, input, the maths
   drawer, guided prompts and sound. Each piece owns its canvas and its maths. */
const Interiors = (() => {
  const pieces = [];
  const STORE = 'interiors-v2';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const fmt = (v, n = 2) => (Math.abs(v) < 0.5 * 10 ** -n ? 0 : v).toFixed(n);
  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  let prefs = {};
  try { prefs = JSON.parse(localStorage.getItem(STORE)) || {}; } catch {}
  const savePrefs = () => { try { localStorage.setItem(STORE, JSON.stringify(prefs)); } catch {} };

  let session = null, lastPiece = null;

  function register(piece) {
    pieces.push(piece);
    pieces.sort((a, b) => a.no.localeCompare(b.no));
  }

  /* ---------- sound: a quiet bus that pieces can play tones and drones on ---------- */
  function makeSound() {
    let ac = null, master = null, on = prefs.sound === true;
    const drones = [];
    function ensure() {
      if (ac) return ac;
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain();
        master.gain.value = on ? 0.5 : 0;
        const comp = ac.createDynamicsCompressor();
        master.connect(comp); comp.connect(ac.destination);
      } catch { ac = null; }
      return ac;
    }
    return {
      get on() { return on; },
      set on(v) {
        on = v; prefs.sound = v; savePrefs();
        if (v) ensure()?.resume();
        if (master) master.gain.setTargetAtTime(v ? 0.5 : 0, ac.currentTime, 0.1);
      },
      tone(freq, dur = 0.4, gain = 0.06, type = 'sine') {
        if (!on || !ensure()) return;
        const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
        o.type = type; o.frequency.value = freq;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(gain, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
      },
      drone(freq = 110, type = 'sine') {
        const d = { freq, gain: 0, o: null, g: null };
        d.set = (f, gain) => {
          d.freq = f; d.gain = gain;
          if (!on || !ensure()) return;
          if (!d.o) {
            d.o = ac.createOscillator(); d.g = ac.createGain();
            d.o.type = type; d.g.gain.value = 0;
            const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
            d.o.connect(lp); lp.connect(d.g); d.g.connect(master); d.o.start();
          }
          d.o.frequency.setTargetAtTime(f, ac.currentTime, 0.08);
          d.g.gain.setTargetAtTime(gain, ac.currentTime, 0.15);
        };
        drones.push(d);
        return d;
      },
      dispose() {
        drones.forEach(d => { try { d.o?.stop(); } catch {} });
        drones.length = 0;
        try { ac?.close(); } catch {}
        ac = null;
      }
    };
  }

  /* ---------- WebGL helper for shader pieces ---------- */
  function glProgram(gl, vs, fs) {
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  /* ---------- markup ---------- */
  function gallery() {
    return `<section class="ir-gallery">
      <p class="eyebrow">The maths of AI / Interiors</p>
      <h1>Inside the <em>room.</em></h1>
      <div class="ir-intro">
        <p>In Searle's thought experiment, a person sits in a closed room. Symbols come in under the door. They follow a rulebook, push other symbols back out, and never understand a word.</p>
        <p>A language model is that room. These are seven of its rules, made visible. Step inside each one and touch the mathematics directly: you are the token being transformed, the word asking a question, the training process feeling for the bottom of the valley.</p>
      </div>
      <div class="ir-wall">${pieces.map(p => `
        <a class="ir-tile" href="#maths/play/${p.id}" style="--ir-accent:${p.accent}">
          <canvas class="ir-poster" data-poster="${p.id}" aria-hidden="true"></canvas>
          <span class="ir-tile-text">
            <span class="ir-tile-no">${p.no} / ${esc(p.concept)}</span>
            <span class="ir-tile-title">${esc(p.title)}</span>
            <span class="ir-tile-cap">${esc(p.caption)}</span>
          </span>
        </a>`).join('')}
      </div>
      <p class="ir-note">Touch, mouse or keyboard. Everything runs in your browser; no model is called. Every moving thing is computed by the operation it depicts — the data are small and synthetic, and each piece says where.</p>
      <a class="text-link" href="#maths">Read the ideas and flat diagrams →</a>
    </section>`;
  }

  function control(c) {
    if (c.type === 'range') return `<label class="ir-range"><span><span>${esc(c.label)}</span><output data-out="${c.id}"></output></span>
      <input type="range" data-ctl="${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.value}" aria-label="${esc(c.label)}"></label>`;
    if (c.type === 'toggle') return `<button type="button" class="ir-toggle" data-ctl="${c.id}" aria-pressed="${!!c.value}">${esc(c.label)}</button>`;
    if (c.type === 'button') return `<button type="button" data-ctl="${c.id}">${esc(c.label)}</button>`;
    if (c.type === 'choice') return `<div class="ir-choice" role="group" aria-label="${esc(c.label)}"><span class="ir-choice-label">${esc(c.label)}</span><div>${c.options.map(([v, t]) =>
      `<button type="button" data-ctl="${c.id}" data-value="${esc(v)}" aria-pressed="${String(v) === String(c.value)}">${esc(t)}</button>`).join('')}</div></div>`;
    return '';
  }

  function frame(p) {
    const idx = pieces.indexOf(p), prev = pieces[(idx + pieces.length - 1) % pieces.length], next = pieces[(idx + 1) % pieces.length];
    return `<section class="ir-piece" style="--ir-accent:${p.accent}" aria-label="${esc(p.title)}">
      <canvas class="ir-canvas ir-base" aria-hidden="true"></canvas>
      <canvas class="ir-canvas ir-over" tabindex="0" role="img" aria-label="${esc(p.label || p.caption)}"></canvas>
      <header class="ir-top ir-chrome">
        <a href="#maths/play" class="ir-back">← Interiors</a>
        <span class="ir-where">${p.no} / ${esc(p.concept)}</span>
        <span class="ir-top-actions">
          <button type="button" data-host="maths" aria-pressed="false">The maths <kbd>M</kbd></button>
          <button type="button" data-host="sound" aria-pressed="false">Sound <kbd>S</kbd></button>
          <a href="#maths/play/${prev.id}" class="ir-step" aria-label="Previous room: ${esc(prev.title)}">‹</a>
          <a href="#maths/play/${next.id}" class="ir-step" aria-label="Next room: ${esc(next.title)}">›</a>
          <a href="#maths" class="ir-close" aria-label="Exit to the maths page">✕</a>
        </span>
      </header>
      <div class="ir-caption ir-chrome">
        <h1>${esc(p.title)}</h1>
        <p class="ir-sub">${esc(p.caption)}</p>
        <div class="ir-guide" aria-live="polite">
          <p class="ir-insight" hidden></p>
          <p class="ir-prompt"></p>
          <span class="ir-dots" aria-hidden="true"></span>
        </div>
      </div>
      ${(p.controls || []).length ? `<div class="ir-dock ir-chrome"><button type="button" class="ir-dock-toggle" data-host="dock" aria-expanded="true">Controls</button><div class="ir-dock-body">${p.controls.map(control).join('')}</div></div>` : ''}
      <aside class="ir-drawer" hidden aria-label="The maths">
        <button type="button" class="ir-drawer-close" data-host="maths" aria-label="Close the maths">✕</button>
        <p class="ir-drawer-kicker">${p.no} / ${esc(p.concept)}</p>
        <h2>${esc(p.mathsTitle || 'The maths')}</h2>
        <div class="ir-live"></div>
        <div class="ir-walk">${(p.walk || []).map(t => `<p>${t}</p>`).join('')}</div>
        <h3>Inside the model</h3>
        <div class="ir-inside">${(p.inside || []).map(t => `<p>${t}</p>`).join('')}</div>
        ${p.honest ? `<p class="ir-honest">${p.honest}</p>` : ''}
        <p class="ir-refs">${(p.refs || []).map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(t)} ↗</a>`).join('')}</p>
      </aside>
    </section>`;
  }

  function page(id) {
    const p = pieces.find(p => p.id === id);
    return p ? frame(p) : gallery();
  }

  /* ---------- gallery posters ---------- */
  function wireGallery(root) {
    const canvases = [...root.querySelectorAll('[data-poster]')];
    const motion = !reducedMotion();
    let raf = 0, alive = true;
    const t0 = performance.now();
    const size = c => {
      const r = c.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
      c.width = Math.max(1, r.width * d); c.height = Math.max(1, r.height * d);
      c.getContext('2d').setTransform(d, 0, 0, d, 0, 0);
      return [r.width, r.height];
    };
    let dims = canvases.map(size);
    const onResize = () => { dims = canvases.map(size); if (!motion) draw(4); };
    function draw(t) {
      canvases.forEach((c, i) => {
        const p = pieces.find(p => p.id === c.dataset.poster), ctx = c.getContext('2d');
        const [w, h] = dims[i];
        ctx.save();
        try { p.poster(ctx, w, h, t); } catch (e) { console.error(e); }
        ctx.restore();
      });
    }
    function loop(now) {
      if (!alive) return;
      if (!document.hidden) draw((now - t0) / 1000);
      raf = requestAnimationFrame(loop);
    }
    addEventListener('resize', onResize);
    if (motion) raf = requestAnimationFrame(loop); else draw(4);
    return { dispose() { alive = false; cancelAnimationFrame(raf); removeEventListener('resize', onResize); } };
  }

  /* ---------- the full-bleed frame ---------- */
  function mount(p, root) {
    lastPiece = p.id;
    document.body.classList.add('ir-playing');
    const abort = new AbortController(), signal = abort.signal;
    const $ = s => root.querySelector(s);
    const base = $('.ir-base'), over = $('.ir-over');
    const drawer = $('.ir-drawer'), live = $('.ir-live');
    const sound = makeSound();
    let w = 0, h = 0, dpr = 1, raf = 0, alive = true, idleTimer = 0, last = performance.now(), t = 0;
    let gl = null, ctx = null;
    if (p.webgl) {
      gl = base.getContext('webgl', { antialias: true, premultipliedAlpha: false, preserveDrawingBuffer: false });
      if (!gl) ctx = base.getContext('2d');
    } else ctx = base.getContext('2d');
    const octx = over.getContext('2d');

    /* guided discovery: the piece calls k.reach(i) when the viewer has done prompt i */
    const prompts = p.prompts || [];
    let stage = 0;
    const dots = $('.ir-dots'), promptEl = $('.ir-prompt'), insightEl = $('.ir-insight');
    function showGuide() {
      dots.innerHTML = prompts.map((_, i) => `<i class="${i < stage ? 'on' : i === stage ? 'now' : ''}"></i>`).join('');
      promptEl.innerHTML = stage < prompts.length ? `<span>›</span> ${prompts[stage].do}` : `<span>✓</span> ${p.coda || 'Keep exploring. Open the maths for the equation behind what you see.'}`;
    }
    let insightTimer = 0;
    function reach(i) {
      if (i !== stage || stage >= prompts.length) return;
      const saw = prompts[stage].saw;
      stage++;
      showGuide();
      if (saw) {
        insightEl.innerHTML = saw; insightEl.hidden = false;
        insightEl.classList.remove('ir-flash'); void insightEl.offsetWidth; insightEl.classList.add('ir-flash');
        clearTimeout(insightTimer);
        insightTimer = setTimeout(() => { insightEl.hidden = true; }, 9000);
      }
      sound.tone(440 * 2 ** (stage / 6), 0.8, 0.05);
      wake();
    }
    showGuide();

    /* dock controls */
    const values = {};
    (p.controls || []).forEach(c => { values[c.id] = c.value; });
    function syncControl(id) {
      const c = (p.controls || []).find(c => c.id === id); if (!c) return;
      root.querySelectorAll(`[data-ctl="${id}"]`).forEach(el => {
        if (c.type === 'range') { el.value = values[id]; const o = root.querySelector(`[data-out="${id}"]`); if (o) o.textContent = c.fmt ? c.fmt(values[id]) : values[id]; }
        if (c.type === 'toggle') el.setAttribute('aria-pressed', String(!!values[id]));
        if (c.type === 'choice') el.setAttribute('aria-pressed', String(el.dataset.value === String(values[id])));
      });
    }
    Object.keys(values).forEach(syncControl);

    const motionOn = () => !paused && !reducedMotion();
    let paused = false;

    const k = {
      base, over, gl, ctx, octx, sound, glProgram,
      get w() { return w; }, get h() { return h; }, get dpr() { return dpr; },
      get motion() { return motionOn(); },
      get t() { return t; },
      values,
      set(id, v) { values[id] = v; syncControl(id); },
      reach,
      get stage() { return stage; },
      wake,
      clamp, lerp, fmt, esc
    };
    let inst;
    try { inst = p.create(k); } catch (e) { console.error(e); inst = { frame() {} }; }

    function resize() {
      const r = root.getBoundingClientRect();
      dpr = Math.min(p.maxDpr || 2, devicePixelRatio || 1);
      w = r.width; h = r.height;
      for (const c of [base, over]) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      octx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (gl) gl.viewport(0, 0, base.width, base.height);
      inst.resize?.(w, h);
    }

    function loop(now) {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!document.hidden) {
        t += dt;
        try { inst.frame(t, dt); } catch (e) { console.error(e); alive = false; return; }
        if (!drawer.hidden && (now - lastLive > 120)) { lastLive = now; renderLive(); }
      }
      raf = requestAnimationFrame(loop);
    }
    let lastLive = 0;
    function renderLive() { if (inst.maths) live.innerHTML = inst.maths(); }

    /* chrome fades when idle so the artwork can breathe */
    function wake() {
      root.classList.remove('ir-idle');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { if (!root.matches(':focus-within') || document.activeElement === over) root.classList.add('ir-idle'); }, 5000);
    }

    /* pointer: drag + tap, in CSS pixels relative to the frame */
    let pointer = null;
    const pos = e => { const r = over.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    over.addEventListener('pointerdown', e => {
      wake();
      over.setPointerCapture?.(e.pointerId);
      const q = pos(e);
      pointer = { id: e.pointerId, x0: q.x, y0: q.y, t0: performance.now(), moved: false, x: q.x, y: q.y };
      inst.down?.({ ...q, button: e.button });
      e.preventDefault();
    }, { signal });
    over.addEventListener('pointermove', e => {
      const q = pos(e);
      if (pointer && pointer.id === e.pointerId) {
        const dx = q.x - pointer.x, dy = q.y - pointer.y;
        pointer.x = q.x; pointer.y = q.y;
        if (Math.hypot(q.x - pointer.x0, q.y - pointer.y0) > 6) pointer.moved = true;
        inst.move?.({ ...q, dx, dy, dragging: true });
      } else {
        inst.move?.({ ...q, dx: 0, dy: 0, dragging: false });
        if (e.pointerType === 'mouse') wake();
      }
    }, { signal });
    const end = e => {
      if (!pointer || pointer.id !== e.pointerId) return;
      const q = pos(e), tap = !pointer.moved && performance.now() - pointer.t0 < 450;
      pointer = null;
      inst.up?.(q);
      if (tap) inst.tap?.(q);
    };
    over.addEventListener('pointerup', end, { signal });
    over.addEventListener('pointercancel', end, { signal });
    over.addEventListener('pointerleave', e => { if (!pointer) inst.leave?.(); }, { signal });
    over.addEventListener('wheel', e => { if (inst.wheel) { inst.wheel(e.deltaY, pos(e)); e.preventDefault(); } }, { signal, passive: false });

    /* dock + header */
    root.addEventListener('input', e => {
      const el = e.target.closest('[data-ctl]'); if (!el || el.type !== 'range') return;
      const id = el.dataset.ctl; values[id] = Number(el.value); syncControl(id); inst.control?.(id, values[id]); wake();
    }, { signal });
    root.addEventListener('click', e => {
      const host = e.target.closest('[data-host]');
      if (host) {
        if (host.dataset.host === 'maths') toggleDrawer();
        if (host.dataset.host === 'sound') toggleSound();
        if (host.dataset.host === 'dock') toggleDock();
        return;
      }
      const el = e.target.closest('[data-ctl]'); if (!el || el.type === 'range') return;
      const id = el.dataset.ctl, c = p.controls.find(c => c.id === id);
      if (c.type === 'toggle') values[id] = !values[id];
      else if (c.type === 'choice') values[id] = typeof c.value === 'number' ? Number(el.dataset.value) : el.dataset.value;
      syncControl(id);
      inst.control?.(id, c.type === 'button' ? true : values[id]);
      wake();
    }, { signal });

    function toggleDrawer(force) {
      const open = force ?? drawer.hidden;
      drawer.hidden = !open;
      root.classList.toggle('ir-drawer-open', open);
      root.querySelectorAll('[data-host="maths"]').forEach(b => b.setAttribute('aria-pressed', String(open)));
      prefs.drawer = open; savePrefs();
      if (open) renderLive();
      inst.drawer?.(open);
    }
    const dock = $('.ir-dock');
    function toggleDock(force) {
      if (!dock) return;
      const open = force ?? dock.classList.contains('ir-dock-closed');
      dock.classList.toggle('ir-dock-closed', !open);
      dock.querySelector('.ir-dock-toggle').setAttribute('aria-expanded', String(open));
    }
    if (innerHeight < 720 || innerWidth < 760) toggleDock(false);
    function toggleSound() {
      sound.on = !sound.on;
      root.querySelector('[data-host="sound"]').setAttribute('aria-pressed', String(sound.on));
      inst.sound?.(sound.on);
    }
    root.querySelector('[data-host="sound"]').setAttribute('aria-pressed', String(sound.on));

    document.addEventListener('keydown', e => {
      if (e.target.closest?.('input,textarea,select') || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'm') { toggleDrawer(); e.preventDefault(); }
      else if (key === 's') { toggleSound(); e.preventDefault(); }
      else if (key === 'escape') { if (!drawer.hidden) toggleDrawer(false); else location.hash = 'maths/play'; e.preventDefault(); }
      else if (key === ' ' && (document.activeElement === over || document.activeElement === document.body)) { paused = !paused; e.preventDefault(); }
      else inst.key?.(e);
      wake();
    }, { signal });

    const ro = new ResizeObserver(resize);
    ro.observe(root);
    resize();
    if (window.innerWidth > 900 && prefs.drawer) toggleDrawer(true);
    wake();
    raf = requestAnimationFrame(loop);

    return {
      dispose() {
        alive = false;
        cancelAnimationFrame(raf);
        clearTimeout(idleTimer); clearTimeout(insightTimer);
        abort.abort(); ro.disconnect();
        try { inst.destroy?.(); } catch {}
        sound.dispose();
        document.body.classList.remove('ir-playing');
      }
    };
  }

  function wire(id) {
    session?.dispose(); session = null;
    document.body.classList.remove('ir-playing');
    const piece = pieces.find(p => p.id === id);
    const root = document.querySelector(piece ? '.ir-piece' : '.ir-gallery');
    if (!root) return;
    session = piece ? mount(piece, root) : wireGallery(root);
  }

  /* shared drawing helpers for pieces */
  const draw = {
    glowDot(ctx, x, y, r, color, alpha = 1) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = alpha; ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    },
    arrow(ctx, x0, y0, x1, y1, head = 12) {
      const a = Math.atan2(y1 - y0, x1 - x0);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - head * Math.cos(a - 0.4), y1 - head * Math.sin(a - 0.4));
      ctx.lineTo(x1 - head * Math.cos(a + 0.4), y1 - head * Math.sin(a + 0.4));
      ctx.closePath(); ctx.fill();
    },
    label(ctx, text, x, y, color = '#e8eef2', font = '12px "IBM Plex Mono", monospace', align = 'left') {
      ctx.font = font; ctx.textAlign = align; ctx.textBaseline = 'middle';
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(5,6,10,.85)'; ctx.strokeText(text, x, y);
      ctx.fillStyle = color; ctx.fillText(text, x, y);
    },
    vignette(ctx, w, h, strength = 0.75) {
      const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.hypot(w, h) * 0.6);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${strength})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
  };

  /* deterministic random for reproducible art */
  function rng(seed = 1) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
  }
  function gauss(r) { let u = 0, v = 0; while (!u) u = r(); v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  return {
    register, page, wire, draw, rng, gauss, clamp, lerp, fmt, esc,
    get games() { return pieces; },
    get lastGame() { return lastPiece; }
  };
})();
