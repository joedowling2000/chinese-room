# Chinese Room

Personal research site for [chineseroom.io](https://chineseroom.io), built as a small static site using the dark, lime-accented v2 design in `Chinese Room personal site (2)/`.

## Run locally

The site has no build step or dependencies. Serve the folder with any static file server (asset URLs are relative to the server root). For example:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish

The repository root is the static site's document root. In Cloudflare Pages, use no framework preset, leave the build command blank, and set the build output directory to `.`. Connect the Git repository, deploy, then add `chineseroom.io` under the Pages project's Custom domains and follow the DNS setup Cloudflare presents for the zone. The root `index.html` is the entry page.

The site includes a browser-only interactive lab and an illustrative attention diagram. No experiment makes a request to a hosted model or API. The research pages link to the original files in `articles/`.

## Interactive lab

- `http://localhost:8000/#lab` — experiment index
- `http://localhost:8000/#lab/mindcuber` — cube simulation, custom/random scrambles, reversal playback, unfolded view and reported epoch-10 results
- `http://localhost:8000/#lab/quantization` — synthetic weight rounding, block scales, outlier control, exact-value table and storage estimates

Mindcuber currently demonstrates reversal of a known scramble. It does not run the trained model. Real solve recordings and robot video are pending source files. The results explorer uses the source article’s aggregate figures, not individual solve logs.

Quantization compares symmetric INT8/INT4 and E2M1 with an ideal scale. It does not emulate full NVFP4 scale encoding. The separate storage calculator includes NVFP4 block-scale overhead and states excluded costs.

See [PLAN.md](PLAN.md) for the implementation status, source requirements and follow-up work. Changes to static files are available immediately after refreshing the browser; there is no rebuild command.

## Project layout

- `index.html`, `styles.css`, `app.js`: site shell, styling, and client-side navigation/content
- `lab.js`: cube geometry, experiment pages and quantization calculations
- `PLAN.md`: interactive-site plan and progress
- `assets/`: visual assets
- `articles/`: supplied source articles and papers
- `feed.xml`: RSS feed
- `robots.txt`, `sitemap.xml`: crawler discovery
