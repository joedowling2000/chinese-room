# Interiors — review, plan and progress

Version 2 · 25 October 2026. Read with [DESIGN.md](DESIGN.md). Supersedes the v1 "Field Instruments" plan (recoverable from git history at commit `9782810`).

## Live checkpoint (resume point)

- **Current task:** milestones A–P complete. P (Interiors gallery moved to the home page) committed 28 Oct 2026, not yet pushed or deployed.
- **Run locally:** `python3 -m http.server 8000` from the repo root, open `http://localhost:8000/#maths/play`.
- **Commit policy:** commit after each piece is working, with this file updated in the same commit. No push or deploy without separate authorisation.

## 1. Review of v1 (the previous agent's documents and build)

The previous documents (`RESEARCH.md`, `DESIGN.md`, `PLAN.md`, `FIXTURES.md`) were careful about mathematical correctness but optimised for the wrong thing. Against the clarified brief, the failings were:

| # | Failing | Evidence | Consequence |
|---|---|---|---|
| 1 | **Wrong medium.** It designed puzzle games (chambers, receivers, witness solutions, completion predicates) when the brief wanted interactive art. | DESIGN v1 §3 "complete loop", 21 chambers, FIXTURES table of witness solutions | Effort went into level authoring and pass/fail logic, not imagery. |
| 2 | **No art.** The "immense silent installation" was never drawn. Every game is two small SVG grids on a grey panel. | All seven screens share `fi-workspace` layout | Nothing stunning, nothing to look at. |
| 3 | **All seven look the same.** One host template (header, chamber tabs, stage, slider rail, status bar) for every concept. | `maths-games/host.js` renders one layout for all games | Contradicted its own "distinct verbs" requirement. |
| 4 | **Not identifiable / no LLM grounding.** Abstract jargon ("signals", "receivers", "plates", "probes") replaced tokens, words and sentences. | Basis Foundry: "Connect all three signals to their hollow receivers" | A viewer can't tell what any of it has to do with a language model. |
| 5 | **Explanation actively suppressed.** v1 made "challenge survives removal of explanatory prose", "no long introduction", "no lecture gate" rules. | DESIGN v1 §1, §2, §12 | No context or walkthrough of the maths at all. |
| 6 | **Interaction by slider.** Basis vectors, queries and rates are set with ± slider rows; "Run trial" adds a ceremony with no payoff. | `range()` helper used everywhere | Interaction feels like a form, not like touching the maths. |
| 7 | **Not inside the model.** Nothing frames the viewer as a token or as training. | — | The "simulate being inside the LLM" brief was missed. |
| 8 | **Effort spent on infrastructure.** Replay timers, per-update rewind, save migration and legacy backup, packaging modes, Safari automation, "acceptance gates". | PLAN v1 checkpoints 5–8 | Hours of verification work on features nobody asked for. |
| 9 | **Unmaintainable code.** Minified one-line modules (`basis-foundry.js` is ~20 lines of ~600 characters each). | `maths-games/games/*.js` | Hard to iterate on. |

What was right and is kept: the seven concepts and route ids; the truthfulness rules (compute the real operation, label synthetic data, avoid known misconceptions like "ReLU reflects"); the references in RESEARCH.md; the static, dependency-free, touch-first constraints.

## 2. Plan

A new directory `maths-art/` replaces `maths-games/`. The global becomes `Interiors` (was `FieldGames`); `app.js` integration is updated in place. Routes stay `#maths/play` and `#maths/play/<id>`.

```text
maths-art/
  interiors.css      gallery + full-bleed piece frame
  host.js            Interiors: registry, gallery page, frame chrome, rAF loop,
                     pointer/keyboard, maths drawer, prompts, sound, GL helper
  pieces/
    01-lattice.js  02-stained-glass.js  03-descent.js  04-loom.js
    05-orrery.js   06-crowded-sky.js    07-nullspace.js
```

Piece contract (each file calls `Interiors.register({...})`):

```js
{
  id, no, title, concept, caption, accent,
  prompts: [...],                 // guided discovery lines, advanced by the piece
  controls: [...],                // dock descriptors: range / toggle / buttons
  create(k) -> {                  // k: canvas, ctx/gl, size, ui helpers, sound
    frame(t, dt), resize(w, h),
    down(p), move(p), up(p), tap(p),
    control(id, value), maths() -> html, destroy()
  },
  poster(ctx, w, h, t)            // cheap still/animated thumbnail for the gallery
}
```

### Milestones

