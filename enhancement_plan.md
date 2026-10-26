# Interactive experiences: objectives, roadmap and handover

This is the continuation plan for the experience-learning work on `worktree/idiom`.
The detailed educational design is in [experience-learning-plan.md](experience-learning-plan.md).
The editorial accuracy rules remain in [human-idiom.md](human-idiom.md).


> **Update, 26 October 2026 — merged with Interiors.** The old maths instruments
> (flat diagrams, first-person worlds, `maths/*.js`) were replaced on `#maths` by the
> seven Interiors artworks (`maths-art/`, see `docs/maths-games/`). Kept from this
> work: the editorial text of all seven topics, the purpose badges, goals, sources and
> the nine-experience directory (`experiences.js`), and the lab labels. Removed: the
> teaching panels for linear maps, attention and gradient descent,
> `maths/learning-models.js` and `scripts/check-learning-models.cjs`, which only worked
> inside the old canvases. They remain in git history at `bdcba60` if the teaching
> layer is rebuilt on top of the artworks. The file tables below describe the
> pre-merge build.

## Objective

Turn the seven maths scenes and two lab examples into a connected learning environment.
After an interaction, a visitor should be able to answer:

1. What did I change?
2. What did the calculation do as a result?
3. How does that relate to inference, training, fine-tuning or a model intervention?

Keep the visual worlds, but connect their movement to explicit mathematical objects.
Camera movement, changed inputs, changed optimiser settings, parameter updates and
interventions must be distinguishable. Explain observed consequences using the same
calculations that drive the animation.

## Current stage and release boundary

**Stage: first teaching prototype release complete; linear-maps teaching upgrade implemented locally.**

The first release was paused to conserve credits. Work resumed on 25 October 2026
from `73d7d20`, shared by `origin/main` and `origin/worktree/idiom`. The next
increment extends the teaching panel to linear maps.

The current build includes:

- A nine-experience directory with purpose filters, labels, example types and
  educational outcomes.
- Purpose labels on all seven maths topics and both lab examples.
- A shared teaching panel for **linear maps**, **attention** and **gradient descent**.
- Guided lesson prompts and an Explore mode.
- Before/after values, explanations, action history, comparison markers and undo.
- Separate experiment and camera resets.
- Attention query controls, explicit Aim query / Look around modes, key selection,
  and a table linking scores, weights and value contributions.
- Gradient-descent preview and explicit single-step updates, a raw-loss history,
  and a prepared example showing a loss increase.
- Retryable understanding questions, without scores or completion gates.
- Shared numerical calculations with focused regression checks.

**Deliberately deferred:** continuous training playback. The stable release uses
explicit single steps; continuous playback needs a separate pass on pause,
interruption, undo and announcement behaviour. The prototype is not the complete
educational upgrade described in the original plan.

The other six experiences retain their existing interactions and have received
labels/outcomes only. Their deeper teaching upgrades, the connected trained model,
and validation with first-time learners remain outstanding.

## Classification and discovery

Use overlapping categories; attention and feed-forward operations are part of
both inference and the forward pass used during training.

| Experience | Purpose | Educational outcome |
| --- | --- | --- |
| Linear maps | Forward pass; relevant to training and adapters | Distinguish changing an input from changing a matrix; explain information loss |
| Activations | Forward pass; relevant to training | Trace a point through an affine transformation and an activation |
| Gradient descent | Training; relevant to fine-tuning | Explain how gradients, learning rate and momentum change parameters |
| Attention | Forward pass during inference and training | Trace query–key scores through softmax into a weighted output |
| Rotary positions | Forward pass; position configuration | Explain relative-position effects with content held fixed |
| High dimensions | Representations; interpretability | Distinguish random geometry from successful feature storage and recovery |
| Removing a direction | Intervention | Explain projection removal, steering and the limits of behavioural conclusions |
| Cube lab | Reversal algorithm; reported training results | Distinguish reversal, model prediction, search and aggregate results |
| Quantisation lab | Preparation for inference | Connect shared scales and rounding to outputs without inferring quality from storage |

Discovery filters are All, Using a model, Training and fine-tuning, and Inspecting
and changing a model. Keep the distinction between synthetic calculations,
outputs of a trained model and recorded experimental results visible.

