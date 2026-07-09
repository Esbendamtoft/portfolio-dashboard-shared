# Portfolio Dashboard — Shared Releases

Data-free build of Portfolio Dashboard, ready to run — no personal data, no source code, just the release assets.

## Download

[⬇️ Download the latest version](https://github.com/Esbendamtoft/portfolio-dashboard-shared/releases/latest)

Look for the `.dmg` file under "Assets" on that page.

## Installing on macOS

This app isn't signed with an Apple Developer certificate, so macOS will block it on first launch. Downloaded via a browser, this usually shows up as **"[App name] is damaged and can't be opened. You should move it to the Trash."** — despite the wording, the file isn't actually corrupted; it's Gatekeeper reacting to the download's quarantine flag on an unsigned app.

To open it:

1. Open the `.dmg` and drag the app to Applications.
2. Open **Terminal** and run:
   ```
   xattr -cr "/Applications/Portfolio Dashboard.app"
   ```
3. Open the app normally from Applications.

(Right-click → Open sometimes works for a milder "unidentified developer" warning, but doesn't reliably clear the "is damaged" wording a browser download typically triggers — the `xattr` command above handles both.)

You only need to do this once — after that it opens normally.

## Updates

The app checks for new versions on launch and prompts you to install when one's available.
