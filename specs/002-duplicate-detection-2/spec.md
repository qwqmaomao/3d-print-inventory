# Feature Specification: 重复检测 2.0 与合并流程优化

**Feature Branch**: `main`

**Created**: 2026-07-08

**Status**: Draft

**Input**: User description: "增加“重复检测 2.0 + 合并流程优化”功能包。目标是减少当前耗材重复检测的误报，尤其是同品牌、同材料、同线径的常见耗材不应仅凭这些基础字段就被判定为高度疑似重复。系统应区分“同类耗材”和“疑似重复记录”，让用户更放心地忽略、记住误判或合并。范围包括弱化品牌/基础材料/线径、增加强证据、增加 hard cap、调整等级、显示自然语言解释、保留现有忽略/负向规则/合并预览/回收站/迁移能力，不修改业务数据格式，不引入后端，不依赖 CDN，不破坏现有功能。"

## Clarifications

### Session 2026-07-08

- Q: 强证据达到“疑似重复”的最低门槛是什么？ → A: 进入 75+ 需要至少 2 个独立强证据；如果是唯一性很强的证据，例如相同导入来源、图片或色号且无冲突，可按 1 个强证据放行。
- Q: 产品线应该怎么识别？ → A: 从“材料、名称、备注”中识别固定别名表：Basic、Matte/哑光、Silk/丝绸、HF、GF、CF、Support/支撑、Wood/木质、Plus、Pro；未知词不参与产品线判断。
- Q: 多个 hard cap 同时触发时，最终分数怎么定？ → A: 最终分数取原始分数和所有适用 hard cap 的最低值；同图片、同导入来源、同色号这类唯一性强证据可以解除“仅基础字段 55”上限，但不能解除颜色冲突、产品线冲突等冲突型上限。
- Q: 负向规则应该影响多大范围？ → A: 同时保留具体记录对忽略，并保存可复用的材料/颜色签名规则，例如 ABS|ABS-GF、湖蓝|深蓝；后续类似组合默认降权或隐藏。
- Q: 合并建议按钮什么时候出现、怎么写？ → A: 90+ 显示“建议合并预览”；75-89 显示“人工确认后合并预览”；60-74 显示弱化按钮“不建议合并，仍要查看预览”；低于 60 默认不显示。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 降低常见基础字段误判 (Priority: P1)

作为拥有大量常见品牌和常见材料的用户，我希望系统不要因为“拓竹/Bambu + PLA + 1.75mm”这类基础字段相同就把两条记录判定为高度疑似重复，这样我可以把同类耗材和真正重复记录分开处理。

**Why this priority**: 这是本功能包的核心痛点。若基础字段仍能单独推高分数，重复检测 2.0 就没有解决主要误报来源。

**Independent Test**: 创建或准备多条同品牌、同基础材料、同线径但颜色、产品线、批次、位置或图片不同的耗材记录，运行重复检测并查看等级。

**Acceptance Scenarios**:

1. **Given** 两条记录同品牌、同基础材料、同线径，但没有颜色完全一致、色号、产品线、批次、购买日期、店铺、位置、图片、导入来源或名称/备注关键标识等强证据，**When** 用户运行重复检测，**Then** 结果最高只能作为“同类耗材”或被隐藏，不得进入“疑似重复”或“几乎确定重复”。
2. **Given** 两条记录只是同品牌、同材料、同线径，**When** 用户查看重复检测卡片，**Then** 卡片必须说明“基础字段常见，只作为弱证据，不建议合并”。
3. **Given** 一批拓竹/Bambu PLA 1.75mm 记录颜色或产品线不同，**When** 用户运行重复检测，**Then** 系统不得批量显示为高风险重复项。

---

### User Story 2 - 使用强证据提升真正重复记录 (Priority: P1)

作为整理库存的用户，我希望系统在存在强证据时再提升重复等级，例如颜色完全一致、色号一致、产品线一致、批次或购买信息接近、位置序列号接近、图片或导入来源一致、名称/备注关键标识一致，这样真正重复记录仍然能被发现。