| # | Work | Done when |
|---|---|---|
| A | Docs: review + new design + plan (this) | committed |
| B | Host: gallery, full-bleed frame, chrome auto-hide, dock, maths drawer, prompts, keyboard, reduced motion, sound bus, app.js/index.html/packaging integration; old `maths-games/` removed | gallery and an empty frame render; routes work |
| C | 01 Lattice | drag î/ĵ bends the whole space; collapse and flip read clearly |
| D | 04 Loom | tapping words weaves threads; coreference flip works |
| E | 03 Descent | ridgeline terrain renders with seeds and trails; η/μ behave truthfully |
| F | 02 Stained Glass | WebGL panes from a live ReLU net; drawing creases; training; linear toggle |
| G | 05 Orrery | clocks, shift invariance, spirograph traces |
| H | 06 Crowded Sky | repelling feature-stars on circle/sphere; activation readouts; high-d histogram |
| I | 07 Nullspace | particle cloud, blade, projection, text strip |
| J | Polish pass: gallery posters, mobile/iPad layout, sound, README | all seven reviewed in browser at desktop and tablet sizes |

Order puts the most identifiable pieces first (Lattice, Loom, Descent) and the technically riskiest (WebGL glass) once the host is proven.

### Verification per piece

Browser check at 1440×900 and 820×1180 (Chrome via automation): no console errors, the first prompt is actionable, interaction changes the image, the maths drawer shows live values matching a hand calculation, 60fps-ish on desktop (frame time logged), reduced-motion path works. Physical-iPad review remains a user step.

## 3. Progress log

