# Kakamit

Privacy-first PWA for tracking gut health locally on the user's device.

Kakamit is a minimal, offline-capable Progressive Web App for tracking two
signals: the **DGBS (Daily Gas Burden Scale)** — an experimental 1–5
self-assessment of how much gas symptoms interfered over the last 24h — and the
**Bristol Stool Scale** (types 1–7). All user data stays on the device.

## Privacy Model

- No accounts
- No backend API for user data
- No analytics
- No telemetry
- No crash reporting
- No ad networks
- No cloud sync
- Entry data is stored locally in IndexedDB (`kakamit-db`, store `entries`)
- Theme and language preferences are stored in localStorage
- Export/import happens locally in the browser (JSON and CSV)

## Security / Privacy Audit

Recommended audit entry points:

- `src/lib/db.ts` — IndexedDB data layer
- `src/lib/entries.tsx` — global entries state
- `src/lib/import.ts` — import handling
- `src/lib/csv.ts` — CSV export/import
- `src/lib/report.ts` — report generation
- `src/lib/i18n.tsx` — translations
- `src/workers/insights-worker.ts` — insights computation (web worker)
- `vite.config.ts` — build and PWA configuration
- `package.json` — dependencies

See [`PRIVACY_AUDIT.md`](./PRIVACY_AUDIT.md) for the full privacy data-flow
notes and [`SECURITY.md`](./SECURITY.md) for reporting vulnerabilities.

## Stack

Preact + Vite + TypeScript + Tailwind + `vite-plugin-pwa`. The only runtime
dependency is `preact`.

## Build

```bash
npm ci
npm audit
npm run build
```

`npm run build` runs `tsc --noEmit`, `vite build`, and the static page
generators (`fodmap/generate.js`, `faq/generate.js`), producing `dist/`.

## License

MIT — see [`LICENSE`](./LICENSE).

The MIT License covers the source code only. The DGBS / Daily Gas Burden Scale
concept, names, methodology, and the Kakamit brand assets are reserved — see
[`NOTICE`](./NOTICE).
