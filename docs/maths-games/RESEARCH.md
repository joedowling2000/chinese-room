# Mathematical games — research and design direction

Research date: 25 October 2026. Status: source review and design synthesis, not a playtest report.

Read next: [Seven-game design](DESIGN.md) · [Implementation plan](PLAN.md).

## Brief and scope

Replace the seven Abstract maths experiences with games that are educational, atmospheric, abstract, and recognisably mathematical/engineering experiences. The core topics remain linear maps, non-linearity, gradient descent, attention, rotary position encoding, high-dimensional representations, and projection/ablation. The Field identity of Chinese Room remains the visual home.

The current request is research, design, and planning. These documents propose a new interaction model; they do not implement or publish it. “Original brief” here means the user's stated educational/play brief and the seven concepts already represented in the repository. There is no separate original game-design brief in the inspected Markdown files.

## What the current implementation teaches us

This diagnosis combines source inspection with the browser observations from the preceding iteration. It is not evidence from a study of other users.

| Current approach | Why it falls short | Requirement for the replacement |
| --- | --- | --- |
| Shared walk/look controls across very different ideas | Camera activity often has no bearing on the mathematics | Every game's main input changes the system that decides the outcome |
| Attractive mathematical scenery | Looking around can be the whole activity | There must be a manipulable object, a destination/constraint, and a meaningful alternative action |
| Slider settings with challenge thresholds | A meter filling can reward compliance without understanding | Puzzles must require a relationship, construction, prediction, or tradeoff |
| A common movement pad | It suggests comparable controls where the underlying behaviours differ | Share input conventions, but give each concept its own verb |
| One full-screen camera and large text overlays | The player can lose the object or need prose to understand a change | A stable overview keeps the complete problem legible; detail is optional |
| Reaching a number and continuing | There is little reason to experiment again | Preserve the player's solution and expose another valid or more efficient solution |

The recent challenge cards improve feedback, but they do not supply seven new game systems. The next version should replace the interactions rather than extend those cards.

## Precedents: what to learn, and where to stop

The observations below come from official game descriptions, developer writing, or the interactive work's own page. The proposed applications are our design judgments. None of these references is a template to reproduce, and no external game assets are proposed for reuse.

### 1. Miegakure — make the mathematical law usable

