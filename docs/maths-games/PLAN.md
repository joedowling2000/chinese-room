# The Field Instruments — implementation and validation plan

Version 1 · 25 October 2026. Status: core local review candidate implemented; physical-device and unaided-player acceptance pending. See the live checkpoint below.

Read with [DESIGN.md](DESIGN.md) and [RESEARCH.md](RESEARCH.md). This plan concerns the seven maths games and does not replace the repository's broader [interactive-site plan](../../PLAN.md).

## Live implementation checkpoint

Updated: 25 October 2026. This section is the resume point if the session ends.

- **Current task:** checkpoint 8 implementation and targeted local verification complete; proceed to device/player acceptance.
- **Completed:** the preceding agent's seven game modules and fixtures were audited against `RESEARCH.md`, `DESIGN.md`, and this plan. Core runtime gaps have been filled: bounded replay/pause, inspectable trial records, per-update optimiser rewind, explicit non-drag controls, assisted-completion provenance, saved-solution restoration, save validation, reference links, and responsive/focus fixes.
- **Next exact action:** user review at `#maths/play` on the physical iPad, starting with Basis Foundry, Phase Observatory, and Superposition Array. Desktop Safari automation can resume after the user enables “Allow remote automation” in Safari's Developer settings.
- **Verification still pending:** actual iPad/Safari, screen-reader review, measured device performance, and unaided-player learning/enjoyment gates. Safari session creation was attempted and blocked by its existing automation setting; no system setting was changed. Desktop emulation and successful witness entry do not establish these acceptance results.
- **Checkpoint policy:** the user has authorised local commits. Preserve the earlier agent's work in the checkpoint alongside the audited implementation. Commit each substantive completed milestone with this plan updated in the same commit; record verification, blockers, and the next exact action before ending a session. Do not push or deploy without separate authorisation.
- **Verification policy:** no permanent automated test suite or dependency was added; checks used direct numerical calculations, syntax checks, and temporary browser-review scripts.

| Workstream | Status |
| --- | --- |
| M0 fixtures | All 21 initial states fail and all 21 witness solutions pass; mathematical properties and alternative solutions checked |
| M1 Basis Foundry + shared runtime | Core implementation and desktop interaction checks complete; unaided touch/transfer acceptance pending |
| M2 Phase / Superposition | Both three-chamber sequences implemented and numerically/browser checked; player understanding gates pending |
| M3 other four games | All implemented; actual optimiser history/rewind and inspectable probe data now included |
| M4 presentation / 21 core chambers | SVG/DOM presentation, hints, explanations, saved miniatures, and trial replay implemented; visual/educational acceptance remains a user-review gate |
| M5 verification | Chromium, responsive layouts, input/state/lifecycle checks, numerical checks, and actual fresh-output packaging review completed as detailed below; Safari automation blocked by permission setting; physical-device/accessibility/playtest matrix remains open |
| M6 local review | Source served on port 8000 bound to all interfaces; local review candidate, not an accepted release |

### Incremental build log

- **Checkpoint 8 — local build completion:** continued from checkpoint commit `2da9be0`. Restored Contour's draggable next-update handle after stepping while keeping old replay frames read-only. Trial pulses now follow the selected probe, with explicit timeline resets; phase inspection has a static selected-clock marker. Added native labelled numerical readouts, complete workload lists, optional exact values, inspection before Run without awarding completion, and focus handling for hidden/rebuilt controls. Fixed an inspection-panel crash when an open Exact panel disappeared after editing/reset, and preserved Previous/Next and summary focus. Nullspace's final replay now depicts the independent nuisance/useful probes used by its completion contract, not unrelated mixed samples. Added and tested a non-destructive fresh-output mode to the actual packaging script. Mathematical scoring rules and the 21 witness configurations are unchanged.

### Checkpoint 8 evidence and blockers

