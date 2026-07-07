# Feature Specification: 3D 打印耗材库存 v1.0 基线

**Feature Branch**: `main`

**Created**: 2026-07-08

**Status**: Draft

**Input**: User description: "基于当前已有代码，把这个 3D 打印耗材库存网页整理成 v1.0 基线规格。不要修改代码，只阅读 README.md、index.html、app.js、style.css、vendor 目录等文件，整理当前已有功能、数据结构、本地存储、扫码、二维码、导入导出、耗材管理、消耗记录、打印队列、重复检测、标签打印等内容，并写出验收标准。"

## Clarifications

### Session 2026-07-08

- Q: v1.0 基线规格是否应固定当前枚举、阈值、重复检测分值/hard cap、扫码格式和标签尺寸作为验收契约？ → A: 固定当前契约

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 维护耗材库存台账 (Priority: P1)

个人 3D 打印用户可以在一个本地网页中记录耗材的品牌、材料、颜色、
线径、卷数、剩余重量、位置、状态、购买信息、图片、备注和干燥状态，
并在日常整理时快速筛选、排序和直接修改常用字段。

**Why this priority**: 库存台账是本项目的核心价值；其他导入、消耗、
队列、标签和备份能力都围绕库存记录展开。

**Independent Test**: 从空白浏览器数据开始，新增一条耗材，刷新页面后
确认记录、统计、库存进度、筛选和编辑结果仍可读取。

**Acceptance Scenarios**:

1. **Given** 当前没有库存记录，**When** 用户新增 PLA 耗材并保存，
   **Then** 库存表显示该记录，统计卡片更新总条目、总卷数和剩余重量。
2. **Given** 已有库存记录，**When** 用户在表格中快速修改品牌、材料、
   颜色、卷数、剩余重量、位置或状态，**Then** 修改立即保存并在刷新后保留。
3. **Given** 某耗材剩余重量低于 20% 或低于 100g，**When** 库存列表渲染，
   **Then** 该记录显示风险高亮和对应库存进度状态。
4. **Given** 某耗材剩余重量大于卷数乘每卷重量，**When** 库存列表渲染，
   **Then** 该记录显示超容量提示但不阻止用户继续整理历史数据。

---

### User Story 2 - 导入、导出和迁移库存数据 (Priority: P1)

用户可以从 WPS/Excel 表格导入既有耗材数据，保留 WPS 图片；也可以通过
JSON 或完整 ZIP 备份迁移库存、消耗记录、队列、设置、回收站和图片。

**Why this priority**: 用户已经有历史表格和图片资产，导入与备份决定
工具是否能长期安全使用。

**Independent Test**: 使用项目内 `耗材储存.xlsx` 导入数据，随后导出 JSON
和 ZIP，再恢复到浏览器本地数据中并核对记录数量、字段和图片。

**Acceptance Scenarios**:

1. **Given** 用户选择 WPS/Excel 文件，**When** 文件包含厂家、材质、
   颜色、重量/卷数、备注图、备注和位置序列号，**Then** 导入预览展示
   映射后的品牌、材料、颜色、剩余/容量、位置、备注和图片。
2. **Given** WPS 表格单元格中包含 `DISPIMG` 图片引用，**When** 导入完成，
   **Then** 图片可在库存预览和库存表中显示，并随完整 ZIP 备份保存。
3. **Given** 用户导出 JSON，**When** 下载备份文件，**Then** 文件包含库存、
   消耗记录、打印队列、成本设置、回收站、重复检测设置、补货设置和标签设置，
   但不内嵌原图。
4. **Given** 用户导出完整 ZIP，**When** 下载备份文件，**Then** ZIP 包含
   `data.json` 和 `images/`，并记录图片 manifest 与缺失图片列表。
5. **Given** 用户恢复 ZIP，**When** 确认覆盖当前数据，**Then** 本地库存、
   消耗、队列、设置、回收站和图片被恢复。

---

### User Story 3 - 记录实际消耗和打印计划 (Priority: P1)

用户可以记录每次打印的实际耗材消耗，也可以提前建立打印队列，按任务
规划一种或多种耗材的预计用量、实际用量、时长、状态和失败处理。

**Why this priority**: 消耗记录和打印队列让库存从静态台账变成可追踪的
实际用料系统。

**Independent Test**: 建立一个包含两种耗材的打印队列任务，将其完成后
确认两个耗材分别扣减库存，并生成对应消耗记录。

**Acceptance Scenarios**:

