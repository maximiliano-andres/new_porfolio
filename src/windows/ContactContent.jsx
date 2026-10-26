/* Contact form (POST /api/contact) — shared by both views. */
import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Github, Linkedin, Loader2, Mail, Send } from "lucide-react";
import { useAudience, useSystem } from "../context.js";
import { CORE, LANG, SOCIAL_LINKS } from "../theme.js";

/* same limits the server enforces (main.py · ContactMessage) */
const LIMITS = { name: 100, email: 254, message: 5000 };
const REQUEST_TIMEOUT_MS = 12000;
const EMPTY_FORM = { name: "", email: "", message: "", website: "" };

/* maps the API's answer to a message the visitor can act on */
function submitErrorFor(res) {
  if (res.status === 429) {
    const minutes = Math.ceil(Number(res.headers.get("Retry-After") || 600) / 60);
    return `Enviaste varios mensajes seguidos. Podrás volver a escribir en unos ${minutes} min.`;
  }
  if (res.status === 413) return "El mensaje es demasiado largo.";
  if (res.status === 422) return "Revisa los datos del formulario.";
  if (res.status >= 500) return "El servidor no pudo procesar el mensaje. Intenta de nuevo en unos minutos.";
  return "No se pudo enviar el mensaje. Intenta de nuevo en unos minutos.";
}

