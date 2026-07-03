const RAW_DATA = Array.isArray(window.TAXBRO_DATA) ? window.TAXBRO_DATA : [];
const RAW_RULES = Array.isArray(window.TAXBRO_RATE_RULES) ? window.TAXBRO_RATE_RULES : [];
const META = window.TAXBRO_META || {};
const PAGE_DATA = document.body ? document.body.dataset || {} : {};
const COUNTRY_STORAGE_KEY = "taxbroSelectedCountry";

const COUNTRY_CONTENT = {
  IN: {
    brandTagline: "HSN, SAC + MCA code tools for India",
    navPrimaryOne: "Finder",
    navPrimaryOneHref: "./hsn-sac-finder.html",
    navPrimaryTwo: "MCA Codes",
    navPrimaryTwoHref: "./mca-activity-code-finder.html",
    navPrimaryThree: "Invoices",
    navPrimaryThreeHref: "./invoice-maker.html",
    navPrimaryFour: "SBI TT Rates",
    navPrimaryFourHref: "./sbi-tt-rates.html",
    navPrimaryFive: "Services",
    navPrimaryFiveHref: "#services",
    navPrimarySix: "Blog",
    navPrimarySixHref: "#blog",
    navPrimarySeven: "e-Stamp",
    navPrimarySevenHref: "./e-stamp-paper-online.html",
    navCta: "WhatsApp",
    navCtaHref: "https://wa.link/u67tem",
    heroEyebrow: "Full HSN + SAC master loaded",
    heroTitle:
      "Find HSN and SAC codes, <span>then convert demand</span> into invoices, e-Stamp, courier, and notary business.",
    heroText:
      "TaxBro helps users search the full HSN and SAC master, view daily SBI TT rates for foreign income, review GST rate updates from your supplied 2025 sheet, build GST invoices, and message you for e-Stamp requests across India, physical stamp paper by fast courier, or Delhi NCR notary support.",
    heroActionOne: "Open Finder",
    heroActionOneHref: "./hsn-sac-finder.html",
    heroActionTwo: "View SBI TT Rates",
    heroActionTwoHref: "./sbi-tt-rates.html",
    heroActionThree: "See Services",
    heroActionThreeHref: "#services",
    statOneLabel: "Total indexed codes",
    statOneValue: null,
    statTwoLabel: "HSN records",
    statTwoValue: null,
    statThreeLabel: "SAC records",
    statThreeValue: null,
    statFourLabel: "Update sheet effective date",
    statFourValue: null,
    visualFloatingLabel: "Rate sheet active",
    visualFloatingValue: "2025 HSN update rules loaded",
    tickerOne: "Search by code, keyword, or prefix.",
    tickerTwo: "Filter between HSN, SAC, and updated-rate matches.",
    tickerThree: "View daily SBI TT rates for foreign income conversion.",
    tickerFour: "Use one service desk for invoices, e-Stamp, fast courier, and Delhi NCR notary.",
    primarySectionKicker: "Finder",
    primarySectionTitle: "One unified finder for HSN and SAC.",
    primarySectionText:
      "TaxBro now uses a single dedicated finder page for both HSN and SAC so users do not need to choose the wrong search page first. The combined finder supports goods, services, partial codes, keyword search, and GST rate signals in one place.",
    primaryCardOneTitle: "What the combined finder covers",
    primaryCardOneText:
      "The unified page searches your full HSN and SAC master together, then lets users narrow with built-in filters only after they see the first set of results.",
    primaryCardTwoTitle: "Why this is better for users",
    primaryCardTwoText:
      "Most people do not think in separate HSN and SAC landing pages. They think in goods, services, invoices, or legal/document work. One finder reduces confusion and gets them to the right result faster.",
    primaryCardThreeTitle: "Open the live finder",
    primaryCardThreeText:
      "The full searchable interface now lives on its own dedicated page so the homepage stays lighter and the code search experience stays focused.",
    primaryCardThreeActionOne: "Open unified finder",
    primaryCardThreeActionOneHref: "./hsn-sac-finder.html",
    primaryCardThreeActionTwo: "Ask on WhatsApp",
    primaryCardThreeActionTwoHref: "https://wa.link/u67tem",
    servicesKicker: "Services",
    servicesTitle: "One document desk for digital, physical, and Delhi NCR execution support.",
    servicesText:
      "Visitors can arrive for HSN or SAC search, then move into one connected service flow: e-Stamp by request, physical stamp paper by fast courier, and notary support through the Delhi NCR desk only.",
    seoKicker: "SEO Pages",
    seoTitle: "Dedicated landing pages for the searches people actually make.",
    seoText:
      "TaxBro now uses a unified HSN + SAC finder, a separate MCA activity-code finder, a GST invoice maker, and one document-services page for e-Stamp, physical dispatch, and Delhi NCR notary support.",
  },
  US: {
    brandTagline: "USA EIN and business tax ID guidance",
    navPrimaryOne: "USA Home",
    navPrimaryOneHref: "./usa/",
    navPrimaryTwo: "EIN Guide",
    navPrimaryTwoHref: "./usa/ein/",
    navPrimaryThree: "Responsible Party",
    navPrimaryThreeHref: "./usa/ein/#responsible-party",
    navPrimaryFour: "Apply at IRS",
    navPrimaryFourHref: "https://sa.www4.irs.gov/modiein/individual/index.jsp",
    navPrimaryFive: "Who Needs EIN",
    navPrimaryFiveHref: "./usa/ein/#who-needs-ein",
    navPrimarySix: "FAQ",
    navPrimarySixHref: "./usa/ein/#faq",
    navPrimarySeven: "IRS References",
    navPrimarySevenHref: "./usa/ein/#references",
    navCta: "IRS EIN App",
    navCtaHref: "https://sa.www4.irs.gov/modiein/individual/index.jsp",
    heroEyebrow: "USA EIN guide now available",
    heroTitle:
      "Understand EIN basics, <span>check eligibility</span> and apply directly through the IRS.",
    heroText:
      "TaxBro now supports USA-focused compliance content starting with Employer Identification Numbers. Learn what an EIN is, when a business may need one, how responsible party details work, and when to use the official IRS application.",
    heroActionOne: "Open USA Home",
    heroActionOneHref: "./usa/",
    heroActionTwo: "Check Eligibility",
    heroActionTwoHref: "./usa/ein/checker/",
    heroActionThree: "Apply at IRS",
    heroActionThreeHref: "https://sa.www4.irs.gov/modiein/individual/index.jsp",
    statOneLabel: "IRS guide topics",
    statOneValue: "10",
    statTwoLabel: "Business structures covered",
    statTwoValue: "6",
    statThreeLabel: "Eligibility inputs",
    statThreeValue: "3",
    statFourLabel: "Official references",
    statFourValue: "5",
    visualFloatingLabel: "USA content active",
    visualFloatingValue: "EIN guide and checker ready",
    tickerOne: "Learn what an EIN is and why the IRS issues it.",
    tickerTwo: "Check common EIN triggers for LLCs, corporations, partnerships, nonprofits, and employers.",
    tickerThree: "Use TaxBro for education and the IRS website for the actual EIN application.",
    tickerFour: "TaxBro is not affiliated with the IRS and does not issue EINs.",
    primarySectionKicker: "USA EIN",
    primarySectionTitle: "A practical EIN guide for new USA business owners.",
    primarySectionText:
      "The USA experience starts with a focused EIN guide: what the IRS is, what an Employer Identification Number does, who often needs one, and what to prepare before using the official IRS application.",
    primaryCardOneTitle: "What the EIN guide covers",
    primaryCardOneText:
      "The guide explains IRS basics, EIN purpose, responsible party information, EIN versus SSN, application methods, common mistakes, FAQs, and official IRS references in one TaxBro-styled page.",
    primaryCardTwoTitle: "Why the checker exists",
    primaryCardTwoText:
      "Many founders are unsure whether a sole proprietorship, LLC, corporation, partnership, nonprofit, or hiring plan changes the answer. The checker gives a plain-language starting point and points back to IRS guidance.",
    primaryCardThreeTitle: "Start with the USA guide",
    primaryCardThreeText:
      "Read the guide first, use the checker for a quick recommendation, then apply only on the official IRS website when you are ready.",
    primaryCardThreeActionOne: "Open USA home",
    primaryCardThreeActionOneHref: "./usa/",
    primaryCardThreeActionTwo: "Open IRS application",
    primaryCardThreeActionTwoHref: "https://sa.www4.irs.gov/modiein/individual/index.jsp",
    servicesKicker: "USA Tools",
    servicesTitle: "TaxBro USA starts with EIN education and eligibility guidance.",
    servicesText:
      "This milestone adds only the country switcher, the USA EIN guide, and the EIN eligibility checker. More USA tools can be added later through the same country content structure.",
    seoKicker: "USA Pages",
    seoTitle: "Dedicated USA compliance pages can now grow from one switcher.",
    seoText:
      "The homepage can route users to country-specific pages while India continues showing the existing TaxBro tools. The first USA route is the USA homepage at /usa/.",
  },
};

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

