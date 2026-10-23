/* Contact form (POST /api/contact) — shared by both views. */
import { useState } from "react";
import { AlertCircle, CheckCircle2, Github, Linkedin, Loader2, Mail, Send } from "lucide-react";
import { useAudience, useSystem } from "../context.js";
import { CORE, LANG, SOCIAL_LINKS } from "../theme.js";

export function ContactContent() {
  const { audience } = useAudience();
  const { unlock } = useSystem();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errors, setErrors] = useState({});
  const [imgError, setImgError] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Requerido";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Email inválido";
    if (!form.message.trim()) errs.message = "Requerido";
    setErrors(errs);
    if (Object.keys(errs).length) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("success");
      unlock("contact");
    } catch {
      setErrors({ submit: "No se pudo enviar el mensaje. Intenta de nuevo en unos minutos." });
      setStatus("error");
    }
  };

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
          onClick={() => { setStatus("idle"); setForm({ name: "", email: "", message: "" }); }}
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
              src="/img/max_andres_head.webp"
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
      <form onSubmit={submit} noValidate>
        <div className="mb-3">
          <label htmlFor="c-name" className="block text-[11px] text-white/50 mb-1">Nombre</label>
          <input
            id="c-name" disabled={status === "loading"}
            className={inputCls} style={{ borderColor: errors.name ? "#f87171" : "rgba(255,255,255,0.1)" }}
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Tu nombre"
          />
          {errors.name && <p className="text-[10.5px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.name}</p>}
        </div>
        <div className="mb-3">
          <label htmlFor="c-email" className="block text-[11px] text-white/50 mb-1">Email</label>
          <input
            id="c-email" type="email" disabled={status === "loading"}
            className={inputCls} style={{ borderColor: errors.email ? "#f87171" : "rgba(255,255,255,0.1)" }}
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="tu@correo.com"
          />
          {errors.email && <p className="text-[10.5px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.email}</p>}
        </div>
        <div className="mb-4">
          <label htmlFor="c-msg" className="block text-[11px] text-white/50 mb-1">Mensaje</label>
          <textarea
            id="c-msg" rows={3} disabled={status === "loading"}
            className={inputCls + " resize-none"} style={{ borderColor: errors.message ? "#f87171" : "rgba(255,255,255,0.1)" }}
            value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Cuéntame sobre tu proyecto..."
          />
          {errors.message && <p className="text-[10.5px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.message}</p>}
        </div>
        {status === "error" && errors.submit && (
          <p className="text-[11px] text-red-400 mb-3 flex items-center gap-1"><AlertCircle size={12} />{errors.submit}</p>
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
