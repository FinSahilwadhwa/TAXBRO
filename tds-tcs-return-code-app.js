const RAW_RETURN_CODES = Array.isArray(window.TAXBRO_RETURN_CODE_DATA) ? window.TAXBRO_RETURN_CODE_DATA : [];
const RETURN_CODE_META = window.TAXBRO_RETURN_CODE_META || {};

const els = {
  year: document.getElementById("year"),
  footerMeta: document.getElementById("footerMeta"),
  heroRateMeta: document.getElementById("heroRateMeta"),
  statTotal: document.getElementById("statTotal"),
  statTds: document.getElementById("statTds"),
  statTcs: document.getElementById("statTcs"),
  statAct: document.getElementById("statAct"),
  q: document.getElementById("q"),
  clearBtn: document.getElementById("clearBtn"),
  topMatch: document.getElementById("topMatch"),
  fAll: document.getElementById("fAll"),
  fTds: document.getElementById("fTds"),
  fTcs: document.getElementById("fTcs"),
  count: document.getElementById("count"),
  finderNote: document.getElementById("finderNote"),
  rows: document.getElementById("rows"),
  empty: document.getElementById("empty"),
};

const state = {
  category: "ALL",
};

const hasFinder = Boolean(
  els.q &&
    els.clearBtn &&
    els.topMatch &&
    els.fAll &&
    els.fTds &&
    els.fTcs &&
    els.count &&
    els.finderNote &&
    els.rows &&
    els.empty
);

const quickChips = Array.from(document.querySelectorAll(".quick-chip[data-q]"));

function norm(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatIndianNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function inferCategory(item) {
  return /^206/i.test(item.oldSection) ? "TCS" : "TDS";
}

const DATASET = RAW_RETURN_CODES.map((item) => {
  const category = inferCategory(item);
  const searchText = [
    item.code,
    item.oldSection,
    item.newSection,
    item.nature,
    item.rate,
    item.threshold,
    category,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    code: String(item.code || ""),
    oldSection: String(item.oldSection || ""),
    nature: String(item.nature || ""),
    newSection: String(item.newSection || ""),
    rate: String(item.rate || ""),
    threshold: String(item.threshold || ""),
    category,
    codeNorm: digitsOnly(item.code),
    oldSectionNorm: norm(item.oldSection),
    newSectionNorm: norm(item.newSection),
    natureNorm: norm(item.nature),
    searchNorm: norm(searchText),
  };
});

const EXACT_CODE_INDEX = new Map();
DATASET.forEach((item) => {
  if (!EXACT_CODE_INDEX.has(item.codeNorm)) EXACT_CODE_INDEX.set(item.codeNorm, item);
});

const FEATURED_CODES = ["1005", "1006", "1023", "1027", "1031", "1035", "1058", "1067"];
const FEATURED_ITEMS = FEATURED_CODES.map((code) => EXACT_CODE_INDEX.get(code)).filter(Boolean);

function setPressed(button, pressed) {
  if (!button) return;
  button.classList.toggle("is-on", pressed);
  button.setAttribute("aria-pressed", pressed ? "true" : "false");
}

function updateCategory(next) {
  state.category = next;
  setPressed(els.fAll, next === "ALL");
  setPressed(els.fTds, next === "TDS");
  setPressed(els.fTcs, next === "TCS");
  render();
}

function parseQuery(raw) {
  const value = norm(raw);
  if (!value) return { mode: "EMPTY", value: "", digits: "" };
  if (value.indexOf("starts:") === 0) {
    const next = norm(value.slice("starts:".length));
    return { mode: "STARTS", value: next, digits: digitsOnly(next) };
  }
  return { mode: "SEARCH", value, digits: digitsOnly(value) };
}

function passesCategoryFilter(item) {
  return state.category === "ALL" || item.category === state.category;
}

function baseSearchScore(item, parsed) {
  if (!passesCategoryFilter(item)) return -1;
  if (parsed.mode === "EMPTY") return 0;

  if (parsed.mode === "STARTS") {
    const target = parsed.digits || parsed.value;
    if (!target) return -1;
    if (item.codeNorm.indexOf(target) === 0 || digitsOnly(item.oldSection).indexOf(target) === 0) {
      return 2200 - Math.min(item.codeNorm.length, 80);
    }
    return -1;
  }

  const query = parsed.value;
  const queryDigits = parsed.digits;
  let score = 0;

  if (queryDigits) {
    if (item.codeNorm === queryDigits) score += 2800;
    else if (item.codeNorm.indexOf(queryDigits) === 0) score += 2200;
    else if (item.codeNorm.indexOf(queryDigits) >= 0) score += 1500;

    const oldDigits = digitsOnly(item.oldSection);
    const newDigits = digitsOnly(item.newSection);
    if (oldDigits === queryDigits) score += 1800;
    else if (oldDigits.indexOf(queryDigits) >= 0) score += 900;
    if (newDigits.indexOf(queryDigits) >= 0) score += 320;
  }

  if (item.oldSectionNorm === query) score += 1700;
  else if (item.oldSectionNorm.indexOf(query) >= 0) score += 900;

  if (item.natureNorm === query) score += 1600;
  else if (item.natureNorm.indexOf(query) === 0) score += 1300;
  else if (item.natureNorm.indexOf(query) >= 0) score += 900;

  if (item.searchNorm.indexOf(query) >= 0) score += 320;
  if (norm(item.category) === query) score += 180;

  return score > 0 ? score : -1;
}

function buildCopyText(item) {
  return [
    "TaxBro TDS/TCS return code result",
    "",
    "Return code: " + item.code,
    "Category: " + item.category,
    "Old section: " + item.oldSection,
    "New section: " + item.newSection,
    "Nature: " + item.nature,
    "Rate: " + item.rate,
    "Threshold: " + item.threshold,
  ].join("\n");
}

function fallbackCopyText(text) {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return Promise.resolve(ok);
  } catch (_) {
    return Promise.resolve(false);
  }
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard
      .writeText(text)
      .then(function () {
        return true;
      })
      .catch(function () {
        return fallbackCopyText(text);
      });
  }
  return fallbackCopyText(text);
}

