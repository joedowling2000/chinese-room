# Chinese Room: experiences that explain cause and effect

Proposed plan · 24 October 2026 · No site implementation in this document.

## 1. Product goal

Turn the seven maths scenes and two lab examples into a connected learning environment. A visitor should be able to explain what they changed, what the calculation did, and how that relates to using or training a model.

Keep the immersive visual worlds, but make them accountable to the lesson. Every movement must either have a clearly stated mathematical meaning or be identified as a change of viewpoint. Every experience needs an observable educational outcome, a comparison the learner can control, and an opportunity to apply the idea to a new example.

The ambition is to move from illustrations of isolated operations to a small, inspectable model that connects them. The first release should already make all nine existing experiences substantially more informative; the connected model is a subsequent deliverable, not a prerequisite for useful feedback.

## 2. What the current implementation tells us

The current site has valuable foundations: deterministic synthetic examples, diagram and first-person views, three lessons per maths scene, keyboard/touch controls, source notes, and explicit limits on the lab results.

The main shortcomings are structural:

- `maths.js` copies one current-state string into both the controls and the experience ribbon. It does not retain the previous state or explain the last action.
- `maths/00-journey.js` supplies static lesson paragraphs. Advancing a lesson is independent of whether the visitor has tried or understood its operation.
- Movement has inconsistent meaning. Walking changes the selected input in linear maps and folding; turning changes the query in attention; taking a step changes parameters in gradient descent. Rotating the camera in several other scenes changes no calculation.
- Folding interpolates through a transformation and activation, but the interface does not clearly separate an animation's progress from an actual mathematical operation.
- RoPE shows a positional path on a torus but does not yet calculate an attention score between a selected query and key.
- High dimensions shows sampled angle geometry, not feature encoding or recovery.
- The cube runs scramble reversal and displays reported aggregate results; it does not run the trained network. Quantisation calculates rounding and storage, but does not yet show an effect on an output.

Adding more introductory prose alone will not solve these problems. The explanation has to respond to the action and remain connected to the visible quantities.

## 3. Organise by purpose, with overlapping labels

Use a persistent lifecycle strip:

**Represent inputs → Run a forward pass → Calculate loss → Update parameters → Evaluate**

Show preparation and interventions alongside this strip: **Quantise weights**, **Inspect activations**, **Edit activations/weights**. The strip should indicate the active operation, not imply that every scene is a successive layer in a transformer.

Define the distinctions on first use:

- **Inference:** use fixed learned parameters to calculate an output. Activations and caches can change without the model learning.
- **Training:** calculate a loss and use gradients to update trainable parameters.
- **Fine-tuning:** continue training an existing model, possibly updating only an adapter.
- **Intervention:** deliberately alter an activation or parameter to test or change behaviour. This is not necessarily training.
- **Preparation for inference:** change the representation of weights, as in the post-training quantisation example.

| Experience | Primary label | Also relevant to | What the current demonstration actually does |
| --- | --- | --- | --- |
| Linear maps | Forward pass | Training; adapter tuning | Applies a chosen matrix to input vectors |
| Folding / activations | Forward pass | Training | Applies an affine map and an activation |
| Gradient descent | Training | Fine-tuning | Updates two parameters on a synthetic loss surface |
| Attention | Forward pass | Training | Mixes synthetic value vectors using query–key scores |
| Rotary positions | Forward pass | Position configuration and its evaluation | Visualises rotations associated with positions |
| High dimensions | Representations | Inference; training; interpretability | Samples geometric relationships, without learning |
| Removing a direction | Intervention | Inference-time steering; weight editing | Projects a component out of synthetic vectors |
| Cube lab | Algorithm demonstration; reported training results | Model inference and search, when genuine traces are available | Reverses a known scramble |
| Quantisation lab | Preparation for inference | Forward-pass numerical effects | Rounds synthetic weights and estimates weight storage |

The forward-pass label explicitly includes the forward pass used during training. Do not categorise attention as “inference only”. Do not call every slider adjustment “tuning”.

Provide filters for **All**, **Using a model**, **Training and fine-tuning**, and **Inspecting and changing a model**. An experience can appear in more than one filter. Preserve the familiar seven-topic order in “All”.

