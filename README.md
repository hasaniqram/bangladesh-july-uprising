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

The application currently uses Create React App (`react-scripts` 5). Migration to a maintained build tool should be evaluated separately with build and browser regression testing.

## Data and editorial caution

Division-level figures and timeline descriptions are currently maintained in `src/data/uprising-data.json`. **These values are not independently verified by this repository.** They should not be treated as an authoritative casualty count, incident chronology, or a substitute for primary-source evidence.

Before publishing figures as verified historical findings:

1. Cite a traceable source for each statistic and event.
2. Record publication date, access date, scope, methodology, and whether a value is estimated or confirmed.
3. Distinguish regional aggregates from nationally reported totals and document possible overlap.
4. Review allegations and disputed claims using appropriately attributed, neutral wording.
5. Avoid publishing identifiable victim profiles or graphic images without appropriate consent and rights review.

The map uses a large geographic JSON dataset from `src/data/bangladesh-divisions.json` (approximately 32 MB in the repository). As of Phase 1.1, the geography is dynamically imported when the map view is requested, keeping it out of the initial JavaScript bundle. The first verified Vercel preview compiled the initial JS to 112.07 KB gzip and the separate geography chunk to 4.68 MB gzip. **The original geometry is not yet simplified**, so map loading still requires substantial download and processing. Preserve source boundaries and test rendering before replacing the geography.

## Project structure

- `src/components/BangladeshMap.js` — main interactive map interface
- `src/components/BangladeshUprisingMap.css` — component styling
- `src/data/uprising-data.json` — timeline, statistics, and division data
- `src/data/bangladesh-divisions.json` — geographic shapes
- `public/` — page metadata and static assets

## Next development priorities

1. Replace the outdated or unverified historical claims with source-backed entries.
2. Audit and simplify geographic geometry without losing division boundaries.
3. Improve keyboard accessibility, mobile usability, and interactive-state handling.
4. Complete localization and replace placeholder sections with documented content.
5. Add data integrity checks and browser tests before production release.

Contributions should preserve memorial dignity, historical accuracy, and source transparency.
