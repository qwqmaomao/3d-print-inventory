# Research: 3D 打印耗材库存 v1.0 基线

## Decision: Keep the project as a directly openable static web app

**Rationale**: The current product value depends on opening `index.html`
directly, using no server, and storing data in the user's current browser. This
matches the constitution's local-first requirement and the user's explicit
instruction to avoid backends and large rewrites.

**Alternatives considered**:
- Add a backend for shared storage: rejected because it changes deployment,
  introduces account/security scope, and violates the current baseline.
- Add a build framework: rejected because the current flat files are already
  working and a framework would add migration risk without baseline value.

## Decision: Treat LocalStorage and IndexedDB names as stable contracts

**Rationale**: User inventory, queue, settings, trash, duplicate, restock, and
label data are persisted under current LocalStorage keys. Images are stored in
IndexedDB to avoid LocalStorage size pressure. Future features must normalize
old records instead of replacing keys.

**Alternatives considered**:
- Rename keys for a new major version: rejected for v1.0 baseline because it
  would require migration and recovery work.
- Embed images in LocalStorage or JSON by default: rejected because images can
  exceed safe LocalStorage and backup sizes.

## Decision: Reuse existing local vendor modules

**Rationale**: Sheet import/export, ZIP backup, WPS image extraction, and QR
label rendering already depend on local files in `vendor/`. Keeping them avoids
CDN dependency and preserves offline behavior.

**Alternatives considered**:
- Fetch modules from CDN: rejected because the app must work offline.
- Replace modules with new dependencies: rejected unless a future spec proves
  the current library cannot support a required workflow.

## Decision: Document JSON and ZIP as separate backup classes

**Rationale**: JSON is useful for lightweight text backup but only stores image
keys. ZIP is the complete migration format because it includes `data.json` plus
image files.

**Alternatives considered**:
- Make JSON include base64 images: rejected because files would become large and
  storage/restore would be less predictable.
- Remove JSON backup: rejected because quick text backup remains useful.

## Decision: Preserve aggregate inventory records

**Rationale**: Current inventory records represent grouped filament items with a
quantity and per-spool weight. The QR parser already accepts future spool codes,
but there is no single-spool child entity in the current baseline.

**Alternatives considered**:
- Add single-spool records now: rejected because the user asked for a baseline
  plan without code changes.
- Split imported multi-roll entries into separate records: rejected because the
  current import contract stores quantity and total remaining weight together.

## Decision: Keep duplicate detection explainable and capped

**Rationale**: The current false-positive controls are part of the user trust
model. Material signatures, color signatures, hard caps, ignore state, and
negative rules must remain visible in future planning.

**Alternatives considered**:
- Pure fuzzy matching: rejected because it over-merges materials such as ABS and
  ABS-GF or colors such as lake blue and dark blue.
- Hidden scoring: rejected because users need field-level explanations before
  merging inventory records.