Add three guided routes:

1. **How a prediction is calculated:** linear maps → activations → positional information → attention → connected forward pass. This is a teaching order, with actual architectural order shown in the model view.
2. **How a model learns:** linear maps → activations → gradient descent → full training versus adapter tuning.
3. **What changes when we modify a model:** representations → ablation/steering → quantisation → compare outputs and limits of the evidence.

Each card displays its outcome, purpose labels, and example type: **Synthetic calculation**, **Small trained model**, or **Recorded experiment**. Avoid giving a geometric demonstration the visual authority of a measured model result.

## 4. A common interaction and feedback design

### Before the visitor acts

Show a short orientation card with:

- **Your goal:** one concrete outcome.
- **You control:** the mathematical object the controls change.
- **Held fixed:** the input, weights, dataset or other quantities that stay constant.
- **Watch:** the visible result that should respond.
- **Model connection:** the relevant point on the lifecycle strip.

Example for attention: “Turn to change the query direction. The keys, values and learned projections are fixed in this example. Watch the score bars and the weighted output.”

Prefer explicit controls such as **Change input**, **Edit weights**, **Take training step**, and **Look around**. In attention, retain turning as a mathematical interaction, but label that mode **Aim query** and provide a separate camera inspection mode. Do not silently switch meanings.

### After every meaningful action

Replace the single readout with three coordinated elements:

1. **Change summary:** one short sentence describing the action and its measured consequence.
2. **Evidence:** a before/after comparison of the relevant values, linked to highlighted objects in the scene.
3. **Interpretation:** why the result matters for inference, training or an intervention, followed by any limit needed to interpret it.

For example:

> You lowered the attention temperature. The query–key scores stayed the same; the weights became more concentrated on the highest score. The output moved towards that key's value vector. No model weights were trained.

Generate the values from the calculation that drives the scene. Use conditional, authored explanations; do not display a scripted success story regardless of the result. Equal-score cases, unchanged rounded weights, increasing loss and boundary-clamped movement all need honest feedback.

Every experience should support:

- A ghost of the previous state and a **Compare before/after** control.
- **Undo last experiment**, including the required optimiser state where relevant.
- Separate **Reset experiment** and **Reset camera** actions.
- A short inspectable action history, with the last completed action pinned.
- A **Why did that happen?** expansion showing the calculation at an appropriate level.
- A way to select an object and connect its formula values to its visual marks.
- A plain statement when an action changes only the view: “Camera rotated; calculated values are unchanged.”

Do not announce every animation frame. Update visual quantities during movement, then announce a concise summary at the end of a gesture or operation. Continuous playback needs pause, single-step and an inspectable last-step record.

### Guided learning and exploration

Offer two modes using the same underlying state:

- **Guided:** predict → act → inspect → explain → try a different example.
- **Explore:** all relevant controls, comparisons and explanations remain available without a prescribed sequence.

Keep the current three-lesson structure where useful, but give each lesson a question and a visible target. Show “Example explored” separately from “Check answered”; clicking Next is not evidence of understanding. Checks should explain a misconception and permit retry, without scores or completion gates.

Remember progress locally only, with a clear reset. The visitor must be able to skip checks and explore directly. No account or analytics service is needed.

## 5. Experience specifications and learning outcomes

### 5.1 Linear maps — follow one vector through a projection

**Outcome:** Given a matrix and an input vector, the learner can predict the direction of the output change, distinguish changing an input from changing weights, and explain how a singular map can lose information.

**Purpose:** Forward pass, with a clearly separated introduction to training and adapter tuning.

**Augmentation:**

- Pin one input vector and show its two coordinates, the two matrix columns, each scaled column contribution, and their sum. Highlight those contributions in the grid as the learner moves.
- Add **Input mode** with the matrix locked and **Weight-edit mode** with the input locked. State explicitly that manual weight editing is an experiment, not a gradient update.
- Show input/output ghosts and a small table of the same matrix applied to several vectors. A weight change should visibly affect all of them.
- Give collapse its own investigation: two different inputs can share one output. Let the visitor compare a line collapse with a zero matrix.
- Add an adapter panel: **Frozen base + low-rank update = effective matrix**. Toggle the update while preserving the base and explain that the base directions have not been deleted. Actual learning of the adapter belongs in the training extension.