- **Interaction:** reproduced the missing Contour handle after one update; the fix permits rate dragging without changing position or update count. Older replay frames have no mutable handle. Verified replay/restart after an aged page, one pulse per selected probe, and static pause. The proposed stale-SVG-clock failure was not reproduced in Chromium; explicit resets make the intended timing deterministic rather than constitute evidence of that hypothesised bug.
- **Inspection/accessibility:** native Input/Output/Target and update/velocity readouts use the captured state, with exact data available separately. Pre-Run probe selection does not record completion. Exact/workload panels preserve their open state when applicable and tolerate disappearing after edits. Previous/Next retain button focus; summary focus survives redraws. A real Tab/Enter path completed Basis Foundry's order chamber, with focus moving to Next after Run became hidden. Phone/tablet expanded-panel checks recorded no horizontal overflow. This does not certify all-game Tab order or screen-reader usability.
- **Mathematical presentation:** directly checked the new intermediate matrix outputs for both operation orders, shared representation sums and decoder dot products for the dense workload, removed projection components, and the independent N/S projection outputs. These checks cover added presentation fields, not new scoring rules.
- **Packaging:** `scripts/prepare-hosting.sh [NEW_OUTPUT_DIRECTORY]` was executed into a fresh directory and the resulting site smoke-tested. Existing destinations, symlinks, empty arguments, and excess arguments were rejected; an existing sentinel was preserved. Latest review artifact: `/tmp/field-instruments-build.0MsPwG/site`. Changed packaged files matched source; the staged Phase chamber completed successfully. Temporary staging servers were stopped. The original no-argument `dist/` rebuild remains unchanged and was not executed.
- **Checks:** changed JavaScript syntax, shell syntax, and whitespace checks passed; the final targeted browser regression checks recorded no page errors. Previous 21-chamber results remain the baseline; no new permanent suite or dependency was added.
- **Safari blocker:** installed `safaridriver` reports Safari 27.0.1, but session creation requires “Allow remote automation” in Safari's Developer settings. The user was informed; no permission/configuration change was made. Safari, physical iPad, screen-reader, device-performance, and unaided-player tasks remain open.
- **Runtime:** source remains served on port 8000, bound to all interfaces. Use the links below; re-check the server and LAN address after a new session. Temporary artifacts and servers are not durable checkpoint storage.

### Earlier checkpoints

- **Checkpoint 7 — durable session handoff:** checkpoint the preceding agent's research/design/implementation and this session's audited runtime improvements together, so the working collection and its acceptance status can be recovered from Git. The latest syntax/whitespace checks passed and both `/` and `/maths-games/host.js` returned HTTP 200 on the local server. Resume from the current task and next action above; local server processes and temporary staging/screenshots may not survive session termination. If needed, restart from the repository root with `python3 -m http.server 8000 --bind 0.0.0.0`, checking that the port is free first. No push or public deployment is authorised.

- **Checkpoint 6 — design-to-code audit and local completion:** preserved the preceding agent's implementation and filled the core gaps identified above. Rechecked all 21 numerical witnesses, initial failures, alternative constructions, and key mathematical properties. Added immutable trial inspection with bounded replay, pause on explanation/blur/visibility, reduced-motion support, last-probe feedback, per-update Contour snapshots and rewind, native range steppers, accessible measurement/configuration views, assisted-hint labels, validated saved completions, and undoable solution restoration. Fixed replay timer ownership, focus after redraw, tool-rail scrolling, phone controls, frozen drag framing, and a valid divergent optimiser state rejected by the former save bounds. Old Contour records lacking snapshots are retained in a separate local backup rather than inventing historical velocities. Added primary references and game search results. All work remains uncommitted.

- **Checkpoint 5:** all 21 chambers passed browser play-throughs; console error log was empty. Added direct rail-anchor dragging, code-card cycling, hinge wiring changes, optimiser rate dragging, and signal-path trial animations. Basis handle dragging reached a real solution in a tablet-sized viewport. Undo, keyboard range editing, persistence after reload, explanations, and direct code-card selection passed. Tablet portrait/landscape layouts reviewed in Chrome emulation; this is not physical iPad/Safari verification. Remaining: new drag-control smoke checks, packaging, progress reset, final status update.

- **Checkpoint 4:** all 21 initial states fail and all 21 witness solutions pass the actual model evaluations. Witnesses recorded in [FIXTURES.md](FIXTURES.md). Browser play-throughs passed Basis Foundry, Phase Observatory, Superposition Array, and Query Loom (12 chambers). Fixed primary-button hover contrast and constrained the desktop stage/tool rail to the viewport. Remaining browser checks: Hinge, Contour, Nullspace, persistence/undo, tablet layouts, static packaging.

