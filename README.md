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

- `http://localhost:8000/#maths` — the seven concepts and their flat diagrams.
- `http://localhost:8000/#maths/play` — **The Field Instruments**, seven mathematical games with three authored chambers each.
- Direct game route: `#maths/play/linear-maps` (also `folding`, `gradient-descent`, `attention`, `rotary`, `dimensions`, `ablation`).
- Change the instrument using its handles or native controls — every range has labelled −/+ step buttons and visible bounds — inspect the live preview, then **Run trial**. **Step trial** inspects individual probes. Contour Pilot advances one or four real optimiser updates and offers per-update **Rewind here** from its update history.
- After a trial, **Replay trial** plays the captured result back with **Pause/Resume**, and the **Measurements** panel lists probes or update frames with their real inputs, outputs and errors, plus the full configuration. **The maths** shows your actual state and links the primary reference.
- **Undo** restores a previous configuration (first clearing an inspected trial or uncommitted preview); **Reset** restores the chamber. Hints are progressive; using a chamber's final hint marks that completion **assisted**, labelled in the chamber navigation and the catalogue. Completed chambers offer **Restore solution**, which is itself undoable.
- Keyboard: native controls support arrows; Enter from the stage runs a trial, Z undoes, Space pauses or resumes replay, and Esc returns to the collection. Touch-only play is supported through the controls.
- Progress and preferences are saved on this device under a versioned store when local storage is available. The collection has a progress reset with an undo option. No account or model API is used. Note: Contour Pilot now records a per-update snapshot history; saves written before that schema existed are retained verbatim in a separate local backup entry (no data loss), while the new session starts fresh. Other instruments keep compatible saved completions.
- Motion and sound are optional. Reduced-motion preferences disable decorative animation; all calculations and completion rules remain available.
- On another device on the same network, use this machine's current LAN IP instead of `localhost` (for example `http://192.168.1.144:8000/#maths/play`). The server must listen on the LAN interface.

Implementation progress and remaining review work are recorded in [the live plan](docs/maths-games/PLAN.md). [Design](docs/maths-games/DESIGN.md), [research](docs/maths-games/RESEARCH.md), and [numerical witness fixtures](docs/maths-games/FIXTURES.md) are kept alongside it. The current build is a local review candidate; physical iPad and unaided user testing remain outstanding.

## Interactive lab

- `http://localhost:8000/#lab` — experiment index
- `http://localhost:8000/#lab/mindcuber` — cube simulation, custom/random scrambles, reversal playback, unfolded view and reported epoch-10 results
- `http://localhost:8000/#lab/quantization` — synthetic weight rounding, block scales, outlier control, exact-value table and storage estimates

Mindcuber currently demonstrates reversal of a known scramble. It does not run the trained model. Real solve recordings and robot video are pending source files. The results explorer uses the source article’s aggregate figures, not individual solve logs.

Quantization compares symmetric INT8/INT4 and E2M1 with an ideal scale. It does not emulate full NVFP4 scale encoding. The separate storage calculator includes NVFP4 block-scale overhead and states excluded costs.

See [PLAN.md](PLAN.md) for the implementation status, source requirements and follow-up work. Changes to static files are available immediately after refreshing the browser; no rebuild is needed for the local source preview.

## Project layout

- `index.html`, `styles.css`, `field.css`, `app.js`, `field.js`: site shell, layout base, Field theme, and client-side navigation/content
- `lab.js`: cube geometry, experiment pages and quantization calculations
- `maths.js`: The Maths of AI page, flat diagram plumbing and full-screen diagrams; game launch links
- `maths/*.js`: explanatory copy and flat illustrations; legacy Abstract renderers retained during migration
- `maths-games/`: the new model-driven game host, seven instruments, authored chamber data and scoped stylesheet
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
