/* ============================================
   MATCHDAY — render predictions from data files
   ============================================ */
const IN_FEED_AD_EVERY = 3; // insert an ad slot after every N match cards

async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function formatKickoff(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "TBC";
  }
}

function formatDateLong(iso) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}

function meterHTML(confidence) {
  const pct = Math.max(0, Math.min(100, Number(confidence) || 0));
  return `
    <div class="meter-labels">
      <span>Confidence</span>
      <span class="meter-value">${pct}%</span>
    </div>
    <div class="meter-track">
      <div class="meter-fill" style="width:${pct}%"></div>
    </div>
  `;
}

function statusTag(status) {
  if (!status || status === "pending") return `<span class="status-tag status-pending">Pending</span>`;
  if (status === "won") return `<span class="status-tag status-won">Won</span>`;
  if (status === "lost") return `<span class="status-tag status-lost">Lost</span>`;
  return "";
}

function matchCardHTML(p) {
  return `
    <article class="match-card">
      <div class="match-card-top">
        <span class="ko-badge">${p.kickoff_time ? formatKickoff(p.kickoff_time) : "TBC"}</span>
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
      <div class="meter">${meterHTML(p.confidence)}</div>
    </article>
  `;
}

function adSlotHTML() {
  return `
    <div class="ad-slot-inner" data-slot="in-feed"></div>
  `;
}

function renderHero(p) {
  const heroSection = document.getElementById("heroSection");
  if (!p) {
    heroSection.hidden = true;
    return;
  }
  heroSection.hidden = false;
  document.getElementById("heroComp").textContent = p.competition || "";
  document.getElementById("heroTeams").innerHTML = `${p.home_team} <span class="vs">vs</span> ${p.away_team}`;
  document.getElementById("heroTipType").textContent = p.tip_type || "Prediction";
  document.getElementById("heroPickValue").textContent = p.prediction;
  document.getElementById("heroMeter").innerHTML = meterHTML(p.confidence);

  const metaBits = [];
  if (p.kickoff_time) metaBits.push(`<span>Kick-off <strong>${formatKickoff(p.kickoff_time)}</strong></span>`);
  if (p.odds) metaBits.push(`<span>Odds <strong>${p.odds}</strong></span>`);
  document.getElementById("heroMeta").innerHTML = metaBits.join("");
}

function renderCards(predictions, featuredId) {
  const list = document.getElementById("cardList");
  const rest = predictions.filter(p => p.id !== featuredId);

  if (rest.length === 0 && predictions.length === 0) {
    list.innerHTML = `<p class="empty-state">No predictions posted yet today — check back soon.</p>`;
    return;
  }

  let html = "";
  rest.forEach((p, i) => {
    html += matchCardHTML(p);
    if ((i + 1) % IN_FEED_AD_EVERY === 0 && i !== rest.length - 1) {
      html += adSlotHTML();
    }
  });
  list.innerHTML = html || `<p class="empty-state">That's the standout pick sorted — more matches coming soon.</p>`;
}

function applyAdCode(settings) {
  const slots = {
    adHeader: settings.ad_header_code,
    adFooter: settings.ad_footer_code,
  };
  Object.entries(slots).forEach(([id, code]) => {
    const el = document.getElementById(id);
    if (el && code) el.innerHTML = code;
  });

  // in-feed ad slots (rendered dynamically) share one snippet
  if (settings.ad_infeed_code) {
    document.querySelectorAll('[data-slot="in-feed"]').forEach(el => {
      el.innerHTML = settings.ad_infeed_code;
    });
  }
}

async function init() {
  document.getElementById("todayPill").textContent = formatDateLong();
  document.getElementById("footerYear").textContent = `© ${new Date().getFullYear()} Matchday`;

  try {
    const [predictionsData, settings] = await Promise.all([
      loadJSON("data/predictions.json").catch(() => ({ predictions: [] })),
      loadJSON("data/settings.json").catch(() => ({})),
    ]);

    let predictions = predictionsData.predictions || [];

    // Only show today's predictions if dated; fall back to all if no dates set.
    const todayStr = new Date().toISOString().slice(0, 10);
    const todays = predictions.filter(p => (p.kickoff_time || "").slice(0, 10) === todayStr);
    if (todays.length > 0) predictions = todays;

    const featured = predictions.find(p => p.featured) || predictions[0];
    renderHero(featured || null);
    renderCards(predictions, featured ? featured.id : null);
    applyAdCode(settings);
  } catch (err) {
    console.error(err);
    document.getElementById("cardList").innerHTML =
      `<p class="empty-state">Couldn't load today's predictions. Please refresh.</p>`;
  }
}

init();
