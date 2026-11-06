/* Post-build step: injects the prerendered landing screen and its head script into dist/index.html.
   The head script is executed in a sandbox first and must reproduce the app's layout values exactly.
   Then stamps dist/sw.js with a hash of the whole build, so every deploy ships a byte-different service worker
   (the browser installs it and the old caches are purged on activate) — no manual VERSION bump needed. */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import vm from "node:vm";

const ssr = await import(pathToFileURL("dist-ssr/prerender.js").href);
const script = ssr.shellScript();

const SIZES = [[320, 568], [360, 640], [375, 667], [390, 844], [412, 915], [430, 932], [667, 375], [932, 430], [768, 1024],
  [820, 1180], [1024, 768], [1280, 720], [1366, 768], [1440, 900], [1536, 864], [1920, 1080], [2560, 1440], [3840, 2160]];
for (const [w, h] of SIZES) {
  const vars = {};
  const sandbox = {
    innerWidth: w, innerHeight: h, URLSearchParams, location: { search: "" },
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
writeFileSync(file, index);
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
