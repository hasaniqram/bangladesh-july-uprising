# Bangladesh July Uprising — Memorial Map

An interactive React-based memorial and historical exploration interface for the July–August 2024 uprising in Bangladesh.

## Current features

- Interactive geographic map with division-level summaries
- Search, division selection, comparison, and statistics views
- Historical event timeline and context panels
- English/Bangla toggle (translation coverage is still incomplete)
- CSV export and native sharing where supported
- Memorial and gallery interfaces (some sections currently use placeholders)

## Local development

**Requirements:** Node.js and npm.

```bash
npm ci
npm start
```

Open http://localhost:3000.

## Quality checks

```bash
CI=true npm test -- --watch=false
npm run build
```

Phase 1.3 replaces the deprecated Create React App toolchain with **Vite 7**, upgrades React Simple Maps to **v5**, and uses **Vitest 4** for unit testing. The package lock was regenerated and verified with a clean `npm ci` install without `legacy-peer-deps`. The Vercel preview build completed successfully with **310 installed packages and zero npm audit vulnerabilities** at the time of verification. The frontend remains a static React application with no new paid infrastructure.

## Data and editorial caution

Division-level figures and timeline descriptions are currently maintained in `src/data/uprising-data.json`. **These values are not independently verified by this repository.** They should not be treated as an authoritative casualty count, incident chronology, or a substitute for primary-source evidence.

Before publishing figures as verified historical findings:

1. Cite a traceable source for each statistic and event.
2. Record publication date, access date, scope, methodology, and whether a value is estimated or confirmed.
3. Distinguish regional aggregates from nationally reported totals and document possible overlap.
4. Review allegations and disputed claims using appropriately attributed, neutral wording.
5. Avoid publishing identifiable victim profiles or graphic images without appropriate consent and rights review.

The original map geography is preserved as `src/data/bangladesh-divisions.json` (32,114,357 bytes). **Phase 1.2** generates `public/data/bangladesh-divisions.simplified.json` automatically using `node scripts/prepare-geography.cjs` during `npm start` or `npm run build`. The browser fetches this derived file only when map view is requested. In the verified CI run it shrank to **464,412 bytes (98.55% smaller)**, using 23,367 vertices instead of 312,902. The initial compiled JavaScript was **111.28 KB gzip**. Source polygons, division labels, ring winding and significant island shapes are checked during generation. Some boundaries may differ visually at zoom; compare the generated map with the source before claiming cartographic accuracy. Never hand-edit the generated file or use it as the archival source. No backend, database, or paid infrastructure is required.

## Project structure

- `src/components/BangladeshMap.js` — main interactive map interface
- `src/components/BangladeshUprisingMap.css` — component styling
- `src/data/uprising-data.json` — timeline, statistics, and division data
- `src/data/bangladesh-divisions.json` — geographic shapes
- `public/` — page metadata and static assets

## Dependency modernization and security

Phase 1.3 removes `react-scripts` and the peer-compatibility bypass, upgrades React Simple Maps to React-19-compatible v5, and switches to Vite/Vitest. Run `npm audit` on the current lockfile regularly; an earlier audit of the CRA tree reported 69 advisories (4 critical), while the first refreshed Vite preview install reported **0 vulnerabilities**. Future audits can change as upstream advisories are disclosed. Follow the GitHub Actions browser smoke test before production deployment.

## Next development priorities

1. Replace the outdated or unverified historical claims with source-backed entries.
2. Audit and simplify geographic geometry without losing division boundaries.
3. Improve keyboard accessibility, mobile usability, and interactive-state handling.
4. Complete localization and replace placeholder sections with documented content.
5. Add data integrity checks and browser tests before production release.

Contributions should preserve memorial dignity, historical accuracy, and source transparency.