const hasFinder = Boolean(
  els.q &&
    els.clearBtn &&
    els.fBoth &&
    els.fHSN &&
    els.fSAC &&
    els.rAll &&
    els.rUpdated &&
    els.count &&
    els.finderNote &&
    els.rows &&
    els.empty
);

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
  if (!button) return;
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
  if (!hasFinder) return;
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
  if (!hasFinder) return;
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
  if (!hasFinder) return;
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

function userPrefersReducedMotion() {
  return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

function initCountUp() {
  const nodes = Array.from(document.querySelectorAll("[data-count-to]"));
  if (!nodes.length) return;

  const run = (node) => {
    if (node.dataset.countDone === "true") return;
    node.dataset.countDone = "true";

    const target = Number(node.getAttribute("data-count-to") || 0);
    const suffix = node.getAttribute("data-count-suffix") || "";
    if (!Number.isFinite(target)) return;

    if (userPrefersReducedMotion()) {
      node.textContent = String(target) + suffix;
      return;
    }

    const start = performance.now();
    const duration = 1200;

    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      node.textContent = String(value) + suffix;
      if (progress < 1) window.requestAnimationFrame(frame);
    }

    window.requestAnimationFrame(frame);
  };

  if (!("IntersectionObserver" in window)) {
    nodes.forEach(run);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.35 }
  );

  nodes.forEach((node) => observer.observe(node));
}