**Why this priority**: 降低误报不能导致漏掉真实重复。强证据机制让系统把“相同基础属性”与“疑似同一条记录”区分开。

**Independent Test**: 准备两组记录：一组只有基础字段相同，一组基础字段相同且具备至少两项强证据；比较两组得分、等级和解释。

**Acceptance Scenarios**:

1. **Given** 两条记录基础字段相同且颜色完全一致、产品线一致、名称/备注关键标识一致，**When** 用户运行重复检测，**Then** 系统可以提升为“疑似重复”或“几乎确定重复”，并列出每项强证据。
2. **Given** 两条记录基础字段相同且批次、购买日期、店铺或位置序列号接近，**When** 用户查看卡片，**Then** 这些字段应被标注为强证据或辅助强证据，而不是隐藏在普通相似项里。
3. **Given** 两条记录图片或导入来源一致，**When** 用户运行重复检测，**Then** 系统应把该一致性作为强证据展示。

---

### User Story 3 - 明确 hard cap 和重复等级 (Priority: P1)

作为用户，我希望系统用明确的 hard cap 约束重复等级，避免分数被基础字段和轻微颜色相似拉得过高。

**Why this priority**: hard cap 是防止误报重新出现的核心安全阀。

**Independent Test**: 使用同品牌同材料同线径、颜色大类不同、同色系不同色号、PLA Basic 与 PLA Matte/Silk、无强证据等案例运行重复检测。

**Acceptance Scenarios**:

1. **Given** 两条记录仅满足同品牌、同材料、同线径，**When** 系统评分，**Then** 总分最高为 55。
2. **Given** 两条记录颜色大类不同，**When** 系统评分，**Then** 总分最高为 50。
3. **Given** 两条记录同色系但色号或效果不同，**When** 系统评分，**Then** 总分最高为 70。
4. **Given** 两条记录为 PLA Basic 与 PLA Matte 或 PLA Silk，**When** 系统评分，**Then** 总分最高为 65。
5. **Given** 两条记录没有任何强证据，**When** 系统评分，**Then** 不得进入 75 分以上等级。
6. **Given** 最终分数为 90-100、75-89、60-74 或低于 60，**When** 系统展示结果，**Then** 等级分别为“几乎确定重复”、“疑似重复”、“同类耗材，不建议合并”和默认隐藏。

---

### User Story 4 - 解释为什么相似和为什么不建议合并 (Priority: P2)

作为用户，我希望重复检测卡片清楚说明为什么两条记录相似，也说明为什么系统不建议合并，这样我能快速判断是忽略、记住误判，还是继续合并预览。

**Why this priority**: 用户需要理解分数来源，尤其是在系统从“高度疑似”降级为“同类耗材”时。

**Independent Test**: 查看基础字段相同但无强证据的结果、同色系不同色号结果、同基材不同产品线结果和高分强证据结果。

**Acceptance Scenarios**:

1. **Given** 两条记录基础字段相同但无强证据，**When** 用户打开重复卡片，**Then** 卡片显示“为什么相似”和“为什么不建议合并”两类解释。
2. **Given** hard cap 被触发，**When** 用户查看卡片，**Then** 卡片说明触发的上限规则和最终等级。
3. **Given** 存在强证据，**When** 用户查看卡片，**Then** 卡片以自然语言列出强证据，而不是只显示总分。

---

### User Story 5 - 保留并强化安全合并流程 (Priority: P2)

作为整理重复记录的用户，我希望现有忽略、记住误判、负向规则、合并预览、回收站、消耗记录迁移和队列引用迁移继续可用，并在低置信度结果中更明确地提示不建议合并。

**Why this priority**: 重复检测 2.0 不能破坏现有数据安全能力；合并是高风险操作，必须保持可预览、可恢复、可追踪。

**Independent Test**: 对“同类耗材”“疑似重复”和“几乎确定重复”三类结果分别执行忽略、记住误判和合并预览流程。

