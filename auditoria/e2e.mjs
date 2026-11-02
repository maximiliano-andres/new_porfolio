// End-to-end checks of the established flows + each frontend fix, in real Chromium.
import { chromium, devices } from "playwright";
import fs from "node:fs";
import { execSync } from "node:child_process";

const BASE = process.env.BASE || "http://127.0.0.1:8704";
const LOG = process.env.CONTACT_LOG;
const EXE = process.env.CHROME;
const results = [];
const errors = [];
const check = (id, desc, ok, detail = "") => results.push([id, desc, ok ? "PASA" : "FALLA", String(detail)]);
const SKIP = { boot_seen: "1", tour_seen: "1", audience_chosen: "1" };

const browser = await chromium.launch({ executablePath: EXE });

async function newPage(opts = {}, storage = null) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: "block", ...opts });
  if (storage) await ctx.addInitScript((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, storage);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`[console] ${m.text()} @ ${page.url()}`); });
  return { ctx, page };
}
const active = (page) => page.evaluate(() => {
  const a = document.activeElement;
  return a ? `${a.tagName}${a.getAttribute("aria-label") ? "[" + a.getAttribute("aria-label") + "]" : ""}${a.dataset?.dockId ? "#" + a.dataset.dockId : ""}` : "none";
});
const win = (page, id) => page.locator(`[data-win="${id}"]`);

// ---------- A. first visit: boot → profile → coach tour ----------
{
  const { ctx, page } = await newPage();
  await page.goto(BASE + "/");
  await page.getByRole("button", { name: /Perfil TI/ }).waitFor({ timeout: 8000 });
  await page.setViewportSize({ width: 1100, height: 760 }); // FE-5: a resize must not restart the boot log
  await page.waitForTimeout(400);
  check("A1", "Boot: la elección de perfil sigue visible tras redimensionar (FE-5)", await page.getByRole("button", { name: /Perfil TI/ }).isVisible());
  await page.getByRole("button", { name: /Perfil TI/ }).click();
  const coach = page.getByRole("dialog", { name: "Tour guiado" });
  await coach.waitFor({ timeout: 5000 });
  check("A2", "Primera visita: el tour guiado aparece tras el boot", true);
  await page.waitForTimeout(150);
  const inCard = await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"][aria-label="Tour guiado"]')));
  check("A3", "Tour: el foco entra al diálogo (FE-9)", inCard, await active(page));
  for (let i = 0; i < 6; i++) await page.keyboard.press("Tab");
  const stillIn = await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"][aria-label="Tour guiado"]')));
  check("A4", "Tour: Tab no escapa del diálogo (focus trap)", stillIn, await active(page));
  await page.getByRole("button", { name: "Siguiente" }).click();
  check("A5", "Tour: 'Siguiente' avanza de paso", await page.getByText(/Paso 2 de/).isVisible());
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  check("A6", "Tour: Escape lo cierra y se recuerda (tour_seen)", !(await coach.isVisible()) && (await page.evaluate(() => localStorage.getItem("tour_seen"))) === "1");
  await ctx.close();
}

// ---------- B. terminal: state across minimize/restore, keyboard ----------
{
  const { ctx, page } = await newPage({}, SKIP);
  await page.goto(BASE + "/");
  await page.locator('[data-dock-id="terminal"]').click();
  const input = page.getByRole("textbox", { name: "Comando de terminal" });
  await input.waitFor();
  await input.fill("whoami");
  await input.press("Enter");
  await page.waitForTimeout(200);
  const before = await win(page, "terminal").innerText();
  await page.locator('[data-dock-id="terminal"]').click(); // frontmost → minimize
  await page.waitForTimeout(500);
  check("B1", "Ventana minimizada queda inerte y oculta a lectores (FE-7)", (await win(page, "terminal").getAttribute("inert")) !== null && (await win(page, "terminal").getAttribute("aria-hidden")) === "true");
  await page.locator('[data-dock-id="terminal"]').click(); // restore
  await page.waitForTimeout(500);
  const after = await win(page, "terminal").innerText();
  check("B2", "Terminal conserva el historial tras minimizar/restaurar (FE-2)", after.includes("whoami") && after.length >= before.length - 5, `${before.length}→${after.length}`);
  await input.fill("");
  await input.focus();
  await page.keyboard.press("Tab");
  check("B3", "Tab con input vacío sale de la terminal (sin trampa, FE-6)", (await active(page)) !== "INPUT[Comando de terminal]", await active(page));
  await input.fill("he");
  await input.focus();
  await page.keyboard.press("Tab");
  check("B4", "Tab con texto sigue autocompletando ('he' → 'help')", (await input.inputValue()) === "help", await input.inputValue());
  await page.keyboard.press("Escape");
  check("B5", "Escape quita el foco del input (FE-6)", (await active(page)) !== "INPUT[Comando de terminal]", await active(page));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  check("B6", "Segundo Escape cierra la ventana (atajo global intacto)", (await win(page, "terminal").count()) === 0);
  await ctx.close();
}