function initMeterBars() {
  const nodes = Array.from(document.querySelectorAll("[data-bar-fill]"));
  if (!nodes.length) return;

  const run = (node) => {
    if (node.dataset.barDone === "true") return;
    node.dataset.barDone = "true";
    const value = Math.max(0, Math.min(100, Number(node.getAttribute("data-bar-fill") || 0)));
    node.style.width = value + "%";
    node.classList.add("is-live");
  };

  if (!("IntersectionObserver" in window)) {
    nodes.forEach(run);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.32 }
  );

  nodes.forEach((node) => observer.observe(node));
}

function initSpotlights() {
  const nodes = Array.from(document.querySelectorAll("[data-spotlight]"));
  if (!nodes.length || userPrefersReducedMotion()) return;

  nodes.forEach((node) => {
    node.addEventListener("pointermove", (event) => {
      const rect = node.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      node.style.setProperty("--spot-x", x.toFixed(2) + "%");
      node.style.setProperty("--spot-y", y.toFixed(2) + "%");
    });

    node.addEventListener("pointerleave", () => {
      node.style.setProperty("--spot-x", "50%");
      node.style.setProperty("--spot-y", "50%");
    });
  });
}

function initTiltCards() {
  const nodes = Array.from(document.querySelectorAll("[data-tilt-card]"));
  if (!nodes.length || userPrefersReducedMotion()) return;

  nodes.forEach((node) => {
    node.addEventListener("pointermove", (event) => {
      const rect = node.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * 8;
      const rotateX = (0.5 - py) * 7;
      node.style.transform =
        "perspective(1200px) rotateX(" +
        rotateX.toFixed(2) +
        "deg) rotateY(" +
        rotateY.toFixed(2) +
        "deg) translateY(-2px)";
    });

    node.addEventListener("pointerleave", () => {
      node.style.transform = "";
    });
  });
}