**Acceptance Scenarios**:

1. **Given** 用户点击“忽略这组”，**When** 再次扫描，**Then** 该组默认隐藏，且库存体检中默认不再显示该重复问题。
2. **Given** 用户点击“不是重复，记住这个判断”，**When** 再次扫描类似材料或颜色组合，**Then** 系统应根据具体记录对和材料/颜色签名负向规则降低或排除类似误判，并在库存体检中默认不再作为严重重复问题显示。
3. **Given** 用户对 60-74 分“同类耗材”点击弱化的“不建议合并，仍要查看预览”操作，**When** 合并预览打开，**Then** 顶部必须提示“不建议合并”，且用户仍可取消。
4. **Given** 用户确认合并，**When** 合并完成，**Then** 被合并记录进入回收站，消耗记录和队列引用迁移到保留记录。

---

### User Story 6 - 保护现有库存和周边功能 (Priority: P2)

作为长期使用该本地库存网页的用户，我希望重复检测 2.0 不改变业务数据格式、不引入后端或 CDN，并且不破坏库存、导入导出、备份、标签、二维码、扫码、体检、盘点和打印队列。

**Why this priority**: 宪章要求现有功能稳定优先；重复检测只是库存工具的一部分，不能以牺牲其他核心流程为代价。

**Independent Test**: 在启用重复检测 2.0 后执行 v1.0 基线 quickstart 中与库存、导入导出、备份、标签、扫码、体检、盘点和队列相关的回归场景。

**Acceptance Scenarios**:

1. **Given** 已有库存数据和备份文件，**When** 用户使用重复检测 2.0，**Then** 现有记录无需迁移即可继续读取。
2. **Given** 用户执行导入、导出、ZIP 备份、标签打印、扫码查找、盘点或队列完成，**When** 重复检测 2.0 已存在，**Then** 这些流程仍按 v1.0 基线验收标准工作。
3. **Given** 无后端、无网络或无法访问外部 CDN，**When** 用户打开本地页面，**Then** 重复检测 2.0 仍可使用已有本地能力。

### Edge Cases

