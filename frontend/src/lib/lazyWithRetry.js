/* Code-split components that survive a flaky connection.
   - importWithRetry(): the dynamic import is retried with backoff before giving up, so a brief network drop
     doesn't reload the whole page (and lose drafts in the other windows). Browsers cache a failed module
     fetch under its URL (Chrome does: re-importing the same URL fails instantly without a request), so the
     retries ask for the same file with a `?retry=n` query, taken from the browser's error message;
   - only after the retries fail is a reload attempted (reloadOnce: stale chunk after a redeploy);
   - React.lazy caches a rejected import forever: these components can be reset (resetFailedLazies),
     so a "Reintentar" button or reopening an overlay really downloads the code again. */
import { createElement, lazy } from "react";
import { reloadOnce } from "./reload.js";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const offline = () => typeof navigator !== "undefined" && navigator.onLine === false;
// Chrome: "Failed to fetch dynamically imported module: <url>", Firefox: "error loading dynamically imported module: <url>"
const failedUrl = (err) => /(https?:\/\/[^\s"']+?\.m?js)(?:\?[^\s"']*)?/.exec(String(err?.message ?? ""))?.[1] ?? null;

// a failed `?retry=n` is cached too: every retry in the session uses a new n; a module recovered that way is
// remembered, so later imports of the same chunk reuse it instead of loading a second copy
let bust = 0;
const recovered = new Map(); // original url → promise of the module (shared by concurrent retries)

export async function importWithRetry(importer, delays = [400, 1500]) {
  let url = null;
  for (let attempt = 0; ; attempt++) {
    try {
      if (!url) return await importer();
      if (!recovered.has(url)) {
        const retryUrl = `${url}?retry=${++bust}`;
        const p = import(/* @vite-ignore */ retryUrl);
        recovered.set(url, p);
        p.catch(() => { if (recovered.get(url) === p) recovered.delete(url); });
      }
      return await recovered.get(url);
    } catch (err) {
      url ??= failedUrl(err);
      if (attempt >= delays.length || offline()) throw err;
      await wait(delays[attempt]);
    }
  }
}

const failed = new Set(); // reset functions of lazies whose import rejected

/* load: () => Promise<Component> (already picked from its module; use importWithRetry inside it) */
export function lazyWithRetry(load) {
  let Current;
  const reset = () => {
    failed.delete(reset);
    Current = make();
  };
  const make = () =>
    lazy(() =>
      load()
        .then((C) => ({ default: C }))
        .catch((err) => {
          failed.add(reset);
          reloadOnce(); // stale deploy: fresh HTML fixes it (at most once per 30 s, never offline)
          throw err;
        })
    );
  Current = make();
  function LazyWithRetry(props) {
    return createElement(Current, props);
  }
  return LazyWithRetry;
}

/* forget every failed import so the next render tries again; returns whether there was anything to retry */
export function resetFailedLazies() {
  const pending = [...failed];
  pending.forEach((reset) => reset());
  return pending.length > 0;
}
