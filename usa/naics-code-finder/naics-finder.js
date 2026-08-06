(() => {
  "use strict";

  const records = (window.TAXBRO_NAICS || []).map(([code, title]) => ({
    code,
    title,
    level: code.length,
    normalized: `${code} ${title}`.toLowerCase(),
  }));
  const els = {
    search: document.querySelector("#naicsSearch"),
    clear: document.querySelector("#clearSearch"),
    count: document.querySelector("#resultCount"),
    note: document.querySelector("#resultNote"),
    rows: document.querySelector("#naicsRows"),
    empty: document.querySelector("#naicsEmpty"),
    total: document.querySelector("#naicsTotal"),
  };
  const state = { level: "all" };
  const limit = 24;

  if (!els.search || !els.rows) return;
  if (els.total) els.total.textContent = records.length.toLocaleString("en-US");

  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const filterByLevel = (item) => state.level === "all" || item.level === Number(state.level);

  function score(item, query) {
    if (!filterByLevel(item)) return -1;
    if (!query) return 0;
    const words = query.split(/\s+/).filter(Boolean);
    const codeQuery = query.replace(/\D/g, "");
    let value = 0;
    if (codeQuery) {
      if (item.code === codeQuery) value += 3000;
      else if (item.code.startsWith(codeQuery)) value += 2200 - item.code.length;
      else if (item.code.includes(codeQuery)) value += 1200;
    }
    if (item.title.toLowerCase().startsWith(query)) value += 1800;
    else if (item.normalized.includes(query)) value += 900;
    if (words.length > 1 && words.every((word) => item.normalized.includes(word))) value += 650;
    return value;
  }

  function copy(text, button) {
    const done = () => {
      button.textContent = "Copied";
      setTimeout(() => { button.textContent = "Copy code"; }, 1200);
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(() => {});
  }

  function render() {
    const query = els.search.value.trim().toLowerCase();
    els.clear.disabled = !query;
    const matches = records
      .map((item) => ({ item, score: score(item, query) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score || a.item.code.localeCompare(b.item.code));
    const shown = query ? matches.slice(0, limit) : matches.filter((entry) => entry.item.level === 2).slice(0, limit);
    els.rows.innerHTML = "";

    if (!shown.length) {
      els.empty.hidden = false;
      els.count.textContent = "No matching codes";
      els.note.textContent = "Try a shorter phrase, a code prefix, or a different classification level.";
      return;
    }
    els.empty.hidden = true;
    els.count.textContent = `${matches.length.toLocaleString("en-US")} ${matches.length === 1 ? "match" : "matches"}`;
    els.note.textContent = query
      ? `Showing the best ${shown.length} results. Search uses the 2022 NAICS United States catalogue.`
      : "Start with a keyword or code. Sector-level results are shown below.";
    const fragment = document.createDocumentFragment();
    shown.forEach(({ item }) => {
      const card = document.createElement("article");
      card.className = "result-card naics-result-card";
      card.innerHTML = `<div class="result-top"><div class="result-code">${esc(item.code)}</div><div class="result-tags"><span class="type-pill">${item.level}-digit NAICS</span></div></div><p class="result-desc">${esc(item.title)}</p><div class="result-footer"><div class="match-note">2022 NAICS United States classification</div><button class="copy-btn" type="button">Copy code</button></div>`;
      card.querySelector("button").addEventListener("click", () => copy(`${item.code} — ${item.title}`, card.querySelector("button")));
      fragment.appendChild(card);
    });
    els.rows.appendChild(fragment);
  }

  document.querySelectorAll("[data-naics-level]").forEach((button) => {
    button.addEventListener("click", () => {
      state.level = button.dataset.naicsLevel;
      document.querySelectorAll("[data-naics-level]").forEach((item) => {
        const selected = item === button;
        item.classList.toggle("is-on", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      render();
    });
  });
  document.querySelectorAll("[data-naics-query]").forEach((button) => button.addEventListener("click", () => {
    els.search.value = button.dataset.naicsQuery;
    els.search.focus();
    render();
  }));
  els.search.addEventListener("input", render);
  els.clear.addEventListener("click", () => { els.search.value = ""; els.search.focus(); render(); });
  render();
})();