- 大量耗材具有相同品牌、基础材料和线径时，系统必须优先显示“同类耗材”或隐藏低置信度结果，避免高风险误报刷屏。
- 颜色名称只有同一个大类但色号、深浅、透明、丝绸、哑光、金属等效果不同，应触发同色系不同色号/效果上限。
- 颜色大类不同，即使品牌、基础材料和线径相同，也不得显示为高置信度重复。
- 产品线不同，例如 Basic、Matte、Silk、HF、GF、CF、Support、Wood、Plus、Pro 等，不得仅凭基础材料相同而建议合并。
- 产品线只能从材料、名称和备注字段中的固定别名表识别；未知词或无法识别的系列词不得被模糊猜测为产品线匹配。
- 缺少颜色、批次、购买日期、店铺、位置或图片时，系统不得把缺失字段当作强证据。
- 图片或导入来源一致只能作为强证据之一；若其他关键字段明显冲突，必须显示冲突说明。
- 用户已忽略或记住为非重复的组合，默认不得继续作为重复问题打扰用户。
- 负向规则既包含具体记录对，也包含可复用的材料/颜色签名组合；库存体检必须复用这些规则，避免已记住的误判在体检中重新出现。
- 合并预览中字段冲突必须保留人工选择或清晰提示，不得静默覆盖。
- 任何重复检测失败、字段缺失或证据不足的情况，都不能阻止库存列表、备份、导入导出、标签、扫码、盘点或队列功能使用。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST treat brand, base material, and diameter as candidate recall fields and weak evidence, not as strong evidence by themselves.
- **FR-002**: System MUST prevent brand, base material, and diameter alone from raising a pair to 75 points or above.
- **FR-003**: System MUST define strong evidence categories including exact color match, color code or color number match, product line match, close batch or purchase information, close storage position sequence, same image or import source, and matching key identifiers in name or notes.
- **FR-003a**: System MUST identify product line only from the material, name, and notes fields using a fixed alias list: Basic, Matte/哑光, Silk/丝绸, HF, GF, CF, Support/支撑, Wood/木质, Plus, and Pro. Unknown words MUST NOT be fuzzy-matched into product line evidence.
- **FR-004**: System MUST show which strong evidence categories contributed to the result for every displayed duplicate candidate.
- **FR-005**: System MUST cap pairs with only same brand, same material, and same diameter at 55.
- **FR-005a**: System MUST compute the final duplicate score as the minimum of the raw score and all applicable hard caps. Uniqueness-heavy strong evidence such as same image, same import source, or same color code MAY remove the weak-evidence-only 55 cap, but MUST NOT remove conflict caps such as color-family conflict, same color family with different shade/effect, or different product line.
- **FR-006**: System MUST cap pairs with different color families at 50.
- **FR-007**: System MUST cap pairs with same color family but different shade, color number, or effect at 70.
- **FR-008**: System MUST cap PLA Basic versus PLA Matte or PLA Silk at 65.
- **FR-009**: System MUST prevent pairs from entering the 75-89 or 90-100 levels unless they have at least two independent strong evidence categories, or one uniqueness-heavy strong evidence category such as same import source, same image, or same color code with no conflicting fields.
- **FR-010**: System MUST use the levels 90-100 “几乎确定重复”, 75-89 “疑似重复”, 60-74 “同类耗材，不建议合并”, and below 60 hidden by default.
- **FR-011**: System MUST show a natural-language “为什么相似” explanation for every displayed candidate.
- **FR-012**: System MUST show a natural-language “为什么不建议合并” explanation when a hard cap, conflict, weak evidence only, or low confidence condition applies.
- **FR-013**: System MUST continue to support ignoring a duplicate pair.
- **FR-014**: System MUST continue to support “不是重复，记住这个判断” and negative rules for future scans.
- **FR-014a**: System MUST store remembered non-duplicate judgments both as the concrete record pair and as reusable material/color signature rules when such signatures can be derived. Duplicate detection and inventory health checks MUST apply these rules by default to lower or hide similar false positives.
- **FR-015**: System MUST continue to support merge preview before any merge operation.
- **FR-016**: System MUST keep merged-away records recoverable through the existing trash flow.
- **FR-017**: System MUST preserve consumption record migration and queue reference migration during merge.
- **FR-018**: System MUST make merge actions for 60-74 “同类耗材” results visually and textually weaker than merge actions for higher-confidence results.
- **FR-018a**: System MUST use confidence-specific merge entry labels: 90-100 “建议合并预览”, 75-89 “人工确认后合并预览”, and 60-74 “不建议合并，仍要查看预览”. Results below 60 remain hidden by default and do not show a merge entry unless the user explicitly reveals hidden results.
- **FR-019**: System MUST not change the business data format for inventory, consumption, queue, image, backup, label, or scan data.
- **FR-020**: System MUST not require a backend, login, external network, or CDN.
- **FR-021**: System MUST preserve current inventory, import/export, backup, labels, QR code, scan, quality check, audit, and print queue workflows.
- **FR-022**: System MUST keep existing ignored-pair behavior aligned with inventory health checks, so ignored duplicate pairs remain hidden by default in both places.
- **FR-023**: System MUST display conflict hints when evidence is mixed, such as same image but different color family, or same brand/material/diameter but different product line.
- **FR-024**: System MUST allow users to proceed to merge preview for non-hidden results, but must clearly warn when the result is not recommended for merge.

### Key Entities *(include if feature involves data)*