- **Checkpoint 3:** all seven instrument modules and 21 concrete core chambers are now written. Query/value separation, partial projection tradeoffs, actual gradient updates with velocity history, and affine/ReLU routing are implemented. Next: verify numerical witnesses for every chamber, run browser play-throughs, and resolve state/layout defects before local handoff.

- **Checkpoint 2:** Basis Foundry passed browser witness solutions for all three chambers; a wrong operation order was rejected and the collapse was correctly diagnosed. No console errors. Phase Observatory and Superposition Array now have three concrete chambers each in source; their browser review is next. Physical iPad / unaided review remains pending.

- **Checkpoint 1:** shared host, stylesheet, three Basis Foundry chambers, new routes, and static packaging integration written. Mathematical state is separate from rendering; preview/run/undo and saved progress are implemented. Browser verification still pending.

- **Checkpoint 0:** build authorised; route and packaging inspection complete. Implementation will use direct mathematical manipulation and native HTML controls, with SVG stages for crisp geometry on touch screens.

### Checkpoint 6 verification and remaining acceptance

- **Mathematics:** all 21 witness configurations and initial failures were checked directly against the current models. Additional checks cover matrix order/rank loss and an alternative shear construction; affine classification failure and an alternative hinge solution; softmax normalisation and a second query/temperature combination; phase aliases/common-shift invariance; tetrahedral Gram entries, sparse recovery and dense failure; projection preservation/removal boundaries; and exact optimiser position/velocity recurrences plus rewind. A reachable divergent Contour state at rate `0.19`, momentum `0.8`, update 13 now survives save validation and rewind; inconsistent saved paths are rejected.
- **Browser:** all 21 witness paths completed through native DOM controls in Chromium, followed by a separate keyboard-operated pass using arrows/typeahead and Enter/Space with automation-managed focus. This is not evidence of unaided play or an exhaustive assistive-technology/focus-order audit. Drag interaction and cancellation were spot-checked; physical touch-only completion of the collection remains pending.
- **Runtime regressions:** checked rapid replay/pause, static probe selection after pausing, final-step feedback, explanation pause, reduced motion, replay without state mutation, rewind within a four-update batch, reload persistence, pending-preview reset/restore, assisted reset/provenance, progress reset/undo, malformed or unavailable storage, route changes, game search, and retained topic diagrams. No browser console errors were recorded during these checks.
- **Layouts:** reviewed Chromium at 1440×900, 1180×820, 820×1180, and 390×844. Expanded measurements remain scrollable with the tool footer reachable; phone controls use a single column and labelled 44px step buttons. These are emulated layouts, not iPadOS/Safari evidence.
- **Packaging:** shell syntax checked and the same runtime/assets copied into a fresh temporary staging directory, with referenced assets returning HTTP 200. `dist/` was not replaced, and the destructive `prepare-hosting.sh` rebuild was not executed. No deployment occurred.
- **Source checks:** JavaScript syntax checks and `git diff --check` passed. No package installation or permanent test harness was introduced.
- **Local review:** `http://localhost:8000/#maths/play`; LAN address observed for this handoff: `http://192.168.1.144:8000/#maths/play`. Re-check the LAN address and server each new session.

The implementation uses the plan's permitted SVG/DOM overview approach rather than a new 3D engine. Matrix order and circuit wiring use bounded native actions/selectors; higher-dimensional codes use a finite candidate bank. The exact chamber data and predicates in the modules/fixtures supersede illustrative tuning numbers in the original design (for example, quarter-unit basis controls and the normalised hinge separator). Architectural materials, spatial gestures beyond these controls, and overall visual/learning quality remain review decisions, not claims established by numerical completion.

**Open acceptance tasks — do not mark complete without evidence:**

