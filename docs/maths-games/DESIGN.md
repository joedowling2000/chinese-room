# The Field Instruments

## Seven mathematical games for Chinese Room

Version 1 · 25 October 2026 · Design proposal, not implementation.

Companions: [Research and references](RESEARCH.md) · [Delivery plan](PLAN.md).

## 1. Creative direction

An immense, silent mathematical installation is waiting to be brought into operation. Each chamber contains one instrument: a lattice press, a folding membrane, a contour table, a signal loom, a phase mechanism, a representation array, and a projection filter. The player operates the mathematics directly. Solving the puzzle makes the machine work, and the surrounding architecture responds to that working system.

The experience should feel like discovering how an unfamiliar engineering instrument behaves. A luminous point is a vector. A hinge is a non-linear operation. A thread carries a measured weight. These objects have consistent rules the player can exploit, combine, and understand.

The central requirement is **a mathematical decision with a visible consequence**. Every chamber needs a reason to try one action instead of another. Its challenge must survive removal of atmospheric animation and explanatory prose.

### Intended player and scale

A curious adult with no assumed machine-learning knowledge. Familiarity with dragging, selecting, and undoing is enough to start. More technical players can inspect the actual vectors and equations and pursue efficient solutions.

Design targets, to be measured rather than presented as achieved:

- First meaningful input within 10 seconds; first visible consequence in the next rendered frame.
- First small success within 30–90 seconds without reading a tutorial essay.
- Three core chambers per game, each introducing a different reasoning demand.
- Approximately 5–8 minutes per core game; 35–55 minutes for the collection, playable in separate visits.
- One optional harder chamber per game and a sandbox after the core sequence.
- No mandatory reflex test, timer, audio cue, or keyboard. The iPad is a primary target.

### The seven games

| Core concept | Game | Player's main verb | Problem to solve | Discovery |
| --- | --- | --- | --- | --- |
| Linear maps | **Basis Foundry** | Transform | Route a whole constellation into fixed receivers using shared matrix plates | One map acts on every vector; order and rank matter |
| Non-linearity | **Hinge Engine** | Fold | Separate interleaved signal families with a small network of affine plates and ReLU hinges | Linear rearrangement has limits; non-linearity changes what can be separated |
| Gradient descent | **Contour Pilot** | Tune and descend | Bring a probe into a low-loss region within an update budget | Step size and momentum determine convergence, oscillation, and escape |
| Attention | **Query Loom** | Aim and mix | Weave the required output from several value signals | Matching keys controls weights; the answer is a mixture of values |
| Rotary position encoding | **Phase Observatory** | Align | Identify and reconnect positions from their relative phase signatures | Several rotations distinguish offsets; shifting both positions preserves their relationship |
| High dimensions | **Superposition Array** | Pack | Fit more sparse signal identities into a constrained vector space and recover them | More room helps, but interference and simultaneous activity determine what is recoverable |
| Projection / ablation | **Nullspace** | Filter | Remove a disturbance while preserving a useful signal | Projection removes a component; overlapping information creates a real tradeoff |

The games have different play loops. Shared styling and conventions give the collection coherence; a common walking mechanic would not.

## 2. What changes from the current experiences

Keep the seven subject routes, the site's typographic identity, mathematical copy as reference material, and the ability to inspect a flat schematic. Rebuild the Abstract gameplay, camera model, level structure, controls, feedback, and success evaluation.

The following are design constraints for the replacement:

- No walking through an unbounded field as the primary activity.
- No reward for moving a slider to a stated number without solving a relationship.
- No success triggered by opening a panel, moving the camera, or pressing a prescribed sequence.
- No decorative variable presented as if it were a measured mathematical quantity.
- No long introduction before the first playable object.
- No generic score that obscures whether the construction works.

The previous challenges and rendering additions remain in the working tree while this proposal is reviewed. They are not the architecture of the new games.

## 3. Shared experience design

### A complete loop

1. **See a discrepancy.** A receiver is dark, a trajectory misses, or a signal has an unwanted component.
2. **Form a hypothesis.** The visible handles and a short objective suggest an action.
3. **Manipulate the instrument.** The prospective result appears immediately.
4. **Run a trial.** The current configuration processes the real input set.
5. **Inspect the consequence.** A particular receiver, sample, or update explains the failure.
6. **Revise or complete.** Undo is immediate. Success persists until the player chooses the next chamber.
7. **Name the discovery.** One sentence connects the result to the concept, with optional deeper inspection.

A trial can always be stepped instead of animated. A decorative settling animation never decides whether the result counts.

### Progression and assistance

All seven games are accessible from the start. Within each, recommend the authored order but allow skipping. A solved chamber becomes a working miniature in the collection's instrument diagram. Progress saves locally, with a clear reset option. No account is needed.

