# Chinese Room: editorial review and proposed revisions

Reviewed 24 October 2026. This document proposes changes; it does not change the site.

## 1. Assessment

The concern is justified. The strongest signs are repeated rhetorical patterns, generic promises and metaphors that continue long after they have explained anything. These are editorial judgements, not reliable tests of who wrote a sentence.

The site already contains a much stronger voice. The articles describe a robot built from Henry’s Lego set, a network that worked on the third attempt, an infrared thermometer borrowed from a pizza oven, and a debate host that unexpectedly started talking about ancient Rome in Arabic. These details give the reader something particular to remember. They also establish what Joe actually did.

The newer homepage and maths copy often lose that specificity. They sound like a promotional narrator introducing a sequence of attractions. Several recent additions also make technically unjustified claims. A fluent explanation that gets the mechanism wrong is more damaging to credibility than a fashionable phrase or an em dash.

**Recommendation:** use the existing project accounts as the voice reference. Make the surrounding copy direct and informative, keep the visual character, and give each maths lesson an observation the reader can test. Correct the factual overstatements before polishing the prose.

### Scope and evidence

This is a source-based review of the current local site, including the uncommitted changes made during this session. It covers:

| Surface | Source reviewed | Main finding |
| --- | --- | --- |
| Home and research index | `field.js`, especially `home()`, `research()` and `card()` | Several interchangeable slogans conceal the actual projects. |
| All four article pages | `app.js`, `articles` | Strong personal material; some sweeping explanations, factual inconsistencies and claims needing verification. |
| Lab index and both experiments | `lab.js`, including controls, calculated readouts and caveats | Functional explanations are generally good; introductory copy is more theatrical than useful. |
| Maths overview, architecture map and shared interface | `maths.js`, `page()`, `pipeline()`, `topic()`, `overlay()` and `renderGuide()` | Repeated explanatory layers; the architecture map claims more than it shows. |
| All seven maths topics and 21 guide lessons | `maths/00-journey.js` and `maths/01-linear-maps.js` through `07-ablation.js` | Excessive personification, repeated paragraph structures and several misleading analogies. |
| Models and About | `app.js`, `models`, `modelsPage()` and `aboutPage()` | Institutional wording sits awkwardly beside a personal project site. |
| Navigation, search, accessibility text and metadata | `index.html`, `app.js`, `feed.xml`; relevant CSS | Most functional labels should stay. Search failure text and a few labels prioritise the theme over the task. |

The downloadable articles were spot-checked against their HTML versions for voice and provenance: the Haskell introduction, quantization results and ending, abliteration opening, and relevant Mindcuber passages. This is not a complete technical audit of the PDFs or DOCX, nor a visual or browser usability test. Original experiment logs and model configurations were not available for independent verification.

`dist/` is generated output. The production build excludes `folio.*`, `concepts/` and `backups/`; those historical designs are not recommendations targets.

## 2. What makes the copy feel generated

### Repeated short fragments used as slogans

Examples include “Seven ideas. Seven worlds to step inside.”, “A cube. Twelve choices.” and “Turn a cube. Round a weight.” The home introduction adds another three-part sequence: “Taking open models apart. Following the mathematics. Finding out what’s really going on inside.”

A single short headline can work. Across several pages, the same rhythm makes unrelated subjects sound as though they came from one template. Replace most of these sequences with a sentence that says what happened or what the reader can do.

### A persistent promotional narrator

“Follow a question”, “Make the ideas tangible”, “Four ways into the room” and “See the ideas at work” announce intellectual value without providing it. The reader still has to find out what is on the page.

Use the space for project names, outcomes and actions. “Explore” is not a forbidden word, but “Compare INT4 and INT8 rounding” tells the visitor more.

### Too many metaphors in the same explanation

The maths visitor becomes a point, a word, a query, the model’s weights and an activation. Information is a city, a sheet, a landscape, a chamber, a tunnel and a sky. Those visual settings can be effective. The problem is asking the surrounding prose and controls to sustain the fiction.

All seven `dream.text` blocks follow substantially the same three-part structure: “You are…”, “Around you…”, “Each step you take…”. This is one of the clearest template patterns on the site.

Keep the environments. Explain what their marks and movements represent in one short paragraph. Put any additional atmospheric prose behind an optional description rather than making it the teaching voice.

### Conclusions that exceed the explanation

Examples include “Nothing else teaches the model”, “the model’s only way to move and mix information”, “the fold is what gives depth any meaning”, and “you can share one sky without colliding”.

These phrases sound decisive while removing necessary qualifications. Replace them with the mechanism and its scope. Readers can handle a sentence saying what an example does not establish, especially when it prevents a misconception.

