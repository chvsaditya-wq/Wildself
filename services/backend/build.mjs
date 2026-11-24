// Production build: one JavaScript file for both roles (dist/main.js).
// Our own workspace packages (@wildself/*) are bundled in; third-party packages stay
// external and are installed normally, so their licences and updates stay visible.
import { build } from 'esbuild';

await build({
  entryPoints: ['src/main.ts'],
  outfile: 'dist/main.js',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  sourcemap: true,
  legalComments: 'none',
  logLevel: 'info',
  plugins: [
    {
      name: 'externalise-third-party',
      setup(b) {
        b.onResolve({ filter: /^[^./]/ }, (args) => {
          if (args.path.startsWith('@wildself/')) return undefined;
          return { path: args.path, external: true };
        });
      },
    },
  ],
});
