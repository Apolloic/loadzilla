import { defineConfig } from 'tsup';

export default defineConfig({
  entryPoints: ['core.tsx'],
  format: ['cjs', 'esm'],
  dts: true,
  outDir: 'dist',
  clean: true,
});
