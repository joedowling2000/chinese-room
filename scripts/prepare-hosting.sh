#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if [ -L dist ]; then echo 'Refusing to replace a symlinked dist directory' >&2; exit 1; fi
rm -rf dist
mkdir -p dist/articles dist/assets dist/maths
cp index.html app.js lab.js field.js maths.js styles.css field.css favicon.svg robots.txt sitemap.xml feed.xml dist/
cp articles/* dist/articles/
cp assets/* dist/assets/
cp maths/*.js dist/maths/
