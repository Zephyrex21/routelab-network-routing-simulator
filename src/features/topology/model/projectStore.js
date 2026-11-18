import { validateProject } from './projectModel.js';

const STORAGE_KEY = 'routelab-project-library-v1';
const STORAGE_VERSION = 1;

function readLibrary() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: STORAGE_VERSION, projects: [], lastProjectId: null };
    const parsed = JSON.parse(raw);
    if (parsed?.version !== STORAGE_VERSION || !Array.isArray(parsed.projects)) {
      return { version: STORAGE_VERSION, projects: [], lastProjectId: null };
    }
    return parsed;
  } catch {
    return { version: STORAGE_VERSION, projects: [], lastProjectId: null };
  }
}

function writeLibrary(library) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    return { ok: true };
  } catch (error) {
    const quota = error?.name === 'QuotaExceededError';
    return { ok: false, message: quota ? 'Browser storage is full. Export a project and remove older saved copies.' : 'Browser storage is unavailable in this session.' };
  }
}

export function getSavedProjects() {
  const library = readLibrary();
  return library.projects.filter((project) => validateProject(project).valid)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function getLastProject() {
  const library = readLibrary();
  return library.projects.find((project) => project.projectId === library.lastProjectId && validateProject(project).valid) || null;
}

export function saveProject(project) {
  if (!validateProject(project).valid) return { ok: false, message: 'This project is invalid and cannot be saved.' };
  const library = readLibrary();
  const projects = library.projects.filter((item) => validateProject(item).valid);
  const index = projects.findIndex((item) => item.projectId === project.projectId);
  if (index >= 0) projects[index] = project;
  else projects.unshift(project);
  const result = writeLibrary({ version: STORAGE_VERSION, projects: projects.slice(0, 30), lastProjectId: project.projectId });
  if (result.ok) announceProjectSaved(project);
  return result;
}

export function deleteSavedProject(projectId) {
  const library = readLibrary();
  const projects = library.projects.filter((project) => validateProject(project).valid && project.projectId !== projectId);
  const lastProjectId = library.lastProjectId === projectId ? projects[0]?.projectId || null : library.lastProjectId;
  return writeLibrary({ version: STORAGE_VERSION, projects, lastProjectId });
}

function announceProjectSaved(project) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  try {
    window.dispatchEvent(new CustomEvent('routelab:project-saved', {
      detail: { projectId: project.projectId, topologyRevision: project.topologyRevision },
    }));
  } catch {
    // Project persistence must not fail because a UI notification is unavailable.
  }
}
