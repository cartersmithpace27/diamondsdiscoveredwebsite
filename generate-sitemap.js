#!/usr/bin/env node
/*
 * generate-sitemap.js
 * ---------------------
 * Rebuilds sitemap.xml from the HTML files in this folder.
 *
 * How it decides what to include:
 *   - Every *.html file at the site root is a candidate.
 *   - A file is SKIPPED if it contains a noindex robots tag
 *     (e.g. thank-you.html), or if it's listed in EXCLUDE below.
 *
 * lastmod comes from each file's last git commit date, so the date
 * only changes when the page's content actually changes. If git isn't
 * available (rare), it falls back to today.
 *
 * Runs automatically on every Netlify deploy (see netlify.toml).
 * To run by hand:  node generate-sitemap.js
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SITE = "https://diamondsdiscovered.com";

// Files never included, even if indexable.
const EXCLUDE = new Set([]);

// Per-page hints. Anything not listed uses the defaults below.
const PAGE_SETTINGS = {
  "index.html":          { loc: "/",                    priority: "1.0", changefreq: "monthly" },
  "about.html":          { loc: "/about.html",          priority: "0.8", changefreq: "monthly" },
  "award.html":          { loc: "/award.html",          priority: "0.8", changefreq: "monthly" },
  "expedition_map.html": { loc: "/expedition_map.html", priority: "0.6", changefreq: "monthly" },
  "contact.html":        { loc: "/contact.html",        priority: "0.5", changefreq: "yearly"  },
};
const DEFAULTS = { priority: "0.7", changefreq: "monthly" };

const today = new Date().toISOString().slice(0, 10);

function lastCommitDate(file) {
  try {
    const d = execSync(`git log -1 --format=%cs -- "${file}"`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return d || today;
  } catch {
    return today;
  }
}

function isIndexable(contents) {
  // Skip pages that ask robots not to index them.
  const noindex = /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex[^"']*["']/i;
  return !noindex.test(contents);
}

const files = fs
  .readdirSync(".")
  .filter((f) => f.toLowerCase().endsWith(".html"))
  .filter((f) => !EXCLUDE.has(f))
  .filter((f) => isIndexable(fs.readFileSync(f, "utf8")))
  .sort();

const urls = files.map((f) => {
  const s = PAGE_SETTINGS[f] || {};
  const loc = s.loc || "/" + f;
  const priority = s.priority || DEFAULTS.priority;
  const changefreq = s.changefreq || DEFAULTS.changefreq;
  return (
    "  <url>\n" +
    `    <loc>${SITE}${loc}</loc>\n` +
    `    <lastmod>${lastCommitDate(f)}</lastmod>\n` +
    `    <changefreq>${changefreq}</changefreq>\n` +
    `    <priority>${priority}</priority>\n` +
    "  </url>"
  );
});

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.join("\n") +
  "\n</urlset>\n";

fs.writeFileSync("sitemap.xml", xml);
console.log(`sitemap.xml written with ${files.length} pages:`);
files.forEach((f) => console.log("  - " + f));