- **A — 25 Oct 2026.** Reviewed v1 docs and build; wrote this review, new DESIGN.md and RESEARCH.md addendum. FIXTURES.md (v1 puzzle witnesses) removed; it's in git history.
- **B — 25 Oct 2026.** New `maths-art/host.js` + `interiors.css`: gallery with live posters, full-bleed two-canvas frame (base 2D/WebGL + 2D overlay), auto-fading chrome, guided discovery prompts with insight lines and progress dots, dock controls, live maths drawer, sound bus (off by default), keyboard (M/S/Esc/Space), reduced motion, ResizeObserver. `app.js`, `index.html`, `maths.js` copy and `prepare-hosting.sh` switched to `Interiors`/`maths-art`; old `maths-games/` removed.
- **C — 25 Oct 2026.** *Lattice* done. Drag î/ĵ (snaps to quarters), 3,200 star-vectors leave light streaks while space moves, twin glowing lattices, word-stars with analogy parallelograms, hover a word for the column picture x·î + y·ĵ, live matrix and determinant (collapse seam in red, flipped square hatched), presets, breathe, add-a-layer. Checked in Chrome at 1440×900: drag, presets, collapse, prompts advance.
- **D — 25 Oct 2026.** *Loom* done. Sentence on an arch; four hand-built heads (previous word, meaning, agreement, copying) plus an attention sink, real softmax with temperature and causal mask; the full weave drawn as string-art ribbons, the selected word's threads thick with value-coloured light travelling along them; centre medallion = Σ wᵢvᵢ as colour. Verified: *tired* → animal, *wide* → street (79%), copy head on "Ada met" → Turing. Host gained a collapsible dock (collapsed under 720px tall), title shrink during insights, and canvases slide left when the maths drawer opens. Dev note: Chrome heuristically caches `python -m http.server` files; use a no-store server (see scratchpad script) or a fresh port when reviewing.
- **E — 25 Oct 2026.** *Descent* done. 64 occluding ridgelines (pre-rendered per resize) of a synthetic bowl + 6 Gaussian valleys + ripple with analytic gradient; tap/drag drops seeds; true momentum update at 40 steps/s with η ∈ [0.001, 0.4], μ ∈ [0, 0.97] (no hidden scale factors); long-exposure trails coloured by step size (ice → amber), settled seeds pulse, divergent seeds fade out; −∇L arrow on the latest seed; Rain shows basins of attraction. Verified at η = 0.012 (clean basins) and η = 0.3 (oscillation/overshoot).
- **F — 25 Oct 2026.** *Stained Glass* done. WebGL2 fragment shader evaluates a 2→(≤16)→(≤8)→(≤8)→1 ReLU net per pixel from a float parameter texture; lead lines where any pre-activation crosses zero (|z|/fwidth(z)); pane hue from the activation-pattern hash, warm/cold from the output, linear shading within each pane, rippled glass, gothic arch frame. Drag to add a first-layer neuron along the stroke; activation toggle (linear → a single pane); depth 1–3; Train = full-batch Adam on 180 spiral points (≈90% in seconds). CPU fallback renderer (also used for the gallery poster). Host now asks for WebGL2. Measured 120 fps while training in Chrome; no console errors.
- **G — 25 Oct 2026.** *Orrery* done. Brass orrery: K orbits (2–8), θᵢ = base^(−i/K) with base 10–10,000; the query word (*it*) and a chosen word are planets on every orbit, the ember arc between them is (n−m)θᵢ + content phase; centre dial shows the normalised score; sentence rail with a tiny K-hand clock per word, drag to shift all positions (score stays fixed, verified +4 shift → −0.01 unchanged); score-vs-distance curve; spirograph of the chained rotations in the background. Insight text now near-white with accent marker; caption only half-fades when idle.
- **H — 25 Oct 2026.** *Crowded Sky* done. 2–16 labelled concept directions on a glassy rotating globe (or circle) over a pre-rendered nebula; gradient descent on a positive-overlap interference energy settles them into polytopes; great-circle filaments glow with overlap; tap stars to activate → white comet z = Σ vᵢ, readout bars vⱼ·z with threshold 0.5, ghosts (false positives) flicker pink, misses ringed; Stream mode samples sparse "sentences" at a chosen frequency and reports perfect-readout rate; Many-dimensions mode draws a protractor fan of 1,035 pairwise angles of random directions with a rim histogram (1000-D → white beam at 90°, measured spread 1.4°). Auto-rotation pauses near interaction. Host exposes `root._piece` for devtools.
- **I — 25 Oct 2026.** *Nullspace* done. 5,000 (3,000 on narrow screens) synthetic activations built from a refusal direction, an orthogonal topic direction and noise; rendered as smoke (depth-bucketed cores + soft sprites) under a perspective orbit camera; translucent gridded blade with its normal arrow; drag the tip to turn the blade, drag elsewhere to orbit; α eases every point to x − α(x·n)n with removed-component streaks; meters for refusal signal, topic signal and |cos(n, refusal)|; Find = difference of means from the original points; Aim up demonstrates collateral damage; canned example replies switch on the refusal signal. Verified Find + α=1 → refusal 0%, topic 100%, replies flip. Internal refs (`#…`) open in-site.
- **J — 25 Oct 2026.** Polish pass. Gallery: balanced 2/3/2 grid, live posters re-framed above the tile text, Stained Glass poster rendered through an offscreen WebGL2 canvas. Phone layout (≤760px): caption moves to the bottom and shrinks, compact header (prev/next hidden), Loom arch tightened and legend hidden, Orrery words alternate rows, Stained Glass raised. README rewritten for Interiors. Checks: all seven pieces + gallery + `#maths` opened in sequence with the maths drawer toggled, zero console errors; `prepare-hosting.sh` into a fresh scratch directory packaged `maths-art/` with all seven pieces (`dist/` untouched, nothing deployed).
- **K — 26 Oct 2026.** Old instruments removed from `#maths`. Each of the seven topics keeps its prose (body, why it matters, inside an LLM, formula) beside a live poster of its artwork that opens `#maths/play/<id>`; the poster sticks beside the copy on desktop and sits below it on phones. Prose moved into `maths.js`; `maths/00-journey.js` and `maths/01–07` (flat diagrams, Abstract worlds, journey shell, challenges) deleted with their CSS (~840 lines). `Interiors.posters(root)` exported; posters now only redraw while on screen. Hero, outro and the gallery's back-link copy updated. Verified in Chrome at phone width and in a 1300px iframe: 7 topics, 7 live posters, no old controls, link in and back (focus returns to the artwork), zero console errors. The user's iPhone loaded the site over the LAN (192.168.2.7 in the server log).

- **L — 27 Oct 2026.** User feedback: the maths page was too crowded and had lost its focus on the maths; Stained Glass didn't land. (1) The "Goal:" line is gone from every topic; the "In a language model" box stays for the user to rewrite. (2) Every piece now carries `maths` and `eq` fields. The topic heading, gallery tile, full-screen title, directory card and document title all lead with the maths ("Rotary position embedding", with its equation), and the artwork name becomes the label ("05 / Orrery"). On `#maths` the old editorial heading becomes a one-line dek, and the formula moved up under it. (3) *Kaleidoscope* (`02-kaleidoscope.js`) replaces *Stained Glass*: each ReLU neuron is a folding mirror, x′ = x + 2·ReLU(−z)·n; paint once and the stroke repeats in every linear region; layers 1–8, ReLU off collapses to one region, drag a crease to move a neuron. Mirrors are picked greedily for visible regions (8 layers → ~120 regions in view vs ≤37 for one layer of 8). Verified in Chrome at desktop size and in 375px iframes: all seven pieces, gallery and `#maths` with zero console errors; paint, layers, linear toggle, crease hover and drag all work.