function initArticleNav() {
  const nav = document.querySelector("[data-article-nav]");
  const sections = Array.from(document.querySelectorAll("[data-article-section]"));
  if (!nav || !sections.length) return;

  const links = Array.from(nav.querySelectorAll("[data-nav-target]"));
  const byId = new Map(links.map((link) => [link.getAttribute("data-nav-target"), link]));

  function setActive(id) {
    links.forEach((link) => link.classList.toggle("is-active", link.getAttribute("data-nav-target") === id));
  }

  if (!("IntersectionObserver" in window)) {
    setActive(sections[0].id);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        if (!byId.has(id)) return;
        setActive(id);
      });
    },
    { rootMargin: "-25% 0px -55% 0px", threshold: 0.1 }
  );

  sections.forEach((section) => observer.observe(section));
  if (sections[0]) setActive(sections[0].id);
}

function getStoredCountry() {
  const stored = localStorage.getItem(COUNTRY_STORAGE_KEY);
  return COUNTRY_CONTENT[stored] ? stored : "IN";
}

function setLinkTarget(anchor, href) {
  if (!anchor || !href) return;
  const isExternal = /^https?:\/\//i.test(href);
  if (isExternal) {
    anchor.setAttribute("target", "_blank");
    anchor.setAttribute("rel", "noreferrer");
  } else {
    anchor.removeAttribute("target");
    anchor.removeAttribute("rel");
  }
}

function applyCountryContent(countryCode) {
  const code = COUNTRY_CONTENT[countryCode] ? countryCode : "IN";
  const content = COUNTRY_CONTENT[code];

  document.documentElement.setAttribute("data-country", code);

  document.querySelectorAll("[data-country-text]").forEach((node) => {
    const key = node.getAttribute("data-country-text");
    if (!key || typeof content[key] === "undefined" || content[key] === null) return;
    node.textContent = content[key];
  });

  document.querySelectorAll("[data-country-html]").forEach((node) => {
    const key = node.getAttribute("data-country-html");
    if (!key || typeof content[key] === "undefined" || content[key] === null) return;
    node.innerHTML = content[key];
  });

  document.querySelectorAll("[data-country-href]").forEach((node) => {
    const key = node.getAttribute("data-country-href");
    if (!key || typeof content[key] === "undefined" || content[key] === null) return;
    node.setAttribute("href", content[key]);
    setLinkTarget(node, content[key]);
  });

  if (content.statOneValue && els.statTotal) els.statTotal.textContent = content.statOneValue;
  if (content.statTwoValue && els.statHsn) els.statHsn.textContent = content.statTwoValue;
  if (content.statThreeValue && els.statSac) els.statSac.textContent = content.statThreeValue;
  if (content.statFourValue && els.statEffective) els.statEffective.textContent = content.statFourValue;

  const switcher = document.getElementById("countrySwitcher");
  if (switcher) switcher.value = code;
}

function initCountrySwitcher() {
  const switcher = document.getElementById("countrySwitcher");
  const pageCountry = document.body ? document.body.dataset.countryPage : "";
  const selectedCountry = COUNTRY_CONTENT[pageCountry] ? pageCountry : getStoredCountry();
  applyCountryContent(selectedCountry);
  if (!switcher) return;

  switcher.addEventListener("change", () => {
    const nextCountry = COUNTRY_CONTENT[switcher.value] ? switcher.value : "IN";
    const selectedOption = switcher.options[switcher.selectedIndex];
    const countryUrl = selectedOption ? selectedOption.getAttribute("data-country-url") : "";
    localStorage.setItem(COUNTRY_STORAGE_KEY, nextCountry);
    if (countryUrl) {
      window.location.href = countryUrl;
      return;
    }
    applyCountryContent(nextCountry);
  });
}

