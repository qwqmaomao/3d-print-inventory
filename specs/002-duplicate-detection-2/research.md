# Research: 重复检测 2.0 与合并流程优化

## Decision: Keep duplicate detection rule-based and local

**Rationale**: The app is a directly opened static page. Rule-based signatures can run offline, require no new dependency, and are easier to explain in Chinese UI cards than opaque fuzzy matching.

**Alternatives considered**:

- Add a fuzzy matching library: rejected because it introduces dependency and may increase explainability problems.
- Use image similarity: rejected for this feature because it is expensive, hard to validate locally, and outside the spec.
- Backend deduplication: rejected by project constraints.

## Decision: Separate candidate recall from evidence scoring

**Rationale**: Brand, base material, and diameter are useful for finding candidate pairs, but common combinations such as Bambu PLA 1.75mm are too frequent to prove duplication. The plan treats them as weak evidence and applies caps before high-confidence levels.

**Alternatives considered**:

- Continue additive scoring for all fields: rejected because it caused aggressive false positives.
- Require exact match on all fields: rejected because it would miss real duplicate records with incomplete data.

## Decision: Strong evidence threshold uses two independent categories

**Rationale**: The clarification selected the middle path: 75+ normally requires at least two independent strong evidence categories. One uniqueness-heavy signal, such as same image, same import source, or same color code, can qualify alone only when no conflicts exist.

**Alternatives considered**:

- One strong evidence always enough: rejected as too permissive.
- Three strong evidence always required: rejected as likely to miss real duplicates.

## Decision: Product line detection uses a fixed alias list

**Rationale**: Product line mismatches are a major false-positive source. A fixed list keeps behavior predictable: Basic, Matte/哑光, Silk/丝绸, HF, GF, CF, Support/支撑, Wood/木质, Plus, and Pro are detected from material, name, and notes. Unknown text remains unknown.

**Alternatives considered**:

- Detect only from material: rejected because some imported records may put product line in name or notes.
- Fuzzy guess arbitrary product-line text: rejected because it can create new false positives.

## Decision: Hard caps are final score limits

**Rationale**: Hard caps must actually constrain the final score, not merely decorate explanations. The final score is the minimum of raw score and all applicable caps. Uniqueness-heavy evidence can remove only the weak-evidence-only 55 cap; it cannot override color conflict, shade/effect conflict, or product line conflict caps.

**Alternatives considered**:

- Let enough strong evidence override all caps: rejected because conflicts would become meaningless.
- Apply caps only to UI advice: rejected because score and label would still mislead users.

## Decision: Negative rules apply to duplicate detection and inventory health

**Rationale**: The user specifically reported ignored/remembered duplicate issues reappearing in inventory health. Negative rules must suppress or downgrade duplicate issues in both views by default.

**Alternatives considered**:

- Apply rules only in duplicate detection: rejected because it leaves health check noisy.
- Store only exact record pair ignores: rejected because the feature needs reusable material/color false-positive learning.

## Decision: No data migration

**Rationale**: Duplicate detection 2.0 is derived from existing fields and existing negative rule strings. Old records can be read as-is. Missing values are treated as unknown, not matches.

**Alternatives considered**:

- Add new inventory fields for parsed signatures: rejected because it changes data format and adds migration risk.
- Add a new negative-rule key: rejected because `filament_duplicate_negative_rules_v1` already exists and can carry compatible string rules.
