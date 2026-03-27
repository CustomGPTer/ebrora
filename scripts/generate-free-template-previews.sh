#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# generate-free-template-previews.sh
# Generates low-quality watermarked preview images for all free templates.
#
# USAGE:
#   bash scripts/generate-free-template-previews.sh           # skip existing
#   bash scripts/generate-free-template-previews.sh --force   # regenerate all
#
# REQUIREMENTS:
#   libreoffice, pdftoppm (poppler-utils), imagemagick (convert, identify)
#
# OUTPUT:
#   For each template file (e.g. cat--subcat--name.xlsx), creates:
#     cat--subcat--name.xlsx.preview.jpg
#   alongside the original in data/free-templates/
#
# The scanner in src/lib/free-templates.ts auto-detects .preview.jpg files.
# ─────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DATA_DIR="$PROJECT_ROOT/data/free-templates"
TMP_DIR=$(mktemp -d)
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FORCE=false

# Parse args
[[ "${1:-}" == "--force" ]] && FORCE=true

# Counters
TOTAL=0
SKIPPED=0
SUCCESS=0
FAILED=0

# Cleanup on exit
trap 'rm -rf "$TMP_DIR"' EXIT

echo "============================================"
echo "  Free Template Preview Generator"
echo "============================================"
echo "  Source:  $DATA_DIR"
echo "  Force:   $FORCE"
echo "  Temp:    $TMP_DIR"
echo "============================================"
echo ""

# Check dependencies
for cmd in libreoffice pdftoppm convert identify; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: '$cmd' not found. Install it first."
    exit 1
  fi
done

# If font doesn't exist, try fallback
if [[ ! -f "$FONT" ]]; then
  FONT=$(fc-list : file | grep -i "dejavu.*sans\." | head -1 | cut -d: -f1)
  if [[ -z "$FONT" ]]; then
    echo "WARNING: No suitable font found. Watermark text may not render."
    FONT=""
  fi
fi

# Process each template file
for filepath in "$DATA_DIR"/*.xlsx "$DATA_DIR"/*.xlsm "$DATA_DIR"/*.docx "$DATA_DIR"/*.pptx "$DATA_DIR"/*.pdf; do
  # Skip glob patterns that matched nothing
  [[ ! -f "$filepath" ]] && continue

  TOTAL=$((TOTAL + 1))
  filename=$(basename "$filepath")
  preview_path="${filepath}.preview.jpg"

  # Skip if preview already exists (unless --force)
  if [[ -f "$preview_path" && "$FORCE" != "true" ]]; then
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  echo "[$TOTAL] Processing: $filename"

  # Clean tmp for this file
  rm -f "$TMP_DIR"/*

  # ── Step 1: Convert to PDF ──
  ext="${filename##*.}"
  ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')

  if [[ "$ext_lower" == "pdf" ]]; then
    cp "$filepath" "$TMP_DIR/source.pdf"
  else
    # LibreOffice conversion
    if ! libreoffice --headless --convert-to pdf --outdir "$TMP_DIR" "$filepath" &>/dev/null; then
      echo "  ✗ LibreOffice conversion failed"
      FAILED=$((FAILED + 1))
      continue
    fi
    # Find the output PDF (filename may differ slightly)
    pdf_file=$(find "$TMP_DIR" -name "*.pdf" -type f | head -1)
    if [[ -z "$pdf_file" ]]; then
      echo "  ✗ No PDF produced"
      FAILED=$((FAILED + 1))
      continue
    fi
    mv "$pdf_file" "$TMP_DIR/source.pdf"
  fi

  # ── Step 2: Render page 1 at low DPI, heavy JPEG compression ──
  if ! pdftoppm -jpeg -r 100 -f 1 -l 1 -jpegopt quality=35 \
    "$TMP_DIR/source.pdf" "$TMP_DIR/page" 2>/dev/null; then
    echo "  ✗ PDF render failed"
    FAILED=$((FAILED + 1))
    continue
  fi

  page_img=$(find "$TMP_DIR" -name "page-*.jpg" -type f | head -1)
  if [[ -z "$page_img" ]]; then
    echo "  ✗ No page image produced"
    FAILED=$((FAILED + 1))
    continue
  fi

  # ── Step 3: Add watermark + bottom bar ──
  WIDTH=$(identify -format '%w' "$page_img")

  FONT_ARGS=""
  [[ -n "$FONT" ]] && FONT_ARGS="-font $FONT"

  if ! convert "$page_img" \
    $FONT_ARGS \
    -fill 'rgba(0,0,0,0.07)' -gravity center -pointsize 80 \
    -annotate -30x-30+0+0 'PREVIEW' \
    -fill 'rgba(0,0,0,0.06)' -pointsize 80 \
    -annotate -30x-30-200-200 'PREVIEW' \
    -annotate -30x-30+200+200 'PREVIEW' \
    -annotate -30x-30-200+200 'PREVIEW' \
    -annotate -30x-30+200-200 'PREVIEW' \
    \( -size "${WIDTH}x36" xc:'rgba(27,87,69,0.88)' \) -gravity south -composite \
    -fill white -gravity south -pointsize 13 $FONT_ARGS \
    -annotate +0+10 'Preview only  —  quality reduced for display purposes.  Download for full quality.' \
    -quality 40 \
    "$preview_path" 2>/dev/null; then
    echo "  ✗ Watermark failed"
    FAILED=$((FAILED + 1))
    continue
  fi

  size=$(du -h "$preview_path" | cut -f1)
  echo "  ✓ Done ($size)"
  SUCCESS=$((SUCCESS + 1))
done

echo ""
echo "============================================"
echo "  Complete!"
echo "  Total:   $TOTAL"
echo "  Created: $SUCCESS"
echo "  Skipped: $SKIPPED (already exist)"
echo "  Failed:  $FAILED"
echo "============================================"
