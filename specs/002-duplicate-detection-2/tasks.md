# Tasks: 重复检测 2.0 与合并流程优化

**Input**: Design documents from `specs/002-duplicate-detection-2/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/duplicate-detection-ui.md](./contracts/duplicate-detection-ui.md), [quickstart.md](./quickstart.md)

**Tests**: This feature requires validation tasks because the specification and quickstart define explicit acceptance checks for duplicate scoring, hard caps, negative rules, merge safety, and v1.0 regression protection.

**Organization**: Tasks are grouped by user story and ordered for small-step implementation. The implementation should modify existing duplicate detection functions in `app.js` rather than replacing the app or changing persisted data formats.

## Phase 1: Setup / 准备检查 (Shared Infrastructure)

**Purpose**: Confirm current code and documents before touching behavior.

- [X] T001 Review current duplicate detection chain in `app.js` covering `renderDuplicates()`, `findDuplicateResults()`, `scoreDuplicatePair()`, comparison helpers, `rememberNegativeDuplicate()`, `openMergePreview()`, and `findQualityIssues()`.
- [X] T002 Review duplicate detection UI surfaces in `index.html` covering `duplicatesView`, `qualityView`, and `mergeDialog`.
- [X] T003 [P] Review style hooks for duplicate cards, tags, weak merge buttons, dialogs, and warnings in `style.css`.
- [X] T004 [P] Confirm no new dependency, backend, CDN, storage key, or data migration is required by checking `specs/002-duplicate-detection-2/plan.md`.
- [X] T005 [P] Record the validation checklist from `specs/002-duplicate-detection-2/quickstart.md` before implementation.

---

## Phase 2: Foundational / 重复检测算法拆分 (Blocking Prerequisites)

**Purpose**: Create clearer duplicate-scoring seams inside existing `app.js` before changing scoring behavior.

**Critical**: Complete this phase before user story work. These tasks keep the work incremental and reduce the risk of breaking merge, ignore, and health flows.

- [X] T006 Extract candidate pair construction helper near `scoreDuplicatePair()` in `app.js` without changing returned result shape.
- [X] T007 Extract weak evidence collection helper near duplicate comparison helpers in `app.js` for brand and base material; keep diameter reference-only.
- [X] T008 Extract strong evidence collection helper near duplicate comparison helpers in `app.js` for exact color, color code, product line, purchase/shop, position sequence, image/import source, and name/notes identifiers.
- [X] T009 Extract hard cap application helper near `scoreDuplicatePair()` in `app.js` that accepts raw score, caps, and evidence but initially preserves current behavior.
- [X] T010 Extract duplicate explanation helper near `duplicateExplanation()` in `app.js` while preserving existing displayed explanation text.
- [X] T011 Extract merge entry label helper near `duplicateMergeAdvice()` in `app.js` while preserving existing merge button behavior.
- [X] T012 Run `node --check app.js` after helper extraction and record the result in `specs/002-duplicate-detection-2/quickstart.md`.

**Checkpoint**: Existing duplicate detection should behave the same, but the code has clear helper boundaries for scoring changes.

---

## Phase 3: User Story 1 - 降低常见基础字段误判 (Priority: P1) MVP

**Goal**: Same brand, same base material, and same diameter can recall candidates and explain similarity, but cannot alone create high-confidence duplicates.

**Independent Test**: Create or use same-brand/same-material records with different colors or product lines and verify they remain hidden or “同类耗材”, never “疑似重复” or “几乎确定重复”; changing diameter must not change the score.

### Tests for User Story 1

- [X] T013 [P] [US1] Add a manual validation case for “same brand + same base material + same diameter only => max 55” in `specs/002-duplicate-detection-2/quickstart.md`.
- [X] T014 [P] [US1] Add a manual validation note for common Bambu/拓竹 PLA 1.75mm false positives in `specs/002-duplicate-detection-2/quickstart.md`.

### Implementation for User Story 1

- [X] T015 [US1] Update weak evidence scoring in `app.js` so brand and base material are candidate recall/weak evidence only and diameter is reference-only.
- [X] T016 [US1] Update `scoreDuplicatePair()` in `app.js` so weak-only results cannot enter 75+.
- [X] T017 [US1] Apply the weak-evidence-only hard cap of 55 in `app.js` when only brand and base material match.
- [X] T018 [US1] Update `duplicateLevel()` in `app.js` so 75-89 displays “疑似重复” and 60-74 displays “同类耗材，不建议合并”.
- [X] T019 [US1] Ensure `findDuplicateResults()` in `app.js` still hides below-threshold results and keeps existing ignored-pair filtering.

**Checkpoint**: User Story 1 is independently testable as the MVP.

---

## Phase 4: User Story 2 - 使用强证据提升真正重复记录 (Priority: P1)

**Goal**: True duplicates can still reach 75+ or 90+ when strong evidence exists, while weak/common fields are not enough.

**Independent Test**: Compare one weak-only pair against one pair with at least two independent strong evidence categories and confirm only the strong-evidence pair can reach 75+ when no conflict cap blocks it.

### Tests for User Story 2

- [X] T020 [P] [US2] Add strong-evidence validation examples for exact color + product line + name/notes identifier in `specs/002-duplicate-detection-2/quickstart.md`.
- [X] T021 [P] [US2] Add uniqueness-heavy evidence validation examples for same image/import source/color code in `specs/002-duplicate-detection-2/quickstart.md`.

### Implementation for User Story 2

- [X] T022 [US2] Implement fixed product line alias extraction from material, name, and notes in `app.js` using Basic, Matte/哑光, Silk/丝绸, HF, GF, CF, Support/支撑, Wood/木质, Plus, and Pro.
- [X] T023 [US2] Update strong evidence collection in `app.js` to return independent evidence categories and prevent double-counting the same underlying signal.
- [X] T024 [US2] Update `scoreDuplicatePair()` in `app.js` so 75+ requires two independent strong evidence categories unless one uniqueness-heavy signal exists with no conflicts.
- [X] T025 [US2] Add uniqueness-heavy handling in `app.js` for same image, same import source, or same explicit color code.
- [X] T026 [US2] Preserve missing-field behavior in `app.js` so missing optional fields are unknown and never count as matching evidence.

**Checkpoint**: Strong evidence can raise real duplicates without restoring weak-field false positives.

---

## Phase 5: User Story 3 - 明确 hard cap 和重复等级 (Priority: P1)

**Goal**: Hard caps constrain final score and visible confidence for color conflicts, shade/effect differences, product line conflicts, and weak-only cases.

**Independent Test**: Validate caps for weak-only 55, different color family 50, same color family different shade/effect 70, and PLA Basic vs PLA Matte/Silk 65.

### Tests for User Story 3

- [X] T027 [P] [US3] Add manual validation cases for different color family max 50 and same family different shade/effect max 70 in `specs/002-duplicate-detection-2/quickstart.md`.
- [X] T028 [P] [US3] Add manual validation cases for PLA Basic vs PLA Matte/Silk max 65 in `specs/002-duplicate-detection-2/quickstart.md`.

### Implementation for User Story 3

- [X] T029 [US3] Update color signature parsing in `app.js` to distinguish color family from shade/effect/code without collapsing 湖蓝 and 深蓝 into the same exact color.
- [X] T030 [US3] Implement color family conflict cap 50 in `app.js`.
- [X] T031 [US3] Implement same color family but different shade/effect/color code cap 70 in `app.js`.
- [X] T032 [US3] Implement product line conflict handling in `app.js` including PLA Basic vs PLA Matte/Silk cap 65.
- [X] T033 [US3] Update hard cap calculation in `app.js` so final score is `min(rawScore, all applicable caps)`.
- [X] T034 [US3] Ensure uniqueness-heavy evidence in `app.js` can remove only the weak-evidence-only 55 cap and cannot remove conflict caps.

**Checkpoint**: Hard caps visibly control final scores and duplicate levels.

---

## Phase 6: User Story 4 - 解释文案与 UI 展示 (Priority: P2)

**Goal**: Duplicate cards explain why records are similar and why merge is or is not recommended.

**Independent Test**: Open cards for weak-only, capped/conflicted, same color family different shade, product line conflict, and high strong-evidence results; confirm explanations and merge labels are understandable without reading raw code.

### Implementation for User Story 4

- [X] T035 [US4] Update `duplicateExplanation()` or extracted explanation helpers in `app.js` to generate separate “为什么相似” and “为什么不建议合并” text.
- [X] T036 [US4] Update `renderDuplicateResult()` in `app.js` to display strong evidence labels, cap reasons, conflict hints, and both explanation categories.
- [X] T037 [US4] Update merge entry labels in `app.js` to use “建议合并预览”, “人工确认后合并预览”, and “不建议合并，仍要查看预览”.
- [X] T038 [P] [US4] Update duplicate card markup only if needed in `index.html` while preserving existing `duplicatesBody` and merge dialog IDs.
- [X] T039 [P] [US4] Add or adjust weak merge and conflict hint styles in `style.css`.
- [X] T040 [US4] Update `specs/002-duplicate-detection-2/contracts/duplicate-detection-ui.md` if the final UI wording differs from the planned labels.

**Checkpoint**: Duplicate result cards are explainable and use confidence-specific merge language.

---

## Phase 7: User Story 5 - 忽略/负向规则兼容与合并流程保护 (Priority: P2)

**Goal**: Ignore rules, remembered non-duplicate rules, inventory health duplicate issues, merge preview, trash, consumption migration, and queue reference migration continue to work safely.

**Independent Test**: Ignore a result and remember a non-duplicate rule, then confirm duplicate detection and inventory health both respect it; open and complete merge preview and confirm trash/reference migration still works.

### Tests for User Story 5

- [X] T041 [P] [US5] Add negative-rule and inventory-health validation steps to `specs/002-duplicate-detection-2/quickstart.md`.
- [X] T042 [P] [US5] Add merge safety validation steps for preview, trash, consumption migration, and queue migration to `specs/002-duplicate-detection-2/quickstart.md`.

### Implementation for User Story 5

- [X] T043 [US5] Update `rememberNegativeDuplicate()` and `negativeRulesForResult()` in `app.js` to save concrete pair behavior plus reusable material/color signature rules when derivable.
- [X] T044 [US5] Update `getNegativeRuleForPair()` in `app.js` so remembered material/color combinations lower or hide similar false positives by default.
- [X] T045 [US5] Update `findQualityIssues()` in `app.js` so duplicate health issues reuse duplicate ignores and negative rules and do not resurrect remembered false positives.
- [X] T046 [US5] Preserve `ignoreDuplicateResult()` behavior in `app.js` so ignored pairs stay hidden by default and can still be shown by filter.
- [X] T047 [US5] Update `openMergePreview()` in `app.js` to show score, level, merge advice, cap reasons, and a stronger warning for 60-74 results.
- [X] T048 [US5] Verify `confirmMergeFromPreview()` in `app.js` still moves merged-away records to trash and migrates consumption records and queue references without changing data formats.
- [X] T049 [P] [US5] Update `style.css` for any merge warning or disabled/weak visual state needed by the merge preview.

**Checkpoint**: Existing data-safety flows remain intact while false positives stay suppressed.

---

## Phase 8: User Story 6 - 保护现有库存和周边功能 (Priority: P2)

**Goal**: The feature does not change data formats, does not add dependencies, and does not break import/export, backup, labels, QR, scan, quality, audit, or print queue workflows.

**Independent Test**: Run the affected v1.0 baseline quickstart checks after duplicate detection 2.0 changes.

### Implementation for User Story 6

- [X] T050 [US6] Confirm JSON and ZIP backup payloads in `app.js` still include existing duplicate ignore, negative rule, quality ignore, restock, and label settings arrays without adding new keys.
- [X] T051 [US6] Confirm WPS/Excel import and image preview paths in `app.js` are untouched by duplicate detection changes.
- [X] T052 [US6] Confirm labels, QR generation, scan lookup, quick consume, audit entry, and queue add flows in `app.js` are untouched by duplicate detection changes.
- [X] T053 [US6] Confirm `index.html` still opens directly without backend, CDN, build step, or new script dependency.
- [X] T054 [US6] Update `README.md` only if user-visible duplicate detection wording or validation instructions change.

**Checkpoint**: Existing local-first app behavior remains compatible with v1.0 baseline.

---

## Phase 9: Final Validation / 测试验证与收尾

**Purpose**: Prove the feature meets the requested acceptance criteria and does not regress existing workflows.

- [X] T055 Run `node --check app.js` and record the result in `specs/002-duplicate-detection-2/quickstart.md`.
- [X] T056 Validate in `index.html` that only same brand + same material + same diameter cannot enter 75+ and record the result in `specs/002-duplicate-detection-2/quickstart.md`.
- [X] T057 Validate in `index.html` that different color families and same family different shade/effect are capped correctly and record the result in `specs/002-duplicate-detection-2/quickstart.md`.
- [X] T058 Validate in `index.html` that pairs without strong evidence cannot enter 75+ and record the result in `specs/002-duplicate-detection-2/quickstart.md`.
- [X] T059 Validate in `index.html` that ignored pairs and negative rules continue to work in duplicate detection and inventory health, then record the result in `specs/002-duplicate-detection-2/quickstart.md`.
- [X] T060 Validate in `index.html` that merge preview, trash, consumption record migration, and queue reference migration still work, then record the result in `specs/002-duplicate-detection-2/quickstart.md`.
- [X] T061 [P] Validate WPS/Excel import and image preview against `耗材储存.xlsx` and record the result in `specs/002-duplicate-detection-2/quickstart.md`.
- [X] T062 [P] Validate JSON backup, ZIP backup, filtered inventory export, and restock export from `index.html` and record the result in `specs/002-duplicate-detection-2/quickstart.md`.
- [X] T063 [P] Validate labels, QR, scan lookup, quick consume, audit entry, and add-to-queue flows from `index.html` and record the result in `specs/002-duplicate-detection-2/quickstart.md`.
- [X] T064 Review `specs/002-duplicate-detection-2/tasks.md` against `specs/002-duplicate-detection-2/spec.md` to confirm every acceptance criterion has at least one implementation or validation task.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: No dependencies; start immediately.
- **Phase 2 Foundational**: Depends on Phase 1; blocks all user story implementation.
- **Phase 3 US1**: Depends on Phase 2; MVP and prerequisite for safe high-confidence scoring.
- **Phase 4 US2**: Depends on Phase 2 and should follow US1 so strong evidence builds on weak evidence boundaries.
- **Phase 5 US3**: Depends on US1 and US2 because hard caps must combine weak and strong evidence.
- **Phase 6 US4**: Depends on US1-US3 because UI wording needs final score, caps, and evidence.
- **Phase 7 US5**: Depends on US1-US4 for final duplicate result shape and merge labels.
- **Phase 8 US6**: Can run after Phase 2 for review tasks, but final confirmation depends on all implemented stories.
- **Phase 9 Validation**: Depends on completed implementation stories.

### User Story Dependencies

- **US1 (P1)**: MVP; no dependency on other user stories after foundational extraction.
- **US2 (P1)**: Uses helpers from US1 but remains independently testable with strong evidence cases.
- **US3 (P1)**: Depends on US1/US2 result structures and evidence categories.
- **US4 (P2)**: Depends on final scoring/cap/evidence outputs from US1-US3.
- **US5 (P2)**: Depends on final result shape and UI labels; protects existing safety flows.
- **US6 (P2)**: Cross-cutting regression protection; final pass after all story work.

### Parallel Opportunities

- T003-T005 can run in parallel after T001/T002 start because they read separate files/docs.
- T013/T014, T020/T021, T027/T028, T041/T042 can run in parallel because they update validation notes in the same document only if coordinated; otherwise do them sequentially to avoid merge conflicts.
- T038/T039 and T049 can run in parallel with app.js work only after their related UI requirements are known.
- T061-T063 can run in parallel during final validation because they cover separate workflows.

---

## Parallel Example: User Story 4

```text
Task: "T038 [P] [US4] Update duplicate card markup only if needed in index.html while preserving existing duplicatesBody and merge dialog IDs."
Task: "T039 [P] [US4] Add or adjust weak merge and conflict hint styles in style.css."
```

## Parallel Example: Final Validation

```text
Task: "T061 [P] Validate WPS/Excel import and image preview against 耗材储存.xlsx and record the result in specs/002-duplicate-detection-2/quickstart.md."
Task: "T062 [P] Validate JSON backup, ZIP backup, filtered inventory export, and restock export from index.html and record the result in specs/002-duplicate-detection-2/quickstart.md."
Task: "T063 [P] Validate labels, QR, scan lookup, quick consume, audit entry, and add-to-queue flows from index.html and record the result in specs/002-duplicate-detection-2/quickstart.md."
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete US1 only.
3. Validate that weak-only same brand/material pairs cannot reach 75+ and diameter changes do not affect score.
4. Stop and confirm duplicate results still render and ignored pairs still hide.

### Incremental Delivery

1. US1: weak evidence boundaries and 55 cap.
2. US2: strong evidence threshold and product-line signatures.
3. US3: hard cap matrix and final score calculation.
4. US4: explanation and UI labels.
5. US5: negative rules, inventory health alignment, and merge safety.
6. US6 + Final Validation: v1.0 regression protection.

### Guardrails

- Do not introduce backend, CDN, build step, or new dependency.
- Do not change existing LocalStorage key names or inventory/consumption/queue data formats.
- Prefer small edits around existing duplicate functions in `app.js`.
- Keep `index.html` IDs stable.
- Keep merge preview as the only merge path.