Still to build: guided routes connecting the experiences:

1. **How a prediction is calculated:** matrices, activations, positions, attention,
   then the connected forward pass.
2. **How a model learns:** matrices, activations, gradient descent, then full
   training versus adapter tuning.
3. **What changes when we modify a model:** representations, ablation/steering,
   quantisation, then controlled output comparisons.

The order is educational; the model inspector must show the actual architectural
order rather than imply the route is a literal transformer pipeline.

## Shared enhancements still planned

- Expand responsive action feedback to all nine experiences.
- Orientation in each experience: goal, what the visitor controls, what stays
  fixed, what to watch and where the operation belongs in the model lifecycle.
- Predict → act → inspect → explain → try a new example in guided mode.
- One meaningful before/after comparison per completed action, including no-ops,
  boundary cases and unexpected results.
- Selectable objects linking visual marks, numerical values and formulas.
- Camera-only notices that do not replace the last mathematical explanation.
- Reproducible reset, undo and action history; include optimiser and random state
  where applicable.
- Optional comparison of controlled runs from the same starting state.
- Locally saved learning progress with reset; distinguish exploring an example
  from answering a check. Do not use Next clicks as evidence of understanding.
- Pause and single-step playback. If continuous playback returns, announce
  completed operations rather than every animation frame.
- Textual and diagram alternatives to first-person navigation.
- Tablet layouts that keep an actionable control and its consequence usable
  together, without overlapping essential buttons.
- Keyboard, touch, reduced-motion, non-colour and screen-reader access.
- Shareable/reproducible experiment state once state formats are stable.

## Remaining work by experience

### Linear maps

Implemented in the continuation build:

- Pinned input with x/y controls; scaled matrix-column contributions and their sum.
- Separate input-edit and matrix-edit modes, locking the other object's controls.
- One matrix applied to the pinned input and three reference inputs in a text table.
- Line-collapse and zero-matrix presets, plus a reproducible pair of colliding inputs.
- Guided prediction prompts, a retryable rule-change check, action history,
  before/after values, undo, experiment reset and separate camera reset.
- Diagram contribution path, pinned-output markers and before-state markers.
- Presets apply atomically so the numerical result and scene agree immediately.

Remaining:

- Add a frozen base plus low-rank update panel. Explain that adding an adapter does
  not delete the base model's other directions.
- Extend the prepared collision and rule-change check into an unaided collision-construction exercise.

### Activations

Current: purpose labels and outcome; existing folding scene.

Planned:

- Explicit Input → Affine transform → Activation → Output stops.
- Label intermediate animation frames as interpolation, not extra network layers.
- Pin a point and link its coordinates to the activation curve.
- Compare ReLU, leaky ReLU, GELU and tanh using the same inputs and affine map.
- Explain positive as well as negative inputs where the activation requires it.
- Compare two affine layers against layers separated by a non-linearity.
- Later link local derivatives to actual training updates.
- Transfer check: predict signs for a new input and distinguish changing the
  input from changing the layer.

### Gradient descent

Current prototype: single-step preview/apply, setting-versus-parameter feedback,
undo/reset, comparison markers, raw-loss history and an overshoot example.

Planned:

- Restore continuous playback only with correct atomic undo, pause, interruption
  and accessible announcement semantics.
- Compare learning rates and momentum from identical initial parameters and
  optimiser state.
- Select a historical step to inspect its position and calculation.
- Add deliberate examples of a small gradient and domain exit, without claiming
  a global minimum.
- Add a small supervised model: input, prediction, target, loss, gradients,
  updated parameters and new prediction.
- Compare training all weights with training an adapter from the same checkpoint.
- Keep the synthetic landscape separate unless it represents that exact model's
  objective.

### Attention

Current prototype: query direction/length, camera-only mode, score temperature,
key selection, actual score/contribution table, comparisons and a transfer check.
The example still uses **values equal to keys**.

Planned:

- Explicit Query → Scores → Weights → Contributions → Output stage inspection.
- Independent value vectors, demonstrating that changing values can change the
  output without changing attention weights.
- Direction-lock and length-lock investigations.
- A causal sequence view with future positions visibly masked.
- A later comparison of multiple heads.
- Connect the head output to an actual downstream residual update.
- Keep vocabulary sampling separate from attention temperature.
- Transfer check: change the output while holding attention weights fixed.