### More text without more information

Each maths topic now has body copy, “Why it matters”, “Inside an LLM”, a formula, three lessons, lesson-specific context, notes and an optional story. The feed-forward sections repeatedly say that non-linearity prevents collapse into one matrix and that these layers hold knowledge.

Assign each area a distinct purpose:

- **Topic introduction:** what changes in this illustration.
- **LLM connection:** where the operation is used, with a concrete example.
- **Lesson:** what to try and how to interpret the result.
- **Notes:** assumptions, limits and sources.

Merge the existing `why` and `llm.role` material where they repeat one another. Keep the lesson context distinct across all three tabs.

### Manufactured informality is not a remedy

“An enthusiast, one machine, a lot of side quests” has the same polished cadence as the promotional text. Adding more jokes, contractions or deliberate mistakes would not recover Joe’s voice.

Keep existing personal details when Joe wants them public. Do not invent an afternoon of debugging, a reaction, a conversation or a measurement to make a rewrite seem personal. First-person proposals below draw on accounts already present in the articles and should still be reviewed by Joe.

## 3. What to preserve

- The specific project accounts, including the results that fell short: Mindcuber’s 37/100 result on 20-move scrambles and the quantized Mixtral model that could not be benchmarked in the reported environment.
- The existing distinction between the cube’s scramble reversal and a trained model solving a cube.
- The quantization lab’s distinction between rounding error, model quality, storage and runtime memory.
- Useful controls such as “Apply scramble”, “Reset example”, “Show the plane” and “Pause motion”.
- “A matrix moves all of space at once”, “Position as rotation” and “Delete one direction”. These are concise statements of the demonstrations.
- Personal asides already in the source articles. They may need shortening, but should not be replaced with generic enthusiasm.
- Honest attribution of model-generated material: the Gemini quotation and the Haskell agent’s philosophical speech are explicitly part of the reported experiments. Keep that provenance.

There is no case for a blanket ban on em dashes, lists, metaphors or the word “explore”. Revise sentences because of what they do to the explanation.

## 4. Priority order

| Priority | Work | Reason |
| --- | --- | --- |
| P0 | Correct the maths claims listed in section 7 and the article issues in section 9. | These can teach the wrong mechanism or undermine trust in the results. |
| P1 | Replace the home, research, About and lab introductions; shorten the maths introduction. | These passages establish the voice before a visitor reaches the stronger material. |
| P1 | Revise all 21 lesson context panels using section 8. | Each tab should add explanation rather than a new slogan or an unrelated fact. |
| P2 | Merge duplicated topic copy; shorten the seven world descriptions; clarify controls and readouts. | This reduces reading effort while preserving educational depth. |
| P2 | Revise the architecture map and make its controls meaningful. | Decorative interactivity currently promises an explanation it does not deliver. |
| P3 | Align metadata, RSS, search names, article labels and model statuses. | The same editorial decisions should hold at every entry point. |

## 5. Proposed site-wide copy changes

Quoted “current” wording below is from the source. Proposed wording is a draft, not a claim that a change has been applied.

### Home — `field.js: home()`

**Current:** “Taking open models apart. Following the mathematics. Finding out what’s really going on inside.”

**Proposed:**

> I’m Joe Dowling. I’m learning how language models work by running experiments on a DGX Spark. Here I write up the methods, results and things I couldn’t get working.

This introduces a person, a method and the scope of the site. “Inside the room” can remain as the headline if the paragraph beneath it does this work.

| Current | Proposed | Reason |
| --- | --- | --- |
| “Follow a question” / “Four ways into the room.” | “Projects” / “Recent experiments” | The project cards already supply the interest. |
| “Make the ideas tangible” / “A little less abstract.” | “Interactive examples” | Names the section. |
| “Turn a cube. Round a weight. Explore two experiments in your browser.” | “Undo a cube scramble, or compare what happens when weights are stored with fewer bits.” | Describes the available actions accurately. |
| “Scroll to discover” | “View the projects” | Says where the link goes. |
| “The residual stream / Thirty-four layers, one river” | “An illustration of a residual stream” | Removes an unexplained architectural number and identifies the artwork as illustrative. |

Do not turn every card into the same “I wanted to find out…” story. Lead with the most useful fact for that project.

### Research index and article cards — `field.js: research(), card()`; `app.js: articles`

**Current:** “Long-form write-ups of experiments on a DGX Spark. Theory first, kept readable, with the maths where it earns its place.”

**Proposed:**

> Notes from four projects on the DGX Spark, with the code, calculations and results described in each article.

“Follow a question.” can become “Project notes.” The numerical count should eventually come from the article data or be omitted, so the introduction does not go stale.

