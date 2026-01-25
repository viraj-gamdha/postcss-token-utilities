import { type PluginCreator, parse } from "postcss";
import fs from "fs";
import { resolve } from "path";
import { createHash } from "crypto";
import cssnano from "cssnano";
import glob from "fast-glob";
import {
  DEFAULT_EXTRACTION_CONFIG,
  DEFAULT_STATIC_RULES,
  DEFAULT_TOKEN_RULES,
  DEFAULT_VARIANT_RULES,
} from "./default-config";

const PLUGIN_NAME = "postcss-token-utilities";

// Types
export type DesignTokens = Record<string, Record<string, string>>;
export interface StaticRule {
  class: string;
  css: string;
}
export interface TokenRule {
  token: string;
  prefix: string;
  css: (key: string, value: string) => string;
}
export interface VariantRule {
  name: string;
  type: "pseudo" | "media";
  condition?: string;
}
export interface PluginOptions {
  designTokenSource: string;
  customMediaSource?: string;
  content: string[];
  extraction?: { attributes?: string[]; functions?: string[] };
  generated?:
    | {
        path: string;
      }
    | false;
  extend?: {
    staticRules?: StaticRule[];
    tokenRules?: TokenRule[];
    variantRules?: VariantRule[];
  };
  defaultRules?: {
    staticRules?: boolean;
    tokenRules?: boolean;
    variantRules?: boolean;
  };
  logs?: boolean;
}

// Global Process Caches (Persist across hot-reloads)
// 1. The "Universe" Cache: The read-only database of all possible classes
let universeCache: {
  configHash: string;
  cssMap: Map<string, string>;
  rawCss: string;
} | null = null;
// 2. The File Scan Cache: Stores mtime and classes per file
const fileScanCache = new Map<
  string,
  { mtime: number; classes: Set<string> }
>();

// Logic: Class Extractor
class ClassExtractor {
  private attrRegex: RegExp;
  private funcRegex: RegExp;

  constructor(config: { attributes?: string[]; functions?: string[] } = {}) {
    const opts = { ...DEFAULT_EXTRACTION_CONFIG, ...config };

    const attrPattern = opts.attributes.join("|");
    this.attrRegex = new RegExp(
      `(?:${attrPattern})\\s*=\\s*["'\`{]([^"'\`}]+)["'\`}]`,
      "g",
    );

    const funcPattern = opts.functions.join("|");
    this.funcRegex = new RegExp(`(?:${funcPattern})\\s*\\(([^)]+)\\)`, "g");
  }

