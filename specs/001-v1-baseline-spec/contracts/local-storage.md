# Contract: Local Storage and Image Assets

## Purpose

This contract defines the browser-local persistence surface for the v1.0
baseline. Future features must preserve these keys unless a migration is
specified and validated.

## LocalStorage Keys

| Key | Value | Required behavior |
|-----|-------|-------------------|
| `filament_inventory_v1` | Inventory item array | Must load old records through normalization and preserve unknown safe fields when possible |
| `filament_consumption_v1` | Consumption record array | Must preserve historical records and item labels |
| `filament_queue_v1` | Print queue task array | Must normalize old single-material tasks into material arrays |
| `filament_cost_settings_v1` | Cost settings object | Must merge missing fields with defaults |
| `filament_trash_v1` | Trash entry array | Must allow restore until permanent deletion |
| `filament_duplicate_ignores_v1` | Ignored duplicate pair id array | Must hide ignored pairs by default |
| `filament_duplicate_negative_rules_v1` | Negative material/color rule array | Must suppress remembered false positives |
| `filament_quality_ignores_v1` | Ignored quality issue id array | Must persist ignored health issues |
| `filament_restock_settings_v1` | Restock settings object | Must merge missing fields with defaults |
| `filament_label_settings_v1` | Label settings object | Must merge missing fields with defaults |

## IndexedDB

| Database | Store | Key | Value |
|----------|-------|-----|-------|
| `filament_inventory_assets_v1` | `images` | `imageKey` | Image blob, MIME type, update timestamp |

## Compatibility Rules

- Missing `spoolWeight` defaults to 1000g.
- Missing `diameter` defaults to 1.75mm.
- Missing `filamentCode` receives a stable `FIL-xxxx` code.
- Legacy queue status `已取消` becomes `取消`.
- Legacy queue records with `itemId` and `grams` become `materials[]`.
- Image keys may exist without an image blob; UI must show a missing-image state.

## Backup Rules

- JSON backup stores LocalStorage-style structured data and image keys only.
- ZIP backup stores `data.json`, `imageManifest`, `missingImages`, and image
  files under `images/`.
- ZIP restore must ask the user to confirm overwrite before replacing local data.
