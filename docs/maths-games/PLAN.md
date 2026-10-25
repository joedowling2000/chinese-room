# Interiors — review, plan and progress

Version 2 · 25 October 2026. Read with [DESIGN.md](DESIGN.md). Supersedes the v1 "Field Instruments" plan (recoverable from git history at commit `9782810`).

## Live checkpoint (resume point)

- **Current task:** see the progress log at the bottom.
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
