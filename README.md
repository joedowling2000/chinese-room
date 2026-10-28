# Chinese Room

Personal research site for [chineseroom.io](https://chineseroom.io), built as a small static site with the "Field" production design — a dark, cinematic theme with procedural mathematical artwork (`field.js`/`field.css`).

## Run locally

The site has no bundler or runtime dependencies. Serve the folder with any static file server (asset URLs are relative to the server root). For example:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Design history

The production design is Field (dark shell, mathematical vector artwork). Two local-only artifacts are kept for reference and are excluded from `dist/` builds:

- `backups/folio-monochrome/` — frozen snapshot of the previously approved monochrome folio.
- `concepts/` (`?concept=field|library|atlas`) — the interactive homepage studies Field was selected from.

All artwork is deterministic procedural SVG generated locally by `node scripts/generate-field-art.mjs` into `assets/field-*.svg` — decorative geometry, not experimental data. Re-run that command only when intentionally regenerating the art; it is not part of the build.

## Publish

The site is hosted on Firebase Hosting in the `chineseroom-site` GCP project and served at `chineseroom.io`. See [Deploy on Google Cloud](#deploy-on-google-cloud). The root `index.html` is the entry page.

The site includes browser-only interactive experiments and decorative mathematical artwork. No experiment makes a request to a hosted model or API. The research pages link to the original files in `articles/`.

## The maths of AI

- `http://localhost:8000/#maths` — the seven concepts in prose, each beside a live preview of its Interiors artwork.
- `http://localhost:8000/#interiors` — **Interiors** on the home page (the old `#maths/play` gallery route redirects here): seven interactive artworks from inside a language model. Each opens as a full-screen piece at `#maths/play/<id>`, drawn by the mathematics it depicts:

| Route | Artwork | Maths | Interaction |
| --- | --- | --- | --- |
| `#maths/play/linear-maps` | Lattice | Matrix multiplication | Drag the basis arrows î, ĵ; the whole embedding space bends |
| `#maths/play/folding` | Kaleidoscope | ReLU activation | Each ReLU neuron is a folding mirror; paint once and the stroke repeats in every linear region; add layers, switch ReLU off (WebGL2) |
| `#maths/play/gradient-descent` | Descent | Gradient descent | Drop seeds on a ridgeline loss landscape; tune η and momentum |
| `#maths/play/attention` | Loom | Softmax attention | Tap a word; threads are softmax weights from four toy heads |
| `#maths/play/rotary` | Orrery | Rotary position embedding | Drag the sentence; position is rotation, score depends only on distance |
| `#maths/play/dimensions` | Crowded Sky | Superposition | Add concepts, light stars, watch interference; random angles in 1,000-D |
| `#maths/play/ablation` | Nullspace | Orthogonal projection | Turn a blade through a cloud of activations and delete a direction |

- Each piece walks the viewer through 4–5 discoveries with a guiding prompt line; **The maths** (`M`) opens a live drawer with the equation, the viewer's current numbers, a plain-English walkthrough, an "inside the model" note, an honesty note about what is synthetic, and primary references. `S` toggles optional generative sound, `Space` pauses ambient motion, `Esc` exits.
- Everything runs locally in the browser; no model or API is called. Data are small and synthetic, and each piece says so.
- Static servers like `python3 -m http.server` let Chrome cache scripts heuristically; hard-reload after editing.

Design, review and progress log: [docs/maths-games/DESIGN.md](docs/maths-games/DESIGN.md), [docs/maths-games/PLAN.md](docs/maths-games/PLAN.md), [docs/maths-games/RESEARCH.md](docs/maths-games/RESEARCH.md).

## Interactive lab

- `http://localhost:8000/#lab` — experiment index
- `http://localhost:8000/#lab/mindcuber` — cube simulation, custom/random scrambles, reversal playback, unfolded view and reported epoch-10 results
- `http://localhost:8000/#lab/quantization` — synthetic weight rounding, block scales, outlier control, exact-value table and storage estimates

Mindcuber currently demonstrates reversal of a known scramble. It does not run the trained model. The results explorer uses the source article’s aggregate figures, not individual solve logs.

Quantisation compares symmetric INT8/INT4 and E2M1 with an ideal scale. It does not emulate full NVFP4 scale encoding. The separate storage calculator includes NVFP4 block-scale overhead and states excluded costs.

See [PLAN.md](PLAN.md) for the implementation status, source requirements and follow-up work. Changes to static files are available immediately after refreshing the browser; no rebuild is needed for the local source preview.

## Project layout

- `index.html`, `styles.css`, `field.css`, `app.js`, `field.js`: site shell, layout base, Field theme, and client-side navigation/content
- `lab.js`: cube geometry, experiment pages and quantisation calculations
- `experiences.js`, `experiences.css`: purpose labels for the maths topics and lab pages (see `enhancement_plan.md`)
- `maths.js`: The Maths of AI page: the seven ideas' copy and a live poster of each artwork linking into Interiors
- `maths-map.js`, `maths-map.css`: "Where each idea lives", an animated transit map of one token's trip through a transformer, with the seven ideas as stations
- `maths-art/`: Interiors — `host.js` (gallery, full-bleed frame, prompts, maths drawer, sound), `interiors.css`, and one file per artwork in `pieces/`
- `scripts/generate-field-art.mjs`: regenerates the procedural SVG artwork in `assets/`
- `PLAN.md`: interactive-site plan and progress
- `assets/`: visual assets
- `articles/`: supplied source articles and papers
- `feed.xml`: RSS feed
- `robots.txt`, `sitemap.xml`: crawler discovery

## Deploy on Google Cloud

The site is served by Firebase Hosting (HTTPS + CDN, no running server).

| | |
|---|---|
| GCP project | `chineseroom-site` (org `chineseroom.io`, folder `chineseroom`) |
| Hosting site | `chineseroom-site` → https://chineseroom-site.web.app |
| Custom domains | `chineseroom.io` (primary), `www.chineseroom.io` (redirects to apex) |
| Billing | **None linked** (Firebase Spark plan). The site cannot incur charges; if free-tier limits are exceeded, serving pauses instead. |

### Deploying

Deploys use the active `gcloud` account (`admin@chineseroom.io`, YubiKey-protected)
via the Firebase Hosting REST API. No Firebase CLI login is stored on the machine.

```sh
gcloud auth login admin@chineseroom.io     # only if gcloud asks to re-authenticate (every 8h)
./scripts/prepare-hosting.sh               # rebuild dist/
python3 scripts/deploy.py chineseroom-site # upload changed files, release
```

`deploy.py` gzips each file in `dist/`, uploads only files whose hash changed,
applies the `headers` from `firebase.json`, and releases the new version. To roll
back, open Firebase console → Hosting → Release history → *Rollback*.

`dist/` is generated and ignored by Git.

### DNS (Cloudflare, DNS-only / grey cloud)

| Type | Name | Content |
|---|---|---|
| A | `@` | `199.36.158.100` |
| TXT | `@` | `hosting-site=chineseroom-site` |
| CNAME | `www` | `chineseroom-site.web.app` |
| TXT | `_acme-challenge.www` | certificate challenge (can be removed once the cert is active) |

Keep the existing `google-site-verification`, `v=spf1 -all` and `_dmarc` records;
Cloud Identity relies on the verification record. If you switch the A/CNAME
records to *proxied* later, set Cloudflare SSL/TLS mode to **Full (strict)**.
See [Firebase's custom-domain guide](https://firebase.google.com/docs/hosting/custom-domain).
