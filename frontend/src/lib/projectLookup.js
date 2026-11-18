/* Project data for the "project detail" window, loaded on demand by the shell (dynamic import), so the
   project catalogue never has to travel in the initial chunk. */
import { contentFor } from "../data/useContent.js";
import { hrFor } from "../data/useHR.js";

/* { project, title, hrTitle } or null for an unknown id */
export function findProject(id, lang = "es") {
  const project = contentFor(lang).PROJECTS.find((p) => p.id === id);
  if (!project) return null;
  return { project, title: project.title, hrTitle: hrFor(lang).HR_PROJECTS[project.id]?.title ?? project.title };
}
