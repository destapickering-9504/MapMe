#!/usr/bin/env bash
# Merge chapter markdown files and produce MapMe-User-Manual.pdf (requires Node + md-to-pdf).
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
# Use system Chrome via md-to-pdf.config.json. If PDF generation fails, try:
#   export PUPPETEER_SKIP_DOWNLOAD=0
# and remove launch_options in md-to-pdf.config.json so Puppeteer can download Chromium once.

TMP="$(mktemp /tmp/mapme-manual-XXXXXX).md"
cleanup() { rm -f "$TMP"; }
trap cleanup EXIT

{
  cat <<'EOF'
---
pdf_options:
  format: Letter
  printBackground: true
document_title: MapMe User Manual
---

# MapMe User Manual

Combined guide: sign-in, Planner, History, Profile, and guest vs signed-in use.

EOF
  for f in \
    01-sign-up-sign-in.md \
    02-planner.md \
    03-history.md \
    04-profile.md \
    05-user-vs-non-user.md
  do
    echo ""
    echo ""
    cat "$f"
  done
} >"$TMP"

MDPDF="$DIR/node_modules/.bin/md-to-pdf"
if [[ -x "$MDPDF" ]]; then
  RUN=("$MDPDF")
else
  RUN=(npx --yes md-to-pdf)
fi
"${RUN[@]}" \
  --basedir "$DIR" \
  --stylesheet "$DIR/pdf-print.css" \
  --config-file "$DIR/md-to-pdf.config.json" \
  "$TMP"

PDF_OUT="${TMP%.md}.pdf"
mv "$PDF_OUT" "$DIR/MapMe-User-Manual.pdf"
echo "Wrote $DIR/MapMe-User-Manual.pdf"
