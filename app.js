const STORAGE_KEY = "filament_inventory_v1";
const CONSUMPTION_KEY = "filament_consumption_v1";
const QUEUE_KEY = "filament_queue_v1";
const COST_SETTINGS_KEY = "filament_cost_settings_v1";
const TRASH_KEY = "filament_trash_v1";
const DUPLICATE_IGNORES_KEY = "filament_duplicate_ignores_v1";
const DUPLICATE_NEGATIVE_RULES_KEY = "filament_duplicate_negative_rules_v1";
const RESTOCK_SETTINGS_KEY = "filament_restock_settings_v1";
const QUALITY_IGNORES_KEY = "filament_quality_ignores_v1";
const LABEL_SETTINGS_KEY = "filament_label_settings_v1";
const IMAGE_DB_NAME = "filament_inventory_assets_v1";
const IMAGE_STORE = "images";

const costDefaults = {
  wearRate: 2,
  electricityRate: 0.6,
  powerWatts: 120,
  laborFee: 0,
  modelFee: 0,
  postProcessFee: 0,
  packagingFee: 0,
  failureRate: 0.1,
  profitMultiplier: 1.5,
  minimumPrice: 0
};

const queueStatuses = ["待打印", "准备中", "打印中", "暂停", "已完成", "失败", "取消"];
const failureReasons = ["翘边", "堵头", "断料", "模型问题", "支撑失败", "停电", "手动取消", "其他"];
const duplicateDefaults = { minScore: 75, showIgnored: false };
const labelDefaults = { size: "medium", qrMode: "code" };

const fieldAliases = {
  name: ["名称", "耗材名称", "品名", "产品名", "序列"],
  brand: ["品牌", "厂家", "制造商", "厂商"],
  material: ["材料", "材质", "类型", "耗材类型"],
  colorName: ["颜色", "色号", "颜色名称", "颜色名"],
  colorHex: ["颜色值", "色值", "HEX", "hex"],
  diameter: ["线径", "直径", "耗材直径"],
  totalWeight: ["总重量", "净重", "规格重量", "重量", "总克重"],
  remainingWeight: ["剩余重量", "余量", "库存重量", "剩余", "剩余克重"],
  quantity: ["卷数", "数量"],
  weightQuantity: ["重量/卷数", "重量卷数", "规格"],
  imageFormula: ["备注图", "图片", "图"],
  status: ["状态", "使用状态"],
  location: ["位置", "存放位置", "收纳位置", "位置序列号"],
  purchaseDate: ["购买日期", "采购日期", "入库日期", "日期"],
  purchasePrice: ["购买价格", "价格", "单价", "金额"],
  shop: ["店铺", "平台", "购买平台", "购买店铺"],
  batch: ["批次", "编号", "批次/编号", "LOT", "lot"],
  notes: ["备注", "说明", "特性", "打印参数"]
};

const state = {
  items: loadArray(STORAGE_KEY).map(normalizeItem),
  consumption: loadArray(CONSUMPTION_KEY).map(normalizeConsumption),
  queue: loadArray(QUEUE_KEY).map(normalizeQueue),
  costSettings: loadObject(COST_SETTINGS_KEY, costDefaults),
  trash: loadArray(TRASH_KEY).map(normalizeTrashEntry),
  duplicateIgnores: loadArray(DUPLICATE_IGNORES_KEY),
  duplicateNegativeRules: loadArray(DUPLICATE_NEGATIVE_RULES_KEY),
  qualityIgnores: loadArray(QUALITY_IGNORES_KEY),
  restockSettings: loadObject(RESTOCK_SETTINGS_KEY, { defaultThreshold: 200 }),
  duplicateFilters: { ...duplicateDefaults },
  labelSettings: loadObject(LABEL_SETTINGS_KEY, labelDefaults),
  selectedLabelIds: new Set(),
  highlightedItemId: "",
  filters: { search: "", material: "", brand: "", status: "", location: "" },
  queueFilter: "",
  sort: { key: "updatedAt", direction: "desc" },
  activeTab: "inventory",
  pendingImport: []
};

ensureFilamentCodes();
if (state.items.length) persistAll();

if (!state.items.length) {
  state.items.push(normalizeItem({
    name: "PLA 丝绸银",
    brand: "示例品牌",
    material: "PLA",
    colorName: "银色",
    diameter: 1.75,
    quantity: 1,
    totalWeight: 1000,
    remainingWeight: 780,
    purchasePrice: 59,
    status: "在用",
    location: "干燥箱 A",
    notes: "示例数据，可删除。"
  }));
  ensureFilamentCodes();
  persistAll();
}

const els = {};
let imageCache = new Map();
let transientImageUrls = new Set();
let scanStream = null;
let scanTimer = null;

document.addEventListener("DOMContentLoaded", async () => {
  cacheElements();
  bindEvents();
  await hydrateImages();
  render();
});

function cacheElements() {
  [
    "totalItems", "totalQuantity", "totalRemaining", "riskCount", "pendingQueueCount",
    "xlsxInput", "jsonInput", "zipInput", "exportJsonBtn", "exportZipBtn", "addItemBtn", "importPanel", "importSummary",
    "importPreviewBody", "cancelImportBtn", "confirmImportBtn", "searchInput", "materialFilter",
    "brandFilter", "statusFilter", "locationFilter", "exportFilteredBtn", "batchPrintLabelsBtn",
    "selectAllInventoryInput", "inventoryBody", "emptyState",
    "consumptionBody", "addConsumptionBtn", "calcItemSelect", "calcGramsInput", "calcHoursInput",
    "wearRateInput", "electricityRateInput", "powerWattsInput", "laborFeeInput", "modelFeeInput",
    "postProcessFeeInput", "packagingFeeInput", "failureRateInput", "profitMultiplierInput",
    "minimumPriceInput", "copyQuoteBtn", "costBreakdown", "queueStatusFilter", "queueBody",
    "addQueueBtn", "restockBody", "copyRestockBtn", "exportRestockBtn", "duplicateMinScoreFilter",
    "duplicateIgnoredFilter", "duplicatesBody", "scanDuplicatesBtn", "mergeDialog", "mergeForm",
    "mergeDialogTitle", "mergeSummary", "mergePreviewBody", "mergeImageChoice", "mergeSourceIds",
    "qualityBody", "refreshQualityBtn", "showIgnoredQualityInput", "auditBody", "saveAuditBtn",
    "labelSizeSelect", "qrModeSelect", "labelsBody", "printLabelsBtn",
    "startScanBtn", "stopScanBtn", "scanVideo", "scanStatus", "scanManualInput", "scanManualBtn",
    "scanActionDialog", "scanActionForm", "scanActionTitle", "scanActionItemId", "scanActionSummary",
    "scanCustomConsumeInput", "scanCustomConsumeBtn", "scanLocationInput", "scanUpdateLocationBtn",
    "scanViewDetailBtn", "scanMarkOpenedBtn", "scanAuditBtn", "scanAddQueueBtn",
    "trashBody", "clearTrashBtn", "toast", "nameOptions", "brandOptions", "materialOptions", "colorOptions",
    "locationOptions", "itemDialog", "itemForm", "itemDialogTitle", "itemId", "nameInput",
    "brandInput", "materialInput", "colorNameInput", "colorHexInput", "diameterInput",
    "quantityInput", "spoolWeightInput", "totalWeightInput", "remainingWeightInput", "purchasePriceInput",
    "unitCostInput", "itemStatusInput", "locationInput", "purchaseDateInput", "shopInput",
    "batchInput", "openedInput", "openedAtInput", "lastDryAtInput", "dryTempInput", "dryHoursInput",
    "moistureInput", "dryStatusInput", "notesInput", "itemImageInput", "itemImagePreview", "clearItemImageBtn", "consumptionDialog", "consumptionForm", "consumeProjectInput",
    "consumeItemSelect", "consumeGramsInput", "consumeHoursInput", "consumeNotesInput",
    "queueDialog", "queueForm", "queueDialogTitle", "queueId", "queueNameInput",
    "queueHoursInput", "queueStatusInput", "queueNotesInput", "queueStockHint",
    "queueMaterialsBody", "addQueueMaterialBtn"
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function bindEvents() {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
  });
  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
  });

  els.addItemBtn.addEventListener("click", () => openItemDialog());
  els.itemForm.addEventListener("submit", saveItemFromForm);
  els.purchasePriceInput.addEventListener("input", updateUnitCostPreview);
  els.quantityInput.addEventListener("input", updateCapacityPreview);
  els.spoolWeightInput.addEventListener("input", updateCapacityPreview);
  els.totalWeightInput.addEventListener("input", updateUnitCostPreview);
  els.itemImageInput.addEventListener("change", previewSelectedItemImage);
  els.clearItemImageBtn.addEventListener("click", clearSelectedItemImage);

  els.searchInput.addEventListener("input", (event) => updateFilter("search", event.target.value));
  els.materialFilter.addEventListener("change", (event) => updateFilter("material", event.target.value));
  els.brandFilter.addEventListener("change", (event) => updateFilter("brand", event.target.value));
  els.statusFilter.addEventListener("change", (event) => updateFilter("status", event.target.value));
  els.locationFilter.addEventListener("change", (event) => updateFilter("location", event.target.value));

  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      state.sort.direction = state.sort.key === key && state.sort.direction === "asc" ? "desc" : "asc";
      state.sort.key = key;
      renderInventoryTable();
    });
  });

  els.xlsxInput.addEventListener("change", handleXlsxInput);
  els.jsonInput.addEventListener("change", handleJsonInput);
  els.zipInput.addEventListener("change", handleZipInput);
  els.exportJsonBtn.addEventListener("click", exportJson);
  els.exportZipBtn.addEventListener("click", exportZipBackup);
  els.exportFilteredBtn.addEventListener("click", exportFilteredInventory);
  els.batchPrintLabelsBtn.addEventListener("click", printSelectedLabels);
  els.selectAllInventoryInput.addEventListener("change", toggleAllInventorySelection);
  els.cancelImportBtn.addEventListener("click", clearImportPreview);
  els.confirmImportBtn.addEventListener("click", confirmImport);

  els.addConsumptionBtn.addEventListener("click", () => openConsumptionDialog());
  els.consumptionForm.addEventListener("submit", saveConsumptionFromForm);

  ["calcItemSelect", "calcGramsInput", "calcHoursInput", "wearRateInput", "electricityRateInput", "powerWattsInput",
    "laborFeeInput", "modelFeeInput", "postProcessFeeInput", "packagingFeeInput", "failureRateInput",
    "profitMultiplierInput", "minimumPriceInput"].forEach((id) => {
    els[id].addEventListener("input", () => {
      saveCostSettingsFromInputs();
      renderCostBreakdown();
    });
    els[id].addEventListener("change", () => {
      saveCostSettingsFromInputs();
      renderCostBreakdown();
    });
  });
  els.copyQuoteBtn.addEventListener("click", copyQuoteText);

  els.addQueueBtn.addEventListener("click", () => openQueueDialog());
  els.queueForm.addEventListener("submit", saveQueueFromForm);
  els.addQueueMaterialBtn.addEventListener("click", () => addQueueMaterialRow());
  els.queueStatusFilter.addEventListener("change", (event) => {
    state.queueFilter = event.target.value;
    renderQueueTable();
  });
  els.copyRestockBtn.addEventListener("click", copyRestockText);
  els.exportRestockBtn.addEventListener("click", exportRestockXlsx);
  els.scanDuplicatesBtn.addEventListener("click", renderDuplicates);
  els.duplicateMinScoreFilter.addEventListener("change", () => {
    state.duplicateFilters.minScore = numberOrZero(els.duplicateMinScoreFilter.value) || 60;
    renderDuplicates();
  });
  els.duplicateIgnoredFilter.addEventListener("change", () => {
    state.duplicateFilters.showIgnored = els.duplicateIgnoredFilter.value === "show";
    renderDuplicates();
  });
  els.mergeForm.addEventListener("submit", confirmMergeFromPreview);
  els.refreshQualityBtn.addEventListener("click", renderQualityTable);
  els.showIgnoredQualityInput.addEventListener("change", renderQualityTable);
  els.saveAuditBtn.addEventListener("click", saveAudit);
  els.labelSizeSelect.addEventListener("change", saveLabelSettingsFromInputs);
  els.qrModeSelect.addEventListener("change", saveLabelSettingsFromInputs);
  els.printLabelsBtn.addEventListener("click", () => window.print());
  els.startScanBtn.addEventListener("click", startScanner);
  els.stopScanBtn.addEventListener("click", stopScanner);
  els.scanManualBtn.addEventListener("click", () => findScannedCode(els.scanManualInput.value));
  els.scanManualInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") findScannedCode(els.scanManualInput.value);
  });
  els.scanActionForm.addEventListener("submit", (event) => event.preventDefault());
  document.querySelectorAll("[data-scan-consume]").forEach((button) => {
    button.addEventListener("click", () => quickConsumeScannedItem(getScanActionItem(), numberOrZero(button.dataset.scanConsume)));
  });
  els.scanCustomConsumeBtn.addEventListener("click", () => quickConsumeScannedItem(getScanActionItem(), numberOrZero(els.scanCustomConsumeInput.value)));
  els.scanUpdateLocationBtn.addEventListener("click", updateScannedItemLocation);
  els.scanViewDetailBtn.addEventListener("click", () => openItemDialog(getScanActionItem()));
  els.scanMarkOpenedBtn.addEventListener("click", markScannedItemOpened);
  els.scanAuditBtn.addEventListener("click", () => { els.scanActionDialog.close(); switchTab("audit"); });
  els.scanAddQueueBtn.addEventListener("click", addScannedItemToQueue);
  els.clearTrashBtn.addEventListener("click", clearTrash);
}

function render() {
  renderStats();
  renderDatalists();
  renderFilters();
  renderSelects();
  renderInventoryTable();
  renderConsumptionTable();
  renderCostInputs();
  renderCostBreakdown();
  renderQueueTable();
  renderRestockTable();
  renderDuplicates();
  renderQualityTable();
  renderAuditTable();
  renderLabels();
  renderTrashTable();
}

function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll("[data-tab]").forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === `${tab}View`));
}

function renderStats() {
  const riskItems = state.items.filter(isLowStock).length;
  const riskyQueue = state.queue.filter((task) => queueRisk(task).level === "danger").length;
  els.totalItems.textContent = state.items.length;
  els.totalQuantity.textContent = formatNumber(state.items.reduce((sum, item) => sum + numberOrZero(item.quantity), 0));
  els.totalRemaining.textContent = `${formatNumber(state.items.reduce((sum, item) => sum + numberOrZero(item.remainingWeight), 0))} g`;
  els.riskCount.textContent = riskItems + riskyQueue;
  els.pendingQueueCount.textContent = state.queue.filter((task) => ["待打印", "准备中", "打印中", "暂停"].includes(task.status)).length;
}

function renderDatalists() {
  fillDatalist(els.nameOptions, uniqueValues("name"));
  fillDatalist(els.brandOptions, uniqueValues("brand"));
  fillDatalist(els.materialOptions, uniqueValues("material"));
  fillDatalist(els.colorOptions, uniqueValues("colorName"));
  fillDatalist(els.locationOptions, uniqueValues("location"));
}

function renderFilters() {
  fillSelect(els.materialFilter, "全部材料", uniqueValues("material"), state.filters.material);
  fillSelect(els.brandFilter, "全部品牌", uniqueValues("brand"), state.filters.brand);
  fillSelect(els.locationFilter, "全部位置", uniqueValues("location"), state.filters.location);
}