export function ContactContent() {
  const { audience } = useAudience();
  const { unlock } = useSystem();
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errors, setErrors] = useState({});
  const [imgError, setImgError] = useState(false);
  const inFlight = useRef(null);
  const mounted = useRef(true);

  // closing the window mid-request aborts it instead of updating an unmounted form
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      inFlight.current?.abort();
    };
  }, []);

  const validate = () => {
    const errs = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();
    if (!name) errs.name = "Requerido";
    else if (name.length > LIMITS.name) errs.name = `Máximo ${LIMITS.name} caracteres`;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > LIMITS.email) errs.email = "Email inválido";
    if (!message) errs.message = "Requerido";
    else if (message.length > LIMITS.message) errs.message = `Máximo ${LIMITS.message} caracteres`;
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (status === "loading") return;
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    const controller = new AbortController();
    inFlight.current = controller;
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, name: form.name.trim(), email: form.email.trim(), message: form.message.trim() }),
        signal: controller.signal,
      });
      if (!mounted.current) return;
      if (!res.ok) {
        const fieldErrs = {};
        if (res.status === 422) {
          const body = await res.json().catch(() => ({}));
          for (const f of body.fields || []) if (f in LIMITS) fieldErrs[f] = "Revisa este campo";
        }
        setErrors({ ...fieldErrs, submit: submitErrorFor(res) });
        setStatus("error");
        return;
      }
      setStatus("success");
      unlock("contact");
    } catch (err) {
      if (!mounted.current) return;
      setErrors({
        submit: err.name === "AbortError"
          ? "El servidor tardó demasiado en responder. Intenta de nuevo."
          : "Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.",
      });
      setStatus("error");
    } finally {
      clearTimeout(timer);
      if (inFlight.current === controller) inFlight.current = null;
    }
  };

  const field = (key) => ({
    disabled: status === "loading",
    maxLength: LIMITS[key],
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `c-${key}-error` : undefined,
    style: { borderColor: errors[key] ? "#f87171" : "rgba(255,255,255,0.1)" },
  });

  // 16px on phones: iOS Safari auto-zooms the page when focusing inputs smaller than that
  const inputCls =
    "w-full rounded-md bg-black/30 border px-3 py-2.5 sm:py-2 text-[16px] sm:text-[12.5px] text-white/90 placeholder:text-white/30 outline-none transition-colors focus:border-[#22D3EE] disabled:opacity-50";

  if (status === "success") {
    return (
      <div className="w-full flex flex-col items-center text-center py-6">
        <CheckCircle2 size={30} style={{ color: LANG.node.c2 }} className="mb-3" />
        <div className="text-[13.5px] font-medium text-white/90 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Mensaje enviado
        </div>
        <p className="text-[12px] text-white/65 mb-4">Responderé dentro de 24&ndash;48 horas hábiles.</p>
        <button
          onClick={() => { setStatus("idle"); setForm(EMPTY_FORM); }}
          className="text-[11.5px] px-3 py-1.5 rounded-lg border border-white/15 text-white/70 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-4 p-2 rounded-lg border border-white/5 bg-white/[0.01] select-none">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-black/40 shrink-0 border border-cyan-500/20 flex items-center justify-center">
          {!imgError ? (
            <img
              src="/img/max_andres_head_256.webp" width={256} height={234} decoding="async"
              alt="Maximiliano"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white/20 font-bold text-[11px] select-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>MC</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="text-[12px] font-medium text-white/90">
            {audience === "rrhh" ? "¿Tienes un proceso de selección abierto?" : "¿Trabajamos juntos?"}
          </div>
          <div className="text-[10px] text-white/50">
            {audience === "rrhh" ? "Coordinemos una entrevista; respondo en 24–48 horas hábiles" : "Hablemos sobre tu próximo sistema backend"}
          </div>
        </div>
      </div>
      <form onSubmit={submit} noValidate className="relative">
        <div className="mb-3">
          <label htmlFor="c-name" className="block text-[11px] text-white/50 mb-1">Nombre</label>
          <input id="c-name" autoComplete="name" className={inputCls} placeholder="Tu nombre" {...field("name")} />
          {errors.name && <p id="c-name-error" className="text-[10.5px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.name}</p>}
        </div>
        <div className="mb-3">
          <label htmlFor="c-email" className="block text-[11px] text-white/50 mb-1">Email</label>
          <input id="c-email" type="email" autoComplete="email" inputMode="email" className={inputCls} placeholder="tu@correo.com" {...field("email")} />
          {errors.email && <p id="c-email-error" className="text-[10.5px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.email}</p>}
        </div>
        <div className="mb-4">
          <label htmlFor="c-msg" className="block text-[11px] text-white/50 mb-1">Mensaje</label>
          <textarea id="c-msg" rows={3} className={inputCls + " resize-none"} placeholder="Cuéntame sobre tu proyecto..." {...field("message")} />
          {form.message.length > LIMITS.message * 0.8 && (
            <p className="text-[10px] text-white/40 mt-1 text-right tabular-nums">{form.message.length} / {LIMITS.message}</p>
          )}
          {errors.message && <p id="c-message-error" className="text-[10.5px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.message}</p>}
        </div>
        {/* honeypot: hidden from people and assistive tech; bots that fill it are silently discarded */}
        <div aria-hidden="true" className="absolute left-0 top-0 w-px h-px overflow-hidden opacity-0 pointer-events-none">
          <label htmlFor="c-website">No completar</label>
          <input id="c-website" className="w-px h-px" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
        </div>
        {status === "error" && errors.submit && (
          <p role="alert" className="text-[11px] text-red-400 mb-3 flex items-start gap-1"><AlertCircle size={12} className="shrink-0 mt-0.5" />{errors.submit}</p>
        )}
        <button
          type="submit" disabled={status === "loading"}
          className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 sm:py-2 text-[13px] sm:text-[12.5px] font-medium transition-all disabled:opacity-70 focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-none hover:brightness-110 active:scale-[0.98]"
          style={{ background: `linear-gradient(90deg, ${CORE}, ${LANG.node.c1})`, color: "#05070b" }}
        >
          {status === "loading" ? (<><Loader2 size={14} className="animate-spin" /> Enviando...</>) : (<><Send size={13} /> Enviar mensaje</>)}
        </button>
      </form>
      <div className="flex items-center justify-center gap-4 mt-5 pt-4 border-t border-white/[0.08]">
        <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" title="GitHub" aria-label="GitHub" className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none">
          <Github size={18} />
        </a>
        <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" aria-label="LinkedIn" className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none">
          <Linkedin size={18} />
        </a>
        <a href={SOCIAL_LINKS.email} title="Email" aria-label="Email" className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none">
          <Mail size={18} />
        </a>
      </div>
    </div>
  );
}
