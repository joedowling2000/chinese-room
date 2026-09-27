# Chinese Room

Personal research site for [chineseroom.io](https://chineseroom.io), built as a small static site using the dark, lime-accented v2 design in `Chinese Room personal site (2)/`.

## Run locally

The site has no build step or dependencies. Open `index.html` directly, or serve the folder with any static file server. For example:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish

The repository root is the static site's document root. In Cloudflare Pages, use no framework preset, leave the build command blank, and set the build output directory to `.`. Connect the Git repository, deploy, then add `chineseroom.io` under the Pages project's Custom domains and follow the DNS setup Cloudflare presents for the zone. The root `index.html` is the entry page.

The site includes an interactive attention-link illustration and a Rubik's cube inverse-move demo. Neither makes a request to a hosted model or API. The research pages link to the original files in `articles/`.

## Project layout

- `index.html`, `styles.css`, `app.js`: site shell, styling, and client-side navigation/content
- `assets/`: visual assets
- `articles/`: supplied source articles and papers
- `feed.xml`: RSS feed
- `robots.txt`, `sitemap.xml`: crawler discovery
