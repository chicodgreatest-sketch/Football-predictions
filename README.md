# Matchday — Football Predictions Site

A lightweight, mobile-first football predictions site with a built-in admin
dashboard for daily updates and designated ad slots.

## What's in here

```
index.html          the site
css/style.css        styling
js/app.js             renders predictions from data/predictions.json
data/predictions.json   today's picks (edit this daily)
data/settings.json      site title + ad codes
admin/                 the admin dashboard (Decap CMS)
netlify.toml            Netlify config
```

No build step, no framework, no npm install needed to run it — it's plain
HTML/CSS/JS. That keeps it light to work on from Termux.

---

## 1. Get this onto GitHub (from Termux)

Netlify's admin dashboard needs the site to live in a git repo so it can
save your daily edits as commits.

```bash
cd ~/football-predictions        # or wherever you unzipped this
git init
git add .
git commit -m "Initial site"
```

Create a new empty repo on GitHub (via github.com on your phone browser, or
`gh repo create` if you have the GitHub CLI installed in Termux: `pkg install gh`).

Then connect and push:

```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git branch -M main
git push -u origin main
```

## 2. Connect the repo to Netlify

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**
2. Pick GitHub, authorize, select your new repo
3. Build command: leave blank. Publish directory: `.` (root)
4. Deploy

Your site is now live at a `*.netlify.app` URL (you can add a custom domain
later in Netlify's Domain settings).

## 3. Turn on the admin dashboard

The `/admin` page uses **Decap CMS** with Netlify's **Identity + Git
Gateway**, so you log in with an email/password and your edits get committed
to GitHub automatically — no separate GitHub login needed day-to-day.

In your Netlify site dashboard:

1. **Identity** tab → **Enable Identity**
2. Identity → **Settings and usage** → under **Registration**, set to
   **Invite only** (so random people can't sign up as admin)
3. Identity → **Services** → enable **Git Gateway**
4. Still on Identity, click **Invite users** → invite your own email
5. Check your email, accept the invite, set a password

Now visit `https://YOUR-SITE.netlify.app/admin/` on your phone, log in, and
you'll see two sections:

- **Daily Predictions** — add, edit, remove matches. Toggle "Feature as
  today's standout pick" on the one you want highlighted at the top.
- **Site Settings** — site title, tagline, and ad code snippets.

Every save there is a git commit, which triggers Netlify to redeploy — your
changes go live within a minute or two.

## 4. Updating predictions day to day

Easiest: use `/admin` from your phone browser, no Termux needed.

If you'd rather edit from Termux directly, just edit `data/predictions.json`
by hand and push:

```bash
nano data/predictions.json
git add data/predictions.json
git commit -m "Update predictions"
git push
```

Both routes work — the admin panel is just the friendlier option day to day.

### Predictions.json fields

| Field | Notes |
|---|---|
| `id` | unique string, no spaces |
| `kickoff_time` | ISO datetime, e.g. `2026-08-18T15:00:00Z`. The site only shows matches dated today; it falls back to showing everything if nothing matches today, so it's never empty while you're testing. |
| `competition` | e.g. "Premier League" |
| `home_team` / `away_team` | team names |
| `tip_type` | e.g. "Match Result", "Over/Under" |
| `prediction` | the actual pick shown to readers |
| `odds` | optional, shown as text |
| `confidence` | 0–100, drives the confidence meter bar |
| `status` | `pending`, `won`, or `lost` |
| `featured` | `true` on exactly one entry to make it today's hero pick |

## 5. Ad placement

Three slots are wired up, all controlled from **Site Settings** in the admin
panel (or by editing `data/settings.json` directly):

- `ad_header_code` — banner under the site header
- `ad_infeed_code` — repeats after every 3rd prediction card
- `ad_footer_code` — banner above the footer

Paste your ad network's HTML/JS snippet (e.g. a Google AdSense `<ins>` unit)
into the matching field. Leave blank and the slot collapses to a placeholder
box, so nothing looks broken while you're waiting on ad account approval.

## 6. Local preview (optional)

To preview changes on your phone before pushing, most browsers can open
the file directly, but `fetch()` for the JSON files needs an actual server.
From Termux:

```bash
pkg install python
cd ~/football-predictions
python -m http.server 8080
```

Then open `http://localhost:8080` in your phone's browser.

---

## Next steps to consider

- Add a results/history page once you're tracking win rate over time
- Add categories/leagues filter if the daily list grows long
- Swap the `IN_FEED_AD_EVERY` constant in `js/app.js` if 3 cards between ads
  feels too dense or too sparse