**Feedback:** “You changed the input; the matrix stayed fixed”, or “You edited a matrix entry; outputs for every displayed input were recalculated.” Display actual coordinate deltas. Keep rank, area and orientation distinct.

**Transfer check:** Ask the learner to construct two different inputs that collapse to the same output, then identify whether changing the input or the matrix would change the rule for all inputs.

### 5.2 Folding — see what an activation changes

**Outcome:** The learner can trace an input through an affine transformation and an activation, explain what ReLU does to negative coordinates, and distinguish the scene's decorative height from a model dimension.

**Purpose:** Forward pass; later connected to gradient-based learning.

**Augmentation:**

- Split playback into explicit **Input → Affine transform → Activation → Output** stops. Label intermediate animation frames as interpolation, not extra layers or training.
- Pin a point and show its input, pre-activation coordinates, activated coordinates and the activation curve with that point marked.
- Make negative/zero/positive status readable without colour. Show exactly which selected coordinates are suppressed or retained.
- Compare ReLU, leaky ReLU, GELU and tanh on the same fixed input and affine map. Include positive inputs when explaining tanh and GELU; the existing “negative coordinates” shorthand is insufficient for all activations.
- Add a two-layer comparison: linear/affine operations alone versus operations with an activation between them. Let the learner see why the latter is not generally one affine map.
- In the connected training example, overlay local activation derivatives and connect them to parameter updates without claiming that an activation guarantees useful gradients.

**Feedback:** “This coordinate was negative before ReLU and is now zero. The raised wall visualises the change; the output still has two coordinates.” For other activations, explain their actual output rather than reusing the ReLU story.

**Transfer check:** Predict the output signs for a new point and choose which change modifies the layer's rule versus merely viewing a different input.

### 5.3 Gradient descent — inspect an update, not just a journey downhill

**Outcome:** The learner can explain how a gradient, learning rate and momentum combine into an update, interpret a rise in loss, and distinguish training from inference with frozen weights.

**Purpose:** Training and fine-tuning.

**Augmentation:**

- Freeze the scene before each guided step. Show current parameters, gradient arrow, momentum contribution, proposed update and the candidate new position.
- Separate **Preview step** from **Apply step**. After application show loss before, loss after, and the actual change.
- Add a loss-history plot with selectable steps; selecting a step highlights its position and parameters.
- Compare two runs from the same initial parameters and optimiser state with different learning rates or momentum. Do not compare unrelated starts by default.
- Provide deliberate examples of improvement, overshoot, domain exit and a small gradient. Explain that a small gradient does not prove a global minimum.
- Add a small supervised model panel: input, prediction, target, loss, gradient, updated weights, new prediction. The two-dimensional landscape remains explicitly synthetic; do not label its values as the supervised model's loss unless they are the same objective.
- Extend the panel to compare **Train all weights** with **Train an adapter** from the same frozen starting checkpoint. Show the trainable parameter mask and evaluate both on the same fixed examples.

**Feedback:** Explain the actual step and observed loss change. Changing the learning-rate slider alone should say “The next update will use this rate; weights have not changed yet.”

**Transfer check:** Compare an inference run with a training step and identify which can change learned weights. Predict whether a larger finite step must lower loss, then inspect a counterexample.

### 5.4 Attention — trace scores into an output

**Outcome:** The learner can follow query/key dot products through score scaling, softmax and a weighted sum of values, and explain why the highest attention weight is not itself the next-token prediction.

**Purpose:** Forward pass, used in both inference and training.

**Augmentation:**

- Present **Query → Scores → Weights → Value contributions → Output** as inspectable stages.
- Select a key to highlight its dot product, weight and contribution to the output vector.
- Offer two labelled modes: the existing **Values equal keys** illustration, then **Independent values**. The second is essential to show that matching selects information to combine, not merely a word to output.
- Lock query length while exploring direction, then lock direction while exploring length. Separate both from score-temperature experiments.
- Add a small causal sequence view that makes unavailable future positions visible and masked. Introduce multiple heads as a later comparison, not simultaneous initial complexity.
- Keep sampling controls out of this scene. Connect its output to a downstream residual update in the shared model.

