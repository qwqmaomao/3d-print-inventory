# Tasks: 3D 打印耗材库存 v1.0 基线

**Input**: Design documents from `specs/001-v1-baseline-spec/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Scope Guard**: This is a baseline documentation and protection task list. Do not modify `index.html`, `style.css`, `app.js`, `vendor/`, or implement new business features while completing these tasks.

**Tests**: Test/check tasks are included because the user explicitly requested coverage for current feature protection, test checks, data compatibility, import/export, scan/QR, duplicate detection, label printing, and local storage risk.

**Organization**: Tasks are grouped by user story to keep each current workflow independently reviewable and protectable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches a different documentation/check artifact or only reads existing files
- **[Story]**: Which user story this task belongs to
- Each task includes an exact file path

## Phase 1: Setup (Documentation Baseline)

**Purpose**: Prepare the baseline task workspace without touching application code.

- [ ] T001 Confirm current feature directory and active spec pointer in `.specify/feature.json`
- [ ] T002 [P] Review baseline scope guard in `specs/001-v1-baseline-spec/plan.md`
- [ ] T003 [P] Review no-backend/no-rewrite dependency decisions in `specs/001-v1-baseline-spec/research.md`
- [ ] T004 [P] Confirm user-facing app files remain out of scope for this baseline task set in `index.html`, `style.css`, `app.js`, and `vendor/`
- [ ] T005 Create a baseline execution notes section in `specs/001-v1-baseline-spec/tasks.md` if task outcomes need to be recorded later

---

## Phase 2: Foundational (Cross-Workflow Contracts)

**Purpose**: Establish the shared contracts that every user-story validation depends on.

- [ ] T006 Validate all LocalStorage keys and IndexedDB names listed in `specs/001-v1-baseline-spec/contracts/local-storage.md` against the constants documented in `app.js`
- [ ] T007 Validate all entity fields and default values in `specs/001-v1-baseline-spec/data-model.md` against the normalization behavior documented from `app.js`
- [ ] T008 Validate import/export and backup boundaries in `specs/001-v1-baseline-spec/contracts/import-export.md`
- [ ] T009 Validate UI workflow coverage in `specs/001-v1-baseline-spec/contracts/ui-workflows.md`
- [ ] T010 Confirm the baseline behavior contract in `specs/001-v1-baseline-spec/spec.md` includes statuses, thresholds, scoring caps, QR modes, and scan formats
- [ ] T011 Run `node --check app.js` and record the result in `specs/001-v1-baseline-spec/quickstart.md` if validation notes are maintained
- [ ] T012 Confirm vendored modules listed in `specs/001-v1-baseline-spec/plan.md` exist under `vendor/`

**Checkpoint**: Shared storage, model, import/export, UI, and vendor contracts are verified before reviewing individual workflows.

---

## Phase 3: User Story 1 - 维护耗材库存台账 (Priority: P1)

**Goal**: Protect the existing inventory table, editing, statistics, progress, status, and image-management baseline.

**Independent Test**: Follow the Inventory Baseline scenario in `specs/001-v1-baseline-spec/quickstart.md`.

### Checks for User Story 1

- [ ] T013 [P] [US1] Review inventory fields, defaults, and derived capacity rules in `specs/001-v1-baseline-spec/data-model.md`
- [ ] T014 [P] [US1] Review inventory workflow requirements in `specs/001-v1-baseline-spec/contracts/ui-workflows.md`
- [ ] T015 [US1] Execute the Inventory Baseline manual scenario from `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T016 [US1] Record whether inline edits persist after refresh in `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T017 [US1] Record whether low-stock and over-capacity states match `specs/001-v1-baseline-spec/spec.md`
- [ ] T018 [US1] Confirm any future inventory-field change would update `specs/001-v1-baseline-spec/data-model.md`

**Checkpoint**: Inventory baseline is independently verified and protected.

---

## Phase 4: User Story 2 - 导入、导出和迁移库存数据 (Priority: P1)

**Goal**: Protect WPS/Excel import, WPS image handling, JSON backup, ZIP backup, filtered export, and restore expectations.

**Independent Test**: Follow the Import and Image Baseline plus Backup and Restore Baseline scenarios in `specs/001-v1-baseline-spec/quickstart.md`.

### Checks for User Story 2

- [ ] T019 [P] [US2] Review project-specific import column mapping in `specs/001-v1-baseline-spec/contracts/import-export.md`
- [ ] T020 [P] [US2] Review JSON and ZIP backup boundaries in `specs/001-v1-baseline-spec/contracts/import-export.md`
- [ ] T021 [P] [US2] Review image asset storage relationship in `specs/001-v1-baseline-spec/contracts/local-storage.md`
- [ ] T022 [US2] Execute import preview validation with `耗材储存.xlsx`
- [ ] T023 [US2] Record whether imported `重量/卷数` maps to remaining weight and quantity in `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T024 [US2] Record whether WPS images display when extractable and missing images degrade gracefully in `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T025 [US2] Execute JSON backup export and restore review using `specs/001-v1-baseline-spec/contracts/import-export.md`
- [ ] T026 [US2] Execute ZIP backup export and restore review using `specs/001-v1-baseline-spec/contracts/import-export.md`
- [ ] T027 [US2] Confirm future backup changes must preserve `data.json`, `images/`, `imageManifest`, and `missingImages` expectations in `specs/001-v1-baseline-spec/contracts/import-export.md`

**Checkpoint**: Import/export and migration baseline is independently verified and protected.

---

## Phase 5: User Story 3 - 记录实际消耗和打印计划 (Priority: P1)

**Goal**: Protect consumption records, stock deduction, multi-material queue behavior, queue completion, and failure handling.

**Independent Test**: Follow the Consumption and Queue Baseline scenario in `specs/001-v1-baseline-spec/quickstart.md`.

### Checks for User Story 3

- [ ] T028 [P] [US3] Review Consumption Record fields in `specs/001-v1-baseline-spec/data-model.md`
- [ ] T029 [P] [US3] Review Print Queue Task and Queue Material Line fields in `specs/001-v1-baseline-spec/data-model.md`
- [ ] T030 [P] [US3] Review queue UI contract in `specs/001-v1-baseline-spec/contracts/ui-workflows.md`
- [ ] T031 [US3] Execute manual consumption deduction validation from `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T032 [US3] Execute two-material queue completion validation from `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T033 [US3] Record whether queue risk warns when planned consumption exceeds remaining stock in `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T034 [US3] Record whether failure handling remains documented for reason, optional deduction, and optional requeue in `specs/001-v1-baseline-spec/data-model.md`
- [ ] T035 [US3] Confirm future queue schema changes preserve legacy `itemId` plus `grams` migration expectations in `specs/001-v1-baseline-spec/contracts/local-storage.md`