function renderSelects() {
  const options = state.items.map((item) => `<option value="${item.id}">${escapeHtml(itemLabel(item))}</option>`).join("");
  const placeholder = state.items.length ? "" : `<option value="">暂无耗材</option>`;
  [els.calcItemSelect, els.consumeItemSelect].forEach((select) => {
    const oldValue = select.value;
    select.innerHTML = placeholder + options;
    if (state.items.some((item) => item.id === oldValue)) select.value = oldValue;
  });
}

function renderInventoryTable() {
  const rows = getVisibleItems();
  els.inventoryBody.innerHTML = rows.map(renderInventoryRow).join("");
  els.emptyState.classList.toggle("visible", rows.length === 0);
  els.inventoryBody.querySelectorAll("[data-inline-field]").forEach((control) => {
    control.addEventListener("change", () => updateInlineItem(control));
  });
  els.inventoryBody.querySelectorAll("[data-label-select]").forEach((control) => {
    control.addEventListener("change", () => updateLabelSelection(control));
  });
  els.inventoryBody.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => openItemDialog(state.items.find((item) => item.id === button.dataset.edit)));
  });
  els.inventoryBody.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteItem(button.dataset.delete));
  });
  syncSelectAllInventory();
}

function renderInventoryRow(item) {
  const percent = getRemainingPercent(item);
  const low = isLowStock(item);
  const stockLevel = getStockLevel(item);
  const color = item.colorHex || guessColor(item.colorName);
  const thumb = renderThumb(item.imageKey);
  const unitCost = item.unitCost || calcUnitCost(item);
  const capacity = getTotalCapacity(item);
  const overflow = stockLevel === "overflow";
  const dryWarning = getDryWarning(item);
  return `
    <tr id="item-${escapeAttribute(item.id)}" class="${low ? "low-stock" : ""} ${overflow ? "stock-overflow" : ""} ${dryWarning ? "dry-risk" : ""} ${state.highlightedItemId === item.id ? "highlight-row" : ""}">
      <td><input type="checkbox" data-label-select="${item.id}" ${state.selectedLabelIds.has(item.id) ? "checked" : ""} aria-label="选择打印标签"></td>
      <td>${thumb}</td>
      <td>
        ${renderEditableSelect(item, "brand", uniqueValues("brand"), "品牌")}
        <div class="muted">${escapeHtml(item.filamentCode || "")} ${escapeHtml(item.name || item.batch || "-")}</div>
        ${dryWarning ? `<div class="tag warn">${escapeHtml(dryWarning)}</div>` : ""}
      </td>
      <td>${renderEditableSelect(item, "material", uniqueValues("material"), "材料", "compact")}</td>
      <td>
        <span class="color-chip">
          <span class="swatch" style="--chip:${escapeHtml(color)}"></span>
          ${renderEditableSelect(item, "colorName", uniqueValues("colorName"), "颜色", "compact")}
        </span>
      </td>
      <td><input class="inline-input tiny" data-item-id="${item.id}" data-inline-field="quantity" type="number" min="1" step="1" value="${escapeAttribute(item.quantity || 1)}" aria-label="卷数"> 卷</td>
      <td>
        <div class="stock-meter">
          <span class="${low || overflow ? "warn-text" : ""}">
            <input class="inline-input tiny" data-item-id="${item.id}" data-inline-field="remainingWeight" type="number" min="0" step="1" value="${escapeAttribute(item.remainingWeight)}" aria-label="剩余重量">
            / ${formatNumber(capacity)} g (${percent}%)
            ${overflow ? `<span class="tag overflow">超出容量</span>` : ""}
          </span>
          <span class="meter-track ${stockLevel}"><span class="meter-fill ${stockLevel}" style="--pct:${Math.min(percent, 100)}%"></span></span>
          <span class="muted">每卷 ${formatNumber(item.spoolWeight || 1000)} g</span>
        </div>
      </td>
      <td>${unitCost ? `￥${formatMoney(unitCost)}/g` : "-"}</td>
      <td>
        <select class="inline-input compact" data-item-id="${item.id}" data-inline-field="status" aria-label="状态">
          ${["在用", "未开封", "备用", "已用完"].map((status) => `<option value="${status}" ${item.status === status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </td>
      <td>${renderEditableSelect(item, "location", uniqueValues("location"), "位置", "compact")}</td>
      <td>
        <div class="row-actions">
          <button class="small-button" type="button" data-edit="${item.id}">编辑</button>
          <button class="small-button danger" type="button" data-delete="${item.id}">删除</button>
        </div>
      </td>
    </tr>
  `;
}

function renderEditableSelect(item, field, values, label, sizeClass = "") {
  const current = cleanText(item[field]);
  const options = [...new Set([current, ...values].filter(Boolean))]
    .map((value) => `<option value="${escapeAttribute(value)}" ${value === current ? "selected" : ""}>${escapeHtml(value)}</option>`)
    .join("");
  return `
    <select class="inline-input ${sizeClass}" data-item-id="${item.id}" data-inline-field="${field}" aria-label="${label}">
      ${options}
      <option value="__new__">+ 新值...</option>
    </select>
  `;
}

function updateInlineItem(control) {
  const item = getItem(control.dataset.itemId);
  const field = control.dataset.inlineField;
  if (!item || !field) return;
  const numericFields = new Set(["quantity", "remainingWeight"]);
  let value = control.value;
  if (value === "__new__") {
    const label = control.getAttribute("aria-label") || "新值";
    value = window.prompt(`请输入${label}`) || item[field] || "";
    control.value = value;
  }
  item[field] = numericFields.has(field) ? Math.max(field === "quantity" ? 1 : 0, numberOrZero(value)) : cleanText(value);
  if (field === "colorName") item.colorHex = guessColor(item.colorName);
  item.totalWeight = getTotalCapacity(item);
  item.unitCost = calcUnitCost(item);
  item.status = numberOrZero(item.remainingWeight) <= 0 ? "已用完" : item.status;
  item.updatedAt = new Date().toISOString();
  persistAll();
  render();
  flashSavedControl(item.id, field);
}

function flashSavedControl(itemId, field) {
  const control = [...els.inventoryBody.querySelectorAll("[data-inline-field]")]
    .find((entry) => entry.dataset.itemId === itemId && entry.dataset.inlineField === field);
  if (!control) return;
  control.classList.add("saved");
  window.setTimeout(() => control.classList.remove("saved"), 900);
}

function renderConsumptionTable() {
  const rows = [...state.consumption].sort((a, b) => `${b.date}`.localeCompare(`${a.date}`));
  els.consumptionBody.innerHTML = rows.map((record) => {
    const item = getItem(record.itemId);
    return `
      <tr>
        <td>${escapeHtml(record.date || "-")}</td>
        <td><strong>${escapeHtml(record.project || "-")}</strong></td>
        <td>${escapeHtml(item ? itemLabel(item) : record.itemLabel || "已删除耗材")}</td>
        <td>${formatNumber(record.grams)} g</td>
        <td>${formatNumber(record.hours)} h</td>
        <td>${record.cost ? `￥${formatMoney(record.cost.total)}` : "-"}</td>
        <td>${escapeHtml(record.notes || "-")}</td>
      </tr>
    `;
  }).join("");
}

function renderCostInputs() {
  els.wearRateInput.value = state.costSettings.wearRate;
  els.electricityRateInput.value = state.costSettings.electricityRate;
  els.powerWattsInput.value = state.costSettings.powerWatts;
  els.laborFeeInput.value = state.costSettings.laborFee;
  els.modelFeeInput.value = state.costSettings.modelFee;
  els.postProcessFeeInput.value = state.costSettings.postProcessFee;
  els.packagingFeeInput.value = state.costSettings.packagingFee;
  els.failureRateInput.value = state.costSettings.failureRate;
  els.profitMultiplierInput.value = state.costSettings.profitMultiplier;
  els.minimumPriceInput.value = state.costSettings.minimumPrice;
}

function renderCostBreakdown() {
  const item = getItem(els.calcItemSelect.value) || state.items[0];
  const grams = numberOrZero(els.calcGramsInput.value);
  const hours = numberOrZero(els.calcHoursInput.value);
  const cost = calculatePrintCost(item, grams, hours);
  const risk = item && grams > numberOrZero(item.remainingWeight);
  els.costBreakdown.innerHTML = `
    <article class="cost-card ${risk ? "cost-risk" : ""}"><span>材料成本</span><strong>￥${formatMoney(cost.material)}</strong></article>
    <article class="cost-card"><span>机器磨损</span><strong>￥${formatMoney(cost.wear)}</strong></article>
    <article class="cost-card"><span>电费</span><strong>￥${formatMoney(cost.electricity)}</strong></article>
    <article class="cost-card"><span>人工/处理/包装</span><strong>￥${formatMoney(cost.serviceFees)}</strong></article>
    <article class="cost-card"><span>基础成本</span><strong>￥${formatMoney(cost.base)}</strong></article>
    <article class="cost-card"><span>失败损耗</span><strong>￥${formatMoney(cost.failureLoss)}</strong></article>
    <article class="cost-card"><span>利润倍率</span><strong>${formatNumber(cost.profitMultiplier)}x</strong></article>
    <article class="cost-card total"><span>建议报价${risk ? "（库存不足）" : ""}</span><strong>￥${formatMoney(cost.total)}</strong></article>
  `;
}

function renderQueueTable() {
  const rows = state.queue.filter((task) => !state.queueFilter || task.status === state.queueFilter);
  els.queueBody.innerHTML = rows.map((task) => {
    const risk = queueRisk(task);
    const cost = calculateQueueCost(task);
    const rowClass = risk.level === "danger" ? "queue-risk" : ["打印中", "准备中"].includes(task.status) ? "active-print" : task.status === "失败" ? "cost-risk" : "";
    const totalGrams = getQueueMaterials(task).reduce((sum, material) => sum + getMaterialPlannedWeight(material), 0);
    const actualGrams = getQueueMaterials(task).reduce((sum, material) => sum + getMaterialActualWeight(material), 0);
    const variance = task.status === "已完成" ? actualGrams - totalGrams : 0;
    return `
      <tr class="${rowClass}">
        <td><strong>${escapeHtml(task.name || "-")}</strong><div class="muted">${escapeHtml(task.notes || "")}</div>${task.failureReason ? `<div class="tag danger">失败：${escapeHtml(task.failureReason)}</div>` : ""}</td>
        <td>${renderQueueMaterialsSummary(task)}</td>
        <td>${formatNumber(totalGrams)} g${task.status === "已完成" ? `<div class="muted">实际 ${formatNumber(actualGrams)} g，偏差 ${formatNumber(variance)} g</div>` : ""}</td>
        <td>${formatNumber(task.hours)} h</td>
        <td>￥${formatMoney(cost.total)}</td>
        <td>${statusTag(task.status)}</td>
        <td><span class="tag ${risk.level}">${escapeHtml(risk.message)}</span></td>
        <td>
          <div class="row-actions">
            <button class="small-button" type="button" data-edit-queue="${task.id}">编辑</button>
            <button class="small-button" type="button" data-complete-queue="${task.id}" ${task.status === "已完成" ? "disabled" : ""}>完成</button>
            <button class="small-button danger" type="button" data-fail-queue="${task.id}" ${task.status === "已完成" || task.status === "失败" ? "disabled" : ""}>失败</button>
            <button class="small-button danger" type="button" data-delete-queue="${task.id}">删除</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
  els.queueBody.querySelectorAll("[data-edit-queue]").forEach((button) => {
    button.addEventListener("click", () => openQueueDialog(state.queue.find((task) => task.id === button.dataset.editQueue)));
  });
  els.queueBody.querySelectorAll("[data-complete-queue]").forEach((button) => {
    button.addEventListener("click", () => completeQueueTask(button.dataset.completeQueue));
  });
  els.queueBody.querySelectorAll("[data-fail-queue]").forEach((button) => {
    button.addEventListener("click", () => failQueueTask(button.dataset.failQueue));
  });
  els.queueBody.querySelectorAll("[data-delete-queue]").forEach((button) => {
    button.addEventListener("click", () => deleteQueueTask(button.dataset.deleteQueue));
  });
}

function updateFilter(key, value) {
  state.filters[key] = value.trim();
  renderInventoryTable();
}

function updateLabelSelection(control) {
  if (control.checked) state.selectedLabelIds.add(control.dataset.labelSelect);
  else state.selectedLabelIds.delete(control.dataset.labelSelect);
  syncSelectAllInventory();
}

function toggleAllInventorySelection(event) {
  const visible = getVisibleItems();
  visible.forEach((item) => {
    if (event.target.checked) state.selectedLabelIds.add(item.id);
    else state.selectedLabelIds.delete(item.id);
  });
  renderInventoryTable();
}

function syncSelectAllInventory() {
  const visible = getVisibleItems();
  els.selectAllInventoryInput.checked = visible.length > 0 && visible.every((item) => state.selectedLabelIds.has(item.id));
}

function saveLabelSettingsFromInputs() {
  state.labelSettings = {
    size: els.labelSizeSelect.value || "medium",
    qrMode: els.qrModeSelect.value || "code"
  };
  localStorage.setItem(LABEL_SETTINGS_KEY, JSON.stringify(state.labelSettings));
  renderLabels();
}

function getVisibleItems() {
  const search = state.filters.search.toLowerCase();
  const filtered = state.items.filter((item) => {
    const searchable = [item.name, item.brand, item.material, item.colorName, item.location, item.status, item.shop, item.batch, item.notes].join(" ").toLowerCase();
    return (!search || searchable.includes(search)) &&
      (!state.filters.material || item.material === state.filters.material) &&
      (!state.filters.brand || item.brand === state.filters.brand) &&
      (!state.filters.status || item.status === state.filters.status) &&
      (!state.filters.location || item.location === state.filters.location);
  });
  return filtered.sort((a, b) => compareItems(a, b, state.sort.key, state.sort.direction));
}

function openItemDialog(item = null) {
  els.itemDialogTitle.textContent = item ? "编辑耗材" : "新增耗材";
  els.itemForm.reset();
  els.itemImageInput.value = "";
  els.itemImagePreview.dataset.cleared = "";
  els.itemImagePreview.dataset.existingKey = item?.imageKey || "";
  els.itemId.value = item?.id || "";
  els.nameInput.value = item?.name || "";
  els.brandInput.value = item?.brand || "";
  els.materialInput.value = item?.material || "";
  els.colorNameInput.value = item?.colorName || "";
  els.colorHexInput.value = item?.colorHex || guessColor(item?.colorName);
  els.diameterInput.value = item?.diameter || 1.75;
  els.quantityInput.value = item?.quantity || 1;
  els.spoolWeightInput.value = item?.spoolWeight || 1000;
  els.totalWeightInput.value = item ? getTotalCapacity(item) : 1000;
  els.remainingWeightInput.value = item?.remainingWeight ?? getTotalCapacity({ quantity: 1, spoolWeight: 1000 });
  els.purchasePriceInput.value = item?.purchasePrice || "";
  els.itemStatusInput.value = item?.status || "在用";
  els.locationInput.value = item?.location || "";
  els.purchaseDateInput.value = item?.purchaseDate || "";
  els.shopInput.value = item?.shop || "";
  els.batchInput.value = item?.batch || "";
  els.openedInput.value = item?.opened ? "yes" : (item && item.opened === false ? "no" : "");
  els.openedAtInput.value = item?.openedAt || "";
  els.lastDryAtInput.value = item?.lastDryAt || "";
  els.dryTempInput.value = item?.dryTemp || "";
  els.dryHoursInput.value = item?.dryHours || "";
  els.moistureInput.value = item?.moistureSuspected ? "yes" : "";
  els.dryStatusInput.value = item?.dryStatus || "正常";
  els.notesInput.value = item?.notes || "";
  setImagePreview(item?.imageKey || "");
  updateUnitCostPreview();
  els.itemDialog.showModal();
}

async function saveItemFromForm(event) {
  event.preventDefault();
  const existingId = els.itemId.value;
  const itemId = existingId || createId();
  const existing = getItem(existingId);
  const now = new Date().toISOString();
  const imageKey = await resolveItemImageKey(existing, itemId);
  const item = normalizeItem({
    ...existing,
    id: itemId,
    name: els.nameInput.value,
    brand: els.brandInput.value,
    material: els.materialInput.value,
    colorName: els.colorNameInput.value,
    colorHex: els.colorHexInput.value,
    diameter: els.diameterInput.value,
    quantity: els.quantityInput.value,
    spoolWeight: els.spoolWeightInput.value,
    remainingWeight: els.remainingWeightInput.value,
    purchasePrice: els.purchasePriceInput.value,
    status: els.itemStatusInput.value,
    location: els.locationInput.value,
    purchaseDate: els.purchaseDateInput.value,
    shop: els.shopInput.value,
    batch: els.batchInput.value,
    opened: els.openedInput.value === "yes" ? true : (els.openedInput.value === "no" ? false : ""),
    openedAt: els.openedAtInput.value,
    lastDryAt: els.lastDryAtInput.value,
    dryTemp: els.dryTempInput.value,
    dryHours: els.dryHoursInput.value,
    moistureSuspected: els.moistureInput.value === "yes",
    dryStatus: els.dryStatusInput.value,
    notes: els.notesInput.value,
    imageKey,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  });
  upsertItem(item);
  ensureFilamentCodes();
  persistAll();
  els.itemDialog.close();
  render();
}

function previewSelectedItemImage() {
  const file = els.itemImageInput.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    window.alert("请选择图片文件。");
    els.itemImageInput.value = "";
    return;
  }
  const url = URL.createObjectURL(file);
  transientImageUrls.add(url);
  els.itemImagePreview.dataset.cleared = "";
  els.itemImagePreview.className = "image-preview thumb";
  els.itemImagePreview.innerHTML = `<img src="${url}" alt="图片预览">`;
}