### Rotary positions

Current: purpose labels and outcome; existing torus/tunnel visualisation.

Planned:

- Independently positioned query and key with fixed content vectors.
- Inspect rotating coordinate pairs, relative phases and the calculated dot product.
- Compare moving both positions together against changing their separation.
- Change content at fixed separation to show that position is not the whole score.
- Show oscillating frequency effects; do not assume score decreases with distance.
- Compare frequency schedules, reserving context-quality claims for evaluation.
- Transfer check: identify which transformations preserve a fixed-content score.

### High dimensions

Current: purpose labels and outcome; sampled geometry only.

Planned:

- Link a selected star to its cosine, angle and histogram bin.
- State dimensionality, sample size and approximations; use controlled samples
  for comparison.
- Correct ambiguous angle/cosine units and distinguish the full sample from the
  displayed subset.
- Overlay before/after distributions with consistent axes.
- Add a separate synthetic feature-encoding/decoding bench with a stated decoder.
- Change direction overlap and active features; inspect reconstruction error.
- Later inspect genuine activations from the small trained model.
- Transfer check: find a recovery failure despite nearly orthogonal directions.

### Removing a direction

Current: purpose labels and outcome; existing projection scene.

Planned:

- Pin one activation and display its parallel component and perpendicular remainder.
- Separate projection removal, steering addition and restoration from stored data.
- Show two originals that collapse to the same remainder.
- Add a labelled synthetic downstream readout to demonstrate wider consequences.
- Compare candidate directions before discussing a causal interpretation.
- Explain activation editing separately from parameter editing and training.
- Add real refusal results only with source and sample scope preserved.
- Transfer check: demonstrate why one fixed added vector cannot restore all
  projected originals.

### Cube lab

Current: purpose labels and outcome; live scramble reversal and historical
aggregate results, with no trained model running.

Planned:

- Explain the distinction between encoding, prediction, search and execution.
- Pair each scramble move with its inverse and highlight the affected stickers.
- Explain camera changes separately from changes to cube state.
- Show a verified example where reversal is longer than another valid solution.
- Make selecting a historical result sample explicitly different from retraining.
- Add recorded model solves with checkpoint and search provenance when supplied.
- Keep any separately built algorithmic search demonstration distinct from the
  original model's search.
- Transfer check: identify what reversal, a prediction and a solve rate establish.

Dependency: original solve traces, search settings, checkpoint identifiers and
optional per-step outputs. Never invent missing model outputs or robot footage.

### Quantisation lab

Current: purpose labels and outcome; rounding and storage calculations.

Planned:

- Selected-weight trace: original → scale → code → reconstruction → error.
- Highlight shared blocks and the value determining their scale.
- Show which values change after an outlier or block-size adjustment; avoid
  promising monotonically increasing error.
- Compare a fixed dot product with original and reconstructed weights.
- Vary the input to show cancellation or accumulation of output errors.
- Pin a baseline across format and block-size comparisons.
- Keep ideal-scale E2M1 limitations explicit.
- Show included/excluded storage components, not a complete runtime-memory claim.
- Compare actual outputs of the small trained model using identical examples.
- Transfer check: different output errors from the same quantised weights.

## Connected-model milestone

Build a small causal language model that runs in the browser, trained on a
documented toy corpus with a documented vocabulary. Supply a reproducible
checkpoint and optional local training.

The learner should be able to:

1. Inspect token IDs and embeddings for an input sequence.
2. Follow projections, positional rotations, masked attention, residual updates
   and a feed-forward block.
3. Inspect vocabulary scores and probabilities; introduce sampling separately.
4. Supply a target, inspect loss and gradients, and apply one parameter update.
5. Run inference again and explain the changed prediction.
6. Freeze the base and train an adapter.
7. Compare an intervention or weight quantisation on the same examples.

Define the architecture, data, objective, precision, training recipe and expected
checks before implementation. Run training in a cancellable worker with bounded
resource use. Offer checkpoint inspection and a documented recorded training
sequence on devices that cannot train comfortably.

Do not connect unrelated drawings with a pretend computation. The model
inspector must display actual calculations and clearly distinguish its state
from the simpler mathematical demonstrations.