// ---------- C. contact form: draft survives minimize, submit stores ----------
{
  const { ctx, page } = await newPage({}, SKIP);
  await page.goto(BASE + "/");
  await page.locator('[data-dock-id="contact"]').click();
  await page.locator("#c-name").fill("Prueba E2E");
  await page.locator("#c-email").fill("a@b.");
  await page.locator("#c-msg").fill("Mensaje desde Playwright 👨‍👩‍👧");
  await page.getByRole("button", { name: /Enviar mensaje/ }).click();
  check("C1", "Email inválido 'a@b.' se rechaza en el formulario (FE-C1)", await page.getByText("Email inválido").isVisible());
  await page.locator("#c-email").fill("e2e@example.com");
  await page.locator('[data-dock-id="contact"]').click(); // minimize
  await page.waitForTimeout(400);
  await page.locator('[data-dock-id="contact"]').click(); // restore
  await page.waitForTimeout(400);
  check("C2", "El borrador del formulario sobrevive a minimizar/restaurar (FE-2)", (await page.locator("#c-name").inputValue()) === "Prueba E2E");
  await page.getByRole("button", { name: /Enviar mensaje/ }).click();
  await page.getByText("Mensaje enviado").waitFor({ timeout: 8000 });
  const raw = process.env.CONTACT_CMD
    ? execSync(process.env.CONTACT_CMD, { encoding: "utf8" })
    : fs.existsSync(LOG) ? fs.readFileSync(LOG, "utf8") : "";
  const lines = raw.trim() ? raw.trim().split("\n").map((l) => JSON.parse(l)) : [];
  const last = lines.at(-1) || {};
  check("C3", "Envío real: 'Mensaje enviado' y guardado en el log", last.email === "e2e@example.com" && last.message.includes("👨‍👩‍👧"), JSON.stringify(last).slice(0, 90));
  await ctx.close();
}

// ---------- D. command palette ----------
{
  const { ctx, page } = await newPage({}, SKIP);
  await page.goto(BASE + "/");
  const trigger = page.locator('[data-tour="palette"]');
  await trigger.focus();
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: "Paleta de comandos" });
  await dialog.waitFor();
  await page.waitForTimeout(100);
  check("D1", "Ctrl+K abre la paleta con el foco en la búsqueda", (await active(page)).startsWith("INPUT"), await active(page));
  for (let i = 0; i < 8; i++) await page.keyboard.press("Tab");
  check("D2", "Tab no escapa de la paleta (focus trap)", await page.evaluate(() => Boolean(document.activeElement?.closest('[aria-label="Paleta de comandos"]'))), await active(page));
  await dialog.click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  check("D3", "Escape cierra la paleta aunque el foco no esté en el input (FE-9)", !(await dialog.isVisible()));
  check("D4", "El foco vuelve al botón que la abrió (FE-9)", (await active(page)).includes("Buscar o ejecutar un comando"), await active(page));
  await page.keyboard.press("Control+k");
  await dialog.waitFor();
  await page.waitForTimeout(150); // the palette focuses its input 30 ms after opening (original behaviour)
  await page.keyboard.type("contacto");
  await page.keyboard.press("Enter");
  await win(page, "contact").waitFor({ timeout: 4000 });
  check("D5", "Buscar 'contacto' + Enter abre la ventana (flujo original)", true);
  await ctx.close();
}

