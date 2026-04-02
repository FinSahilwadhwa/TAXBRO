const RAW_MCA_DATA = Array.isArray(window.TAXBRO_MCA_DATA) ? window.TAXBRO_MCA_DATA : [];
const MCA_META = window.TAXBRO_MCA_META || {};

const els = {
  year: document.getElementById("year"),
  footerMeta: document.getElementById("footerMeta"),
  heroRateMeta: document.getElementById("heroRateMeta"),
  statTotal: document.getElementById("statTotal"),
  statActivity: document.getElementById("statActivity"),
  statClass: document.getElementById("statClass"),
  statDivision: document.getElementById("statDivision"),

  q: document.getElementById("q"),
  clearBtn: document.getElementById("clearBtn"),

  fAll: document.getElementById("fAll"),
  fActivity: document.getElementById("fActivity"),
  fClass: document.getElementById("fClass"),
  fGroup: document.getElementById("fGroup"),
  fDivision: document.getElementById("fDivision"),

  count: document.getElementById("count"),
  finderNote: document.getElementById("finderNote"),
  rows: document.getElementById("rows"),
  empty: document.getElementById("empty"),
};

const LEVEL_LABELS = {
  ALL: "All levels",
  ACTIVITY: "Activity code",
  CLASS: "Class",
  GROUP: "Group",
  DIVISION: "Division",
};

const LEVEL_WEIGHTS = {
  ACTIVITY: 4,
  CLASS: 3,
  GROUP: 2,
  DIVISION: 1,
};

const state = {
  level: "ALL",
};