Use three levels of optional help: highlight the relevant relationship; show a partial worked action; reveal one complete solution and let the player replay it. A revealed solution remains marked as assisted, but does not block further play. The player can undo a solution to inspect its failure again.

Optional optimisation is specific to each machine: fewer plates, fewer updates, lower output error, fewer dimensions, or better signal preservation. These are separate measures, not one composite leaderboard score. A valid solution always earns completion before optimisation is suggested.

### Interface and camera

The default view is a stable, slightly elevated or orthographic stage that contains all essential objects. Perspective and parallax establish scale, but the board is always recoverable in one action. No pointer lock, free-flight camera, or dual-stick touch controls.

```text
┌──────────────────────────────────────────────────────────────┐
│ 01 / BASIS FOUNDRY          Chamber 2 of 3      Sound  Exit   │
│ Route all three signals into their matching sockets.         │
│                                                              │
│    sources       [matrix plate] [matrix plate]    receivers   │
│       •                  interactive stage            ○      │
│       •                                               ○      │
│       •                                               ○      │
│                                                              │
│       a visible mismatch / ghost trace / failing sample       │
│                                                              │
│ Undo  Reset       selected object controls        Run  Step   │
│ 2 / 3 connected · largest miss 0.50      Schematic  Why?      │
└──────────────────────────────────────────────────────────────┘
```

On iPad landscape, stage and a compact tool rail share the width. In portrait, the stage occupies the middle and the controls sit below it. Details open as a sheet that pauses playback without resetting the trial. A collapsed objective is at most two lines. The play area must not sit behind a large guide card.

Direct manipulation always has a non-drag equivalent: select an object, then use labelled decrement/increment or directional controls. Keyboard focus uses the same objects and commands. `Enter` runs, `Space` pauses playback when the stage owns focus, `Z` undoes, and `Esc` closes a sheet or returns from the game. Shortcuts never override focused inputs or ordinary page controls.

### Feedback contract

| Situation | Immediate feedback | Persistent information |
| --- | --- | --- |
| Select a handle | Outline and expanded hit target | Object name and current value |
| Change a value | Actual geometry and output preview change | Error relative to the objective |
| Reach a limit | Handle stops at a marked bound; text identifies the bound | Valid range remains visible |
| Invalid operation | The affected constraint is highlighted | A specific explanation, such as “These inputs now coincide” |
| Trial fails | Pause or mark the earliest informative failure | Failing input, expected output, actual output; Undo and Retry |
| Trial succeeds | Receivers lock; machine runs one complete cycle | The player's construction, achievement, and optional explanation |
| Sound disabled / reduced motion | Static traces and shape changes carry the same facts | Identical completion rules and controls |

An action that cannot alter the output must still explain why. For example, a projection may annihilate a component; the interface shows the removed input and zero output alongside each other.

## 4. Art and sound direction

### Fit with Field

Use the existing `#08090a` foundation, off-white type, graphite panels, DM Sans for instructions, and IBM Plex Mono for quantities and labels. Keep the site's quiet editorial hierarchy and restrained rounded controls.

The mathematical stage should be more materially legible than the current fine wire fields. Use filled planes with cut edges, luminous trajectories against dark surfaces, sectional hatching, explicit joints, and a small number of bright control handles. Fine wire geometry supports depth; it does not carry the only evidence of a successful action.

| Instrument | Dominant structure | Accent family | Mathematical quantity made visible |
| --- | --- | --- | --- |
| Basis Foundry | Suspended lattice press, machined matrix plates | Mint / ivory | Basis vectors and transformed positions |
| Hinge Engine | Translucent membrane and hard crease rails | Violet / pale cyan | Pre-activation sign and output coordinates |
| Contour Pilot | Topographic table with a deep central ravine | Amber / ice blue | Loss height, gradient, and update velocity |
| Query Loom | Radial loom with separate outer keys and inner value carriers | Cyan / warm white | Attention weight and weighted contribution |
| Phase Observatory | Black circular instrument with coupled orbital rings | Periwinkle / silver | Pair phase, position offset, and alignment error |
| Superposition Array | Suspended signal cards, vector bundles, interference matrix | Cool white / lavender | Representation coordinates and decoding crosstalk |
| Nullspace | Rotating plane through a three-dimensional signal volume | Amber / blue grey | Retained and removed components |

Colour always has a companion: shape, index, dashed/solid treatment, or label. Glowing points have solid cores; output arrows have identifiable heads. The working stage remains readable with atmospheric layers switched off.

### Atmosphere as response

A correct construction illuminates an architectural circuit that follows the actual signal path. A bad descent rings against the ravine walls. A successful mixture resolves a broken geometric aperture. An erased nuisance leaves a clean trace through a rotating plane. These are rewards for the solved system, not unrelated celebrations.