1. Physical iPad on the LAN: record model, iPadOS/Safari version, orientation and display size; complete the core games using actual touch, review audio and lifecycle, and measure the busiest scene's input/frame behaviour.
2. Actual desktop Safari and screen-reader review, including focus order and non-visual use of measurements. Safari automation is currently blocked until the user enables “Allow remote automation”; do not change that setting without authorisation.
3. Unaided player observations for the M1/M2 gates and all seven transfer tasks: first useful action, first success, misunderstanding/failure recovery, prediction, and willingness to retry. Timing and enjoyment targets remain unmeasured.
4. Review the seven visual treatments and educational explanations with the user; revise any mechanic that only rewards following hints or copying settings.
5. After acceptance, decide whether to retire the retained legacy Abstract rendering/control code. Flat diagrams must remain; do not remove unrelated prior work before that decision.

The seven harder chambers, sandboxes, generated variants, solution export, and richer sound remain explicitly deferred under “Later additions”; they are not unfinished core release work.

## 1. Deliverable and scope

Deliver seven distinct playable mathematical games inside the existing static Chinese Room site, with three authored core chambers each, accessible controls, meaningful feedback, and explanations grounded in the player's actual solution.

The original design phase produced the three companion Markdown documents only. Implementation was subsequently authorised, as recorded in the incremental log. Earlier application changes remain preserved; public deployment remains a separate task.

### Core release

- Seven playable instruments covering the existing seven topics.
- Twenty-one core chambers, each with a known valid solution and a distinct teaching purpose.
- Stable overview cameras, direct manipulation, keyboard/touch alternatives, Undo, Reset, Run, and Step where appropriate.
- Persistent local chamber progress and resumable committed configurations.
- Optional mathematical overlays and a connection to the relevant AI concept.
- Reduced-motion and silent play with the same completion rules.
- Compatibility with the current hash routes, static hosting, and research links.

### Later additions

The seven optional harder chambers, full sandboxes, generated variants, solution export, and richer sound design follow only after core play passes review. They are not prerequisites for a useful release. Multiplayer, leaderboards, model inference, accounts, infinite worlds, a general neural-network editor, and a procedural level generator are outside this plan.

## 2. Build strategy and decision gates

Build Basis Foundry as the first complete vertical slice. In the next milestone, establish that Phase Observatory and Superposition Array are games worth producing before investing in the other polished worlds. These are sequential work packages; the plan does not assume additional developers or parallel agents.

A milestone ends with a concrete playable result and a recorded observation, not a feature checklist alone. Failure at a gate means revise the mechanic or level, not add more lighting and explanatory text.

| Milestone | Output | Dependency | Exit condition |
| --- | --- | --- | --- |
| M0 — Mathematical fixtures | Explicit inputs, constraints, solutions, counterexamples, and tolerances | This design | Every first chamber is feasible; ambiguous claims are resolved |
| M1 — Basis Foundry slice | Three simple chambers, complete input/undo/result loop, one polished scene | Basis fixtures | Unaided touch play demonstrates global transforms and order |
| M2 — Risk prototypes | Simple Phase Observatory and Superposition Array sequences | Shared shell and respective fixtures | Relative phase and sparse capacity generate meaningful decisions |
| M3 — Remaining mechanics | Hinge Engine, Contour Pilot, Query Loom, Nullspace with plain geometry | Their fixtures; M1 shell | All seven core loops work without art or long explanations |
| M4 — Content and atmosphere | Twenty-one reviewed chambers, site-integrated art, optional audio, explanatory replays | M2/M3 accepted mechanics | Distinct games share a coherent visual language and feedback quality |
| M5 — Device and integration pass | iPad, desktop, accessibility, routing, lifecycle, persistence review | Complete core content | All core chambers can be completed with each supported input mode |
| M6 — Local review candidate | Documented local build and issue list, staging artefact if needed | M5 | User can review the complete collection; deployment is a separate task |

Do not assign a fixed calendar deadline before M1/M2. The main unknown is level-design quality, not how quickly seven canvases can be drawn. Estimate remaining work after those gates using the time spent revising an actual chamber.

## 3. M0 — Establish solvable mathematical fixtures

Create a concise fixture sheet for every core chamber before building its presentation. Each sheet includes:

- Initial state, input set, allowed operations, parameter bounds, and snapping rules.
- Exact predicate for success, with numerical tolerance and any resource budget.
- One witness solution; a second if multiple solution families are intended.
- At least one informative failure and the observation it should produce.
- What the player must infer; what the screen reveals; what stays optional.
- Reset state and undo semantics.
- Known simplifications and the explanation that prevents a misconception.

The design already checks examples for matrix order, XOR separation, a quadratic optimiser, an attention mixture, phase aliases, tetrahedral codes, and a projection tradeoff. These are seeds for authored levels, not a claim that all 21 final chambers are validated.

| Game | Fixture work before scene production | Numerical/property checks |
| --- | --- | --- |
| Basis Foundry | Define three matched constellations, allowed matrix plates, and a deliberate rank-loss trap | Operational multiplication order; same map applied to all samples; coincident inputs remain coincident under any later map |
| Hinge Engine | Choose margins and controls that make the four-corner circuit reachable; define lost-sign samples | ReLU clamps rather than reflects; affine-only classifier cannot solve the alternating corners; each sample keeps its identity |
| Contour Pilot | Specify bowl, ravine, non-convex surface, starts, rates, update budgets, and instability bounds | Analytic gradients; correct velocity restoration; success uses loss and stability, not a camera position |
| Query Loom | Specify keys, distinct values, query bounds, temperatures, and witness queries for all targets | Stable softmax; non-negative weights summing to one; output equals weighted value sum; finite tolerance targets are reachable |
| Phase Observatory | Specify positions, frequencies, required signed phases, and bounded search ranges | Common-shift invariance; wraparound distance; scalar cosine ambiguity; no accidental alias within the required range |
| Superposition Array | Build finite direction banks and explicit sparse/dense workloads | Normalised vectors; all named activity patterns evaluated; Gram-matrix and decoder values agree; no hidden resampling |
| Nullspace | Specify clean/nuisance probes, normals, strengths, and feasible preservation constraints | Idempotence at full projection; orthogonal components preserved; mixed-signal tradeoff feasible; zero-length normal rejected |

Use direct numerical calculations and manual fixture review under the repository's existing verification policy. This design task does not add an automated test suite. If implementation later adopts one, target these mathematical invariants and lifecycle behaviours rather than duplicating rendering code in assertions.

## 4. M1 — Basis Foundry as the first vertical slice

### Implementation sequence

1. Create a minimal game host with a stage, one-line objective, tool rail, and result area.
2. Render source vectors, matrix columns, fixed receivers, and output ghosts in simple 2D geometry.
3. Implement select/move/reorder commands and a single authoritative transform calculation.
4. Implement preview versus committed edits, Undo, Reset, Run, and stepped playback.
5. Finish the three Basis Foundry fixtures, including rank-loss feedback.
6. Add keyboard operation and touch step controls before atmospheric work.
7. Add one polished suspended-press visual treatment, using the same model state.
8. Review on the actual iPad over the local network and a desktop browser.

### Review questions

Can a new player identify an editable object without a spoken instruction? Does moving a basis handle visibly move all affected points? Does the order chamber require reasoning? Does failure reveal which endpoint is wrong? Does the completed machine give a satisfying payoff?

Record observed actions, not just whether the tester says the game is “nice.” Capture time to first useful input, first valid solution, repeated unexplained actions, requests for hints, and the player's description of the rule.

### Go / revise criteria

Target an initial informal sample of three to five people if available; this is directional feedback, not a statistically powered study. A useful initial criterion is that at least four of five can finish the first chamber unaided and predict a new point's movement. If only the user is available, report the smaller evidence base rather than treating one review as validation.

Revise before continuing if players manipulate controls without tracking outputs, cannot see why a trial failed, or believe receivers move with the lattice. Those failures concern the mechanic or representation.

## 5. M2 — Prototype the two greatest design risks

### Phase Observatory

Build only the indexed rail, two anchors, two coupled rings, and the target signature. Complete the single-clock, alias, and moving-origin puzzles using plain geometry.

The decisive observation is whether the player understands why moving both anchors preserves the relation. If they treat two clocks as unrelated visual combination locks, reinforce the visible difference between absolute and relative phases. If this still fails, simplify the interface to two token cards and an explicit difference instrument before adding any architectural scene.

### Superposition Array

