# Data Model: 3D 打印耗材库存 v1.0 基线

## Inventory Item

Represents one aggregate filament inventory record.

Fields:
- `id`: internal unique id.
- `filamentCode`: stable user-facing code, format `FIL-0001`.
- `name`: optional display name.
- `brand`: maker or brand.
- `material`: material or material series.
- `colorName`: display color name.
- `colorHex`: optional color swatch value.
- `diameter`: filament diameter in millimeters, default `1.75`.
- `quantity`: roll count, default `1`.
- `spoolWeight`: capacity per roll in grams, default `1000`.
- `totalWeight`: compatibility field; rendered capacity is `quantity * spoolWeight`.
- `remainingWeight`: current aggregate remaining grams.
- `status`: one of `在用`, `未开封`, `备用`, `已用完`.
- `location`: storage location.
- `purchaseDate`: purchase date.
- `purchasePrice`: total purchase price for the aggregate record.
- `unitCost`: calculated single-gram cost.
- `shop`: purchase platform or shop.
- `batch`: batch, lot, serial, or imported sequence.
- `opened`: `true`, `false`, or empty when unknown.
- `openedAt`: opened date.
- `lastDryAt`: last drying date.
- `dryTemp`: drying temperature.
- `dryHours`: drying duration.
- `moistureSuspected`: boolean moisture risk marker.
- `dryStatus`: drying state, default `正常`.
- `notes`: free-form notes.
- `imageKey`: reference to an IndexedDB image asset.
- `createdAt`: creation timestamp.
- `updatedAt`: update timestamp.

Validation and derived rules:
- Missing `filamentCode` is filled with the next stable `FIL-xxxx` code.
- Missing `spoolWeight` defaults to 1000g.
- Missing `diameter` defaults to 1.75mm.
- Capacity is always calculated from quantity and spool weight.
- Low stock is remaining weight at or below 100g or at or below 20% capacity.
- Remaining weight above capacity is allowed but flagged.

## Image Asset

Represents a filament image stored outside LocalStorage.

Fields:
- `key`: image key referenced by inventory item `imageKey`.
- `blob`: binary image data.
- `mime`: image MIME type.
- `updatedAt`: update timestamp.

Relationships:
- Inventory items and trash item snapshots may reference an image asset by key.
- ZIP backup maps image keys to files in `images/`.

## Consumption Record

Represents actual consumption or inventory adjustment.

Fields:
- `id`: unique id.
- `date`: record date.
- `project`: print project, queue task, scan quick action, or audit label.
- `itemId`: referenced inventory item id.
- `itemLabel`: display label captured at record time.
- `grams`: grams consumed or adjusted.
- `hours`: print duration.
- `cost`: calculated cost snapshot.
- `type`: optional adjustment type.
- `systemWeight`: system weight before audit correction.
- `actualWeight`: actual weighed value for audit.
- `difference`: audit difference.
- `notes`: notes.

State effects:
- Manual consumption, queue completion, failed-task consumption, scan quick
  consumption, and audit corrections can create records.
- Deducting consumption reduces the related inventory item's remaining weight.

## Print Queue Task

Represents a planned or historical print task.

Fields:
- `id`: unique id.
- `name`: task name.
- `materials`: one or more queue material lines.
- `hours`: estimated print hours.
- `status`: `待打印`, `准备中`, `打印中`, `暂停`, `已完成`, `失败`, or `取消`.
- `notes`: task notes.
- `completedConsumptionId`: comma-separated consumption record ids generated at completion.
- `failureReason`: one of `翘边`, `堵头`, `断料`, `模型问题`, `支撑失败`, `停电`, `手动取消`, `其他`.
- `failureNotes`: failure notes.
- `failedAt`: failure timestamp.
- `completedAt`: completion timestamp.
- `createdAt`: creation timestamp.
- `updatedAt`: update timestamp.

State transitions:
- Any editable task can be moved among queue statuses.
- Completing a task creates one consumption record per material line and deducts stock.
- Failing a task may create consumption records and may create a new pending task.
- Deleting a task removes it from the queue list; it does not delete inventory.

## Queue Material Line

Fields:
- `itemId`: referenced inventory item id.
- `grams`: compatibility planned grams.
- `estimatedWeight`: planned grams.
- `actualWeight`: optional actual grams.

Validation:
- Each queue task must contain at least one material line.
- Planned or actual grams must be positive to participate in completion.
- Any line exceeding remaining stock creates queue risk.

## Cost Settings

Fields:
- `wearRate`: default `2`.
- `electricityRate`: default `0.6`.
- `powerWatts`: default `120`.
- `laborFee`: default `0`.
- `modelFee`: default `0`.
- `postProcessFee`: default `0`.
- `packagingFee`: default `0`.
- `failureRate`: default `0.1`.
- `profitMultiplier`: default `1.5`.
- `minimumPrice`: default `0`.

Derived quote:
- Material cost plus machine wear plus electricity plus fixed service fees
  produces base cost.
- Final quote applies failure loss and profit multiplier, then respects minimum
  price.

## Trash Entry

Fields:
- `id`: trash entry id.
- `deletedAt`: deletion timestamp.
- `item`: normalized inventory item snapshot.
- `relatedConsumptionIds`: related consumption ids.
- `relatedQueueIds`: related queue ids.

Rules:
- Deleting inventory moves it to trash rather than destroying it immediately.
- Duplicate merge moves the merged-away record to trash.
- Permanent delete and clear trash are irreversible for the record snapshot.

## Duplicate Rule State

Fields:
- Ignored duplicate pair ids.
- Negative material/color rules.

Rules:
- Default duplicate view hides ignored pairs.
- Inventory health checks respect ignored duplicate pairs by default.
- Negative rules suppress repeated false positives for known material or color
  combinations.

## Restock Settings

Fields:
- `defaultThreshold`: default 200g.
- Optional material-specific thresholds.

Rules:
- PLA/PETG use 200g guidance.
- TPU/PA/PC use 150g guidance.
- Restock rows are generated for records below threshold.

## Label Settings

Fields:
- `size`: `small`, `medium`, or `large`.
- `qrMode`: `code` or `hash`.

Rules:
- `code` QR payload is the filament code.
- `hash` QR payload is `index.html#filament=<code>`.

## Image and Backup Relationships

- JSON backup serializes records and settings, but not image blobs.
- ZIP backup serializes records and settings into `data.json` and stores image
  blobs under `images/` with an image manifest.
- Restore normalizes records to fill missing modern fields.