Optional procedural audio consists of quiet tones, filtered noise, and short mechanical transients. A value can modulate a bounded timbre or rhythm, but correctness is never inferred from a consonance rule absent from the mathematics. Audio begins only after an explicit sound action and is remembered per device. No autoplay, narration, or musical timing requirement.

## 5. Game 01 — Basis Foundry

### Fantasy, view, and objective

Operate a suspended transformation press. Several luminous source vectors enter the same sequence of matrix plates; their endpoints must land in matching receiver sockets on a fixed output frame. The machine can transform an entire constellation but cannot individually steer its points.

The stage shows input and output frames together, connected by short traces through the active plates. A moving unit square makes area and orientation tangible. Default view is orthographic with shallow depth. The receiver frame never transforms along with the sources.

**Core loop:** choose or adjust a plate → inspect all output ghosts → reorder if needed → pulse the constellation → inspect misses → revise.

### Interaction and meaningful choices

Drag a plate into a slot, reorder slots, or drag its two basis handles. Early plates have one adjustable parameter; later ones expose both columns. A selected handle can be adjusted with axis steppers. Plate slots and handles have visible bounds and snap increments.

The decision is global: fixing one receiver can move the other two out of alignment. Plate order changes the result. Rank loss may make a later requirement impossible until the player removes the destructive plate.

### Core chambers

| Chamber | Situation and tools | Completion | New reasoning |
| --- | --- | --- | --- |
| 1. Two columns | Sources `e₁`, `e₂`, and `e₁+e₂`; one editable matrix with half-unit handle steps | All endpoints within 0.05 world units of their fixed targets | The third output follows from the first two |
| 2. Order of operations | A shear and a quarter-turn plate; two slots; fixed targets | Correctly route the complete constellation | `RS` and `SR` produce different destinations |
| 3. The collapsed channel | Two distinct sources become coincident after a rank-one plate; spare invertible plate available | Restore separation and hit both receivers | Later linear maps cannot separate identical vectors |

Optional chamber: meet the targets and a required orientation using at most two plates. Sandbox: a wider input grid, extra presets, and visible determinant.

### First minute

Three sources and three hollow receivers are visible. One basis handle is already correct. Dragging the other moves two ghosts together. The player sees why correcting just one point is insufficient. When all ghosts fit, Run sends one pulse through the press and locks all three receivers. The first discovery line reads: “You moved three vectors by choosing where two basis vectors land.”

### Mathematical contract and checked example

For column vectors, a left-to-right route through plates `A`, then `B`, computes `y = BAx`. The diagram labels the operational order as well as the product to prevent a notation trap.

Use `S = [[1,1],[0,1]]` and `R = [[0,-1],[1,0]]`. Then:

- `RS e₁ = (0,1)`, `RS e₂ = (-1,1)`, `RS(e₁+e₂) = (-1,2)`.
- `SR e₁ = (1,1)`, `SR e₂ = (-1,0)`, `SR(e₁+e₂) = (0,1)`.

These are an authored order puzzle, not a demanded sequence: any permitted construction meeting the same output and slot constraints counts. With continuous controls, evaluate actual coordinate error, never screen distance.

### Feedback, failure, and learning

Missed sockets retain a line from actual to expected endpoint, labelled with error. A singular plate shows the two original IDs sharing one output marker. Repeated trials are unlimited. Undo restores the complete plate arrangement.

After completion, expose the columns and determinant over the player's own press. Explain that transformer projections also apply shared linear maps, while this two-dimensional machine is a toy example. Do not teach that every learned matrix is square or invertible.

**Prototype gate:** an unfamiliar player must solve a small constellation without separately manipulating its outputs and explain why changing one handle moved more than one point.

## 6. Game 02 — Hinge Engine

### Fantasy, view, and objective

Build a tiny non-linear sorting machine. Two signal families arrive interleaved on a translucent coordinate sheet. A fixed final separator sends points to one of two receivers. The player must reshape the representation so every signal reaches the receiver matching its shape.

The input sheet, hinge stage, and output sheet remain visible side by side. The membrane is an illustration of the computation; the plotted coordinates and classification boundary decide the result.

**Core loop:** arrange a small affine/activation circuit → watch the entire labelled point set move → test both families → inspect the first misclassified point → change the circuit.

### Interaction and constraints

Rotate or bias a pre-activation plate; insert a ReLU hinge; choose the sign of its input; connect two available branches to a fixed combiner. Use a few large physical sockets rather than an unrestricted neural-network editor. The player cannot move individual data points or draw an arbitrary final boundary.

A hinge clamps a negative pre-activation to zero. It does not reflect it into a positive coordinate. The visual must show disappearance/compression on one branch, with the other branch optionally retaining information.

