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
  // Every sound a piece makes is one of its numbers: pitch, loudness or silence
  // stands for a quantity on screen. Notes come from a pentatonic scale so any
  // combination is consonant; a soft echo gives the room some air.
  const PENT = [0, 2, 4, 7, 9];
  // The room each piece sounds in: the note its ambient bed is built on, chosen to sit under the piece's own voices.
  const KEYS = { 'linear-maps': 110, folding: 146.83, 'gradient-descent': 110, attention: 98, rotary: 110, dimensions: 98, ablation: 146.83 };
  function makeSound(key = 110) {
    let ac = null, master = null, send = null, wet = null, on = prefs.sound === true;
    const drones = [], LEVEL = 0.85;
    function ensure() {
      if (ac) return ac;
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain();
        master.gain.value = on ? LEVEL : 0;
        const comp = ac.createDynamicsCompressor();
        comp.threshold.value = -20; comp.ratio.value = 4; comp.attack.value = 0.01; comp.release.value = 0.3;
        // measured at about −24 dB RMS without it: the make-up gain brings the room up to a comfortable level
        const makeup = ac.createGain(); makeup.gain.value = 2.2;
        master.connect(comp); comp.connect(makeup); makeup.connect(ac.destination);
        // a hall: a few seconds of decaying noise as the impulse of a convolution reverb
        wet = ac.createGain(); wet.gain.value = 0.42;
        const len = Math.floor(ac.sampleRate * 3.2), imp = ac.createBuffer(2, len, ac.sampleRate);
        for (let c = 0; c < 2; c++) { const d = imp.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6; }
        const hall = ac.createConvolver(); hall.buffer = imp;
        const dark = ac.createBiquadFilter(); dark.type = 'lowpass'; dark.frequency.value = 3600;
        wet.connect(hall); hall.connect(dark); dark.connect(master);
        // echo: a filtered feedback delay that everything can send a little of itself to
        send = ac.createGain(); send.gain.value = 0.24;
        const delay = ac.createDelay(1), fb = ac.createGain(), lp = ac.createBiquadFilter();
        delay.delayTime.value = 0.31; fb.gain.value = 0.4; lp.type = 'lowpass'; lp.frequency.value = 1700;
        send.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay); lp.connect(master); lp.connect(wet);
        bed();
      } catch { ac = null; }
      return ac;
    }
    // every voice goes out dry, to the echo and to the hall, from its own place between the speakers
    const out = (g, pan = 0) => {
      let n = g;
      if (pan && ac.createStereoPanner) { n = ac.createStereoPanner(); n.pan.value = pan; g.connect(n); }
      n.connect(master); n.connect(send); n.connect(wet);
    };
    // The bed: a slow, dark chord on the room's key that is always there while sound is on.
    // It is atmosphere only. Everything else you hear is one of the piece's numbers.
    function bed() {
      const t = ac.currentTime, lp = ac.createBiquadFilter(), g = ac.createGain();
      lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 0.6;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 5);
      [[1, 'sawtooth', 0.05, 0], [1.4983, 'sawtooth', 0.028, 5], [2, 'sawtooth', 0.03, -6], [3, 'sine', 0.014, 3], [0.5, 'sine', 0.05, 0]].forEach(([m, type, a, cents]) => {
        const o = ac.createOscillator(), og = ac.createGain();
        o.type = type; o.frequency.value = key * m; o.detune.value = cents; og.gain.value = a;
        o.connect(og); og.connect(lp); o.start(t);
      });
      // the filter opens and closes over about fifteen seconds, and the level breathes a little slower
      const sweep = ac.createOscillator(), depth = ac.createGain(); sweep.frequency.value = 0.065; depth.gain.value = 260;
      sweep.connect(depth); depth.connect(lp.frequency); sweep.start(t);
      const breath = ac.createOscillator(), amt = ac.createGain(); breath.frequency.value = 0.045; amt.gain.value = 0.22;
      breath.connect(amt); amt.connect(g.gain); breath.start(t);
      lp.connect(g); g.connect(master); g.connect(wet);
    }
    return {
      get on() { return on; },
      set on(v) {
        on = v; prefs.sound = v; savePrefs();
        if (v) ensure()?.resume();
        if (master) master.gain.setTargetAtTime(v ? LEVEL : 0, ac.currentTime, 0.1);
      },
      // browsers hold audio until a gesture: called on every touch and key so a remembered "on" really sounds
      wake() { if (on && ensure() && ac.state === 'suspended') ac.resume(); },
      // degree n of a pentatonic scale: 0 is the root, 5 an octave up
      note(n, root = 196) { const d = Math.round(n), o = Math.floor(d / 5); return root * 2 ** ((o * 12 + PENT[d - o * 5]) / 12); },
      // a soft bell: the note, its octave and a twelfth, each dying a little sooner
      tone(freq, dur = 0.4, gain = 0.06, type = 'sine') {
        if (!on || !ensure()) return;
        const t = ac.currentTime, pan = Math.random() * 0.5 - 0.25;
        [[1, 1, 1], [2, 0.28, 0.7], [3, 0.1, 0.45]].forEach(([m, a, life]) => {
          const o = ac.createOscillator(), g = ac.createGain();
          o.type = m === 1 ? type : 'sine'; o.frequency.value = freq * m;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(gain * a * 1.3, t + 0.012);
          g.gain.exponentialRampToValueAtTime(0.0001, t + (dur + 0.25) * life);
          o.connect(g); out(g, pan); o.start(t); o.stop(t + (dur + 0.25) * life + 0.05);
        });
      },
      // a struck string: the click of the strike, then a fundamental with overtones that die away faster
      pluck(freq, gain = 0.07, dur = 1.4) {
        if (!on || !ensure() || !(freq > 20)) return;
        const t = ac.currentTime, pan = Math.random() * 0.7 - 0.35;
        [[1, 1, 1, 'triangle'], [2.003, 0.42, 0.6, 'sine'], [3.01, 0.2, 0.36, 'sine'], [4.2, 0.07, 0.18, 'sine']].forEach(([m, a, life, type]) => {
          const o = ac.createOscillator(), g = ac.createGain();
          o.type = type; o.frequency.value = freq * m;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(gain * a * 1.5, t + 0.004);
          g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.3 * life);
          o.connect(g); out(g, pan); o.start(t); o.stop(t + dur * 1.3 * life + 0.05);
        });
        const n = Math.floor(ac.sampleRate * 0.02), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
        const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
        src.buffer = buf; f.type = 'bandpass'; f.frequency.value = Math.min(6000, freq * 6); f.Q.value = 1.2; g.gain.value = gain * 0.9;
        src.connect(f); f.connect(g); out(g, pan); src.start(t);
      },
      // a breath of filtered noise, for things that break
      noise(dur = 0.5, gain = 0.05, freq = 900) {
        if (!on || !ensure()) return;
        const t = ac.currentTime, n = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
        const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
        src.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8; g.gain.value = gain * 1.6;
        f.frequency.setValueAtTime(freq * 1.6, t); f.frequency.exponentialRampToValueAtTime(freq * 0.6, t + dur);
        src.connect(f); f.connect(g); out(g); src.start(t);
      },
      // a held voice a piece retunes every frame: two oscillators a few cents apart with a quiet octave above,
      // so it shimmers; each voice a piece makes sits a little further across the stereo field
      drone(freq = 110, type = 'sine') {
        const d = { freq, gain: 0, o: null, o2: null, o3: null, g: null }, slot = drones.length;
        const pan = slot ? (slot % 2 ? 1 : -1) * Math.min(0.7, 0.18 * Math.ceil(slot / 2)) : 0;
        d.set = (f, gain) => {
          d.freq = f; d.gain = gain;
          if (!on || !ensure()) return;
          if (!d.o) {
            if (gain <= 0) return;
            d.o = ac.createOscillator(); d.o2 = ac.createOscillator(); d.o3 = ac.createOscillator(); d.g = ac.createGain();
            d.o.type = d.o2.type = type; d.o3.type = 'sine'; d.g.gain.value = 0;
            const lp = ac.createBiquadFilter(), up = ac.createGain(); lp.type = 'lowpass'; lp.frequency.value = 2200; up.gain.value = 0.22;
            d.o.frequency.value = f; d.o2.frequency.value = f * 1.004; d.o3.frequency.value = f * 2;
            d.o.connect(lp); d.o2.connect(lp); d.o3.connect(up); up.connect(lp); lp.connect(d.g); out(d.g, pan);
            d.o.start(); d.o2.start(); d.o3.start();
          }
          d.o.frequency.setTargetAtTime(f, ac.currentTime, 0.08);
          d.o2.frequency.setTargetAtTime(f * 1.004, ac.currentTime, 0.08);
          d.o3.frequency.setTargetAtTime(f * 2, ac.currentTime, 0.08);
          d.g.gain.setTargetAtTime(gain * 1.1, ac.currentTime, 0.15);
        };
        drones.push(d);
        return d;
      },
      dispose() {
        drones.forEach(d => { try { d.o?.stop(); d.o2?.stop(); d.o3?.stop(); } catch {} });
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
  // The wall of seven live posters, then the introduction and the note. It lives on the home page
  // (#interiors); gallery() wraps it for any route that still renders the old page.
  function showcase() {
    return `<div class="ir-wall">${pieces.map(p => `
        <a class="ir-tile" href="#maths/play/${p.id}" style="--ir-accent:${p.accent}">
          <canvas class="ir-poster" data-poster="${p.id}" aria-hidden="true"></canvas>
          <span class="ir-tile-text">
            <span class="ir-tile-no">${p.no} / ${esc(p.title)}</span>
            <span class="ir-tile-title">${esc(p.maths)}</span>
            <span class="ir-tile-eq">${esc(p.eq)}</span>
            <span class="ir-tile-cap">${esc(p.caption)}</span>
          </span>
        </a>`).join('')}
      </div>
      <div class="ir-intro">
        <p>In Searle's thought experiment, a person sits in a closed room. Symbols come in under the door. They follow a rulebook, push other symbols back out, and never understand a word.</p>
        <p>A language model is that room. These are seven of its rules, made visible. Step inside each one and touch the mathematics directly: you are the token being transformed, the word asking a question, the training process feeling for the bottom of the valley.</p>
      </div>
      <p class="ir-note">Touch, mouse or keyboard. Everything runs in your browser; no model is called. Every moving thing is computed by the operation it depicts — the data are small and synthetic, and each piece says where.</p>
      <a class="cta cta-sm cta-quiet" href="#maths">Read the ideas behind each piece</a>`;
  }

  function gallery() {
    return `<section class="ir-gallery"><p class="eyebrow">The maths of AI / Interiors</p><h1>Seven <em>rooms</em></h1>${showcase()}</section>`;
  }

  function control(c) {
    if (c.type === 'range') return `<label class="ir-range" data-row="${c.id}"><span><span>${esc(c.label)}</span><output data-out="${c.id}"></output></span>
      <input type="range" data-ctl="${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.value}" aria-label="${esc(c.label)}"></label>`;
    if (c.type === 'toggle') return `<button type="button" class="ir-toggle" data-row="${c.id}" data-ctl="${c.id}" aria-pressed="${!!c.value}">${esc(c.label)}</button>`;
    if (c.type === 'button') return `<button type="button" data-row="${c.id}" data-ctl="${c.id}">${esc(c.label)}</button>`;
    if (c.type === 'choice') return `<div class="ir-choice" data-row="${c.id}" role="group" aria-label="${esc(c.label)}"><span class="ir-choice-label">${esc(c.label)}</span><div>${c.options.map(([v, t]) =>
      `<button type="button" data-ctl="${c.id}" data-value="${esc(v)}" aria-pressed="${String(v) === String(c.value)}">${esc(t)}</button>`).join('')}</div></div>`;
    return '';
  }

  function frame(p) {
    const idx = pieces.indexOf(p), prev = pieces[(idx + pieces.length - 1) % pieces.length], next = pieces[(idx + 1) % pieces.length];
    return `<section class="ir-piece" style="--ir-accent:${p.accent}" aria-label="${esc(p.maths)}: ${esc(p.title)}">
      <canvas class="ir-canvas ir-base" aria-hidden="true"></canvas>
      <canvas class="ir-canvas ir-over" tabindex="0" role="img" aria-label="${esc(p.label || p.caption)}"></canvas>
      <header class="ir-top ir-chrome">
        <a href="#interiors" class="ir-back">← Interiors</a>
        <span class="ir-where">${p.no} / ${esc(p.title)}</span>
        <span class="ir-top-actions">
          <button type="button" data-host="maths" aria-pressed="false"><span class="ir-wide">The </span>maths <kbd>M</kbd></button>
          <button type="button" data-host="sound" aria-pressed="false" title="${esc(p.hear || 'Sound')}">Sound <kbd>S</kbd></button>
          <button type="button" class="ir-icon" data-host="shot" aria-label="Save this view as an image" title="Save this view as an image (P)">⤓</button>
          <button type="button" class="ir-icon ir-full" data-host="full" aria-pressed="false" aria-label="Full screen" title="Full screen (F)" hidden>⛶</button>
          <a href="#maths/play/${prev.id}" class="ir-step" aria-label="Previous room: ${esc(prev.title)}">‹</a>
          <a href="#maths/play/${next.id}" class="ir-step" aria-label="Next room: ${esc(next.title)}">›</a>
          <a href="#maths" class="ir-close" aria-label="Exit to the maths page">✕</a>
        </span>
      </header>
      <div class="ir-caption ir-chrome">
        <h1>${esc(p.maths)}</h1>
        <p class="ir-eq">${esc(p.eq)}</p>
        <p class="ir-sub">${esc(p.caption)}</p>
        <div class="ir-guide" aria-live="polite">
          <p class="ir-insight" hidden></p>
          <p class="ir-prompt"></p>
          <button type="button" class="ir-showme" data-host="showme" hidden>Show me</button>
          <span class="ir-dots"></span>
        </div>
      </div>
      <i class="ir-hand" aria-hidden="true"></i>
      ${p.you ? `<p class="ir-arrive" aria-hidden="true"><span>${p.no} / ${esc(p.title)}</span>${esc(p.you)}${p.hear ? '<small class="ir-arrive-sound">This room can be heard. Turn on <b>Sound</b>.</small>' : ''}</p>` : ''}
      ${(p.controls || []).length ? `<div class="ir-dock ir-chrome"><button type="button" class="ir-dock-toggle" data-host="dock" aria-expanded="true">Controls</button><div class="ir-dock-body">${p.controls.map(control).join('')}</div></div>` : ''}
      <aside class="ir-drawer" hidden aria-label="The maths">
        <button type="button" class="ir-drawer-close" data-host="maths" aria-label="Close the maths">✕</button>
        <p class="ir-drawer-kicker">${p.no} / ${esc(p.maths)} · ${esc(p.title)}</p>
        <h2>${esc(p.mathsTitle || 'The maths')}</h2>
        <div class="ir-live"></div>
        <div class="ir-walk">${(p.walk || []).map(t => `<p>${t}</p>`).join('')}</div>
        <h3>Inside the model</h3>
        <div class="ir-inside">${(p.inside || []).map(t => `<p>${t}</p>`).join('')}</div>
        ${p.honest ? `<p class="ir-honest">${p.honest}</p>` : ''}
        ${p.hear ? `<p class="ir-honest ir-hear"><b>What you hear (sound on).</b> ${p.hear} The slow chord underneath is only atmosphere; every other sound is one of this room’s numbers.</p>` : ''}
        <p class="ir-refs">${(p.refs || []).map(([t, u]) => u.startsWith('#') ? `<a href="${u}">${esc(t)} →</a>` : `<a href="${u}" target="_blank" rel="noopener">${esc(t)} ↗</a>`).join('')}</p>
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
    // Only posters on screen are redrawn; the maths page holds seven down a long scroll.
    const seen = new Set(canvases);
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)), { rootMargin: '100px' });
    canvases.forEach(c => io.observe(c));
    function draw(t) {
      canvases.forEach((c, i) => {
        if (motion && !seen.has(c)) return;
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
    return { dispose() { alive = false; cancelAnimationFrame(raf); io.disconnect(); removeEventListener('resize', onResize); } };
  }

  /* ---------- the full-bleed frame ---------- */
  function mount(p, root) {
    lastPiece = p.id;
    document.body.classList.add('ir-playing');
    const abort = new AbortController(), signal = abort.signal;
    const $ = s => root.querySelector(s);
    const base = $('.ir-base'), over = $('.ir-over');
    const drawer = $('.ir-drawer'), live = $('.ir-live');
    const sound = makeSound(KEYS[p.id]);
    let w = 0, h = 0, dpr = 1, raf = 0, alive = true, idleTimer = 0, last = performance.now(), t = 0;
    let gl = null, ctx = null;
    if (p.webgl) {
      const opts = { antialias: true, premultipliedAlpha: false, preserveDrawingBuffer: false };
      gl = base.getContext('webgl2', opts) || (p.webgl === 'any' ? base.getContext('webgl', opts) : null);
      if (!gl) ctx = base.getContext('2d');
    } else ctx = base.getContext('2d');
    const octx = over.getContext('2d');

    /* guided discovery: the piece calls k.reach(i) when the viewer has done prompt i */
    const prompts = p.prompts || [];
    const nextRoom = pieces[(pieces.indexOf(p) + 1) % pieces.length];
    // Discoveries can be made in any order. `stage` is the first one not yet made: the prompt on screen.
    const done = new Set();
    let stage = 0;
    // Arrival: one line that says who you are in this room. It never blocks; it
    // fades by itself, or at the first touch.
    const arriveEl = $('.ir-arrive');
    const arrived = () => arriveEl?.classList.add('ir-gone');
    const arriveTimer = setTimeout(arrived, 5200);
    const dots = $('.ir-dots'), promptEl = $('.ir-prompt'), insightEl = $('.ir-insight'), showBtn = $('.ir-showme'), handEl = $('.ir-hand');
    let offerTimer = 0;
    function showGuide() {
      dots.innerHTML = prompts.map((_, i) => done.has(i)
        ? `<button type="button" class="on" data-dot="${i}" aria-label="Read discovery ${i + 1} again"></button>`
        : `<i class="${i === stage ? 'now' : ''}"></i>`).join('');
      // After the last discovery the coda hands the viewer on to the next room.
      promptEl.innerHTML = stage < prompts.length ? `<span>›</span> ${prompts[stage].do}` : `<span>✓</span> ${p.coda || 'Keep exploring. Open the maths for the equation behind what you see.'}${nextRoom !== p ? ` <a class="ir-next" href="#maths/play/${nextRoom.id}">Next room: ${esc(nextRoom.maths)} →</a>` : ''}`;
      // Once the viewer has begun, the title steps back and leaves the room to the artwork.
      root.classList.toggle('ir-begun', done.size > 0);
      // If the viewer stays on one prompt for a while, the room offers to perform it.
      showBtn.hidden = true;
      clearTimeout(offerTimer);
      if (stage < prompts.length) offerTimer = setTimeout(() => { if (inst?.demo && !root.classList.contains('ir-demo')) showBtn.hidden = false; }, 20000);
    }
    let insightTimer = 0, lastXY = null;
    function showInsight(saw) {
      insightEl.innerHTML = saw; insightEl.hidden = false;
      insightEl.classList.remove('ir-flash'); void insightEl.offsetWidth; insightEl.classList.add('ir-flash');
      clearTimeout(insightTimer);
      insightTimer = setTimeout(() => { insightEl.hidden = true; }, 9000);
    }
    // A discovery is marked where it happened: a ring of the room's colour opens from the last touch.
    function pulse() {
      if (reducedMotion()) return;
      const el = document.createElement('i');
      el.className = 'ir-pulse';
      el.style.left = (lastXY ? lastXY.x : w / 2) + 'px'; el.style.top = (lastXY ? lastXY.y : h / 2) + 'px';
      el.addEventListener('animationend', () => el.remove());
      root.appendChild(el);
    }
    function reach(i) {
      if (!(i >= 0 && i < prompts.length) || done.has(i)) return;
      const saw = prompts[i].saw;
      done.add(i);
      stage = 0; while (done.has(stage)) stage++;
      showGuide();
      if (saw) showInsight(saw);
      pulse();
      try { navigator.vibrate?.(12); } catch {}
      sound.tone(440 * 2 ** (done.size / 6), 0.8, 0.05);
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
    // a control with show(values) is only in the dock while that returns true
    function syncShown() {
      (p.controls || []).forEach(c => { if (!c.show) return; const el = root.querySelector(`[data-row="${c.id}"]`); if (el) el.hidden = !c.show(values); });
    }
    Object.keys(values).forEach(syncControl);
    syncShown();

    const motionOn = () => !paused && !reducedMotion();
    let paused = false;

    const k = {
      base, over, gl, ctx, octx, sound, glProgram,
      get w() { return w; }, get h() { return h; }, get dpr() { return dpr; },
      get motion() { return motionOn(); },
      get t() { return t; },
      values,
      set(id, v) { values[id] = v; syncControl(id); syncShown(); },
      reach,
      get stage() { return stage; },
      did: i => done.has(i),
      get show() { return show; },
      wake,
      clamp, lerp, fmt, esc
    };
    /* "Show me": the piece's demo(i) performs prompt i through the same handlers a hand would use */
    const STOP = Symbol('stop');
    let demoRun = 0, hand = null, handDown = false;
    const setHand = (x, y) => { hand = { x, y }; handEl.style.transform = `translate(${x}px,${y}px)`; };
    const tick = (ms, fn) => new Promise((res, rej) => {
      const t0 = performance.now(), run = demoRun;
      (function step(now) {
        if (!alive || run !== demoRun) return rej(STOP);
        const u = Math.min(1, (now - t0) / ms);
        fn(u * u * (3 - 2 * u));
        u < 1 ? requestAnimationFrame(step) : res();
      })(t0);
    });
    const flashRow = id => {
      toggleDock(true);
      const el = root.querySelector(`[data-row="${id}"]`); if (!el) return;
      el.classList.remove('ir-shown'); void el.offsetWidth; el.classList.add('ir-shown');
    };
    const show = {
      wait: ms => tick(ms, () => {}),
      async point(x, y, ms = 450) {
        const a = hand || { x: w / 2, y: h / 2 };
        await tick(ms, u => setHand(lerp(a.x, x, u), lerp(a.y, y, u)));
        inst.move?.({ x, y, dx: 0, dy: 0, dragging: false });
      },
      async hover(x, y, ms = 1100) { await show.point(x, y); await show.wait(ms); },
      async tap(x, y) {
        await show.point(x, y);
        handEl.classList.add('ir-down'); inst.down?.({ x, y, button: 0 }); handDown = true;
        await show.wait(160);
        handDown = false; inst.up?.({ x, y }); inst.tap?.({ x, y }); handEl.classList.remove('ir-down');
        lastXY = { x, y };
        await show.wait(380);
      },
      // drag through a list of [x, y] points
      async drag(pts, ms = 1200) {
        await show.point(pts[0][0], pts[0][1]);
        handEl.classList.add('ir-down'); inst.down?.({ x: pts[0][0], y: pts[0][1], button: 0 }); handDown = true;
        let px = pts[0][0], py = pts[0][1];
        const legs = pts.length - 1;
        await tick(ms, u => {
          const f = Math.min(legs - 1e-6, u * legs), i = Math.floor(f), v = f - i;
          const x = lerp(pts[i][0], pts[i + 1][0], u >= 1 ? 1 : v), y = lerp(pts[i][1], pts[i + 1][1], u >= 1 ? 1 : v);
          inst.move?.({ x, y, dx: x - px, dy: y - py, dragging: true }); px = x; py = y; setHand(x, y);
        });
        handDown = false; inst.up?.({ x: px, y: py }); handEl.classList.remove('ir-down');
        lastXY = { x: px, y: py };
        await show.wait(320);
      },
      async slide(id, to, ms = 900) {
        const c = (p.controls || []).find(c => c.id === id); if (!c) return;
        flashRow(id); lastXY = null;
        const from = values[id];
        await tick(ms, u => {
          const v = clamp(Number((Math.round((from + (to - from) * u) / c.step) * c.step).toFixed(6)), c.min, c.max);
          if (v !== values[id]) { values[id] = v; syncControl(id); inst.control?.(id, v); }
        });
        await show.wait(250);
      },
      async press(id, v) {
        const c = (p.controls || []).find(c => c.id === id); if (!c) return;
        flashRow(id); lastXY = null;
        await show.wait(350);
        if (c.type === 'toggle') values[id] = v === undefined ? !values[id] : v;
        else if (c.type !== 'button') values[id] = v;
        syncControl(id); syncShown();
        inst.control?.(id, c.type === 'button' ? true : values[id]);
        await show.wait(450);
      }
    };
    async function runDemo(i) {
      if (!inst.demo || i >= prompts.length) return;
      const run = ++demoRun;
      showBtn.hidden = true; clearTimeout(offerTimer); arrived();
      root.classList.add('ir-demo', 'ir-touched');
      if (!hand) setHand(w / 2, h / 2);
      try { await inst.demo(i); } catch (e) { if (e !== STOP) console.error(e); }
      if (run === demoRun) root.classList.remove('ir-demo');
    }
    // any real touch takes the room back from the demonstration
    function stopDemo() {
      if (!root.classList.contains('ir-demo')) return;
      demoRun++;
      if (handDown) { handDown = false; try { inst.up?.(hand); } catch {} }
      handEl.classList.remove('ir-down');
      root.classList.remove('ir-demo');
    }

    let inst;
    try { inst = p.create(k); } catch (e) { console.error(e); inst = { frame() {} }; }
    root._piece = inst; root._k = k; // handy for inspection in devtools

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
        if (wantShot) { wantShot = false; snapshot(); }
        if (!drawer.hidden && (now - lastLive > 120)) { lastLive = now; renderLive(); }
      }
      raf = requestAnimationFrame(loop);
    }
    let lastLive = 0, wantShot = false;
    // The two canvases as one picture, signed with the room's name.
    function snapshot() {
      const c = document.createElement('canvas'); c.width = base.width; c.height = base.height;
      const x = c.getContext('2d');
      x.fillStyle = '#05060a'; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(base, 0, 0); x.drawImage(over, 0, 0);
      x.scale(dpr, dpr);
      x.font = '500 11px "IBM Plex Mono", monospace'; x.textBaseline = 'bottom'; x.shadowColor = '#000'; x.shadowBlur = 8;
      x.fillStyle = p.accent; x.fillText(`${p.no} / ${p.title}`.toUpperCase(), 20, h - 34);
      x.fillStyle = 'rgba(238,241,244,.85)'; x.fillText(`${p.maths} · chineseroom.io`, 20, h - 18);
      c.toBlob(b => {
        if (!b) return;
        const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `chinese-room-${p.id}.png`;
        a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }, 'image/png');
      root.classList.remove('ir-shot'); void root.offsetWidth; root.classList.add('ir-shot');
    }
    const fullBtn = $('[data-host="full"]');
    const canFull = !!(document.fullscreenEnabled && root.requestFullscreen);
    if (fullBtn) fullBtn.hidden = !canFull;
    function toggleFull() {
      if (!canFull) return;
      (document.fullscreenElement ? document.exitFullscreen() : root.requestFullscreen()).catch(() => {});
    }
    document.addEventListener('fullscreenchange', () => fullBtn?.setAttribute('aria-pressed', String(document.fullscreenElement === root)), { signal });
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
      wake(); arrived(); stopDemo(); sound.wake(); root.classList.add('ir-touched');
      over.setPointerCapture?.(e.pointerId);
      const q = pos(e); lastXY = q;
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
      pointer = null; lastXY = q;
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
      stopDemo();
      const id = el.dataset.ctl; values[id] = Number(el.value); syncControl(id); inst.control?.(id, values[id]); wake();
    }, { signal });
    root.addEventListener('click', e => {
      const host = e.target.closest('[data-host]');
      if (host) {
        if (host.dataset.host === 'maths') toggleDrawer();
        if (host.dataset.host === 'sound') toggleSound();
        if (host.dataset.host === 'dock') toggleDock();
        if (host.dataset.host === 'shot') wantShot = true;
        if (host.dataset.host === 'full') toggleFull();
        if (host.dataset.host === 'showme') runDemo(stage);
        return;
      }
      const dot = e.target.closest('[data-dot]');
      if (dot) { const saw = prompts[Number(dot.dataset.dot)]?.saw; if (saw) showInsight(saw); wake(); return; }
      const el = e.target.closest('[data-ctl]'); if (!el || el.type === 'range') return;
      const id = el.dataset.ctl, c = p.controls.find(c => c.id === id);
      stopDemo(); sound.wake(); root.classList.add('ir-touched'); lastXY = null;
      if (c.type === 'toggle') values[id] = !values[id];
      else if (c.type === 'choice') values[id] = typeof c.value === 'number' ? Number(el.dataset.value) : el.dataset.value;
      syncControl(id); syncShown();
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
      sound.wake();
      if (key === 'm') { toggleDrawer(); e.preventDefault(); }
      else if (key === 's') { toggleSound(); e.preventDefault(); }
      else if (key === 'f') { toggleFull(); e.preventDefault(); }
      else if (key === 'p') { wantShot = true; e.preventDefault(); }
      else if (key === 'escape') { if (!drawer.hidden) toggleDrawer(false); else location.hash = 'interiors'; e.preventDefault(); }
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
        clearTimeout(idleTimer); clearTimeout(insightTimer); clearTimeout(arriveTimer); clearTimeout(offerTimer);
        abort.abort(); ro.disconnect();
        try { inst.destroy?.(); } catch {}
        if (document.fullscreenElement === root) document.exitFullscreen().catch(() => {});
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
    register, page, wire, draw, showcase, posters: wireGallery, rng, gauss, clamp, lerp, fmt, esc,
    get games() { return pieces; },
    get lastGame() { return lastPiece; }
  };
})();