1. **Given** 用户新增消耗记录并选择耗材，**When** 输入项目名、克数和时长
   后保存，**Then** 系统生成消耗记录并扣减对应耗材剩余重量。
2. **Given** 消耗克数大于当前剩余重量，**When** 用户保存，**Then** 系统
   提示风险，并仅在用户确认后继续记录。
3. **Given** 队列任务包含多种耗材，**When** 任一种预计用量超过剩余库存，
   **Then** 队列显示库存不足提醒。
4. **Given** 队列任务被标记为已完成，**When** 每项耗材有实际消耗或预计消耗，
   **Then** 每种耗材生成一条消耗记录并扣减库存。
5. **Given** 队列任务被标记为失败，**When** 用户选择生成消耗记录或重新加入队列，
   **Then** 系统按用户选择记录失败原因、扣减库存或创建新的待打印任务。

---

### User Story 4 - 计算报价、补货和库存健康 (Priority: P2)

用户可以基于耗材成本、机器磨损、电费和附加费用计算代打报价；系统可以
生成补货清单、盘点修正记录、干燥提醒和库存体检问题。

**Why this priority**: 这些能力提升日常经营和维护效率，但依赖稳定库存数据。

**Independent Test**: 为一条有购买价格的耗材输入预计消耗和打印时长，核对
报价明细；修改实际称重后确认盘点修正记录生成。

**Acceptance Scenarios**:

1. **Given** 耗材有单克成本，**When** 用户输入预计消耗和打印时长，
   **Then** 计算器显示材料、电费、机器磨损、人工、模型处理、后处理、
   包装、失败损耗、利润倍率、最低起步价和最终报价。
2. **Given** 库存低于材料阈值，**When** 用户打开补货清单，**Then** 系统
   显示品牌、材料、颜色、线径、剩余、卷数、阈值、建议采购、位置和备注。
3. **Given** 用户在盘点页填写实际称重，**When** 保存盘点，**Then** 对应
   库存剩余重量被更新，并生成盘点修正类型的消耗/调整记录。
4. **Given** PETG、TPU、PA、PC 或类似易受潮材料已开封较久且无干燥记录，
   **When** 库存体检或库存列表渲染，**Then** 系统提示建议干燥。

---

### User Story 5 - 发现重复、清理异常和恢复误删 (Priority: P2)

用户可以检查疑似重复记录、查看评分原因和字段冲突，忽略或记住非重复
判断，并在合并前预览结果；删除的耗材先进入回收站，可恢复或永久删除。

**Why this priority**: 大批量导入后容易出现重复和异常，安全清理能力能
降低误删和误合并风险。

**Independent Test**: 创建两条相似耗材，运行重复检测，查看字段对比表，
忽略该组后确认库存体检不再默认显示该重复问题。

**Acceptance Scenarios**:

1. **Given** 两条记录品牌、材料、颜色、线径和关键词高度相似，**When**
   用户运行重复检测，**Then** 系统按相似度排序显示评分、等级、原因、
   字段对比、冲突提示和合并建议。
2. **Given** 两条记录基础材料不同或线径不同，**When** 用户运行重复检测，
   **Then** 该组合不作为重复候选显示。
3. **Given** ABS 与 ABS-GF 或 PETG 与 PETG-CF 等同基材不同型号，**When**
   用户运行重复检测，**Then** 结果最高按同类耗材处理并提示不建议合并。
4. **Given** 湖蓝和深蓝等同色系不同色号，**When** 用户运行重复检测，
   **Then** 结果不会显示为几乎确定重复，并提示同色系不同色号。
5. **Given** 用户合并两条记录，**When** 确认合并预览，**Then** 保留记录
   合并数量、剩余重量、价格和备注，被合并记录进入回收站，消耗记录和
   队列引用迁移到保留记录。
6. **Given** 用户删除耗材，**When** 删除完成，**Then** 记录进入回收站；
   用户可以恢复、永久删除或清空回收站。

---

### User Story 6 - 标签打印、二维码和扫码快捷操作 (Priority: P2)

用户可以为耗材打印包含明文编号和二维码的标签，也可以在当前库存网页中
扫码或手动输入编号查找耗材，并执行快速消耗、更新位置、标记开封、盘点
和加入队列等操作。

**Why this priority**: 标签和扫码把实体料盘与本地库存记录连接起来，提升
查找和扣减效率。

