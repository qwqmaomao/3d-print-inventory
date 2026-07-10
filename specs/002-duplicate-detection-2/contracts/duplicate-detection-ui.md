# Contract: Duplicate Detection 2.0 UI and Behavior

## Purpose

This contract defines user-visible duplicate detection behavior for the local static 3D filament inventory app. It does not define a network API.

## Duplicate Detection Entry

| UI surface | Required behavior |
|---|---|
| Re-scan button | Runs duplicate detection over current inventory records |
| Minimum score filter | Supports existing score filters; below 60 remains hidden by default |
| Ignored filter | Hides ignored pairs by default; can show ignored pairs when selected |
| Inventory health | Uses duplicate detection output and respects duplicate ignores/negative rules |

## Result Levels

| Final score | Label | Merge entry |
|---:|---|---|
| 90-100 | 几乎确定重复 | 建议合并预览 |
| 75-89 | 疑似重复 | 人工确认后合并预览 |
| 60-74 | 同类耗材，不建议合并 | 不建议合并，仍要查看预览 |
| <60 | Hidden by default | No merge entry unless hidden results are explicitly revealed |

## Required Card Content

Every displayed duplicate card must show:

- Both item codes and labels.
- Final score and level.
- “为什么相似” explanation.
- Strong evidence list when strong evidence exists.
- Hard cap and conflict hints when any cap applies.
- “为什么不建议合并” explanation when score is 60-74, weak-only, capped, or conflicted.
- Ignore action.
- “不是重复，记住这个判断” action.
- Confidence-specific merge preview entry for non-hidden results.

## Evidence Contract

| Evidence type | User-facing rule |
|---|---|
| Weak evidence | Brand and base material may explain similarity but must not imply high confidence alone; diameter is reference-only |
| Strong evidence | Exact color, explicit color code, product line match, close batch/purchase/shop, close position sequence, same image/import source, or matching key identifiers |
| Uniqueness-heavy evidence | Same image, same import source, or same explicit color code may satisfy the strong-evidence threshold alone only when no conflicts exist |

## Hard Cap Contract

| Condition | Required user-facing hint |
|---|---|
| Only same brand/material | 基础字段常见，只作为弱证据，不建议合并 |
| Different color family | 颜色大类不同，触发分数上限 50 |
| Same family but different shade/effect/code | 同色系不同色号/效果，触发分数上限 70 |
| Different product line | 同基材不同产品线，不建议合并 |
| PLA Basic vs PLA Matte/Silk | 产品线不同，触发分数上限 65 |
| Negative rule hit | 已记住该组合不是重复 |

## Merge Preview Contract

Merge preview must remain the only path to merge records. It must show:

- Score, level, and merge advice.
- Any hard cap or conflict reason.
- A warning for 60-74 results.
- Field choice rows for conflicting brand, material, and color; diameter may still be shown in merge preview as an editable inventory field but is not duplicate evidence.
- Static merged totals for quantity, remaining weight, purchase price, notes, records, and queue references.
- Image retention strategy.
- Confirmation that the removed record goes to trash and references migrate.

## Inventory Health Contract

When inventory health reports duplicate issues:

- It must use duplicate detection results after hard caps and negative rules.
- Ignored duplicate pairs are hidden by default.
- Remembered non-duplicate material/color signature rules suppress or downgrade matching health issues by default.
- Showing ignored health issues may reveal ignored duplicate problems with an “已忽略” marker.

## Compatibility Contract

- No new storage key is required.
- Existing `filament_duplicate_ignores_v1` entries remain valid.
- Existing `filament_duplicate_negative_rules_v1` entries remain valid.
- JSON and ZIP backups continue to include duplicate ignore, negative rule, and quality ignore arrays through existing backup behavior.
