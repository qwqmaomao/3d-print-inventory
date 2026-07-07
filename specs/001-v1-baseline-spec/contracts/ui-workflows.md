# Contract: UI Workflows

## Inventory

The inventory view must support:
- Summary statistics for total items, total quantity, total remaining weight,
  risk count, and pending queue count.
- Search by brand, material, color, location, and notes.
- Filters for material, brand, status, and location.
- Sorting by key inventory columns.
- Inline editing for common fields.
- Detail dialog editing for complex fields including purchase, drying, notes,
  and image.
- Row selection for batch label printing.

## Consumption

The consumption view must support:
- Adding a record with project, filament, grams, hours, and notes.
- Warning before recording a deduction greater than remaining stock.
- Displaying historical records with date, project, filament, grams, hours,
  cost, and notes.

## Queue

The queue view must support:
- Multiple material lines per task.
- Planned and actual consumption.
- Status filtering.
- Inventory risk warnings.
- Completion that creates consumption records.
- Failure handling with reason, optional deduction, and optional requeue.

## Calculator

The calculator must show quote details for material, electricity, wear, service
fees, failure loss, profit multiplier, minimum price, and final quote. Quote text
copying must remain available.

## Restock, Quality, Audit, and Trash

- Restock must show purchase recommendations and allow copy/export.
- Quality must show duplicate, missing-field, stock contradiction, missing-image,
  and drying issues, with ignore behavior.
- Audit must allow actual weighed values to update remaining stock and create
  adjustment records.
- Trash must allow restore, permanent delete, and clear all.

## Duplicate Detection

Duplicate results must show:
- Score and duplicate level.
- Merge advice.
- Field comparison table.
- Conflict hints.
- Natural-language explanation.
- Ignore control.
- Remember-not-duplicate control.
- Merge preview before any merge changes data.

## Labels and Scan

- Labels must include filament code, brand, material, color, diameter, remaining
  weight, location, and QR code area.
- Label sizes are small, medium, and large.
- QR content modes are filament code and hash link.
- Batch print must use selected inventory rows.
- Scan lookup must use camera scanning when supported and manual input fallback.
- Scan quick actions must include view details, quick consumption, custom
  deduction, mark opened, update location, audit entry, and add to queue.