Suggested card descriptions:

| Article | Proposed description |
| --- | --- |
| Mindcuber | “I trained a network to suggest cube moves, used search to find solutions, and sent them to a Lego robot. The best checkpoint solved 37 of 100 test cubes scrambled with 20 moves.” |
| Abliteration | “I tested whether removing a direction from a model’s internal activations reduced refusal. On the reported set of 100 harmful prompts, refusals fell from 100 to 6.” |
| NVFP4 | “I quantized Mixtral on the DGX Spark. The weights got smaller, but software compatibility problems prevented the inference tests.” |
| Haskell | “Three local models debate a topic through a Haskell program. The article covers message types, state and the host that introduced the wrong debate.” |

These describe reported results, not newly verified measurements. Keep the sample descriptions when using the numbers.

Change “Read the research paper (PDF)” to “Read the article (PDF)” unless the document is being presented as a formal paper. Use “article” consistently across cards and downloads, or deliberately choose “project note”; the current mix implies different kinds of publication.

### About — `app.js: aboutPage()`

**Current heading:** “An enthusiast, one machine, a lot of side quests.”

**Proposed heading:** “About Joe”

**Proposed body:**

> My longer-term aim is to build and train a language model from scratch. The projects here cover things I’m learning along the way: training a cube-solving network, reducing model memory use, and inspecting internal representations.
>
> I run these experiments on a DGX Spark and write up what happened, including the attempts that didn’t work.

This preserves the purpose already stated on the site. Joe should decide whether “independent researcher” is his preferred description; it is not inherently wrong, but repeating it in the hero, metadata, footer and biography gives the site a more institutional tone.

### Models — `app.js: models, modelsPage()`

**Current:** “A catalogue of experiments and research artifacts. No hosted inference API is currently connected to this site.”

**Proposed:**

> Models used or produced in these projects. The entries describe their status and link to the relevant write-up.

Add the article links as part of this proposal; the current entries do not supply them. Put availability beside each entry:

- Mindcuber: “Training experiment”; clarify that the browser demonstration replays a reversal.
- Mixtral: “Quantized weights”; link the repository already named in the source PDF, after checking availability.
- Haskell: “Agent program”; describe it as using A2A-style messages, consistent with the article’s “tried to mimic” wording.
- Abliteration: “Write-up only”; “I’m not distributing the modified weights.”

Replace “Research artefact documented for transparency” with the actual subject: “An experiment in reducing refusal by removing a direction from the residual stream.”

Do not imply that an inference API is planned by saying it is “currently” unconnected. If useful, say once: “You can’t run these models on this website.”

### Search, navigation and metadata

| Source / current text | Proposal |
| --- | --- |
| `app.js: search()` — “No matches. The room has no rule for that.” | “No matches. Try a project name or a topic such as attention or quantization.” |
| `app.js: search()` — “Model registry” | “Models and experiments”, matching the destination. |
| `index.html` — “Enter the lab” | “Open the lab”; optional, low priority. |
| `index.html` description — “Independent AI research. Interpretability, quantization, reinforcement learning and agents, examined from the inside.” | “Joe Dowling’s notes on training networks, quantizing language models and building agents, with interactive examples of the maths.” |
| `feed.xml` — “A journey inside an open-weight LLM to find how refusal manifests itself.” | Use the revised abliteration summary, retaining the measured outcome and its scope. |

Keep “Search”, “Open menu”, “Skip to content”, field labels and descriptive image alternatives. Accessibility text benefits from literal descriptions. Do not replace it with the worlds’ fictional identities.

## 6. Lab review

### Lab index — `lab.js: cards(), page()`

**Current:** “Get a feel for it.” / “Move a sticker. Round a weight.”

**Proposed:**

> Try the examples
>
> The cube example shows how a scramble can be undone. The quantization example compares rounding error and estimated weight storage for several number formats.

“Move a sticker” is particularly unhelpful: the interface turns faces and replays moves, rather than letting the reader independently move a sticker.

Rename the two cards “Cube scrambles and training results” and “Rounding model weights”. “How small can a number get?” confuses numerical magnitude with storage precision.

### Mindcuber — `lab.js: cubePage(), wireCube()`

**Current:** “A network sees numbers. We see coloured stickers.”

**Proposed:**

> Start with a scramble and undo it one move at a time. Below the simulation are the network’s reported test results.

Keep the banner’s explanation that this is reversal, not inference. A shorter version is:

> This animation reverses the moves used to scramble the cube. It does not run the trained network, and the reversal may be longer than the shortest solution.

Change “What did the network manage?” to “Results at epoch 10”. Retain the 100-cube sample sizes and the separation from the 19-cube robot trial.