function initEinEligibilityChecker() {
  const stepper = document.getElementById("einStepChecker");
  const form = document.getElementById("einEligibilityForm");
  const result = document.getElementById("einCheckerResult");
  if (!stepper && (!form || !result)) return;

  const likelyEntityTypes = new Set(["llc", "corporation", "partnership", "nonprofit"]);
  const entityLabels = {
    sole: "Sole Proprietorship",
    llc: "LLC",
    corporation: "Corporation",
    partnership: "Partnership",
    nonprofit: "Nonprofit",
    other: "Other",
  };

  function makeRecommendation(answers) {
    const businessType = answers.businessType || "";
    const employees = answers.employees || "";
    const reason = answers.reason || "";
    const reasons = [
      "Business type: " + (entityLabels[businessType] || "Not selected"),
      "Employees: " + (employees === "yes" ? "Yes" : "No"),
      "Application reason: " + (reasonLabels[reason] || "Not selected"),
    ];
    const likelyNeed =
      employees === "yes" ||
      reason === "hiring" ||
      likelyEntityTypes.has(businessType) ||
      (businessType === "other" && reason === "tax");

    if (likelyNeed) {
      return {
        title: "You likely need an EIN.",
        summary:
          "Your answers match common IRS EIN trigger areas, such as hiring employees, operating through an entity structure, or filing business tax forms.",
        reasons: reasons.concat([
          "Confirm the exact requirement on IRS.gov before applying.",
          "Apply only through the official IRS EIN application page when you are ready.",
        ]),
      };
    }

    return {
      title: "You may not require an EIN. Please review the official IRS guidance.",
      summary:
        "A sole proprietor or other low-complexity business with no employees may not always need an EIN for federal tax purposes, though an EIN may still be requested for banking or state tax purposes.",
      reasons: reasons.concat([
        "Check whether a bank, state agency, or tax filing situation still requires one.",
        "Use IRS guidance as the final source before deciding.",
      ]),
    };
  }
  const reasonLabels = {
    starting: "Starting a business",
    hiring: "Hiring employees",
    banking: "Banking",
    tax: "Tax filing",
    other: "Other",
  };

  function checkedValue(name) {
    const input = form.querySelector('input[name="' + name + '"]:checked');
    return input ? input.value : "";
  }

  function renderResult(target, title, summary, reasons) {
    if (!target) return;
    target.hidden = false;
    target.innerHTML =
      "<h3>" +
      esc(title) +
      "</h3><p>" +
      esc(summary) +
      "</p><ul class=\"detail-list\">" +
      reasons.map((reason) => "<li>" + esc(reason) + "</li>").join("") +
      "</ul><div class=\"cta-actions\"><a class=\"btn btn-primary\" href=\"https://sa.www4.irs.gov/modiein/individual/index.jsp\" target=\"_blank\" rel=\"noreferrer\">Open IRS EIN application</a><a class=\"btn btn-secondary\" href=\"https://www.irs.gov/businesses/employer-identification-number\" target=\"_blank\" rel=\"noreferrer\">Review IRS EIN guidance</a></div><p class=\"finder-footnote\">TaxBro is not affiliated with the IRS. The IRS provides EINs directly. This checker is educational and should be reviewed against official IRS guidance.</p>";
  }

  if (stepper && result) {
    const questions = [
      {
        key: "businessType",
        label: "Business Type",
        question: "What is your business type?",
        options: [
          ["sole", "Sole Proprietorship"],
          ["llc", "LLC"],
          ["corporation", "Corporation"],
          ["partnership", "Partnership"],
          ["nonprofit", "Nonprofit"],
          ["other", "Other"],
        ],
      },
      {
        key: "employees",
        label: "Employees",
        question: "Will you hire employees?",
        options: [
          ["yes", "Yes"],
          ["no", "No"],
        ],
      },
      {
        key: "reason",
        label: "Reason",
        question: "Why are you applying?",
        options: [
          ["starting", "Starting a business"],
          ["hiring", "Hiring employees"],
          ["banking", "Banking"],
          ["tax", "Tax filing"],
          ["other", "Other"],
        ],
      },
    ];
    const answers = {};
    let stepIndex = 0;
    const progress = stepper.querySelector("[data-ein-progress]");
    const progressBar = stepper.querySelector("[data-ein-progress-bar]");
    const stepLabel = stepper.querySelector("[data-ein-step-label]");
    const questionNode = stepper.querySelector("[data-ein-question]");
    const optionsNode = stepper.querySelector("[data-ein-options]");
    const backButton = stepper.querySelector("[data-ein-back]");
    const resetButton = stepper.querySelector("[data-ein-reset]");

    function renderStep() {
      const step = questions[stepIndex];
      result.hidden = true;
      if (progress) progress.textContent = "Question " + (stepIndex + 1) + " of " + questions.length;
      if (progressBar) progressBar.style.width = String(((stepIndex + 1) / questions.length) * 100) + "%";
      if (stepLabel) stepLabel.textContent = step.label;
      if (questionNode) questionNode.textContent = step.question;
      if (backButton) backButton.disabled = stepIndex === 0;
      if (!optionsNode) return;
      optionsNode.innerHTML = step.options
        .map(
          (option) =>
            "<button class=\"ein-choice\" type=\"button\" data-ein-choice=\"" +
            esc(option[0]) +
            "\">" +
            esc(option[1]) +
            "</button>"
        )
        .join("");
    }

    if (optionsNode) {
      optionsNode.addEventListener("click", (event) => {
        const button = event.target.closest("[data-ein-choice]");
        if (!button) return;
        const step = questions[stepIndex];
        answers[step.key] = button.getAttribute("data-ein-choice") || "";
        if (stepIndex < questions.length - 1) {
          stepIndex += 1;
          renderStep();
          return;
        }
        const recommendation = makeRecommendation(answers);
        renderResult(result, recommendation.title, recommendation.summary, recommendation.reasons);
      });
    }

    if (backButton) {
      backButton.addEventListener("click", () => {
        if (stepIndex === 0) return;
        stepIndex -= 1;
        renderStep();
      });
    }

    if (resetButton) {
      resetButton.addEventListener("click", () => {
        Object.keys(answers).forEach((key) => delete answers[key]);
        stepIndex = 0;
        renderStep();
      });
    }

    renderStep();
    return;
  }

  if (!form || !result) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const recommendation = makeRecommendation({
      businessType: checkedValue("businessType"),
      employees: checkedValue("employees"),
      reason: checkedValue("reason"),
    });
    renderResult(result, recommendation.title, recommendation.summary, recommendation.reasons);
  });

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      result.innerHTML =
        "<h3>Recommendation will appear here.</h3><p>Select your answers and TaxBro will show a practical EIN guidance note with IRS links.</p>";
    }, 0);
  });
}

