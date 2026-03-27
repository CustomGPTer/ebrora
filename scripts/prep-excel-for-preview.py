#!/usr/bin/env python3
"""
prep-excel-for-preview.py
Opens an xlsx/xlsm file, activates the 2nd sheet (or 1st if only one),
sets it to A3 landscape with fit-to-page, saves to a temp file.

Usage:
    python3 scripts/prep-excel-for-preview.py input.xlsx /tmp/output.xlsx

Exit codes:
    0 = success
    1 = error (message on stderr)
"""

import sys
import os

try:
    import openpyxl
except ImportError:
    print("ERROR: openpyxl not installed. Run: pip install openpyxl", file=sys.stderr)
    sys.exit(1)


def main():
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <input.xlsx> <output.xlsx>", file=sys.stderr)
        sys.exit(1)

    src = sys.argv[1]
    dst = sys.argv[2]

    if not os.path.isfile(src):
        print(f"ERROR: File not found: {src}", file=sys.stderr)
        sys.exit(1)

    try:
        wb = openpyxl.load_workbook(src)
    except Exception as e:
        print(f"ERROR: Cannot open workbook: {e}", file=sys.stderr)
        sys.exit(1)

    sheets = wb.sheetnames

    # Pick 3rd sheet if it exists, then 2nd, then 1st
    if len(sheets) >= 3:
        target_name = sheets[2]
        target_index = 2
    elif len(sheets) >= 2:
        target_name = sheets[1]
        target_index = 1
    else:
        target_name = sheets[0]
        target_index = 0

    ws = wb[target_name]

    # Delete all other sheets so LibreOffice only renders the target
    for name in sheets:
        if name != target_name:
            del wb[name]

    wb.active = 0  # Now only one sheet remains at index 0

    # Set A3 landscape, fit to one page wide (unlimited height)
    ws.page_setup.paperSize = ws.PAPERSIZE_A3
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr = openpyxl.worksheet.properties.PageSetupProperties(fitToPage=True)

    try:
        wb.save(dst)
        print(f"OK: Sheet '{target_name}' ({len(sheets)} sheets total) -> {dst}")
    except Exception as e:
        print(f"ERROR: Cannot save: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
