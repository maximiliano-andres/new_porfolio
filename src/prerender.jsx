/* Build-time entry (vite build --ssr): renders the landing screen to static HTML for index.html,
   plus the tiny head script that sizes it exactly like the app's layout engine would.
   Used only by scripts/prerender.mjs — never shipped to the browser. */
import { renderToStaticMarkup } from "react-dom/server";
import { LazyMotion, domMax } from "framer-motion";
import { CircuitBackground } from "./components/CircuitBackground.jsx";
import { Dock } from "./components/Dock.jsx";
import { Hero } from "./components/Hero.jsx";
import { TopBar } from "./components/TopBar.jsx";
import { AudienceContext } from "./context.js";
import { DOCK_ITEMS } from "./data/system.js";
import { deskArea, dockSpaceFor, isCompactViewport, makeInitialWindows, uiScaleFor } from "./layout.js";

const noop = () => {};
const AUDIENCES = ["ti", "rrhh"];

/* the landing screen for both audiences; CSS (index.css) shows the one the head script selects */
export function renderShell() {
  const withAudience = (audience, node) => (
    <AudienceContext.Provider value={{ audience, setAudience: noop }}>{node}</AudienceContext.Provider>
  );
  return renderToStaticMarkup(
    <LazyMotion features={domMax}>
      <div data-shell-root className="relative w-full h-dvh overflow-hidden" style={{ fontFamily: "'Inter', 'Inter Fallback', sans-serif" }}>
        <CircuitBackground energized={[]} />
        {AUDIENCES.map((a) => (
          <div key={a} data-shell={a}>{withAudience(a, <TopBar scale="var(--ui-scale, 1)" />)}</div>
        ))}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {AUDIENCES.map((a) => (
            <div key={a} data-shell={a} data-shell-hero>
              {withAudience(a, (
                <Hero hr={a === "rrhh"} insets={{ top: "var(--hero-pt)", bottom: "var(--hero-pb)" }} animateIn={false} />
              ))}
            </div>
          ))}
        </div>
        {/* the dock looks the same for both audiences (only its accessible labels differ) */}
        <div data-shell-hero>
          <Dock items={DOCK_ITEMS} windows={makeInitialWindows()} onToggle={noop} scale="var(--ui-scale, 1)" />
        </div>
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

/* inline <head> script: picks the audience, flags first visits, and sizes the shell using the very
   same layout functions (their source is embedded, so the formulas can't drift apart) */
export function shellScript() {
  const fns = [uiScaleFor, isCompactViewport, dockSpaceFor, deskArea].map((f) => f.toString()).join("\n");
  return `(function(){var d=document.documentElement;
try{var q=new URLSearchParams(location.search).get("vista");var s=window.localStorage;
d.dataset.audience=q==="rrhh"||q==="ti"?q:(s.getItem("audience")==="rrhh"?"rrhh":"ti");
if(!s.getItem("boot_seen"))d.dataset.boot="1";}catch(e){d.dataset.audience="ti";}
var TILE_GAP=12;
${fns}
function apply(){var size={width:innerWidth,height:innerHeight};var c=isCompactViewport(size);var k=c?1:uiScaleFor(size);var a=deskArea(size,c,k,0);
d.style.setProperty("--ui-scale",String(k));d.style.setProperty("--hero-pt",(a.y+8)+"px");d.style.setProperty("--hero-pb",(size.height-a.y-a.h+8)+"px");}
apply();addEventListener("resize",apply);})();`;
}
