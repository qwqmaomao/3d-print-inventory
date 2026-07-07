# Data Model: 重复检测 2.0 与合并流程优化

This feature does not change persisted inventory, consumption, queue, image, backup, label, or scan records. The model below describes derived runtime structures and existing persistence surfaces.

## Existing Persistence Surfaces

| Surface | Existing key/store | Change |
|---|---|---|
| Duplicate ignores | `filament_duplicate_ignores_v1` | No format change; concrete pair ids remain hidden by default |
| Negative rules | `filament_duplicate_negative_rules_v1` | No key change; rules continue as strings and may include reusable material/color signatures |
| Quality ignores | `filament_quality_ignores_v1` | No format change; quality duplicate issues must also respect duplicate ignores/negative rules |
| Inventory | `filament_inventory_v1` | No field changes |
| Images | IndexedDB `filament_inventory_assets_v1/images` | No change |

## Derived Entities

### DuplicateCandidate

Represents one pair of inventory items under evaluation.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable pair id from the two item ids |
| `ids` | string[] | Two inventory item ids |
| `items` | object[] | Two normalized inventory records |
| `rawScore` | number | Additive score before caps |
| `score` | number | Final score after hard caps and negative rule effects |
| `level` | string | `几乎确定重复`, `疑似重复`, `同类耗材，不建议合并`, or hidden |
| `mergeAdvice` | string | Confidence-specific merge guidance |
| `weakEvidence` | Evidence[] | Candidate recall and weak similarity signals |
| `strongEvidence` | Evidence[] | Independent strong evidence categories |
| `comparisons` | ComparisonRow[] | Field-level comparison table |
| `hardCap` | number | Lowest active cap, default 100 |
| `capReasons` | string[] | User-facing cap/conflict explanations |
| `blockedReason` | string | Candidate exclusion reason, if any |
| `ignored` | boolean | True when pair ignore or quality ignore applies |
| `explanation` | ExplanationBlock | User-facing explanation text |

### Evidence

| Field | Type | Notes |
|---|---|---|
| `category` | string | `weak`, `strong`, or `uniqueness-heavy` |
| `field` | string | Brand, material, color, product line, purchase, position, image, import source, name/notes |
| `label` | string | Chinese display label |
| `reason` | string | Why it contributes |
| `independentKey` | string | Prevents double-counting the same underlying signal |
| `points` | number | Contribution to raw score |

Validation:

- Brand, base material, and diameter are weak evidence.
- 75+ requires at least two independent strong evidence entries, or one uniqueness-heavy strong entry with no conflicts.
- Missing fields do not create evidence.

### MaterialSignature

| Field | Type | Notes |
|---|---|---|
| `raw` | string | Original material text |
| `baseMaterial` | string | PLA, PETG, ABS, ASA, TPU, PA, PC, or unknown |
| `modifiers` | string[] | GF, CF, HF, Matte, Silk, Wood, Support, Plus, Pro, etc. |
| `normalizedLabel` | string | Stable display/signature label |

Validation:

- Different base material excludes the pair from duplicate candidates.
- Same base material with different modifiers can trigger product line conflict caps.
- PLA Basic vs PLA Matte/Silk is capped at 65.

### ProductLineSignature

Derived from material, name, and notes using only fixed aliases.

Allowed aliases:

- Basic
- Matte / 哑光
- Silk / 丝绸
- HF
- GF
- CF
- Support / 支撑
- Wood / 木质
- Plus
- Pro

Validation:

- Matching product line can be strong evidence.
- Different known product lines can trigger conflict/hard cap.
- Unknown terms remain unknown and do not count as a match or conflict unless another explicit rule applies.

### ColorSignature

| Field | Type | Notes |
|---|---|---|
| `raw` | string | Original color text |
| `colorFamily` | string | 黑, 白, 红, 蓝, 绿, 黄, 灰, etc. |
| `colorShade` | string | 深, 浅, 湖, 天, 透明, 荧光, 金属, 丝绸, 哑光, etc. |
| `colorCode` | string | Explicit color number/code if derivable |
| `normalizedLabel` | string | Stable display/signature label |

Validation:

- Different color families cap at 50.
- Same family but different shade, color code, or effect caps at 70.
- Exact color or same explicit color code can be strong evidence.

### HardCapRule

| Condition | Cap |
|---|---:|
| Only same brand, base material, and diameter | 55 |
| Different color family | 50 |
| Same color family but different shade/color number/effect | 70 |
| PLA Basic vs PLA Matte/Silk | 65 |
| Negative material/color rule explicitly blocks pair | 0 or hidden |

Validation:

- Final score is `min(rawScore, all applicable hard caps)`.
- Same image, same import source, or same color code may remove only the weak-evidence-only 55 cap.
- Conflict caps remain active even when strong evidence exists.

### NegativeRule

Stored in `filament_duplicate_negative_rules_v1` as strings.

| Rule type | Example | Behavior |
|---|---|---|
| Concrete pair | `pair:idA|idB` or existing pair id behavior | Hide exact pair by default |
| Material signature | `material:ABS|ABS-GF` | Lower or hide similar material false positives |
| Color signature | `color:湖蓝|深蓝` | Lower or hide similar color false positives |

Validation:

- Existing negative rule strings remain valid.
- Duplicate detection and inventory health apply negative rules by default.
- Negative rules do not mutate inventory fields.

### ExplanationBlock

| Field | Type | Notes |
|---|---|---|
| `whySimilar` | string | Natural-language evidence summary |
| `whyNotMerge` | string | Required when cap, conflict, weak-only, or low confidence applies |
| `conflictHints` | string[] | Field-specific warnings |
| `strongEvidenceLabels` | string[] | Strong evidence shown to user |

Validation:

- Every displayed card has `whySimilar`.
- 60-74 and capped/conflict cases have `whyNotMerge`.

## State Transitions

### Duplicate result rendering

1. Build candidate pair.
2. Exclude blocked base material or diameter conflicts.
3. Collect weak evidence.
4. Collect strong evidence.
5. Collect conflict caps and negative rules.
6. Calculate raw score.
7. Apply strong evidence threshold and hard caps.
8. Apply ignore visibility filter.
9. Render card or hide.

### Remember non-duplicate

1. User clicks “不是重复，记住这个判断”.
2. System stores concrete pair ignore/negative rule.
3. System stores reusable material/color signature rules when derivable.
4. Duplicate detection refreshes.
5. Inventory health duplicate issues also hide or downgrade matching issues by default.

### Merge preview

1. User opens merge preview from a non-hidden result.
2. Preview displays confidence-specific warning.
3. User chooses conflict field values and image strategy.
4. Confirmed merge moves source to trash.
5. Consumption records and queue references migrate to retained item.