function getCardHtml(item, note) {
  return (
    '<div class="result-top">' +
    '<div class="result-code">' +
    esc(item.code) +
    "</div>" +
    '<div class="result-tags">' +
    '<span class="type-pill">' +
    esc(item.category) +
    "</span>" +
    '<span class="status-pill">' +
    esc(item.rate || "Rate not stated") +
    "</span>" +
    "</div>" +
    "</div>" +
    '<p class="result-desc">' +
    esc(item.nature) +
    "</p>" +
    '<div class="path-stack">' +
    '<div class="path-row">' +
    '<span class="path-pill">Old section ' +
    esc(item.oldSection) +
    "</span>" +
    '<span class="path-pill">New section ' +
    esc(item.newSection) +
    "</span>" +
    '<span class="path-pill">Threshold ' +
    esc(item.threshold || "-") +
    "</span>" +
    "</div>" +
    '<div class="match-note">' +
    esc(note) +
    "</div>" +
    "</div>" +
    '<div class="result-footer">' +
    '<div class="match-note">Copy this result for return working papers or client notes.</div>' +
    '<button class="copy-btn" type="button">Copy</button>' +
    "</div>"
  );
}

function attachCopyButton(card, item) {
  const copyButton = card.querySelector(".copy-btn");
  if (!copyButton) return;
  copyButton.addEventListener("click", function () {
    copyText(buildCopyText(item)).then(function (ok) {
      copyButton.textContent = ok ? "Copied" : "Copy failed";
      setTimeout(function () {
        copyButton.textContent = "Copy";
      }, 1200);
    });
  });
}

function renderTopMatch(result, parsed, isFeaturedMode) {
  if (!hasFinder) return;

  if (!result) {
    els.topMatch.innerHTML =
      '<div class="top-match-empty">' +
      '<span class="top-match-kicker">Best match</span>' +
      "<strong>Search a return code, old section, or payment nature.</strong>" +
      "<p>The closest matching record will appear here first, so users get an answer before browsing similar rows.</p>" +
      "</div>";
    return;
  }

  const item = result.item;
  const label = isFeaturedMode ? "Suggested result" : "Best match for " + (parsed.value || parsed.digits || "your search");
  const card = document.createElement("article");
  card.className = "result-card top-match-card";
  card.innerHTML =
    '<div class="top-match-label">' +
    '<span class="eyebrow-dot" aria-hidden="true"></span>' +
    esc(label) +
    "</div>" +
    getCardHtml(item, isFeaturedMode ? "Popular return-code starter from the supplied PDF" : "Highest-ranked match from return code, section, and payment nature");
  els.topMatch.innerHTML = "";
  els.topMatch.appendChild(card);
  attachCopyButton(card, item);
}

function renderCards(results, isFeaturedMode) {
  if (!hasFinder) return;
  els.rows.innerHTML = "";

  results.forEach(({ item }) => {
    const card = document.createElement("article");
    card.className = "result-card";
    card.innerHTML = getCardHtml(
      item,
      isFeaturedMode ? "Suggested starter result" : "Similar match from return code, section, or nature of payment"
    );
    attachCopyButton(card, item);

    els.rows.appendChild(card);
  });
}

