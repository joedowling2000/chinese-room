#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if [ "$#" -gt 1 ]; then echo 'Usage: prepare-hosting.sh [NEW_OUTPUT_DIRECTORY]' >&2; exit 1; fi
if [ "$#" -eq 1 ]; then
  if [ -z "$1" ]; then echo 'Output directory must not be empty' >&2; exit 1; fi
  case "$1" in /*) output="$1" ;; *) output="$PWD/$1" ;; esac
  if [ -e "$output" ] || [ -L "$output" ]; then echo 'Output directory already exists; choose a new directory' >&2; exit 1; fi
else
  output="$PWD/dist"
  if [ -L "$output" ]; then echo 'Refusing to replace a symlinked dist directory' >&2; exit 1; fi
  rm -rf "$output"
fi
mkdir -p "$output/articles" "$output/assets"
cp index.html app.js lab.js field.js maths.js maths-map.js experiences.js styles.css field.css experiences.css maths-map.css favicon.svg robots.txt sitemap.xml feed.xml "$output/"
# Only the published article files; articles/source-materials/ is a private review archive.
find articles -maxdepth 1 -type f -exec cp {} "$output/articles/" \;
cp assets/* "$output/assets/"
cp -R maths-art "$output/maths-art"
printf 'Prepared static site in %s\n' "$output"
