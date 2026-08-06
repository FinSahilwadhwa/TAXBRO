(() => {
  "use strict";
  const records = (window.TAXBRO_SIC || []).map(([code, description]) => ({
    code, description, level: code.length, normalized: `${code} ${description}`.toLowerCase(),
  }));
  const search = document.querySelector("#sicSearch");
  const clear = document.querySelector("#clearSearch");
  const count = document.querySelector("#resultCount");
  const note = document.querySelector("#resultNote");
  const rows = document.querySelector("#sicRows");
  const empty = document.querySelector("#sicEmpty");
  const total = document.querySelector("#sicTotal");
  const state = { level: "all" };
  const limit = 24;
  if (!search || !rows) return;
  if (total) total.textContent = records.length.toLocaleString("en-US");

  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const matchesLevel = (item) => state.level === "all" || item.level === Number(state.level);
  const score = (item, query) => {
    if (!matchesLevel(item)) return -1;
    if (!query) return 0;
    const digits = query.replace(/\D/g, "");
    const words = query.split(/\s+/).filter(Boolean);
    let value = 0;
    if (digits) {
      if (item.code === digits) value += 3000;
      else if (item.code.startsWith(digits)) value += 2200 - item.code.length;
      else if (item.code.includes(digits)) value += 1200;
    }
    if (item.description.toLowerCase().startsWith(query)) value += 1800;
    else if (item.normalized.includes(query)) value += 900;
    if (words.length > 1 && words.every((word) => item.normalized.includes(word))) value += 650;
    return value;
  };
  const copy = (text, button) => {
    if (!navigator.clipboard?.writeText) return;
    navigator.clipboard.writeText(text).then(() => { button.textContent = "Copied"; setTimeout(() => { button.textContent = "Copy code"; }, 1200); }).catch(() => {});
  };
  function render() {
    let query = search.value.trim().toLowerCase();
    if (query === "restaurant" || query === "restaurants") query = "eating places";
    clear.disabled = !query;
    const matches = records.map((item) => ({ item, score: score(item, query) })).filter((entry) => entry.score >= 0).sort((a, b) => b.score - a.score || a.item.code.localeCompare(b.item.code));
    const shown = query ? matches.slice(0, limit) : matches.filter((entry) => entry.item.level === 2).slice(0, limit);
    rows.innerHTML = "";
    if (!shown.length) { empty.hidden = false; count.textContent = "No matching codes"; note.textContent = "Try a shorter industry term or a code prefix."; return; }
    empty.hidden = true;
    count.textContent = `${matches.length.toLocaleString("en-US")} ${matches.length === 1 ? "match" : "matches"}`;
    note.textContent = query ? `Showing the best ${shown.length} results from the supplied SIC catalogue.` : "Start with an industry keyword or code. Major group results are shown below.";
    const fragment = document.createDocumentFragment();
    shown.forEach(({ item }) => {
      const card = document.createElement("article");
      card.className = "result-card naics-result-card";
      card.innerHTML = `<div class="result-top"><div class="result-code">${esc(item.code)}</div><div class="result-tags"><span class="type-pill">${item.level}-digit SIC</span></div></div><p class="result-desc">${esc(item.description)}</p><div class="result-footer"><div class="match-note">Standard Industrial Classification entry</div><button class="copy-btn" type="button">Copy code</button></div>`;
      const button = card.querySelector("button");
      button.addEventListener("click", () => copy(`${item.code} — ${item.description}`, button));
      fragment.appendChild(card);
    });
    rows.appendChild(fragment);
  }
  document.querySelectorAll("[data-sic-level]").forEach((button) => button.addEventListener("click", () => {
    state.level = button.dataset.sicLevel;
    document.querySelectorAll("[data-sic-level]").forEach((item) => { const active = item === button; item.classList.toggle("is-on", active); item.setAttribute("aria-pressed", String(active)); });
    render();
  }));
  document.querySelectorAll("[data-sic-query]").forEach((button) => button.addEventListener("click", () => { search.value = button.dataset.sicQuery; search.focus(); render(); }));
  search.addEventListener("input", render);
  clear.addEventListener("click", () => { search.value = ""; search.focus(); render(); });
  render();
})();
