/* Post-build step: writes Brotli (.br, quality 11) and gzip (.gz, level 9) copies of every text asset in dist/.
   Compressing once at build time lets the server send the smallest file without spending CPU per request. */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

const COMPRESSIBLE = /\.(js|css|html|svg|json|txt|webmanifest)$/;
const MIN_BYTES = 1024;
let files = 0, raw = 0, br = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) { walk(path); continue; }
    if (!COMPRESSIBLE.test(name)) continue;
    const data = readFileSync(path);
    if (data.length < MIN_BYTES) continue;
    const b = brotliCompressSync(data, { params: { [constants.BROTLI_PARAM_QUALITY]: 11, [constants.BROTLI_PARAM_SIZE_HINT]: data.length } });
    const g = gzipSync(data, { level: 9 });
    writeFileSync(`${path}.br`, b);
    writeFileSync(`${path}.gz`, g);
    files++; raw += data.length; br += b.length;
  }
}
walk("dist");
console.log(`compress: ${files} files · ${(raw / 1024).toFixed(0)} KB → ${(br / 1024).toFixed(0)} KB brotli`);
