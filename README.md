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

## Phase 1.4: editorial provenance

The frontend shows a **selected, source-linked historical chronology** from `src/data/historical-evidence.json`, not the older unsourced daily chronology. Each published timeline event has an event date, concise attributed description, and direct links to the supporting publisher. The source register includes publication date, scope, methodology, and a review date.

The UN Human Rights Office's February 2025 fact-finding report estimated that **as many as 1,400 people may have been killed** during the 15 July–5 August 2024 crackdown. This is an **approximate national estimate, not a confirmed named death list**. The 2024 division figures and age/eye injury counts in `src/data/uprising-data.json` are **legacy unsourced material** and remain displayed only with explicit warnings. They are not independently verified, must not be cited as authoritative, and **must never be added to the OHCHR estimate**.

The older `uprising-data.json` timeline is retained for auditability and source reconstruction but is **not used by the visible timeline or date slider**. Prior unsupported per-day casualty and arrest figures are not shown in the new chronology. The prominent source notice identifies what is known versus provisional, and exported CSV filenames/headers explicitly identify unverified data.

Reviewed sources:
- OHCHR, independent fact-finding report, 12 February 2025: https://www.ohchr.org/sites/default/files/documents/countries/bangladesh/ohchr-fftb-hr-violations-bd.pdf
- European Union Agency for Asylum, 2025 country timeline: https://www.euaa.europa.eu/coi/bangladesh/2025/country-focus/coi-report-bangladesh-country-focus/annex-1-timeline-protests-july-august-2024
- Amnesty International, 29 July 2024 chronology: https://www.amnesty.org/en/latest/news/2024/07/what-is-happening-at-the-quota-reform-protests-in-bangladesh/
- Reuters, 8 August 2024 account of Muhammad Yunus's swearing-in: https://www.reuters.com/world/asia-pacific/bangladesh-nobel-laureate-muhammad-yunus-takes-charge-caretaker-government-2024-08-08/

**Known limitations:** This is a curated set of events, not an exhaustive incident register; some dates reflect when a policy was announced or implemented, not every local occurrence. The source links provide independent reporting but do not validate every surviving description, regional statistic, gallery entry, or chart. Further editorial review is required before making full historical-accuracy claims. Maintain neutral attribution and verify all personally identifying victim information before publication.

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

- `src/components/BangladeshMap.jsx` — main interactive map interface
- `src/components/BangladeshUprisingMap.css` — component styling
- `src/data/uprising-data.json` — unsourced legacy timeline and provisional regional figures (preserved for audit)
- `src/data/historical-evidence.json` — source-backed chronology, national estimate, provenance metadata
- `src/data/bangladesh-divisions.json` — geographic shapes
- `public/` — page metadata and static assets

## Dependency modernization and security

Phase 1.3 removes `react-scripts` and the peer-compatibility bypass, upgrades React Simple Maps to React-19-compatible v5, and switches to Vite/Vitest. Run `npm audit` on the current lockfile regularly; an earlier audit of the CRA tree reported 69 advisories (4 critical), while the first refreshed Vite preview install reported **0 vulnerabilities**. Future audits can change as upstream advisories are disclosed. Follow the GitHub Actions browser smoke test before production deployment.

## Next development priorities

1. Continue systematic source verification for remaining legacy division counts and incident details.
2. Audit and simplify geographic geometry without losing division boundaries.
3. Improve keyboard accessibility, mobile usability, and interactive-state handling.
4. Complete localization and replace placeholder sections with documented content.
5. Add data integrity checks and browser tests before production release.

Contributions should preserve memorial dignity, historical accuracy, and source transparency.
