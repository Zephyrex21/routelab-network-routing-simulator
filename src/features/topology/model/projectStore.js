import { validateProject } from './projectModel.js';

const STORAGE_KEY = 'routelab-project-library-v1';
const STORAGE_VERSION = 1;
const MAX_SAVED_PROJECTS = 30;
const EMPTY_LIBRARY = () => ({ version: STORAGE_VERSION, projects: [], lastProjectId: null });

function readLibraryState() {
  let raw = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return { ok: true, library: EMPTY_LIBRARY(), raw: null };
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch {
      return { ok: false, raw, message: 'The saved-project library could not be read because its data is damaged. Existing data was preserved; recover it before saving again.' };
    }
    if (parsed?.version !== STORAGE_VERSION || !Array.isArray(parsed.projects)) {
      return { ok: false, raw, message: 'The saved-project library uses an unsupported storage version. Existing data was preserved; recover it before saving again.' };
    }
    return { ok: true, library: parsed, raw };
  } catch {
    return { ok: false, raw, message: 'Browser storage is unavailable in this session. Existing saved data was not changed.' };
  }
}

function writeLibrary(library, changedProject = null) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    if (changedProject !== false) announceProjectChanged(changedProject);
    return { ok: true };
  } catch (error) {
    const quota = error?.name === 'QuotaExceededError';
    return { ok: false, message: quota
      ? 'Browser storage is full. Export a project and remove older saved copies.'
      : 'Browser storage is unavailable in this session.' };
  }
}

function validProjects(library) {
  return library.projects.filter((project) => validateProject(project).valid);
}

export function getProjectLibraryStatus() {
  const state = readLibraryState();
  return state.ok
    ? { ok: true, status: 'available', rawContent: null, message: '' }
    : { ok: false, status: 'recovery-required', rawContent: state.raw, message: state.message };
}

export function getSavedProjects() {
  const state = readLibraryState();
  if (!state.ok) return [];
  return validProjects(state.library)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

/** Return only the explicitly active project; never silently substitute another topology. */
export function getActiveProject() {
  return getLastProject();
}

export function getLastProject() {
  const state = readLibraryState();
  if (!state.ok || !state.library.lastProjectId) return null;
  return state.library.projects.find((project) => (
    project.projectId === state.library.lastProjectId && validateProject(project).valid
  )) || null;
}

/** Make an existing saved project the shared project used by all lab workspaces. */
export function activateProject(projectId) {
  const state = readLibraryState();
  if (!state.ok) return { ok: false, message: state.message };
  const project = state.library.projects.find((item) => (
    item.projectId === projectId && validateProject(item).valid
  ));
  if (!project) return { ok: false, message: 'That saved project is no longer available. Refresh the project library.' };
  if (state.library.lastProjectId === projectId) return { ok: true };
  return writeLibrary({ ...state.library, lastProjectId: projectId }, project);
}

/** Clear selection while a new/imported unsaved draft is open. */
export function clearActiveProject() {
  const state = readLibraryState();
  if (!state.ok) return { ok: false, message: state.message };
  if (state.library.lastProjectId === null) return { ok: true };
  return writeLibrary({ ...state.library, lastProjectId: null }, null);
}

export function saveProject(project) {
  if (!validateProject(project).valid) return { ok: false, message: 'This project is invalid and cannot be saved.' };
  const state = readLibraryState();
  if (!state.ok) return { ok: false, message: state.message };

  // Preserve malformed legacy records instead of silently discarding recoverable data.
  const projects = [...state.library.projects];
  const index = projects.findIndex((item) => item?.projectId === project.projectId);
  if (index >= 0) {
    projects[index] = project;
  } else {
    if (validProjects(state.library).length >= MAX_SAVED_PROJECTS) {
      return { ok: false, message: `The project library is full (${MAX_SAVED_PROJECTS} projects). Export or explicitly delete a saved project before adding another.` };
    }
    projects.unshift(project);
  }
  return writeLibrary({ ...state.library, version: STORAGE_VERSION, projects, lastProjectId: project.projectId }, project);
}

export function deleteSavedProject(projectId) {
  const state = readLibraryState();
  if (!state.ok) return { ok: false, message: state.message };
  const projects = state.library.projects.filter((project) => project?.projectId !== projectId);
  const wasActive = state.library.lastProjectId === projectId;
  const nextActive = wasActive
    ? projects.filter((project) => validateProject(project).valid)
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0] || null
    : null;
  return writeLibrary({
    ...state.library,
    projects,
    lastProjectId: wasActive ? nextActive?.projectId || null : state.library.lastProjectId,
  }, wasActive ? nextActive : false);
}

function announceProjectChanged(project) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  try {
    window.dispatchEvent(new CustomEvent('routelab:project-saved', {
      detail: { projectId: project?.projectId || null, topologyRevision: project?.topologyRevision ?? null },
    }));
  } catch {
    // Persistence must not fail because a same-tab notification is unavailable.
  }
}