**Feedback:** Identify whether the query, scores, weights or values changed. Changing only a value should leave attention weights unchanged while changing the output. Equal scores should produce equal weights regardless of temperature.

**Transfer check:** Change the output without changing attention weights, then explain which variable made that possible.

### 5.5 Rotary positions — test the relative-position relationship

**Outcome:** The learner can explain which coordinates RoPE rotates, demonstrate the effect of relative position with fixed content, and distinguish a mathematical positional relationship from evidence of long-context quality.

**Purpose:** Forward pass; frequency changes are configuration experiments, not automatic training.

**Augmentation:**

- Retain the tunnel as the spatial overview, but add a query token and key token with independently controlled positions.
- Show the unrotated content vectors, two rotating coordinate pairs, relative phases, and their contributions to the actual post-rotation dot product.
- Add **Move both positions together** and **Change their separation**. With content fixed, the first should preserve the score; the second can change it.
- Provide a content-change control to demonstrate that equal separation does not imply equal scores for different content.
- Explain that frequency effects can oscillate; do not narrate every increase in distance as a decrease in score.
- Compare two frequency schedules on a fixed position range, with context-quality claims reserved for a separate model evaluation.

**Feedback:** “Both positions moved by the same amount. Relative position and the score stayed the same for these fixed content vectors.” Show numerical differences within a declared floating-point tolerance, not fabricated exact equality.

**Transfer check:** Predict which of a common position shift, a separation change, and a content change must preserve the score under the lesson's assumptions.

### 5.6 High dimensions — separate geometric overlap from recoverable features

**Outcome:** The learner can explain angle concentration for random directions and distinguish it from successful storage and recovery of learned features.

**Purpose:** Representations and interpretability, relevant across inference and training.

**Augmentation:**

- Keep the sky and histogram linked. Selecting a star highlights its cosine similarity, angle and corresponding histogram bin.
- Label sample size, dimensionality and any approximation. Use a consistent sample construction for comparisons and clearly identify when a new sample is drawn.
- Show before/after distributions with the same axis conventions. Explain that the histogram is a population view, not the trajectory of one learned feature.
- Replace ambiguous units such as “±0.1 of a right angle” with either a cosine interval or an angular interval. Do not equate the full sample's statistic with the displayed subset of stars.
- Add a separate, explicitly synthetic **Feature interference** bench: choose feature directions and coefficients, encode their combination, decode with a stated method, and inspect reconstruction errors.
- Let the learner change direction overlap and how many features are active. Keep the random geometry and the encoding/decoding experiment visibly distinct.
- Connect this to the residual stream of the small trained model only when actual activations can be inspected.

**Feedback:** A dimension change reports the measured sample change. Rotating the sky says it changed only the view. The feature bench explains interference using the selected coefficients and recovered outputs.

**Transfer check:** Show a narrow random-angle distribution and ask whether it establishes that a model can recover arbitrary features. Then let the learner find a reconstruction failure in the synthetic bench.

### 5.7 Removing a direction — make the intervention and its limits visible

**Outcome:** The learner can decompose an activation into parallel and perpendicular components, remove the parallel component, and explain why geometric separation alone does not prove a behavioural cause.

**Purpose:** Intervention, with separate inference-time activation editing and parameter-editing explanations.

**Augmentation:**

- Pin one activation. Draw its original vector, parallel component, perpendicular remainder and resulting vector side by side.
- Add explicit **Subtract projection**, **Add steering vector**, and **Restore stored original** operations. Never imply that restoration mathematically inverts a projection.
- At full removal, show two original points with different coefficients mapping to the same remainder; a fixed addition cannot recover both originals.
- Add a small synthetic downstream readout so learners can see that preserving perpendicular coordinates does not preserve every later output. Label it as a designed example, not measured refusal behaviour.
- Offer selection of a candidate direction and comparison with a different direction. Show effects before claiming a causal interpretation.
- Explain activation editing during a forward pass separately from editing write matrices. Neither operation is an optimiser training step.
- Any real refusal comparison belongs in a sourced recorded-experiment panel, retaining prompt-set scope and observed refusals.

