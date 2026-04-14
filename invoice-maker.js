const INVOICE_STORAGE_KEY = "taxbro.invoiceDraft.v1";
const DEFAULT_LOGO = new URL("./assets/taxbro-logo.jpeg", window.location.href).href;

const dom = {
  year: document.getElementById("year"),
  footerMeta: document.getElementById("footerMeta"),
  heroItemCount: document.getElementById("heroItemCount"),
  heroTaxMode: document.getElementById("heroTaxMode"),
  heroGrandTotal: document.getElementById("heroGrandTotal"),
  heroDraftState: document.getElementById("heroDraftState"),
  heroPreviewMeta: document.getElementById("heroPreviewMeta"),
  summarySubtotal: document.getElementById("summarySubtotal"),
  summaryGst: document.getElementById("summaryGst"),
  summaryItems: document.getElementById("summaryItems"),
  summaryTotal: document.getElementById("summaryTotal"),
  saveState: document.getElementById("saveState"),
  invoicePreview: document.getElementById("invoicePreview"),
  itemRows: document.getElementById("itemRows"),
  addItemBtn: document.getElementById("addItemBtn"),
  printBtn: document.getElementById("printBtn"),
  csvBtn: document.getElementById("csvBtn"),
  shareBtn: document.getElementById("shareBtn"),
  saveBtn: document.getElementById("saveBtn"),
  resetBtn: document.getElementById("resetBtn"),
  logoFile: document.getElementById("logoFile"),
  signatureFile: document.getElementById("signatureFile"),
};

let autosaveTimer = 0;
let model = loadDraft();

function toIsoDate(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function plusDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function buildInvoiceNumber() {
  const now = new Date();
  const stamp =
    String(now.getFullYear()).slice(-2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 900) + 100);
  return "TB-" + stamp + "-" + random;
}

function createDefaultItem() {
  return {
    description: "",
    hsnSac: "",
    quantity: 1,
    unit: "PCS",
    rate: 0,
    gstRate: 18,
  };
}

function createDefaultModel() {
  return {
    invoiceNumber: buildInvoiceNumber(),
    invoiceDate: toIsoDate(new Date()),
    dueDate: plusDays(7),
    sellerName: "",
    sellerGstin: "",
    sellerAddress: "",
    sellerPhone: "",
    sellerEmail: "",
    buyerName: "",
    buyerGstin: "",
    buyerAddress: "",
    buyerPhone: "",
    buyerEmail: "",
    placeOfSupply: "",
    reverseCharge: false,
    paymentTerms: "Pay within 7 days of invoice date.",
    notes: "Thank you for your business.",
    logoUrl: DEFAULT_LOGO,
    signatureUrl: "",
    items: [createDefaultItem()],
  };
}