**Checkpoint**: Consumption and queue baseline is independently verified and protected.

---

## Phase 6: User Story 4 - 计算报价、补货和库存健康 (Priority: P2)

**Goal**: Protect quote defaults, restock thresholds, audit corrections, drying reminders, and inventory health checks.

**Independent Test**: Follow the calculator, restock, audit, and quality expectations in `specs/001-v1-baseline-spec/spec.md` and `specs/001-v1-baseline-spec/contracts/ui-workflows.md`.

### Checks for User Story 4

- [ ] T036 [P] [US4] Review Cost Settings defaults and quote derivation in `specs/001-v1-baseline-spec/data-model.md`
- [ ] T037 [P] [US4] Review Restock Settings thresholds in `specs/001-v1-baseline-spec/data-model.md`
- [ ] T038 [P] [US4] Review quality, audit, and trash workflow coverage in `specs/001-v1-baseline-spec/contracts/ui-workflows.md`
- [ ] T039 [US4] Execute quote calculation review using one inventory item with purchase price and record the result in `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T040 [US4] Execute restock recommendation review for below-threshold inventory and record the result in `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T041 [US4] Execute audit correction review, confirm an adjustment record is created, and record the result in `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T042 [US4] Execute drying reminder review for opened PETG, TPU, PA, or PC inventory and record the result in `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T043 [US4] Confirm future cost-setting changes update `specs/001-v1-baseline-spec/spec.md` and `specs/001-v1-baseline-spec/data-model.md`

