/* Chunks from an older deploy are gone after a redeploy: reload once to get fresh HTML.
   Never loops (one attempt per 30 s) and never reloads while offline (the error UI stays instead). */
const KEY = "chunk_reload_at";

export function reloadOnce() {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
  try {
    const last = Number(window.sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last < 30_000) return false;
    window.sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}
