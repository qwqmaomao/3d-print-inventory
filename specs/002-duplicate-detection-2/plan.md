# Implementation Plan: 重复检测 2.0 与合并流程优化

**Branch**: `002-duplicate-detection-2` | **Date**: 2026-07-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-duplicate-detection-2/spec.md`

## Summary

在现有本地静态网页中增量优化重复检测，降低同品牌、同基础材料、同线径导致的误报。实现方式是在当前 `app.js` 的重复检测链路上小步重构：保留 `findDuplicateResults()`、`scoreDuplicatePair()`、忽略、负向规则、合并预览、回收站、消耗记录迁移和队列引用迁移，拆出候选召回、弱证据、强证据、hard cap、负向规则和解释文案函数，让“同类耗材”和“疑似重复记录”更清晰。

不新增后端、不依赖 CDN、不修改现有业务数据格式。LocalStorage、IndexedDB、JSON/ZIP 备份格式继续兼容 v1.0 基线。

## Technical Context

**Language/Version**: HTML, CSS, browser JavaScript in the existing static page.

**Primary Dependencies**: Existing local `vendor/` libraries only: SheetJS, JSZip, and qrcode. No new dependency is planned for this feature.

**Storage**: Existing LocalStorage keys and IndexedDB image store. This feature reads and writes existing duplicate ignore and negative rule keys only:

- `filament_duplicate_ignores_v1`
- `filament_duplicate_negative_rules_v1`
- `filament_quality_ignores_v1`

**Testing**: `node --check app.js` plus manual validation through `index.html` duplicate detection, inventory health, merge preview, backup/export, and v1.0 regression scenarios.

**Target Platform**: Directly opened local `index.html` in a modern desktop browser.

**Project Type**: Single static web application.

**Performance Goals**: Keep duplicate scanning usable for the v1.0 local baseline of at least 500 inventory records. Avoid new expensive image analysis or network lookups; use string signatures and existing record fields.

**Constraints**:

- No backend, login, build step, CDN, or external network dependency.
- No business data format change for inventory, consumption, queue, image, backup, label, or scan data.
- Existing ignored duplicate pairs and remembered negative rules remain valid.
- Inventory health duplicate issues must reuse duplicate detection ignore and negative rule behavior.

**Scale/Scope**: Local single-user browser profile; baseline scale remains 500 inventory records, 200 image references, 1000 consumption records, and 200 queue tasks.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Existing function stability**: Touched workflows are duplicate detection, inventory health duplicate issue generation, negative rule remembering, merge preview labels, and merge recommendation text. Regression checks cover WPS/Excel import, image preview, JSON/ZIP backup, restock export, labels/QR/scan, trash, consumption migration, and queue migration.
- **Spec before code**: `spec.md` contains prioritized user stories, edge cases, clarifications, functional requirements, and measurable success criteria for weak evidence, strong evidence, hard caps, negative rules, and merge recommendations.
- **Minimal dependencies/local-first**: No new dependency is introduced. The plan uses existing JavaScript functions and local browser storage only.
- **Data safety/backward compatibility**: No new main record fields and no LocalStorage key changes are required. Existing keys remain compatible. Negative rule semantics are refined but stored as strings in the existing `filament_duplicate_negative_rules_v1` array.
- **Incremental verification**: Smallest deliverable slice is extracting duplicate scoring helpers without changing visible behavior, followed by scoring rule changes, then UI wording and inventory health alignment. JavaScript changes must pass `node --check app.js` and targeted manual validation.

**Gate Status**: PASS. No constitution violation is required.

## Project Structure

### Documentation (this feature)

```text
specs/002-duplicate-detection-2/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── duplicate-detection-ui.md
├── checklists/
│   └── requirements.md
└── tasks.md              # Created later by /speckit-tasks
```

### Source Code (repository root)

```text
index.html                # Existing duplicate and quality views; only small UI text/control adjustments if needed
style.css                 # Existing styles; only weak/strong merge affordance styling if needed
app.js                    # Primary implementation target for duplicate scoring helpers and UI rendering
vendor/                   # Existing local libraries; no new files planned
README.md                 # Update only if user-visible duplicate detection behavior changes
```

**Structure Decision**: Keep the current single static application structure. The feature is a contained behavior change inside existing duplicate detection and inventory health workflows.

## Phase 0: Research Decisions

See [research.md](./research.md).

Key decisions:

- Use rule-based signatures rather than fuzzy global similarity.
- Treat brand, base material, and diameter as candidate recall and weak evidence.
- Require at least two independent strong evidence categories for 75+, except one uniqueness-heavy signal with no conflicts.
- Apply final score as `min(rawScore, applicableHardCaps)`, with uniqueness-heavy evidence able to remove only the weak-evidence-only cap.
- Apply negative rules in duplicate detection and inventory health.

## Phase 1: Design Artifacts

- [data-model.md](./data-model.md): Derived result structures, evidence categories, hard cap state, and negative rule semantics.
- [contracts/duplicate-detection-ui.md](./contracts/duplicate-detection-ui.md): User-visible duplicate detection and merge recommendation contract.
- [quickstart.md](./quickstart.md): Validation guide for duplicate detection 2.0 and v1.0 regression workflows.

## Implementation Approach

1. Locate current duplicate detection chain in `app.js`: `renderDuplicates()`, `findDuplicateResults()`, `scoreDuplicatePair()`, comparison helpers, negative rule helpers, `renderDuplicateResult()`, `openMergePreview()`, and `findQualityIssues()`.
2. Extract or clarify helpers without behavior changes:
   - `buildDuplicateCandidatePair(a, b)`
   - `collectWeakEvidence(candidate)`
   - `collectStrongEvidence(candidate)`
   - `collectConflictCaps(candidate)`
   - `applyDuplicateHardCaps(rawScore, caps, evidence)`
   - `buildDuplicateExplanations(result)`
   - `getMergeEntryLabel(result)`
3. Update scoring:
   - Candidate recall uses brand/base material/diameter and existing blocking for different base material or diameter.
   - Weak evidence cannot reach 75+ by itself.
   - Strong evidence threshold follows clarifications.
   - Product line detection uses only fixed aliases from material/name/notes.
   - Color family conflicts and color shade/effect differences apply hard caps.
   - Negative rules lower or hide false positives before rendering and before inventory health issue creation.
4. Update rendering:
   - Duplicate cards show why similar, why not recommended, strong evidence list, conflict hints, hard cap reason, and confidence-specific merge entry text.
   - 60-74 merge entry is visually and textually weak.
5. Preserve merge safety:
   - Merge preview remains required.
   - Merged-away records still go to trash.
   - Consumption records and queue references still migrate to the retained record.

## Validation Strategy

- Static: `node --check app.js`.
- Targeted duplicate cases:
  - Same brand/material/diameter only -> max 55.
  - Different color families -> max 50.
  - Same color family different shade/effect -> max 70.
  - PLA Basic vs PLA Matte/Silk -> max 65.
  - Two independent strong evidence categories -> may reach 75+ if no conflict cap blocks it.
  - Same image/import/color code with no conflict -> may reach 75+ with one uniqueness-heavy signal.
  - Remembered `ABS|ABS-GF` or `湖蓝|深蓝` negative rule -> duplicate detection and inventory health hide/lower similar issues by default.
- Regression:
  - Ignore duplicate pair and confirm inventory health respects it.
  - Merge preview, confirm merge, trash entry, consumption migration, and queue reference migration.
  - WPS import/image preview, JSON/ZIP backup, restock export, labels/QR/scan, audit, and queue baseline checks from `specs/001-v1-baseline-spec/quickstart.md`.

## Post-Design Constitution Check

- **Existing function stability**: PASS. Design touches only duplicate scoring, duplicate rendering, and quality duplicate issue consumption, with explicit regression coverage.
- **Spec before code**: PASS. Clarifications are recorded in `spec.md`; no unresolved behavior remains for planning.
- **Minimal dependencies/local-first**: PASS. No new dependency, backend, CDN, or build step.
- **Data safety/backward compatibility**: PASS. No schema migration, no new storage key, existing negative rule array remains the persistence surface.
- **Incremental verification**: PASS. Plan defines helper extraction first, then scoring changes, then UI wording and regression checks.

## Complexity Tracking

No constitution violations or complexity exceptions are required.
