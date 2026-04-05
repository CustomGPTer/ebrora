#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# fix-and-generate-docx-previews.sh
# Comprehensive script for GitHub Codespaces:
#   1. Installs dependencies (LibreOffice, poppler-utils, ImageMagick)
#   2. Fixes mismatched subcategory slugs in filenames
#   3. Removes duplicate "(1)" files
#   4. Generates missing DOCX preview images (skips existing)
#   5. Copies all previews to public/ directory
#
# USAGE:
#   bash scripts/fix-and-generate-docx-previews.sh           # skip existing
#   bash scripts/fix-and-generate-docx-previews.sh --force    # regenerate all
#   bash scripts/fix-and-generate-docx-previews.sh --dry-run  # show what would be done
#
# PREVIEW SPEC (matches existing previews):
#   Format:   JPEG, quality 35–40 (watermarked, low-quality preview)
#   Size:     827 × 1170 px (A4 portrait @ 100 DPI)
#   Overlay:  Diagonal "PREVIEW" watermarks + green info bar
#   Output:   {filename}.preview.jpg alongside originals
#             + copied to public/free-templates/previews/
#
# REQUIRES (auto-installed if missing):
#   libreoffice, pdftoppm (poppler-utils), imagemagick, python3
# ─────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DATA_DIR="$PROJECT_ROOT/data/free-templates"
PUBLIC_PREVIEWS="$PROJECT_ROOT/public/free-templates/previews"
TMP_DIR=$(mktemp -d)
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

FORCE=false
DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --force)  FORCE=true ;;
    --dry-run) DRY_RUN=true ;;
  esac
done

# Counters
FIX_RENAMED=0
FIX_DUPES=0
TOTAL=0; SKIPPED=0; SUCCESS=0; FAILED=0

trap 'rm -rf "$TMP_DIR"' EXIT

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   DOCX Preview Generator & Filename Fixer           ║"
echo "║   Ebrora Free Templates — Codespaces Edition        ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  Source:   $DATA_DIR"
echo "║  Force:    $FORCE"
echo "║  Dry run:  $DRY_RUN"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ─────────────────────────────────────────────────────────────────────
# STEP 0: Install dependencies (Codespaces-friendly)
# ─────────────────────────────────────────────────────────────────────
echo "── Step 0: Checking dependencies ──"

install_needed=false
for cmd in libreoffice pdftoppm convert identify; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "  ⚠ Missing: $cmd"
    install_needed=true
  else
    echo "  ✓ $cmd"
  fi
done

if [[ "$install_needed" == "true" ]]; then
  echo ""
  echo "  Installing missing dependencies..."
  sudo apt-get update -qq
  sudo apt-get install -y -qq libreoffice-writer poppler-utils imagemagick fonts-dejavu >/dev/null 2>&1
  echo "  ✓ Dependencies installed"
fi

# Font fallback
if [[ ! -f "$FONT" ]]; then
  FONT=$(fc-list : file 2>/dev/null | grep -i "dejavu.*sans\." | head -1 | cut -d: -f1 || true)
  [[ -z "$FONT" ]] && FONT=""
fi

echo ""

# ─────────────────────────────────────────────────────────────────────
# STEP 1: Fix mismatched subcategory slugs
# ─────────────────────────────────────────────────────────────────────
echo "── Step 1: Fixing mismatched subcategory slugs ──"

declare -A SLUG_FIXES=(
  ["environmental--dust-and-noise-control--"]="environmental--dust-noise-control--"
  ["handover-and-completion--o-and-m-documentation--"]="handover-and-completion--om-documentation--"
)

for old_prefix in "${!SLUG_FIXES[@]}"; do
  new_prefix="${SLUG_FIXES[$old_prefix]}"
  for filepath in "$DATA_DIR"/${old_prefix}*; do
    [[ ! -f "$filepath" ]] && continue
    filename=$(basename "$filepath")
    new_filename="${new_prefix}${filename#*${old_prefix}}"

    if [[ -f "$DATA_DIR/$new_filename" ]]; then
      echo "  ⚠ Target already exists, skipping: $new_filename"
      continue
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
      echo "  [dry-run] Would rename: $filename"
      echo "                      →  $new_filename"
    else
      mv "$DATA_DIR/$filename" "$DATA_DIR/$new_filename"
      echo "  ✓ Renamed: $filename"
      echo "           → $new_filename"
      # Also rename preview if it exists
      if [[ -f "$DATA_DIR/${filename}.preview.jpg" ]]; then
        mv "$DATA_DIR/${filename}.preview.jpg" "$DATA_DIR/${new_filename}.preview.jpg"
        echo "    + Renamed preview too"
      fi
    fi
    FIX_RENAMED=$((FIX_RENAMED + 1))
  done
