/* "Optimize this process" simulator inspired by the IACC case (illustrative model). */
import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { useAudience, useSystem } from "../context.js";
import { prefersReducedMotion } from "../lib/env.js";
import { sound } from "../lib/sound.js";
import { CORE, HR_ACCENT, LANG } from "../theme.js";

/* ---------- optimization simulator (inspired by the IACC case) ----------
   Amdahl-style model on an 8-core machine: parallelism helps up to the core
   count, more threads add coordination overhead; caching shrinks the serial
   part and indexes shrink the per-record work. Illustrative, not a benchmark. */
const SIM_CORES = 8;

const SIM_BASE_MIN = 62;

function simulateMinutes({ threads, cache, index }) {
  const serial = 0.12 * (cache ? 0.5 : 1);
  const parallel = 0.88 * (index ? 0.75 : 1);
  const effective = Math.min(threads, SIM_CORES);
  const overhead = 1 + Math.max(0, threads - SIM_CORES) * 0.04;
  return SIM_BASE_MIN * (serial + parallel / effective) * overhead;
}

const fmtMin = (m) => (m >= 60 ? `${Math.floor(m / 60)} h ${Math.round(m % 60)} min` : `${m.toFixed(1)} min`);

export function SimulatorContent() {
  const { audience } = useAudience();
  const { unlock } = useSystem();
  const hr = audience === "rrhh";
  const [cfg, setCfg] = useState({ threads: 1, cache: false, index: false });
  const [run, setRun] = useState(null); // { minutes, started } while/after running
  const [progress, setProgress] = useState(0);
  const minutes = simulateMinutes(cfg);
  const lanes = Math.min(cfg.threads, SIM_CORES);

  const execute = () => {
    sound.play("click");
    setRun({ minutes, lanes, started: performance.now() });
    setProgress(0);
  };
  useEffect(() => {
    if (!run) return;
    // animation time scales with the simulated time (62 min ≈ 3.2 s)
    const total = prefersReducedMotion() ? 1 : Math.max(500, (run.minutes / SIM_BASE_MIN) * 3200);
    let frame = 0;
    const step = (t) => {
      const k = Math.min(1, (t - run.started) / total);
      setProgress(k);
      if (k < 1) frame = requestAnimationFrame(step);
      else if (run.minutes <= 10) unlock("optimizer");
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [run, unlock]);

  const done = run && progress >= 1;
  const verdict = !done ? null : run.minutes <= 10
    ? { text: hr ? "¡Objetivo logrado! Así se redujo un proceso real en IACC de más de 1 hora a 5–10 minutos." : "¡Optimizado! Mismo orden de mejora que el caso real de IACC (>1 h → 5–10 min).", color: LANG.node.c2 }
    : run.minutes <= 30
      ? { text: hr ? "Mucho mejor, pero aún se puede más. Prueba combinando las opciones." : "Mejor, pero queda margen: combina paralelismo con caché e índices.", color: HR_ACCENT }
      : { text: hr ? "Sigue lento. Prueba repartir el trabajo entre más trabajadores." : "Cuello de botella: el proceso sigue siendo casi secuencial.", color: "#f87171" };

  const L = hr
    ? { threads: "Trabajadores en paralelo", cache: "Memoria rápida (caché)", index: "Datos ordenados para búsqueda (índices)", cores: "capacidad del servidor" }
    : { threads: "Hilos en paralelo (threads)", cache: "Caché de consultas", index: "Índices en base de datos", cores: "núcleos de CPU" };

  return (
    <div className="w-full">
      <p className="text-[12.5px] text-white/65 leading-5 mb-4">
        {hr
          ? "Tu misión: un proceso de datos tarda más de 1 hora. Ajusta las opciones y ejecútalo hasta dejarlo en 10 minutos o menos."
          : "Reto: un batch de datos tarda ~62 min en ejecución secuencial. Ajusta la configuración y bájalo a ≤ 10 min."}
      </p>

      <div className="space-y-4 rounded-lg border border-white/10 bg-black/25 p-4">
        <label className="block">
          <span className="flex items-center justify-between text-[12px] text-white/80 mb-2">
            {L.threads}
            <span className="tabular-nums" style={{ color: CORE, fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>{cfg.threads}</span>
          </span>
          <input
            type="range" min="1" max="16" value={cfg.threads}
            onChange={(e) => setCfg({ ...cfg, threads: Number(e.target.value) })}
            className="w-full accent-[#22D3EE] h-6"
            aria-describedby="sim-cores"
          />
          <span id="sim-cores" className="block text-[10.5px] text-white/40 mt-0.5">
            {SIM_CORES} {L.cores}{cfg.threads > SIM_CORES && <span className="text-[#f87171]"> · más {hr ? "trabajadores" : "hilos"} que {hr ? "capacidad" : "núcleos"}: se pierde tiempo coordinándolos</span>}
          </span>
        </label>
        {[["cache", L.cache], ["index", L.index]].map(([k, label]) => (
          <label key={k} className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="text-[12px] text-white/80">{label}</span>
            <button
              role="switch"
              aria-checked={cfg[k]}
              onClick={() => setCfg({ ...cfg, [k]: !cfg[k] })}
              className="relative w-10 h-6 rounded-full transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-hidden"
              style={{ background: cfg[k] ? CORE : "rgba(255,255,255,0.15)" }}
            >
              <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all" style={{ left: cfg[k] ? 20 : 4 }} />
            </button>
          </label>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 my-4">
        <div className="rounded-lg border border-white/10 p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/40" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>Tiempo estimado</div>
          <div className="text-[22px] font-semibold tabular-nums mt-1" style={{ color: minutes <= 10 ? LANG.node.c2 : minutes <= 30 ? HR_ACCENT : "#f87171", fontFamily: "'Space Grotesk', 'Space Grotesk Fallback', sans-serif" }}>{fmtMin(minutes)}</div>
        </div>
        <div className="rounded-lg border border-white/10 p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/40" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>{hr ? "Mejora" : "Speed-up"}</div>
          <div className="text-[22px] font-semibold tabular-nums mt-1 text-white/90" style={{ fontFamily: "'Space Grotesk', 'Space Grotesk Fallback', sans-serif" }}>
            {hr ? `−${Math.max(0, Math.round((1 - minutes / SIM_BASE_MIN) * 100))}%` : `×${(SIM_BASE_MIN / minutes).toFixed(1)}`}
          </div>
        </div>
      </div>

      <button
        onClick={execute}
        disabled={run && !done}
        className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-medium disabled:opacity-60 hover:brightness-110 active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-hidden"
        style={{ background: `linear-gradient(90deg, ${CORE}, ${LANG.node.c1})`, color: "#05070b" }}
      >
        <Play size={14} /> {run && !done ? (hr ? "Procesando…" : "Ejecutando…") : hr ? "Ejecutar proceso" : "Ejecutar batch"}
      </button>

      {run && (
        <div className="mt-4" aria-live="polite">
          <div className="space-y-1.5">
            {Array.from({ length: run.lanes }).map((_, i) => (
              <div key={i} className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, progress * (100 + i * 3))}%`, background: `linear-gradient(90deg, ${CORE}88, ${CORE})` }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1.5 text-[10.5px] text-white/40" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>
            <span>{run.lanes} {hr ? (run.lanes === 1 ? "trabajador" : "trabajadores") : run.lanes === 1 ? "hilo" : "hilos"}</span>
            <span>{fmtMin(run.minutes * progress)} / {fmtMin(run.minutes)}</span>
          </div>
          {verdict && (
            <p className="mt-3 rounded-lg border px-3 py-2.5 text-[12px] leading-5" style={{ borderColor: `${verdict.color}55`, color: verdict.color, background: `${verdict.color}0d` }}>
              {verdict.text}
            </p>
          )}
        </div>
      )}

      <p className="mt-4 text-[10.5px] text-white/35 leading-4">
        Simulación ilustrativa inspirada en el caso real de IACC (de más de 1 hora a 5–10 minutos). Los valores son aproximados.
      </p>
    </div>
  );
}
