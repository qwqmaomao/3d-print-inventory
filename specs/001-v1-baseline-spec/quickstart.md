# Quickstart Validation Guide: 3D 打印耗材库存 v1.0 基线

## Prerequisites

- Open the repository root.
- Use a modern desktop browser for manual validation.
- Keep a backup of real browser data before destructive restore tests.
- Optional syntax check requires Node.js.

## Static Checks

1. Run JavaScript syntax validation:

   ```powershell
   node --check app.js
   ```

   Expected: command exits successfully with no syntax errors.

2. Confirm local vendor files exist:

   ```powershell
   Get-ChildItem vendor
   ```

   Expected: spreadsheet, ZIP, and QR library files are present.

## Open the App

1. Open `index.html` directly in a browser.
2. Confirm the header shows the 3D printing filament inventory application.
3. Confirm tabs exist for inventory, consumption, calculator, queue, scan,
   restock, duplicates, quality, audit, labels, and trash.

## Inventory Baseline

1. Add a filament with brand, material, color, diameter, quantity, remaining
   weight, location, purchase price, and notes.
2. Confirm the inventory row appears and statistics update.
3. Edit brand, material, color, quantity, remaining weight, location, and status
   inline.
4. Refresh the page.

Expected:
- Edits persist.
- Capacity is quantity times per-spool weight.
- Low stock and over-capacity states are visually distinguishable.

## Import and Image Baseline

1. Import `耗材储存.xlsx`.
2. Review the import preview.
3. Confirm import.

Expected:
- Project-specific columns map to inventory fields.
- `重量/卷数` becomes remaining weight and quantity.
- WPS images show when extractable; missing images do not block import.

## Backup and Restore Baseline

1. Export JSON backup.
2. Export full ZIP backup.
3. In a test browser profile or after backing up current data, restore the ZIP.

Expected:
- JSON downloads as a structured text backup.
- ZIP contains `data.json` and `images/` when images exist.
- ZIP restore asks for confirmation and restores records plus available images.

## Consumption and Queue Baseline

1. Add a manual consumption record for an inventory item.
2. Confirm remaining weight decreases and a consumption record appears.
3. Create a queue task with two material lines.
4. Complete the queue task.

Expected:
- Each material line creates a consumption record.
- Each related inventory item is deducted.
- Queue status becomes completed.

## Duplicate and Quality Baseline

1. Create two intentionally similar inventory records.
2. Run duplicate detection.
3. Inspect score, level, field comparison, conflict hint, and merge advice.
4. Ignore the result.
5. Open inventory health check.

Expected:
- Duplicate results are explainable.
- Ignored duplicate pairs are hidden by default.
- Health check respects ignored duplicate pairs unless ignored items are shown.

## Labels and Scan Baseline

1. Select two inventory rows.
2. Click batch print labels.
3. Confirm the labels page shows only selected labels.
4. Switch label size among small, medium, and large.
5. Use manual scan lookup with `FIL-0001`, `index.html#filament=FIL-0001`, or
   `FIL-0001-01` using an existing code.
6. Use quick consume for 10g.

Expected:
- Labels show readable codes and QR areas.
- Manual scan resolves the main filament item.
- Quick consume deducts stock and creates a consumption record.

## Regression Rule for Future Changes

Any future implementation touching a workflow above must repeat the relevant
scenario and document the result before completion.
