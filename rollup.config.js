import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";

export default defineConfig({
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.cjs",
      format: "cjs",
      sourcemap: false,
      exports: "auto",
    },
    {
      file: "dist/index.mjs",
      format: "es",
      sourcemap: false,
    },
  ],
  plugins: [
    nodeResolve({
      preferBuiltins: true,
    }),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: true,
      declarationDir: "./dist",
      rootDir: "./src",
      exclude: ["node_modules", "dist"],
    }),
    // Minify
    terser({
      format: {
        comments: false, // Remove all comments
      },
      compress: {
        drop_console: false, // Keep console logs
        pure_funcs: [], // Don't remove any functions
      },
      mangle: {
        reserved: ["postcssPlugin"], // Preserve PostCSS plugin name
      },
    }),
  ],
  external: ["postcss", "fs", "path", "crypto", "fast-glob"],
});