  extract(content: string): Set<string> {
    const classes = new Set<string>();
    let match: RegExpExecArray | null;

    this.attrRegex.lastIndex = 0;
    while ((match = this.attrRegex.exec(content)) !== null) {
      match[1].split(/\s+/).forEach((c) => c && classes.add(c));
    }

    this.funcRegex.lastIndex = 0;
    while ((match = this.funcRegex.exec(content)) !== null) {
      const stringMatches = match[1].matchAll(/["'`]([^"'`]+)["'`]/g);
      for (const strMatch of stringMatches) {
        strMatch[1].split(/\s+/).forEach((c) => c && classes.add(c));
      }
    }

    return classes;
  }
}

// Logic: Universe Utility Generator
class UtilityGenerator {
  private tokens: DesignTokens = {};
  private rules: {
    static: StaticRule[];
    token: TokenRule[];
    variant: VariantRule[];
  };

  constructor(opts: PluginOptions, css: { tokens: string; media: string }) {
    // 1. Setup Rules
    const useDef = {
      static: opts.defaultRules?.staticRules !== false,
      token: opts.defaultRules?.tokenRules !== false,
      variant: opts.defaultRules?.variantRules !== false,
    };

    this.rules = {
      static: [
        ...(useDef.static ? DEFAULT_STATIC_RULES : []),
        ...(opts.extend?.staticRules || []),
      ],
      token: [
        ...(useDef.token ? DEFAULT_TOKEN_RULES : []),
        ...(opts.extend?.tokenRules || []),
      ],
      variant: [
        ...(useDef.variant ? DEFAULT_VARIANT_RULES : []),
        ...(opts.extend?.variantRules || []),
      ],
    };

    // 2. Parse Inputs
    this.parseTokens(css.tokens);
    this.parseMedia(css.media);
  }

  private parseTokens(css: string) {
    const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}/);
    if (!rootMatch) return;

    const categories = [...new Set(this.rules.token.map((r) => r.token))];
    const varRegex = /--([\w-]+)\s*:\s*([^;]+)/g;
    let match: RegExpExecArray | null;

    while ((match = varRegex.exec(rootMatch[1])) !== null) {
      const varName = match[1];
      for (const cat of categories) {
        if (varName.startsWith(`${cat}-`)) {
          const key = varName.substring(cat.length + 1);
          if (!this.tokens[cat]) this.tokens[cat] = {};
          this.tokens[cat][key] = `var(--${varName})`;
          break;
        }
      }
    }
  }

  private parseMedia(css: string) {
    const mediaRegex = /@custom-media\s+--([a-z0-9-]+)\s+\(([^)]+)\)/g;
    let match: RegExpExecArray | null;
    const existing = new Set(this.rules.variant.map((v) => v.name));

    while ((match = mediaRegex.exec(css)) !== null) {
      if (!existing.has(match[1])) {
        this.rules.variant.push({
          name: match[1],
          type: "media",
          condition: match[2],
        });
      }
    }
  }

  build() {
    const map = new Map<string, string>();
    const raw: string[] = [];

    const add = (cls: string, css: string) => {
      // Base
      const base = `.${cls} { ${css} }`;
      map.set(cls, base);
      raw.push(base);

      // Variants
      for (const v of this.rules.variant) {
        const escaped = `${v.name}\\:${cls}`;
        const lookup = `${v.name}:${cls}`;
        let vCss = "";

        if (v.type === "pseudo") {
          vCss = `.${escaped}:${v.name} { ${css} }`;
        } else if (v.type === "media" && v.condition) {
          vCss = `@media (${v.condition}) { .${escaped} { ${css} } }`;
        }

        if (vCss) {
          map.set(lookup, vCss);
          raw.push(vCss);
        }
      }
    };

    // Static
    this.rules.static.forEach((r) => add(r.class, r.css));

    // Tokens
    this.rules.token.forEach((r) => {
      const cat = this.tokens[r.token];
      if (cat)
        Object.entries(cat).forEach(([k, v]) =>
          add(`${r.prefix}${k}`, r.css(k, v)),
        );
    });

    return { map, raw };
  }
}

// Plugin Definition
const postcssTokenUtilities: PluginCreator<PluginOptions> = (
  opts = { designTokenSource: "", content: [] },
) => {
  const enableLogs = opts?.logs ?? false;

  return {
    postcssPlugin: PLUGIN_NAME,

    async Once(root, { result }) {
      // Validation
      if (!opts.designTokenSource || !opts.content.length) return;

      const cwd = process.cwd();
      const tokenPath = resolve(cwd, opts.designTokenSource);
      const mediaPath = opts.customMediaSource
        ? resolve(cwd, opts.customMediaSource)
        : null;

      // 1. Read Config Sources
      let tokenCss = "",
        mediaCss = "";

      try {
        tokenCss = fs.readFileSync(tokenPath, "utf-8");
        result.messages.push({
          type: "dependency",
          plugin: PLUGIN_NAME,
          file: tokenPath,
          parent: result.opts.from,
        });

        if (mediaPath && fs.existsSync(mediaPath)) {
          mediaCss = fs.readFileSync(mediaPath, "utf-8");
          result.messages.push({
            type: "dependency",
            plugin: PLUGIN_NAME,
            file: mediaPath,
            parent: result.opts.from,
          });
        }
      } catch (e) {
        if (enableLogs) {
          console.warn(`[${PLUGIN_NAME}] Warning: Sources not found.`);
        }
      }

      const configHash = createHash("md5")
        .update(
          tokenCss +
            mediaCss +
            JSON.stringify(opts.extend || {}) +
            JSON.stringify(opts.defaultRules || {}),
        )
        .digest("hex");

      // outPath is optional
      const defaultOutPath = "src/styles/utilities.gen.css";

      const rawOutPath =
        opts.generated !== false
          ? opts.generated?.path || defaultOutPath
          : null;

      const normalizedOutPath =
        rawOutPath && rawOutPath.endsWith(".gen.css")
          ? rawOutPath
          : rawOutPath
            ? rawOutPath.replace(/\.css$/, "") + ".gen.css"
            : null;

      const outPath: string | null = normalizedOutPath
        ? resolve(cwd, normalizedOutPath)
        : null;
      //

      const GEN_CSS_PATTERN = "**/*.gen.css";

      if (universeCache?.configHash !== configHash) {
        const gen = new UtilityGenerator(opts, {
          tokens: tokenCss,
          media: mediaCss,
        });
        const { map, raw } = gen.build();
        const rawCss = raw.join("\n");
        universeCache = { configHash, cssMap: map, rawCss };

        // Write to disk (Only on Universe change & if option is there)
        if (outPath) {
          const optimized = await cssnano({
            preset: [
              "default",
              {
                normalizeWhitespace: false,
              },
            ],
          }).process(rawCss, { from: undefined });

          const header = [
            "/* ========================================= */",
            "/* AUTO-GENERATED FILE                       */",
            "/*    - DO NOT EDIT MANUALLY                 */",
            "/* Do not import it directly in app CSS.     */",
            `/* Generated by ${PLUGIN_NAME}               */`,
            "/* Minified with cssnano                     */",
            "/*                                           */",
            "/* Git Ignore Recommendation:                */",
            `/*   ${GEN_CSS_PATTERN}                      */`,
            "/*                                           */",
            "/* VS Code IntelliSense Recommendation:      */",
            "/*   Add glob pattern to extensions like     */",
            "/*   (CSS Navigation) Always Include:        */",
            `/*   ${GEN_CSS_PATTERN}                      */`,
            "/*                                           */",
            "/* Purpose:                                  */",
            "/* - Provides IntelliSense for utility CSS   */",
            "/* - Improves PostCSS performance by caching */",
            "/*   generated utility rules                 */",
            "/*                                           */",
            "/* To disable:                               */",
            "/* - Set { generated: false } in plugin opts */",
            "/* ========================================= */",
            "",
          ].join("\n");

          const contentToWrite = header + optimized.css;

          const existing = fs.existsSync(outPath)
            ? fs.readFileSync(outPath, "utf-8")
            : "";

          if (existing !== contentToWrite) {
            fs.writeFileSync(outPath, contentToWrite);
            if (enableLogs) {
              console.log(`[${PLUGIN_NAME}] Updated reference: ${outPath}`);
            }
          }
        }
      }

      const extractor = new ClassExtractor(opts.extraction);
      const usedClasses = new Set<string>();

      const files = await glob(opts.content, {
        cwd,
        absolute: true,
        ignore: ["**/node_modules/**", "**/.next/**", GEN_CSS_PATTERN],
        onlyFiles: true,
      });

      let filesRead = 0;
      for (const file of files) {
        result.messages.push({
          type: "dependency",
          plugin: PLUGIN_NAME,
          file,
          parent: result.opts.from,
        });

        const stats = fs.statSync(file);
        const cached = fileScanCache.get(file);

        if (cached && cached.mtime === stats.mtimeMs) {
          cached.classes.forEach((c) => usedClasses.add(c));
        } else {
          const classes = extractor.extract(fs.readFileSync(file, "utf-8"));
          fileScanCache.set(file, { mtime: stats.mtimeMs, classes });
          classes.forEach((c) => usedClasses.add(c));
          filesRead++;
        }
      }

      const injectLines: string[] = [];
      usedClasses.forEach((c) => {
        const css = universeCache?.cssMap.get(c);
        if (css) injectLines.push(css);
      });

      if (filesRead > 0 && enableLogs)
        console.log(
          `[${PLUGIN_NAME}]: ${injectLines.length} utilities injected.`,
        );

      root.walkAtRules("layer", (atRule) => {
        if (atRule.params === "utilities-gen") {
          atRule.nodes = [];
          if (injectLines.length > 0) {
            atRule.append(
              parse(injectLines.join("\n"), {
                from: outPath || resolve(cwd, defaultOutPath),
              }),
            );
          }
        }
      });
    },
  };
};

postcssTokenUtilities.postcss = true;
export default postcssTokenUtilities;