**Feedback:** Report the removed coefficient, immediate vector change and downstream output change separately. When movement along the removed direction produces no output movement, show the algebraic reason.

**Transfer check:** Ask whether adding the same steering vector can restore two different original points after projection, then let the learner test it.

### 5.8 Cube lab — separate reversal, model prediction and search

**Outcome:** The learner can distinguish an inverse scramble from a learned move suggestion, a search procedure and an aggregate training result.

**Purpose:** Algorithm demonstration and reported training results; model inference becomes inspectable when genuine records are supplied.

**Augmentation:**

- Add an explanatory sequence: **Encode state → Predict moves/value → Search → Execute move → Inspect new state**. The current live demo activates only its actual reversal path.
- Pair each scramble move with its inverse. Before a reversal step, highlight the affected face and stickers; after it, show the exact state change.
- Keep orientation controls separate from cube turns: “View rotated; cube state unchanged.”
- Offer a simple counterexample where reversing the scramble is longer than a shorter valid solution. The browser must verify both sequences reach solved.
- Make the training-results panel explain sample size, scramble depth, checkpoint and separation from the robot trial. Changing the depth selects another reported sample; it does not retrain the network.
- Add a genuine recorded solve mode when records are supplied: checkpoint, input scramble, predicted move probabilities/value estimates if available, selected search path, executed moves and final state. Do not invent missing per-step outputs.
- Where search traces are unavailable, show a separately labelled small algorithmic search example. Do not present it as the original model's search.

**Feedback:** “This move undoes the previous scramble move. No neural prediction was made.” In recorded mode identify model scoring, search choice and physical execution separately.

**Transfer check:** Compare a reversal sequence, a model prediction and a reported solve rate; identify what each does and does not establish about solving a new cube.

**Dependency:** Genuine model replay needs original traces and search/checkpoint provenance. Complete the reversal and results improvements without waiting for these assets.

### 5.9 Quantisation — follow rounding into a computed output

**Outcome:** The learner can explain how a shared scale and number format affect rounding, distinguish weight error from output error, and avoid inferring quality or speed from storage alone.

**Purpose:** Preparation for inference, followed by a forward pass using fixed reconstructed weights.

**Augmentation:**

- Select a weight and show **Original → Divide by scale → Choose code → Reconstruct → Error**. Highlight its block and the weight that determines the scale.
- When increasing the outlier, highlight which block's scale changed and which reconstructed values changed. Do not suggest that every affected error must increase monotonically.
- Add a fixed small input vector and a dot product computed with original versus reconstructed weights. Show each contribution and the final output difference.
- Let the visitor vary inputs while keeping weights fixed to show that output error depends on the input and may cancel or accumulate.
- Compare formats and block sizes using one pinned baseline. Keep displayed limits explicit for the ideal-scale E2M1 illustration.
- Extend the storage panel to show included versus excluded components rather than implying a complete runtime-memory budget.
- On the small trained model, compare predictions from original and reconstructed weights on the same fixed examples. Any quality measurement must name its dataset and objective; no browser inference-speed claim without an actual timing measurement.

**Feedback:** Explain whether a change affects rounding, reconstructed weights, the selected output, or just the storage estimate. A model-size slider should explicitly say it has not changed the 32 displayed example weights.

**Transfer check:** Find two inputs that produce different output errors with the same quantised weights, then explain why weight error alone does not determine model quality.

## 6. The ambitious extension: one model connecting the lessons

Build a small, inspectable causal language model running entirely in the browser, using a clearly documented toy corpus and vocabulary. It should be trained for that toy task; do not assign meaningful word labels to arbitrary untrained vectors and imply learned language understanding.

Provide a bundled, reproducible starting checkpoint and an optional local training mode. Keep the existing mathematical examples as controlled demonstrations, linked to the corresponding operation in the model.

The connected view should support:

1. Select an input token sequence and see token IDs and embeddings.
2. Follow one position through query/key/value projections, positional rotations, masked attention, residual updates and a feed-forward block.
3. Inspect final vocabulary scores and probabilities. Use deterministic selection first; introduce sampling separately with an explicit seed.
4. Supply a target and inspect loss, gradients and one parameter update.
5. Run inference again and compare predictions with the previous checkpoint.
6. Freeze the base and train an adapter, then inspect which parameters changed.
7. Apply a controlled activation intervention or weight quantisation and compare the same examples.

