// Diagnostics/crash-report intake for the Portfolio Dashboard Mac app.
//
// The app POSTs an already-anonymized report here; this function creates a
// GitHub issue in the PRIVATE code repo. The GitHub token lives ONLY as a Vercel
// environment variable (GITHUB_TOKEN) and is never exposed to the app or this
// file. A shared secret (REPORT_SECRET, also a Vercel env var) is required in the
// x-report-secret header as best-effort abuse protection; real protection is that
// issues land in a private repo + Vercel's platform rate limiting.
//
// Env vars to set in the Vercel project (Settings -> Environment Variables):
//   GITHUB_TOKEN   fine-grained PAT with Issues: Read and write on
//                  Esbendamtoft/portfolio-dashboard
//   REPORT_SECRET  any random string; the app sends the same value

const ISSUES_URL = "https://api.github.com/repos/Esbendamtoft/portfolio-dashboard/issues";
const MAX_BODY_BYTES = 200_000; // reject oversized payloads

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }
  const secret = process.env.REPORT_SECRET;
  if (!secret || req.headers["x-report-secret"] !== secret) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    res.status(500).json({ error: "server not configured (no GITHUB_TOKEN)" });
    return;
  }

  let report = req.body;
  if (typeof report === "string") {
    if (report.length > MAX_BODY_BYTES) {
      res.status(413).json({ error: "payload too large" });
      return;
    }
    try {
      report = JSON.parse(report);
    } catch {
      report = null;
    }
  }
  if (!report || typeof report !== "object" || report.schema !== "diag-1") {
    res.status(400).json({ error: "invalid report" });
    return;
  }

  const env = report.environment || {};
  const isCrash = !!report.crash;
  const kind = isCrash ? "Crash" : "Diagnostics";
  const firstLine = isCrash ? String(report.crash.message || "panic") : "manual report";
  const title = `[${kind}] ${firstLine}`.slice(0, 120);

  let body;
  try {
    body = renderBody(report, kind);
  } catch (e) {
    body = "Report received but could not be rendered: " + String(e).slice(0, 200);
  }

  const gh = await fetch(ISSUES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "portfolio-dashboard-diagnostics",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ title, body }),
  });

  if (!gh.ok) {
    const detail = (await gh.text()).slice(0, 300);
    res.status(502).json({ error: `github ${gh.status}`, detail });
    return;
  }
  const issue = await gh.json();
  res.status(200).json({ url: issue.html_url, number: issue.number });
};

function code(v) {
  return "```json\n" + JSON.stringify(v, null, 2) + "\n```";
}

function renderBody(report, kind) {
  const env = report.environment || {};
  const lines = [];
  lines.push(`**${kind} report** — generated ${new Date((report.generatedAt || 0) * 1000).toISOString()}`);
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("| --- | --- |");
  lines.push(`| App version | ${env.appVersion ?? "?"} |`);
  lines.push(`| macOS | ${env.osVersion ?? "?"} (${env.osBuild ?? "?"}) |`);
  lines.push(`| Arch | ${env.arch ?? "?"} |`);
  lines.push(`| CPU | ${env.cpu ?? "?"} (${env.cpuCores ?? "?"} cores) |`);
  lines.push(`| Memory | ${env.memoryGb ?? "?"} GB |`);
  lines.push(`| Session uptime | ${report.sessionUptimeSec ?? "?"} s |`);
  lines.push("");

  if (report.crash) {
    const c = report.crash;
    lines.push("### Crash");
    lines.push(`- **Message:** ${c.message}`);
    lines.push(`- **Location:** ${c.location}`);
    lines.push(`- **Thread:** ${c.thread}`);
    lines.push("<details><summary>Backtrace</summary>\n\n```\n" + (c.backtrace || "") + "\n```\n</details>");
    lines.push("");
  }
  if (report.userNote) {
    lines.push("### Note from user");
    lines.push("> " + String(report.userNote).replace(/\n/g, "\n> "));
    lines.push("");
  }
  if (report.errors && Object.keys(report.errors).length) {
    lines.push("### Errors");
    lines.push(code(report.errors));
    lines.push("");
  }
  if (report.performance && Object.keys(report.performance).length) {
    lines.push("### Performance");
    lines.push(code(report.performance));
    lines.push("");
  }
  if (report.usage && Object.keys(report.usage).length) {
    lines.push("### Usage (this session)");
    lines.push(code(report.usage));
    lines.push("");
  }
  if (Array.isArray(report.recentLog) && report.recentLog.length) {
    lines.push("<details><summary>Recent log</summary>\n\n```\n" + report.recentLog.join("\n") + "\n```\n</details>");
  }
  lines.push("");
  lines.push("_Submitted automatically by the diagnostics system. Contains no portfolio data._");
  return lines.join("\n");
}