Marc ten Bosch describes choosing a small, comprehensible set of objects and coupling what the player can see to where they can move. His 4D interaction follows from the geometry, rather than adding arbitrary mechanics around it. [Developer design essay](https://marctenbosch.com/news/2014/10/nature-as-designer-there-was-only-one-way-to-design-miegakure/).

**Application:** keep each chamber small enough to reason about. Changing a basis, phase, or projection must move the actual puzzle objects. Retain visible reference points during every transformation. **Boundary:** the high-dimensional game will not pretend a 3D star field is a literal view of a 128-dimensional representation.

### 2. Manifold Garden — atmosphere from a coherent spatial rule

The official description combines repeating geometry with gravity manipulation. The walkthrough introduces the action through reachable objects and surfaces whose relationships change with gravity. [Official description](https://manifold.garden/presskit/) · [Official walkthrough](https://manifold.garden/walkthrough).

**Application:** use repetition, monumental scale, and sparse colour as a setting for understandable operations. Let solving a chamber visibly restore a structure. **Boundary:** infinite environments and free walking are not requirements. A compact machine can feel vast without making the player search empty space.

### 3. Opus Magnum — build, run, inspect, improve

Zachtronics describes open-ended machine-building puzzles with distinct optimisation measures: simplicity, speed, and compactness. [Official game page](https://www.zachtronics.com/opus-magnum/).

**Application:** the player builds a mathematical mechanism, runs a short deterministic trial, sees where it fails, and revises it. Completion comes before optional efficiency. **Boundary:** do not import a programming language, intimidating manual, competitive leaderboard, or production-chain scale into this site.

### 4. Euclidea — verify the property, not the prescribed solution

The official FAQ says the game checks the target construction, and explains why an approximate visual coincidence is insufficient. It also distinguishes alternative construction costs. [Official FAQ](https://www.euclidea.xyz/faq).

**Application:** accept any allowed configuration that meets the mathematical contract. Define numerical tolerances explicitly and visibly show errors. **Boundary:** continuous browser controls need tolerances; we should not claim exact symbolic construction when evaluating floating-point geometry.

### 5. Patrick's Parabox — get depth from a small grammar

The official page presents recursion through boxes entering and leaving other boxes, with authored puzzles intended to introduce distinct ideas. [Official game page](https://www.patricksparabox.com/).

**Application:** introduce one rule, then make its consequence surprising. A new chamber earns its place by changing the reasoning required. **Boundary:** seven experiences should not become seven skins on one box-pushing game.

### 6. COCOON — give abstract operations a tangible carrier

The publisher's announcement describes portable orbs containing worlds that can be combined and rearranged to solve puzzles. [Publisher announcement](https://static1.squarespace.com/static/6295c3471d67ad0205500ef1/t/62a6082f17d571139e2c757c/1655048241807/COCOON_Press%2BRelease.pdf).

**Application:** make a matrix a plate, a projection a filter, and a positional phase a pair of coupled rings. The object is an interface to a real mathematical operation. **Boundary:** no creatures, combat, or narrative cutscenes are needed to make the machinery feel alive.

### 7. Explorable Explanations — let the learner test a claim

Bret Victor argues for environments where readers can vary assumptions and see consequences, using linked representations to expose behaviour. [Original essay](https://worrydream.com/ExplorableExplanations/). The wider Explorable Explanations collection explicitly brings play and learning together. [Collection](https://explorabl.es/).

**Application:** the world, schematic, and numerical readout must share one state. After solving, “Why did that work?” should replay the player's own construction. **Boundary:** an interactive explanation alone is not the game; it needs a goal and meaningful choices.

### 8. TensorFlow Playground and Distill — make failure inspectable

TensorFlow Playground exposes data, intermediate activations, parameters, and outcomes together. [Original interactive](https://playground.tensorflow.org/). Gabriel Goh's momentum article uses a tractable quadratic to connect parameter choices with different trajectories. [Distill article](https://distill.pub/2017/momentum/).

**Application:** expose a small number of useful controls, a trajectory, and the failing component. Use an analytically understood ravine for the first descent prototype. **Boundary:** do not copy a dashboard full of controls or imply momentum always helps.

## Mathematical source anchors

| Concept | Primary source reviewed | Consequence for the proposed game |
| --- | --- | --- |
| Attention and feed-forward non-linearity | [Vaswani et al., Attention Is All You Need, §§3.2–3.3](https://arxiv.org/html/1706.03762v7) | Keep keys and values distinct; demonstrate a weighted output. ReLU is an introductory non-linearity, not a claim that all current models use it. |
| Rotary encoding | [Su et al., RoFormer, §3](https://arxiv.org/html/2104.09864v5) | Rotate coordinate pairs and demonstrate common-position-shift invariance. A torus ride alone does not demonstrate this property. |
| Superposition | [Elhage et al., Toy Models of Superposition](https://arxiv.org/abs/2209.10652) | Make sparsity and interference part of the game. Packing features is not lossless storage of arbitrary dense vectors. |
| Direction removal | [Arditi et al., Refusal in Language Models Is Mediated by a Single Direction](https://arxiv.org/abs/2406.11717) | Teach the projection operation with synthetic signals; distinguish a controlled toy problem from claims about whole-model behaviour. |
| Gradient descent and momentum | [Goh, Why Momentum Really Works](https://distill.pub/2017/momentum/) | Use real optimiser steps; the player chooses update parameters, not an arbitrary steering direction. |

The design's small matrices, XOR fixture, codebook, phase periods, and filtering examples are original toy constructions. They are derived explicitly in the design document. They are not experiments or results reported in these papers. Only the superposition paper's abstract was retrieved successfully here; its large interactive article failed to load. More detailed implementation claims should be checked against the full paper during mathematical review.

## Synthesis

The proposed collection is **The Field Instruments**: seven machines the player brings into working order. The scene is an abstract mathematical structure; the activity is a compact puzzle; the reward is seeing the structure operate as a consequence of the solution.

Four decisions follow from the research:

1. **Design the puzzle before the scenery.** Verify an interesting, solvable relationship with simple geometry first.
2. **Make interaction spatial and direct.** Handles, plates, anchors, and signal paths are both the controls and the explanation.
3. **Teach through a changed constraint.** The second chamber should make an earlier tactic insufficient for a reason the player can see.
4. **Keep atmosphere subordinate to perception.** Depth, glow, sound, and scale can intensify the experience; none may conceal the variables that decide success.

## Research limits and next evidence

This is a researched proposal, not seven validated games. The reference review establishes useful design patterns, not proof that our adaptations will be enjoyable. The numerical examples were checked with small local calculations; the proposed full level sets have not been implemented or solved exhaustively.

The next evidence should be a playable vertical slice of Basis Foundry on the user's iPad, followed by early prototypes of the two riskiest concepts: Phase Observatory and Superposition Array. Judge unaided play, ability to explain an outcome, and desire to retry before expanding production.