### Core chambers

| Chamber | Situation and tools | Completion | New reasoning |
| --- | --- | --- | --- |
| 1. The one-sided gate | Positive and negative samples along one axis; one ReLU hinge | Route positive signal, suppress negative signal | A threshold acts differently on opposite sides |
| 2. Opposite corners | Four square corners; matching family on opposite corners; affine plates and two ReLU branches | Correctly classify all four points | A straight separator cannot solve this pattern; a non-linear representation can |
| 3. The lost sign | Distinguish negative samples that one ReLU branch maps to zero; add an opposite-sign branch | Retain enough information for both receivers | A discarded coordinate is not recovered merely by unfolding the display |

Optional chamber: classify several points around a diamond using four ReLU branches. This is a later authoring task, not a promised solved level. Sandbox: compare linear, ReLU, and leaky ReLU with the same fixed samples.

### First minute

One negative pulse visibly sticks at zero while a positive pulse passes. The player changes the bias and sees exactly which samples switch sides. The second chamber then makes that single tactic insufficient: identical labels occupy opposite corners, and an affine-only configuration always leaves a mistake. A hinged branch is already visible in the tool tray; discovering its use is the puzzle.

### Mathematical contract and checked example

For the four inputs `(1,1)`, `(-1,-1)`, `(1,-1)`, `(-1,1)`, assign the same-sign corners to family A and the other corners to B. Define:

```text
s  = x₁ + x₂
h₁ = ReLU(s)
h₂ = ReLU(-s)
u  = h₁ + h₂ = |x₁ + x₂|
class A if u ≥ 1; otherwise class B
```

A produces `u=2`, B produces `u=0`. The visible post-hinge plane can show `(h₁,h₂)`, with a fixed diagonal separator `h₁+h₂=1`. This is a two-unit hidden representation and a linear output rule. It is not a claim that ReLU itself is an absolute-value fold.

An affine-only map followed by a linear classifier remains a linear classifier of the input. Opposite class corners on this square have intersecting convex hulls, so that family arrangement cannot be strictly separated by one line.

### Feedback, failure, and learning

Preserve sample identities through the transformation. A misrouted point freezes its input, pre-activation, and output together. Collapsed samples form a stacked marker with a count and selectable IDs, not an indistinguishable glow.

Completion requires every authored sample to be classified with a margin from the separator. The displayed verification set is part of the puzzle; do not imply it proves classification of all possible unseen inputs.