// ---------- E. CORE + dock, windows, focus return ----------
{
  const { ctx, page } = await newPage({}, SKIP);
  await page.goto(BASE + "/");
  await page.locator('[data-tour="core"]').click();
  const core = page.getByRole("dialog", { name: "Centro de control CORE" });
  await core.waitFor();
  await page.waitForTimeout(150);
  check("E1", "CORE: el foco entra al menú (FE-9)", await page.evaluate(() => Boolean(document.activeElement?.closest('[aria-label="Centro de control CORE"]'))), await active(page));
  await page.locator('[data-dock-id="skills"]').click(); // a real click: the dock sits above the CORE overlay
  const closed = await core.waitFor({ state: "detached", timeout: 3000 }).then(() => true, () => false); // after its fade-out
  check("E2", "Clic en el dock con CORE abierto: CORE se cierra y la ventana abre (FE-8)", closed && (await win(page, "skills").isVisible()));
  await page.keyboard.press("1"); // shortcut: first dock item (about)
  await win(page, "about").waitFor();
  check("E3", "Atajo '1' abre 'Sobre mí' (flujo original)", true);
  check("E4", "Ventanas expuestas como diálogo con nombre (FE-7)", (await win(page, "about").getAttribute("role")) === "dialog" && Boolean(await win(page, "about").getAttribute("aria-label")));
  await win(page, "about").getByRole("button", { name: /^Cerrar/ }).click();
  await page.waitForTimeout(300);
  check("E5", "Al cerrar con el botón, el foco vuelve a su ícono del dock (FE-7)", (await active(page)).includes("#about"), await active(page));
  await page.locator('[data-dock-id="projects"]').click();
  await win(page, "projects").waitFor();
  check("E6", "Hero oculto mientras hay ventanas abiertas (flujo original)", (await page.getByRole("button", { name: /Recorrido/ }).count()) === 0 || !(await page.getByRole("button", { name: /Recorrido/ }).first().isVisible()));
  await ctx.close();
}

// ---------- F. recruiter link ----------
{
  const { ctx, page } = await newPage({}, SKIP);
  const res = await page.goto(BASE + "/?vista=rrhh");
  await page.waitForTimeout(500);
  check("F1", "?vista=rrhh: 200 y la app arranca en perfil RRHH", res.status() === 200 && (await page.evaluate(() => document.documentElement.dataset.audience)) === "rrhh", res.status());
  await ctx.close();
}

// ---------- G. redeploy: a lazy chunk is gone (404) → one reload, never a loop ----------
{
  const { ctx, page } = await newPage({}, SKIP);
  await page.route(/\/assets\/TerminalContent-[^/]+\.js$/, (r) => r.fulfill({ status: 404, body: "" }));
  let navigations = 0;
  page.on("framenavigated", (f) => { if (f === page.mainFrame()) navigations++; });
  await page.goto(BASE + "/");
  await page.waitForTimeout(500);
  await page.locator('[data-dock-id="terminal"]').click();
  await page.waitForTimeout(2500);
  check("G1", "Chunk faltante tras redeploy → la página se recarga sola una vez (FE-3/FE-4)", navigations === 2, `navegaciones=${navigations}`);
  await page.locator('[data-dock-id="terminal"]').click();
  await page.waitForTimeout(2500);
  check("G2", "Si sigue faltando: sin bucle de recargas y aviso con 'Reintentar'", navigations === 2 && (await page.getByText("Esta sección no se pudo mostrar.").isVisible()), `navegaciones=${navigations}`);
  const r = await page.request.get(BASE + "/assets/TerminalContent-viejo.js");
  check("G3", "El servidor responde 404 (no HTML) a un asset inexistente (F-1)", r.status() === 404 && !(r.headers()["content-type"] || "").includes("html"), r.status());
  await ctx.close();
}

// ---------- H. mobile ----------
{
  const { ctx, page } = await newPage({ ...devices["iPhone 13"] }, SKIP);
  await page.goto(BASE + "/");
  await page.locator('[data-dock-id="about"]').click();
  await win(page, "about").waitFor();
  check("H1", "Móvil (iPhone 13): abre ventana sin errores", await win(page, "about").isVisible());
  await ctx.close();
}

// ---------- I. unknown page + service worker in production ----------
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
  const res = await page.goto(BASE + "/ruta/inexistente");
  check("I1", "URL desconocida: estado 404 pero se ve el portafolio (F-6)", res.status() === 404 && (await page.getByRole("dialog", { name: "Inicio del portafolio" }).count()) > 0, res.status());
  await page.goto(BASE + "/");
  await page.waitForTimeout(1500);
  const sw = await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.scriptURL || null);
  const caches_ = await page.evaluate(async () => caches.keys());
  check("I2", "Service worker v2 registrado y activo", Boolean(sw) && caches_.every((k) => k.endsWith("v2")), `${sw} ${JSON.stringify(caches_)}`);
  await ctx.close();
}

await browser.close();
const ignorable = (e) => /TerminalContent|404 \(Not Found\)|status of 404/.test(e);
const real = errors.filter((e) => !ignorable(e));
check("Z1", "Sin errores de JavaScript ni de consola (excluye los 404 provocados a propósito)", real.length === 0, real.slice(0, 3).join(" | "));
for (const r of results) console.log(r.join(" | "));
console.log(`\nTOTAL ${results.length} · FALLAS ${results.filter((r) => r[2] === "FALLA").length}`);
