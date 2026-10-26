/* Code-split window contents: each group is downloaded the first time one of its windows opens
   (or earlier, when its dock icon is hovered/focused or the browser is idle). */
import { lazy } from "react";

const loaders = {
  tech: () => import("./tech.jsx"),
  hr: () => import("./hr.jsx"),
  contact: () => import("./ContactContent.jsx"),
  terminal: () => import("./TerminalContent.jsx"),
  simulator: () => import("./SimulatorContent.jsx"),
  badges: () => import("./BadgesContent.jsx"),
};

const pick = (chunk, name) => lazy(() => loaders[chunk]().then((m) => ({ default: m[name] })));

export const AboutContent = pick("tech", "AboutContent");
export const SkillsContent = pick("tech", "SkillsContent");
export const ProjectsContent = pick("tech", "ProjectsContent");
export const ProjectDetailContent = pick("tech", "ProjectDetailContent");
export const ExperienceContent = pick("tech", "ExperienceContent");
export const EducationContent = pick("tech", "EducationContent");
export const CertificationsContent = pick("tech", "CertificationsContent");

export const HRSummaryContent = pick("hr", "HRSummaryContent");
export const AboutHRContent = pick("hr", "AboutHRContent");
export const SkillsHRContent = pick("hr", "SkillsHRContent");
export const ProjectsHRContent = pick("hr", "ProjectsHRContent");
export const ProjectDetailHRContent = pick("hr", "ProjectDetailHRContent");
export const ExperienceHRContent = pick("hr", "ExperienceHRContent");
export const CertificationsHRContent = pick("hr", "CertificationsHRContent");

export const ContactContent = pick("contact", "ContactContent");
export const TerminalContent = pick("terminal", "TerminalContent");
export const SimulatorContent = pick("simulator", "SimulatorContent");
export const BadgesContent = pick("badges", "BadgesContent");

const WINDOW_CHUNKS = {
  about: ["tech", "hr"], hr: ["hr"], skills: ["tech", "hr"], projects: ["tech", "hr"],
  experience: ["tech", "hr"], education: ["tech"], certifications: ["tech", "hr"],
  contact: ["contact"], terminal: ["terminal"], simulator: ["simulator"], badges: ["badges"],
};
const requested = new Set();

/* warm the browser cache for a window's code; failures are forgotten so a later attempt can retry */
export function prefetchWindow(id) {
  for (const chunk of WINDOW_CHUNKS[id] || []) {
    if (requested.has(chunk)) continue;
    requested.add(chunk);
    loaders[chunk]().catch(() => requested.delete(chunk));
  }
}