Build direction cards, coordinate bars, a Gram matrix, and a deterministic decoder. Begin with the tetrahedral fixture from the design. Expose the input workload and replay the exact input that fails.

The decisive observation is whether players connect failure to interfering codes and simultaneous activity. If they simply buy every dimension, make the resource limit and alternative code assignments meaningful. If the three-dimensional display conceals the rule, make the coordinate and interference views the primary board. Do not replace it with an impressive but unexplained star field.

Both prototypes must work on touch and with animation stopped. They do not need production art to pass this gate.

## 6. M3 — Implement the remaining mechanics

Recommended order: Query Loom, Nullspace, Contour Pilot, then Hinge Engine. Query Loom and Nullspace exercise direct vector controls; Contour Pilot exercises update history; Hinge Engine exercises the small circuit representation.

| Work package | Concrete implementation tasks | Completion evidence |
| --- | --- | --- |
| Query Loom | Query disk and step controls; separate keys/values; normalised weights; contribution construction; target evaluation; value permutation | The mixture fixture is solved through at least two different input paths; a single-source tactic visibly fails the mixture chamber |
| Nullspace | Plane normal controls; partial/full projection; retained/removed geometry; independent probes; dual tolerances | Correct oblique normal works; wrong normal damages the useful component; partial strength solves the compromise |
| Contour Pilot | Surface/gradient functions; discrete optimiser; update budget; trajectory; batched stepping; rewind snapshots; divergence handling | Checked ravine trajectories reproduced; pause/resume leaves state unchanged; rewind restores velocity and budget |
| Hinge Engine | Affine plates; two ReLU branches; connection constraints; stable sample IDs; separator margin; coincident-point inspection | Alternating corners solved; affine-only attempts fail for the stated reason; deleted sign cannot reappear without the extra branch |

Only generalise a new shared component after it is needed by at least two games. A universal circuit editor or universal physics engine would enlarge the project without proving better play.

## 7. Proposed runtime structure

Retain static hosting and native JavaScript. Start with Canvas 2D for the stage, SVG where useful for crisp handles/diagrams, and native HTML controls. Most mathematical stages are two-dimensional or modest projected geometry, so a full 3D engine is not a prerequisite. Revisit rendering only if a polished slice on the actual iPad exposes a concrete limitation.

Keep mathematical calculations independent of camera, frame rate, and DOM elements. The existing scenes often read control values directly; the new games should instead render controls from model state.

```text
maths-games/
  core/
    host.js              mount, resize, focus, close, visibility
    commands.js          edit, commit, undo, reset
    playback.js          deterministic trial playback and stepping
    geometry.js          small shared vector/matrix operations
    rendering.js         projection, picking, restrained visual primitives
    persistence.js       versioned local save / graceful fallback
    accessibility.js     selected-object descriptions and announcements
  games/
    basis-foundry.js
    hinge-engine.js
    contour-pilot.js
    query-loom.js
    phase-observatory.js
    superposition-array.js
    nullspace.js
  levels/
    <one authored data module per game>
  field-instruments.css
```

This is a proposed directory, not files created by this planning task. Use native modules for the isolated runtime if they fit the existing load order; preserve the public `Maths.page()`, `Maths.wire()`, and topic metadata interface during integration. The exact boundary should be settled in M1, not hidden behind a premature rewrite of routing.

### Game contract

Each game provides initial state, allowed commands, derived measurements, preview/result evaluation, rendering, and a textual description of the selected object. The host supplies event ownership, viewport dimensions, preferences, storage, and lifecycle callbacks.

```text
level definition → initial model state
input → preview command → visible derived result
commit → history snapshot → model state
run → evaluate all required inputs → trial record → result presentation
undo/reset → restored model state → same derived result
```

A trial record contains inputs, intermediate states, outputs, failure reasons, metrics, and completion status. It is the source for animation, step mode, explanatory replay, and accessible summaries. Displayed rounded values never feed back into scoring.

### State semantics

