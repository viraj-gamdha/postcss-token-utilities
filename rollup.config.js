import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default defineConfig({
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: false,
      exports: 'auto',
    },
    {
      file: 'dist/index.mjs',
      format: 'es',
      sourcemap: false,
    },
  ],
  plugins: [
    nodeResolve({
      preferBuiltins: true,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist',
      rootDir: './src',
      exclude: ['node_modules', 'dist'],
    }),
  ],
  external: [
    'postcss',
    'fs',
    'path',
    'crypto',
    'fast-glob',
    'cssnano',
  ],
});