function clearSelectedItemImage() {
  els.itemImageInput.value = "";
  els.itemImagePreview.dataset.cleared = "true";
  els.itemImagePreview.className = "image-preview thumb placeholder";
  els.itemImagePreview.textContent = "无图";
}

function setImagePreview(imageKey) {
  const src = imageCache.get(imageKey);
  els.itemImagePreview.className = src ? "image-preview thumb" : "image-preview thumb placeholder";
  els.itemImagePreview.innerHTML = src ? `<img src="${src}" alt="耗材图片">` : "无图";
}

async function resolveItemImageKey(existing, itemId) {
  if (els.itemImagePreview.dataset.cleared === "true") return "";
  const file = els.itemImageInput.files?.[0];
  if (!file) return existing?.imageKey || "";
  const imageKey = `manual_${itemId}_${Date.now().toString(36)}`;
  await putImage(imageKey, file, file.type || "image/jpeg");
  const cached = imageCache.get(imageKey);
  if (cached) URL.revokeObjectURL(cached);
  imageCache.set(imageKey, URL.createObjectURL(file));
  return imageKey;
}

function updateUnitCostPreview() {
  const price = numberOrZero(els.purchasePriceInput.value);
  const total = numberOrZero(els.totalWeightInput.value);
  els.unitCostInput.value = price && total ? (price / total).toFixed(4) : "";
}

function updateCapacityPreview() {
  const quantity = Math.max(1, numberOrZero(els.quantityInput.value) || 1);
  const spoolWeight = Math.max(1, numberOrZero(els.spoolWeightInput.value) || 1000);
  els.totalWeightInput.value = quantity * spoolWeight;
  updateUnitCostPreview();
}

function deleteItem(id) {
  const item = getItem(id);
  if (!item || !window.confirm(`确认将「${itemLabel(item)}」移动到回收站吗？`)) return;
  const trashEntry = normalizeTrashEntry({
    id: createId(),
    deletedAt: new Date().toISOString(),
    item,
    relatedConsumptionIds: state.consumption.filter((record) => record.itemId === id).map((record) => record.id),
    relatedQueueIds: state.queue.filter((task) => getQueueMaterials(task).some((material) => material.itemId === id)).map((task) => task.id)
  });
  state.trash.unshift(trashEntry);
  state.items = state.items.filter((entry) => entry.id !== id);
  persistAll();
  render();
  showToast("已移动到回收站", "撤销", () => restoreTrashItem(trashEntry.id));
}

async function handleXlsxInput(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (!window.XLSX || !window.JSZip) {
    window.alert("缺少本地解析库，请确认 vendor/xlsx.full.min.js 和 vendor/jszip.min.js 存在。");
    return;
  }
  try {
    const buffer = await file.arrayBuffer();
    const workbook = window.XLSX.read(buffer, { type: "array", cellDates: true });
    const sheetName = workbook.SheetNames.includes("Sheet1") ? "Sheet1" : workbook.SheetNames[0];
    const rows = window.XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "", raw: false });
    const imageMap = await extractWpsImages(buffer);
    const mapped = rows.map((row) => mapImportedRow(row, imageMap)).filter((item) => item.brand || item.material || item.colorName);
    state.pendingImport = mapped;
    showImportPreview(mapped, rows.length, sheetName);
  } catch (error) {
    console.error(error);
    window.alert("表格解析失败，请确认文件是 WPS/Excel .xlsx 格式。");
  }
}

function showImportPreview(items, sourceRows, sheetName) {
  els.importPanel.classList.remove("hidden");
  const imageCount = items.filter((item) => item.imageKey).length;
  els.importSummary.textContent = `工作表「${sheetName}」共 ${sourceRows} 行，可导入 ${items.length} 条，识别图片 ${imageCount} 张。`;
  els.confirmImportBtn.disabled = items.length === 0;
  els.importPreviewBody.innerHTML = items.slice(0, 100).map((item) => `
    <tr>
      <td>${renderThumb(item.imageKey)}</td>
      <td>${escapeHtml(item.brand || "-")}</td>
      <td>${escapeHtml(item.material || "-")}</td>
      <td>${escapeHtml(item.colorName || "-")}</td>
      <td>剩 ${formatNumber(item.remainingWeight)} / 容 ${formatNumber(getTotalCapacity(item))} g，${formatNumber(item.quantity)} 卷</td>
      <td>${escapeHtml(item.location || "-")}</td>
      <td>${escapeHtml(item.notes || "-")}</td>
    </tr>
  `).join("");
}

function clearImportPreview() {
  state.pendingImport = [];
  els.importPanel.classList.add("hidden");
  els.importPreviewBody.innerHTML = "";
}

function confirmImport() {
  if (!state.pendingImport.length) return;
  state.items = [...state.pendingImport, ...state.items].map(normalizeItem);
  ensureFilamentCodes();
  persistAll();
  clearImportPreview();
  render();
}

