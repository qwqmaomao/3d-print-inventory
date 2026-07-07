# Quickstart: Validate 重复检测 2.0

## Prerequisites

- Open the repository root.
- Use the existing static app by opening `index.html` directly in a modern browser.
- Keep a browser-data backup before testing merge or restore flows with real inventory.

## Static Check

Run:

```powershell
node --check app.js
```

Expected: command exits successfully without syntax errors.

## Duplicate Detection Test Data

Create or use test records that cover these pairs:

| Case | Expected result |
|---|---|
| Same brand + same base material + same diameter only | Max 55; not 75+ |
| Different color family, otherwise similar | Max 50 |
| Same color family but different shade/effect, such as 湖蓝 vs 深蓝 | Max 70 |
| PLA Basic vs PLA Matte or PLA Silk | Max 65 |
| Same brand/material/diameter plus two independent strong evidence categories | May reach 75+ when no conflict cap blocks it |
| Same image/import source/color code with no conflicts | May reach 75+ with one uniqueness-heavy signal |
| Remembered negative material/color combination | Hidden or downgraded by default in duplicate detection and inventory health |

## Run Duplicate Detection

1. Open `index.html`.
2. Go to “重复检测”.
3. Click “重新扫描”.
4. Set the filter to 60+ to review low-confidence “同类耗材”.

Expected:

- 90-100 results show “几乎确定重复” and “建议合并预览”.
- 75-89 results show “疑似重复” and “人工确认后合并预览”.
- 60-74 results show “同类耗材，不建议合并” and “不建议合并，仍要查看预览”.
- Every visible card explains “为什么相似”.
- Capped/conflicted cards explain “为什么不建议合并”.

## Validate Hard Caps

1. Compare two records that only match brand, base material, and diameter.
2. Compare two records with different color families.
3. Compare two records such as `PETG-HF 湖蓝` and `PETG HF 深蓝`.
4. Compare `PLA Basic` with `PLA Matte` or `PLA Silk`.

Expected:

- Scores follow the caps in [data-model.md](./data-model.md).
- Strong evidence is still displayed, but conflict caps prevent misleading high confidence.

## Validate Negative Rules

1. In duplicate results, click “不是重复，记住这个判断” for a material or color false positive.
2. Refresh or click “重新扫描”.
3. Open “库存体检”.

Expected:

- Duplicate detection no longer shows that pair or similar remembered material/color combination by default.
- Inventory health does not show the same remembered false positive as a serious duplicate issue by default.

## Validate Merge Safety

1. Open merge preview from a 60-74 result.
2. Confirm the preview warns that merge is not recommended.
3. Cancel.
4. Open merge preview from a higher-confidence result.
5. Confirm field choices, image strategy, and migration notes are visible.

Expected:

- No merge happens without preview and confirmation.
- Confirmed merge moves the source record to trash.
- Consumption records and queue references migrate to the retained item.

## Regression Checks

Run the affected v1.0 baseline checks from `specs/001-v1-baseline-spec/quickstart.md`:

- Duplicate and quality baseline.
- Backup and restore baseline.
- Import and image baseline.
- Spreadsheet export baseline.
- Labels and scan baseline.
- Consumption and queue baseline.

Expected:

- Existing workflows continue to pass.
- No LocalStorage or IndexedDB data migration is required.
