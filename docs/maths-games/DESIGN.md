# Interiors

## Seven interactive artworks from inside a language model

Version 2 · 25 October 2026 · Supersedes “The Field Instruments” (v1, puzzle games). Companions: [Plan and progress](PLAN.md) · [Research](RESEARCH.md).

## 1. The brief, restated

The user's clarified brief (25 Oct 2026):

> Not complex playable games, but **interactive artistic interpretations of the maths**. Directly relevant to the mathematical concepts, educational, and abstract in that they simulate the user **being inside the LLM**. The priority is **stunning, interesting and relevant art** with which the user can interact. Each of the seven must be **directly relevant** to its concept, and that relevance must be **identifiable by the user**. All seven must be **distinct**. Be ambitious.

So the success test for each piece is, in order:

1. **Stunning.** A screenshot of it, untouched, should be something you'd want on a wall. Full-bleed, moving, luminous.
2. **Identifiable.** Within ~10 seconds of touching it, a viewer can say what mathematical idea it's about. The picture *is* the maths, not a decoration around it.
3. **Responsive.** Touch/drag/scroll changes the artwork immediately and meaningfully. Every interaction maps to a real variable.
4. **Truthful.** What moves on screen is computed by the real operation (matrix product, ReLU, softmax, gradient step, rotation, projection). Synthetic data is labelled synthetic.
5. **Educational, quietly.** A one-line caption, a live equation with the viewer's own numbers, and a short "where this happens in the model" note. All optional, none blocking.

No levels, scores, chambers, trials, win conditions or hint systems.

## 2. Framing: you are a token

The site is called Chinese Room — Searle's thought experiment about a person inside a room who manipulates symbols by rule without understanding them. *Interiors* puts the viewer inside that room. Each artwork is one room the token passes through, and the viewer is the token (or the training process):

| # | Concept (route id) | Artwork | Medium / aesthetic | The viewer is… |
|---|---|---|---|---|
| 01 | Linear maps (`linear-maps`) | **Lattice** | Infinite architectural grid of luminous word-stars, moiré of before/after grids | standing in embedding space as a weight matrix bends it |
| 02 | Non-linearity (`folding`) | **Kaleidoscope** | A turning kaleidoscope whose mirrors are ReLU neurons; each mirrored copy is one linear region | inside a feed-forward block, painting on a plane its neurons fold |
| 03 | Gradient descent (`gradient-descent`) | **Descent** | Ridgeline topography (Joy Division *Unknown Pleasures*) with long-exposure light trails | the training process, dropping seeds onto the loss landscape |
| 04 | Attention (`attention`) | **Loom** | String art: words around a circle woven by weighted threads, one colour per head | a word asking every earlier word a question |
| 05 | Rotary position (`rotary`) | **Orrery** | Brass-and-silver astrolabe of many-handed clocks, spirograph traces | a token whose position is written as rotation |
| 06 | High dimensions (`dimensions`) | **Crowded Sky** | Rotating celestial sphere of feature-stars settling into polyhedra; interference filaments | one feature among too many, sharing too few dimensions |
| 07 | Projection / ablation (`ablation`) | **Nullspace** | A cloud of 6,000 smoke-particles sliced by a blade of light | an interpretability researcher deleting one direction |

Each has a different dominant visual primitive (grid lines / filled polygons / stacked ridgelines / curved threads / circles and epicycles / points on a sphere / particle volume), a different colour family, and a different verb (bend / crease / drop / ask / shift / crowd / cut). No two share a layout.

## 3. Shared frame (minimal chrome)

The artwork fills the viewport. Chrome is a thin overlay that fades after 4 s without pointer movement and returns on movement/tap.

```text
┌───────────────────────────────────────────────────────────────┐
│ ← Interiors   04 / LOOM                 maths  ·  sound  ·  ✕  │
│                                                               │
│                       [ full-bleed artwork ]                  │
│                                                               │
│ Softmax attention                                             │
│ out = Σ softmax(q·kᵢ / τ) vᵢ                                  │
│ Every word asks every earlier word a question.                │
│ › tap a word to make it ask                     [ dock: ≤4    │
│                                                   controls ]  │
└───────────────────────────────────────────────────────────────┘
```

