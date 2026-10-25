# Implemented chamber fixtures

25 October 2026. These are the concrete witness solutions for the first playable build. Each initial configuration was checked to fail its predicate, and each witness below was evaluated against the actual game model and passed. This is a numerical review, not evidence of unaided player understanding.

| Game | Chamber | Witness configuration | Verified outcome |
| --- | --- | --- | --- |
| Basis Foundry | Two columns | columns (1, 0.5), (0.5, 1.5) | 3/3 receivers, zero error |
| Basis Foundry | Order matters | shear then quarter-turn | 3/3 receivers, zero error |
| Basis Foundry | Collapsed channel | pass-through; columns (1,1), (−1,1) | 3/3 receivers, zero error |
| Hinge Engine | One-sided gate | one ReLU, bias 0 | 4/4 outputs |
| Hinge Engine | Opposite corners | two ReLU branches, angle 45°, bias 0 | 4/4 classifications with margin |
| Hinge Engine | Lost sign | two ReLU branches, bias 0 | 4/4 non-negative output pairs |
| Contour Pilot | Bowl | η 0.3, μ 0 | loss 0.0006, speed 0.014, 12 updates |
| Contour Pilot | Ravine | η 0.08, μ 0.6 | loss 0.0048, speed 0.016, 14 updates |
| Contour Pilot | Two hollows | other start; η 0.08, μ 0 | loss 0.0732, speed <0.02, 20 updates |
| Query Loom | Contributor | q (1.96,0), τ 1 | output within 0.04 of (1.2,0) |
| Query Loom | Missing value | q (1.55,1.55), τ 1 | output within 0.04 of (0.8,0.8) |
| Query Loom | New cargo | q (1.55,−1.55), τ 1 | output within 0.04 of (0.8,0.8) |
| Phase Observatory | First clock | m 2, n 3 | one phase lock |
| Phase Observatory | Alias | m 2, n 7 | both phase locks |
| Phase Observatory | Moving origin | m 10, n 15 | both locks and required origin |
| Superposition Array | Shared wires | codes 1,2,3 | 3/3 single transmissions |
| Superposition Array | Four into three | codes 4,5,6,7 | 10/10 single/paired transmissions |
| Superposition Array | Crowded transmission | 4 dimensions; codes 1,2,3,4 | 15/15 non-empty combinations |
| Nullspace | Hum | normal 90°, α 1 | zero residual error |
| Nullspace | Oblique direction | normal 45°, α 1 | zero residual error |
| Nullspace | Shared information | fixed normal 45°, α 0.6 | nuisance 0.4, useful amplitude 0.7 |

The game modules contain the full initial states, constraints, input sets, exact evaluation predicates, explanatory text, and graduated hints. Numerical completion does not certify usability or enjoyment. Browser interaction and physical iPad observations are recorded separately in [PLAN.md](PLAN.md).

## Current-code recheck · 25 October 2026

All 21 initial states and witness configurations above were rechecked after the runtime/history changes: every initial state remains incomplete and every witness remains valid and passes. Completion predicates and the authored witness configurations were not changed.

Additional direct checks passed:

- Basis Foundry: wrong operation order and rank loss fail; the final chamber also accepts a shear first plate with second matrix `[[1, -2], [1, 0]]`.
- Hinge Engine: the affine-only path fails opposite corners; two branches at 45° also pass with bias `0.1`.
- Query Loom: weights remain non-negative and sum to one; chamber two also accepts query `(1.24, 1.24)` with temperature `0.8`. The first chamber rejects saved states that change its fixed temperature.
- Phase Observatory: the fast-clock alias fails the two-clock chamber. Shifting `(m,n)` from `(2,7)` to `(10,15)` preserves both signed phases while satisfying the final chamber's separate origin constraint.
- Superposition Array: tetrahedral Gram diagonals are `1`, off-diagonals `−1/3`; all 10 single/pair inputs pass. The same codes fail the 15-input dense workload, with all four active summing to zero.
- Nullspace: final-chamber strengths `0.55`, `0.60`, and `0.70` pass; `0.54`, `0.71`, and `1` fail. At `0.60`, nuisance amplitude is `0.4`, useful amplitude `0.7`, and useful distortion is `(-0.3, -0.3)`.
- Contour Pilot: every recorded witness update matches the position/velocity recurrence. Rewinding to update three restores position, velocity, settings and budget; advancing reproduces the original next update. A legal divergent state from the third chamber at rate `0.19`, momentum `0.8`, update 13 (`x≈209.9996200462671`) is retained by save validation and can be rewound. Corrupted paths inconsistent with their snapshots are rejected.