The footnotes are accurate in intent but repeat their limitations. Keep one explanation of aggregate results beside the results display, with additional methodology in expandable notes. Do not remove the distinction between illustrative square order and individual solve records.

Remove the promise that video “will be added when the source files are available” unless there is an actual publication plan. It reads like a development handover note left in the product. Link to the existing article instead.

### Quantization — `lab.js: quantPage(), wireQuant()`

**Current:** “Less precision. What gets lost?”

**Proposed heading:** “What changes when you round a weight?”

**Proposed introduction:**

> Choose a number format and compare 32 example weights before and after rounding. Increase the largest weight to see how it affects the other values sharing its scale.

Keep “Try increasing the largest weight. Its block must cover a wider range, leaving less precision for smaller values.” This is already the right kind of writing: an action, a mechanism and an observable consequence.

Retain the exact-value table, rounding rules, ideal-scale qualification and storage assumptions. “Weight storage estimate” would be clearer than “What could fit in memory?”, which can sound like a prediction of total runtime memory.

## 7. Maths overview and technical corrections

### Introduction and architecture map — `maths.js`

Replace the long “Seven ideas. Seven worlds…” introduction with:

> These examples cover some of the maths used in language models. Change a matrix, take a training step or adjust attention weights, then compare the result with the explanation. Each example uses a small model of the operation so you can see what changes.

The button can say “Start with linear maps”. Keep “Step inside” beside an individual diagram if it is paired with the clearer mode name “First-person view”.

The pipeline currently says **“Every world below is one stage of a real forward pass.” This is incorrect.** Gradient descent belongs to training; ablation is an intervention; high-dimensional geometry is a property of the representations. They are not successive forward-pass stages.

Proposed map introduction:

> A language model processes tokens: pieces of text that can be words, parts of words or punctuation. The map shows a simplified path from token IDs to scores for the next token. The examples below also cover how the weights are trained and how researchers study the internal representations.

Revise the map to show:

1. Token IDs → embedding lookup → token vectors.
2. Repeated transformer blocks, with attention and feed-forward updates added to the residual stream.
3. RoPE inside attention, applied to query and key coordinates before attention scores are calculated.
4. Final vocabulary scores → probabilities → next-token selection.
5. Training and interpretability as separate annotations, with geometry attached to the representations.

Label the map as simplified; show or acknowledge omitted normalisation. The residual stream should run through the blocks rather than sit in an unexplained “around it” row.

The layer-depth control currently changes only a number. Either remove it or make it update an explanation such as: “At 32 layers, each token passes through 32 attention sublayers and 32 feed-forward sublayers, each with its own parameters.” Label the setting as illustrative, not a choice of real model. There is no need for unsupported associations between particular depths and model families.

The “you are here” highlight is on a map that has scrolled out of view when most topics are being read. Add a compact location line in the topic or guide, or remove the tracking. Do not describe a hidden highlight as an educational feature.

### Corrections to make before polishing

