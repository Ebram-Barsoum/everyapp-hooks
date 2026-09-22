import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,          // generates .d.ts files
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react'],
  banner: { js: '"use client";' },
});