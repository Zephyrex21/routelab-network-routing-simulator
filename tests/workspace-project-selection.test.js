import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

let vite;
let ToastProvider;
let SimulationPage;
let PacketExplorerPage;
let NetworkFailureLabPage;
let ComparePage;

const savedProject = {
  schemaVersion: 1,
  projectId: 'project-saved-but-not-active',
  name: 'Saved but not selected',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  topologyRevision: 1,
  routers: [{ id: 'R1', label: 'R1', position: { x: 100, y: 100 } }],
  links: [],
};

function setLibraryWithoutActiveProject() {
  const previousWindow = globalThis.window;
  const library = { version: 1, projects: [savedProject], lastProjectId: null };
  globalThis.window = {
    localStorage: {
      getItem: (key) => key === 'routelab-project-library-v1' ? JSON.stringify(library) : null,
    },
  };
  return () => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  };
}

function renderWorkspace(Page) {
  return renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(ToastProvider, null, React.createElement(Page)),
    ),
  );
}

before(async () => {
  vite = await createServer({
    configFile: fileURLToPath(new URL('../vite.config.js', import.meta.url)),
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent',
  });
  const [toast, simulation, packet, failure, comparison] = await Promise.all([
    vite.ssrLoadModule('/src/components/ui/ToastProvider.jsx'),
    vite.ssrLoadModule('/src/features/simulation/SimulationPage.jsx'),
    vite.ssrLoadModule('/src/features/packet-explorer/PacketExplorerPage.jsx'),
    vite.ssrLoadModule('/src/features/network-failure/NetworkFailureLabPage.jsx'),
    vite.ssrLoadModule('/src/features/comparison/ComparePage.jsx'),
  ]);
  ToastProvider = toast.ToastProvider;
  SimulationPage = simulation.default;
  PacketExplorerPage = packet.default;
  NetworkFailureLabPage = failure.default;
  ComparePage = comparison.default;
});

after(async () => {
  await vite?.close();
});

test('Simulation Studio does not fall back to the first saved project when none is active', () => {
  const restore = setLibraryWithoutActiveProject();
  try {
    const html = renderWorkspace(SimulationPage);
    assert.match(html, /NO SAVED TOPOLOGY/);
    assert.match(html, /Give the algorithms a network to explore/);
    assert.doesNotMatch(html, /Saved but not selected/);
  } finally {
    restore();
  }
});

test('Packet Explorer respects the explicit active-project selection', () => {
  const restore = setLibraryWithoutActiveProject();
  try {
    const html = renderWorkspace(PacketExplorerPage);
    assert.match(html, /NO SAVED TOPOLOGY/);
    assert.match(html, /Build a network before sending a packet/);
    assert.doesNotMatch(html, /Saved but not selected/);
  } finally {
    restore();
  }
});

test('Network Failure Lab renders its empty state without falling back or throwing', () => {
  const restore = setLibraryWithoutActiveProject();
  try {
    const html = renderWorkspace(NetworkFailureLabPage);
    assert.match(html, /NO SAVED TOPOLOGY/);
    assert.match(html, /Create a network to experiment with/);
    assert.doesNotMatch(html, /Saved but not selected/);
  } finally {
    restore();
  }
});

test('Comparison Lab renders its empty state without a missing-import runtime error or fallback', () => {
  const restore = setLibraryWithoutActiveProject();
  try {
    const html = renderWorkspace(ComparePage);
    assert.match(html, /NO SAVED TOPOLOGY/);
    assert.match(html, /Build a network before comparing/);
    assert.doesNotMatch(html, /Saved but not selected/);
  } finally {
    restore();
  }
});