| Location and current claim | Problem | Proposed treatment |
| --- | --- | --- |
| Linear maps `llm.role`: “which is why trained weight matrices stay near full rank” | This conclusion does not follow from the determinant illustration. Many model matrices are rectangular. | “A projection can discard information. The determinant illustrates that for this square matrix; rank is the more general concept used for rectangular matrices.” |
| Linear maps body: zero determinant means a plane is flattened “onto a line” | A zero matrix collapses it to a point. | Say “a line or a point”; the Collapse preset specifically illustrates a line. |
| Linear maps lesson 3: LoRA matrices “deliberately keep only a few directions” | Suggests LoRA destroys the base model’s other directions. | Explain that LoRA adds a low-rank update while keeping the pretrained weights fixed. Prefer to leave LoRA for an optional note. |
| Folding lesson 1: “attention plus feed-forward would collapse into one matrix” | Attention itself depends non-linearly on the input; normalisation also matters. | Limit the statement to a stack of linear maps, or affine maps if biases are included. |
| Folding `llm.role`: “roughly two-thirds of a transformer’s parameters” | Depends on architecture, widths, embeddings and expert structure. | “Feed-forward layers often account for a large share of the parameters.” Give a fraction only for a named, checked architecture. |
| Folding copy: GELU and SwiGLU are simply smoother folds that “keep a gradient alive” | Does not explain a gate and implies guaranteed gradient behaviour. | Explain that GELU scales inputs smoothly and SwiGLU uses an input-dependent gate. Neither is a guarantee against small gradients. |
| Gradient `why` / `llm`: “Every weight…random”; “Nothing else teaches the model”; “billions of…steps” | Not every parameter has random initialisation; steps are conflated with tokens; training also depends on data and objective. | Describe learning from batches of tokens by updating parameters using gradients. Remove unsupported counts. |
| Gradient lesson 1: backpropagation computes “exactly the arrow at your feet” | The arrow is the negative gradient; backpropagation calculates the gradient. | State the distinction explicitly. |
| Attention dream: a dot product “only measures how closely two arrows point the same way” | Dot products depend on lengths as well as angle. | Explain both direction and magnitude. |
| Attention lesson 3: “Sampling uses the same knob” | Confuses attention mixing with next-token sampling. | Explain the weighted value sum here. Discuss sampling separately as another use of temperature. |
| Attention `llm.role`: “The cost is quadratic: every new token…” | Full attention across a sequence has quadratic pair count; a single cached decoding step attends over the existing context. | Separate processing a whole prompt from generating one additional token. |
| RoPE lesson 1: rotates every “query–key pair” | RoPE rotates coordinate pairs within query and key vectors. | Use “pairs of coordinates in the query and key vectors”. |
| RoPE lesson 2: “The frequency ratio is the ‘base’ parameter” | The demo ratio is not the RoPE base. The base determines a schedule of frequencies. | Call the slider a simplified comparison of two frequencies. |
| RoPE body and lesson 3: scores depend “only” on distance; stretching automatically extends context | Scores still depend on query/key content; useful context extension requires evaluation and may require further training. | Say the positional contribution depends on relative position for fixed content vectors. Qualify context extension. |
| Dimensions: random stars establish that features coexist with “only a little crosstalk” | Random-vector geometry does not demonstrate learned features, decoding or sparse superposition. | Use the geometry as motivation and identify the untested assumptions. |
| Ablation: leaves “everything else untouched”; steering runs “the same move backwards” | Orthogonal components of the immediate vector remain unchanged, but downstream behaviour can change. Addition does not invert a lossy projection. | Separate the algebraic claim from the behavioural result and explain that a deleted coefficient is not recovered by adding a fixed vector. |

These corrections also apply to repeated claims in `body`, `why`, `llm`, `dream`, captions and dynamic readouts. Changing only the guide would leave contradictory explanations on the page.

### Topic introductions and world descriptions

Keep the current visual names as optional subtitles; lead navigation with the mathematical topic. “The horizon of almost” supplies no usable clue about high-dimensional geometry.

Suggested short descriptions to replace the templated `dream.text` blocks:

| Topic | Proposed description |
| --- | --- |
| Linear maps | “The posts mark input coordinates. The matrix transforms their positions and yours by the same rule. Compare a shear with a collapse: one changes the angles; the other makes distinct addresses share a destination.” |
| Folding | “The sheet shows points passing through a linear transformation and an activation. In this view, height represents how much the activation changes the coordinates. It is a visual aid, not an extra output dimension of the layer.” |
| Gradient descent | “Your position represents two trainable parameters. Ground height represents loss. The arrow points opposite the local gradient; the learning rate and momentum determine the update.” |
| Attention | “The surrounding markers represent keys. Turning changes the query direction; leaning changes its length. Brighter connections receive more weight. The floor marker shows the weighted sum of values, which equal the keys in this example.” |
| Rotary positions | “The tunnel combines two rotating coordinate pairs. Moving along the rail changes their angles with token position. A real attention head can contain many such pairs.” |
| Dimensions | “Each star represents a sampled direction. Its angle from the point overhead corresponds to its similarity to the reference direction. The sky is a projection of those angles, not a picture of a model’s learned features.” |
| Ablation | “The two generated clouds differ mainly along the vertical direction. Increasing α removes more of each point’s component along that direction. The same projection is applied to your position.” |

## 8. Proposed replacement context for all 21 lessons

These replace the `llm` strings in `maths/00-journey.js`. They are deliberately fuller than the current one-line associations. Keep the existing mathematical lesson text where accurate; the context should connect it to an LLM rather than restate the instructions.

Render “In a language model” as a small heading instead of beginning every paragraph with “Inside an LLM —”. The label can repeat for orientation; the explanation should not.

### Linear maps

**1 — Every step is a vector**

> A token starts with an embedding: a learned list of numbers selected using its token ID. Later matrices transform that vector. The two basis arrows here show how a matrix determines where every input point goes.

**2 — One rule moves everything**

> Attention uses learned projections to form queries, keys and values. Within a head, the same projection is applied at each token position. Changing the matrix therefore changes how all those token representations are transformed.

**3 — A dimension can disappear**

> Some projections reduce the number of coordinates. Different inputs can then produce the same output, so the projection alone cannot recover the original input. The Collapse preset demonstrates this by mapping a plane onto a line.