- **Title + equation + one-line caption** (bottom-left). Since 27 Oct 2026 the title is the maths the piece conveys ("Softmax attention"), with its equation directly underneath; the artwork's own name (Loom) moves to the header label. The same maths-first titles lead the gallery tiles, the `#maths` topics and the directory cards. The caption states the concept in plain words.
- **Prompt** (`›` line): a short instruction that tells you what to touch first. It changes as you go, so the piece guides you through 3–4 discoveries ("now drag ĵ onto î"), without blocking anything.
- **Dock** (bottom-right): at most four controls — sliders, toggles or presets — each mapped to a named mathematical quantity.
- **Maths drawer** (toggle, right side): the live equation with the viewer's current numbers, a 3–5 sentence plain-English walkthrough, an "Inside the model" paragraph and the primary reference. Updates in real time.
- **Sound** (off by default): a quiet generative drone/tones driven by the same state (e.g. attention entropy, loss height). Never needed to understand anything.
- Keyboard: `M` maths, `S` sound, `Esc` back, `Space` pause motion. Touch-first; all core interaction is single-pointer drag/tap.
- `prefers-reduced-motion`: ambient drift stops; direct manipulation still works.
- Lifecycle: one rAF loop for the active piece; paused when the tab is hidden; everything disposed on exit.

The **index** (`#maths/play`) is a dark gallery: seven large live thumbnails (each piece runs a low-cost "poster" frame), with the framing text: *"You are in the room. Symbols come in under the door. You follow the rules. Seven rooms; seven rules; one language model."*

## 4. The seven pieces

### 01 · Lattice — linear maps

**Image.** A deep-perspective-free, infinite 2D lattice in mint and ivory, drawn twice: the faint original grid and the bright transformed grid, producing moiré where they cross. Thousands of tiny star-points (embedding vectors) are scattered through it, a few dozen labelled with words (*king, queen, man, woman, Paris, France, cat, dog…*) placed so analogies are parallelograms. Two large glowing arrows, **î** (mint) and **ĵ** (rose), grow out of the origin. A unit square shaded with its signed area.

**Interaction.** Drag the tips of î and ĵ. The whole space — grid, stars, words — moves with them in real time. This is the identifying moment: *two arrows determine where everything goes*. Dock: presets (identity, rotate, shear, stretch, reflect, collapse), a "breathe" toggle that animates between identity and your matrix, and "add a layer" which composes another random matrix to show stacking.

**Discoveries the prompt walks through.** (1) drag î; (2) notice every star moved, and straight lines stayed straight and parallel; (3) drag ĵ onto î's line → determinant hits 0, the whole universe collapses into a single line; words pile up and their labels overlap; a red seam marks the lost dimension; (4) flip ĵ across î → the unit square turns inside out (negative determinant).

**Maths drawer.** `M = [î ĵ]`, `y = Mx` with a live worked example on the word under the cursor: `M·(x,y) = x·î + y·ĵ`. Determinant as area. Inside the model: every Q/K/V projection and MLP layer is a big matrix doing exactly this to thousands of dimensions at once.

**Truth.** Words' positions are illustrative 2D placements, labelled “illustrative positions — real embeddings have thousands of dimensions”.

### 02 · Kaleidoscope — the ReLU activation

*Replaced Stained Glass on 27 Oct 2026 at the user's request; Stained Glass is in git history up to `49d5978`.*