function esc(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMultiline(value) {
  return esc(value).replace(/\n/g, "<br />");
}

function parseNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatIndianNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatDisplayDate(value) {
  if (!value) return "Not specified";
  const [year, month, day] = String(value).split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function resolveAssetUrl(value) {
  if (!value) return "";
  try {
    return new URL(value, window.location.href).href;
  } catch (_error) {
    return String(value);
  }
}

function readStateCode(value) {
  const raw = String(value || "").trim().toUpperCase();
  if (!raw) return "";
  if (/^\d{2}/.test(raw)) return raw.slice(0, 2);
  const gstLike = raw.match(/^(\d{2})[A-Z0-9]{5,}$/);
  if (gstLike) return gstLike[1];
  const loose = raw.match(/\b(\d{2})\b/);
  return loose ? loose[1] : "";
}

function isIgstInvoice(data) {
  const sellerState = readStateCode(data.sellerGstin);
  const supplyState = readStateCode(data.placeOfSupply) || readStateCode(data.buyerGstin);
  if (!sellerState || !supplyState) return false;
  return sellerState !== supplyState;
}

const ONES = [
  "Zero",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function smallNumberToWords(value) {
  const num = Math.floor(Math.abs(value));
  if (num < 20) return ONES[num];
  if (num < 100) {
    return TENS[Math.floor(num / 10)] + (num % 10 ? " " + ONES[num % 10] : "");
  }
  if (num < 1000) {
    return ONES[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + smallNumberToWords(num % 100) : "");
  }
  return "";
}

function numberToWords(value) {
  const amount = Math.max(0, Number(value || 0));
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  if (rupees === 0 && paise === 0) return "Zero Rupees Only";

  let remainder = rupees;
  const parts = [];
  const units = [
    { label: "Crore", size: 10000000 },
    { label: "Lakh", size: 100000 },
    { label: "Thousand", size: 1000 },
  ];

  units.forEach((unit) => {
    if (remainder >= unit.size) {
      const count = Math.floor(remainder / unit.size);
      parts.push(smallNumberToWords(count) + " " + unit.label);
      remainder %= unit.size;
    }
  });

  if (remainder > 0) parts.push(smallNumberToWords(remainder));

  let text = parts.join(" ").trim() + " Rupees";
  if (paise > 0) text += " and " + smallNumberToWords(paise) + " Paise";
  return text + " Only";
}

function cloneModel(data) {
  return JSON.parse(JSON.stringify(data));
}

function normalizeItem(item) {
  return {
    description: String(item && item.description ? item.description : ""),
    hsnSac: String(item && item.hsnSac ? item.hsnSac : ""),
    quantity: parseNumber(item && item.quantity, 1),
    unit: String(item && item.unit ? item.unit : "PCS"),
    rate: parseNumber(item && item.rate, 0),
    gstRate: parseNumber(item && item.gstRate, 18),
  };
}

function mergeModel(saved) {
  const base = createDefaultModel();
  const next = saved && typeof saved === "object" ? saved : {};
  const items =
    Array.isArray(next.items) && next.items.length ? next.items.map(normalizeItem) : base.items.map(normalizeItem);
  const merged = Object.assign({}, base, next);
  merged.reverseCharge = Boolean(next.reverseCharge);
  merged.logoUrl = next.logoUrl ? resolveAssetUrl(next.logoUrl) : base.logoUrl;
  merged.signatureUrl = next.signatureUrl ? resolveAssetUrl(next.signatureUrl) : "";
  merged.items = items;
  return merged;
}

function getComputedInvoice(data) {
  const invoice = cloneModel(data);
  let subtotal = 0;
  let totalGst = 0;

  invoice.items = invoice.items.map((item) => {
    const quantity = Math.max(0, parseNumber(item.quantity, 0));
    const rate = Math.max(0, parseNumber(item.rate, 0));
    const gstRate = Math.max(0, parseNumber(item.gstRate, 0));
    const amount = quantity * rate;
    const gstAmount = (amount * gstRate) / 100;

    subtotal += amount;
    totalGst += gstAmount;

    return Object.assign({}, item, {
      quantity,
      rate,
      gstRate,
      amount,
      gstAmount,
    });
  });

  const igstMode = isIgstInvoice(invoice);
  const totalAmount = subtotal + totalGst;

  return Object.assign({}, invoice, {
    subtotal,
    totalGst,
    totalAmount,
    igstMode,
    taxModeLabel: igstMode ? "IGST" : "CGST + SGST",
    igst: igstMode ? totalGst : 0,
    cgst: igstMode ? 0 : totalGst / 2,
    sgst: igstMode ? 0 : totalGst / 2,
    itemCount: invoice.items.length,
    totalInWords: numberToWords(totalAmount),
  });
}

function loadDraft() {
  try {
    const raw = window.localStorage.getItem(INVOICE_STORAGE_KEY);
    if (!raw) return createDefaultModel();
    return mergeModel(JSON.parse(raw));
  } catch (_error) {
    return createDefaultModel();
  }
}

function updateFooterMeta(savedAt) {
  if (!dom.footerMeta) return;
  if (!savedAt) {
    dom.footerMeta.textContent = "Drafts save locally in this browser until you reset them.";
    return;
  }

  dom.footerMeta.textContent =
    "Local draft saved at " +
    savedAt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) +
    ".";
}

function saveDraft(isAuto) {
  try {
    window.localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(model));
    const savedAt = new Date();
    updateFooterMeta(savedAt);
    if (dom.saveState) dom.saveState.textContent = isAuto ? "Saved locally" : "Draft saved";
    if (dom.heroDraftState) dom.heroDraftState.textContent = isAuto ? "Autosaved" : "Manual save";
    if (!isAuto) flashButton(dom.saveBtn, "Saved");
  } catch (_error) {
    if (dom.saveState) dom.saveState.textContent = "Save blocked";
  }
}

function scheduleAutosave() {
  window.clearTimeout(autosaveTimer);
  if (dom.saveState) dom.saveState.textContent = "Saving...";
  autosaveTimer = window.setTimeout(() => saveDraft(true), 260);
}

function flashButton(button, nextLabel) {
  if (!button) return;
  const original = button.textContent;
  button.textContent = nextLabel;
  button.disabled = true;
  window.setTimeout(() => {
    button.textContent = original;
    button.disabled = false;
  }, 900);
}

function syncGeneralInputsFromModel() {
  const fields = document.querySelectorAll("[data-model-field]");
  fields.forEach((field) => {
    const key = field.getAttribute("data-model-field");
    if (!key) return;
    if (field.type === "checkbox") {
      field.checked = Boolean(model[key]);
      return;
    }
    field.value = model[key] || "";
  });
}

function bindGeneralInputs() {
  const fields = document.querySelectorAll("[data-model-field]");
  fields.forEach((field) => {
    field.addEventListener("input", () => {
      const key = field.getAttribute("data-model-field");
      if (!key) return;
      model[key] = field.type === "checkbox" ? Boolean(field.checked) : field.value;
      renderAll();
      scheduleAutosave();
    });
  });
}

function renderItems() {
  if (!dom.itemRows) return;

  dom.itemRows.innerHTML = model.items
    .map((item, index) => {
      const disableRemove = model.items.length === 1 ? " disabled" : "";
      return `
        <div class="invoice-item-row" data-item-index="${index}">
          <div class="invoice-item-head">
            <strong>Item ${index + 1}</strong>
            <button class="invoice-remove-btn" data-remove-item="${index}" type="button"${disableRemove}>Remove</button>
          </div>
          <div class="invoice-item-grid">
            <label class="field">
              <span>Description</span>
              <input class="text-input" data-item-field="description" data-index="${index}" value="${esc(item.description)}" autocomplete="off" />
            </label>
            <label class="field">
              <span>HSN / SAC</span>
              <input class="text-input" data-item-field="hsnSac" data-index="${index}" value="${esc(item.hsnSac)}" autocomplete="off" />
            </label>
            <label class="field">
              <span>Qty</span>
              <input class="text-input" data-item-field="quantity" data-index="${index}" type="number" min="0" step="0.01" value="${esc(item.quantity)}" />
            </label>
            <label class="field">
              <span>Unit</span>
              <input class="text-input" data-item-field="unit" data-index="${index}" value="${esc(item.unit)}" autocomplete="off" />
            </label>
            <label class="field">
              <span>Rate</span>
              <input class="text-input" data-item-field="rate" data-index="${index}" type="number" min="0" step="0.01" value="${esc(item.rate)}" />
            </label>
            <label class="field">
              <span>GST %</span>
              <input class="text-input" data-item-field="gstRate" data-index="${index}" type="number" min="0" step="0.01" value="${esc(item.gstRate)}" />
            </label>
            <label class="field">
              <span>Taxable Value</span>
              <input class="text-input" data-item-amount-index="${index}" value="${formatCurrency(0)}" disabled />
            </label>
          </div>
        </div>
      `;
    })
    .join("");
}

function updateItemAmounts(items) {
  items.forEach((item, index) => {
    const field = document.querySelector('[data-item-amount-index="' + index + '"]');
    if (field) field.value = formatCurrency(item.amount);
  });
}

function bindItemDelegation() {
  if (!dom.itemRows) return;

  dom.itemRows.addEventListener("input", (event) => {
    const field = event.target.closest("[data-item-field]");
    if (!field) return;
    const index = Number(field.getAttribute("data-index"));
    const key = field.getAttribute("data-item-field");
    if (!model.items[index] || !key) return;

    const numericKeys = new Set(["quantity", "rate", "gstRate"]);
    model.items[index][key] = numericKeys.has(key) ? parseNumber(field.value, 0) : field.value;
    renderAll();
    scheduleAutosave();
  });

  dom.itemRows.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-item]");
    if (!button) return;
    const index = Number(button.getAttribute("data-remove-item"));
    if (model.items.length <= 1) return;
    model.items.splice(index, 1);
    renderAll({ rerenderItems: true });
    scheduleAutosave();
  });
}