Optional LoRA note, outside the main lesson: “LoRA learns a low-rank addition to a weight matrix. The original matrix is retained; its other directions are not deleted.”

### Folding space

**1 — Before the threshold**

> A feed-forward block transforms each token’s vector with learned matrices and an activation. If the block contained only linear maps, they could be combined into one map. Attention elsewhere in the transformer would still depend non-linearly on the input.

**2 — Watch the negatives vanish**

> With ReLU, an intermediate coordinate below zero contributes zero to the next linear layer. Which coordinates are active depends on the input. This gives the feed-forward block behaviour that a single linear map cannot express.

**3 — Change the rule**

> The activation choice changes how intermediate values pass through the block. GELU scales inputs smoothly; SwiGLU, used in models such as Llama, uses one learned branch to gate another. Leaky ReLU here is a simpler way to compare partial suppression with setting negatives to zero.

### Gradient descent

**1 — You can feel only the local slope**

> In next-token training, the loss measures how much probability the model assigned to the tokens that actually followed. Backpropagation calculates how that loss changes with each trainable parameter. A basic gradient-descent update goes in the opposite direction, as the arrow shows here.

**2 — Carry a little momentum**

> Training batches produce different gradients, so following only the latest one can give an uneven path. Momentum combines information from successive updates. AdamW also tracks squared gradients to scale updates for individual parameters; the slider here demonstrates momentum alone.

**3 — A longer stride is a gamble**

> The learning rate sets the size of an update. Many LLM training runs increase it gradually at the start and reduce it later. A large update can raise the loss even when it starts in a downhill direction, because that direction describes only the local slope.

### Attention

**1 — Ask with your direction**

> A query is a learned projection of a token’s current representation. Its dot products with keys determine the attention scores. Both vector length and direction affect these scores, which is why turning and leaning change the weights in this example.

**2 — Listen narrowly**

> Standard scaled dot-product attention divides scores by √dₖ, where dₖ is the number of coordinates in a key. This controls score magnitude before softmax. The adjustable temperature here lets you examine the effect of score scaling; it is not the chat application’s sampling-temperature setting.

**3 — Become a mixture**

> Each attention weight multiplies a value vector, and the results are added. Several tokens can therefore contribute to the output of one head. This example uses the same vectors for keys and values; real heads learn value projections separately.

### Rotary positions

**1 — Two clocks, one position**

> RoPE rotates pairs of coordinates in query and key vectors before their dot products are calculated. Each pair uses a frequency, and token position determines the angle. Two pairs are shown here so that their combined motion can be drawn.

**2 — Change the rhythm**

> Fast rotations change substantially between nearby positions; slower rotations change over longer distances. A real model specifies a frequency schedule across coordinate pairs. This slider changes the ratio between just two frequencies, illustrating one part of that schedule.

**3 — Distance survives rotation**

> For fixed query and key content, the positional effect on their dot product depends on the difference between their positions. The content still matters. Frequency scaling can support longer contexts, but the model’s quality at those lengths has to be tested.

### High dimensions

**1 — A crowded small sky**

> A token’s residual-stream representation contains many coordinates, which attention and feed-forward layers update. This example begins with only two dimensions so that you can compare its angle distribution with wider spaces.

**2 — Almost perpendicular**

> As dimension increases, independently sampled directions tend to have cosine similarity near zero. This geometry helps explain why many directions can coexist with limited overlap. A model’s learned representations are not guaranteed to follow the random distribution shown here.

**3 — Space is not perfect separation**

> Superposition describes representations in which more features share a space than there are dimensions. Sparse activation of features can make that useful, but interference remains possible. The narrow band here illustrates angle concentration; it does not measure how well a model stores or recovers features.

### Removing a direction

**1 — One direction separates two clouds**

> Researchers can compare activations from two sets of prompts and use the difference between their means as a candidate direction. The important test is whether changing that direction changes behaviour. Separation between two clouds alone does not establish a causal role.

**2 — Subtract the projection**

> The subtraction removes the component along the chosen unit direction. In refusal experiments, researchers test interventions on residual-stream activations or corresponding weight edits. The edit’s effect on refusal and on other capabilities must be measured separately.

**3 — There is no up left**

> At α = 1, the original component along this direction has been discarded. Adding a fixed steering vector can introduce a new component, but it cannot recover the different amounts removed from each point. In a real model, either intervention can affect later computation.

### Controls and readouts

Use technical names where the reader needs to connect an action to an explanation:

| Current | Proposed |
| --- | --- |
| “Abstract” | “First-person” |
| “Enter the experience” | “Start with linear maps” |
| “Rewrite the rules” | “Matrix presets” |
| “Let the layer happen” | “Apply the layer” |
| “Wake somewhere else” | “Choose a new starting point” |
| “Your place in the sentence” / “Next word” | “Token position” / “Next token” |
| “What you become” | “Weighted value sum” |
| “How much height is forgotten” | “Projection removal α” |
| “Forget height” / “Remember height” | “Remove the component” / “Restore the original points” |
| “About this world” | “What the scene represents” |

“Restore the original points” accurately describes returning to stored originals in the demo; it does not imply that a lossy projection can be inverted.

Shorten readouts without losing quantities. For gradient descent, prefer “Step 12 · loss 0.184 · gradient magnitude 0.067” to “the ground here is … high · slope under your feet …”. Reserve the guide for interpretation.

The gradient readout also declares “settled in the global minimum” using a sampled reference and threshold. Prefer “Small gradient; run stopped”, with an explanation that this does not establish a global minimum. That is a change to the claim made by the interface, not just its tone.

## 9. Article review: preserve the accounts, correct the claims

The articles should receive a lighter stylistic edit than the newer shell. They have uneven sentences, enthusiasm and digressions, but those are not reasons to rewrite them into one uniform voice. Some assertions still need correcting.

### Mindcuber — `app.js: articles[id='mindcuber']`

Preserve the Lego build, the third architecture attempt, the training duration, the distinction between the test samples and the robot trial, and the best checkpoint occurring early.

Proposed edits:

- Shorten the opening’s sequence of enormous-number comparisons. One comparison is enough; the central problem is finding good moves through the state space.
- Replace “the single most important architectural decision” with a specific account of why residual connections were useful. An importance ranking needs comparative evidence.
- Replace the conclusion’s “we have no idea what the network learned” with: “The solve results show that it learned useful predictions. I haven’t analysed the hidden representations well enough to say which patterns it uses.”
- Clarify the documented training method. Reversing random scrambles supplies targets but does not establish shortest distances, and the article’s description should be checked against the implementation before labelling it Autodidactic Iteration.
- Resolve the “20 moves or less” statement against the move metric. The 20-move bound uses the half-turn metric; the network’s stated 12-action set uses quarter turns. A scramble’s length is also an upper bound on solution length, not necessarily the true distance.
- Correct “324 stickers” to “324 input values representing 54 stickers”.
- Resolve the 44.6M article count versus 44.7M in the model registry using the saved architecture.
- The sample policy table’s reported ranks do not consistently follow the displayed probabilities. Check against the original output or remove the ranks.

### Abliteration — `app.js: articles[id='abliteration']`

The title “How easy is it to make AI dangerous? Very easy.” is also present in the original PDF. It is not evidence of newly generated marketing copy. Nevertheless, it promises a much broader result than the refusal experiment measures.

Proposed title: **“Removing a refusal direction from an open-weight model”**.

Keep Joe’s account of why the resulting model was uncomfortable to use, if he wants that personal judgement retained. Separate it from claims about capability or security impact.

Corrections:

- The cited Arditi et al. paper is from **2024**, not 2023. Update both the prose and attribution and link the paper.
- A 50-token prompt has 50 vectors of width 12,288, not “50 × 12,288 vectors”.
- `r̂ · a` is the signed component of `a` along unit direction `r̂`. It equals cosine similarity only if `a` is unit length too. Normalising the refusal direction alone does not normalise every activation.
- “Only the refusal removed” confuses a geometric component with an isolated behaviour. Say which component was removed, then report the observed behavioural effect.
- “Lost the ability to refuse any request” conflicts with the reported 6 refusals out of 100. Use the measured result and its sample scope.
- KL divergence is not bounded by 1. Remove the universal interpretation that a value close to 1 means a damaged model; explain what distributions were compared and report the actual measurement if available.
- Check the claim of 178 edited matrices against 88 layers and two named write matrices per layer, which accounts for 176. Explain any additional matrices from the implementation.

### NVFP4 — `app.js: articles[id='nvfp4']`

Preserve the hardware compatibility failure, the missing benchmark results and the thermometer anecdote. The incomplete result is the most interesting and credible part of the account.

Replace “with maths, benchmarks and an ending that needs a sequel” in the card description with the actual outcome. Keep the attributed Gemini quotation as part of the troubleshooting account; verify technical guidance against the library version rather than treating a model response as the definitive source.

Corrections and checks:

- State the baseline storage units consistently. 46.7 billion parameters at two bytes each is about 93.4 GB or 87 GiB; switching between those figures without units can look like contradictory measurements.
- Check the quantized 24.82 figure’s original units before updating compression comparisons.
- Distinguish the signed error from absolute error in the worked examples. The expressions `0.5 − 0.50176` and `0.5 − 0.572` are negative; the displayed positive values are magnitudes.
- Recalculate examples with a consistent scale and rounding rule rather than rounding intermediate values inconsistently.
- Replace “acceptable for most inference tasks” with the tested result, if there is one. The lab’s rounding example does not establish quality retention for real workloads.
- Date statements about hardware or software support to the experiment. A failure with the versions used then does not establish the current state of support.
- Link the weights repository named in the source PDF. Avoid “first NVFP4 quantized version” unless the historical claim can be supported.

### Haskell — `app.js: articles[id='haskell']`

The course story, World of Books purchases and misbehaving host are worth keeping. “Now tell me that’s not neat!” sounds natural in that account; there is no reason to delete every rhetorical flourish.

Proposed edits:

- The card can describe the actual three-model program instead of promising “the benefits of strong type systems”.
- Qualify “at runtime, you get the same output every time”: pure functions return the same result for the same arguments; the complete program performs I/O and calls models.
- Qualify “you cannot accidentally pass a malformed message”: typed internal values help, but external JSON still needs parsing and validation, and valid types do not guarantee meaningful content.
- Describe the protocol as A2A-style unless conformance was tested. Align the model registry with the article’s more cautious account.
- Keep the model-generated philosophical passage explicitly labelled as model output. It should not become a style reference for the site’s own explanations.
- Replace “I will publish it as its own article” with a link if that article exists; otherwise remove the promise.

## 10. Editorial rules for implementation

1. **Write from the available evidence.** A project result needs a source, a sample and a distinction between measured and inferred behaviour.
2. **Define the object before extending the analogy.** Explain “token”, “query”, “activation” and “residual stream” on first use. Do not silently interchange tokens and words.
3. **Make the action informative.** “Increase the learning rate and compare the loss after each step” teaches more than “Lengthen the stride”.
4. **Use first person for Joe’s work and judgement.** Use neutral language for established mechanisms. Do not invent autobiography or imply that Joe ran measurements absent from the record.
5. **Let sections differ.** A report of a failed software setup need not have the same shape as an interactive maths lesson.
6. **Keep metaphors local.** “Downhill” is useful for descent. It need not become “a hollow is waiting”.
7. **Keep the technical limits near the claim.** Explain synthetic keys, decorative height and ideal quantization scales where they matter.
8. **Use British English consistently in prose.** Keep identifiers, paper titles and code spelling unchanged. Choose one spelling of quantisation/quantization for editorial prose rather than alternating accidentally.
9. **Use links for provenance.** The page should distinguish a reported result, a mathematical identity and a research hypothesis.
10. **Read the copy aloud.** Look for repeated cadence, sentences that could sit on any AI site, and claims that sound stronger than the evidence.

Do not optimise for an AI-detector score. A more credible site has an identifiable author, accurate explanations and specific evidence; no wording policy can establish human authorship.

## 11. Sources and review checks

Two primary references were checked for this review:

- Arditi et al., **Refusal in Language Models Is Mediated by a Single Direction**, NeurIPS 2024: https://proceedings.neurips.cc/paper_files/paper/2024/hash/f545448535dfde4f9786555403ab7c49-Abstract.html — confirms the date and the scope of the published finding.
- Hu et al., **LoRA: Low-Rank Adaptation of Large Language Models**, 2021: https://arxiv.org/abs/2106.09685 — describes frozen pretrained weights with trainable low-rank additions.

The projection, gradient, linear-map and storage-unit corrections above follow directly from the definitions or the site’s own code. Experimental counts, architecture details and historical compatibility claims still need the original records. Add primary sources alongside the final explanations of RoPE, AdamW and superposition during implementation.

Before accepting the revisions:

- Read Home, About and an article consecutively. They should sound like one site with an author, without forcing the same sentence pattern onto every page.
- Check that each of the 21 lesson panels contributes a distinct explanation and matches its associated action.
- Check the topic text, guide, optional description and readout for contradictions.
- Review the longer lesson context on the iPad in both orientations. Keep the action and lesson navigation reachable; use expandable detail where needed.
- Confirm that changed labels still describe what the controls actually do.
- Check article titles and summaries in cards, search, page titles, metadata, RSS and downloads. If a source document stays unchanged, identify any correction to the web version.
- Preserve all numerical outcomes unless the underlying record supports a correction.
- Build from the source files after an approved implementation pass. This document itself does not require a site rebuild.

The first implementation pass should concentrate on the P0 corrections, the main introductions and the 21 lesson panels. Additional features can wait until those explanations are accurate and read naturally.