**Independent Test**: 选择两条库存记录批量打印标签，使用手动输入
`FIL-0001` 和 `index.html#filament=FIL-0001` 定位耗材并快速扣减 10g。

**Acceptance Scenarios**:

1. **Given** 库存记录有稳定编号，**When** 用户打开标签页，**Then** 标签
   显示编号、品牌、材料、颜色、线径、剩余重量、位置和二维码。
2. **Given** 用户在库存表勾选多条记录，**When** 点击批量打印标签，
   **Then** 标签页仅打印所选记录，并支持小、中、大三种尺寸。
3. **Given** 二维码库不可用或生成失败，**When** 标签渲染，**Then** 明文
   信息仍然显示，并提示二维码生成失败。
4. **Given** 浏览器支持摄像头扫码，**When** 扫到 `FIL-xxxx` 二维码，
   **Then** 系统在当前本地库存中定位对应耗材并打开快捷操作面板。
5. **Given** 浏览器不支持摄像头扫码，**When** 用户手动输入 `FIL-xxxx`、
   `index.html#filament=FIL-xxxx` 或未来单卷格式 `FIL-xxxx-01`，**Then**
   系统解析主耗材编号并查找库存。
6. **Given** 扫码命中耗材，**When** 用户快速扣减 10g、50g、100g 或自定义克数，
   **Then** 库存扣减并生成项目名为“扫码快速消耗”的消耗记录。

### Edge Cases

- 表格导入时缺少品牌、材料、颜色或重量列，系统仍导入可识别字段，并通过
  默认值、库存体检或用户编辑补齐缺失信息。
- `重量/卷数` 可包含 kg、g 和卷数表达；重量表示当前剩余总重量，容量按
  卷数乘每卷 1000g 计算。
- WPS `DISPIMG` 图片关系缺失、图片文件缺失或图片无法读取时，文字数据仍可导入，
  图片显示为“无图”。
- JSON 备份只保存图片 key，若 IndexedDB 中无对应图片，恢复后文字记录仍可用。
- ZIP 恢复覆盖当前本地数据前必须要求用户确认。
- 老数据缺少 `spoolWeight`、`filamentCode`、新队列材料数组、干燥字段或标签设置时，
  系统应提供默认值并保持可读取。
- 消耗或队列完成扣减超过剩余库存时必须提示用户确认，不得静默产生负库存。
- 重复检测中基础材料不同、线径不同或颜色大类不同的记录不得显示为可合并重复。
- 用户忽略的重复检测结果在重复检测和库存体检中默认隐藏；用户选择显示忽略项时可查看。
- 摄像头权限被拒绝、浏览器不支持扫码或扫码 API 不可用时，手动输入查找必须可用。
- 二维码内容可以是明文耗材编号或本地页面 hash；手机扫码不保证读取电脑浏览器本地库存。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST run as a local, no-login, no-backend inventory page opened from `index.html`.
- **FR-002**: System MUST persist inventory, consumption, queue, settings, trash, duplicate, quality, restock, and label data in the current browser.
- **FR-003**: System MUST store imported or uploaded filament images separately from text data and display thumbnails when images are available.
- **FR-004**: System MUST support inventory creation, editing, deletion-to-trash, restoration, permanent deletion, searching, filtering, sorting, and inline editing of common fields.
- **FR-005**: System MUST assign or preserve stable filament codes in the `FIL-0001` format for inventory records.
- **FR-006**: System MUST calculate total capacity as quantity multiplied by per-spool weight, defaulting to 1000g per spool and 1.75mm diameter for new or incomplete records.
- **FR-007**: System MUST show stock progress and risk states for good, warning, danger, empty, and over-capacity inventory conditions.
- **FR-008**: System MUST import WPS/Excel `.xlsx` records using common Chinese column aliases and the project-specific columns `厂家`, `材质`, `颜色`, `重量/卷数`, `备注图`, `备注`, and `位置序列号`.
- **FR-009**: System MUST extract WPS `DISPIMG` images when available and connect them to imported inventory records.
- **FR-010**: System MUST provide import preview and confirmation before imported rows are added to inventory.
- **FR-011**: System MUST export and restore lightweight JSON backups containing text data and settings.
- **FR-012**: System MUST export and restore full ZIP backups containing structured data plus image files.
- **FR-013**: System MUST allow filtered inventory and restock lists to be exported as spreadsheet files.
- **FR-014**: System MUST record manual consumption with project name, selected filament, grams, hours, calculated cost, date, and notes.
- **FR-015**: System MUST deduct inventory when a consumption record is saved with stock deduction enabled.
- **FR-016**: System MUST calculate quote/cost details using material cost, wear cost, electricity, labor, model processing, post-processing, packaging, failure loss, profit multiplier, and minimum price.
- **FR-017**: System MUST support print queue tasks with one or more material lines, planned grams, actual grams, hours, status, notes, completion, failure handling, and cancellation/deletion.
- **FR-018**: System MUST generate consumption records and deduct each material when a queue task is completed.
- **FR-019**: System MUST show queue inventory risk when any planned material exceeds current remaining stock.
- **FR-020**: System MUST generate restock recommendations using material thresholds and include brand, material, color, diameter, remaining weight, quantity, threshold, suggested purchase quantity, location, and notes.
- **FR-021**: System MUST perform duplicate detection with pair-based scoring, duplicate levels, field comparisons, hard caps, conflict hints, ignore controls, negative rules, and merge preview.
- **FR-022**: System MUST move merged or deleted inventory records to trash where recovery remains possible until permanent deletion.
- **FR-023**: System MUST provide inventory health checks for duplicates, missing key fields, over-capacity stock, quantity/remaining contradictions, status/remaining contradictions, missing images, and drying reminders.
- **FR-024**: System MUST support audit mode where actual weighed stock can update remaining weight and create an adjustment record.
- **FR-025**: System MUST support moisture/drying fields and display drying warnings for susceptible materials.
- **FR-026**: System MUST render printable labels containing filament code, brand, material, color, diameter, remaining weight, location, and QR code.
- **FR-027**: System MUST support batch label selection and small, medium, and large label sizes.
- **FR-028**: System MUST support scan lookup using camera QR scanning when available and manual code input when camera scanning is unavailable.
- **FR-029**: System MUST parse `FIL-0001`, `index.html#filament=FIL-0001`, and future spool code forms such as `FIL-0001-01` by locating the main filament record.
- **FR-030**: System MUST provide scan quick actions for viewing details, quick consumption, custom deduction, marking opened, updating location, entering audit, and adding to queue.
- **FR-031**: System MUST preserve existing working behavior unless a later specification explicitly documents and accepts a breaking change.
- **FR-032**: System MUST remain usable as a static local `index.html` page unless a later specification explicitly documents a runtime change.