function hydrateMeta() {
  const hasLoadedData = DATASET.length > 0 || Object.keys(META).length > 0;
  if (!hasLoadedData) {
    if (els.year) els.year.textContent = String(new Date().getFullYear());
    return;
  }

  const hsnCount = Number(META.hsnCount || DATASET.filter((item) => item.type === "HSN").length);
  const sacCount = Number(META.sacCount || DATASET.filter((item) => item.type === "SAC").length);
  const totalCount = hsnCount + sacCount;
  const effectiveLabel = formatDateIso(META.effectiveDate || "2025-09-22");

  if (els.year) els.year.textContent = String(new Date().getFullYear());
  if (els.statTotal) els.statTotal.textContent = formatIndianNumber(totalCount);
  if (els.statHsn) els.statHsn.textContent = formatIndianNumber(hsnCount);
  if (els.statSac) els.statSac.textContent = formatIndianNumber(sacCount);
  if (els.statEffective) els.statEffective.textContent = effectiveLabel;
  if (els.heroRateMeta) els.heroRateMeta.textContent = (META.rateRuleCount || RATE_RULES.length) + " update rules active";
  if (els.footerMeta) {
    els.footerMeta.textContent =
      "Loaded " +
      formatIndianNumber(totalCount) +
      " codes and " +
      formatIndianNumber(META.rateRuleCount || RATE_RULES.length) +
      " rate-update rules from your supplied files.";
  }
}

hydrateMeta();
initCountrySwitcher();
initEinEligibilityChecker();
initReveal();
initCountUp();
initMeterBars();
initSpotlights();
initTiltCards();
initArticleNav();