**Capstone outcome:** The learner can trace a changed prediction to a changed input, parameter update, activation intervention, positional input or numerical representation, and identify which operations actually constituted learning.

The model's architecture, corpus, objective, precision, training recipe and checks require a separate technical design before implementation. Choose them for inspectability and browser responsiveness, not for impressive generated text. Computation and training run in a worker, with cancellation and bounded resource use. Devices unable to run training can inspect the bundled checkpoint and a documented recorded training sequence.

This is a separate experience with real calculations, not an animation pretending to connect unrelated examples. Preserve each demonstration's dimensionality and explain when moving between the controlled example and the model.

## 7. Implementation design

Extend the existing architecture rather than build a second site.

| Area | Responsibility |
| --- | --- |
| `maths/00-journey.js` | Outcomes, purpose labels, guided routes, authored lesson questions, explanations and control meanings |
| `maths.js` | Shared orientation, lifecycle display, feedback panel, comparisons, lesson navigation, reset/undo UI and accessible announcements |
| `maths/01–07-*.js` | Scene calculations, state snapshots, action semantics, meaningful before/after values and selection highlights |
| `lab.js` | Cube and quantisation event/state adapters using the same feedback vocabulary |
| `field.js`, `app.js` | Discovery cards, filters, links and route descriptions |
| `field.css` and relevant existing styles | Responsive layouts, readable feedback, comparison overlays and interaction affordances |
| New shared experience module | Structured action records and common feedback rendering that labs and maths can both use |
| New worker/model modules, later | Connected model computation and cancellable training |

Use an explicit state contract. Scene code supplies mathematical state and computed values; shared UI formats them. An action record contains:

- Scene and action identifier.
- Action category: camera, input, parameter edit, training update, intervention, configuration, animation control or result selection.
- Before and after experiment snapshots, independent of camera state.
- Named changed quantities with units, provenance and display precision.
- Relevant stage and whether trainable parameters changed.
- Authored explanation key and its computed arguments.

This contract is a proposed interface, not permission to start writing a generic framework before the first two scenes prove it useful. Start with attention and gradient descent because they expose the central contrast between changing an activation and updating parameters.

Capture a baseline at the beginning of a gesture and a final snapshot when it ends. Animation frames may update a live preview but must not overwrite the comparison baseline. Guided preset changes should be one explainable action, not a burst of synthetic slider events.

Keep changes to the mathematical model separate from temporary camera effects. Use serialisable experiment state for reset, undo and reproducible examples. Include optimiser state, dataset/example identity and random state where applicable. A replay must reproduce calculations, not just interpolate positions.

Numbers shown in feedback must come from the same computation as the picture. Specify formulas, units, sample populations, tolerances and comparison baselines before implementing derived measurements. Do not let a UI author invent a metric or silently change what a statistic measures.

## 8. Accessibility and presentation

- Keep the immersive canvas, but provide equivalent diagram and numerical views. No learning outcome depends on steering through a 3D world.
- In guided mode, give priority to the selected object, last-action explanation and next meaningful control. Move optional detail into expansions rather than overlaying every panel at once.
- On tablets, use a compact scene plus a docked explanation panel; allow expansion to inspect calculations. Do not rely on a desktop floating-panel arrangement squeezed into portrait.
- Use text and shape as well as colour for before/after, positive/negative, frozen/trainable and affected/unaffected.
- Keep essential actions reachable with touch and keyboard. Honour reduced motion with completed-state comparisons and optional discrete stepping.
- Use polite announcements only for completed meaningful actions. Camera drags and animation frames must not flood screen readers.
- Make **Pause**, **Undo**, **Reset experiment** and **Reset camera** distinct and predictable.
- Retain a visible concise “You are changing…” label. If the learner can hide the interface, provide an obvious way to restore it.

## 9. Delivery sequence

### Phase 1 — make action and purpose legible

