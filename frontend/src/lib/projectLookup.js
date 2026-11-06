/* Project data for the "project detail" window, loaded on demand by the shell (dynamic import), so the
   project catalogue never has to travel in the initial chunk. */
import { PROJECTS } from "../data/content.js";
import { HR_PROJECTS } from "../data/hr.js";

/* { project, title, hrTitle } or null for an unknown id */
export function findProject(id) {
  const project = PROJECTS.find((p) => p.id === id);
  if (!project) return null;
  return { project, title: project.title, hrTitle: HR_PROJECTS[project.id]?.title ?? project.title };
}