## Implementation map

| File | Responsibility |
| --- | --- |
| `experiences.js` | Catalog, filters, shared teaching panel, action recording and feedback UI |
| `experiences.css` | Directory and responsive teaching layouts |
| `maths.js` | Scene lifecycle, fullscreen shell, guide hooks and input handling |
| `maths/00-journey.js` | Lessons, prompts and model-context explanations |
| `maths/learning-models.js` | Shared linear-map, attention and gradient-descent calculations and numerical feedback |
| `maths/01–07-*.js` | Scene state, controls, painting and teaching integration |
| `lab.js` | Cube and quantisation examples |
| `scripts/check-learning-models.cjs` | Focused numerical regression checks |
| `scripts/prepare-hosting.sh` | Copies production assets to `dist/` |

Before/after snapshots must capture canonical experiment state before controls
mutate it. Camera state is separate. A gesture is one experiment, even if the
pointer pauses while held. Reset/undo must cancel pending timers, previews and
operations. Render feedback from the same computation as the visible result.

## Delivery order and validation

1. **Current stopping point:** stable discovery and two single-step teaching
   prototypes. Commit and push this build and its documentation.
2. **Finish the common interaction design:** review on a real tablet and with a
   first-time learner; refine feedback visibility, control meaning and accessibility.
3. **Upgrade the remaining seven experiences**, then complete the deeper
   attention/gradient additions above.
4. **Build the connected model** after its numerical and educational design is settled.
5. **Validate learning:** observe prediction and explanation on unfamiliar
   examples, not only animation completion.

Core checks:

- Camera-only movement preserves calculations.
- Undo restores parameters, settings and optimiser state accurately.
- Attention weights normalise and the displayed output matches contributions.
- Preview does not apply a training update.
- Actual loss increases receive an honest explanation.
- RoPE common shifts preserve fixed-content scores within stated tolerance.
- Projection removal and cube reversal satisfy their mathematical invariants.
- Quantised output calculations use the displayed reconstructed weights.
- Keyboard, touch and reduced-motion users can reach the educational outcomes.
- No essential controls overlap and comparison values remain readable on tablets.

Release verification passed: the numerical regression checks, JavaScript syntax
checks, hosting preparation, whitespace checks and 35 targeted browser checks,
with zero browser JavaScript errors. The targeted browser pass covered state
restoration, gesture boundaries, preview/apply, the overshoot example and layout
separation at 390 × 844 and 1024 × 768. Earlier browser review also covered
discovery filters, lab labels and the unmodified scene entry/exit paths.

Numerical checks and browser checks are not a user-learning study. Do not claim
measured educational improvement until such an evaluation has been designed and run.

## Run and resume

- Source preview: `http://localhost:8137/#maths`.
- Another device must use this Mac's current LAN address, not `localhost`.
- Port 8000 previously served the older main checkout; it is not this worktree.
- Run numerical checks with `node scripts/check-learning-models.cjs`.
- Prepare production assets with `sh scripts/prepare-hosting.sh`.
- This task does not authorise public deployment; committing/pushing the branch
  is separate from deploying the website.

Temporary browser scripts and screenshots under `/tmp/pw-test` are local review
artifacts, not durable project dependencies. Recreate browser verification if that
directory no longer exists.

## Continuation verification — 25 October 2026

The linear-map increment passed column-sum and determinant checks, collision and
zero-map invariants, input-versus-matrix feedback checks, and invalid-input checks.
Browser checks covered mode locking, action grouping, undo, comparison markers,
collision/zero examples, pending-action reset, camera-only reset, and separate
canvas/panel layouts at 390 × 844 and 1024 × 768 with reduced motion enabled.
The existing attention/gradient browser suite also passed, with zero JavaScript
errors. Screenshots of both new layouts were visually reviewed. JavaScript syntax,
production asset preparation and whitespace checks passed.

Browser checks were run using local Playwright scripts under `/tmp/pw-test`;
the mathematical regressions are retained in `scripts/check-learning-models.cjs`.
Real-device touch and first-time-learner studies remain outstanding. The low-rank
adapter panel and the six remaining experience upgrades are not implemented by
this increment. No public deployment was performed.