### Key Entities *(include if feature involves data)*

- **Inventory Item**: A filament inventory record with id, name, brand, material,
  color name/value, diameter, quantity, per-spool weight, total capacity,
  remaining weight, status, location, purchase date, purchase price, unit cost,
  stable filament code, shop, batch, opened state, drying/moisture fields, notes,
  image key, creation time, and update time.
- **Image Asset**: A locally stored image associated with an image key, binary
  data, MIME type, and update time. Images can originate from WPS import or manual upload.
- **Consumption Record**: A usage or adjustment record with id, date, project,
  item reference, item label, grams, hours, calculated cost, type, system weight,
  actual weight, difference, and notes.
- **Print Queue Task**: A planned or historical print task with id, name,
  material lines, hours, status, notes, completion metadata, failure reason,
  failure notes, creation time, and update time.
- **Queue Material Line**: A material reference inside a queue task with item id,
  planned grams, estimated weight, and optional actual weight.
- **Cost Settings**: User-editable pricing defaults for wear rate, electricity,
  power, labor, model processing, post-processing, packaging, failure rate,
  profit multiplier, and minimum price.
- **Trash Entry**: A recoverable deleted or merged inventory record with deletion
  time, embedded inventory item snapshot, and related consumption/queue references.
- **Duplicate Rule State**: Ignored duplicate pair ids and remembered negative
  material/color rules used to suppress repeated false positives.
- **Quality Ignore State**: Ignored inventory health issue ids.
- **Restock Settings**: Default and material-specific thresholds used to generate
  purchase recommendations.
- **Label Settings**: Label size and QR payload mode.

### Local Data Contract

- `filament_inventory_v1`: inventory item array.
- `filament_consumption_v1`: consumption and adjustment record array.
- `filament_queue_v1`: print queue task array.
- `filament_cost_settings_v1`: quote/cost settings object.
- `filament_trash_v1`: recoverable trash entry array.
- `filament_duplicate_ignores_v1`: ignored duplicate pair id array.
- `filament_duplicate_negative_rules_v1`: remembered non-duplicate material/color rule array.
- `filament_quality_ignores_v1`: ignored inventory health issue id array.
- `filament_restock_settings_v1`: restock threshold settings object.
- `filament_label_settings_v1`: label size and QR mode settings object.
- Indexed image storage: database `filament_inventory_assets_v1`, store `images`,
  with values keyed by `imageKey`.

