/* ============================================
   MATCHDAY — history / win rate page
   ============================================ */
let ALL_PREDICTIONS = [];
let CURRENT_FILTER = "all";

async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function formatDateShort(iso) {
  if (!iso) return "Undated";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

function statusTag(status) {
  if (!status || status === "pending") return `<span class="status-tag status-pending">Pending</span>`;
  if (status === "won") return `<span class="status-tag status-won">Won</span>`;
  if (status === "lost") return `<span class="status-tag status-lost">Lost</span>`;
  return "";
}

function computeStats(predictions) {
  const won = predictions.filter(p => p.status === "won").length;
  const lost = predictions.filter(p => p.status === "lost").length;
  const settled = won + lost;
  const winRate = settled > 0 ? Math.round((won / settled) * 100) : 0;
  return { won, lost, settled, winRate };
}

function renderStats(predictions) {
  const { won, lost, settled, winRate } = computeStats(predictions);
  document.getElementById("statWinRate").textContent = settled > 0 ? `${winRate}%` : "—";
  document.getElementById("statRecord").textContent = `${won}-${lost}`;
  document.getElementById("statTotal").textContent = settled;
}

function matchRowHTML(p) {
  return `
    <article class="match-card">
      <div class="match-card-top">
        <span class="ko-badge">${p.kickoff_time ? formatDateShort(p.kickoff_time) : "Undated"}</span>
        <span class="match-comp">${p.competition || ""}</span>
      </div>
      <h3 class="match-teams">${p.home_team} <span class="vs">vs</span> ${p.away_team}</h3>
      <div class="match-bottom">
        <div class="match-pick">
          <span class="tip-type">${p.tip_type || "Prediction"}</span>
          <span class="tip-value">${p.prediction}</span>
        </div>
        ${p.odds ? `<div class="match-odds">Odds <strong>${p.odds}</strong></div>` : ""}
        ${statusTag(p.status)}
      </div>
    </article>
  `;
}

function renderList() {
  const list = document.getElementById("historyList");
  let items = [...ALL_PREDICTIONS];

  if (CURRENT_FILTER !== "all") {
    items = items.filter(p => (p.status || "pending") === CURRENT_FILTER);
  }

  // newest first
  items.sort((a, b) => new Date(b.kickoff_time || 0) - new Date(a.kickoff_time || 0));

  if (items.length === 0) {
    list.innerHTML = `<p class="empty-state">Nothing here yet.</p>`;
    return;
  }

  // group by date
  const groups = {};
  items.forEach(p => {
    const key = p.kickoff_time ? p.kickoff_time.slice(0, 10) : "undated";
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  let html = "";
  Object.keys(groups)
    .sort((a, b) => (a < b ? 1 : -1))
    .forEach(key => {
      const label = key === "undated" ? "Undated" : formatDateShort(groups[key][0].kickoff_time);
      html += `<div class="day-group"><p class="day-heading">${label}</p><div class="card-list">`;
      groups[key].forEach(p => (html += matchRowHTML(p)));
      html += `</div></div>`;
    });

  list.innerHTML = html;
}

function applyAdCode(settings) {
  const slots = { adHeader: settings.ad_header_code, adFooter: settings.ad_footer_code };
  Object.entries(slots).forEach(([id, code]) => {
    const el = document.getElementById(id);
    if (el && code) el.innerHTML = code;
  });
}

function wireFilters() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      CURRENT_FILTER = btn.dataset.filter;
      document.querySelectorAll(".filter-btn").forEach(b => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      renderList();
    });
  });
}

async function init() {
  document.getElementById("todayPill").textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long", day: "numeric", month: "long",
  });
  document.getElementById("footerYear").textContent = `© ${new Date().getFullYear()} Matchday`;
  wireFilters();

  try {
    const [predictionsData, settings] = await Promise.all([
      loadJSON("data/predictions.json").catch(() => ({ predictions: [] })),
      loadJSON("data/settings.json").catch(() => ({})),
    ]);
    ALL_PREDICTIONS = predictionsData.predictions || [];
    renderStats(ALL_PREDICTIONS);
    renderList();
    applyAdCode(settings);
  } catch (err) {
    console.error(err);
    document.getElementById("historyList").innerHTML =
      `<p class="empty-state">Couldn't load history. Please refresh.</p>`;
  }
}

init();