if (hasFinder) {
  const defaultType = String(PAGE_DATA.defaultType || "").trim().toUpperCase();
  const defaultRate = String(PAGE_DATA.defaultRate || "").trim().toUpperCase();
  const defaultQuery = String(PAGE_DATA.defaultQuery || "").trim();

  if (defaultType === "HSN" || defaultType === "SAC") state.type = defaultType;
  if (defaultRate === "UPDATED") state.rateMode = defaultRate;
  if (defaultQuery) els.q.value = defaultQuery;

  setPressed(els.fBoth, state.type === "ALL");
  setPressed(els.fHSN, state.type === "HSN");
  setPressed(els.fSAC, state.type === "SAC");
  setPressed(els.rAll, state.rateMode === "ALL");
  setPressed(els.rUpdated, state.rateMode === "UPDATED");

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
}

const SUBSCRIBE_STORAGE_KEY = "taxbroSubscribeModalDismissed";
const SUBSCRIBE_SESSION_KEY = "taxbroSubscribeModalShownThisSession";
const SUBSCRIBE_ENDPOINT = window.TAXBRO_SUBSCRIBE_ENDPOINT || "/api/subscribe";

function initSubscribeModal() {
  const modal = document.getElementById("subscribeModal");
  const form = document.getElementById("subscribeForm");
  const email = document.getElementById("subscribeEmail");
  const status = document.getElementById("subscribeStatus");
  const honeypot = document.getElementById("subscribeWebsite");
  if (!modal || !form || !email || !status) return;

  let opened = false;
  let timer = null;

  function isDismissed() {
    return localStorage.getItem(SUBSCRIBE_STORAGE_KEY) === "1" || sessionStorage.getItem(SUBSCRIBE_SESSION_KEY) === "1";
  }

  function setStatus(message, type) {
    status.textContent = message || "";
    status.classList.toggle("is-error", type === "error");
    status.classList.toggle("is-success", type === "success");
  }

  function openModal() {
    if (opened || isDismissed()) return;
    opened = true;
    sessionStorage.setItem(SUBSCRIBE_SESSION_KEY, "1");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    window.setTimeout(() => email.focus(), 80);
  }

  function closeModal(persist) {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    if (persist) localStorage.setItem(SUBSCRIBE_STORAGE_KEY, "1");
  }

  function scheduleOpen() {
    if (isDismissed()) return;
    timer = window.setTimeout(openModal, 6500);
  }

  function onScroll() {
    if (isDismissed() || opened) return;
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = window.scrollY / scrollable;
    if (progress >= 0.28 || window.scrollY >= 620) {
      if (timer) window.clearTimeout(timer);
      openModal();
      window.removeEventListener("scroll", onScroll);
    }
  }

  modal.querySelectorAll("[data-subscribe-close]").forEach((node) => {
    node.addEventListener("click", () => closeModal(true));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) closeModal(true);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const selectedCategories = Array.from(form.querySelectorAll('input[name="categories"]:checked')).map((item) => item.value);
    if (!selectedCategories.length) {
      setStatus("Please choose at least one update category.", "error");
      return;
    }

    if (honeypot && honeypot.value.trim()) return;

    const payload = new URLSearchParams();
    payload.set("email", email.value.trim());
    payload.set("categories", selectedCategories.join(","));
    payload.set("source", "taxbro_index_popup");

    setStatus("Subscribing...", "");
    const button = form.querySelector("button[type='submit']");
    if (button) button.disabled = true;

    try {
      await fetch(SUBSCRIBE_ENDPOINT, {
        method: "POST",
        body: payload,
        mode: "no-cors",
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      localStorage.setItem(SUBSCRIBE_STORAGE_KEY, "1");
      setStatus("Subscribed. You will receive only the updates you selected.", "success");
      window.setTimeout(() => closeModal(false), 1300);
    } catch (error) {
      setStatus("Could not subscribe right now. Please try again later.", "error");
    } finally {
      if (button) button.disabled = false;
    }
  });

  scheduleOpen();
  window.addEventListener("scroll", onScroll, { passive: true });
}

initSubscribeModal();