Deliver lifecycle labels, discovery filters, orientation cards and the shared action-feedback contract. Implement it fully in attention and gradient descent, including before/after, reset/undo and a transfer check.

Review these two experiences on desktop and tablet with someone unfamiliar with the site. Ask them to explain what turning, stepping and changing a slider did. Use that feedback to settle the common interaction design.

**Exit condition:** A visitor can distinguish changing an activation, changing the camera and updating learned parameters without reading source notes.

### Phase 2 — upgrade every existing experience

Roll out the common design to all remaining scenes and both labs. Deliver the substantive teaching additions: selected-vector calculations, staged activations, query/key RoPE comparison, feature interference bench, ablation versus steering, explanatory cube reversal, and quantised dot-product output.

Each experience must have its learning outcome, guided experiment, responsive action explanation, before/after comparison, transfer check, textual alternative and scope note.

**Exit condition:** All nine experiences meet the acceptance criteria below. Genuine cube traces are the only deferred content dependency, not a blocker for its live-demo improvements.

### Phase 3 — connect inference, training and tuning

Design and implement the small trained model, reproducible checkpoint, worker execution and connected forward-pass inspector. Add one-step learning, full versus adapter tuning, and controlled intervention/quantisation comparisons.

**Exit condition:** A visitor can trace the same example through inference, one training update and inference again, then explain why its output changed. Adapter and intervention modes visibly distinguish updated parameters from altered activations.

### Phase 4 — validate the learning experience

Review all routes with first-time users, including keyboard-only and tablet use. Observe whether they can predict and explain a new example, not merely whether they finished the animation. Revise explanations and controls where they confuse camera movement, inputs, parameters or outputs.

Keep a short record of observed problems and resulting changes. Do not publish a numerical learning-improvement claim without a separately designed evaluation.

## 10. Acceptance criteria and guardrails

For every experience:

1. Its educational outcome and purpose are visible before interaction.
2. Each control states whether it changes a view, input, model parameter, optimiser setting, intervention or selected result.
3. A meaningful action produces an accurate explanation tied to actual before/after values; a no-op is identified as a no-op.
4. The learner can compare, undo and reset without losing the explanation of what happened.
5. At least one guided example challenges a likely misconception and one new example tests transfer.
6. The outcome can be reached without motion, colour perception, precise pointer control or a physical keyboard.
7. Synthetic calculations, trained-model outputs and historical results remain distinguishable.
8. Tablet layouts keep the action and its explanation simultaneously usable.

Technical checks should target meaningful invariants: camera-only changes preserve calculations; attention weights sum to one over allowed positions; changing values alone preserves scores; a common RoPE position shift preserves a fixed-content score within tolerance; a complete projection removes the selected component; cube reversal solves the known scramble; displayed quantised outputs match reconstructed weights; and undo restores experiment state including optimiser state.

Before implementation, author exact deterministic examples and expected relationships for those checks. Add focused checks near the numerical modules and a browser pass for input handling, announcements and layout. Do not substitute screenshot similarity for mathematical correctness.

Preserve the editorial principles in `human-idiom.md`: no invented experimental evidence, no claim that a synthetic scene proves real-model capability, and no implication that all interventions are learning.

## 11. Recommended first deliverable

Build an **attention and gradient-descent teaching prototype**, together with lifecycle labels on all nine cards.

These two experiences should demonstrate the full proposed feedback system, not just refreshed text. Their contrast establishes the idea the rest of the site needs: during a forward pass the model calculates with its parameters; during a training update it changes trainable parameters. Once that is understandable and enjoyable on an iPad, extend the same design across the other experiences.

## Implementation log

- **Phase 1 — in progress, 24 October 2026.** Delivered: the nine-experience directory with purpose labels, kinds and outcomes plus filters; purpose badges and goals on maths topics, fullscreen identities and lab pages; the shared teaching panel (guided experiments, before/after comparisons, undo, separate experiment/camera resets, action history and transfer checks) implemented for attention and gradient descent; `maths/learning-models.js` as the single calculation source; `scripts/check-learning-models.cjs` regression checks. The remaining seven experiences carry labels and outcomes only — their guided teaching upgrades are phase 2. The connected model is phase 3. Not yet validated with learners; no learning-improvement claim is made.
