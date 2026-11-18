# Security Policy

## Supported release

Security fixes are made against the latest code on the `main` branch.

## Reporting a vulnerability

Please do not publish credentials, tokens, private user data or an exploitable vulnerability in a public issue.

If GitHub private vulnerability reporting is enabled for this repository, use the **Security → Advisories → Report a vulnerability** flow. Otherwise, contact the repository owner privately through the GitHub profile and include:

- A concise description of the affected component and impact.
- Reproduction steps or a proof of concept that does not expose real user data.
- The affected commit, dependency or environment, if known.
- Any suggested mitigation.

Please allow reasonable time for investigation and a fix before public disclosure.

## Project security boundaries

- RouteLab is a client-side educational simulator. It does not collect or transmit operating-system network traffic.
- User-created network projects are stored in browser LocalStorage unless the user explicitly exports a JSON file.
- Do not put secrets or sensitive information into topology labels or exported project files.
- The Vite development server is configured for loopback access and must not be exposed as a public production service.
- Production deployments should serve the built static assets, not the Vite development server.