async function extractWpsImages(buffer) {
  const zip = await window.JSZip.loadAsync(buffer);
  const cellImagesXml = await readZipText(zip, "xl/cellimages.xml");
  const relsXml = await readZipText(zip, "xl/_rels/cellimages.xml.rels");
  if (!cellImagesXml || !relsXml) return new Map();

  const relMap = parseRelationships(relsXml);
  const imageMap = new Map();
  const imageRegex = /<etc:cellImage>[\s\S]*?<xdr:cNvPr[^>]*name="([^"]+)"[\s\S]*?<a:blip[^>]*r:embed="([^"]+)"[\s\S]*?<\/etc:cellImage>/g;
  let match;
  while ((match = imageRegex.exec(cellImagesXml))) {
    const imageId = match[1];
    const relId = match[2];
    const target = relMap.get(relId);
    if (!target) continue;
    const path = normalizeZipPath("xl", target);
    const file = zip.file(path);
    if (!file) continue;
    const blob = await file.async("blob");
    const mime = mimeFromPath(path);
    const imageKey = `wps_${imageId}`;
    await putImage(imageKey, blob, mime);
    imageCache.set(imageKey, URL.createObjectURL(blob));
    imageMap.set(imageId, imageKey);
  }
  return imageMap;
}

function mapImportedRow(row, imageMap = new Map()) {
  const mapped = {};
  Object.entries(fieldAliases).forEach(([field, aliases]) => {
    mapped[field] = readAlias(row, aliases);
  });
  const parsedWeight = parseWeightQuantity(mapped.weightQuantity);
  const quantity = parseNumber(mapped.quantity) || parsedWeight.quantity || 1;
  const spoolWeight = 1000;
  const totalWeight = quantity * spoolWeight;
  const remainingWeight = parseNumber(mapped.remainingWeight);
  const imageId = extractDispImageId(mapped.imageFormula);
  const now = new Date().toISOString();
  const batch = mapped.name && /^\d+$/.test(mapped.name) ? mapped.name : mapped.batch;
  return normalizeItem({
    id: createId(),
    name: mapped.name && !/^\d+$/.test(mapped.name) ? mapped.name : `${mapped.material || ""} ${mapped.colorName || ""}`.trim(),
    brand: mapped.brand,
    material: mapped.material,
    colorName: mapped.colorName,
    colorHex: normalizeColor(mapped.colorHex) || guessColor(mapped.colorName),
    diameter: parseNumber(mapped.diameter) || 1.75,
    quantity,
    spoolWeight,
    totalWeight,
    remainingWeight: Number.isFinite(remainingWeight) ? remainingWeight : (parsedWeight.totalWeight || totalWeight),
    status: mapped.status || (mapped.notes.includes("使用中") ? "在用" : "备用"),
    location: mapped.location,
    purchaseDate: normalizeDate(mapped.purchaseDate),
    purchasePrice: parseNumber(mapped.purchasePrice) || "",
    shop: mapped.shop,
    batch,
    notes: mapped.notes,
    imageKey: imageMap.get(imageId) || "",
    createdAt: now,
    updatedAt: now
  });
}

function openConsumptionDialog() {
  els.consumptionForm.reset();
  renderSelects();
  els.consumeGramsInput.value = "";
  els.consumeHoursInput.value = "";
  els.consumptionDialog.showModal();
}

function saveConsumptionFromForm(event) {
  event.preventDefault();
  const item = getItem(els.consumeItemSelect.value);
  const grams = numberOrZero(els.consumeGramsInput.value);
  if (!item) return window.alert("请选择耗材。");
  if (grams > numberOrZero(item.remainingWeight) && !window.confirm("消耗超过当前剩余库存，仍然记录吗？")) return;
  addConsumption({
    project: els.consumeProjectInput.value,
    itemId: item.id,
    grams,
    hours: numberOrZero(els.consumeHoursInput.value),
    notes: els.consumeNotesInput.value
  }, true);
  els.consumptionDialog.close();
  render();
}

function addConsumption(input, deductStock) {
  const item = getItem(input.itemId);
  const grams = numberOrZero(input.grams);
  const hours = numberOrZero(input.hours);
  const record = normalizeConsumption({
    id: createId(),
    date: new Date().toISOString().slice(0, 10),
    project: input.project,
    itemId: input.itemId,
    itemLabel: item ? itemLabel(item) : "",
    grams,
    hours,
    cost: calculatePrintCost(item, grams, hours),
    notes: input.notes
  });
  state.consumption.unshift(record);
  if (deductStock && item) {
    item.remainingWeight = Math.max(0, numberOrZero(item.remainingWeight) - grams);
    item.status = item.remainingWeight <= 0 ? "已用完" : item.status;
    item.updatedAt = new Date().toISOString();
  }
  persistAll();
}

function saveCostSettingsFromInputs() {
  state.costSettings = {
    wearRate: numberOrZero(els.wearRateInput.value),
    electricityRate: numberOrZero(els.electricityRateInput.value),
    powerWatts: numberOrZero(els.powerWattsInput.value),
    laborFee: numberOrZero(els.laborFeeInput.value),
    modelFee: numberOrZero(els.modelFeeInput.value),
    postProcessFee: numberOrZero(els.postProcessFeeInput.value),
    packagingFee: numberOrZero(els.packagingFeeInput.value),
    failureRate: numberOrZero(els.failureRateInput.value),
    profitMultiplier: numberOrZero(els.profitMultiplierInput.value) || 1,
    minimumPrice: numberOrZero(els.minimumPriceInput.value)
  };
  localStorage.setItem(COST_SETTINGS_KEY, JSON.stringify(state.costSettings));
}

function calculatePrintCost(item, grams, hours) {
  const unitCost = item ? calcUnitCost(item) : 0;
  const material = unitCost * numberOrZero(grams);
  const wear = numberOrZero(hours) * numberOrZero(state.costSettings.wearRate);
  const electricity = numberOrZero(hours) * (numberOrZero(state.costSettings.powerWatts) / 1000) * numberOrZero(state.costSettings.electricityRate);
  const serviceFees = numberOrZero(state.costSettings.laborFee) + numberOrZero(state.costSettings.modelFee) +
    numberOrZero(state.costSettings.postProcessFee) + numberOrZero(state.costSettings.packagingFee);
  const base = material + wear + electricity + serviceFees;
  const failureLoss = base * numberOrZero(state.costSettings.failureRate);
  const profitMultiplier = numberOrZero(state.costSettings.profitMultiplier) || 1;
  const quoted = (base + failureLoss) * profitMultiplier;
  const total = Math.max(quoted, numberOrZero(state.costSettings.minimumPrice));
  return {
    material,
    wear,
    electricity,
    serviceFees,
    base,
    failureLoss,
    profitMultiplier,
    quoted,
    total
  };
}

function openQueueDialog(task = null) {
  els.queueDialogTitle.textContent = task ? "编辑队列任务" : "新增队列任务";
  els.queueForm.reset();
  renderSelects();
  els.queueId.value = task?.id || "";
  els.queueNameInput.value = task?.name || "";
  els.queueHoursInput.value = task?.hours || "";
  els.queueStatusInput.value = task?.status || "待打印";
  els.queueNotesInput.value = task?.notes || "";
  renderQueueMaterialRows(task ? getQueueMaterials(task) : [{ itemId: state.items[0]?.id || "", grams: "" }]);
  updateQueueHint();
  els.queueDialog.showModal();
}

function saveQueueFromForm(event) {
  event.preventDefault();
  const existingId = els.queueId.value;
  const existing = state.queue.find((task) => task.id === existingId);
  const materials = readQueueMaterialRows();
  if (!materials.length) return window.alert("请至少添加一种耗材和预计消耗克数。");
  const task = normalizeQueue({
    id: existingId || createId(),
    name: els.queueNameInput.value,
    materials,
    hours: els.queueHoursInput.value,
    status: els.queueStatusInput.value,
    notes: els.queueNotesInput.value,
    completedConsumptionId: existing?.completedConsumptionId || "",
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  state.queue = existing ? state.queue.map((entry) => entry.id === existingId ? task : entry) : [task, ...state.queue];
  persistAll();
  els.queueDialog.close();
  render();
}

function updateQueueHint() {
  const materials = readQueueMaterialRows();
  if (!materials.length) {
    els.queueStockHint.textContent = "请至少添加一种耗材后检查库存。";
    els.queueStockHint.className = "form-hint danger";
    return;
  }
  const risky = materials.map((material) => {
    const item = getItem(material.itemId);
    if (!item) return "耗材缺失";
    const remaining = numberOrZero(item.remainingWeight);
    return getMaterialPlannedWeight(material) > remaining ? `${itemLabel(item)} 不足：需 ${formatNumber(getMaterialPlannedWeight(material))} g，剩 ${formatNumber(remaining)} g` : "";
  }).filter(Boolean);
  els.queueStockHint.textContent = risky.length ? risky.join("；") : "库存充足：所有耗材预计消耗均未超过当前库存。";
  els.queueStockHint.className = `form-hint ${risky.length ? "danger" : ""}`;
}

function completeQueueTask(id) {
  const task = state.queue.find((entry) => entry.id === id);
  if (!task || task.status === "已完成") return;
  const materials = getQueueMaterials(task);
  if (!materials.length) return window.alert("任务没有耗材明细，无法完成扣减。");
  const missing = materials.some((material) => !getItem(material.itemId));
  if (missing) return window.alert("任务中有耗材不存在，无法完成扣减。");
  const risk = queueRisk(task);
  if (risk.level === "danger" && !window.confirm("队列中存在库存不足的耗材，仍然标记完成并扣减吗？")) return;
  materials.forEach((material) => {
    const grams = getMaterialActualWeight(material);
    addConsumption({
      project: task.name,
      itemId: material.itemId,
      grams,
      hours: numberOrZero(task.hours) / materials.length,
      notes: `来自打印队列：${task.notes || ""}`.trim()
    }, true);
  });
  task.status = "已完成";
  task.completedConsumptionId = state.consumption.slice(0, materials.length).map((record) => record.id).join(",");
  task.completedAt = new Date().toISOString();
  task.updatedAt = new Date().toISOString();
  persistAll();
  render();
}

function failQueueTask(id) {
  const task = state.queue.find((entry) => entry.id === id);
  if (!task || task.status === "失败") return;
  const reason = window.prompt(`失败原因：${failureReasons.join(" / ")}`, task.failureReason || "其他");
  if (reason === null) return;
  const shouldRecord = window.confirm("是否按实际消耗/预计消耗生成消耗记录并扣减库存？");
  if (shouldRecord) {
    getQueueMaterials(task).forEach((material) => {
      addConsumption({
        project: `${task.name || "队列任务"}（失败）`,
        itemId: material.itemId,
        grams: getMaterialActualWeight(material),
        hours: numberOrZero(task.hours) / Math.max(1, getQueueMaterials(task).length),
        notes: `失败原因：${reason}。${task.notes || ""}`.trim()
      }, true);
    });
  }
  if (window.confirm("是否重新加入一个待打印任务？")) {
    state.queue.unshift(normalizeQueue({
      ...task,
      id: createId(),
      status: "待打印",
      failureReason: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }
  task.status = "失败";
  task.failureReason = reason || "其他";
  task.failedAt = new Date().toISOString();
  task.updatedAt = new Date().toISOString();
  persistAll();
  render();
}

function deleteQueueTask(id) {
  const task = state.queue.find((entry) => entry.id === id);
  if (!task || !window.confirm(`确认删除队列任务「${task.name}」吗？`)) return;
  state.queue = state.queue.filter((entry) => entry.id !== id);
  persistAll();
  render();
}

function renderQueueMaterialRows(materials) {
  const normalized = materials.length ? materials : [{ itemId: state.items[0]?.id || "", grams: "" }];
  els.queueMaterialsBody.innerHTML = normalized.map((material) => queueMaterialRowTemplate(material)).join("");
  els.queueMaterialsBody.querySelectorAll("[data-remove-material]").forEach((button) => {
    button.addEventListener("click", () => {
      button.closest(".queue-material-row").remove();
      if (!els.queueMaterialsBody.querySelector(".queue-material-row")) addQueueMaterialRow();
      updateQueueHint();
    });
  });
  els.queueMaterialsBody.querySelectorAll("[data-queue-material-item], [data-queue-material-grams], [data-queue-material-actual]").forEach((control) => {
    control.addEventListener("change", updateQueueHint);
    control.addEventListener("input", updateQueueHint);
  });
}

function addQueueMaterialRow(material = { itemId: state.items[0]?.id || "", grams: "" }) {
  els.queueMaterialsBody.insertAdjacentHTML("beforeend", queueMaterialRowTemplate(material));
  const row = els.queueMaterialsBody.lastElementChild;
  row.querySelector("[data-remove-material]").addEventListener("click", () => {
    row.remove();
    if (!els.queueMaterialsBody.querySelector(".queue-material-row")) addQueueMaterialRow();
    updateQueueHint();
  });
  row.querySelectorAll("[data-queue-material-item], [data-queue-material-grams], [data-queue-material-actual]").forEach((control) => {
    control.addEventListener("change", updateQueueHint);
    control.addEventListener("input", updateQueueHint);
  });
  updateQueueHint();
}

function queueMaterialRowTemplate(material) {
  const planned = material.estimatedWeight ?? material.grams ?? "";
  const actual = material.actualWeight ?? "";
  const options = state.items.map((item) => `<option value="${item.id}" ${item.id === material.itemId ? "selected" : ""}>${escapeHtml(itemLabel(item))}</option>`).join("");
  return `
    <div class="queue-material-row">
      <label class="field">
        <span>耗材</span>
        <select data-queue-material-item required>${options}</select>
      </label>
      <label class="field">
        <span>预计消耗 g</span>
        <input data-queue-material-grams type="number" min="0" step="1" value="${escapeAttribute(planned)}" required>
      </label>
      <label class="field">
        <span>实际消耗 g</span>
        <input data-queue-material-actual type="number" min="0" step="1" value="${escapeAttribute(actual)}" placeholder="完成时可填">
      </label>
      <button class="small-button danger" type="button" data-remove-material>移除</button>
    </div>
  `;
}

function readQueueMaterialRows() {
  return [...els.queueMaterialsBody.querySelectorAll(".queue-material-row")]
    .map((row) => ({
      itemId: row.querySelector("[data-queue-material-item]")?.value || "",
      grams: numberOrZero(row.querySelector("[data-queue-material-grams]")?.value),
      estimatedWeight: numberOrZero(row.querySelector("[data-queue-material-grams]")?.value),
      actualWeight: row.querySelector("[data-queue-material-actual]")?.value === "" ? "" : numberOrZero(row.querySelector("[data-queue-material-actual]")?.value)
    }))
    .filter((material) => material.itemId && getMaterialPlannedWeight(material) > 0);
}

function getQueueMaterials(task) {
  if (Array.isArray(task.materials)) {
    return task.materials.map((material) => ({
      itemId: cleanText(material.itemId),
      grams: numberOrZero(material.estimatedWeight ?? material.grams),
      estimatedWeight: numberOrZero(material.estimatedWeight ?? material.grams),
      actualWeight: material.actualWeight === "" || material.actualWeight === undefined ? "" : numberOrZero(material.actualWeight)
    })).filter((material) => material.itemId && getMaterialPlannedWeight(material) > 0);
  }
  if (task.itemId) return [{ itemId: cleanText(task.itemId), grams: numberOrZero(task.grams) }];
  return [];
}

function renderQueueMaterialsSummary(task) {
  const materials = getQueueMaterials(task);
  if (!materials.length) return `<span class="tag danger">无耗材</span>`;
  return materials.map((material) => {
    const item = getItem(material.itemId);
    const planned = getMaterialPlannedWeight(material);
    const actual = getMaterialActualWeight(material);
    const cls = item && planned <= numberOrZero(item.remainingWeight) ? "" : "danger";
    return `<div><span class="tag ${cls}">${escapeHtml(item ? itemLabel(item) : "耗材缺失")}</span> <span class="muted">预计 ${formatNumber(planned)} g${actual !== planned ? ` / 实际 ${formatNumber(actual)} g` : ""}</span></div>`;
  }).join("");
}

function calculateQueueCost(task) {
  const materials = getQueueMaterials(task);
  const materialCost = materials.reduce((sum, material) => sum + calculatePrintCost(getItem(material.itemId), getMaterialActualWeight(material), 0).material, 0);
  const hours = numberOrZero(task.hours);
  const serviceFees = numberOrZero(state.costSettings.laborFee) + numberOrZero(state.costSettings.modelFee) +
    numberOrZero(state.costSettings.postProcessFee) + numberOrZero(state.costSettings.packagingFee);
  const wear = hours * numberOrZero(state.costSettings.wearRate);
  const electricity = hours * (numberOrZero(state.costSettings.powerWatts) / 1000) * numberOrZero(state.costSettings.electricityRate);
  const base = materialCost + wear + electricity + serviceFees;
  const failureLoss = base * numberOrZero(state.costSettings.failureRate);
  const total = Math.max((base + failureLoss) * (numberOrZero(state.costSettings.profitMultiplier) || 1), numberOrZero(state.costSettings.minimumPrice));
  return { material: materialCost, wear, electricity, serviceFees, base, failureLoss, total };
}

function queueRisk(task) {
  const materials = getQueueMaterials(task);
  if (!materials.length) return { level: "danger", message: "无耗材" };
  if (materials.some((material) => !getItem(material.itemId))) return { level: "danger", message: "耗材缺失" };
  if (task.status === "打印中") return { level: "info", message: "打印中" };
  if (task.status === "已完成") return { level: "", message: "已完成" };
  if (task.status === "失败") return { level: "danger", message: "失败" };
  if (["已取消", "取消"].includes(task.status)) return { level: "", message: "已取消" };
  if (materials.some((material) => getMaterialPlannedWeight(material) > numberOrZero(getItem(material.itemId).remainingWeight))) return { level: "danger", message: "库存不足" };
  if (materials.some((material) => numberOrZero(getItem(material.itemId).remainingWeight) - getMaterialPlannedWeight(material) <= 100)) return { level: "warn", message: "完成后低库存" };
  return { level: "", message: "库存充足" };
}

function renderRestockTable() {
  const rows = getRestockRows();
  els.restockBody.innerHTML = rows.length ? rows.map((row) => `
    <tr class="low-stock">
      <td>${escapeHtml(row.filamentCode)}</td>
      <td>${escapeHtml(row.brand)}</td>
      <td>${escapeHtml(row.material)}</td>
      <td>${escapeHtml(row.colorName)}</td>
      <td>${formatNumber(row.diameter)} mm</td>
      <td><strong>${formatNumber(row.remainingWeight)} g</strong></td>
      <td>${formatNumber(row.quantity)}</td>
      <td>${formatNumber(row.threshold)} g</td>
      <td>${row.suggestedQuantity} 卷</td>
      <td>${escapeHtml(row.location)}</td>
      <td>${escapeHtml(row.notes)}</td>
    </tr>
  `).join("") : `<tr><td colspan="11" class="muted">当前没有达到补货阈值的耗材。</td></tr>`;
}

function getRestockRows() {
  return state.items
    .map((item) => {
      const threshold = restockThreshold(item);
      return {
        filamentCode: item.filamentCode,
        brand: item.brand,
        material: item.material,
        colorName: item.colorName,
        diameter: item.diameter,
        remainingWeight: numberOrZero(item.remainingWeight),
        quantity: numberOrZero(item.quantity),
        threshold,
        suggestedQuantity: Math.max(1, Math.ceil((threshold - numberOrZero(item.remainingWeight)) / 1000) || 1),
        location: item.location,
        notes: item.notes
      };
    })
    .filter((row) => row.remainingWeight <= row.threshold)
    .sort((a, b) => a.remainingWeight - b.remainingWeight);
}

function restockThreshold(item) {
  const material = normalizeToken(item.material);
  if (/(tpu|pa|pc|nylon)/i.test(material)) return 150;
  if (/(pla|petg)/i.test(material)) return 200;
  return numberOrZero(state.restockSettings.defaultThreshold) || 200;
}

function copyRestockText() {
  const rows = getRestockRows();
  const text = rows.length ? rows.map((row) =>
    `${row.filamentCode} ${row.brand} ${row.material} ${row.colorName}，剩余 ${formatNumber(row.remainingWeight)}g，建议采购 ${row.suggestedQuantity} 卷，位置 ${row.location || "-"}`
  ).join("\n") : "当前没有需要补货的耗材。";
  copyText(text, "补货清单已复制。");
}

function exportRestockXlsx() {
  exportRowsAsXlsx(getRestockRows(), "filament-restock-list.xlsx");
}

function exportFilteredInventory() {
  const rows = getVisibleItems().map(itemToExportRow);
  exportRowsAsXlsx(rows, "filament-filtered-inventory.xlsx");
}

function itemToExportRow(item) {
  return {
    编号: item.filamentCode,
    品牌: item.brand,
    名称: item.name,
    材料: item.material,
    颜色: item.colorName,
    线径: item.diameter,
    卷数: item.quantity,
    每卷重量: item.spoolWeight,
    总容量: getTotalCapacity(item),
    剩余重量: item.remainingWeight,
    单克成本: calcUnitCost(item),
    状态: item.status,
    位置: item.location,
    购买价格: item.purchasePrice,
    店铺: item.shop,
    备注: item.notes
  };
}

function exportRowsAsXlsx(rows, fileName) {
  if (!window.XLSX) return window.alert("缺少 SheetJS，无法导出 .xlsx。");
  const sheet = window.XLSX.utils.json_to_sheet(rows);
  const workbook = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
  window.XLSX.writeFile(workbook, fileName);
}

function renderDuplicates() {
  if (els.duplicateMinScoreFilter) els.duplicateMinScoreFilter.value = `${state.duplicateFilters.minScore}`;
  if (els.duplicateIgnoredFilter) els.duplicateIgnoredFilter.value = state.duplicateFilters.showIgnored ? "show" : "hide";
  const results = findDuplicateResults();
  els.duplicatesBody.innerHTML = results.length ? results.map((result, index) => renderDuplicateResult(result, index)).join("") : `<p class="muted">没有发现达到当前筛选条件的疑似重复项。</p>`;
  els.duplicatesBody.querySelectorAll("[data-merge-duplicate]").forEach((button) => {
    button.addEventListener("click", () => openMergePreview(button.dataset.mergeDuplicate));
  });
  els.duplicatesBody.querySelectorAll("[data-ignore-duplicate]").forEach((button) => {
    button.addEventListener("click", () => ignoreDuplicateResult(button.dataset.ignoreDuplicate));
  });
  els.duplicatesBody.querySelectorAll("[data-negative-duplicate]").forEach((button) => {
    button.addEventListener("click", () => rememberNegativeDuplicate(button.dataset.negativeDuplicate));
  });
}

function renderDuplicateResult(result, index) {
  const [a, b] = result.items;
  const mergeDiscouraged = result.mergeAdvice === "不建议合并";
  const mergeButtonText = mergeDiscouraged ? "不建议合并" : "合并预览";
  const mergeButtonClass = mergeDiscouraged ? "small-button danger weak-merge" : "small-button";
  return `
    <article class="stack-card duplicate-card ${result.ignored ? "ignored" : ""}">
      <div class="stack-card-head">
        <div>
          <strong>疑似重复 ${index + 1}</strong>
          <div class="muted">${escapeHtml(a.filamentCode)} ${escapeHtml(itemLabel(a))} ↔ ${escapeHtml(b.filamentCode)} ${escapeHtml(itemLabel(b))}</div>
        </div>
        <div class="score-badge ${scoreClass(result.score)}">
          <strong>${result.score}</strong><span>/ 100</span>
        </div>
      </div>
      <div class="duplicate-meta">
        <span class="tag ${scoreClass(result.score)}">${escapeHtml(result.level)}</span>
        <span class="tag ${result.score < 75 ? "danger" : "info"}">${escapeHtml(result.mergeAdvice || "")}</span>
        <span class="muted">判断原因：${escapeHtml(result.reasons.join("、") || "无明显相似项")}</span>
        ${result.capReasons?.length ? `<span class="tag warn">${escapeHtml(result.capReasons.join("；"))}</span>` : ""}
        ${result.ignored ? `<span class="tag warn">已忽略</span>` : ""}
      </div>
      <p class="explanation">${escapeHtml(result.explanation)}</p>
      <div class="table-wrap small comparison-wrap">
        <table class="comparison-table">
          <thead><tr><th>字段</th><th>记录 A</th><th>记录 B</th><th>判断</th><th>贡献</th><th>冲突提示</th></tr></thead>
          <tbody>
            ${result.comparisons.map((row) => `
              <tr>
                <td>${escapeHtml(row.field)}</td>
                <td>${escapeHtml(row.a || "-")}</td>
                <td>${escapeHtml(row.b || "-")}</td>
                <td>${escapeHtml(row.verdict)}</td>
                <td>${row.participates ? `+${formatNumber(row.points)} / ${formatNumber(row.maxPoints)}` : "不参与评分"}</td>
                <td>${escapeHtml(row.conflictHint || "-")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <div class="row-actions">
        <button class="${mergeButtonClass}" type="button" data-merge-duplicate="${escapeAttribute(result.id)}">${mergeButtonText}</button>
        <button class="small-button" type="button" data-ignore-duplicate="${escapeAttribute(result.id)}">${result.ignored ? "取消忽略" : "忽略"}</button>
        <button class="small-button" type="button" data-negative-duplicate="${escapeAttribute(result.id)}">不是重复，记住这个判断</button>
      </div>
    </article>
  `;
}

function findDuplicateResults(options = {}) {
  const minScore = options.minScore ?? state.duplicateFilters.minScore ?? 75;
  const showIgnored = options.showIgnored ?? state.duplicateFilters.showIgnored;
  const results = [];
  for (let i = 0; i < state.items.length; i += 1) {
    for (let j = i + 1; j < state.items.length; j += 1) {
      const result = scoreDuplicatePair(state.items[i], state.items[j]);
      if (result.score < minScore) continue;
      if (result.blocked) continue;
      result.ignored = state.duplicateIgnores.includes(result.id);
      if (!showIgnored && result.ignored) continue;
      results.push(result);
    }
  }
  return results.sort((a, b) => b.score - a.score);
}

function scoreDuplicatePair(a, b) {
  const materialA = parseMaterialSignature(a.material);
  const materialB = parseMaterialSignature(b.material);
  const colorA = parseColorSignature(a.colorName);
  const colorB = parseColorSignature(b.colorName);
  const negative = getNegativeRuleForPair(materialA, materialB, colorA, colorB);
  const comparisons = [
    compareScoredField("品牌", a.brand, b.brand, 20, "brand"),
    compareMaterialField(materialA, materialB),
    compareColorField(colorA, colorB),
    compareDiameter(a.diameter, b.diameter),
    compareKeywordField("名称/备注关键词", `${a.name} ${a.notes}`, `${b.name} ${b.notes}`, 10),
    compareUnscoredField("位置", a.location, b.location),
    compareUnscoredField("剩余重量", `${formatNumber(a.remainingWeight)}g`, `${formatNumber(b.remainingWeight)}g`)
  ];
  const material = comparisons.find((row) => row.field === "材料");
  const diameter = comparisons.find((row) => row.field === "线径");
  const color = comparisons.find((row) => row.field === "颜色");
  const blockedReason = material.blockedReason || diameter.blockedReason || color.blockedReason || negative.blockedReason || "";
  const rawScore = Math.min(100, Math.round(comparisons.reduce((sum, row) => sum + numberOrZero(row.points), 0)));
  const caps = [material.hardCap, color.hardCap, negative.hardCap].filter(Number.isFinite);
  const hardCap = caps.length ? Math.min(...caps) : 100;
  const score = Math.min(rawScore, hardCap);
  const capReasons = [material.conflictHint, color.conflictHint, negative.reason].filter(Boolean);
  const reasons = comparisons.filter((row) => row.participates && row.points > 0).map((row) => `${row.field}${row.verdict}`);
  return {
    id: ignoreKeyForItems([a, b]),
    ids: [a.id, b.id],
    items: [a, b],
    score,
    rawScore,
    hardCap,
    level: duplicateLevel(score),
    mergeAdvice: duplicateMergeAdvice(score, capReasons),
    reasons,
    explanation: duplicateExplanation(a, b, score, comparisons, capReasons),
    comparisons,
    capReasons,
    blocked: Boolean(blockedReason),
    blockedReason,
    ignored: false
  };
}

function compareMaterialField(a, b) {
  if (!a.baseMaterial || !b.baseMaterial) return comparison("材料", a.raw, b.raw, "缺少字段", 0, 30, true);
  if (a.baseMaterial !== b.baseMaterial) {
    const row = comparison("材料", a.raw, b.raw, "基础材料不同", 0, 30, true);
    row.blockedReason = "基础材料不同";
    row.conflictHint = "基础材料不同，不进入重复候选";
    return row;
  }
  if (a.modifierKey !== b.modifierKey) {
    const cap = materialModifierCap(a, b);
    const row = comparison("材料", a.raw, b.raw, "同基材不同型号", Math.min(20, cap), 30, true);
    row.hardCap = cap;
    row.conflictHint = `同基材不同型号，触发分数上限 ${cap}；不建议合并`;
    return row;
  }
  const sameRaw = cleanText(a.raw).toLowerCase() === cleanText(b.raw).toLowerCase();
  return comparison("材料", a.raw, b.raw, sameRaw ? "完全相同" : "标准化相同", 30, 30, true);
}

function compareColorField(a, b) {
  if (!a.colorFamily || !b.colorFamily) return comparison("颜色", a.raw, b.raw, "缺少字段", 0, 25, true);
  if (a.colorFamily !== b.colorFamily) {
    const row = comparison("颜色", a.raw, b.raw, "颜色不同", 0, 25, true);
    row.blockedReason = "颜色不同";
    row.conflictHint = "颜色大类不同，不进入重复候选";
    return row;
  }
  if (a.shadeKey !== b.shadeKey) {
    const row = comparison("颜色", a.raw, b.raw, "同色系不同色号", 15, 25, true);
    row.hardCap = 75;
    row.conflictHint = "同色系不同色号，触发分数上限 75；不建议合并";
    return row;
  }
  const sameRaw = cleanText(a.raw).toLowerCase() === cleanText(b.raw).toLowerCase();
  return comparison("颜色", a.raw, b.raw, sameRaw ? "完全相同" : "标准化相同", 25, 25, true);
}

function compareScoredField(field, a, b, maxPoints, type) {
  const rawA = cleanText(a);
  const rawB = cleanText(b);
  const normA = normalizeDuplicateValue(rawA, type);
  const normB = normalizeDuplicateValue(rawB, type);
  if (!rawA || !rawB) return comparison(field, rawA, rawB, "缺少字段", 0, maxPoints, true);
  if (rawA.toLowerCase() === rawB.toLowerCase()) return comparison(field, rawA, rawB, "完全相同", maxPoints, maxPoints, true);
  if (normA && normA === normB) return comparison(field, rawA, rawB, "标准化相同", maxPoints, maxPoints, true);
  const similarity = textSimilarity(normA || rawA, normB || rawB);
  const nearPoints = type === "material" ? 20 : type === "color" ? 15 : 12;
  if (similarity >= 0.62) return comparison(field, rawA, rawB, "相近", nearPoints, maxPoints, true);
  return comparison(field, rawA, rawB, "不相同", 0, maxPoints, true);
}

function compareDiameter(a, b) {
  const left = numberOrZero(a);
  const right = numberOrZero(b);
  const same = Math.abs(left - right) <= 0.01;
  const row = comparison("线径", formatNumber(left), formatNumber(right), same ? "完全相同" : "不相同", same ? 15 : 0, 15, true);
  if (!same) {
    row.blockedReason = "线径不同";
    row.conflictHint = "线径不同，不进入重复候选";
  }
  return row;
}

function compareKeywordField(field, a, b, maxPoints) {
  const tokensA = keywordTokens(a);
  const tokensB = keywordTokens(b);
  const overlap = tokensA.filter((token) => tokensB.includes(token));
  if (!tokensA.length || !tokensB.length) return comparison(field, a, b, "缺少关键词", 0, maxPoints, true);
  if (overlap.length >= Math.min(tokensA.length, tokensB.length)) return comparison(field, a, b, "相近", maxPoints, maxPoints, true);
  if (overlap.length) return comparison(field, a, b, "相近", Math.min(maxPoints, overlap.length * 3), maxPoints, true);
  return comparison(field, a, b, "不相同", 0, maxPoints, true);
}

function compareUnscoredField(field, a, b) {
  return comparison(field, a, b, "不参与评分", 0, 0, false);
}

function comparison(field, a, b, verdict, points, maxPoints, participates) {
  return { field, a: cleanText(a), b: cleanText(b), verdict, points, maxPoints, participates, conflictHint: "" };
}

function duplicateLevel(score) {
  if (score >= 90) return "几乎确定重复";
  if (score >= 75) return "高度疑似重复";
  if (score >= 60) return "同类耗材";
  return "低相似度";
}

function duplicateMergeAdvice(score, capReasons = []) {
  if (capReasons.some((reason) => reason.includes("不建议合并"))) return "不建议合并";
  if (score >= 90 && !capReasons.length) return "可以建议合并";
  if (score >= 75) return "需要人工确认";
  if (score >= 60) return "不建议合并";
  return "不显示";
}

function duplicateExplanation(a, b, score, comparisons, capReasons = []) {
  const material = comparisons.find((row) => row.field === "材料");
  const color = comparisons.find((row) => row.field === "颜色");
  const brand = comparisons.find((row) => row.field === "品牌");
  const diameter = comparisons.find((row) => row.field === "线径");
  const prefix = score >= 90 ? "这两条记录几乎确定重复" : score >= 75 ? "这两条记录高度疑似重复" : "这两条记录属于同类耗材";
  const details = [
    material?.points ? `材料判断为${material.verdict}` : "材料不完全一致",
    color?.points ? `颜色判断为${color.verdict}` : "颜色不完全一致",
    diameter?.points ? `线径同为 ${formatNumber(a.diameter)}mm` : "线径不同",
    brand?.points ? `品牌 ${brand.a} 和 ${brand.b} 被视为${brand.verdict}` : "品牌不同"
  ];
  const capText = capReasons.length ? `触发限制：${capReasons.join("；")}。` : "";
  return `${prefix}，因为${details.join("，")}。${capText}${score < 75 ? "这是同类耗材，不建议合并。" : "请结合实物标签人工确认。"}`;
}

function scoreClass(score) {
  if (score >= 90) return "info";
  if (score >= 75) return "warn";
  if (score >= 60) return "";
  return "danger";
}

function ignoreKeyForItems(items) {
  return items.map((item) => item.id).sort().join("|");
}

function ignoreDuplicateResult(id) {
  if (state.duplicateIgnores.includes(id)) {
    state.duplicateIgnores = state.duplicateIgnores.filter((entry) => entry !== id);
  } else {
    state.duplicateIgnores.push(id);
  }
  persistAll();
  renderDuplicates();
}

function rememberNegativeDuplicate(id) {
  const result = findDuplicateResults({ minScore: 60, showIgnored: true }).find((entry) => entry.id === id);
  if (!result) return;
  const rules = negativeRulesForResult(result);
  if (!rules.length) {
    state.duplicateIgnores.push(id);
  } else {
    state.duplicateNegativeRules = [...new Set([...state.duplicateNegativeRules, ...rules])];
  }
  persistAll();
  renderDuplicates();
  showToast("已记住这个非重复判断。");
}

function negativeRulesForResult(result) {
  const [a, b] = result.items;
  const materialA = parseMaterialSignature(a.material);
  const materialB = parseMaterialSignature(b.material);
  const colorA = parseColorSignature(a.colorName);
  const colorB = parseColorSignature(b.colorName);
  const rules = [];
  if (materialA.baseMaterial && materialA.baseMaterial === materialB.baseMaterial && materialA.modifierKey !== materialB.modifierKey) {
    rules.push(`material:${pairKey(materialA.normalizedLabel, materialB.normalizedLabel)}`);
  }
  if (colorA.colorFamily && colorA.colorFamily === colorB.colorFamily && colorA.shadeKey !== colorB.shadeKey) {
    rules.push(`color:${pairKey(colorA.normalizedLabel, colorB.normalizedLabel)}`);
  }
  return rules;
}

function openMergePreview(id) {
  const result = findDuplicateResults({ minScore: 60, showIgnored: true }).find((entry) => entry.id === id);
  if (!result) return;
  const [a, b] = result.items;
  els.mergeSourceIds.value = result.ids.join("|");
  els.mergeDialogTitle.textContent = `合并预览：${a.filamentCode} + ${b.filamentCode}`;
  els.mergeSummary.textContent = `相似度 ${result.score} / 100，${result.level}，${result.mergeAdvice}。${result.capReasons?.length ? `限制原因：${result.capReasons.join("；")}。` : ""}合并后记录 B 会进入回收站，消耗记录和队列引用会迁移到记录 A。`;
  els.mergeImageChoice.value = a.imageKey ? "a" : (b.imageKey ? "b" : "");
  const rows = [
    mergeChoiceRow("品牌", "brand", a.brand, b.brand),
    mergeChoiceRow("材料", "material", a.material, b.material),
    mergeChoiceRow("颜色", "colorName", a.colorName, b.colorName),
    mergeChoiceRow("线径", "diameter", a.diameter, b.diameter),
    mergeStaticRow("卷数", "quantity", a.quantity, b.quantity, numberOrZero(a.quantity) + numberOrZero(b.quantity)),
    mergeStaticRow("剩余重量", "remainingWeight", `${formatNumber(a.remainingWeight)}g`, `${formatNumber(b.remainingWeight)}g`, `${formatNumber(numberOrZero(a.remainingWeight) + numberOrZero(b.remainingWeight))}g`),
    mergeStaticRow("购买价格", "purchasePrice", a.purchasePrice || "-", b.purchasePrice || "-", `￥${formatMoney(numberOrZero(a.purchasePrice) + numberOrZero(b.purchasePrice))}`),
    mergeStaticRow("备注", "notes", a.notes || "-", b.notes || "-", "自动合并两条备注"),
    mergeStaticRow("消耗记录", "records", "保留", "迁移", "迁移到记录 A")
  ];
  els.mergePreviewBody.innerHTML = rows.join("");
  els.mergeDialog.showModal();
}

function mergeChoiceRow(label, field, a, b) {
  const same = cleanText(a) === cleanText(b);
  const options = [...new Set([a, b].map(cleanText).filter(Boolean))];
  return `
    <tr>
      <td>${escapeHtml(label)}</td>
      <td>${escapeHtml(a || "-")}</td>
      <td>${escapeHtml(b || "-")}</td>
      <td>${same ? escapeHtml(a || "-") : `<select data-merge-field="${field}">${options.map((value) => `<option value="${escapeAttribute(value)}">${escapeHtml(value)}</option>`).join("")}</select>`}</td>
    </tr>
  `;
}

function mergeStaticRow(label, field, a, b, merged) {
  return `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(a)}</td><td>${escapeHtml(b)}</td><td data-merge-field="${field}">${escapeHtml(merged)}</td></tr>`;
}

function confirmMergeFromPreview(event) {
  event.preventDefault();
  const [targetId, sourceId] = els.mergeSourceIds.value.split("|");
  const target = getItem(targetId);
  const source = getItem(sourceId);
  if (!target || !source) return;
  if (!window.confirm("确认合并这两条耗材记录吗？合并后原记录将进入回收站，消耗记录和队列引用会迁移。")) return;
  const selectValue = (field, fallback) => els.mergePreviewBody.querySelector(`[data-merge-field="${field}"]`)?.value || fallback;
  const now = new Date().toISOString();
  const merged = normalizeItem({
    ...target,
    brand: selectValue("brand", target.brand),
    material: selectValue("material", target.material),
    colorName: selectValue("colorName", target.colorName),
    diameter: selectValue("diameter", target.diameter),
    quantity: numberOrZero(target.quantity) + numberOrZero(source.quantity),
    remainingWeight: numberOrZero(target.remainingWeight) + numberOrZero(source.remainingWeight),
    purchasePrice: numberOrZero(target.purchasePrice) + numberOrZero(source.purchasePrice),
    notes: [...new Set([target.notes, source.notes].filter(Boolean))].join("\n"),
    imageKey: els.mergeImageChoice.value === "a" ? target.imageKey : els.mergeImageChoice.value === "b" ? source.imageKey : "",
    updatedAt: now
  });
  state.trash.unshift(normalizeTrashEntry({
    id: createId(),
    deletedAt: now,
    item: source,
    relatedConsumptionIds: state.consumption.filter((record) => record.itemId === source.id).map((record) => record.id),
    relatedQueueIds: state.queue.filter((task) => getQueueMaterials(task).some((material) => material.itemId === source.id)).map((task) => task.id)
  }));
  state.consumption.forEach((record) => { if (record.itemId === source.id) record.itemId = target.id; });
  state.queue.forEach((task) => {
    task.materials = getQueueMaterials(task).map((material) => material.itemId === source.id ? { ...material, itemId: target.id } : material);
  });
  state.items = state.items.filter((item) => item.id !== source.id).map((item) => item.id === target.id ? merged : item);
  state.duplicateIgnores = state.duplicateIgnores.filter((entry) => !entry.includes(source.id));
  persistAll();
  els.mergeDialog.close();
  render();
  showToast("合并完成，被合并记录已进入回收站。");
}

function renderAuditTable() {
  els.auditBody.innerHTML = state.items.map((item) => `
    <tr>
      <td>${escapeHtml(item.filamentCode)}</td>
      <td>${escapeHtml(itemLabel(item))}</td>
      <td>${formatNumber(item.remainingWeight)} g</td>
      <td><input class="inline-input tiny" data-audit-id="${item.id}" data-audit-actual type="number" min="0" step="1" value="${escapeAttribute(item.remainingWeight)}"></td>
      <td data-audit-diff="${item.id}">0 g</td>
      <td><input class="inline-input" data-audit-id="${item.id}" data-audit-notes placeholder="盘点备注"></td>
    </tr>
  `).join("");
  els.auditBody.querySelectorAll("[data-audit-actual]").forEach((input) => {
    input.addEventListener("input", () => {
      const item = getItem(input.dataset.auditId);
      const diff = numberOrZero(input.value) - numberOrZero(item?.remainingWeight);
      const cell = els.auditBody.querySelector(`[data-audit-diff="${input.dataset.auditId}"]`);
      if (cell) cell.textContent = `${formatNumber(diff)} g`;
    });
  });
}

async function renderQualityTable() {
  const showIgnored = Boolean(els.showIgnoredQualityInput?.checked);
  const issues = await findQualityIssues();
  const visible = issues.filter((issue) => showIgnored || !issue.ignored);
  els.qualityBody.innerHTML = visible.length ? visible.map((issue) => {
    const item = getItem(issue.itemId);
    return `
      <tr class="${issue.severity === "danger" ? "queue-risk" : issue.severity === "warn" ? "low-stock" : ""}">
        <td><span class="tag ${issue.severity}">${escapeHtml(issue.severity === "danger" ? "严重" : issue.severity === "warn" ? "提醒" : "信息")}</span></td>
        <td>${escapeHtml(issue.type)}</td>
        <td>${item ? `${escapeHtml(item.filamentCode)} ${escapeHtml(itemLabel(item))}` : "-"}</td>
        <td>${escapeHtml(issue.message)}${issue.ignored ? ` <span class="tag warn">已忽略</span>` : ""}</td>
        <td>
          <div class="row-actions">
            ${item ? `<button class="small-button" type="button" data-quality-view="${item.id}">查看</button><button class="small-button" type="button" data-quality-edit="${item.id}">编辑</button>` : ""}
            <button class="small-button" type="button" data-quality-ignore="${escapeAttribute(issue.id)}">${issue.ignored ? "取消忽略" : "忽略"}</button>
          </div>
        </td>
      </tr>
    `;
  }).join("") : `<tr><td colspan="5" class="muted">当前没有需要处理的库存体检问题。</td></tr>`;
  els.qualityBody.querySelectorAll("[data-quality-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters.search = getItem(button.dataset.qualityView)?.filamentCode || "";
      els.searchInput.value = state.filters.search;
      switchTab("inventory");
      renderInventoryTable();
    });
  });
  els.qualityBody.querySelectorAll("[data-quality-edit]").forEach((button) => {
    button.addEventListener("click", () => openItemDialog(getItem(button.dataset.qualityEdit)));
  });
  els.qualityBody.querySelectorAll("[data-quality-ignore]").forEach((button) => {
    button.addEventListener("click", () => toggleQualityIgnore(button.dataset.qualityIgnore));
  });
}

async function findQualityIssues() {
  const issues = [];
  const add = (issue) => {
    issue.ignored = Boolean(issue.ignored) || state.qualityIgnores.includes(issue.id);
    issues.push(issue);
  };
  findDuplicateResults({ minScore: 75, showIgnored: true }).forEach((result) => {
    const issueId = `duplicate:${result.id}`;
    const ignoredByDuplicate = Boolean(result.ignored);
    const ignoredByQuality = state.qualityIgnores.includes(issueId);
    if (ignoredByDuplicate && !els.showIgnoredQualityInput?.checked) return;
    add({
      id: issueId,
      type: "疑似重复耗材",
      severity: ignoredByDuplicate ? "info" : result.score >= 90 ? "danger" : "warn",
      itemId: result.ids[0],
      message: `${result.level}，相似度 ${result.score}/100：${itemLabel(result.items[0])} ↔ ${itemLabel(result.items[1])}${ignoredByDuplicate ? "（已在重复检测中忽略）" : ""}`,
      ignored: ignoredByDuplicate || ignoredByQuality
    });
  });
  for (const item of state.items) {
    if (!item.brand) add(qualityIssue(item, "缺少品牌", "warn", "品牌为空，建议补全后再做重复检测和补货。"));
    if (!item.material) add(qualityIssue(item, "缺少材料", "danger", "材料为空，会影响重复检测、补货阈值和报价。"));
    if (!item.colorName) add(qualityIssue(item, "缺少颜色", "warn", "颜色为空，会降低重复检测准确性。"));
    if (numberOrZero(item.remainingWeight) > getTotalCapacity(item)) add(qualityIssue(item, "剩余重量大于总容量", "danger", `剩余 ${formatNumber(item.remainingWeight)}g，大于容量 ${formatNumber(getTotalCapacity(item))}g。`));
    if (numberOrZero(item.quantity) <= 0 && numberOrZero(item.remainingWeight) > 0) add(qualityIssue(item, "卷数异常", "danger", "卷数为 0 但仍有剩余重量。"));
    if (item.status === "已用完" && numberOrZero(item.remainingWeight) > 0) add(qualityIssue(item, "状态与剩余矛盾", "warn", "状态为已用完，但剩余重量大于 0。"));
    if (["在用", "使用中"].includes(item.status) && numberOrZero(item.remainingWeight) <= 0) add(qualityIssue(item, "状态与剩余矛盾", "warn", "状态为在用，但剩余重量为 0。"));
    if (item.imageKey && !(await getImage(item.imageKey))) add(qualityIssue(item, "图片缺失", "warn", `imageKey ${item.imageKey} 在 IndexedDB 中找不到图片。`));
    if (getDryWarning(item) && !item.lastDryAt) add(qualityIssue(item, "建议干燥", "warn", "开封较久或疑似受潮，但没有上次干燥记录。"));
  }
  return issues;
}

function qualityIssue(item, type, severity, message) {
  return { id: `${type}:${item.id}`, type, severity, itemId: item.id, message, ignored: false };
}

function toggleQualityIgnore(id) {
  if (state.qualityIgnores.includes(id)) state.qualityIgnores = state.qualityIgnores.filter((entry) => entry !== id);
  else state.qualityIgnores.push(id);
  persistAll();
  renderQualityTable();
}

function saveAudit() {
  const rows = [...els.auditBody.querySelectorAll("[data-audit-actual]")];
  rows.forEach((input) => {
    const item = getItem(input.dataset.auditId);
    if (!item) return;
    const actual = numberOrZero(input.value);
    const systemWeight = numberOrZero(item.remainingWeight);
    const difference = actual - systemWeight;
    if (difference === 0) return;
    const notes = els.auditBody.querySelector(`[data-audit-id="${item.id}"][data-audit-notes]`)?.value || "";
    state.consumption.unshift(normalizeConsumption({
      id: createId(),
      type: "盘点修正",
      project: "库存盘点",
      itemId: item.id,
      itemLabel: itemLabel(item),
      grams: Math.abs(difference),
      systemWeight,
      actualWeight: actual,
      difference,
      notes
    }));
    item.remainingWeight = actual;
    item.updatedAt = new Date().toISOString();
  });
  persistAll();
  render();
  showToast("盘点已保存");
}

function renderLabels() {
  els.labelSizeSelect.value = state.labelSettings.size || "medium";
  els.qrModeSelect.value = state.labelSettings.qrMode || "code";
  const ids = state.selectedLabelIds.size ? [...state.selectedLabelIds] : state.items.map((item) => item.id);
  const items = ids.map(getItem).filter(Boolean);
  els.labelsBody.className = `label-grid label-${escapeAttribute(state.labelSettings.size || "medium")}`;
  els.labelsBody.innerHTML = items.map((item) => `
    <article class="label-card">
      <div class="label-main">
        <strong>${escapeHtml(item.filamentCode)}</strong>
        <span>${escapeHtml(item.brand || "-")} / ${escapeHtml(item.material || "-")}</span>
        <span>${escapeHtml(item.colorName || "-")} / ${formatNumber(item.diameter)}mm</span>
        <span>${formatNumber(item.remainingWeight)} / ${formatNumber(getTotalCapacity(item))} g</span>
        <span>${escapeHtml(item.location || "-")}</span>
      </div>
      <div class="qr-box" data-qr-item="${escapeAttribute(item.id)}" aria-label="二维码 ${escapeAttribute(item.filamentCode)}">二维码</div>
    </article>
  `).join("");
  renderQrCodes();
}

function renderQrCodes() {
  els.labelsBody.querySelectorAll("[data-qr-item]").forEach((box) => {
    const item = getItem(box.dataset.qrItem);
    if (!item) return;
    box.innerHTML = "";
    try {
      if (!window.QRCode?.toCanvas) throw new Error("QRCode library missing");
      window.QRCode.toCanvas(box, getQrPayload(item), { scale: 4, margin: 2 });
    } catch (error) {
      box.classList.add("qr-error");
      box.textContent = "二维码生成失败";
    }
  });
}

function getQrPayload(item) {
  if (state.labelSettings.qrMode === "hash") return `index.html#filament=${encodeURIComponent(item.filamentCode)}`;
  return item.filamentCode;
}

function printSelectedLabels() {
  const selected = [...state.selectedLabelIds].map(getItem).filter(Boolean);
  if (!selected.length) return window.alert("请先在库存表勾选要打印的耗材。");
  switchTab("labels");
  renderLabels();
  window.print();
}

function parseScannedCode(code) {
  const text = cleanText(code);
  const hashMatch = text.match(/filament=([^&#]+)/i);
  const raw = hashMatch ? decodeURIComponent(hashMatch[1]) : text;
  const match = raw.toUpperCase().match(/FIL-\d{4}(?:-\d{2})?/);
  if (!match) return { raw: text, code: "", spoolCode: "", mainCode: "" };
  const spoolCode = match[0];
  const mainCode = spoolCode.match(/^(FIL-\d{4})/)?.[1] || spoolCode;
  return { raw: text, code: mainCode, spoolCode, mainCode };
}

function findItemByFilamentCode(code) {
  const parsed = parseScannedCode(code);
  if (!parsed.mainCode) return null;
  return state.items.find((item) => cleanText(item.filamentCode).toUpperCase() === parsed.mainCode) || null;
}

function findScannedCode(code) {
  const item = findItemByFilamentCode(code);
  if (!item) {
    window.alert("未找到该耗材编号。");
    return;
  }
  stopScanner();
  highlightInventoryItem(item.id);
  openScanActionPanel(item);
}

function highlightInventoryItem(itemId) {
  state.highlightedItemId = itemId;
  state.filters.search = getItem(itemId)?.filamentCode || "";
  els.searchInput.value = state.filters.search;
  switchTab("inventory");
  renderInventoryTable();
  window.setTimeout(() => {
    document.getElementById(`item-${itemId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 50);
}

function openScanActionPanel(item) {
  els.scanActionItemId.value = item.id;
  els.scanActionTitle.textContent = `扫码操作：${item.filamentCode}`;
  els.scanActionSummary.textContent = `${itemLabel(item)}，剩余 ${formatNumber(item.remainingWeight)} / ${formatNumber(getTotalCapacity(item))} g，位置 ${item.location || "-"}`;
  els.scanLocationInput.value = item.location || "";
  els.scanCustomConsumeInput.value = "";
  els.scanActionDialog.showModal();
}

function getScanActionItem() {
  return getItem(els.scanActionItemId.value);
}

function quickConsumeScannedItem(item, grams) {
  if (!item) return;
  if (!grams || grams <= 0) return window.alert("请输入有效扣减重量。");
  if (grams > numberOrZero(item.remainingWeight) && !window.confirm("扣减重量超过当前剩余，仍然继续吗？")) return;
  addConsumption({
    project: "扫码快速消耗",
    itemId: item.id,
    grams,
    hours: 0,
    notes: `扫码扣减 ${formatNumber(grams)}g`
  }, true);
  render();
  openScanActionPanel(item);
  showToast(`已扣减 ${formatNumber(grams)}g，并生成消耗记录。`);
}

function updateScannedItemLocation() {
  const item = getScanActionItem();
  if (!item) return;
  item.location = cleanText(els.scanLocationInput.value);
  item.updatedAt = new Date().toISOString();
  persistAll();
  render();
  openScanActionPanel(item);
  showToast("位置已更新。");
}

function markScannedItemOpened() {
  const item = getScanActionItem();
  if (!item) return;
  item.opened = true;
  item.openedAt = item.openedAt || new Date().toISOString().slice(0, 10);
  item.status = item.status === "未开封" ? "在用" : item.status;
  item.updatedAt = new Date().toISOString();
  persistAll();
  render();
  openScanActionPanel(item);
  showToast("已标记为开封。");
}

function addScannedItemToQueue() {
  const item = getScanActionItem();
  if (!item) return;
  els.scanActionDialog.close();
  openQueueDialog({
    name: `${item.filamentCode} 打印任务`,
    materials: [{ itemId: item.id, grams: 1 }],
    status: "待打印"
  });
}

async function startScanner() {
  if (!navigator.mediaDevices?.getUserMedia || !window.BarcodeDetector) {
    els.scanStatus.textContent = "当前浏览器不支持摄像头扫码，请使用手动输入。";
    els.scanStatus.className = "form-hint warn";
    return;
  }
  try {
    stopScanner();
    scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    els.scanVideo.srcObject = scanStream;
    await els.scanVideo.play();
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    els.scanStatus.textContent = "正在扫描二维码...";
    els.scanStatus.className = "form-hint";
    scanTimer = window.setInterval(async () => {
      try {
        const codes = await detector.detect(els.scanVideo);
        if (codes[0]?.rawValue) findScannedCode(codes[0].rawValue);
      } catch {
        // Keep scanning; some frames fail while the camera is moving.
      }
    }, 650);
  } catch (error) {
    els.scanStatus.textContent = "摄像头无法打开，请使用手动输入。";
    els.scanStatus.className = "form-hint danger";
  }
}

function stopScanner() {
  if (scanTimer) window.clearInterval(scanTimer);
  scanTimer = null;
  if (scanStream) scanStream.getTracks().forEach((track) => track.stop());
  scanStream = null;
  if (els.scanVideo) els.scanVideo.srcObject = null;
}

function renderTrashTable() {
  els.trashBody.innerHTML = state.trash.length ? state.trash.map((entry) => `
    <tr>
      <td>${escapeHtml((entry.deletedAt || "").slice(0, 19).replace("T", " "))}</td>
      <td>${escapeHtml(itemLabel(entry.item))}<div class="muted">${escapeHtml(entry.item?.filamentCode || "")}</div></td>
      <td>${renderThumb(entry.item?.imageKey)}</td>
      <td>${escapeHtml(entry.item?.location || "-")}</td>
      <td>${escapeHtml(entry.item?.notes || "-")}</td>
      <td><div class="row-actions"><button class="small-button" type="button" data-restore-trash="${entry.id}">恢复</button><button class="small-button danger" type="button" data-delete-trash="${entry.id}">永久删除</button></div></td>
    </tr>
  `).join("") : `<tr><td colspan="6" class="muted">回收站为空。</td></tr>`;
  els.trashBody.querySelectorAll("[data-restore-trash]").forEach((button) => {
    button.addEventListener("click", () => restoreTrashItem(button.dataset.restoreTrash));
  });
  els.trashBody.querySelectorAll("[data-delete-trash]").forEach((button) => {
    button.addEventListener("click", () => permanentlyDeleteTrash(button.dataset.deleteTrash));
  });
}

function restoreTrashItem(id) {
  const entry = state.trash.find((item) => item.id === id);
  if (!entry) return;
  state.items.unshift(normalizeItem(entry.item));
  state.trash = state.trash.filter((item) => item.id !== id);
  ensureFilamentCodes();
  persistAll();
  render();
  showToast("已从回收站恢复。");
}

function permanentlyDeleteTrash(id) {
  if (!window.confirm("确认永久删除这条回收站记录吗？图片不会主动清理，但记录无法恢复。")) return;
  state.trash = state.trash.filter((item) => item.id !== id);
  persistAll();
  renderTrashTable();
}

function clearTrash() {
  if (!state.trash.length) return;
  if (!window.confirm("确认清空回收站吗？")) return;
  state.trash = [];
  persistAll();
  renderTrashTable();
}

function handleJsonInput(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      state.items = (Array.isArray(parsed) ? parsed : parsed.items || []).map(normalizeItem);
      state.consumption = (parsed.consumption || []).map(normalizeConsumption);
      state.queue = (parsed.queue || []).map(normalizeQueue);
      state.costSettings = { ...costDefaults, ...(parsed.costSettings || {}) };
      state.trash = (parsed.trash || []).map(normalizeTrashEntry);
      state.duplicateIgnores = Array.isArray(parsed.duplicateIgnores) ? parsed.duplicateIgnores : [];
      state.duplicateNegativeRules = Array.isArray(parsed.duplicateNegativeRules) ? parsed.duplicateNegativeRules : [];
      state.qualityIgnores = Array.isArray(parsed.qualityIgnores) ? parsed.qualityIgnores : [];
      state.labelSettings = { ...labelDefaults, ...(parsed.labelSettings || {}) };
      ensureFilamentCodes();
      persistAll();
      render();
      window.alert(`已恢复 ${state.items.length} 条耗材记录。图片仍需保留在当前浏览器 IndexedDB 中。`);
    } catch {
      window.alert("JSON 备份文件无法识别。");
    }
  };
  reader.readAsText(file, "utf-8");
}

function exportJson() {
  const payload = JSON.stringify({
    version: 4,
    exportedAt: new Date().toISOString(),
    items: state.items,
    consumption: state.consumption,
    queue: state.queue,
    costSettings: state.costSettings,
    trash: state.trash,
    duplicateIgnores: state.duplicateIgnores,
    duplicateNegativeRules: state.duplicateNegativeRules,
    qualityIgnores: state.qualityIgnores,
    restockSettings: state.restockSettings,
    labelSettings: state.labelSettings,
    note: "图片保存在 IndexedDB，本 JSON 备份仅包含 imageKey，不内嵌原图。完整图片请使用 ZIP 备份。"
  }, null, 2);
  const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "filament-inventory-backup.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

async function exportZipBackup() {
  if (!window.JSZip) return window.alert("缺少 JSZip，无法导出完整 ZIP 备份。");
  const zip = new window.JSZip();
  const imageKeys = [...new Set([
    ...state.items.map((item) => item.imageKey),
    ...state.trash.map((entry) => entry.item?.imageKey)
  ].filter(Boolean))];
  const imageManifest = {};
  const missingImages = [];
  for (const [index, key] of imageKeys.entries()) {
    const image = await getImage(key);
    if (!image?.blob) {
      missingImages.push(key);
      continue;
    }
    const ext = extensionFromMime(image.mime || image.blob.type || "image/jpeg");
    const fileName = `image_${String(index + 1).padStart(4, "0")}.${ext}`;
    imageManifest[key] = { path: `images/${fileName}`, mime: image.mime || image.blob.type || "image/jpeg" };
    zip.file(`images/${fileName}`, image.blob);
  }
  zip.file("data.json", JSON.stringify({
    version: 4,
    exportedAt: new Date().toISOString(),
    items: state.items,
    consumption: state.consumption,
    queue: state.queue,
    costSettings: state.costSettings,
    trash: state.trash,
    duplicateIgnores: state.duplicateIgnores,
    duplicateNegativeRules: state.duplicateNegativeRules,
    qualityIgnores: state.qualityIgnores,
    restockSettings: state.restockSettings,
    labelSettings: state.labelSettings,
    imageManifest,
    missingImages
  }, null, 2));
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, `filament-full-backup-${timestampForFile()}.zip`);
}

async function handleZipInput(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (!window.JSZip) return window.alert("缺少 JSZip，无法恢复 ZIP 备份。");
  if (!window.confirm("恢复 ZIP 会覆盖当前库存、消耗、队列、设置和回收站数据，确认继续吗？")) return;
  try {
    const zip = await window.JSZip.loadAsync(await file.arrayBuffer());
    const dataFile = zip.file("data.json");
    if (!dataFile) throw new Error("missing data.json");
    const parsed = JSON.parse(await dataFile.async("text"));
    const manifest = parsed.imageManifest || {};
    for (const [imageKey, meta] of Object.entries(manifest)) {
      const imageFile = zip.file(meta.path);
      if (!imageFile) continue;
      await putImage(imageKey, await imageFile.async("blob"), meta.mime || mimeFromPath(meta.path));
    }
    state.items = (parsed.items || parsed.inventory || []).map(normalizeItem);
    state.consumption = (parsed.consumption || parsed.consumptionRecords || []).map(normalizeConsumption);
    state.queue = (parsed.queue || []).map(normalizeQueue);
    state.costSettings = { ...costDefaults, ...(parsed.costSettings || {}) };
    state.trash = (parsed.trash || []).map(normalizeTrashEntry);
    state.duplicateIgnores = Array.isArray(parsed.duplicateIgnores) ? parsed.duplicateIgnores : [];
    state.duplicateNegativeRules = Array.isArray(parsed.duplicateNegativeRules) ? parsed.duplicateNegativeRules : [];
    state.qualityIgnores = Array.isArray(parsed.qualityIgnores) ? parsed.qualityIgnores : [];
    state.restockSettings = { defaultThreshold: 200, ...(parsed.restockSettings || {}) };
    state.labelSettings = { ...labelDefaults, ...(parsed.labelSettings || {}) };
    ensureFilamentCodes();
    persistAll();
    await hydrateImages();
    render();
    window.alert(`ZIP 恢复完成：${state.items.length} 条库存，${Object.keys(manifest).length} 张图片。`);
  } catch (error) {
    console.error(error);
    window.alert("ZIP 备份无法恢复，请确认文件包含 data.json 和 images/。");
  }
}

async function hydrateImages() {
  const keys = [...new Set([
    ...state.items.map((item) => item.imageKey),
    ...state.trash.map((entry) => entry.item?.imageKey)
  ].filter(Boolean))];
  await Promise.all(keys.map(async (key) => {
    const image = await getImage(key);
    if (image?.blob) imageCache.set(key, URL.createObjectURL(image.blob));
  }));
}

function renderThumb(imageKey) {
  const src = imageCache.get(imageKey);
  return src ? `<img class="thumb" src="${src}" alt="耗材图片">` : `<span class="thumb placeholder">无图</span>`;
}

function openImageDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IMAGE_DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(IMAGE_STORE, { keyPath: "key" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putImage(key, blob, mime) {
  const db = await openImageDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE, "readwrite");
    tx.objectStore(IMAGE_STORE).put({ key, blob, mime, updatedAt: new Date().toISOString() });
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function getImage(key) {
  const db = await openImageDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE, "readonly");
    const request = tx.objectStore(IMAGE_STORE).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

function normalizeItem(item) {
  const quantity = parseNumber(item.quantity) || 1;
  const spoolWeight = parseNumber(item.spoolWeight) || 1000;
  const totalWeight = quantity * spoolWeight;
  const purchasePrice = parseNumber(item.purchasePrice ?? item.price);
  const remainingWeight = parseNumber(item.remainingWeight);
  const now = new Date().toISOString();
  const normalized = {
    id: item.id || createId(),
    name: cleanText(item.name),
    brand: cleanText(item.brand),
    material: cleanText(item.material),
    colorName: cleanText(item.colorName),
    colorHex: normalizeColor(item.colorHex) || guessColor(item.colorName),
    diameter: parseNumber(item.diameter) || 1.75,
    quantity,
    spoolWeight,
    totalWeight,
    remainingWeight: Number.isFinite(remainingWeight) ? remainingWeight : totalWeight,
    status: cleanText(item.status) || "在用",
    location: cleanText(item.location),
    purchaseDate: normalizeDate(item.purchaseDate),
    purchasePrice: Number.isFinite(purchasePrice) ? purchasePrice : "",
    unitCost: 0,
    filamentCode: cleanText(item.filamentCode),
    shop: cleanText(item.shop),
    batch: cleanText(item.batch),
    opened: item.opened === true ? true : (item.opened === false ? false : ""),
    openedAt: normalizeDate(item.openedAt),
    lastDryAt: normalizeDate(item.lastDryAt),
    dryTemp: parseNumber(item.dryTemp) || "",
    dryHours: parseNumber(item.dryHours) || "",
    moistureSuspected: item.moistureSuspected === true,
    dryStatus: cleanText(item.dryStatus) || "正常",
    notes: cleanText(item.notes),
    imageKey: cleanText(item.imageKey),
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now
  };
  normalized.unitCost = calcUnitCost(normalized);
  return normalized;
}

function normalizeConsumption(record) {
  return {
    id: record.id || createId(),
    date: normalizeDate(record.date) || new Date().toISOString().slice(0, 10),
    project: cleanText(record.project),
    itemId: cleanText(record.itemId),
    itemLabel: cleanText(record.itemLabel),
    grams: parseNumber(record.grams) || 0,
    hours: parseNumber(record.hours) || 0,
    cost: record.cost || null,
    type: cleanText(record.type),
    systemWeight: parseNumber(record.systemWeight) || "",
    actualWeight: parseNumber(record.actualWeight) || "",
    difference: parseNumber(record.difference) || "",
    notes: cleanText(record.notes)
  };
}

function normalizeQueue(task) {
  const now = new Date().toISOString();
  const materials = Array.isArray(task.materials)
    ? task.materials
    : (task.itemId ? [{ itemId: task.itemId, grams: task.grams }] : []);
  const status = queueStatuses.includes(cleanText(task.status)) ? cleanText(task.status) : (cleanText(task.status) === "已取消" ? "取消" : (cleanText(task.status) || "待打印"));
  return {
    id: task.id || createId(),
    name: cleanText(task.name),
    materials: materials.map((material) => ({
      itemId: cleanText(material.itemId),
      grams: parseNumber(material.estimatedWeight ?? material.grams) || 0,
      estimatedWeight: parseNumber(material.estimatedWeight ?? material.grams) || 0,
      actualWeight: material.actualWeight === "" || material.actualWeight === undefined ? "" : (parseNumber(material.actualWeight) || 0)
    })).filter((material) => material.itemId && getMaterialPlannedWeight(material) > 0),
    hours: parseNumber(task.hours) || 0,
    status,
    notes: cleanText(task.notes),
    completedConsumptionId: cleanText(task.completedConsumptionId),
    failureReason: cleanText(task.failureReason),
    failureNotes: cleanText(task.failureNotes),
    failedAt: task.failedAt || "",
    completedAt: task.completedAt || "",
    createdAt: task.createdAt || now,
    updatedAt: task.updatedAt || now
  };
}

function normalizeTrashEntry(entry) {
  return {
    id: entry.id || createId(),
    deletedAt: entry.deletedAt || new Date().toISOString(),
    item: normalizeItem(entry.item || entry.deletedItem || {}),
    relatedConsumptionIds: Array.isArray(entry.relatedConsumptionIds) ? entry.relatedConsumptionIds : [],
    relatedQueueIds: Array.isArray(entry.relatedQueueIds) ? entry.relatedQueueIds : []
  };
}

function persistAll() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  localStorage.setItem(CONSUMPTION_KEY, JSON.stringify(state.consumption));
  localStorage.setItem(QUEUE_KEY, JSON.stringify(state.queue));
  localStorage.setItem(COST_SETTINGS_KEY, JSON.stringify(state.costSettings));
  localStorage.setItem(TRASH_KEY, JSON.stringify(state.trash));
  localStorage.setItem(DUPLICATE_IGNORES_KEY, JSON.stringify(state.duplicateIgnores));
  localStorage.setItem(DUPLICATE_NEGATIVE_RULES_KEY, JSON.stringify(state.duplicateNegativeRules));
  localStorage.setItem(QUALITY_IGNORES_KEY, JSON.stringify(state.qualityIgnores));
  localStorage.setItem(RESTOCK_SETTINGS_KEY, JSON.stringify(state.restockSettings));
  localStorage.setItem(LABEL_SETTINGS_KEY, JSON.stringify(state.labelSettings));
}

function upsertItem(item) {
  const exists = state.items.some((entry) => entry.id === item.id);
  state.items = exists ? state.items.map((entry) => entry.id === item.id ? item : entry) : [item, ...state.items];
}

function loadArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function loadObject(key, fallback) {
  try {
    return { ...fallback, ...(JSON.parse(localStorage.getItem(key) || "{}") || {}) };
  } catch {
    return { ...fallback };
  }
}

function getItem(id) {
  return state.items.find((item) => item.id === id);
}

function ensureFilamentCodes() {
  const used = new Set(state.items.map((item) => item.filamentCode).filter(Boolean));
  let next = Math.max(1, ...[...used].map((code) => {
    const match = `${code}`.match(/FIL-(\d+)/i);
    return match ? Number(match[1]) + 1 : 1;
  }), 1);
  state.items.forEach((item) => {
    if (item.filamentCode) return;
    let code = `FIL-${String(next).padStart(4, "0")}`;
    while (used.has(code)) {
      next += 1;
      code = `FIL-${String(next).padStart(4, "0")}`;
    }
    item.filamentCode = code;
    used.add(code);
    next += 1;
  });
}

function itemLabel(item) {
  return [item.brand, item.material, item.colorName].filter(Boolean).join(" / ") || item.name || item.id;
}

function getMaterialPlannedWeight(material) {
  return numberOrZero(material.estimatedWeight ?? material.grams);
}

function getMaterialActualWeight(material) {
  const actual = material.actualWeight;
  return actual === "" || actual === undefined || actual === null ? getMaterialPlannedWeight(material) : numberOrZero(actual);
}

function calcUnitCost(item) {
  const price = numberOrZero(item.purchasePrice);
  const total = getTotalCapacity(item);
  return price && total ? price / total : 0;
}

function parseWeightQuantity(text) {
  const value = cleanText(text).toLowerCase();
  if (!value) return { totalWeight: 0, quantity: 1 };
  const weightMatch = value.match(/([\d.]+)\s*(kg|g|克|千克)/i);
  const quantityMatch = value.match(/([\d.]+)\s*卷/);
  let totalWeight = 0;
  if (weightMatch) {
    totalWeight = parseFloat(weightMatch[1]) * (/kg|千克/i.test(weightMatch[2]) ? 1000 : 1);
  }
  return {
    totalWeight,
    quantity: quantityMatch ? parseNumber(quantityMatch[1]) : 1
  };
}

function extractDispImageId(value) {
  return cleanText(value).match(/ID_[A-Z0-9]+/)?.[0] || "";
}

function parseRelationships(xml) {
  const map = new Map();
  const regex = /<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g;
  let match;
  while ((match = regex.exec(xml))) map.set(match[1], match[2]);
  return map;
}

async function readZipText(zip, path) {
  const file = zip.file(path);
  return file ? file.async("text") : "";
}

function normalizeZipPath(base, target) {
  const parts = `${base}/${target}`.split("/");
  const stack = [];
  parts.forEach((part) => {
    if (!part || part === ".") return;
    if (part === "..") stack.pop();
    else stack.push(part);
  });
  return stack.join("/");
}

function mimeFromPath(path) {
  if (/\.png$/i.test(path)) return "image/png";
  if (/\.gif$/i.test(path)) return "image/gif";
  if (/\.webp$/i.test(path)) return "image/webp";
  return "image/jpeg";
}

function readAlias(row, aliases) {
  const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), value]));
  for (const alias of aliases) {
    const value = normalized[alias.trim().toLowerCase()];
    if (value !== undefined && value !== null && `${value}`.trim() !== "") return `${value}`.trim();
  }
  return "";
}

function fillSelect(select, defaultLabel, values, selected) {
  select.innerHTML = `<option value="">${defaultLabel}</option>` + values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
  select.value = selected;
}

function fillDatalist(list, values) {
  list.innerHTML = values.map((value) => `<option value="${escapeHtml(value)}"></option>`).join("");
}

function uniqueValues(key) {
  return [...new Set(state.items.map((item) => item[key]).filter(Boolean))].sort((a, b) => `${a}`.localeCompare(`${b}`, "zh-CN"));
}

function compareItems(a, b, key, direction) {
  const modifier = direction === "asc" ? 1 : -1;
  const aValue = a[key] ?? "";
  const bValue = b[key] ?? "";
  const aNumber = parseNumber(aValue);
  const bNumber = parseNumber(bValue);
  if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) return (aNumber - bNumber) * modifier;
  return `${aValue}`.localeCompare(`${bValue}`, "zh-CN", { numeric: true }) * modifier;
}

function getRemainingPercent(item) {
  const total = getTotalCapacity(item);
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((numberOrZero(item.remainingWeight) / total) * 100)));
}

function getTotalCapacity(item) {
  return Math.max(1, numberOrZero(item.quantity) || 1) * Math.max(1, numberOrZero(item.spoolWeight) || 1000);
}

function getStockLevel(item) {
  const capacity = getTotalCapacity(item);
  const remaining = numberOrZero(item.remainingWeight);
  if (remaining > capacity) return "overflow";
  if (remaining <= 0) return "empty";
  const percent = capacity ? (remaining / capacity) * 100 : 0;
  if (percent <= 20) return "danger";
  if (percent <= 50) return "warn";
  return "good";
}

function isLowStock(item) {
  const remaining = numberOrZero(item.remainingWeight);
  return remaining <= 100 || getRemainingPercent(item) <= 20;
}

function getDryWarning(item) {
  if (item.moistureSuspected) return "疑似受潮";
  const material = normalizeToken(item.material);
  if (!/(petg|tpu|pa|pc|nylon)/.test(material)) return "";
  if (!item.openedAt || item.lastDryAt) return item.dryStatus === "建议干燥" ? "建议干燥" : "";
  const openedAt = new Date(item.openedAt);
  if (Number.isNaN(openedAt.getTime())) return "";
  const days = (Date.now() - openedAt.getTime()) / 86400000;
  return days >= 14 ? "建议干燥" : "";
}

function statusTag(status) {
  const value = cleanText(status) || "-";
  const cls = ["打印中", "准备中", "在用"].includes(value) ? "info" :
    ["失败", "已用完", "库存不足"].includes(value) ? "danger" :
    value === "暂停" ? "warn" : "";
  return `<span class="tag ${cls}">${escapeHtml(value)}</span>`;
}

function parseNumber(value) {
  if (value === "" || value === null || value === undefined) return NaN;
  const number = Number(`${value}`.replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? number : NaN;
}

function numberOrZero(value) {
  const number = parseNumber(value);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value) {
  const number = numberOrZero(value);
  return Number.isInteger(number) ? `${number}` : number.toFixed(1);
}

function formatMoney(value) {
  return numberOrZero(value).toFixed(2);
}

function normalizeDate(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const text = `${value}`.trim();
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(text)) {
    const [year, month, day] = text.split("-");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(text)) {
    const [year, month, day] = text.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const numeric = Number(text);
  if (Number.isFinite(numeric) && numeric > 25000 && numeric < 80000) {
    const date = new Date(Math.round((numeric - 25569) * 86400 * 1000));
    return date.toISOString().slice(0, 10);
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function normalizeColor(value) {
  const text = cleanText(value);
  if (/^#[0-9a-f]{6}$/i.test(text)) return text;
  if (/^[0-9a-f]{6}$/i.test(text)) return `#${text}`;
  return "";
}

function normalizeToken(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[＋+]/g, "+")
    .replace(/黑色|雅黑|纯黑/g, "黑")
    .replace(/白色|纯白/g, "白")
    .replace(/红色/g, "红")
    .replace(/蓝色/g, "蓝")
    .replace(/绿色/g, "绿")
    .replace(/黄色/g, "黄")
    .replace(/pla\+|plaplus|plapro/g, "pla+");
}

function normalizeDuplicateValue(value, type = "") {
  const raw = cleanText(value).toLowerCase().replace(/\s+/g, "").replace(/[＋+]/g, "+");
  if (!raw) return "";
  const dictionaries = {
    color: [
      [["黑", "黑色", "black"], "黑色"],
      [["白", "白色", "white"], "白色"],
      [["红", "红色", "red"], "红色"],
      [["蓝", "蓝色", "blue"], "蓝色"],
      [["透明", "clear", "transparent"], "透明"]
    ],
    material: [
      [["plaplus", "pla+", "plapro", "pla-plus", "plaplus"], "PLA+"],
      [["pet-g", "petg"], "PETG"],
      [["abs+", "absplus"], "ABS+"],
      [["tpu", "flexible"], "TPU"]
    ],
    brand: [
      [["易生", "esun"], "eSUN"],
      [["拓竹", "bambu", "bambulab"], "Bambu Lab"]
    ]
  };
  for (const [aliases, normalized] of dictionaries[type] || []) {
    if (aliases.some((alias) => raw === alias || raw.includes(alias))) return normalized;
  }
  return normalizeToken(value);
}

function parseMaterialSignature(value) {
  const raw = cleanText(value);
  const text = raw.toLowerCase().replace(/[＋+]/g, "+").replace(/[_\s]+/g, "-");
  const compact = text.replace(/[^a-z0-9+\u4e00-\u9fa5]/g, "");
  const baseAliases = [
    ["PETG", ["petg", "pet-g"]],
    ["PLA", ["pla"]],
    ["ABS", ["abs"]],
    ["ASA", ["asa"]],
    ["TPU", ["tpu", "flexible"]],
    ["PA", ["pa", "nylon", "尼龙"]],
    ["PC", ["pc"]]
  ];
  const baseMaterial = baseAliases.find(([, aliases]) => aliases.some((alias) => compact.includes(alias.replace(/[^a-z0-9+\u4e00-\u9fa5]/g, ""))))?.[0] || "";
  const modifierMap = [
    ["GF", ["gf", "glassfiber", "玻纤", "玻璃纤维"]],
    ["CF", ["cf", "carbonfiber", "碳纤"]],
    ["HF", ["hf", "highflow", "高速"]],
    ["Matte", ["matte", "哑光"]],
    ["Silk", ["silk", "丝绸", "丝光"]],
    ["Wood", ["wood", "木质", "木"]],
    ["Support", ["support", "支撑"]],
    ["Plus", ["plus", "+", "增强"]],
    ["Pro", ["pro"]]
  ];
  const modifiers = modifierMap
    .filter(([, aliases]) => aliases.some((alias) => compact.includes(alias.replace(/[^a-z0-9+\u4e00-\u9fa5]/g, ""))))
    .map(([name]) => name);
  if (baseMaterial === "PLA" && /\bpla\+/i.test(text)) modifiers.push("Plus");
  const modifierKey = [...new Set(modifiers)].sort().join("+");
  return {
    raw,
    baseMaterial,
    modifiers: [...new Set(modifiers)].sort(),
    modifierKey,
    normalizedLabel: [baseMaterial, modifierKey].filter(Boolean).join("+") || raw
  };
}

function parseColorSignature(value) {
  const raw = cleanText(value);
  const text = raw.toLowerCase().replace(/\s+/g, "");
  const familyMap = [
    ["黑", ["黑", "black"]],
    ["白", ["白", "white"]],
    ["红", ["红", "red"]],
    ["蓝", ["蓝", "blue"]],
    ["绿", ["绿", "green"]],
    ["黄", ["黄", "yellow"]],
    ["灰", ["灰", "grey", "gray"]],
    ["透明", ["透明", "clear", "transparent"]]
  ];
  const shadeMap = [
    ["深", ["深", "dark"]],
    ["浅", ["浅", "light"]],
    ["湖", ["湖"]],
    ["天", ["天"]],
    ["宝石", ["宝石"]],
    ["透明", ["透明", "clear", "transparent"]],
    ["荧光", ["荧光", "fluorescent"]],
    ["金属", ["金属", "metal"]],
    ["丝绸", ["丝绸", "丝光", "silk"]],
    ["哑光", ["哑光", "matte"]]
  ];
  const colorFamily = familyMap.find(([, aliases]) => aliases.some((alias) => text.includes(alias)))?.[0] || "";
  const shades = shadeMap.filter(([, aliases]) => aliases.some((alias) => text.includes(alias))).map(([shade]) => shade);
  const shadeKey = [...new Set(shades)].sort().join("+");
  return {
    raw,
    colorFamily,
    colorShade: [...new Set(shades)].sort(),
    shadeKey,
    normalizedLabel: [shadeKey, colorFamily].filter(Boolean).join("") || raw
  };
}

function materialModifierCap(a, b) {
  const hasOnlySurface = (signature) => signature.modifiers.every((modifier) => ["Matte", "Silk"].includes(modifier));
  if (a.baseMaterial === "PLA" && (hasOnlySurface(a) || hasOnlySurface(b))) return 65;
  return 60;
}

function getNegativeRuleForPair(materialA, materialB, colorA, colorB) {
  const materialRule = materialA.baseMaterial && materialA.baseMaterial === materialB.baseMaterial && materialA.modifierKey !== materialB.modifierKey
    ? `material:${pairKey(materialA.normalizedLabel, materialB.normalizedLabel)}`
    : "";
  const colorRule = colorA.colorFamily && colorA.colorFamily === colorB.colorFamily && colorA.shadeKey !== colorB.shadeKey
    ? `color:${pairKey(colorA.normalizedLabel, colorB.normalizedLabel)}`
    : "";
  if (materialRule && state.duplicateNegativeRules.includes(materialRule)) {
    return { blockedReason: "负向材料规则", hardCap: 0, reason: "已记住该材料组合不是重复" };
  }
  if (colorRule && state.duplicateNegativeRules.includes(colorRule)) {
    return { blockedReason: "负向颜色规则", hardCap: 0, reason: "已记住该颜色组合不是重复" };
  }
  return {};
}

function pairKey(a, b) {
  return [cleanText(a), cleanText(b)].sort((left, right) => left.localeCompare(right, "zh-CN")).join("|");
}

function keywordTokens(value) {
  const normalized = cleanText(value).toLowerCase();
  const tokens = normalized
    .split(/[\s,，;；/\\|_-]+/)
    .map((token) => normalizeDuplicateValue(token, "material") || normalizeDuplicateValue(token, "color") || normalizeToken(token))
    .filter((token) => token && token.length >= 2);
  return [...new Set(tokens)];
}

function textSimilarity(a, b) {
  const left = normalizeToken(a);
  const right = normalizeToken(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.72;
  const leftSet = new Set([...left]);
  const rightSet = new Set([...right]);
  const intersection = [...leftSet].filter((char) => rightSet.has(char)).length;
  const union = new Set([...leftSet, ...rightSet]).size || 1;
  return intersection / union;
}

function guessColor(name) {
  const text = cleanText(name).toLowerCase();
  const colorMap = [
    ["黑", "#111827"], ["白", "#f8fafc"], ["红", "#dc2626"], ["橙", "#f97316"],
    ["黄", "#facc15"], ["绿", "#16a34a"], ["蓝", "#2563eb"], ["紫", "#7c3aed"],
    ["粉", "#ec4899"], ["银", "#b8bec8"], ["灰", "#6b7280"], ["透明", "#dbeafe"],
    ["木", "#b7791f"], ["青铜", "#b7791f"], ["金", "#d4af37"]
  ];
  return colorMap.find(([keyword]) => text.includes(keyword))?.[1] || "#94a3b8";
}

function cleanText(value) {
  return value === null || value === undefined ? "" : `${value}`.trim();
}

function escapeHtml(value) {
  return cleanText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function copyQuoteText() {
  const item = getItem(els.calcItemSelect.value) || state.items[0];
  const grams = numberOrZero(els.calcGramsInput.value);
  const hours = numberOrZero(els.calcHoursInput.value);
  const cost = calculatePrintCost(item, grams, hours);
  const text = [
    `打印报价：${item ? itemLabel(item) : "未选择耗材"}`,
    `预计耗材：${formatNumber(grams)}g，预计时长：${formatNumber(hours)}h`,
    `材料成本：￥${formatMoney(cost.material)}`,
    `机器磨损：￥${formatMoney(cost.wear)}，电费：￥${formatMoney(cost.electricity)}`,
    `人工/模型/后处理/包装：￥${formatMoney(cost.serviceFees)}`,
    `失败损耗：￥${formatMoney(cost.failureLoss)}，利润倍率：${formatNumber(cost.profitMultiplier)}x`,
    `建议报价：￥${formatMoney(cost.total)}`
  ].join("\n");
  copyText(text, "报价文本已复制。");
}

function copyText(text, message = "已复制。") {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast(message)).catch(() => fallbackCopy(text, message));
  } else {
    fallbackCopy(text, message);
  }
}

function fallbackCopy(text, message) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
  showToast(message);
}

function showToast(message, actionLabel = "", action = null) {
  els.toast.innerHTML = `${escapeHtml(message)}${actionLabel ? ` <button class="small-button" type="button">${escapeHtml(actionLabel)}</button>` : ""}`;
  els.toast.classList.remove("hidden");
  if (actionLabel && action) els.toast.querySelector("button").addEventListener("click", () => {
    action();
    els.toast.classList.add("hidden");
  });
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.add("hidden"), 4200);
}

function extensionFromMime(mime) {
  if (/png/i.test(mime)) return "png";
  if (/webp/i.test(mime)) return "webp";
  if (/gif/i.test(mime)) return "gif";
  return "jpg";
}

function downloadBlob(blob, fileName) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

function timestampForFile() {
  return new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
}

function createId() {
  return `fil_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