- **M — 27 Oct 2026.** User feedback: drop the hero's Step inside / find-an-experience links and the experience directory (done; `experiences.js` now only supplies the purpose badges used by the topics and lab pages). "Where each idea lives" re-imagined as a transit map of a transformer (`maths-map.js`, `maths-map.css`). The main line is the residual stream; the attention branch (Q·K·V → RoPE on q, k only → softmax → W_O) and the feed-forward branch (W_in → ReLU/GELU → W_out) leave it and rejoin at ⊕, inside a block frame stacked ×32. Then come the probe (07) and Unembed, ending at an illustrative next-token distribution; the gradient-descent loop runs underneath. Each idea is a station in its piece's accent; all six matrix multiplications are squares. A token rides the line with a narrating card, the layer counter runs to 32, and the prompt advances one predicted token at a time. Training step mode shows the loss, and the gradient rides back, turning each matrix amber. Hover, tap or keyboard (or the legend) pins an idea: every station it lives at lights up, and the card shows that piece's live poster with links to the topic and the artwork. Wide (horizontal) and phone (vertical) layouts; pause button; reduced motion starts paused; animation runs only while on screen. Verified in Chrome at 1242px and in 375px iframes with zero console errors.

- **N — 27 Oct 2026.** User feedback: each topic's text read as disjointed (body paragraphs plus a separate "In a language model" box). Each of the seven topics now has one three-paragraph narrative (about 220–280 words): the maths, then what its artwork shows, then where it sits in a language model and what the example does not establish. The `llm` fields, the box markup and its CSS are gone. All references to the old instruments (point clouds, "the values are the keys themselves", "shown here", "Here, two clusters…") are replaced by descriptions of the Interiors artworks. The accuracy corrections from `human-idiom.md` §7 are kept: rank vs determinant, LoRA as a low-rank update, GELU/SwiGLU described rather than oversold, training vs inference, dot products depending on length, prompt vs cached-decoding cost, RoPE's distance dependence qualified for fixed content, superposition as a hypothesis, ablation vs steering.

- **O — 27 Oct 2026.** Duplication pass on the seven narratives. The text no longer restates the formula box (det = ad − bc, θ ← θ − η∇L(θ), max(0, z), spread ≈ 1/√d, x′ = x − α(x·r̂)r̂) or the artwork caption ("folds the plane like a mirror"), and wordy connectives are cut. Every fact and qualification is kept. 1,445 → 1,149 words (20% shorter; per topic 151–188). On a 1242px window the text is now about 1.8–2× the height of the pinned artwork.

- **P — 28 Oct 2026.** The seven-tile Interiors gallery moved to the home page, between the hero and Recent experiments (`#interiors`). The section has a home-style heading ("The maths of AI" / "Interiors") instead of a second "Inside the room", then the gallery's introduction, wall of live posters, note and a link to the maths page. `Interiors.showcase()` provides that markup to both places. `#maths/play` now redirects to `#interiors`. The pieces' ← Interiors link and Esc return there, focusing the tile you left; the maths page's "All seven Interiors" link points there too. Home posters are wired and disposed in `app.js` like the maths page's.

## 4. Known limits and polish backlog

- **Some artwork prompts state conclusions more strongly than the topic text** (e.g. Lattice: "No later layer can separate them again"; Orrery: "The score depends only on how far apart the words are"; Nullspace: "everything perpendicular to it is untouched"). `human-idiom.md` §7 asks for these qualifications; worth a pass so the artworks match the topics.

- **Not yet seen on real devices.** Verified in desktop Chrome (1117×613 viewport) and 360px-wide iframes only. iPad Safari touch, WebGL2 availability (Safari 15+ has it; Stained Glass falls back to a lower-resolution CPU renderer otherwise) and frame rate on the iPad need the user's review.
- **Prompts are sequential.** A discovery done out of order (e.g. pressing *Collapse* before hovering a word in Lattice) doesn't count until its turn comes round; the coda line still appears at the end. Could be made order-independent.
- **Sound** is a deliberately minimal drone + tones per piece; richer generative audio is a possible enhancement.
- **Crowded Sky ghosts** depend on which stars the viewer lights; neighbours on screen are not always neighbours on the sphere. A "light the closest three" helper could make the discovery more reliable.
- **Posters** animate continuously while visible (off-screen ones are skipped since K); a lower frame rate on low-power devices is still an option.
