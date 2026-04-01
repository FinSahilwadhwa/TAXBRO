const RAW_DATA = Array.isArray(window.TAXBRO_DATA) ? window.TAXBRO_DATA : [];
const RAW_RULES = Array.isArray(window.TAXBRO_RATE_RULES) ? window.TAXBRO_RATE_RULES : [];
const META = window.TAXBRO_META || {};

const els = {
  year: document.getElementById("year"),
  footerMeta: document.getElementById("footerMeta"),
  heroRateMeta: document.getElementById("heroRateMeta"),
  statTotal: document.getElementById("statTotal"),
  statHsn: document.getElementById("statHsn"),
  statSac: document.getElementById("statSac"),
  statEffective: document.getElementById("statEffective"),

  q: document.getElementById("q"),
  clearBtn: document.getElementById("clearBtn"),

  fBoth: document.getElementById("fBoth"),
  fHSN: document.getElementById("fHSN"),
  fSAC: document.getElementById("fSAC"),

  rAll: document.getElementById("rAll"),
  rUpdated: document.getElementById("rUpdated"),

  count: document.getElementById("count"),
  finderNote: document.getElementById("finderNote"),
  rows: document.getElementById("rows"),
  empty: document.getElementById("empty"),
};

const state = {
  type: "ALL", // ALL | HSN | SAC
  rateMode: "ALL", // ALL | UPDATED
};

const quickChips = Array.from(document.querySelectorAll(".quick-chip[data-q]"));

const STOP_WORDS = new Set([
  "all",
  "goods",
  "other",
  "than",
  "with",
  "from",
  "that",
  "this",
  "these",
  "those",
  "their",
  "thereof",
  "including",
  "included",
  "prepared",
  "whether",
  "labeled",
  "labelled",
  "pre",
  "packaged",
  "pack",
  "made",
  "item",
  "items",
  "goodsi",
]);

function norm(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatIndianNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatDateIso(isoDate) {
  if (!isoDate) return "Not specified";
  const [y, m, d] = String(isoDate).split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function tokenizeRule(text) {
  return norm(text)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 3 && !STOP_WORDS.has(token));
}

const DATASET = RAW_DATA.map((item) => ({
  code: String(item.code || ""),
  type: String(item.type || ""),
  desc: String(item.desc || ""),
  codeNorm: digitsOnly(item.code),
  descNorm: norm(item.desc),
}));

const EXACT_CODE_INDEX = new Map();
for (const item of DATASET) {
  if (!EXACT_CODE_INDEX.has(item.codeNorm)) EXACT_CODE_INDEX.set(item.codeNorm, item);
}

const RATE_RULES = RAW_RULES.map((rule) => {
  const prefixesNorm = Array.from(
    new Set((Array.isArray(rule.prefixes) ? rule.prefixes : []).map((prefix) => digitsOnly(prefix)).filter(Boolean))
  );
  const labelNorm = norm(rule.label);
  const rawNorm = norm(rule.raw);
  const keywords = Array.from(new Set(tokenizeRule(rule.label).concat(tokenizeRule(rule.raw))));
  const maxPrefixLength = prefixesNorm.reduce((max, prefix) => Math.max(max, prefix.length), 0);

  return {
    raw: String(rule.raw || ""),
    label: String(rule.label || ""),
    oldRate: String(rule.oldRate || ""),
    newRate: String(rule.newRate || ""),
    effectiveDate: String(rule.effectiveDate || ""),
    prefixesNorm,
    labelNorm,
    rawNorm,
    keywords,
    maxPrefixLength,
  };
}).filter((rule) => rule.prefixesNorm.length > 0);

function getRateMatches(item) {
  const matches = [];
  const itemCode = item.codeNorm;
  const itemDesc = item.descNorm;

  for (const rule of RATE_RULES) {
    let matchedPrefix = "";
    for (const prefix of rule.prefixesNorm) {
      if (itemCode.startsWith(prefix) && prefix.length > matchedPrefix.length) {
        matchedPrefix = prefix;
      }
    }
    if (!matchedPrefix) continue;

    let keywordHits = 0;
    for (const keyword of rule.keywords) {
      if (itemDesc.includes(keyword)) keywordHits += 1;
    }

    let score = matchedPrefix.length * 100;
    if (rule.labelNorm) {
      if (itemDesc.includes(rule.labelNorm)) {
        score += 140;
      } else if (keywordHits > 0) {
        score += keywordHits * 18;
      } else {
        score -= 24;
      }
    }
    if (rule.rawNorm && itemDesc.includes(rule.rawNorm)) score += 80;

    matches.push({
      raw: rule.raw,
      label: rule.label,
      oldRate: rule.oldRate,
      newRate: rule.newRate,
      effectiveDate: rule.effectiveDate,
      prefixesNorm: rule.prefixesNorm,
      labelNorm: rule.labelNorm,
      rawNorm: rule.rawNorm,
      keywords: rule.keywords,
      maxPrefixLength: rule.maxPrefixLength,
      matchedPrefix,
      matchScore: score,
    });
  }

  matches.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    if (b.matchedPrefix.length !== a.matchedPrefix.length) return b.matchedPrefix.length - a.matchedPrefix.length;
    return a.raw.localeCompare(b.raw);
  });

  const deduped = [];
  const seen = new Set();
  for (const match of matches) {
    const key = [match.raw, match.newRate, match.oldRate, match.effectiveDate].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(match);
    if (deduped.length >= 3) break;
  }

  return deduped;
}