The post-game explanation identifies where the circuit stops being affine and links this to feed-forward blocks. The original transformer paper describes the attention and feed-forward components; our small sorting puzzle is an independent illustration. [Primary reference](https://arxiv.org/html/1706.03762v7).

**Prototype gate:** the player can point to the moment a previously inseparable arrangement becomes separable. If the scene is merely a folding animation, redesign it.

## 7. Game 03 — Contour Pilot

### Fantasy, view, and objective

Guide an optimiser probe down an illuminated topographic table. You control its learning rate and momentum; the gradient controls the direction of each update. Bring the probe into a low-loss operating region within a finite update budget, without unstable growth.

The current position, local downhill arrow, last update, and path are always visible. The table is shown from above with shallow relief; height is loss. A compact loss history uses the same update index as the trajectory.

**Core loop:** inspect the local slope and previous step → choose update settings → advance one or a small batch of updates → inspect loss and oscillation → adjust or rewind.

### Interaction and difficulty

Choose short/medium/long learning steps with precise values visible. Momentum is a detented dial. Early play offers single updates; later chambers permit batches of four. No “press forward forever” movement. No independent steering, teleporting to the goal, or changing the loss surface during a trial.

The decision is between slow progress, overshooting, and carrying useful momentum. A rejected trial can be rewound to any recorded update, retaining the loss landscape and restoring velocity as well as position. Retry uses the same starting state, not a new random seed.

### Core chambers

| Chamber | Situation | Completion | New reasoning |
| --- | --- | --- | --- |
| 1. The bowl | Well-conditioned quadratic, momentum locked off | Reach the marked loss tolerance within the update budget | A larger step can be useful until it overshoots |
| 2. The ravine | One steep axis and one shallow axis, momentum unlocked | Low loss and low velocity within 40 updates | The rate that helps one axis may destabilise another |
| 3. Two hollows | Authored smooth non-convex terrain and a visible required loss threshold | Reach a qualifying basin from one of the allowed starts | Flat ground can be locally satisfactory but miss the task's loss target |

Optional challenge: beat your own valid update count while retaining the full previous trace. Sandbox: reveal the whole landscape, change the start, and compare two optimiser runs.

### First minute and mathematics

In the bowl, the default short step moves clearly toward the receiver but does not reach it. A long step crosses to the other side. Undo restores the state instantly. Choosing the middle step produces a smaller miss. This is the first useful experiment.

The toy optimiser is precisely:

```text
vₜ₊₁ = μvₜ − η∇L(θₜ)
θₜ₊₁ = θₜ + vₜ₊₁
```

For the ravine fixture use `L(x,y)=½(x²+16y²)`, start `(2,1)`, velocity zero. For constant `η=0.08` after 40 updates, locally calculated losses are approximately `0.002535` with `μ=0` and `3.54×10⁻⁹` with `μ=0.6`. At `η=0.18, μ=0`, the steep component diverges. These values establish a feasible example, not a universal recommendation.

Suggested ravine pass contract: `L<0.01` and `||v||<0.02` by update 40. Both checked stable examples qualify. Tune the introductory level separately. Pause on a non-finite state or an explicitly displayed instability bound; do not clamp position to the plot and pretend training continued normally.

Momentum's behaviour depends on the function and parameters. The source article motivates using a quadratic whose behaviour can be analysed. [Goh's explanation](https://distill.pub/2017/momentum/).

### Feedback and learning

A trial that misses shows its earliest informative event: overshoot, repeated oscillation, or budget exhausted above the target. It offers “retry from this update” and a specific observation, not an instruction that gives away the next control setting.

The final explanation overlays `η∇L`, carried velocity, and actual update. It distinguishes training from inference and avoids calling the probe a physical ball obeying gravity.

**Prototype gate:** players change settings in response to the trajectory. If most simply hold Run until completion, the chamber lacks a meaningful constraint.

## 8. Game 04 — Query Loom

### Fantasy, view, and objective

Weave a required output vector from several available value signals. Outer posts carry keys; distinct inner carriers hold their values. Rotating and extending a query changes how strongly each key responds. Those responses become weights, and weighted value contributions build the output.

A receiver is deliberately placed between available values. Selecting the single strongest source cannot solve the central chamber.

**Core loop:** aim query → inspect changing weights and contribution vectors → adjust concentration → send the combined output → compare to the target.

### Interaction and choices

The query is a large two-dimensional handle with direction and length controls. A temperature ring changes concentration in later chambers. A key can be inspected but cannot be directly assigned a weight. Value positions are fixed by the chamber.

Keys and values are visually separate, linked by an ID and a short connector. The loom threads show weights; the output construction shows `wᵢvᵢ`. Do not use the same geometry for both concepts merely because it is easier to draw.

### Core chambers

| Chamber | Situation | Completion | New reasoning |
| --- | --- | --- | --- |
| 1. Find a contributor | A target close to one value; distinct keys | Output error below a visible tolerance | The query scores keys, which select contributions from values |
| 2. The missing value | Target lies between two available value vectors | Match the target with a genuine mixture | Highest attention is not the output |
| 3. Same key, new cargo | Keep keys, permute attached values, and change the target | Rebuild a working mixture | A good key match and the content retrieved are different roles |

Optional challenge: use two small heads whose outputs are combined by a fixed displayed linear map. Keep this outside the core scope until single-head play is clear. Sandbox: move synthetic keys and values, and inspect unreachable regions.

### First minute and mathematical contract

On entry, the query already produces a visible miss. Moving it toward one key brightens that post, but the output moves toward that post's attached value elsewhere in the machine. This establishes the distinction through action before giving the names Q, K, and V.

For the four-key fixture:

```text
k₁=(1,0), k₂=(0,1), k₃=(-1,0), k₄=(0,-1)
v₁=(2,0), v₂=(0,2), v₃=(-2,0), v₄=(0,-2)
sᵢ=q·kᵢ/(√2 τ)
w=softmax(s)
o=Σ wᵢvᵢ
```

At `τ=1` and `q≈(1.553672,1.553672)`, the weights are `(0.45,0.45,0.05,0.05)` and output is `(0.8,0.8)`. A query disk of radius 3 contains this solution. It is a checked, reachable mixture target. Swap the attached values in chamber three so a previously useful direction ceases to work.

Use maximum-score subtraction in the softmax calculation. Pass when output error is within 0.04 units and all chamber constraints hold. Compute that from model state; neither thread brightness nor rounded percentages decide success.

### Failure, feedback, and learning

The actual output and target stay adjacent, with a mismatch vector. Selecting that vector expands its weighted contributors. A value outside the reachable region is never an accidental required target; authoring validates each target with a witness query.

Temperature is an educational control over this toy attention distribution. Do not describe it as the same operation as sampling the model's final next-token probabilities. The attention rule is grounded in the transformer paper; these keys, values, and receiver fixtures are synthetic. [Primary reference](https://arxiv.org/html/1706.03762v7).

**Prototype gate:** a player who initially pursues a single source discovers that mixing two contributions is necessary and can show which two.

## 9. Game 05 — Phase Observatory

### Fantasy, view, and objective

Repair a positional instrument whose numbered signal anchors have lost their relationships. Each anchor drives a fast and a slow rotary pair. Connect the anchor with the required relative phase signature, then transport the connected pair without changing that relationship.

Two luminous rings form the main apparatus. A straight indexed rail beneath them keeps token positions concrete. The machine presents absolute positions, relative offset, and pair phases together. It has no endless tunnel ride.

**Core loop:** compare target phase signature → move a token anchor along the indexed rail → watch both rotors turn → resolve aliases → lock the pair → shift both anchors and test the connection.

### Controls and genuine decisions

Drag anchors between integer positions or use ±1 buttons. In later chambers, a bridge grip shifts both anchors together. Rotor angles are driven by positions; they cannot be independently set to a convenient answer. Frequencies are fixed in core play.

There is no reaction-time window. Rotation is an inspectable representation of an integer move. Motion can be stepped or snapped with identical results.

### Core chambers

| Chamber | Situation | Completion | New reasoning |
| --- | --- | --- | --- |
| 1. The first clock | One rotary pair; short bounded rail | Match a target relative phase | Position increments produce rotation |
| 2. The alias | Two candidate offsets share the fast phase; a slow pair becomes available | Match both signed pair phases over the allowed rail | One clock can repeat while another still distinguishes positions |
| 3. Moving origin | A connected pair must occupy a new part of the rail | Reach the marked destination while preserving the required phase signature | A common shift leaves the relative relationship unchanged |

Optional challenge: identify the signed offset from three frequency pairs in a longer finite range. Sandbox: change a frequency and see which offsets become difficult to distinguish at the displayed tolerance.

### First minute and checked example

The first anchor is fixed at `m=2`. Advancing the other by one token makes the fast hand turn a quarter revolution. A hollow target hand shows the desired phase. The next chamber offers two plausible destinations: both satisfy that clock. The slow ring splits them visibly, giving the second clock a practical purpose.

Use toy frequencies `ω₁=π/2` and `ω₂=π/7`, with relative offset `Δ=n−m`. Offsets `1` and `5` have the same fast phase modulo `2π`; their slow phases are `π/7` and `5π/7`. A finite offset range `0…15` avoids the joint repetition at 28. The game identifies signed phases using arrow orientation, not cosine alone.

The underlying relation is:

```text
(R(mω)q)ᵀ(R(nω)k) = qᵀR((n−m)ω)k
```

A common shift `m←m+c, n←n+c` preserves the dot product for fixed content vectors. Match both phase arrows within an angular tolerance and satisfy rail constraints; also display the corresponding dot products. The paired arrows retain directional information that a scalar cosine by itself loses.

### Feedback, learning, and scope boundary

When only one ring matches, that lock closes while the other remains visibly offset. A failed move shows which relative phase changed. During a common shift, absolute hands rotate while a difference hand stays fixed. This is the main reveal.

The toy rational frequencies are chosen to make aliases understandable. Real RoPE uses many coordinate pairs; it is not a universal, collision-free address decoder, and individual pair scores need not decrease monotonically with distance. The game demonstrates relative dependence, not a claim that twisting a frequency automatically extends a real model's reliable context. [RoFormer](https://arxiv.org/html/2104.09864v5).

**Prototype gate:** after shifting both anchors, the player predicts that the connection survives. If play reduces to matching pretty dials without this discovery, rework the third chamber.

## 10. Game 06 — Superposition Array

### Fantasy, view, and objective

Build a small representation system under a dimensional budget. Several signal identities must share a vector space. Assign each a direction from a visible candidate bank, then transmit a known sequence of sparse signals through the shared representation and recover their identities.

Signal cards hang around a compact coordinate instrument. Connections brighten when directions interfere. A small Gram matrix and decoder strip show facts that a projected constellation cannot faithfully show alone.

**Core loop:** assign directions → inspect pairwise interference → run a sparse input sequence → see false activations or missed signals → revise the codebook or spend a dimension.

### Interaction and constraints

Select a signal card and a candidate direction. In two dimensions, a direction can also be rotated directly; higher-dimensional candidates show actual coordinate bars. The core game uses a finite candidate bank so choices are legible and authoring can establish feasibility.

Adding a dimension costs from the chamber's explicit budget. It is a strategic resource, not a continuously rising success meter. The incoming workload is fixed and visible; the player cannot remove troublesome test cases.

### Core chambers

| Chamber | Situation | Completion | New reasoning |
| --- | --- | --- | --- |
| 1. Shared wires | A small candidate bank in two dimensions; one active identity at a time | Recover all listed single-signal inputs | Directional codes can be read by matching them |
| 2. Four into three | Four identities, three dimensions; single and paired inputs; candidates include tetrahedral directions | Correctly recover every listed input | More identities than dimensions can work for a restricted sparse workload |
| 3. Crowded transmission | Denser inputs reveal a failure; a limited dimension upgrade and new candidates become available | Recover the new workload within the revised budget | Capacity depends on co-activity and interference, not just the number of labels |

Optional challenge: solve an authored larger bank with the smallest dimensional budget. Sandbox: compare random unit-direction cosine histograms at increasing dimensions, with sample count and seed visible.

### First minute

Two cards initially use the same direction. Transmitting either illuminates both decoder outputs. The player assigns one a different direction and watches the false response disappear. The next chamber gives four cards but only three coordinate channels; the puzzle becomes how to share rather than how to add another independent axis for each card.

### Mathematical contract and checked sparse example

For unit code vectors `vᵢ`, non-negative activity vector `a`, and fixed threshold `t`:

```text
z = Σ aᵢvᵢ
sⱼ = vⱼ·z = aⱼ + Σᵢ≠ⱼ aᵢ(vⱼ·vᵢ)
predict identity j active when sⱼ > t
```

The decoder is deliberately simple and explicitly labelled. Core inputs have binary activity. Score identity recovery, not exact reconstruction of all amplitudes.

A useful three-dimensional codebook is the four unit tetrahedral vectors:

```text
( 1, 1, 1)/√3     ( 1,-1,-1)/√3
(-1, 1,-1)/√3     (-1,-1, 1)/√3
```

Every different pair has dot product `−1/3`. With threshold `t=0.5`, a single active code scores `1` and all others `−1/3`. With two active codes, active scores are `2/3` and inactive scores `−2/3`: both identities are recovered. With three active codes, each active score is `1/3`, so the same decoder misses them. With all four active, the representation is zero.

This provides a concrete sparse success and dense failure. It is not lossless compression of arbitrary four-dimensional data. For the core third chamber, allowing four orthogonal unit axes in four dimensions is a known recovery path; optional overcomplete alternatives can come later. Keep the threshold fixed so lowering it cannot bypass the intended capacity question.

### Feedback and conceptual care

Show the exact failing activity set, decoded set, and contributing correlations. Negative interference can suppress an active signal; positive interference can invent one. Both must be visible. The candidate's high-dimensional coordinates are authoritative; decorative distances on the stage are not.

The sandbox introduces concentration of cosine similarities near zero for random directions as dimension grows. Explain that this statistical tendency and the crafted tetrahedron are different constructions. More dimensions do not guarantee every random codebook works for every workload. Sparse feature superposition is grounded in the toy-model literature; our fixed codebook/threshold decoder is an original small demonstration, not a trained neural network. [Primary reference](https://arxiv.org/abs/2209.10652).

**Prototype gate:** the player deliberately chooses a codebook that supports the workload, then understands why increasing simultaneous activity breaks it. If the only useful action is “add dimensions,” redesign the level.

## 11. Game 07 — Nullspace

### Fantasy, view, and objective

Restore a clean signal by removing a recurring disturbance from a cloud of vectors. Rotate a projection plane and choose how strongly it acts. Preserve a marked useful component while reducing the nuisance component across the entire test set.

The stage shows incoming vectors, a movable plane, and outgoing traces. Removed components remain as faint perpendicular segments with a distinct hatch. A separate source reference prevents a flattened cloud from becoming an empty or ambiguous view.

**Core loop:** compare clean reference and contaminated samples → orient the filter → choose strength → run all probes → inspect retained signal and residual nuisance → refine.

### Controls and decisions

A plane has two rotational handles or equivalent angle steppers; its normal is always shown. A strength control sets `α∈[0,1]`. Early play uses discrete candidate normals; later play permits bounded continuous rotation.

The filter applies to all samples. Individual points cannot be corrected by hand. Preview shows the parallel component about to be removed and the component that will remain.

### Core chambers

| Chamber | Situation | Completion | New reasoning |
| --- | --- | --- | --- |
| 1. Remove the hum | Nuisance perpendicular to useful signal; simple orientation choices | Suppress nuisance and preserve signal across all samples | A projection can remove one component without changing orthogonal information |
| 2. Find the direction | The nuisance axis is oblique and several samples share it | Discover a filter meeting both tolerances | The important direction need not be a displayed coordinate axis |
| 3. Shared information | Useful signal and nuisance overlap; normal is fixed to the identified nuisance axis | Meet a feasible compromise contract for residual nuisance and signal retention | Removing a direction can damage useful information that shares it |

Optional challenge: compare two feasible filters on a visible preservation/error tradeoff curve. Sandbox: restore the original vectors, choose another normal, and compare both projections.

### First minute and checked example

Several incoming points alternate above and below a reference trajectory. Selecting the plane whose normal follows that variation makes the outgoing points coincide with the trajectory. The rejected components remain visible, making the subtraction intelligible. A second plane removes part of the desired trajectory as well, giving the player an immediately meaningful comparison.

For a unit normal `r`, the filter is:

```text
Pα = I − αrrᵀ
x′ = Pαx
removed component = α(x·r)r
```

At `α=1`, `rᵀx′=0`; components orthogonal to `r` are unchanged. With `x=(3,1)` and `r=(1,1)/√2`, the removed component is `(2,2)` and the output is `(1,−1)`. The implementation embeds this two-dimensional fixture in the visible three-dimensional instrument without changing its calculation.

For the compromise chamber, let unit useful direction `s` be 45° from fixed nuisance direction `r`. The nuisance probe retains amplitude `1−α` along `r`; the useful probe retains amplitude `1−α/2` along `s`. A contract of nuisance residual `≤0.45` and useful amplitude `≥0.65` allows `0.55≤α≤0.70`. At `α=0.6`, the values are `0.4` and `0.7`.

These are separate nuisance-only and signal-only probes, displayed alongside the mixed inputs. “Amplitude along s” is not the total output norm and is not labelled as complete signal fidelity. Show the distortion vector too.

### Failure and learning

A wrong normal highlights the useful component it would delete. Full strength in the final chamber visibly violates the preservation requirement; partial removal becomes a considered engineering choice. Restoring input reloads the saved source; it is not an inverse operation on information already discarded.

The explanation connects projection to activation editing and links the site's interpretability research. The synthetic nuisance is not called refusal, truth, or a specific real-model behaviour. Research found useful directions in particular models and settings; it does not establish that arbitrary behaviours are cleanly isolated or that deleting them preserves everything else. [Primary reference](https://arxiv.org/abs/2406.11717).

**Prototype gate:** the player notices both what was removed and what was preserved, and chooses partial removal when complete removal damages the desired signal.

## 12. Teaching through play

Each game's final core chamber is a transfer task: the same rule appears under a changed arrangement, input set, or constraint. Passing a tutorial by following a highlighted handle is not sufficient evidence of understanding.

| Game | Unaided transfer question, expressed through play |
| --- | --- |
| Basis Foundry | Route a new constellation without changing individual points |
| Hinge Engine | Keep a distinction that a single clamping branch destroys |
| Contour Pilot | Stabilise a trajectory after the ravine becomes steeper |
| Query Loom | Rebuild an output after values change but keys stay fixed |
| Phase Observatory | Move the origin without breaking the relationship |
| Superposition Array | Adapt to increased simultaneous activity |
| Nullspace | Preserve useful signal when its direction overlaps the nuisance |

After a solution, show one sentence of discovery and an optional replay with equations. The explanation uses the player's own values. A deeper “In an LLM” tab connects the toy mechanism to the relevant architecture or research, with explicit limits. There is no mandatory quiz, confetti, XP system, or lecture gate.

## 13. Accessibility, performance, and device requirements

All core actions must work on touch alone, keyboard alone, and with reduced motion. Selected objects expose native DOM controls and text descriptions; canvas is the presentation, not the only interaction surface. Provide a numerical/schematic mode in which the same puzzle can be operated without reading a perspective scene.

Use at least 44 CSS pixel touch targets, with larger invisible handle hit regions where necessary. Never require hover, two-finger precision, simultaneous key presses, fine motor dragging, stereo sound, or differentiating colours alone. Announce discrete selection, failure, and completion events; do not stream every animation frame to a live region.

Treat 60 fps as the normal target and a stable 30 fps as the low-power target on the review iPad. These are proposed budgets, not measured guarantees. Cap decorative complexity, pixel density, and glow passes before reducing the information needed to play. Only the active game animates; backgrounded pages suspend simulation and sound. Resize/orientation changes preserve the committed puzzle state.

No mandatory network calls after assets load. No model inference, API keys, login, external analytics, or WebGPU requirement. The collection remains compatible with static hosting. The implementation plan identifies where rendering choices need device evidence.

## 14. Definition of a successful redesign

A player can tell what they are manipulating, what outcome they want, and what changed after an action. They can fail in a way that suggests another hypothesis, undo without penalty, and eventually make the machine work through a mathematical relationship.

The presentation feels native to Chinese Room: restrained, geometric, technical, and atmospheric. Every game is recognisable from its action as well as its appearance. Every core concept has a truthful mathematical model and a concrete playable example.

These are design hypotheses to validate. The first production decision is to build and evaluate Basis Foundry, while proving the gameplay of Phase Observatory and Superposition Array early. Do not spend seven games' worth of art production before discovering whether their core loops work.
