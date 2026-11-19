/* Build-time entry (vite build --ssr): renders the landing screen to static HTML for index.html,
   plus the tiny head script that sizes it exactly like the app's layout engine would.
   Used only by scripts/prerender.mjs — never shipped to the browser. */
import { renderToStaticMarkup } from "react-dom/server";
import { LazyMotion, domMax } from "framer-motion";
import { CircuitBackground } from "./components/CircuitBackground.jsx";
import { Dock } from "./components/Dock.jsx";
import { Hero } from "./components/Hero.jsx";
import { TopBar } from "./components/TopBar.jsx";
import { AudienceContext, LangContext } from "./app/context.js";
import { DOCK_ITEMS, itemLabel } from "./data/system.js";
import { deskArea, dockSpaceFor, isCompactViewport, makeInitialWindows, uiScaleFor } from "./app/layout.js";

const noop = () => {};
const AUDIENCES = ["ti", "rrhh"];
const LANGS = ["es", "en"];
const VARIANTS = LANGS.flatMap((lang) => AUDIENCES.map((audience) => ({ lang, audience })));

/* the landing screen for both audiences × both languages; CSS (index.css) shows the one the head script selects */
export function renderShell() {
  const withAudience = (audience, node, lang = "es") => (
    <LangContext.Provider value={{ lang, setLang: noop }}>
      <AudienceContext.Provider value={{ audience, setAudience: noop }}>{node}</AudienceContext.Provider>
    </LangContext.Provider>
  );
  return renderToStaticMarkup(
    <LazyMotion features={domMax}>
      <div data-shell-root className="relative w-full h-dvh overflow-hidden" style={{ fontFamily: "'Inter', 'Inter Fallback', sans-serif" }}>
        <CircuitBackground energized={[]} />
        {VARIANTS.map(({ lang, audience: a }) => (
          <div key={`${lang}-${a}`} data-shell={a} data-shell-lang={lang}>{withAudience(a, <TopBar scale="var(--ui-scale, 1)" />, lang)}</div>
        ))}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {VARIANTS.map(({ lang, audience: a }) => (
            <div key={`${lang}-${a}`} data-shell={a} data-shell-lang={lang} data-shell-hero>
              {withAudience(a, (
                <Hero hr={a === "rrhh"} insets={{ top: "var(--hero-pt)", bottom: "var(--hero-pb)" }} animateIn={false} />
              ), lang)}
            </div>
          ))}
        </div>
        {/* the dock looks the same for both audiences (only its accessible labels differ); one per language */}
        {LANGS.map((lang) => (
          <div key={lang} data-shell-hero data-shell-lang={lang}>
            {withAudience("ti", (
              <Dock items={DOCK_ITEMS.map((it) => ({ ...it, label: itemLabel(it, false, lang) }))} windows={makeInitialWindows()} onToggle={noop} scale="var(--ui-scale, 1)" />
            ), lang)}
          </div>
        ))}
      </div>
    </LazyMotion>
  );
}

/* the values the app computes for the landing screen at a given viewport (source of truth) */
export function shellVars(width, height) {
  const size = { width, height };
  const compact = isCompactViewport(size);
  const scale = compact ? 1 : uiScaleFor(size);
  const area = deskArea(size, compact, scale, 0);
  return { "--ui-scale": String(scale), "--hero-pt": `${area.y + 8}px`, "--hero-pb": `${height - area.y - area.h + 8}px` };
}

/* inline <head> script: picks the audience and the language, flags first visits (deep links skip the boot screen,
   like the app does), and sizes the shell using the very same layout functions (their source is embedded, so the
   formulas can't drift apart).
   Its resize listener removes itself once the app has mounted (the app sets data-app on <html>).
   Changing this script changes its CSP hash: deploy dist/ together with deploy/security-headers.caddy. */
export function shellScript() {
  const fns = [uiScaleFor, isCompactViewport, dockSpaceFor, deskArea].map((f) => f.toString()).join("\n");
  return `(function(){var d=document.documentElement;
var q=null,l=null,dl=false;try{var u=new URLSearchParams(location.search);q=u.get("vista");l=u.get("lang");dl=!!(u.get("ventana")||u.get("window")||u.get("proyecto")||u.get("project"));}catch(e){}
var nav=(navigator.language||"");var navLang=!nav||/^es\\b/i.test(nav)?"es":"en";
try{var s=window.localStorage;d.dataset.audience=q==="rrhh"||q==="ti"?q:(s.getItem("audience")==="rrhh"?"rrhh":"ti");
var sl=s.getItem("lang");d.dataset.lang=l==="es"||l==="en"?l:(sl==="es"||sl==="en"?sl:navLang);
if(!s.getItem("boot_seen")&&!dl)d.dataset.boot="1";}catch(e){d.dataset.audience=q==="rrhh"?"rrhh":"ti";d.dataset.lang=l==="en"||l==="es"?l:navLang;if(!dl)d.dataset.boot="1";}
d.lang=d.dataset.lang;
var TILE_GAP=12;
${fns}
function apply(){if(d.dataset.app){removeEventListener("resize",apply);return;}var size={width:innerWidth,height:innerHeight};var c=isCompactViewport(size);var k=c?1:uiScaleFor(size);var a=deskArea(size,c,k,0);
d.style.setProperty("--ui-scale",String(k));d.style.setProperty("--hero-pt",(a.y+8)+"px");d.style.setProperty("--hero-pb",(size.height-a.y-a.h+8)+"px");}
apply();addEventListener("resize",apply);})();`;
}