**Image.** A turning kaleidoscope of marbled ink and glass beads. Every mirror is one **ReLU neuron**: it measures which side of a line a point is on, z = n·x − b, and applies the hinge to −z, x′ = x + 2·ReLU(−z)·n. On the positive side the neuron is off and the point passes through; on the negative side it switches on and reflects it. Stacked one neuron per layer, the folds cut the plane into **linear regions**, and every region shows the same patch of the folded plane, so the picture is mirrored region by region. Fine light lines are the creases (each neuron's z = 0); deeper creases bend where they cross earlier ones.

**Interaction.** Drag on empty glass to **paint**: the stroke is written into the folded plane, so it appears once in every region that covers that spot. Drag a bright crease to slide that neuron's mirror; hovering one labels it ("neuron 3: z = 0 · max(0, z) bends here") with a hinge glyph. Dock: **Activation: ReLU ↔ none**, **Layers** 1–8 (default 5), **Turn the kaleidoscope**, **Show the creases**, **Clear the paint**, **New mirrors**.

**Discoveries.** (1) paint → one stroke, many copies, all with the same network output; (2) add a layer → one more fold can double the regions; (3) drag a crease → a crease is the hinge of max(0, z), and every copy moves together; (4) ReLU off → every neuron reflects the whole plane, reflections compose into one rigid motion: one region, one copy; (5) ReLU on, 8 layers → the live region count against the at-most-37 that eight neurons side by side in one layer could make (depth multiplies, width adds).

**Maths drawer.** `z = n·x − b`, `x′ = x + 2·ReLU(−z)·n`, `ReLU(u) = max(0, u)`; live: activation, layers, regions in view, the 2ᵏ depth bound, the 1 + k + k(k−1)/2 one-layer bound, and which neurons are on at the pointer (● ○). Inside the model: the feed-forward block; GELU/SwiGLU are smooth cousins of the hinge.

**Rendering.** WebGL2 fragment shader applies up to eight folds per pixel (fold parameters as a `vec3` uniform array), draws creases from |z|/fwidth(z), shades marbled fbm ink in the folded coordinates and samples a 1536² paint texture (updated by dirty rectangle with `texSubImage2D`). Mirrors are chosen greedily so each new one leaves the most regions big enough to see. Canvas 2D fallback at quarter resolution. Poster: offscreen WebGL2 canvas.

### 03 · Descent — gradient descent

**Image.** A night landscape of stacked ridgelines (40–60 horizontal profile lines with occlusion, in the manner of the pulsar plot), each a slice through a non-convex loss surface with several valleys and a saddle. Seeds of light roll down it, each leaving a long-exposure trail (amber when moving fast, ice blue when settled). Fog hides the far ridges.

**Interaction.** Tap/click the landscape to drop seeds (or drag to scatter a handful). Each seed runs *real* momentum gradient descent on the surface: `v ← μv − η∇L`, `θ ← θ + v`. Dock: learning rate η, momentum μ, **Rain** (drop 100 seeds), **Reshape** (new landscape seed).

**Discoveries.** (1) drop a seed — it slides downhill, it can't see the valley, it only feels the slope where it is; (2) raise η → seeds overshoot, ricochet between walls, fly off the map (divergence); (3) small η, no momentum → seeds stall in shallow hollows (local minima) and creep along flat ridges; momentum carries them through; (4) Rain → the swarm partitions the world into basins of attraction.

**Maths drawer.** Update rule with live values for the most recent seed (position, gradient, velocity, loss). Inside the model: training is this, in billions of dimensions, where L is next-token prediction error and θ is every weight.

### 04 · Loom — attention

**Image.** String art. Tokens of a sentence sit around a circle as a ring of typographic pins. Threads (quadratic curves through the interior) connect each word to earlier words; thickness and brightness ∝ attention weight. Several heads woven at once in different colours produce a mandala/tapestry; threads gently vibrate. The selected query word glows with a colour that is literally the weighted mix of its sources' value colours.

**Interaction.** Tap a word: it becomes the query; its threads tighten and all others dim; small labels show percentages. Dock: **sentence** presets (coreference: *The animal didn't cross the street because it was too tired / wide*; agreement; repeated-pattern induction), **head** toggles (previous-token, coreference, noun-to-adjective, induction), temperature τ, "all queries" (full weave).

**Discoveries.** (1) tap *it*: it attends to *animal*; switch the sentence to *…because it was too wide* and the thread swings to *street*; (2) the word's own colour changes — its output is a blend of what it listened to; (3) temperature: low τ → one taut thread, high τ → a diffuse haze; (4) no thread ever goes forward — the causal mask.

**Maths drawer.** `wᵢ = softmax(q·kᵢ/√d)`, `out = Σ wᵢ vᵢ`, live table of the query's scores → weights. Inside the model: dozens of heads per layer do this in parallel.

**Truth.** Weights come from small hand-built query/key feature vectors for each head (a toy, not a trained model); the drawer says so.

### 05 · Orrery — rotary position embedding

**Image.** A silver-and-brass astrolabe. Each token in a sentence along the bottom rail owns a clock with 6 concentric hands (frequency pairs), the inner hands fast and the outer slow (θᵢ = 10000^(−2i/d), compressed for display). The selected pair of tokens are drawn as large overlaid dials in the centre; arcs between corresponding hands show the relative angle. The tip of the summed hands traces a spirograph/harmonograph curve as position advances: each token's position leaves a luminous epicycle trail.

**Interaction.** Drag the sentence along the rail (absolute shift); tap two tokens to compare; drag a token to change its position. Dock: number of frequency pairs, base (frequency spread), show trace.

**Discoveries.** (1) drag a token: its hands rotate — position *is* angle; (2) select two tokens and drag the whole sentence: every hand spins but the arcs between the two tokens' hands stay frozen — the attention score depends only on the distance; (3) fast hands repeat after a few tokens (aliasing), slow hands disambiguate — that's why there are many frequencies.

**Maths drawer.** `R(mθ)q · R(nθ)k = q · R((n−m)θ)k`, live m, n, n−m and score; frequency list.

### 06 · Crowded Sky — high dimensions & superposition

**Image.** A slowly rotating celestial sphere (or circle in 2D mode). N feature-stars, each labelled with a concept (*cat, Paris, code, sad, French, plural…*), are arrows from the centre. They repel each other and settle into the shapes found in *Toy Models of Superposition*: antipodal pairs, triangles, pentagons, tetrahedra, octahedra. Filaments join pairs with brightness ∝ |cos|, the interference. A starfield of faint random directions behind.

**Interaction.** Dock: features N (2–20), dimensions d (2 or 3 shown; plus a "high-d" histogram mode up to 1000), **sparsity** (how often features co-occur). Tap stars to activate them: the representation (sum of active arrows) appears as a white comet; every feature's readout bar shows `vⱼ·z`; false readouts above threshold flicker as ghosts.

**Discoveries.** (1) add features beyond d: they can't be orthogonal, they spread evenly; (2) activate one: clean readout; activate several neighbours: ghosts appear — interference; (3) sparsity: superposition works because few features are on at once; (4) high-d mode: random directions in 1000 dimensions are almost all ≈ 90° apart — space for far more features than dimensions.

**Maths drawer.** `z = Σ aᵢvᵢ`, `readoutⱼ = vⱼ·z = aⱼ + Σ aᵢ(vⱼ·vᵢ)`, mean |cos|, and the concentration of measure note. Reference: Elhage et al. 2022.

### 07 · Nullspace — projection / ablation

**Image.** A 3D volume of ~6,000 particles (synthetic “activations” of prompts) rendered as soft smoke, slowly orbiting. A hidden direction separates two tones: amber (prompts the model refuses) and blue (prompts it answers). A blade of light — a plane through the origin, with its normal arrow — cuts through the cloud. Removed components are drawn as faint vertical streaks between each particle and its projection.

**Interaction.** Drag to rotate the blade's normal; drag elsewhere to orbit the camera. Dock: strength α (0 → 1, the particles collapse onto the plane), **Find direction** (animates the normal to the difference-of-means direction), "show text". A strip of example prompts/completions changes tone as the amber/blue separation along the chosen direction shrinks: e.g. "I can't help with that." → "Sure — here's how…" (clearly illustrative).

**Discoveries.** (1) rotate the blade — the colour separation is visible along one axis only; (2) align it with that axis and push α to 1: the cloud flattens, amber and blue mix, the separation measure → 0; (3) align with a wrong direction: something else is lost (a second, green "topic" attribute is destroyed instead) — collateral damage.

**Maths drawer.** `x′ = x − α (x·r̂) r̂`, live separation along r̂ before/after, cosine between your blade and the true direction. Link the site's abliteration article and Arditi et al. 2024.

## 5. Visual system

- Background `#05060a` with subtle film grain/vignette; additive (`lighter`) compositing for light.
- Each piece owns an accent pair: Lattice mint/rose · Kaleidoscope marbled jewel inks with a pink accent · Descent amber/ice · Loom multi-head (cyan, coral, gold, violet) · Orrery brass/silver · Crowded Sky lavender/white · Nullspace amber/blue.
- Type: DM Sans for titles/captions, IBM Plex Mono for numbers and labels, matching Field.
- Labels have dark halos; colour always paired with shape or label.

## 6. What is deliberately out

Scores, levels, chambers, win/lose states, hint ladders, run/replay/rewind machinery, save migration. Progress is not tracked; the only persisted preference is sound on/off and maths drawer open/closed.
