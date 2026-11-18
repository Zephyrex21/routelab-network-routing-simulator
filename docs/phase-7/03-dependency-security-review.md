# Phase 7 dependency and security review

## Reviewed changes

| Item | Phase 6 state | Phase 7 action |
|---|---|---|
| Vite | Range `^7.0.0`; dev server bound to `0.0.0.0` | Pin `7.3.8`; bind dev and preview to `127.0.0.1`; allow only localhost/loopback hostnames; strict filesystem serving. |
| Vite advisory | The 10 Nov 2026 GHSA reports affected Vite 7 versions through `7.3.7` | Use patched `7.3.8`; keep dev server off the LAN. |
| Recharts | Declared as `^2.15.0`, but not imported by source | Remove unused dependency and avoid a chart-library migration. |
| React Flow | Version range `^12.0.0` | Pin latest compatible v12 patch `12.12.1`; defer v13 major migration. |
| React Router DOM | Version range `^7.0.0` | Pin current v7 patch `7.18.5`; defer v8 major migration. |
| Lucide React | Version range `^0.468.0` | Pin compatible project API to `0.468.0`; defer v1 major API migration. |
| Tailwind | `^4.0.0` ranges | Pin framework and Vite integration to `4.3.5`. |
| React | `^19.0.0` | Pin React and React DOM to `19.3.1`. |
| React plugin | `^5.0.0` | Pin compatible Vite 7 plugin line to `5.1.4`. |

## Audit status

No `package-lock.json` was present in the incoming Phase 6 archive. The container's npm registry request timed out, so a complete dependency tree and `npm audit` report could not be generated. Earlier local terminal output reported four high-severity vulnerabilities, but without advisory names or affected package paths it is not possible to claim all of them are resolved by these direct-dependency changes.

After the next local install, run:

```powershell
npm install
npm audit --audit-level=high
npm audit --json > npm-audit-report.json
```

Keep `package-lock.json` in the repository. If high or critical findings remain, review the exact dependency path and fixed version before applying `npm audit fix`; avoid `npm audit fix --force` unless breaking changes have been evaluated and tested.

## Vite advisory reference

- Official advisory: https://github.com/vitejs/vite/security/advisories/GHSA-p4f5-76q4-ffq7
- The advisory identifies versions `>=7.0.0 <=7.3.7` as affected and `7.3.8` as patched. The reported exploit requires the dev server to be exposed to the network.
