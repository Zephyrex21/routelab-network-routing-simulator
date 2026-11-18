# Application shell

`App.jsx` registers the RouteLab routes and composes the shared theme and notification providers. `AppShell` owns the responsive navigation layout, while `ThemeProvider` persists the selected theme and updates browser theme-colour metadata.

`AppErrorBoundary` provides a visible recovery screen for errors thrown during React rendering. `index.html` also includes a separate pre-mount boot fallback for module-loading or startup failures.

Keep route registration and application-wide providers here. Feature calculations belong in their feature modules or the UI-independent `src/engine` layer.