### Baseline Behavior Contract

- Inventory status values are `在用`, `未开封`, `备用`, and `已用完`.
- Queue status values are `待打印`, `准备中`, `打印中`, `暂停`, `已完成`, `失败`,
  and `取消`; legacy `已取消` is treated as `取消`.
- Queue failure reasons are `翘边`, `堵头`, `断料`, `模型问题`, `支撑失败`,
  `停电`, `手动取消`, and `其他`.
- Default cost settings are machine wear `2` yuan/hour, electricity `0.6`
  yuan/kWh, machine power `120` W, failure loss rate `0.1`, profit multiplier
  `1.5`, and zero for labor, model processing, post-processing, packaging, and
  minimum price unless the user changes them.
- Default label settings are medium label size and QR payload mode `code`.
  Accepted label sizes are `small`, `medium`, and `large`; QR payload modes are
  plain filament code and `index.html#filament=<code>` hash link.
- Default restock threshold is 200g, with PLA/PETG treated as 200g and
  TPU/PA/PC treated as 150g in the generated restock guidance.
- Low stock means remaining weight is at or below 100g, or remaining capacity is
  at or below 20%.
- Stock level colors/states are based on remaining weight divided by
  quantity times per-spool weight: over capacity, empty, danger at 20% or below,
  warning above 20% through 50%, and good above 50%.
- Duplicate scoring uses brand up to 20 points, material up to 30 points, color
  up to 25 points, diameter up to 15 points, and name/notes keywords up to 10
  points. Levels are 90-100 `几乎确定重复`, 75-89 `高度疑似重复`, 60-74
  `同类耗材`, and below 60 hidden by default.
- Duplicate hard caps are part of the baseline: different base material, different
  diameter, or different color family are blocked; same base material with
  different modifiers is capped at 60, except PLA surface variants such as matte
  or silk are capped at 65; same color family with different shade/effect is
  capped at 75.
- Duplicate default filters show 75+ score results and hide ignored results.
- Scan parsing accepts `FIL-0001`, `index.html#filament=FIL-0001`, and
  `FIL-0001-01`, resolving the final form to main code `FIL-0001`.

### Current Local Modules

- Sheet import/export module: used for reading WPS/Excel files and exporting spreadsheet lists.
- ZIP module: used for WPS image extraction and complete ZIP backup/restore.
- QR code module: used to render local QR codes for labels without an external service.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can create, edit, filter, sort, and delete-to-trash an inventory record in under 3 minutes without leaving the page.
- **SC-002**: A user can import the project WPS sample table and see mapped preview rows before committing them.
- **SC-003**: At least 95% of records imported from a table containing the documented project columns preserve brand, material, color, remaining weight, quantity, position, notes, and image when the source data contains them.
- **SC-004**: A user can complete a queue task with two material lines and see both inventory records reduced plus matching consumption records created.
- **SC-005**: A user can export a full ZIP backup and restore it into a browser state with matching inventory, consumption, queue, settings, trash, and available images.
- **SC-006**: Duplicate detection explains every displayed candidate with score, level, field comparison, conflict hints, and merge advice.
- **SC-007**: Ignored duplicate pairs do not appear by default in duplicate results or inventory health duplicate issues.
- **SC-008**: A user can print labels for two selected inventory records and see both readable filament codes and QR areas on the printed label view.
- **SC-009**: Manual scan lookup resolves `FIL-0001`, `index.html#filament=FIL-0001`, and `FIL-0001-01` forms to the same main filament record when that code exists.
- **SC-010**: Existing critical workflows covered by this baseline pass their documented acceptance scenarios after any future change that touches them.

## Assumptions

- The baseline describes the current app state observed in README, page markup,
  script behavior, stylesheet, and vendored modules as of 2026-07-08.
- The app is intended for one user's local browser data; there is no server
  account, shared database, or cross-device synchronization.
- JSON backups are lightweight text-data backups and do not guarantee image
  restoration unless matching images still exist locally.
- ZIP backups are the intended complete migration path for text data plus images.
- Single-spool management is reserved for future work; current records represent
  aggregate inventory per grouped filament item.
- Camera scanning depends on browser capability and permission; manual input is
  the required fallback.
- This baseline is documentation-only and does not request any application code changes.