- **Duplicate Candidate**: A pair of inventory records being evaluated for similarity. It includes the two record references, score, level, recommendation, evidence summary, hard cap state, conflict hints, and ignored state.
- **Weak Evidence**: Common fields that help find candidate pairs but do not prove duplication alone, including brand, base material, and diameter.
- **Strong Evidence**: Fields or signals that meaningfully indicate the same physical or imported record, including exact color, color code/number, product line, batch, purchase date, shop, storage position sequence, image/import source, and key identifiers in name or notes. Reaching 75+ normally requires at least two independent strong evidence categories; a uniqueness-heavy signal such as same image, same import source, or same color code may satisfy the threshold alone only when no conflict is present.
- **Product Line Signature**: A derived comparison value from material, name, and notes using only the fixed alias list Basic, Matte/哑光, Silk/丝绸, HF, GF, CF, Support/支撑, Wood/木质, Plus, and Pro. It can provide strong evidence when matching, and a conflict/hard cap when different, but unknown text is treated as unknown rather than guessed.
- **Hard Cap Rule**: A rule that limits the maximum score and confidence level when conflicts or weak-only evidence are present. When multiple hard caps apply, the final score uses the lowest applicable cap. Uniqueness-heavy evidence may remove only the weak-evidence-only cap, not conflict caps.
- **Explanation Block**: User-facing text that separates why records are similar from why merge is or is not recommended.
- **Negative Rule**: A remembered non-duplicate judgment that suppresses similar false positives in later scans. It includes the concrete record pair and, when derivable, reusable material/color signature combinations such as ABS|ABS-GF or 湖蓝|深蓝. Duplicate detection and inventory health checks apply these rules by default.
- **Merge Preview**: A review step before merging that shows final field choices, image strategy, record migration, and trash behavior.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a test set of at least 20 common same-brand, same-material, same-diameter but different-color/product-line records, 0 pairs are classified as 75+ unless at least two independent strong evidence categories are present, or one uniqueness-heavy strong evidence category is present with no conflicting fields.
- **SC-002**: A pair with only same brand, same material, and same diameter never scores above 55.
- **SC-003**: A same-color-family but different shade/effect pair never scores above 70.
- **SC-004**: A color-family conflict pair never scores above 50.
- **SC-005**: PLA Basic versus PLA Matte or PLA Silk never scores above 65 unless a future specification explicitly changes the cap.
- **SC-006**: 100% of displayed duplicate cards include both evidence explanation and merge recommendation text.
- **SC-007**: 100% of 60-74 results display the weakened merge entry “不建议合并，仍要查看预览” or equivalent warning language before merge preview.
- **SC-008**: Existing ignore, remember-not-duplicate, merge preview, trash recovery, consumption migration, and queue migration flows continue to pass their v1.0 baseline acceptance scenarios.
- **SC-008a**: After a user remembers a non-duplicate judgment for a material or color combination, duplicate detection and inventory health checks no longer show similar combinations as serious duplicate problems by default.
- **SC-009**: Inventory, import/export, ZIP backup, JSON backup, labels, QR, scan, inventory health, audit, and print queue baseline workflows continue to pass after duplicate detection 2.0 changes.
- **SC-010**: Users can distinguish “同类耗材” from “疑似重复” from “几乎确定重复” without inspecting raw score details.

## Assumptions

- The feature updates duplicate detection behavior and merge guidance only; it does not introduce a new inventory schema.
- Existing LocalStorage keys and IndexedDB image storage remain unchanged.
- Strong evidence is evaluated from fields already present in current records or already derivable from current import/image state.
- Strong evidence categories must be independent for the 75+ threshold; duplicate views of the same underlying signal must not be counted twice.
- Product line detection uses the fixed alias list only and does not require migrating old inventory records.
- Conflict hard caps have priority over additive scoring; strong evidence must be shown in the explanation even when it cannot raise the final score past an applicable conflict cap.
- Missing optional fields are treated as unknown, not as matching evidence.
- “导入来源一致” refers to source information that can be derived or associated with existing import context without requiring a backend.
- The default duplicate result list continues to hide scores below 60 and hidden/ignored results unless the user chooses otherwise.
- The feature remains a local static-page workflow and must be validated against the v1.0 baseline regression set.