const hasFinder = Boolean(
  els.q &&
    els.clearBtn &&
    els.fAll &&
    els.fActivity &&
    els.fClass &&
    els.fGroup &&
    els.fDivision &&
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

const DATASET = RAW_MCA_DATA.map((item) => {
  const searchText = [
    item.title,
    item.classTitle,
    item.groupTitle,
    item.divisionTitle,
    item.sectionTitle,
    item.level,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    code: String(item.code || ""),
    level: String(item.level || ""),
    title: String(item.title || ""),
    sectionCode: String(item.sectionCode || ""),
    sectionTitle: String(item.sectionTitle || ""),
    divisionCode: String(item.divisionCode || ""),
    divisionTitle: String(item.divisionTitle || ""),
    groupCode: String(item.groupCode || ""),
    groupTitle: String(item.groupTitle || ""),
    classCode: String(item.classCode || ""),
    classTitle: String(item.classTitle || ""),
    codeNorm: digitsOnly(item.code),
    levelNorm: norm(item.level),
    titleNorm: norm(item.title),
    searchNorm: norm(searchText),
  };
});

const EXACT_CODE_INDEX = new Map();
DATASET.forEach((item) => {
  if (!EXACT_CODE_INDEX.has(item.codeNorm)) EXACT_CODE_INDEX.set(item.codeNorm, item);
});

const FEATURED_CODES = ["62011", "62012", "56101", "46901", "70200", "68200", "85500", "96097"];
const FEATURED_ITEMS = FEATURED_CODES.map((code) => EXACT_CODE_INDEX.get(code)).filter(Boolean);

function setPressed(button, pressed) {
  if (!button) return;
  button.classList.toggle("is-on", pressed);
  button.setAttribute("aria-pressed", pressed ? "true" : "false");
}

function updateLevel(next) {
  state.level = next;
  setPressed(els.fAll, next === "ALL");
  setPressed(els.fActivity, next === "ACTIVITY");
  setPressed(els.fClass, next === "CLASS");
  setPressed(els.fGroup, next === "GROUP");
  setPressed(els.fDivision, next === "DIVISION");
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

function passesLevelFilter(item) {
  return state.level === "ALL" || item.level === state.level;
}

function getLevelWeight(level) {
  return LEVEL_WEIGHTS[level] || 0;
}

function getTypeBadge(item) {
  return LEVEL_LABELS[item.level] || item.level;
}

function getSectionBadge(item) {
  return item.sectionCode ? "Section " + item.sectionCode : "NIC 2008";
}

function getHierarchyBits(item) {
  const bits = [];

  if (item.sectionCode && item.sectionTitle) {
    bits.push("Section " + item.sectionCode + " - " + item.sectionTitle);
  }
  if (item.divisionCode && item.divisionTitle) {
    bits.push("Division " + item.divisionCode + " - " + item.divisionTitle);
  }
  if (item.groupCode && item.groupTitle && item.groupCode !== item.divisionCode) {
    bits.push("Group " + item.groupCode + " - " + item.groupTitle);
  }
  if (item.classCode && item.classTitle && item.classCode !== item.groupCode) {
    bits.push("Class " + item.classCode + " - " + item.classTitle);
  }

  return bits;
}

function getPathPills(item) {
  const pills = [];

  if (item.divisionCode) pills.push("Division " + item.divisionCode);
  if (item.groupCode) pills.push("Group " + item.groupCode);
  if (item.classCode) pills.push("Class " + item.classCode);
  if (item.sectionCode) pills.push("Section " + item.sectionCode);

  return Array.from(new Set(pills));
}

function baseSearchScore(item, parsed) {
  if (!passesLevelFilter(item)) return -1;

  if (parsed.mode === "EMPTY") return 0;

  if (parsed.mode === "STARTS") {
    const target = parsed.digits || parsed.value;
    if (!target) return -1;
    if (item.codeNorm.indexOf(target) === 0) {
      return 2200 - Math.min(item.codeNorm.length, 90) + getLevelWeight(item.level);
    }
    return -1;
  }

  const query = parsed.value;
  const queryDigits = parsed.digits;
  let score = 0;

  if (queryDigits) {
    if (item.codeNorm === queryDigits) score += 2800;
    else if (item.codeNorm.indexOf(queryDigits) === 0) score += 2200 - Math.min(item.codeNorm.length, 90);
    else if (item.codeNorm.indexOf(queryDigits) >= 0) score += 1500;
  }

  if (item.titleNorm === query) score += 1900;
  else if (item.titleNorm.indexOf(query) === 0) score += 1500;
  else if (item.titleNorm.indexOf(query) >= 0) score += 1100;

  if (item.searchNorm.indexOf(query) >= 0) score += 420;
  if (item.levelNorm === query) score += 240;
  if (item.sectionCode && norm(item.sectionCode) === query) score += 160;

  score += getLevelWeight(item.level) * 10;

  return score > 0 ? score : -1;
}

function buildCopyText(item) {
  const lines = [
    "TaxBro MCA / NIC result",
    "",
    "Code: " + item.code,
    "Level: " + getTypeBadge(item),
    "Title: " + item.title,
  ];

  if (item.sectionCode && item.sectionTitle) {
    lines.push("Section: " + item.sectionCode + " - " + item.sectionTitle);
  }
  if (item.divisionCode && item.divisionTitle) {
    lines.push("Division: " + item.divisionCode + " - " + item.divisionTitle);
  }
  if (item.groupCode && item.groupTitle) {
    lines.push("Group: " + item.groupCode + " - " + item.groupTitle);
  }
  if (item.classCode && item.classTitle) {
    lines.push("Class: " + item.classCode + " - " + item.classTitle);
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
  if (!hasFinder) return;
  els.rows.innerHTML = "";

  results.forEach(({ item }) => {
    const card = document.createElement("article");
    const pathPills = getPathPills(item)
      .map((pill) => `<span class="path-pill">${esc(pill)}</span>`)
      .join("");
    const hierarchyText = getHierarchyBits(item).join(" | ");

    card.className = "result-card";
    card.innerHTML =
      '<div class="result-top">' +
      '<div class="result-code">' +
      esc(item.code) +
      "</div>" +
      '<div class="result-tags">' +
      '<span class="type-pill">' +
      esc(getTypeBadge(item)) +
      "</span>" +
      '<span class="status-pill">' +
      esc(getSectionBadge(item)) +
      "</span>" +
      "</div>" +
      "</div>" +
      '<p class="result-desc">' +
      esc(item.title) +
      "</p>" +
      '<div class="path-stack">' +
      (pathPills ? '<div class="path-row">' + pathPills + "</div>" : "") +
      '<div class="match-note">' +
      esc(hierarchyText || "MCA / NIC 2008 hierarchy entry") +
      (isFeaturedMode ? " | Suggested starter search" : "") +
      "</div>" +
      "</div>" +
      '<div class="result-footer">' +
      '<div class="match-note">Copy this result to reuse the exact code and its parent hierarchy.</div>' +
      '<button class="copy-btn" type="button">Copy</button>' +
      "</div>";

    const copyButton = card.querySelector(".copy-btn");
    copyButton.addEventListener("click", function () {
      copyText(buildCopyText(item)).then(function (ok) {
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
  if (!hasFinder) return;
  els.rows.innerHTML = "";
  els.empty.style.display = "block";

  if (parsed.mode === "EMPTY") {
    els.count.textContent = "0 results";
    els.finderNote.textContent = "Start typing or tap a quick pick to search the MCA / NIC hierarchy.";
    els.empty.innerHTML =
      "<h3>MCA Activity Finder is ready.</h3>" +
      "<p>Search by exact code, partial digits, or business activity text. Examples: <code>62011</code>, <code>software support</code>, <code>starts:47</code>.</p>";
    return;
  }

  els.finderNote.textContent = "No MCA/NIC entries matched the current search and level filter.";
  els.empty.innerHTML =
    "<h3>No matching MCA activity code found.</h3>" +
    "<p>Try a shorter keyword, switch back to <code>All levels</code>, or search a broader prefix like <code>starts:62</code>.</p>";
}

function render() {
  if (!hasFinder) return;
  const parsed = parseQuery(els.q.value);
  els.clearBtn.disabled = parsed.mode === "EMPTY";

  if (parsed.mode === "EMPTY") {
    const featured = FEATURED_ITEMS.filter((item) => passesLevelFilter(item)).map((item) => ({ item })).slice(0, 8);

    if (featured.length === 0) {
      renderEmpty(parsed);
      return;
    }

    els.empty.style.display = "none";
    els.count.textContent = featured.length + " quick-start results";
    els.finderNote.textContent = "Showing useful MCA activity examples so users can start from common business cases.";
    renderCards(featured, true);
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
    if (getLevelWeight(b.item.level) !== getLevelWeight(a.item.level)) {
      return getLevelWeight(b.item.level) - getLevelWeight(a.item.level);
    }
    if (a.item.code.length !== b.item.code.length) return a.item.code.length - b.item.code.length;
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
    "Showing the strongest code and activity matches from " + formatIndianNumber(DATASET.length) + " indexed MCA / NIC entries.";
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
  const totalCount = Number(MCA_META.totalCount || DATASET.length);
  const activityCount = Number(MCA_META.activityCount || DATASET.filter((item) => item.level === "ACTIVITY").length);
  const classCount = Number(MCA_META.classCount || DATASET.filter((item) => item.level === "CLASS").length);
  const divisionCount = Number(MCA_META.divisionCount || DATASET.filter((item) => item.level === "DIVISION").length);

  if (els.year) els.year.textContent = String(new Date().getFullYear());
  if (els.statTotal) els.statTotal.textContent = formatIndianNumber(totalCount);
  if (els.statActivity) els.statActivity.textContent = formatIndianNumber(activityCount);
  if (els.statClass) els.statClass.textContent = formatIndianNumber(classCount);
  if (els.statDivision) els.statDivision.textContent = formatIndianNumber(divisionCount);
  if (els.heroRateMeta) els.heroRateMeta.textContent = formatIndianNumber(activityCount) + " activity codes indexed";
  if (els.footerMeta) {
    els.footerMeta.textContent =
      "Loaded " +
      formatIndianNumber(totalCount) +
      " MCA / NIC entries including " +
      formatIndianNumber(activityCount) +
      " 5-digit activity codes.";
  }
}

hydrateMeta();
initReveal();

if (hasFinder) {
  updateLevel("ALL");

  els.fAll.addEventListener("click", function () {
    updateLevel("ALL");
  });
  els.fActivity.addEventListener("click", function () {
    updateLevel("ACTIVITY");
  });
  els.fClass.addEventListener("click", function () {
    updateLevel("CLASS");
  });
  els.fGroup.addEventListener("click", function () {
    updateLevel("GROUP");
  });
  els.fDivision.addEventListener("click", function () {
    updateLevel("DIVISION");
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