const FEATURED_ITEMS = (() => {
  const out = [];
  const seenCodes = new Set();
  const sortedRules = RATE_RULES.slice().sort((a, b) => b.maxPrefixLength - a.maxPrefixLength);

  for (const rule of sortedRules) {
    const exactPrefix = rule.prefixesNorm.find((prefix) => EXACT_CODE_INDEX.has(prefix));
    if (!exactPrefix) continue;
    if (seenCodes.has(exactPrefix)) continue;
    const item = EXACT_CODE_INDEX.get(exactPrefix);
    if (!item) continue;
    seenCodes.add(exactPrefix);
    out.push(item);
    if (out.length >= 12) break;
  }
  return out;
})();

function setPressed(button, pressed) {
  button.classList.toggle("is-on", pressed);
  button.setAttribute("aria-pressed", pressed ? "true" : "false");
}

function updateTypeFilter(next) {
  state.type = next;
  setPressed(els.fBoth, next === "ALL");
  setPressed(els.fHSN, next === "HSN");
  setPressed(els.fSAC, next === "SAC");
  render();
}

function updateRateFilter(next) {
  state.rateMode = next;
  setPressed(els.rAll, next === "ALL");
  setPressed(els.rUpdated, next === "UPDATED");
  render();
}

function parseQuery(raw) {
  const value = norm(raw);
  if (!value) return { mode: "EMPTY", value: "", digits: "" };
  if (value.startsWith("starts:")) {
    const next = norm(value.slice("starts:".length));
    return { mode: "STARTS", value: next, digits: digitsOnly(next) };
  }
  return { mode: "SEARCH", value, digits: digitsOnly(value) };
}

function passesTypeFilter(item) {
  return state.type === "ALL" || item.type === state.type;
}

function baseSearchScore(item, parsed) {
  if (!passesTypeFilter(item)) return -1;

  if (parsed.mode === "EMPTY") return 0;

  if (parsed.mode === "STARTS") {
    const target = parsed.digits || parsed.value;
    if (!target) return -1;
    if (item.codeNorm.startsWith(target)) {
      return 1700 - Math.min(item.codeNorm.length, 90);
    }
    return -1;
  }

  const query = parsed.value;
  const queryDigits = parsed.digits;
  let score = 0;

  if (queryDigits) {
    if (item.codeNorm === queryDigits) score += 2200;
    else if (item.codeNorm.startsWith(queryDigits)) score += 1800 - Math.min(item.codeNorm.length, 90);
    else if (item.codeNorm.includes(queryDigits)) score += 1200;
  }

  if (item.descNorm.startsWith(query)) score += 1400;
  else if (item.descNorm.includes(query)) score += 920;

  if (item.type.toLowerCase() === query) score += 400;

  return score > 0 ? score : -1;
}