function buildPreviewMarkup(invoice) {
  const logo = invoice.logoUrl
    ? `<img class="invoice-paper-logo" src="${esc(resolveAssetUrl(invoice.logoUrl))}" alt="Invoice logo" />`
    : "";

  const signature = invoice.signatureUrl
    ? `<img class="invoice-signature" src="${esc(resolveAssetUrl(invoice.signatureUrl))}" alt="Signature" />`
    : `<div class="invoice-signature-empty">Upload signature</div>`;

  const itemRows = invoice.items.length
    ? invoice.items
        .map(
          (item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>
                <strong>${esc(item.description || "Untitled item")}</strong>
                <span>${esc(item.unit || "PCS")}</span>
              </td>
              <td>${esc(item.hsnSac || "-")}</td>
              <td class="is-right">${formatIndianNumber(item.quantity)}</td>
              <td class="is-right">${formatCurrency(item.rate)}</td>
              <td class="is-right">${formatIndianNumber(item.gstRate)}%</td>
              <td class="is-right">${formatCurrency(item.amount)}</td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="7" class="invoice-table-empty">No items added yet.</td></tr>`;

  const taxRows = invoice.igstMode
    ? `
        <tr><td>Subtotal</td><td>${formatCurrency(invoice.subtotal)}</td></tr>
        <tr><td>IGST</td><td>${formatCurrency(invoice.igst)}</td></tr>
      `
    : `
        <tr><td>Subtotal</td><td>${formatCurrency(invoice.subtotal)}</td></tr>
        <tr><td>CGST</td><td>${formatCurrency(invoice.cgst)}</td></tr>
        <tr><td>SGST</td><td>${formatCurrency(invoice.sgst)}</td></tr>
      `;

  return `
    <div class="invoice-paper">
      <div class="invoice-paper-top">
        <div class="invoice-brand-line">
          <div>
            <span class="type-pill">Tax Invoice</span>
            <h3 class="invoice-paper-title">${esc(invoice.sellerName || "Seller Name")}</h3>
            <p>Prepared with TaxBro Invoice Maker</p>
          </div>
          ${logo}
        </div>

        <div class="invoice-paper-meta">
          <div class="invoice-paper-card">
            <span>Invoice No</span>
            <strong>${esc(invoice.invoiceNumber || "Not set")}</strong>
          </div>
          <div class="invoice-paper-card">
            <span>Invoice Date</span>
            <strong>${esc(formatDisplayDate(invoice.invoiceDate))}</strong>
          </div>
          <div class="invoice-paper-card">
            <span>Due Date</span>
            <strong>${esc(formatDisplayDate(invoice.dueDate))}</strong>
          </div>
          <div class="invoice-paper-card">
            <span>Tax Mode</span>
            <strong>${esc(invoice.taxModeLabel)}</strong>
          </div>
        </div>

        ${invoice.reverseCharge ? '<div class="invoice-reverse-pill">Reverse charge applicable</div>' : ""}
      </div>

      <div class="invoice-party-grid">
        <section class="invoice-party-card">
          <span class="status-pill muted">Seller</span>
          <strong>${esc(invoice.sellerName || "Seller name")}</strong>
          <div class="invoice-party-meta">${formatMultiline(invoice.sellerAddress || "Seller address")}</div>
          <div class="invoice-party-meta">GSTIN: ${esc(invoice.sellerGstin || "Not provided")}</div>
          <div class="invoice-party-meta">Phone: ${esc(invoice.sellerPhone || "Not provided")}</div>
          <div class="invoice-party-meta">Email: ${esc(invoice.sellerEmail || "Not provided")}</div>
        </section>

        <section class="invoice-party-card">
          <span class="status-pill muted">Billed To</span>
          <strong>${esc(invoice.buyerName || "Buyer name")}</strong>
          <div class="invoice-party-meta">${formatMultiline(invoice.buyerAddress || "Buyer address")}</div>
          <div class="invoice-party-meta">GSTIN: ${esc(invoice.buyerGstin || "Not provided")}</div>
          <div class="invoice-party-meta">Phone: ${esc(invoice.buyerPhone || "Not provided")}</div>
          <div class="invoice-party-meta">Email: ${esc(invoice.buyerEmail || "Not provided")}</div>
          <div class="invoice-party-meta">Place of supply: ${esc(invoice.placeOfSupply || "Not specified")}</div>
        </section>
      </div>

      <div class="invoice-table-wrap">
        <table class="invoice-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>HSN / SAC</th>
              <th class="is-right">Qty</th>
              <th class="is-right">Rate</th>
              <th class="is-right">GST %</th>
              <th class="is-right">Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
      </div>

      <div class="invoice-total-grid">
        <section class="invoice-notes-card">
          <div class="invoice-notes-block">
            <span>Amount in words</span>
            <strong>${esc(invoice.totalInWords)}</strong>
          </div>
          <div class="invoice-notes-block">
            <span>Payment terms</span>
            <p>${formatMultiline(invoice.paymentTerms || "Not specified")}</p>
          </div>
          <div class="invoice-notes-block">
            <span>Notes</span>
            <p>${formatMultiline(invoice.notes || "No notes added.")}</p>
          </div>
        </section>

        <section class="invoice-summary-card invoice-summary-card-sheet">
          <table class="invoice-summary-table">
            <tbody>
              ${taxRows}
              <tr class="invoice-total-row">
                <td>Total</td>
                <td>${formatCurrency(invoice.totalAmount)}</td>
              </tr>
            </tbody>
          </table>
          <div class="invoice-signature-wrap">
            ${signature}
            <span>Authorized signatory</span>
          </div>
        </section>
      </div>

      <div class="invoice-paper-foot">Powered by TaxBro Invoice Maker</div>
    </div>
  `;
}

function renderAll(options) {
  const next = options || {};
  if (next.syncInputs) syncGeneralInputsFromModel();
  if (next.rerenderItems) renderItems();

  const invoice = getComputedInvoice(model);

  updateItemAmounts(invoice.items);
  if (dom.summarySubtotal) dom.summarySubtotal.textContent = formatCurrency(invoice.subtotal);
  if (dom.summaryGst) dom.summaryGst.textContent = formatCurrency(invoice.totalGst);
  if (dom.summaryItems) dom.summaryItems.textContent = String(invoice.itemCount);
  if (dom.summaryTotal) dom.summaryTotal.textContent = formatCurrency(invoice.totalAmount);
  if (dom.heroItemCount) dom.heroItemCount.textContent = String(invoice.itemCount);
  if (dom.heroTaxMode) dom.heroTaxMode.textContent = invoice.taxModeLabel;
  if (dom.heroGrandTotal) dom.heroGrandTotal.textContent = formatCurrency(invoice.totalAmount);
  if (dom.heroPreviewMeta) {
    dom.heroPreviewMeta.textContent =
      invoice.taxModeLabel + " ready | " + formatCurrency(invoice.totalAmount) + " total";
  }
  if (dom.invoicePreview) dom.invoicePreview.innerHTML = buildPreviewMarkup(invoice);
}

function toCsv() {
  const invoice = getComputedInvoice(model);
  const rows = [
    ["Invoice Number", invoice.invoiceNumber],
    ["Invoice Date", invoice.invoiceDate],
    ["Due Date", invoice.dueDate],
    ["Seller", invoice.sellerName],
    ["Seller GSTIN", invoice.sellerGstin],
    ["Buyer", invoice.buyerName],
    ["Buyer GSTIN", invoice.buyerGstin],
    ["Place of Supply", invoice.placeOfSupply],
    [],
    ["#", "Description", "HSN/SAC", "Qty", "Unit", "Rate", "GST %", "Amount"],
  ];

  invoice.items.forEach((item, index) => {
    rows.push([
      String(index + 1),
      item.description,
      item.hsnSac,
      String(item.quantity),
      item.unit,
      String(item.rate),
      String(item.gstRate),
      String(item.amount),
    ]);
  });

  rows.push([]);
  rows.push(["Subtotal", String(invoice.subtotal)]);
  rows.push([invoice.igstMode ? "IGST" : "CGST", String(invoice.igstMode ? invoice.igst : invoice.cgst)]);
  if (!invoice.igstMode) rows.push(["SGST", String(invoice.sgst)]);
  rows.push(["Total GST", String(invoice.totalGst)]);
  rows.push(["Grand Total", String(invoice.totalAmount)]);

  return rows
    .map((row) =>
      row
        .map((cell) => {
          const safe = String(cell || "").replace(/"/g, '""');
          return '"' + safe + '"';
        })
        .join(",")
    )
    .join("\n");
}

function downloadCsv() {
  const blob = new Blob([toCsv()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = (model.invoiceNumber || "taxbro-invoice") + ".csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  flashButton(dom.csvBtn, "CSV ready");
}

function buildWhatsAppText() {
  const invoice = getComputedInvoice(model);
  const taxLines = invoice.igstMode
    ? ["IGST: " + formatCurrency(invoice.igst)]
    : ["CGST: " + formatCurrency(invoice.cgst), "SGST: " + formatCurrency(invoice.sgst)];

  const itemLines = invoice.items.slice(0, 6).map((item, index) => {
    return (
      String(index + 1) +
      ". " +
      (item.description || "Untitled item") +
      " | Qty " +
      item.quantity +
      " | " +
      formatCurrency(item.amount)
    );
  });

  return [
    "TaxBro Invoice Summary",
    "",
    "Invoice: " + (invoice.invoiceNumber || "Not set"),
    "Date: " + formatDisplayDate(invoice.invoiceDate),
    "Seller: " + (invoice.sellerName || "Not set"),
    "Buyer: " + (invoice.buyerName || "Not set"),
    "Place of Supply: " + (invoice.placeOfSupply || "Not specified"),
    "",
    "Items:",
    itemLines.join("\n"),
    "",
    "Subtotal: " + formatCurrency(invoice.subtotal),
    taxLines.join("\n"),
    "Total GST: " + formatCurrency(invoice.totalGst),
    "Grand Total: " + formatCurrency(invoice.totalAmount),
    "",
    "Generated with TaxBro Invoice Maker",
  ].join("\n");
}

function openWhatsAppShare() {
  const url = "https://wa.me/?text=" + encodeURIComponent(buildWhatsAppText());
  window.open(url, "_blank", "noopener,noreferrer");
  flashButton(dom.shareBtn, "Opened");
}

function printStyles() {
  return `
    body { margin: 0; padding: 28px; background: #eef2f7; font-family: Arial, Helvetica, sans-serif; color: #0b1726; }
    .invoice-paper { max-width: 980px; margin: 0 auto; background: #ffffff; border-radius: 18px; padding: 28px; box-shadow: 0 20px 60px rgba(10, 16, 24, 0.14); }
    .invoice-brand-line, .invoice-party-grid, .invoice-total-grid, .invoice-paper-meta { display: grid; gap: 16px; }
    .invoice-brand-line { grid-template-columns: 1fr 140px; align-items: start; margin-bottom: 18px; }
    .invoice-paper-logo { max-width: 120px; max-height: 72px; object-fit: contain; justify-self: end; }
    .invoice-paper-title { margin: 10px 0 6px; font-size: 28px; line-height: 1.1; }
    .invoice-brand-line p, .invoice-party-meta, .invoice-notes-block p, .invoice-paper-foot { color: #536173; line-height: 1.6; font-size: 13px; }
    .invoice-paper-meta { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 16px; }
    .invoice-paper-card, .invoice-party-card, .invoice-notes-card, .invoice-summary-card-sheet { border: 1px solid #d8e1eb; border-radius: 14px; padding: 14px 16px; background: #f9fbfd; }
    .invoice-paper-card span, .invoice-notes-block span { display: block; color: #6e7d90; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; font-weight: 700; }
    .invoice-paper-card strong, .invoice-party-card strong, .invoice-notes-block strong { display: block; font-size: 15px; }
    .invoice-reverse-pill, .type-pill, .status-pill { display: inline-flex; width: fit-content; padding: 7px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
    .invoice-reverse-pill, .type-pill { background: #0d8f61; color: #ffffff; }
    .status-pill { background: #edf2f7; color: #546275; }
    .invoice-party-grid, .invoice-total-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 20px; }
    .invoice-table-wrap { margin-top: 20px; overflow: hidden; border-radius: 16px; border: 1px solid #d8e1eb; }
    .invoice-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .invoice-table th, .invoice-table td { padding: 12px 10px; border-bottom: 1px solid #e6ecf2; vertical-align: top; }
    .invoice-table thead { background: #0f1c2b; color: #ffffff; }
    .invoice-table tbody tr:nth-child(even) { background: #f7fafc; }
    .invoice-table td span { display: block; margin-top: 6px; color: #718196; font-size: 11px; }
    .is-right { text-align: right; }
    .invoice-summary-table { width: 100%; border-collapse: collapse; }
    .invoice-summary-table td { padding: 10px 0; border-bottom: 1px solid #dfe7ef; }
    .invoice-summary-table td:last-child { text-align: right; font-weight: 700; }
    .invoice-total-row td { font-size: 18px; border-bottom: 0; padding-top: 14px; }
    .invoice-signature-wrap { margin-top: 24px; display: grid; justify-items: end; gap: 8px; }
    .invoice-signature { max-height: 72px; object-fit: contain; }
    .invoice-signature-empty { min-width: 180px; min-height: 58px; border-bottom: 1px solid #bcc7d4; }
    .invoice-paper-foot { margin-top: 24px; padding-top: 14px; border-top: 1px solid #e0e7ef; text-align: center; }
    @media print { body { padding: 0; background: #ffffff; } .invoice-paper { box-shadow: none; border-radius: 0; max-width: none; } }
  `;
}

function openPrintWindow() {
  const invoice = getComputedInvoice(model);
  const previewMarkup = buildPreviewMarkup(invoice);
  const printWindow = window.open("", "_blank", "noopener,noreferrer");

  if (!printWindow) {
    alert("Please allow popups so the invoice can open in a print window.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${esc(invoice.invoiceNumber || "TaxBro Invoice")}</title>
        <style>${printStyles()}</style>
      </head>
      <body>${previewMarkup}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 260);
}

function handleFileUpload(input, fieldName) {
  if (!input) return;
  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      model[fieldName] = String(reader.result || "");
      renderAll();
      scheduleAutosave();
    });
    reader.readAsDataURL(file);
  });
}

function bindButtons() {
  if (dom.addItemBtn) {
    dom.addItemBtn.addEventListener("click", () => {
      model.items.push(createDefaultItem());
      renderAll({ rerenderItems: true });
      scheduleAutosave();
    });
  }

  if (dom.printBtn) dom.printBtn.addEventListener("click", openPrintWindow);
  if (dom.csvBtn) dom.csvBtn.addEventListener("click", downloadCsv);
  if (dom.shareBtn) dom.shareBtn.addEventListener("click", openWhatsAppShare);
  if (dom.saveBtn) dom.saveBtn.addEventListener("click", () => saveDraft(false));

  if (dom.resetBtn) {
    dom.resetBtn.addEventListener("click", () => {
      const okay = window.confirm("Reset this invoice and clear the local draft on this browser?");
      if (!okay) return;
      window.localStorage.removeItem(INVOICE_STORAGE_KEY);
      model = createDefaultModel();
      updateFooterMeta();
      if (dom.saveState) dom.saveState.textContent = "Draft reset";
      if (dom.heroDraftState) dom.heroDraftState.textContent = "Fresh draft";
      renderAll({ syncInputs: true, rerenderItems: true });
    });
  }

  handleFileUpload(dom.logoFile, "logoUrl");
  handleFileUpload(dom.signatureFile, "signatureUrl");
}

function initReveal() {
  const nodes = Array.from(document.querySelectorAll(".reveal"));
  if (!nodes.length) return;

  if (!("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("on"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("on");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  nodes.forEach((node) => observer.observe(node));
}

function initInvoiceMaker() {
  if (dom.year) dom.year.textContent = String(new Date().getFullYear());
  updateFooterMeta();
  syncGeneralInputsFromModel();
  bindGeneralInputs();
  renderItems();
  bindItemDelegation();
  bindButtons();
  renderAll();
  initReveal();
}

initInvoiceMaker();
