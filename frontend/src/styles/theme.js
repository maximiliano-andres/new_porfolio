/* ============================================================
   DESIGN TOKENS
   Display: "Space Grotesk" — technical, geometric, reads like an
   engineering typeface rather than a generic portfolio serif.
   Body: "Inter". Utility/data: "JetBrains Mono" (stats, badges).
   Palette: near-black PCB base + the three runtime colors
   (Python / Java / Node) + a cyan "compiled core" accent that
   stands for the native, memory-safe, zero-cost layer underneath
   every runtime — the literal "background" of this portfolio.
   ============================================================ */

export const LANG = {
  python: {
    name: "Python",
    c1: "#4B8BBE",
    c2: "#FFD43B",
    label: "CPython 3.13",
  },
  java: { name: "Java", c1: "#F8981D", c2: "#5382A1", label: "OpenJDK 21 LTS" },
  node: { name: "Node.js", c1: "#3C8C40", c2: "#7CC576", label: "Node 22 LTS" },
};

export const CORE = "#22D3EE";

/* contact goes through the visitor's own mail app (RFC 6068 mailto:); the site sends nothing itself */
export const CONTACT_EMAIL = "max.andres1995@outlook.com";
export const CONTACT_SUBJECT = "Contacto profesional desde tu portafolio";

export const SOCIAL_LINKS = {
  github: "https://github.com/maximiliano-andres",
  linkedin: "https://www.linkedin.com/in/maximiliano-andres",
  // encodeURIComponent → spaces as %20 and accents as UTF-8 percent-escapes, which every mail client decodes
  email: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(CONTACT_SUBJECT)}`,
};

/* gold accent for everything in the recruiter-facing (RRHH) view */
export const HR_ACCENT = LANG.python.c2;