function buildCopyText(item, rateMatches) {
  const firstMatch = rateMatches[0];
  const lines = [
    "TaxBro result",
    "",
    "Code: " + item.code,
    "Type: " + item.type,
    "Description: " + item.desc,
  ];

  if (firstMatch) {
    lines.push("Current rate: " + firstMatch.newRate);
    lines.push("Previous rate: " + firstMatch.oldRate);
    lines.push("Effective date: " + formatDateIso(firstMatch.effectiveDate));
    lines.push("Matched rule: " + (firstMatch.label || firstMatch.raw));
  } else {
    lines.push("Rate note: No mapped update found in supplied rate sheet");
  }

  return lines.join("\n");
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

function renderCards(results, isFeaturedMode) {
  els.rows.innerHTML = "";

  results.forEach(({ item, rateMatches }) => {
    const firstMatch = rateMatches[0] || null;
    const moreCount = Math.max(rateMatches.length - 1, 0);

    const card = document.createElement("article");
    card.className = "result-card";

    const matchText = firstMatch
      ? [
          "Best rule: " + esc(firstMatch.label || firstMatch.raw),
          "Effective " + esc(formatDateIso(firstMatch.effectiveDate)),
          moreCount > 0 ? "+" + moreCount + " more similar match" + (moreCount > 1 ? "es" : "") : "",
        ]
          .filter(Boolean)
          .join(" | ")
      : item.type === "SAC"
        ? "No SAC rate mapping found in the supplied update sheet."
        : "No mapped rate update found in the supplied sheet for this code.";

    card.innerHTML =
      '<div class="result-top">' +
      '<div class="result-code">' +
      esc(item.code) +
      "</div>" +
      '<div class="result-tags">' +
      '<span class="type-pill">' +
      esc(item.type) +
      "</span>" +
      '<span class="status-pill ' +
      (firstMatch ? "" : "muted") +
      '">' +
      (firstMatch ? "Updated" : "Unmapped") +
      "</span>" +
      "</div>" +
      "</div>" +
      '<p class="result-desc">' +
      esc(item.desc) +
      "</p>" +
      '<div class="rate-band">' +
      (firstMatch
        ? '<div class="rate-box is-new"><strong>' +
          esc(firstMatch.newRate) +
          '</strong><span>Current GST</span></div>' +
          '<div class="rate-box is-old"><strong>' +
          esc(firstMatch.oldRate) +
          '</strong><span>Previous GST</span></div>'
        : '<div class="rate-box unknown"><strong>Check source</strong><span>Rate not present in supplied update sheet</span></div>') +
      "</div>" +
      '<div class="result-footer">' +
      '<div class="match-note">' +
      matchText +
      (isFeaturedMode ? " | Highlighted from the update sheet" : "") +
      "</div>" +
      '<button class="copy-btn" type="button">Copy</button>' +
      "</div>";

    const copyButton = card.querySelector(".copy-btn");
    copyButton.addEventListener("click", function () {
      copyText(buildCopyText(item, rateMatches)).then(function (ok) {
        copyButton.textContent = ok ? "Copied" : "Copy failed";
        setTimeout(function () {
          copyButton.textContent = "Copy";
        }, 1200);
      });
    });

    els.rows.appendChild(card);
  });
}

function renderEmpty(parsed) {
  els.rows.innerHTML = "";
  els.empty.style.display = "block";

  if (parsed.mode === "EMPTY") {
    els.count.textContent = "0 results";
    els.finderNote.textContent = "Start typing or tap a quick pick to search the full master list.";
    els.empty.innerHTML =
      "<h3>TaxBro is ready.</h3>" +
      "<p>Search by exact code, partial code, or description. Examples: <code>9983</code>, <code>paneer</code>, <code>courier</code>, <code>starts:040</code>.</p>";
    return;
  }

  els.finderNote.textContent = "No results matched the current search and filter combination.";
  els.empty.innerHTML =
    "<h3>No matching codes found.</h3>" +
    "<p>Try a shorter search, switch back to <code>All results</code>, or search using a code prefix like <code>starts:21</code>.</p>";
}

function render() {
  const parsed = parseQuery(els.q.value);
  els.clearBtn.disabled = parsed.mode === "EMPTY";

  if (parsed.mode === "EMPTY") {
    const featured = FEATURED_ITEMS.filter((item) => passesTypeFilter(item))
      .map((item) => ({ item, rateMatches: getRateMatches(item) }))
      .filter((entry) => state.rateMode === "ALL" || entry.rateMatches.length > 0)
      .slice(0, 12);

    if (featured.length === 0) {
      renderEmpty(parsed);
      return;
    }

    els.empty.style.display = "none";
    els.count.textContent = featured.length + " highlighted codes";
    els.finderNote.textContent = "Showing curated highlights from the supplied 2025 update sheet.";
    renderCards(featured, true);
    return;
  }

  const matches = [];

  for (const item of DATASET) {
    const score = baseSearchScore(item, parsed);
    if (score < 0) continue;

    const rateMatches = getRateMatches(item);
    if (state.rateMode === "UPDATED" && rateMatches.length === 0) continue;

    const finalScore = score + (rateMatches[0] ? Math.min(rateMatches[0].matchScore, 220) : 0);
    matches.push({ item, rateMatches, score: finalScore });
  }

  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.item.codeNorm.length !== a.item.codeNorm.length) return b.item.codeNorm.length - a.item.codeNorm.length;
    return a.item.code.localeCompare(b.item.code);
  });

  const sliced = matches.slice(0, 36);

  if (sliced.length === 0) {
    renderEmpty(parsed);
    return;
  }

  els.empty.style.display = "none";
  els.count.textContent = sliced.length + " results";
  els.finderNote.textContent =
    "Showing the strongest code and keyword matches from " +
    formatIndianNumber(DATASET.length) +
    " indexed records.";

  renderCards(sliced, false);
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
  const hsnCount = Number(META.hsnCount || DATASET.filter((item) => item.type === "HSN").length);
  const sacCount = Number(META.sacCount || DATASET.filter((item) => item.type === "SAC").length);
  const totalCount = hsnCount + sacCount;
  const effectiveLabel = formatDateIso(META.effectiveDate || "2025-09-22");

  els.year.textContent = String(new Date().getFullYear());
  els.statTotal.textContent = formatIndianNumber(totalCount);
  els.statHsn.textContent = formatIndianNumber(hsnCount);
  els.statSac.textContent = formatIndianNumber(sacCount);
  els.statEffective.textContent = effectiveLabel;
  els.heroRateMeta.textContent = (META.rateRuleCount || RATE_RULES.length) + " update rules active";
  els.footerMeta.textContent =
    "Loaded " +
    formatIndianNumber(totalCount) +
    " codes and " +
    formatIndianNumber(META.rateRuleCount || RATE_RULES.length) +
    " rate-update rules from your supplied files.";
}

hydrateMeta();

els.fBoth.addEventListener("click", () => updateTypeFilter("ALL"));
els.fHSN.addEventListener("click", () => updateTypeFilter("HSN"));
els.fSAC.addEventListener("click", () => updateTypeFilter("SAC"));

els.rAll.addEventListener("click", () => updateRateFilter("ALL"));
els.rUpdated.addEventListener("click", () => updateRateFilter("UPDATED"));

els.q.addEventListener("input", render);
els.q.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    els.q.value = "";
    render();
  }
});

els.clearBtn.addEventListener("click", () => {
  els.q.value = "";
  render();
  els.q.focus();
});

quickChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    els.q.value = chip.getAttribute("data-q") || "";
    render();
    els.q.focus();
  });
});

render();
initReveal();