done

if [[ $FIX_RENAMED -eq 0 ]]; then
  echo "  ✓ No mismatched slugs found (already fixed or not present)"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────
# STEP 2: Remove duplicate "(1)" files
# ─────────────────────────────────────────────────────────────────────
echo "── Step 2: Removing duplicate files ──"

for filepath in "$DATA_DIR"/*" (1)".*; do
  [[ ! -f "$filepath" ]] && continue
  filename=$(basename "$filepath")

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "  [dry-run] Would remove: $filename"
  else
    rm -f "$filepath"
    # Also remove its preview if it exists
    rm -f "${filepath}.preview.jpg"
    rm -f "${filepath}.preview.png"
    echo "  ✓ Removed: $filename"
  fi
  FIX_DUPES=$((FIX_DUPES + 1))
done

if [[ $FIX_DUPES -eq 0 ]]; then
  echo "  ✓ No duplicates found"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────
# STEP 3: Generate missing DOCX previews
# ─────────────────────────────────────────────────────────────────────
echo "── Step 3: Generating DOCX preview images ──"
echo ""

# Count how many need doing
NEED_COUNT=0
for filepath in "$DATA_DIR"/*.docx; do
  [[ ! -f "$filepath" ]] && continue
  preview_path="${filepath}.preview.jpg"
  if [[ ! -f "$preview_path" || "$FORCE" == "true" ]]; then
    NEED_COUNT=$((NEED_COUNT + 1))
  fi
done

echo "  DOCX files needing previews: $NEED_COUNT"
echo ""

if [[ "$DRY_RUN" == "true" ]]; then
  echo "  [dry-run] Would generate $NEED_COUNT preview images"
  echo ""
else
  PROGRESS=0
  for filepath in "$DATA_DIR"/*.docx; do
    [[ ! -f "$filepath" ]] && continue

    TOTAL=$((TOTAL + 1))
    filename=$(basename "$filepath")
    preview_path="${filepath}.preview.jpg"

    # Skip if preview exists (unless --force)
    if [[ -f "$preview_path" && "$FORCE" != "true" ]]; then
      SKIPPED=$((SKIPPED + 1))
      continue
    fi

    PROGRESS=$((PROGRESS + 1))
    echo "  [$PROGRESS/$NEED_COUNT] $filename"

    # Clean temp dir
    rm -f "$TMP_DIR"/*

    # ── Convert DOCX → PDF via LibreOffice ──
    if ! libreoffice --headless --norestore --convert-to pdf \
      --outdir "$TMP_DIR" "$filepath" &>/dev/null; then
      echo "    ✗ LibreOffice conversion failed"
      FAILED=$((FAILED + 1))
      continue
    fi

    pdf_file=$(find "$TMP_DIR" -name "*.pdf" -type f | head -1)
    if [[ -z "$pdf_file" ]]; then
      echo "    ✗ No PDF produced"
      FAILED=$((FAILED + 1))
      continue
    fi

    # ── Render page 1 at 100 DPI → 827×1170 for A4 ──
    if ! pdftoppm -jpeg -r 100 -f 1 -l 1 -jpegopt quality=35 \
      "$pdf_file" "$TMP_DIR/page" 2>/dev/null; then
      echo "    ✗ Page render failed"
      FAILED=$((FAILED + 1))
      continue
    fi

    page_img=$(find "$TMP_DIR" -name "page-*.jpg" -type f | head -1)
    if [[ -z "$page_img" ]]; then
      echo "    ✗ No page image produced"
      FAILED=$((FAILED + 1))
      continue
    fi

    # ── Add watermark + green info bar (matches existing previews) ──
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
      echo "    ✗ Watermark/composite failed"
      FAILED=$((FAILED + 1))
      continue
    fi

    size=$(du -h "$preview_path" | cut -f1)
    echo "    ✓ Done ($size)"
    SUCCESS=$((SUCCESS + 1))
  done
fi

echo ""

# ─────────────────────────────────────────────────────────────────────
# STEP 4: Sync all previews to public/ directory
# ─────────────────────────────────────────────────────────────────────
echo "── Step 4: Syncing previews to public/ ──"

if [[ "$DRY_RUN" == "true" ]]; then
  echo "  [dry-run] Would sync previews to $PUBLIC_PREVIEWS"
else
  mkdir -p "$PUBLIC_PREVIEWS"
  COPIED=0
  for pv in "$DATA_DIR"/*.preview.jpg; do
    [[ ! -f "$pv" ]] && continue
    pv_name=$(basename "$pv")
    # Only copy if newer or missing in public/
    if [[ ! -f "$PUBLIC_PREVIEWS/$pv_name" ]] || [[ "$pv" -nt "$PUBLIC_PREVIEWS/$pv_name" ]]; then
      cp "$pv" "$PUBLIC_PREVIEWS/"
      COPIED=$((COPIED + 1))
    fi
  done
  echo "  ✓ Synced $COPIED new/updated previews to public/"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────
# STEP 5: Audit — check for any remaining category gaps
# ─────────────────────────────────────────────────────────────────────
echo "── Step 5: Category/subcategory audit ──"

python3 - "$DATA_DIR" "$PROJECT_ROOT/src/data/free-template-categories.ts" << 'PYEOF'
import sys, os, re

data_dir = sys.argv[1]
cat_file = sys.argv[2]

with open(cat_file) as f:
    content = f.read()

# Parse defined category → subcategory pairs
defined_pairs = set()
current_cat = None
cat_blocks = re.split(r'\{\s*\n\s*name:', content)
for block in cat_blocks[1:]:
    cat_m = re.search(r'slug:\s*"([^"]+)"', block)
    if not cat_m:
        continue
    cat_slug = cat_m.group(1)
    sub_section = block.split('subcategories:')
    if len(sub_section) < 2:
        continue
    for m in re.finditer(r'slug:\s*"([^"]+)"', sub_section[1]):
        defined_pairs.add((cat_slug, m.group(1)))

# Parse file pairs (DOCX only, skip dupes)
all_files = [f for f in os.listdir(data_dir)
             if f.endswith('.docx') and ' (1)' not in f and '.preview.' not in f]
file_pairs = {}
for f in all_files:
    parts = f.rsplit('.docx', 1)[0].split('--')
    if len(parts) >= 3:
        pair = (parts[0], parts[1])
        file_pairs.setdefault(pair, []).append(f)

missing = {p: files for p, files in file_pairs.items() if p not in defined_pairs}

# Count previews
has_preview = sum(1 for f in all_files
                  if os.path.exists(os.path.join(data_dir, f + '.preview.jpg')))
no_preview = len(all_files) - has_preview

print(f"  DOCX files:            {len(all_files)}")
print(f"  With preview:          {has_preview}")
print(f"  Without preview:       {no_preview}")
print(f"  Category pairs (def):  {len(defined_pairs)}")
print(f"  Category pairs (file): {len(file_pairs)}")
print()

if missing:
    print(f"  ⚠ {len(missing)} subcategory pair(s) in files but NOT in categories.ts:")
    for (cat, sub), files in sorted(missing.items()):
        print(f"    • {cat} → {sub}  ({len(files)} file(s))")
    print()
    print("  These DOCX files exist but won't appear on the site until")
    print("  the subcategory slug is added to free-template-categories.ts")
    print("  or the files are renamed to match an existing slug.")
else:
    print("  ✓ All file categories/subcategories match definitions")
PYEOF

echo ""

# ─────────────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════╗"
echo "║  SUMMARY                                            ║"
echo "╠══════════════════════════════════════════════════════╣"
if [[ "$DRY_RUN" == "true" ]]; then
echo "║  MODE:       Dry run (no changes made)              ║"
fi
echo "║  Filenames renamed:  $FIX_RENAMED"
echo "║  Duplicates removed: $FIX_DUPES"
if [[ "$DRY_RUN" != "true" ]]; then
echo "║  DOCX total:         $TOTAL"
echo "║  Previews created:   $SUCCESS"
echo "║  Previews skipped:   $SKIPPED (already exist)"
echo "║  Previews failed:    $FAILED"
fi
echo "╚══════════════════════════════════════════════════════╝"
echo ""

if [[ $FAILED -gt 0 ]]; then
  echo "⚠ $FAILED file(s) failed to convert. These may have corrupted"
  echo "  content or use features LibreOffice cannot render."
  echo "  Re-run with --force to retry, or check files manually."
fi