**Checkpoint**: Quote, restock, audit, drying, and quality baseline is independently verified and protected.

---

## Phase 7: User Story 5 - 发现重复、清理异常和恢复误删 (Priority: P2)

**Goal**: Protect explainable duplicate detection, hard caps, ignored pairs, negative rules, merge preview, and trash recovery.

**Independent Test**: Follow the Duplicate and Quality Baseline scenario in `specs/001-v1-baseline-spec/quickstart.md`.

### Checks for User Story 5

- [ ] T044 [P] [US5] Review duplicate scoring weights, levels, filters, and hard caps in `specs/001-v1-baseline-spec/spec.md`
- [ ] T045 [P] [US5] Review Duplicate Rule State and Trash Entry entities in `specs/001-v1-baseline-spec/data-model.md`
- [ ] T046 [P] [US5] Review duplicate UI workflow contract in `specs/001-v1-baseline-spec/contracts/ui-workflows.md`
- [ ] T047 [US5] Execute duplicate explanation validation for two intentionally similar inventory records and record the result in `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T048 [US5] Execute hard-cap validation for same-base different modifier materials such as ABS and ABS-GF and record the result in `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T049 [US5] Execute color-shade hard-cap validation for same-family different shade colors and record the result in `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T050 [US5] Execute ignore-pair validation, confirm inventory health hides the ignored duplicate by default, and record the result in `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T051 [US5] Execute merge preview review, confirm trash recovery expectations remain documented, and record the result in `specs/001-v1-baseline-spec/contracts/ui-workflows.md`
- [ ] T052 [US5] Confirm future duplicate scoring changes must update `specs/001-v1-baseline-spec/spec.md`, `specs/001-v1-baseline-spec/data-model.md`, and `specs/001-v1-baseline-spec/contracts/ui-workflows.md`

**Checkpoint**: Duplicate detection and trash recovery baseline is independently verified and protected.

---

## Phase 8: User Story 6 - 标签打印、二维码和扫码快捷操作 (Priority: P2)

**Goal**: Protect label rendering, QR payload modes, batch selection, scan parsing, manual fallback, and scan quick actions.

**Independent Test**: Follow the Labels and Scan Baseline scenario in `specs/001-v1-baseline-spec/quickstart.md`.

### Checks for User Story 6

- [ ] T053 [P] [US6] Review Label Settings fields and QR mode rules in `specs/001-v1-baseline-spec/data-model.md`
- [ ] T054 [P] [US6] Review label and scan workflow contract in `specs/001-v1-baseline-spec/contracts/ui-workflows.md`
- [ ] T055 [P] [US6] Review QR and scan formats in `specs/001-v1-baseline-spec/spec.md`
- [ ] T056 [US6] Execute batch label selection and print-view validation from `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T057 [US6] Execute small, medium, and large label size validation and record the result in `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T058 [US6] Execute QR fallback review by confirming readable text remains part of the label contract in `specs/001-v1-baseline-spec/contracts/ui-workflows.md`
- [ ] T059 [US6] Execute manual scan lookup validation for `FIL-0001`, `index.html#filament=FIL-0001`, and `FIL-0001-01`, then record the result in `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T060 [US6] Execute scan quick consume validation, confirm a consumption record is created, and record the result in `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T061 [US6] Confirm future scan or QR changes preserve manual fallback and main-code parsing in `specs/001-v1-baseline-spec/spec.md`

**Checkpoint**: Label, QR, and scan baseline is independently verified and protected.

---

## Final Phase: Polish & Cross-Cutting Protection

