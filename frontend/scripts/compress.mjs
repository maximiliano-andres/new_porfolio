/* Post-build step: writes Brotli (.br, quality 11) and gzip (.gz, level 9) copies of every text asset in dist/.
   Compressing once at build time lets the server send the smallest file without spending CPU per request.
   Asynchronous and in parallel (zlib runs on libuv's thread pool); a variant that is not smaller than the
   original is not written — the server then just sends the original. */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { brotliCompress, constants, gzip } from "node:zlib";

const brotliAsync = promisify(brotliCompress);
const gzipAsync = promisify(gzip);
const COMPRESSIBLE = /\.(js|css|html|svg|json|txt|webmanifest)$/;
const MIN_BYTES = 1024;

async function files(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await files(path)));
    else if (COMPRESSIBLE.test(entry.name)) out.push(path);
  }
  return out;
}

async function compress(path) {
  const data = await readFile(path);
  if (data.length < MIN_BYTES) return null;
  const [b, g] = await Promise.all([
    brotliAsync(data, { params: { [constants.BROTLI_PARAM_QUALITY]: 11, [constants.BROTLI_PARAM_SIZE_HINT]: data.length } }),
    gzipAsync(data, { level: 9 }),
  ]);
  const writes = [];
  if (b.length < data.length) writes.push(writeFile(`${path}.br`, b));
  if (g.length < data.length) writes.push(writeFile(`${path}.gz`, g));
  await Promise.all(writes);
  return { raw: data.length, br: Math.min(b.length, data.length), skipped: 2 - writes.length };
}

const results = (await Promise.all((await files("dist")).map(compress))).filter(Boolean);
const sum = (k) => results.reduce((acc, r) => acc + r[k], 0);
const skipped = sum("skipped");
console.log(
  `compress: ${results.length} files · ${(sum("raw") / 1024).toFixed(0)} KB → ${(sum("br") / 1024).toFixed(0)} KB brotli` +
    (skipped ? ` · ${skipped} variant(s) skipped (not smaller)` : ""),
);
