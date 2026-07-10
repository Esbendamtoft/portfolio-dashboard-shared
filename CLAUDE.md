# CLAUDE.md — portfolio-dashboard-shared

Public repo with two jobs:

1. **Download landing page** for the Portfolio Dashboard Mac app (served by Vercel).
2. **Release host** for the data-free, self-updating shared build (the `.dmg` +
   Tauri updater artifacts live under GitHub Releases here).

This repo is intentionally the *only* place the public download flow touches —
it never pulls from any private repo. Keep it that way.

## Layout

```
index.html      # the entire landing page — single, self-contained file
appicon.png     # app icon shown on the page
favicon.ico     # browser tab icon
CLAUDE.md       # this file
README.md
```

The page files live at the **repo root** on purpose: the Vercel project deploys
from the root with no "Root Directory" override, so root == the served site.

## Deploy (Vercel)

- The Vercel project **`portfolio-dashboard`** is **git-connected to this repo**.
- **Every push to `main` auto-deploys.** There is no build step — it's a static
  page served as-is. Production: `portfolio-dashboard-lyart-eight.vercel.app`.
- Nothing else is needed to ship a page change: edit `index.html`, commit, push.

## Local preview

No build, no dependencies. From the repo root:

```sh
python3 -m http.server 8000    # then open http://localhost:8000
```

Or just open `index.html` in a browser.

## The download button

`index.html` links to this repo's own **latest release**, via a stable asset name:

```
https://github.com/Esbendamtoft/portfolio-dashboard-shared/releases/latest/download/Portfolio-Dashboard-autoupdate.dmg
```

`releases/latest/download/...` always resolves to the newest release, so the page
never needs editing when a new app version ships. **Do not host the `.dmg` in the
repo tree** — always link to the release asset.

## Releases

The app binary is **built and published separately** (from the app's own private
build tooling); this repo only *hosts* the resulting release. Each release must
include:

- `Portfolio-Dashboard-autoupdate.dmg` — **stable name**, the download button
  depends on it existing in every release.
- `Portfolio Dashboard (Autoupdate)_<version>_aarch64.dmg` — human-facing, shown
  on the releases page.
- `Portfolio.Dashboard.app.tar.gz` + `.sig` — Tauri updater artifacts.
- `latest.json` — the updater manifest (installed apps poll
  `releases/latest/download/latest.json`).

Naming rule: the **download file** carries the `(Autoupdate)` cue; the **installed
app** is just "Portfolio Dashboard" (its Finder/Dock name). Don't let the cue leak
into the app's product name.

## Best practices / conventions

- Keep `index.html` a **single self-contained file**: inline CSS, no external
  fonts/scripts/CDNs. It must render offline.
- The hero shows a **mock dashboard with placeholder numbers only** — never real
  portfolio data (holdings, values, account names). This repo is public.
- Theme is dark; brand accent `#6c7dff`, background `#0b0e14`. Match existing
  styles when editing.
- Test a change by loading the page locally and confirming the download link
  still resolves (the `releases/latest/download/...dmg` URL returns the file).