**Purpose**: Keep the baseline usable as a guardrail for future development.

- [ ] T062 [P] Review `specs/001-v1-baseline-spec/quickstart.md` and ensure every critical workflow has an expected outcome
- [ ] T063 [P] Review `specs/001-v1-baseline-spec/plan.md` risk points for browser storage, backup trust, WPS images, QR/scanning, duplicate false positives, and data migration
- [ ] T064 [P] Review `README.md` development constitution notes against `.specify/memory/constitution.md`
- [ ] T065 Confirm no business code files were modified while completing baseline tasks by checking `index.html`, `style.css`, `app.js`, and `vendor/`
- [ ] T066 Run `node --check app.js` after any future JavaScript change and record the result in the relevant feature quickstart
- [ ] T067 Update `specs/001-v1-baseline-spec/tasks.md` only if new baseline-protection tasks are discovered
- [ ] T068 Execute current filtered inventory `.xlsx` export validation and record the result in `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T069 Execute restock list `.xlsx` export validation and record the result in `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T070 Execute scan custom deduction validation and record the result in `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T071 Execute scan update-location validation and record the result in `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T072 Execute scan mark-opened validation and record the result in `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T073 Execute scan enter-audit validation and record the result in `specs/001-v1-baseline-spec/quickstart.md`
- [ ] T074 Execute scan add-to-queue validation and record the result in `specs/001-v1-baseline-spec/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; establishes documentation-only scope.
- **Foundational (Phase 2)**: Depends on Setup; verifies shared contracts.
- **US1, US2, US3 (P1)**: Depend on Foundational; can be reviewed independently after shared contracts.
- **US4, US5, US6 (P2)**: Depend on Foundational; can run after or alongside P1 validation if capacity allows.
- **Final Phase**: Depends on all desired workflow checks.

### User Story Dependencies

- **US1 Inventory**: Independent after Foundational.
- **US2 Import/Export**: Independent after Foundational, but image checks benefit from inventory records.
- **US3 Consumption/Queue**: Uses inventory records from US1 or equivalent test records.
- **US4 Quote/Restock/Health**: Uses inventory records and can run independently with test data.
- **US5 Duplicate/Trash**: Uses duplicate test records and can run independently with test data.
- **US6 Labels/Scan**: Uses inventory records with stable `FIL-xxxx` codes.

### Within Each User Story

- Read contracts and data model first.
- Execute the independent manual validation.
- Record results or gaps in the relevant spec artifact only.
- Do not implement fixes or new features in this baseline task set.

---

## Parallel Opportunities

- T002, T003, and T004 can run in parallel.
- T013, T014, T019, T020, T021, T028, T029, T030, T036, T037, T038, T044, T045, T046, T053, T054, and T055 can run in parallel because they review separate artifacts.
- US2 backup review, US5 duplicate review, and US6 label review can run in parallel in separate browser profiles if using isolated local data.
- Final review tasks T062, T063, and T064 can run in parallel.

## Parallel Example: Baseline Review

```text
Task: "T019 [P] [US2] Review project-specific import column mapping in specs/001-v1-baseline-spec/contracts/import-export.md"
Task: "T044 [P] [US5] Review duplicate scoring weights, levels, filters, and hard caps in specs/001-v1-baseline-spec/spec.md"
Task: "T053 [P] [US6] Review Label Settings fields and QR mode rules in specs/001-v1-baseline-spec/data-model.md"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete US1, because inventory is the base workflow for all other checks.
3. Stop and confirm the baseline scope still excludes application code changes.

### Incremental Baseline Coverage

1. Validate inventory.
2. Validate import/export and backup.
3. Validate consumption and queue.
4. Validate quote, restock, quality, and audit.
5. Validate duplicate detection and trash recovery.
6. Validate labels, QR, and scan.

### Future Feature Guardrail

For any later v1.8+ feature, copy the relevant workflow checks from this task
list into that feature's quickstart or tasks before code changes begin.
