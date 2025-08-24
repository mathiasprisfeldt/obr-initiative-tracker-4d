#!/usr/bin/env bash
set -euo pipefail

# Usage: prepare-site.sh <target:test|prod> [site_dir=./site] [preserve_dir]
TARGET="${1:-}"
SITE_DIR="${3:-./site}"
PRESERVE_DIR="${4:-}"

if [[ -z "$TARGET" || ("$TARGET" != "test" && "$TARGET" != "prod") ]]; then
  echo "error: first argument must be 'test' or 'prod'" >&2
  exit 2
fi

mkdir -p "$SITE_DIR"

# If gh-pages exists, fetch and reuse preserved directory and root files
if git ls-remote --exit-code origin gh-pages >/dev/null 2>&1; then
  git fetch --depth=1 origin gh-pages:gh-pages
  rm -rf old-site
  mkdir -p old-site
  git --work-tree=old-site checkout gh-pages -- .

  if [[ -n "$PRESERVE_DIR" && -d "old-site/$PRESERVE_DIR" ]]; then
    echo "Preserving existing '$PRESERVE_DIR' from gh-pages"
    mkdir -p "$SITE_DIR/$PRESERVE_DIR"
    cp -a "old-site/$PRESERVE_DIR/." "$SITE_DIR/$PRESERVE_DIR/"
  fi

  for f in CNAME .nojekyll; do
    if [[ -f "old-site/$f" ]]; then
      cp "old-site/$f" "$SITE_DIR/"
    fi
  done
fi

# Replace target directory with new build contents
rm -rf "$SITE_DIR/$TARGET"
mkdir -p "$SITE_DIR/$TARGET"
cp -a "dist/." "$SITE_DIR/$TARGET/"

echo "Prepared site at '$SITE_DIR' with:"
find "$SITE_DIR" -maxdepth 2 -type d -print