function renderEmpty(parsed) {
  if (!hasFinder) return;
  els.rows.innerHTML = "";
  els.empty.style.display = "block";

  if (parsed.mode === "EMPTY") {
    renderTopMatch(null, parsed, false);
    els.count.textContent = "0 results";
    els.finderNote.textContent = "Start typing or tap a quick pick to search return codes.";
    els.empty.innerHTML =
      "<h3>Return Code Finder is ready.</h3>" +
      "<p>Search by return code, old section, new section, or payment nature. Examples: <code>1006</code>, <code>194C</code>, <code>commission</code>, <code>starts:10</code>.</p>";
    return;
  }

  els.count.textContent = "0 results";
  renderTopMatch(null, parsed, false);
  els.finderNote.textContent = "No return-code entries matched the current search and filter.";
  els.empty.innerHTML =
    "<h3>No matching return code found.</h3>" +
    "<p>Try a shorter keyword, switch back to <code>All</code>, or search by old section like <code>194J</code>.</p>";
}

function render() {
  if (!hasFinder) return;
  const parsed = parseQuery(els.q.value);
  els.clearBtn.disabled = parsed.mode === "EMPTY";

  if (parsed.mode === "EMPTY") {
    const featured = FEATURED_ITEMS.filter((item) => passesCategoryFilter(item)).map((item) => ({ item })).slice(0, 8);
    if (featured.length === 0) {
      renderEmpty(parsed);
      return;
    }
    renderTopMatch(featured[0], parsed, true);
    els.empty.style.display = "none";
    els.count.textContent = Math.max(featured.length - 1, 0) + " similar quick-start results";
    els.finderNote.textContent = "Browse related examples below, or type above to promote the closest match.";
    renderCards(featured.slice(1), true);
    return;
  }

  const matches = [];
  DATASET.forEach((item) => {
    const score = baseSearchScore(item, parsed);
    if (score < 0) return;
    matches.push({ item, score });
  });

  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.item.code.localeCompare(b.item.code);
  });

  const sliced = matches.slice(0, 12);
  if (sliced.length === 0) {
    renderEmpty(parsed);
    return;
  }

  const topResult = sliced[0];
  const similarResults = sliced.slice(1);
  renderTopMatch(topResult, parsed, false);
  els.empty.style.display = "none";
  els.count.textContent = similarResults.length + " similar results";
  els.finderNote.textContent =
    "Best match is shown above the search bar. These are the next closest matches from " +
    formatIndianNumber(DATASET.length) +
    " indexed return-code entries.";
  renderCards(similarResults, false);
}

function initReveal() {
  const nodes = Array.from(document.querySelectorAll(".reveal"));
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

function hydrateMeta() {
  const totalCount = Number(RETURN_CODE_META.totalCount || DATASET.length);
  const tdsCount = DATASET.filter((item) => item.category === "TDS").length;
  const tcsCount = DATASET.filter((item) => item.category === "TCS").length;

  if (els.year) els.year.textContent = String(new Date().getFullYear());
  if (els.statTotal) els.statTotal.textContent = formatIndianNumber(totalCount);
  if (els.statTds) els.statTds.textContent = formatIndianNumber(tdsCount);
  if (els.statTcs) els.statTcs.textContent = formatIndianNumber(tcsCount);
  if (els.statAct) els.statAct.textContent = RETURN_CODE_META.newActLabel || "Income-tax Act, 2025";
  if (els.heroRateMeta) els.heroRateMeta.textContent = formatIndianNumber(totalCount) + " return codes indexed";
  if (els.footerMeta) {
    els.footerMeta.textContent =
      "Loaded " + formatIndianNumber(totalCount) + " return-code entries from " + (RETURN_CODE_META.source || "the supplied PDF") + ".";
  }
}

hydrateMeta();
initReveal();

if (hasFinder) {
  updateCategory("ALL");

  els.fAll.addEventListener("click", function () {
    updateCategory("ALL");
  });
  els.fTds.addEventListener("click", function () {
    updateCategory("TDS");
  });
  els.fTcs.addEventListener("click", function () {
    updateCategory("TCS");
  });

  els.q.addEventListener("input", render);
  els.q.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      els.q.value = "";
      render();
    }
  });

  els.clearBtn.addEventListener("click", function () {
    els.q.value = "";
    render();
    els.q.focus();
  });

  quickChips.forEach((chip) => {
    chip.addEventListener("click", function () {
      els.q.value = chip.getAttribute("data-q") || "";
      render();
      els.q.focus();
    });
  });

  render();
}
