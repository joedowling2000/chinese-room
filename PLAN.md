# Interactive Chinese Room — implementation plan

Started: 30 September 2026

## Aim
Turn the article site into a small, accessible AI lab. Begin with Mindcuber,
then quantization. Keep static hosting and browser-only calculations; no model
endpoint, API key, inference bill or running Spark is required.

## 1. Mindcuber
- [x] Add a Lab entry point, homepage invitations and article links.
- [x] Implement a cube state model and interactive 3D illustration, with an
  unfolded view that exposes all six faces.
- [x] Allow generated/custom scrambles, forward/back steps, playback and reset.
  Label reversal as a mathematical demonstration, never a neural model solve.
- [x] Explore the four epoch-10 results reported in the source article. Keep
  the separate 19-cube robot trial distinct; disclose missing raw logs/settings.
- [x] Remove misleading live-model labels and unsupported registry performance.
- [ ] Add genuine model replays and robot video when supplied by Joe.

### Recorded replay requirements
No genuine per-move traces or robot media are in this repository or the supplied
article assets. A recorded solve needs its scramble (from solved, fixed face
orientation), returned move sequence, checkpoint identifier, search settings and
provenance/date. Per-step policy/value outputs are optional and must be recorded,
not inferred or fabricated. A video needs a supplied file and a short description.
Before publishing a replay, verify that its moves reach the solved state. The
browser cube can then reuse the same stepping controls for this data.

## 2. Quantization
- [x] Add an interactive synthetic-weight example: INT8, INT4 and scaled E2M1.
- [x] Expose block size and outlier strength; show original/reconstructed values,
  per-weight differences, mean absolute error and maximum absolute error.
- [x] State scale selection and rounding rules. E2M1 uses an ideal scale in this
  illustration; it is not a bit-exact NVFP4 implementation or model benchmark.
- [x] Add weight-storage estimates with explicit assumptions. Keep NVFP4's FP8
  scale overhead separate from the simplified numeric demonstration.
- [x] Link explanations to the article and NVIDIA's primary format reference.

## Delivery
- Preserve original articles and existing article-restoration changes.
- Use native HTML/CSS/SVG/JavaScript, responsive layouts, keyboard controls,
  textual data alternatives, visible focus and reduced-motion preferences.
- Document routes and local serving in README. This site has no build step.
- Start/reuse a local static server for Joe's review. Do not deploy publicly.
- Do not add or run automated tests unless requested. Browser review and a
  dedicated verification pass can follow Joe's first review.

## Follow-up
Genuine replay/video depends on source material. Article accuracy corrections
are already in separately labelled drafts in the source folder; integrating those
reviewed drafts into published article text is a separate editorial step.

## Implementation log
- Inspected the existing routes, inverse-move console, source results and assets.
- Confirmed the available cube interaction does not call a model.
- Checked NVIDIA's NVFP4 format reference for scale and storage assumptions:
  https://developer.nvidia.com/blog/introducing-nvfp4-for-efficient-and-accurate-low-precision-inference/

- Implemented both experiment pages in `lab.js`, with responsive styles and
  links from the homepage, navigation, search, model registry and articles.
- Mindcuber supports generated quarter-turn scrambles and custom notation
  (including half turns), playback speed, pause, stepping, restart and all-face
  inspection. Playback stops when navigating away or hiding the tab.
- Added the article's four aggregate result samples, with source limitations.
- Replaced the old console with a link to the experiment, removed the live
  Mindcuber badge and replaced the unsupported 87% registry figure with the
  article's reported 37/100 result on 20-move scrambles.
- Added three quantization modes, block-size/outlier controls, a comparison plot,
  exact-value table and four-format weight-storage estimates.
- Updated README with routes and assumptions. The existing Python server is
  listening on 127.0.0.1:8000; static changes need only a browser refresh.
- No automated tests or browser interaction checks were run in this pass.
  The implementation is ready for Joe's initial local review; runtime and visual
  verification remain follow-up work when requested.

### Cube visual revision
- Replaced the distorted SVG projection with a perspective CSS 3D cube made of
  26 solid pieces, with equal dimensions on all three axes and inset stickers.
- Each move rotates the complete nine-piece layer through 90 or 180 degrees.
  Forward/back steps and playback share the same animation and commit the
  logical state only after the turn finishes.
- Pause finishes the current turn; restart/new scrambles cancel it. Navigation
  cancels pending frames and timers. Reduced-motion preferences skip rotation.
- Added a rotating front/back camera, piece gaps, dark interiors and shading.
- Code reviewed; browser verification and automated tests were not run.