- Drag preview is reversible; release commits one history entry. A cancelled pointer restores the previous committed state.
- A discrete stepper press commits one action. Holding a control may repeat bounded changes, but never leak to another game.
- Run evaluates the current configuration. Animation presents the result; it does not decide whether the puzzle was solved.
- In Contour Pilot, each update is an actual solver state with position, velocity, rate, momentum, and update index.
- Reset returns to the chamber's documented initial state. Retry restores the same inputs/seed. New variant is a separate future action.
- Completion records the successful configuration and metrics. Later experimentation does not erase it.
- Opening an explanation pauses playback; closing it resumes only on an explicit user action.
- Navigation, exit, blur, and pointer cancellation release held input. Leaving the game disposes its timers, animation frames, listeners, and sound nodes.

### Saves and migration

Store only small, versioned objects: preferences, completed chamber IDs, successful configurations, and the latest committed state. Validate game/level versions and parameter bounds on load. If storage is unavailable or a version changes, fall back gracefully to a fresh chamber while preserving any compatible completion records. Never require storage access to play.

No network analytics are proposed. For review, collect timings and observations in a local developer log or manual notes without transmitting user activity.

## 8. Integration with the current repository

| Existing file/interface | Proposed responsibility |
| --- | --- |
| `app.js` routing and `Maths` calls | Preserve maths topic links and clean teardown; connect new game entry points |
| `maths.js` | Retain page content/registration boundary initially; replace Abstract launch path with game host |
| `maths/01-…07-*.js` | Preserve useful flat diagrams and explanatory copy; retire old Abstract controls after new games pass review |
| `maths/00-journey.js` | Migrate useful identity metadata; retire the old guide/challenge sequencing for the game path |
| `field.css` | Keep site tokens and shell; move game-specific styling into a bounded stylesheet |
| `index.html` | Load the new runtime/styles without duplicate mounts or hidden background loops |
| `scripts/prepare-hosting.sh` | Explicitly copy the new runtime, level data, and styles; its current `maths/*.js` copy does not cover a new directory |
| `README.md` | Document controls, routes, local review, device expectations, and limitations after implementation |

During development, use an explicit preview entry for the new host, with old diagrams accessible. Do not make preview selection alter the mathematics. On acceptance, route the existing “Step inside” action into the corresponding new game; preserve the subject IDs `linear-maps`, `folding`, `gradient-descent`, `attention`, `rotary`, `dimensions`, and `ablation`.

Keep rollback straightforward by preserving the preceding implementation in version control, not by loading both full game systems on the page. Do not overwrite unrelated working-tree changes. Remove obsolete listeners and CSS only after the new route is verified.

## 9. M4 — Content, art, and educational review

Author exactly three core chambers per game before adding optional content. Every chamber must introduce a new consequence or constraint. Repeating a solved tactic with more points is not sufficient progression.

For each chamber, produce the following review package:

| Asset | Requirement |
| --- | --- |
| Objective | One short sentence naming the outcome |
| Initial arrangement | Essential objects visible at entry; useful first action available |
| Failure presentation | Specific input or constraint explains the miss |
| Completion cycle | The solved mathematical machine visibly operates |
| Discovery sentence | Names the relationship the player just used |
| Explanation overlay | Replays that player's actual state with quantities/equations |
| AI connection | Accurate scope and primary reference; synthetic data labelled |
| Hints | Relationship hint, partial action, optional full solution |

Apply the Field palette and material language only after the mechanism reads in simple geometry. Produce seven distinct silhouettes and movements. Compare screenshots at common desktop, iPad landscape, iPad portrait, and narrow-phone sizes. Keep handles and essential paths visible with glow, parallax, and sound disabled.

Check particularly for these teaching errors: ReLU described as reflection; attention described as selecting a word; phase alignment described as guaranteed unlimited context; near-orthogonality described as zero interference; or projection described as selective deletion without collateral effects. The source notes in the research document anchor that review.

## 10. M5 — Verification and playtest matrix

### Functional browser review

Complete every core chamber using pointer/touch-style controls and again using keyboard controls. Verify alternative valid configurations where the puzzle permits them. Inspect console errors, visual clipping, state persistence, and teardown. Follow the repository's current browser-review approach; no automated test suite is introduced by this document.

