# Abliteration: A Comprehensive Guide

*A from-first-principles educational document, written around the worked example of abliterating **Mistral Medium 3.5 128B** on an NVIDIA DGX Spark using **Heretic**.*

---

## How to read this guide

This document moves from **theory → method → tools → our actual pipeline → evaluation → limitations**. If you only want the mental model, read Parts 1–4. If you want to reproduce or operate the system, read Parts 6–8. Every abstract idea is tied back to something concrete we actually did (e.g., *Trial 154: 6/100 refusals, KL 0.119*), so you can see the math become a running model.

**Table of contents**

1. What abliteration is (and the one-sentence intuition)
2. How a language model represents "refusal"
3. The mathematics of directional ablation
4. Abliteration vs. fine-tuning
5. Heretic and the MPOA method
6. The toolchain and why each tool exists
7. The end-to-end pipeline (our project, step by step)
8. The obstacles we hit and what they teach
9. Evaluating an abliterated model
10. How quantization interacts with abliteration
11. Limitations, failure modes, and responsible use
12. Glossary
13. References and further reading
14. Appendix A: our exact artifacts and commands

---

## 1. What abliteration is

**Abliteration** (a portmanteau of *ablate* + *obliterate*) is a technique for **removing a specific learned behavior from a language model — most commonly its tendency to refuse requests — without retraining the model and without significantly degrading its other capabilities.**

The one-sentence intuition:

> Modern aligned models decide *whether to refuse* by checking a single, identifiable **direction** in their internal activation space. Abliteration finds that direction and surgically prevents the model from ever moving along it — so the "should I refuse?" signal can no longer form.

This is fundamentally different from "jailbreaking" (clever prompts that trick the model) and from fine-tuning (retraining on data). Abliteration is a **geometric edit to the weights**: it changes *what the model is capable of representing*, not *what you said to it* and not *what it learned from new data*.

Key properties that make it remarkable:

- **Training-free at its core.** The essential operation requires no gradient descent and no labelled dataset of "good answers." It needs only a few hundred example prompts to *measure* a direction.
- **Cheap.** The core computation is a handful of forward passes plus some linear algebra — minutes of work conceptually (our run was long only because the model is 126B parameters and we optimized hard; see Part 5).
- **Surgical.** Done well, it changes a tiny, low-rank slice of the weights and leaves general knowledge and reasoning largely intact (we'll quantify "largely" with **KL divergence**).
- **Reversible and inspectable.** Because it's a known, low-rank linear edit, you can store it as a small **LoRA adapter** (ours was 69 MB) and add or remove it at will.

---

## 2. How a language model represents "refusal"

To understand the edit, you need a working picture of where "refusal" *lives* inside a transformer.

### 2.1 The residual stream

A decoder-only transformer processes a sequence of tokens as a stack of vectors. At each layer, the model **reads** from a shared vector (the **residual stream**, dimension `d_model` — 12,288 for our model) and **writes** updates back into it:

```
residual_{layer+1} = residual_{layer}
                    + attention_output(residual_{layer})
                    + mlp_output(residual_{layer})
```

The residual stream is the model's "working memory." Every component **adds** its contribution; nothing is overwritten. By the final layer, the residual stream at the last token position encodes everything the model needs to choose the next token.

Two matrices are the *only* things that write into the residual stream from each block:

- **`o_proj`** — the attention **output projection** (takes the attention result and writes it to the residual stream).
- **`down_proj`** — the MLP **down projection** (takes the hidden MLP activation and writes it to the residual stream).

**Remember these two names.** They are exactly the matrices abliteration modifies, and exactly the ones Heretic reported targeting in our run (`attn.o_proj`, `mlp.down_proj`, across all 88 layers). This is not a coincidence — they are the write-heads of the residual stream.

### 2.2 The linear representation hypothesis

A large body of interpretability work supports the **linear representation hypothesis**: high-level concepts (sentiment, truthfulness, language, "this is a refusal context," …) are encoded as **linear directions** in activation space. Moving the residual vector along a concept's direction increases the model's "belief" in that concept; moving against it decreases it.

If "refusal" is one such concept, then somewhere there is a vector **r** such that the *component of the residual stream along r* determines whether the model is heading toward "I can't help with that" versus a helpful answer.

### 2.3 Where refusal comes from

Base (pre-aligned) models barely refuse anything. Refusal is **installed by alignment training** — RLHF, DPO, or instruction tuning on datasets where harmful requests are paired with refusals. This training nudges the weights so that, when the model detects a "harmful request" context, it writes a strong component along **r** into the residual stream, which downstream layers read as "emit a refusal."

The crucial empirical finding (Arditi et al., 2024, *"Refusal in Language Models Is Mediated by a Single Direction"*) is that **this signal is essentially one-dimensional**. A single direction, computed once, governs refusal across a huge variety of prompts. That single-dimensionality is what makes abliteration possible and clean.

---

## 3. The mathematics of directional ablation

### 3.1 Finding the refusal direction (difference of means)

You need two small sets of prompts:

- **"Bad"/harmful prompts** that the model refuses (we used `mlabonne/harmful_behaviors`).
- **"Good"/harmless prompts** that it answers (we used `mlabonne/harmless_alpaca`).

Run the model over both sets and capture the residual-stream activations (at a chosen layer and token position). Then:

```
r_raw  =  mean(activations on harmful prompts)
        − mean(activations on harmless prompts)

r̂      =  r_raw / ‖r_raw‖          (normalize to a unit vector)
```

`r̂` is the **refusal direction**: the average way the model's internal state *differs* when it's about to refuse versus when it's about to comply. That's the entire "detection" step — a difference of two averages. (In our run this is the `* Obtaining residual mean for good prompts...` / `Calculating per-layer refusal directions...` stage.)

### 3.2 Directional ablation — the core operation

Given `r̂`, you want the model to be **unable to represent any component along it.** For any activation vector `a`, the projection onto `r̂` is `(r̂ · a) r̂`. Remove it:

```
a_ablated  =  a − (r̂ · a) r̂   =   (I − r̂ r̂ᵀ) a
```

`(I − r̂ r̂ᵀ)` is a **projection matrix** that flattens the refusal dimension to zero while leaving every orthogonal direction untouched. Apply this and the "refusal" coordinate is always 0 — the model literally cannot signal "refuse."

There are two ways to apply it:

**(a) Inference-time intervention.** Hook every layer and subtract the projection from activations on the fly. Reversible instantly, but requires custom inference code and adds runtime cost. Good for research.

**(b) Weight orthogonalization (permanent).** Bake it into the weights so the model *never writes* the direction in the first place. For any matrix `W` whose output is added to the residual stream (i.e. `o_proj` and `down_proj`):

```
W' = (I − r̂ r̂ᵀ) W   =   W − r̂ (r̂ᵀ W)
```

Now the output of `W` is orthogonal to `r̂` by construction. No runtime hooks needed — it's just a modified model. **This is what produces a standalone abliterated model**, and it's what we did.

### 3.3 Why this is naturally low-rank (and becomes a LoRA)

Look at the edit: `ΔW = − r̂ (r̂ᵀ W)`. The term `r̂ᵀ W` is a row vector; `r̂` is a column vector. Their outer product is **rank-1**. So *each refusal direction you remove changes the weight matrix by a rank-1 update.*

This is the deep reason our abliteration could be saved as a **LoRA adapter of rank 3** (`r=3`): the modification is a sum of a few rank-1 directional ablations per matrix. A LoRA stores an update as `ΔW = B·A` with `A:[r, d_in]`, `B:[d_out, r]` — exactly the right shape to hold "project out up to 3 directions." The abliteration *is* a LoRA, just one computed by geometry rather than learned by gradient descent.

`W' = W + (alpha/r)·B·A`. In our adapter `alpha = r = 3`, so the scale factor is exactly **1.0** — which is why our manual merge simply added `B·A` to the base weights.

### 3.4 Per-layer directions and weighting

The simplest method uses one global direction. Better methods (including Heretic) compute a **separate refusal direction per layer** and apply the ablation with a **per-layer strength**. Why? Because refusal isn't equally represented at every depth — early layers are still forming the "what is being asked" representation; middle layers carry the strongest refusal signal; late layers are committing to tokens. Ablating too hard in the wrong layers damages fluency; too softly leaves residual refusals.

This per-layer **strength profile** is precisely what Heretic searches over (next section). In our run you can see it in the chosen parameters:

```
direction_index               = per layer
attn.o_proj.max_weight        = 1.16   attn.o_proj.min_weight          = 0.93
attn.o_proj.max_weight_position = 60.25  attn.o_proj.min_weight_distance = 40.73
mlp.down_proj.max_weight      = 1.44   mlp.down_proj.min_weight        = 1.28
mlp.down_proj.max_weight_position = 69.09  mlp.down_proj.min_weight_distance = 50.45
```

These define a curve: *how strongly to apply the ablation at each of the 88 layers*, peaking around a certain layer position and tapering by some distance — separately for the attention and MLP write-heads.

---

## 4. Abliteration vs. fine-tuning

This is the comparison that most clarifies what abliteration *is*, by contrast.

| Dimension | Fine-tuning (incl. LoRA fine-tuning) | Abliteration |
|---|---|---|
| **Mechanism** | Gradient descent minimizing a loss on a dataset | Linear-algebra edit derived from activation statistics |
| **Needs training data?** | Yes — labelled examples of desired outputs | No — only a few hundred prompts to *measure* a direction (no target answers) |
| **What it changes** | Potentially all weights; learns new associations | A tiny, **low-rank** slice of two matrix types (`o_proj`, `down_proj`) |
| **Can it add knowledge/skills?** | **Yes** — teaches new behaviors, facts, styles | **No** — it can only *remove/attenuate* an existing behavioral gate |
| **Capability risk** | Catastrophic forgetting; distribution shift | Minimal if targeted; quantified by **KL divergence** |
| **Compute** | Backprop over the whole model; expensive | A few forward passes + linear algebra; cheap in principle |
| **Reversibility** | Hard to undo precisely | Trivial — it's a known low-rank edit / detachable LoRA |
| **Interpretability** | Opaque — "the weights moved" | Transparent — "we removed component along **r̂**" |

**The key conceptual difference:** fine-tuning *teaches the model what to do*; abliteration *removes the model's ability to take one specific internal action* (signalling refusal). Fine-tuning is optimization over **behavior given data**; abliteration is surgery over **representation given geometry**.

A subtle but important point: even though Heretic uses an *optimizer* (Optuna), it is **not doing gradient-based fine-tuning.** It is searching over a handful of **ablation hyperparameters** (the per-layer strength curve), and for each candidate it *recomputes the geometric edit* and measures the result. No weight gradients are ever taken. The model's knowledge is never trained on — only its refusal gate is dialed.

---

## 5. Heretic and the MPOA method

### 5.1 What Heretic is

**Heretic** (by p-e-w, github.com/p-e-w/heretic) is an automated abliteration tool. Plain directional ablation (Section 3) works but has a problem: **how hard should you ablate, and at which layers?** Ablate too aggressively and you get 0 refusals but a brain-damaged model (high KL divergence — see *Trial 119* below: 0/100 refusals but **KL 5.93**, essentially destroyed). Ablate too gently and the model still refuses. The sweet spot is model-specific and layer-specific.

Heretic automates the search for that sweet spot.

### 5.2 MPOA — the optimized directional-ablation method

Heretic's method (which our project notes call **MPOA**) generalizes Arditi-style directional ablation into a **parameterized, per-layer, multi-objective-optimized** procedure:

1. **Compute per-layer refusal directions** via difference-of-means over the good/bad prompt sets (Section 3.1), for the residual-writing matrices `o_proj` and `down_proj`.
2. **Parameterize the ablation strength** as a smooth per-layer curve, controlled by a few knobs per target module (`max_weight`, `min_weight`, `max_weight_position`, `min_weight_distance` — the "where and how hard" of the ablation).
3. **Search** those parameters with an optimizer, evaluating each candidate by *actually abliterating and testing the model*.

### 5.3 The optimization loop (what those 200 trials were)

Heretic uses **Optuna** with a **TPE (Tree-structured Parzen Estimator)** sampler — a Bayesian-style optimizer that learns which parameter regions are promising.

Each **trial**:
- picks a candidate per-layer strength curve,
- applies the (cheap, geometric) ablation to a working copy of the model,
- generates responses to an evaluation set, and measures **two numbers**:
  - **Refusal count** — how many of 100 harmful eval prompts it still refuses (lower = more abliterated),
  - **KL divergence** — how far the abliterated model's next-token distribution has drifted from the *original* model on benign prompts (lower = less collateral damage).

In our run: **200 trials** (the first **60** were random exploration, the remaining **140** were TPE-guided). Early random trials bounced around (72–93/100 refusals); the TPE phase found configurations that drove refusals into single digits.

### 5.4 Multi-objective optimization and the Pareto front

Refusals and KL divergence are in **tension** — pushing one down tends to push the other up. There is no single "best" point; instead there is a **Pareto front**: the set of trials where you cannot reduce refusals without increasing KL, or vice versa. Heretic presents this front and lets *you* choose the trade-off.

Our actual Pareto front (excerpt):

```
[Trial 119] Refusals:  0/100,  KL 5.9257   ← fully uncensored but DESTROYED
[Trial 154] Refusals:  6/100,  KL 0.1190   ← what we chose: strong + healthy
[Trial 173] Refusals:  7/100,  KL 0.0657
[Trial 101] Refusals: 13/100,  KL 0.0434
 ...
[Trial 193] Refusals: 89/100,  KL 0.0003   ← barely touched, near-original
```

Reading this is a skill: **KL > ~0.5 generally signals serious capability damage.** Trial 119's KL of 5.93 means "no refusals" was bought by wrecking the model. **Trial 154** sits at the elbow of the curve — 6/100 refusals with KL 0.119, i.e. nearly all refusals removed while staying well inside the safe-quality zone. That elbow is almost always the right pick.

---

## 6. The toolchain and why each tool exists

| Tool | Role in the pipeline | Why it's needed |
|---|---|---|
| **Heretic** | Computes directions, runs the MPOA optimization, emits the abliteration (LoRA or merged) | The core method |
| **transformers** (HF) | Loads the model, runs forward passes for direction-finding & evaluation | Standard model runtime; v5.x needed for this model's `ministral3` config |
| **bitsandbytes (BNB)** | NF4 4-bit quantization so a 126B model fits in memory during abliteration | A bf16 126B model is ~250 GB; NF4 shrinks it to ~66 GB |
| **PEFT** | Represents/stores the ablation as a LoRA adapter | The low-rank edit (Section 3.3) maps cleanly to LoRA |
| **Optuna** | TPE optimizer driving the 200-trial search | Finds the refusal/KL sweet spot automatically |
| **llama.cpp** | Inference engine for the final GGUF model | Fast, memory-efficient serving; works where Ollama's engine failed |
| **GGUF + llama-quantize** | Final on-disk format + Q4_K_M quantization | ~70 GB servable artifact that fits with headroom |

**Formats you must keep straight** (a common source of confusion):

- **FP8** — the format the *original* weights shipped in (~126 GB). 8-bit floats; the model's native quantization.
- **BF16** — full-precision reconstruction (~250 GB). The lingua franca for *editing/merging*; you can't stack other quantizers on top of FP8, so we dequantized to BF16 first.
- **NF4 (bitsandbytes)** — 4-bit, used *only during abliteration* to fit the model in memory while Heretic ran (~66 GB).
- **GGUF Q4_K_M** — the *serving* format (~70 GB), consumed by llama.cpp.

---

## 7. The end-to-end pipeline (our project, step by step)

This is the actual sequence, with the *reasoning* for each step. It doubles as a runbook.

### Phase 0 — Hardware reality
NVIDIA DGX Spark (GB10), **121 GB unified memory** shared between CPU and GPU. This single constraint shaped every decision: the model must fit, in some form, inside ~121 GB minus OS overhead.

### Phase 1 — Get the model running for inference (sanity baseline)
1. Downloaded a **GGUF Q4_K_M** build of Mistral Medium 3.5 (~70 GB) — fits comfortably.
2. Discovered **Ollama cannot run this model** (its `mistral3` engine crashes with a nil-pointer panic, on every version). 
3. **Built llama.cpp from source** (CUDA, ARM, `sm_121`) and served the GGUF with `llama-server` → working inference. *Lesson: the inference engine matters; llama.cpp's mature kernels handled an architecture Ollama's newer Go engine did not.*

### Phase 2 — Prepare weights Heretic can edit
Heretic edits weights via transformers + bitsandbytes, which needs HF-format safetensors — **not** GGUF and **not** FP8-under-BNB. Two blockers and their fixes:
4. **FP8 ✗ BNB:** transformers refuses to put BitsAndBytes 4-bit on top of an already-FP8 model ("you can't double-quantize"). → **Dequantized FP8 → BF16** with a streaming script (read each FP8 tensor + its `weight_scale_inv`, compute `W = fp8 · scale`, write BF16). Output: a ~238 GB BF16 model.
5. **Memory during 4-bit load:** transformers' loader transiently uses ~2× memory; loading the 126B model spiked past 121 GB. → To keep loads efficient we pre-quantized to **NF4** with a streaming quantizer, and added **swap** (160 GB + 256 GB files) so transient spikes page out instead of OOM-killing the box.

### Phase 3 — Run the abliteration
6. Ran Heretic on the NF4 model: it loaded (~66 GB resident), computed per-layer refusal directions, then ran **200 MPOA trials** (~21.5 hours at ~3 tok/s, because it's a *dense* 128B model — see Part 10 for why MoE would be faster).
7. Inspected the Pareto front and selected **Trial 154** (6/100 refusals, KL 0.119).

### Phase 4 — Export the abliteration
8. Heretic's built-in 4-bit *merge*-and-save errored, so we **saved the LoRA adapter** instead (69 MB — the portable, primary deliverable).
9. To produce a *servable* model we **merged the LoRA into the BF16 base ourselves** (streaming: `W += B·A`, scale 1.0, for `o_proj`/`down_proj` across 88 layers).

### Phase 5 — Quantize and serve
10. Converted the merged BF16 model → **GGUF (f16)** with llama.cpp's `convert_hf_to_gguf.py`.
11. **Quantized to Q4_K_M** (~70 GB) with `llama-quantize`.
12. Served with `llama-server` on `0.0.0.0:8080` and **verified**: coherent normal output **and** compliance on a prompt class the original refused → abliteration confirmed end-to-end.

### Final artifacts
- **LoRA adapter:** `adapters/mistral-medium-abliterated/` (69 MB)
- **Servable model:** `models/mistral-medium-abliterated-Q4_K_M.gguf` (70 GB)

---

## 8. The obstacles we hit and what they teach

Each obstacle is a generalizable lesson about working with large models on constrained hardware.

1. **"The newest tool isn't always the working tool."** Ollama (newer, Go-native engine) crashed; llama.cpp (older C++ kernels) worked. Maturity beats novelty for niche architectures.
2. **"Quantizers don't stack."** FP8 + BNB-4bit is rejected. To re-quantize, you must first **dequantize to full precision**. Plan disk and time for the BF16 detour.
3. **"Unified memory is one budget."** On the Spark, GPU and CPU share 121 GB — there's no separate VRAM to offload to. A transient 2× loader spike is fatal without swap. **Swap turns a hard OOM into a slow-but-survivable page-out.**
4. **"Protect the box from your own guardrails."** Our first memory-watchdog killed the process on *transient* spikes (before swap could absorb them) and froze the machine; the fix was to trigger only on *sustained* true OOM.
5. **"Dense 128B is the slow ceiling."** ~3 tok/s. The Spark's 128 GB was designed for **MoE** models (huge in memory, few active params, fast). Architecture choice dominates throughput (Part 10).
6. **"Check whether someone already did it."** Pre-abliterated builds of this exact model exist on HuggingFace (e.g. `huihui-ai/...abliterated-GGUF`). Doing it yourself is the *learning* win; for a pure result, a download can be 15 minutes.

---

## 9. Evaluating an abliterated model

Four complementary lenses:

1. **Refusal rate** — % of a held-out harmful-prompt set still refused. Heretic's primary objective. *Lower = more abliterated.* (Ours: 6/100.)
2. **KL divergence** — distributional drift from the original on benign inputs. The capability-damage proxy. *Lower = healthier.* Watch the **0.5 danger threshold.** (Ours: 0.119.)
3. **Benchmark retention** — run standard evals (MMLU, GSM8K, etc.) on original vs abliterated. Confirms KL's promise that "knowledge survived."
4. **Qualitative probing** — actually chat with it: coherence, hedging, over-/under-compliance, fluency. The numbers can hide subtle degradation (looping, flattened style).

**Choosing a Pareto trial** is itself an evaluation decision: pick the **elbow** — the point past which further refusal reduction costs disproportionate KL. (Trial 154 was our elbow; Trial 119 was the cautionary over-ablation.)

---

## 10. How quantization interacts with abliteration

Three distinct roles for quantization in this project — don't conflate them:

- **As a memory enabler during editing (NF4):** lets the 126B model fit so Heretic can run. The abliteration math is applied to (de)quantized weights; minor rounding, but the *direction* is robust.
- **As the original format (FP8):** the obstacle that forced the BF16 detour.
- **As the serving format (GGUF Q4_K_M):** the final artifact. The abliteration must **survive** quantization — and it does, because removing a direction is a *coarse, robust* geometric change, not a delicate numerical one. We verified the served Q4_K_M still complies.

**Quality stacking caveat:** our model was effectively quantized twice (NF4 for editing → Q4_K_M for serving). Each step adds a little noise. For maximum fidelity you'd abliterate at higher precision; for practical chat, Q4_K_M is fine.

**Architecture note (why it was slow):** a *dense* 128B model computes all 126B parameters per token (~3 tok/s here). A **Mixture-of-Experts** model of similar total size (e.g. Qwen3-235B-A22B, or GPT-OSS-120B with ~5B active) activates only a few billion params per token → **5–15× faster** on the same hardware, because the Spark's large unified memory is precisely designed to *hold* a big MoE while only *computing* a slice. If throughput matters more than this specific model, an MoE is the better-matched target for abliteration on this box.

---

## 11. Limitations, failure modes, and responsible use

### What abliteration does *not* do
- It does **not** add capabilities or knowledge. It only removes a behavioral gate.
- It does **not** guarantee zero refusals — residual refusals remain (ours: 6/100) because refusal isn't *perfectly* one-dimensional.
- It does **not** repair the damage it can cause: over-ablation (high KL) degrades reasoning, increases hallucination, and can induce repetition. KL is your guardrail-on-the-guardrail-removal.

### Failure modes to watch
- **Over-ablation:** 0 refusals, broken model (Trial 119).
- **Direction leakage:** if good/bad prompt sets are poorly chosen, the "refusal direction" entangles with unrelated concepts and you ablate the wrong thing.
- **Quantization interaction:** very aggressive serving quant can blunt a marginal abliteration.

### Responsible use
Abliteration is **dual-use**. Legitimate, common uses include:
- **Safety/red-team research** — studying how alignment is encoded and how robust it is (this is literally the Arditi et al. research program).
- **Removing over-refusal** — many aligned models refuse benign requests (security education, fiction, medical info); abliteration restores usefulness.
- **Local, private, controlled deployments** where the operator owns the risk.

Because the result is an uncensored model, operational hygiene matters: keep such models on trusted/local networks, gate access, and treat outputs as you would any uncensored source. Removing refusals removes a safety layer — the responsibility shifts entirely to the operator.

---

## 12. Glossary

- **Ablation / Abliteration** — removing a behavior by projecting out its activation direction.
- **Residual stream** — the shared per-token vector that transformer blocks read from and add to.
- **Refusal direction (r̂)** — the unit vector whose presence in the residual stream drives refusals; found by difference-of-means.
- **Directional ablation** — subtracting the `r̂`-component from activations: `a − (r̂·a)r̂`.
- **Weight orthogonalization** — baking that subtraction into weights: `W − r̂(r̂ᵀW)`; produces a standalone model.
- **`o_proj` / `down_proj`** — the attention and MLP matrices that *write* to the residual stream; the abliteration targets.
- **KL divergence** — distance between the abliterated and original next-token distributions; the capability-damage metric.
- **Pareto front** — the set of non-dominated refusal/KL trade-offs; you pick a point on it.
- **MPOA** — Heretic's parameterized, per-layer, optimized directional-ablation method.
- **TPE / Optuna** — the Bayesian-style optimizer searching ablation hyperparameters.
- **LoRA** — low-rank weight update `ΔW = (alpha/r)·B·A`; the natural container for the (low-rank) abliteration edit.
- **NF4 / GGUF / FP8 / BF16** — quantization/precision formats (see Part 6).
- **MoE (Mixture-of-Experts)** — architecture where only a subset of parameters activate per token; fast on big-memory hardware.

---

## 13. References and further reading

- **Arditi, Obeso, et al. (2024)** — *"Refusal in Language Models Is Mediated by a Single Direction."* The foundational result that refusal is ~1-dimensional. (arXiv:2406.11717)
- **Heretic** — github.com/p-e-w/heretic — the tool used here; read its README for the exact MPOA parameterization.
- **"Refusal directions" / abliteration write-ups** — e.g. the original community notebooks by Maxime Labonne and others demonstrating directional ablation on Llama-class models.
- **Elhage et al., "A Mathematical Framework for Transformer Circuits" (Anthropic)** — residual-stream mental model.
- **Linear representation hypothesis** literature (e.g. Park et al.) — why concepts are directions.
- **bitsandbytes / PEFT / llama.cpp** documentation — the practical toolchain.

---

## 14. Appendix A — our exact artifacts and commands

**Artifacts (on the DGX, `~/Projects/heretic-mistral-medium/`):**
- `adapters/mistral-medium-abliterated/` — LoRA adapter (r=3, targets `o_proj`+`down_proj`, 69 MB)
- `models/mistral-medium-abliterated-Q4_K_M.gguf` — servable model (~70 GB)
- `scripts/dequant_fp8_to_bf16.py` — FP8 → BF16 streaming dequantizer
- `scripts/quantize_nf4_streaming.py` — BF16 → NF4 streaming quantizer
- `scripts/merge_lora_bf16.py` — merge LoRA into BF16 base (`W += B·A`)

**Chosen abliteration — Trial 154:** Refusals 6/100, KL 0.119. Per-layer strength curve over `o_proj` (max 1.16 / min 0.93) and `down_proj` (max 1.44 / min 1.28).

**Serve:**
```bash
~/Projects/llama.cpp/build/bin/llama-server \
  -m ~/Projects/heretic-mistral-medium/models/mistral-medium-abliterated-Q4_K_M.gguf \
  -ngl 99 -c 8192 --host 0.0.0.0 --port 8080 --jinja
```

**Memory footprint when served:** ~76 GB used of 121 GB (≈70 GB weights + ~6 GB KV/compute), ~45 GB free.

---

*End of guide. The short version: alignment writes a single "refuse" direction into the model's residual stream; abliteration measures that direction from a few hundred prompts and projects it out of the two matrices that write to the residual stream — a cheap, low-rank, reversible edit that removes the gate without retraining the brain. Heretic just automates finding exactly how hard to push.*
