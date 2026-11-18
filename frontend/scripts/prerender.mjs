/* Post-build step: injects the prerendered landing screen and its head script into dist/index.html.
   The head script is executed in a sandbox first and must reproduce the app's layout values exactly.
   Then stamps dist/sw.js with a hash of the whole build, so every deploy ships a byte-different service worker
   (the browser installs it and the old caches are purged on activate) — no manual VERSION bump needed. */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import vm from "node:vm";
import { CONTACT_EMAIL, SOCIAL_LINKS } from "../src/styles/theme.js";

const ssr = await import(pathToFileURL("dist-ssr/prerender.js").href);
const script = ssr.shellScript();

const SIZES = [[320, 568], [360, 640], [375, 667], [390, 844], [412, 915], [430, 932], [667, 375], [932, 430], [768, 1024],
  [820, 1180], [1024, 768], [1280, 720], [1366, 768], [1440, 900], [1536, 864], [1920, 1080], [2560, 1440], [3840, 2160]];
for (const [w, h] of SIZES) {
  const vars = {};
  const sandbox = {
    innerWidth: w, innerHeight: h, URLSearchParams, location: { search: "" }, navigator: { language: "es-CL" },
    localStorage: { getItem: () => null }, addEventListener: () => {},
    document: { documentElement: { dataset: {}, style: { setProperty: (k, v) => { vars[k] = v; } } } },
  };
  sandbox.window = sandbox;
  vm.runInNewContext(script, sandbox);
  const expected = ssr.shellVars(w, h);
  for (const [k, v] of Object.entries(expected)) {
    if (vars[k] !== v) throw new Error(`prerender: shell script disagrees with layout at ${w}x${h}: ${k}=${vars[k]} (expected ${v})`);
  }
}

const html = ssr.renderShell();
const file = "dist/index.html";
let index = readFileSync(file, "utf8");
if (!index.includes('<div id="root"></div>')) throw new Error("prerender: #root placeholder not found in dist/index.html");
// replacer FUNCTIONS, never strings: a string replacement interprets $&, $` and $' — any of those in the rendered
// text would corrupt the HTML silently (and the CSP hash would still "match", being computed afterwards)
index = index
  .replace('<div id="root"></div>', () => `<div id="root">${html}</div>`)
  .replace("</head>", () => `  <script>${script}</script>\n</head>`);

// ---- public URL (SITE_URL env, optional): absolute og:image, canonical and hreflang links ----
const siteUrl = (process.env.SITE_URL || "").trim().replace(/\/+$/, "");
if (siteUrl && !/^https?:\/\/[^\s"'<>]+$/.test(siteUrl)) throw new Error(`prerender: SITE_URL is not a valid http(s) URL: ${siteUrl}`);
if (siteUrl) {
  index = index.replaceAll("__SITE_URL__", () => siteUrl);
} else {
  // no public URL: the preview image stays relative; tags that require an absolute URL are left out
  index = index
    .replace(/(content=")__SITE_URL__(\/img\/og-cover\.png")/, (_, a, b) => `${a}${b}`)
    .split("\n").filter((line) => !line.includes("__SITE_URL__")).join("\n");
}

// ---- structured data (schema.org Person) for search engines; only facts already shown on the site ----
const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Maximiliano Andrés Caniullán Lefiñir",
  jobTitle: "Backend Developer",
  ...(siteUrl ? { url: `${siteUrl}/`, image: `${siteUrl}/img/max_andres_head_256.webp` } : {}),
  email: `mailto:${CONTACT_EMAIL}`,
  address: { "@type": "PostalAddress", addressLocality: "Peñaflor", addressRegion: "Región Metropolitana", addressCountry: "CL" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "Universidad Mayor" },
  knowsLanguage: ["es", "en"],
  knowsAbout: ["Java", "Spring Boot", "GraalVM Native Image", "Python", "FastAPI", "Node.js", "PostgreSQL", "MySQL", "MongoDB",
    "REST APIs", "Microservices", "Performance optimization", "Data migration", "Docker", "AWS"],
  sameAs: [SOCIAL_LINKS.linkedin, SOCIAL_LINKS.github],
};
// "<" escaped: the JSON can never close the <script> element
const jsonLd = JSON.stringify(person).replace(/</g, "\\u003c");
index = index.replace("</head>", () => `  <script type="application/ld+json">${jsonLd}</script>\n</head>`);
if (index.includes("__SITE_URL__")) throw new Error("prerender: __SITE_URL__ placeholder left in dist/index.html");
writeFileSync(file, index);
console.log(`prerender: link preview + JSON-LD (${siteUrl ? `SITE_URL=${siteUrl}` : "no SITE_URL: relative og:image, no canonical/hreflang"})`);
rmSync("dist-ssr", { recursive: true, force: true });
console.log(`prerender: landing screen injected (${(html.length / 1024).toFixed(1)} KB HTML), layout verified at ${SIZES.length} viewports`);

// ---- service worker build id ----
const SW_FILE = "dist/sw.js";
const BUILD_PLACEHOLDER = 'const BUILD = "dev";';
const hash = createHash("sha256");
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (path !== join("dist", "sw.js")) hash.update(path.replaceAll("\\", "/")).update(readFileSync(path));
  }
};
walk("dist");
const build = hash.digest("hex").slice(0, 12);
const sw = readFileSync(SW_FILE, "utf8");
if (!sw.includes(BUILD_PLACEHOLDER)) throw new Error(`prerender: ${BUILD_PLACEHOLDER} not found in ${SW_FILE}`);
writeFileSync(SW_FILE, sw.replace(BUILD_PLACEHOLDER, () => `const BUILD = "${build}";`));
console.log(`prerender: sw.js stamped with build ${build}`);