| Area | Required cases |
| --- | --- |
| Input | Touch drag; tap/step alternative; keyboard-only selection and edit; pointer cancellation; rapid repeated input; reaching parameter bounds |
| State | Undo after edit; undo after trial; restart mid-playback; leave/re-enter; saved-state reload; invalid saved value; completed puzzle edited again |
| Mathematical output | Witness solution accepted; deliberate counterexample rejected; boundary tolerances; scale/orientation change leaves scoring unchanged |
| Rendering | No off-screen required object; no blank view after valid input; density/glow reductions preserve legibility; portrait/landscape resize preserves state |
| Lifecycle | Tab background/foreground; close game during playback; switch games; browser back/forward; no continued hidden simulation/audio |
| Accessibility | Visible focus; labelled controls; equivalent non-drag actions; meaningful announcements; reduced motion; muted audio; shape alternatives to colour |
| Site integration | Existing topic routes, article links, search results, flat diagrams, and page scroll/focus restoration |
| Packaging | Local source and prepared hosting output both contain all imported modules, level files, and styles |

### Physical device review

The user's iPad on the same network is a required review target, because desktop emulation does not establish Safari touch, audio, or thermal behaviour. Record model, iPadOS/Safari version, orientation, and display size during that review. Also review one desktop Chrome session and Safari where available. Use phone-size layouts for responsiveness even if phone is a secondary gameplay target.

The local server must bind to an interface reachable over the LAN; provide the Mac's current IP, not `localhost`, to the iPad. Re-check that address each session rather than hard-coding the previously observed `192.168.1.144` into the app. Public deployment is not needed for this review.

### Performance budgets to validate

Aim for visible control acknowledgement within 100 ms, smooth 60 fps on capable devices, and stable 30 fps on the review iPad's lower-quality setting. Record actual frame and input behaviour during the busiest chamber; these are targets rather than claimed measurements.

Bound pixel density, particle counts, paths, trial length, and input-set size. Keep one active render loop. Prefer cached geometry and event-driven redraw when the state is still. Decorative complexity is the first thing to reduce; the number of required test samples must not silently change with device quality.

### Learning and enjoyment review

Observe the transfer task specified for each game. Ask the tester to predict one consequence before trying it, then let them experiment. Record whether the game exposes the reason for failure without facilitator explanation and whether the player chooses to try another solution.

A game fails the design gate if its solution is merely setting every control to maximum, copying a displayed number, following a long instruction sequence, or pressing Run repeatedly without decisions. Fix the puzzle before polishing it.

## 11. Risks and planned responses

| Risk | Early signal | Response |
| --- | --- | --- |
| Seven reskinned parameter demos | Same actions and completion pattern across games | Review verbs and transfer tasks in M1–M3; require distinct decisions |
| Mathematical target is unreachable | A visually plausible level has no witness | Block art production until a bounded solution is recorded |
| Phase game becomes a dial matcher | Player cannot explain common-shift invariance | Make the rail and difference-hand central; simplify the scene |
| Packing game becomes “buy more dimensions” | Candidate assignment never affects outcomes | Tighten budget and expose workloads; use known sparse success/dense failure |
| Hidden-state or camera confusion | Repeated input with no understood consequence | Restore whole-board view; show preview and selected-object measurements |
| Pretty but illegible visuals | Only glow or motion differentiates states | Add solid geometry, labels, shape channels, and static traces |
| Over-scoped machinery | Time goes into editors and engines rather than chambers | Keep finite tools and authored levels; defer generalisation |
| Misleading AI analogy | Players infer the toy reproduces whole-model behaviour | Bind explanations to the demonstrated operation and name simplifications |
| iPad performance or input mismatch | Works on desktop, unusable by touch | Make physical-device review an M1 gate; cut decoration before interaction |
| Scope expands through optional modes | Sandboxes delay the core collection | Ship the 21 core chambers first; track extras separately |

## 12. Recommended next action

Review the local collection on the actual iPad, starting with Basis Foundry and the two risk prototypes, Phase Observatory and Superposition Array. Collect unaided observations and close the open acceptance tasks above before calling M1/M2/M4/M5 accepted.

The core implementation is available for that review. Further work should respond to observed difficulty, tolerance feel, legibility, input behaviour, and learning outcomes rather than expanding optional content or equating successful witness entry with enjoyable play.
