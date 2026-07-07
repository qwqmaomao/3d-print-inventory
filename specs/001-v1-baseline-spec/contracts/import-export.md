# Contract: Import, Export, and Backup

## WPS/Excel Import

Supported file types:
- `.xlsx`
- `.xls` where the browser spreadsheet library can read it

Project-specific columns:
- `厂家` maps to brand.
- `材质` maps to material.
- `颜色` maps to color name.
- `重量/卷数` maps to current remaining weight and quantity.
- `备注图` maps to WPS image reference when it contains `DISPIMG`.
- `备注` maps to notes.
- `位置序列号` maps to location.

General aliases:
- Brand aliases include `品牌`, `厂家`, `制造商`, `厂商`.
- Material aliases include `材料`, `材质`, `类型`, `耗材类型`.
- Color aliases include `颜色`, `色号`, `颜色名称`, `颜色名`.
- Weight aliases include total and remaining weight variants.
- Position aliases include `位置`, `存放位置`, `收纳位置`, `位置序列号`.
- Purchase aliases include purchase date, price, shop/platform, and batch fields.

Import behavior:
- Import must show a preview before records are committed.
- `重量/卷数` weight is current remaining total weight.
- Capacity is quantity times 1000g unless the record is later edited.
- WPS images are extracted from workbook relationships when available.
- Missing images do not block text import.

## Spreadsheet Export

Supported exports:
- Current filtered inventory list.
- Restock list.

Export rows must include user-meaningful inventory fields such as code, brand,
material, color, diameter, quantity, remaining weight, location, status, cost,
purchase information, and notes where available.

## JSON Backup

File purpose:
- Lightweight structured data backup.

Must contain:
- Inventory items.
- Consumption records.
- Queue tasks.
- Cost settings.
- Trash entries.
- Duplicate ignores and negative rules.
- Quality ignores.
- Restock settings.
- Label settings.
- Export timestamp and version marker.

Must not require:
- Embedded image binaries.

## Full ZIP Backup

File purpose:
- Complete migration backup for text data plus images.

Must contain:
- `data.json`.
- `images/` folder when images are available.
- `imageManifest` mapping image keys to image paths and MIME types.
- `missingImages` list for image keys that could not be found.

Restore behavior:
- User confirms overwrite.
- Data records are normalized after loading.
- Images listed in the manifest are restored to IndexedDB.
- Missing image files do not block restoring text records.
