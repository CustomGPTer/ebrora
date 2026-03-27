#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# generate-free-template-previews.sh
# Generates low-quality watermarked preview images for all free templates.
#
# BEHAVIOUR:
#   Word (.docx)  → Page 1, as-is (portrait A4)
#   Excel (.xlsx/.xlsm) → 2nd sheet, A3 landscape, fit-to-page
#   All → 100 DPI, 35% JPEG, diagonal PREVIEW watermarks, green info bar
#
# USAGE:
#   bash scripts/generate-free-template-previews.sh           # skip existing
#   bash scripts/generate-free-template-previews.sh --force   # regenerate all
#
# REQUIREMENTS:
#   libreoffice (with -writer and -calc), pdftoppm, imagemagick, python3, openpyxl
#
# OUTPUT:
#   {filename}.preview.jpg alongside originals in data/free-templates/
#   Copies all previews to public/free-templates/previews/
# ─────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DATA_DIR="$PROJECT_ROOT/data/free-templates"
TMP_DIR=$(mktemp -d)
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
PREP_SCRIPT="$SCRIPT_DIR/prep-excel-for-preview.py"
FORCE=false

[[ "${1:-}" == "--force" ]] && FORCE=true

TOTAL=0; SKIPPED=0; SUCCESS=0; FAILED=0

trap 'rm -rf "$TMP_DIR"' EXIT

echo "============================================"
echo "  Free Template Preview Generator"
echo "============================================"
echo "  Source:  $DATA_DIR"
echo "  Force:   $FORCE"
echo "============================================"
echo ""

for cmd in libreoffice pdftoppm convert identify python3; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: '$cmd' not found."; exit 1
  fi
done

if ! python3 -c "import openpyxl" &>/dev/null; then
  echo "ERROR: openpyxl not installed. Run: pip install openpyxl"; exit 1
fi

if [[ ! -f "$PREP_SCRIPT" ]]; then
  echo "ERROR: prep-excel-for-preview.py not found at $PREP_SCRIPT"; exit 1
fi

if [[ ! -f "$FONT" ]]; then
  FONT=$(fc-list : file | grep -i "dejavu.*sans\." | head -1 | cut -d: -f1)
  [[ -z "$FONT" ]] && FONT=""
fi

for filepath in "$DATA_DIR"/*.xlsx "$DATA_DIR"/*.xlsm "$DATA_DIR"/*.docx "$DATA_DIR"/*.pptx "$DATA_DIR"/*.pdf; do
  [[ ! -f "$filepath" ]] && continue

  TOTAL=$((TOTAL + 1))
  filename=$(basename "$filepath")
  preview_path="${filepath}.preview.jpg"

  if [[ -f "$preview_path" && "$FORCE" != "true" ]]; then
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  echo "[$TOTAL] $filename"
  rm -f "$TMP_DIR"/*

  ext="${filename##*.}"
  ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')
  convert_source="$filepath"

  # ── Excel: prep 2nd sheet, A3 landscape ──
  if [[ "$ext_lower" == "xlsx" || "$ext_lower" == "xlsm" ]]; then
    prepped="$TMP_DIR/prepped.${ext_lower}"
    if ! python3 "$PREP_SCRIPT" "$filepath" "$prepped" 2>/dev/null; then
      echo "  ✗ Excel prep failed"
      FAILED=$((FAILED + 1))
      continue
    fi
    convert_source="$prepped"
  fi

  # ── Convert to PDF ──
  if [[ "$ext_lower" == "pdf" ]]; then
    cp "$filepath" "$TMP_DIR/source.pdf"
  else
    if ! libreoffice --headless --norestore --convert-to pdf --outdir "$TMP_DIR" "$convert_source" &>/dev/null; then
      echo "  ✗ LibreOffice failed"
      FAILED=$((FAILED + 1))
      continue
    fi
    pdf_file=$(find "$TMP_DIR" -name "*.pdf" -type f | head -1)
    if [[ -z "$pdf_file" ]]; then
      echo "  ✗ No PDF"
      FAILED=$((FAILED + 1))
      continue
    fi
    mv "$pdf_file" "$TMP_DIR/source.pdf"
  fi

  # ── Render page 1 ──
  if ! pdftoppm -jpeg -r 100 -f 1 -l 1 -jpegopt quality=35 \
    "$TMP_DIR/source.pdf" "$TMP_DIR/page" 2>/dev/null; then
    echo "  ✗ Render failed"
    FAILED=$((FAILED + 1))
    continue
  fi

  page_img=$(find "$TMP_DIR" -name "page-*.jpg" -type f | head -1)
  if [[ -z "$page_img" ]]; then
    echo "  ✗ No image"
    FAILED=$((FAILED + 1))
    continue
  fi

  # ── Watermark + bottom bar ──
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
  echo "  ✓ ($size)"
  SUCCESS=$((SUCCESS + 1))
done

echo ""

# ── Copy to public/ ──
PUBLIC_PREVIEWS="$PROJECT_ROOT/public/free-templates/previews"
mkdir -p "$PUBLIC_PREVIEWS"
COPIED=0
for pv in "$DATA_DIR"/*.preview.jpg; do
  [[ ! -f "$pv" ]] && continue
  cp "$pv" "$PUBLIC_PREVIEWS/"
  COPIED=$((COPIED + 1))
done

echo "============================================"
echo "  Complete!"
echo "  Total:   $TOTAL"
echo "  Created: $SUCCESS"
echo "  Skipped: $SKIPPED (already exist)"
echo "  Failed:  $FAILED"
echo "  Copied to public: $COPIED"
echo "============================================"
