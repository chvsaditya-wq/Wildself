// Layer-boundary rules (ARCHITECTURE.md §2, §6.4; POA.md principle 9).
// Run: npm run lint:layers (also part of npm run lint and CI). A violation fails the build.
//
// Layers: 1 app (apps/mobile) · 2 engines (engines/*) · 3 API (services/backend, packages/internal-api)
//         · 4 data (packages/data). packages/contracts is shared types only.

/** Paths of the workspace packages, as resolved by dependency-cruiser (real paths, not symlinks). */
const DATA = '^packages/data/';
const INTERNAL_API = '^packages/internal-api/';
const CONTRACTS = '^packages/contracts/';
const ENGINES = '^engines/';
const BACKEND = '^services/';
const MOBILE = '^apps/mobile/';
const DB_DRIVERS = '(^|/)node_modules/(postgres|pg|pg-[^/]+|node-pg-migrate)/';

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular imports make layers impossible to reason about.',
      from: { pathNot: '(^|/)node_modules/' },
      to: { circular: true },
    },
    {
      name: 'data-layer-is-the-bottom',
      severity: 'error',
      comment: 'The data layer only stores and counts. It never calls engines, the API or the app.',
      from: { path: DATA },
      to: { path: [INTERNAL_API, ENGINES, BACKEND, MOBILE] },
    },
    {
      name: 'only-the-data-layer-talks-to-postgres',
      severity: 'error',
      comment: 'Database drivers may be used only in packages/data (and migration tooling in db/).',
      from: { pathNot: [DATA, '^db/', '(^|/)node_modules/'] },
      to: { path: DB_DRIVERS },
    },
    {
      name: 'engines-never-touch-the-database',
      severity: 'error',
      comment: 'Engines only calculate; all reads and writes go through the internal API.',
      from: { path: ENGINES },
      to: { path: [DATA, BACKEND, MOBILE] },
    },
    {
      name: 'api-and-worker-reach-data-only-through-the-internal-api',
      severity: 'error',
      comment:
        'Routes and the worker call @wildself/internal-api. Only main.ts (the composition root) creates the database pool.',
      from: { path: '^services/backend/src/', pathNot: '^services/backend/src/main\\.ts$' },
      to: { path: DATA },
    },
    {
      name: 'internal-api-does-not-depend-on-its-callers',
      severity: 'error',
      from: { path: INTERNAL_API },
      to: { path: [ENGINES, BACKEND, MOBILE] },
    },
    {
      name: 'contracts-are-shared-types-only',
      severity: 'error',
      comment: 'Contracts are imported by both the app and the server, so they import nothing of ours.',
      from: { path: CONTRACTS },
      to: { path: [DATA, INTERNAL_API, ENGINES, BACKEND, MOBILE] },
    },
    {
      name: 'the-app-only-talks-to-the-public-api',
      severity: 'error',
      comment: 'The phone reaches the server over HTTPS only; it may share contracts, nothing else.',
      from: { path: MOBILE },
      to: { path: [DATA, INTERNAL_API, ENGINES, BACKEND] },
    },
  ],
  options: {
    exclude: {
      // node_modules is not excluded (only not followed), so imports of database drivers are seen.
      path: '(^|/)(dist|coverage|\\.expo|ios|android|\\.git)(/|$)',
    },
    doNotFollow: { path: '(^|/)node_modules/' },
    includeOnly: '^(apps|packages|services|engines|db)/|(^|/)node_modules/',
    tsPreCompilationDeps: true,
    // Resolves the app's "@/..." imports; other packages have no path aliases.
    tsConfig: { fileName: 'apps/mobile/tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types', 'react-native'],
      extensions: ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json'],
    },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
