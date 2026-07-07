# Implementation Plan: 3D 打印耗材库存 v1.0 基线

**Branch**: `main` | **Date**: 2026-07-08 | **Spec**: `specs/001-v1-baseline-spec/spec.md`

**Input**: Feature specification from `specs/001-v1-baseline-spec/spec.md`

## Summary

This plan documents the current working 3D printing filament inventory web page
as the v1.0 technical baseline. The project remains a static, no-backend app
centered on `index.html`, `style.css`, `app.js`, and locally vendored browser
libraries. No application code changes are planned in this phase.

The baseline plan captures the existing architecture, browser storage contracts,
import/export behavior, QR/scan behavior, duplicate detection contract, risks,
and extension principles so future features can be planned without destabilizing
current inventory workflows.

## Technical Context

**Language/Version**: Browser-native HTML, CSS, and JavaScript as currently used
by `index.html`, `style.css`, and `app.js`.

**Primary Dependencies**: Existing local `vendor/` libraries only:
`xlsx.full.min.js` for spreadsheet import/export, `jszip.min.js` for WPS image
extraction and full ZIP backup/restore, and `qrcode.min.js` for label QR code
rendering.

**Storage**: Browser LocalStorage for structured text records and settings;
IndexedDB database `filament_inventory_assets_v1` store `images` for image
assets. JSON backup stores text data and image keys; ZIP backup stores text data
plus image files.

**Testing**: Static syntax validation with `node --check app.js`, manual browser
workflow validation, and data-contract checks using the baseline spec, data
model, and quickstart scenarios.

**Target Platform**: Local desktop browser opened directly from `index.html`.
Camera scanning depends on browser support for camera access and QR scanning;
manual input is the required fallback.

**Project Type**: Static local web application.

**Performance Goals**: Maintain responsive personal inventory use at the v1.0
baseline scale: at least 500 inventory records, 200 image references, 1000
consumption records, and 200 queue tasks remain usable for inventory rendering,
import preview, backup creation, scan lookup, duplicate review, and label
generation.

**Constraints**: No backend, no login, no external CDN dependency, no large
rewrite, no unnecessary dependency. Preserve current LocalStorage keys,
IndexedDB image storage, WPS/Excel import behavior, JSON backup, ZIP backup,
trash recovery, duplicate detection, labels, and scan workflows.

**Scale/Scope**: Single-user local inventory management at the documented local
scale of 500 inventory records, 200 image references, 1000 consumption records,
and 200 queue tasks. The current baseline is not a multi-user, cross-device,
server-synchronized, or printer-integrated system. Single-spool sub-record
management is a future direction, not part of the current data model.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Existing function stability**: This plan touches documentation only. It
  records existing workflows for inventory, import/export, images, backup,
  trash, restock, queue, quote, duplicate detection, inventory health, audit,
  labels, and scanning. Future implementation plans must include regression
  checks for every touched workflow.
- **Spec before code**: The active spec contains prioritized user scenarios,
  edge cases, functional requirements, key entities, baseline behavior contract,
  local data contract, and measurable outcomes.
- **Minimal dependencies/local-first**: No new dependency is introduced. The
  plan explicitly reuses existing local `vendor/` libraries and keeps direct
  `index.html` use.
- **Data safety/backward compatibility**: The plan preserves all existing
  LocalStorage keys and IndexedDB image storage. Any future change to keys,
  import format, JSON/ZIP backup, or image handling must document defaults and
  migration behavior before implementation.
- **Incremental verification**: No code slice is implemented here. Future slices
  must use the quickstart validation guide, `node --check app.js` for JavaScript
  changes, and targeted workflow checks.

**Gate Result**: PASS. No constitution violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-v1-baseline-spec/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── import-export.md
│   ├── local-storage.md
│   └── ui-workflows.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
index.html              # Static application shell and UI dialogs
style.css               # Layout, table, label, scan, print, and responsive styles
app.js                  # Inventory, storage, import/export, queue, duplicate,
                        # backup, labels, scan, and UI behavior
vendor/
├── xlsx.full.min.js     # Spreadsheet import/export
├── jszip.min.js         # WPS image extraction and full ZIP backup/restore
└── qrcode.min.js        # Local label QR rendering
耗材储存.xlsx            # Project-specific sample/source WPS spreadsheet
README.md               # User-facing feature summary and development notes
.specify/               # Spec Kit memory, templates, and scripts
specs/                  # Feature specifications and planning artifacts
```

**Structure Decision**: Keep the existing flat static web app. Do not introduce
`src/`, build tooling, backend folders, package managers, or framework-specific
structure for this baseline.

## Phase 0: Research Summary

See `research.md`.

Key decisions:
- Keep a static local runtime and browser storage.
- Treat LocalStorage keys and IndexedDB image storage as compatibility contracts.
- Use existing vendored spreadsheet, ZIP, and QR modules.
- Document JSON backup as lightweight text backup and ZIP backup as full
  migration backup.
- Preserve aggregate filament item records; reserve single-spool records for a
  future spec.

## Phase 1: Design Summary

See:
- `data-model.md`
- `contracts/local-storage.md`
- `contracts/import-export.md`
- `contracts/ui-workflows.md`
- `quickstart.md`

The design captures current data entities, validation rules, state transitions,
backup formats, import/export expectations, and manual validation flows. No code
changes are required for this baseline plan.

## Risk Points

- **Browser storage limits**: LocalStorage is limited and image data belongs in
  IndexedDB. Future features must not move images into LocalStorage.
- **Backup trust**: ZIP restore overwrites local data after confirmation. Future
  restore changes must keep confirmation and recoverability expectations clear.
- **WPS image extraction fragility**: `DISPIMG` relies on workbook relationship
  files and media paths. Import must degrade gracefully to text-only records.
- **QR/scanning variability**: Camera scanning depends on browser capability and
  permission. Manual code lookup is part of the contract, not a nice-to-have.
- **Duplicate detection false positives**: Material modifiers and color shades
  require hard caps and negative rules. Future scoring changes must preserve
  explainability and user override.
- **Data migration drift**: Old records may lack newer fields. Normalization and
  defaults are mandatory for any new field.
- **Flat file size growth**: `app.js` already owns many workflows. Future work
  may introduce small internal modules only if the spec justifies the risk and
  regression checks are clear.

## Extension Principles

- Add features as small user-facing slices that preserve current workflows.
- Prefer extending existing data records with defaults over replacing storage
  keys.
- Keep UI terminology Chinese and consistent with existing labels.
- Use local vendored modules only when a mature dependency reduces risk.
- Keep JSON/ZIP backup compatibility at the center of any data change.
- Document every new status, enum, threshold, scoring rule, and storage key in
  the spec before implementation.
- Treat single-spool management, external printer integration, and cross-device
  sync as separate future specs.

## Agent Context Update

No Spec Kit agent context update script is present in `.specify/scripts/`.
Planning artifacts were generated directly in the feature directory.

## Post-Design Constitution Check

- Existing function stability remains satisfied because no application code was
  changed and the plan records regression workflows.
- Spec-before-code remains satisfied because all future work now has a baseline
  spec, plan, data model, contracts, and quickstart guide.
- Minimal dependencies remains satisfied because no dependency is added.
- Data safety remains satisfied because storage keys, IndexedDB names, backup
  behavior, and migration expectations are documented.
- Incremental verification remains satisfied because quickstart scenarios define
  future validation gates.

**Gate Result**: PASS. No justified violations required.

## Complexity Tracking

No constitution violations or added complexity are introduced by this
documentation-only baseline plan.
