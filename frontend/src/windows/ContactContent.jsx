/* Contact window: plain mailto: links, so the visitor's own mail app opens with the address and subject
   already filled in. No form, no request to the server. The address stays visible to copy by hand
   (e.g. when the device has no mail app configured). */
import { useState } from "react";
import { ArrowUpRight, Github, Linkedin, Mail } from "lucide-react";
import { useAudience, useSystem } from "../app/context.js";
import { CONTACT_EMAIL, CORE, LANG, SOCIAL_LINKS } from "../styles/theme.js";

const MAIL_HINT_ID = "c-mail-hint";
const ring = "focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-hidden";

export function ContactContent() {
  const { audience } = useAudience();
  const { unlock } = useSystem();
  const [imgError, setImgError] = useState(false);
  const hr = audience === "rrhh";
  // the only script here: the "Conexión" badge, unlocked when the visitor heads to their mail app
  const onMail = () => unlock("contact");

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-5 p-2 rounded-lg border border-white/5 bg-white/[0.01] select-none">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-black/40 shrink-0 border border-cyan-500/20 flex items-center justify-center">
          {!imgError ? (
            <img
              src="/img/max_andres_head_256.webp" width={256} height={234} decoding="async"
              alt="Maximiliano"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white/60 font-bold text-[11px] select-none" style={{ fontFamily: "'Space Grotesk', 'Space Grotesk Fallback', sans-serif" }}>MC</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="text-[12px] font-medium text-white/90">
            {hr ? "¿Tienes un proceso de selección abierto?" : "¿Trabajamos juntos?"}
          </div>
          <div className="text-[10.5px] text-white/65">
            {hr ? "Coordinemos una entrevista; respondo en 24–48 horas hábiles" : "Hablemos sobre tu próximo sistema backend"}
          </div>
        </div>
      </div>

      {/* the address itself: visible, a link, and selectable in one tap/click to copy it manually */}
      <div className="rounded-lg border p-4 text-center" style={{ borderColor: `${CORE}2e`, background: `${CORE}08` }}>
        <div className="text-[10.5px] uppercase tracking-wider text-white/65 mb-1.5" style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace" }}>
          Correo
        </div>
        <a
          href={SOCIAL_LINKS.email}
          onClick={onMail}
          aria-describedby={MAIL_HINT_ID}
          className={`inline-block max-w-full break-all select-all text-[15px] sm:text-[16px] font-medium text-white hover:underline underline-offset-4 decoration-white/40 rounded-sm ${ring}`}
          style={{ fontFamily: "'Space Grotesk', 'Space Grotesk Fallback', sans-serif" }}
        >
          {CONTACT_EMAIL}
        </a>

        <a
          href={SOCIAL_LINKS.email}
          onClick={onMail}
          aria-describedby={MAIL_HINT_ID}
          className={`mt-4 w-full flex items-center justify-center gap-2 rounded-lg py-3 sm:py-2.5 text-[13.5px] sm:text-[13px] font-medium transition-all hover:brightness-110 active:scale-[0.98] ${ring}`}
          style={{ background: `linear-gradient(90deg, ${CORE}, ${LANG.node.c1})`, color: "#05070b" }}
        >
          <Mail size={15} aria-hidden="true" /> {hr ? "Escribir para coordinar una entrevista" : "Enviar un correo"}
          <ArrowUpRight size={14} aria-hidden="true" className="opacity-70" />
        </a>
        <p id={MAIL_HINT_ID} className="mt-2 text-[11px] leading-4 text-white/65">
          Se abrirá tu aplicación de correo con el destinatario y el asunto listos. Si no se abre, copia la dirección de arriba.
        </p>
      </div>

      <div className="flex items-center justify-center gap-4 mt-5 pt-4 border-t border-white/[0.08]">
        <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" title="GitHub" aria-label="GitHub" className={`w-10 h-10 flex items-center justify-center rounded-full border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-colors ${ring}`}>
          <Github size={18} />
        </a>
        <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" aria-label="LinkedIn" className={`w-10 h-10 flex items-center justify-center rounded-full border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-colors ${ring}`}>
          <Linkedin size={18} />
        </a>
        <a href={SOCIAL_LINKS.email} onClick={onMail} title={`Correo: ${CONTACT_EMAIL}`} aria-label={`Enviar un correo a ${CONTACT_EMAIL}`} className={`w-10 h-10 flex items-center justify-center rounded-full border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-colors ${ring}`}>
          <Mail size={18} />
        </a>
      </div>
    </div>
  );
}
