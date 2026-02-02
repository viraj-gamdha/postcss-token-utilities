import { type PluginCreator, parse } from "postcss";
import fs from "fs";
import { join, resolve } from "path";
import { createHash } from "crypto";
import glob from "fast-glob";
import {
  DEFAULT_CLASS_MATCHER,
  DEFAULT_STATIC_RULES,
  DEFAULT_TOKEN_RULES,
  DEFAULT_VARIANT_RULES,
} from "./default-config";
import { pathToFileURL } from "url";

const PLUGIN_NAME = "postcss-token-utilities";
const RULES_FILE_NAMES = [
  "token-utilities.rules.ts",
  "token-utilities.rules.js",
  "token-utilities.rules.mjs",
];

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

// Variant rules
export interface BaseVariantRule {
  name: string;
}
export interface PseudoVariantRule extends BaseVariantRule {
  type: "pseudo";
}
export interface MediaVariantRule extends BaseVariantRule {
  type: "media";
  condition: string; // Required for media
}
export interface AncestorVariantRule extends BaseVariantRule {
  type: "ancestor";
  selector: string; // Required for ancestor
}
export type VariantRule =
  | PseudoVariantRule
  | MediaVariantRule
  | AncestorVariantRule;

// combined interface for all rules
export interface Rules {
  staticRules?: StaticRule[];
  tokenRules?: TokenRule[];
  variantRules?: VariantRule[];
}

export interface PluginOptions {
  designTokenSource: string;
  customMediaSource?: string;
  content: string[];
  classMatcher?: string[];
  generated?:
    | {
        path: string;
      }
    | false;
  extend?: Rules;
  defaultRules?: {
    staticRules?: boolean;
    tokenRules?: boolean;
    variantRules?: boolean;
  };
  logs?: boolean;
}

// Global Process Caches (Persist across hot-reloads)
let universeCache: {
  configHash: string;
  cssMap: Map<string, string>;
  rawCss: string;
} | null = null;

// The File Scan Cache: Stores mtime and classes per file
const fileScanCache = new Map<
  string,
  { mtime: number; classes: Set<string> }
>();

class ClassExtractor {
  private matchers: string[];

  constructor(matchers: string[] = []) {
    this.matchers = [...DEFAULT_CLASS_MATCHER, ...(matchers || [])];
  }

  extract(content: string): Set<string> {
    const classes = new Set<string>();

    for (const matcher of this.matchers) {
      // Find all positions where matcher appears
      let index = 0;
      while ((index = content.indexOf(matcher, index)) !== -1) {
        // Get the next 500 characters after the matcher (covers most use cases)
        const chunk = content.substring(index, index + 500);

        // Extract all quoted strings from this chunk
        this.extractQuotedStrings(chunk, classes);

        index += matcher.length;
      }
    }

    return classes;
  }

  // Covers "class", 'class', `class`, arrays, objects, etc.
  private extractQuotedStrings(text: string, classes: Set<string>): void {
    // Match all quoted strings: "...", '...', `...`
    const quotedStrings = text.matchAll(/["'`]([^"'`]+)["'`]/g);

    for (const match of quotedStrings) {
      const content = match[1];

      // Split by whitespace to get individual classes
      content.split(/\s+/).forEach((className) => {
        className = className.trim();

        // Validate: must look like a valid utility class
        if (this.isValidClassName(className)) {
          classes.add(className);
        }
      });
    }
  }

  // Filter out obvious non-classes (URLs, paths, long strings)
  private isValidClassName(str: string): boolean {
    if (!str || str.length === 0 || str.length > 100) return false;

    // Skip obvious non-classes
    if (
      str.includes("://") || // URLs
      str.includes("\\") || // Paths
      str.startsWith("/") || // Paths
      str.includes("(") || // Functions
      str.includes("{") || // Objects
      str.includes("[") // Arrays
    ) {
      return false;
    }

    // Valid class: letters, numbers, hyphens, colons, underscores, dots
    return /^[a-zA-Z0-9_:.-]+$/.test(str);
  }
}

// Universe Utility Generator
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
        } else if (v.type === "ancestor" && v.selector) {
          vCss = `${v.selector} .${escaped} { ${css} }`;
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

// Helper for loading rules from file
async function loadRulesFile(cwd: string): Promise<Rules | null> {
  for (const fileName of RULES_FILE_NAMES) {
    const rulesPath = join(cwd, fileName);

    if (fs.existsSync(rulesPath)) {
      try {
        const fileUrl = pathToFileURL(rulesPath).href;
        const cacheBustedUrl = `${fileUrl}?t=${Date.now()}`;
        const rulesModule = await import(cacheBustedUrl);

        const rules = rulesModule.default || rulesModule;

        return rules;
      } catch (error) {
        console.warn(`[${PLUGIN_NAME}] Failed to load ${fileName}:`, error);
      }
    }
  }

  return null;
}

// Plugin Definition
const postcssTokenUtilities: PluginCreator<PluginOptions> = (
  opts = { designTokenSource: "", content: [] },
) => {
  return {
    postcssPlugin: PLUGIN_NAME,

    async Once(root, { result }) {
      const cwd = process.cwd();
      const rulesFile = await loadRulesFile(cwd);

      const finalOpts: PluginOptions = {
        ...opts,
        extend: {
          staticRules: [
            ...(rulesFile?.staticRules || []),
            ...(opts.extend?.staticRules || []),
          ],
          tokenRules: [
            ...(rulesFile?.tokenRules || []),
            ...(opts.extend?.tokenRules || []),
          ],
          variantRules: [
            ...(rulesFile?.variantRules || []),
            ...(opts.extend?.variantRules || []),
          ],
        },
      };

      const rulesFileName = RULES_FILE_NAMES.find((name) =>
        fs.existsSync(join(cwd, name)),
      );

      if (rulesFileName) {
        const rulesFilePath = join(cwd, rulesFileName);
        result.messages.push({
          type: "dependency",
          plugin: PLUGIN_NAME,
          file: rulesFilePath,
          parent: result.opts.from,
        });
      }

      const enableLogs = finalOpts?.logs ?? false;

      // Validation
      if (!finalOpts.designTokenSource || !finalOpts.content.length) {
        if (enableLogs) {
          console.warn(
            `[${PLUGIN_NAME}] Missing required config: designTokenSource and content are required in postcss.config.`,
          );
        }
        return;
      }

      const tokenPath = resolve(cwd, finalOpts.designTokenSource);
      const mediaPath = finalOpts.customMediaSource
        ? resolve(cwd, finalOpts.customMediaSource)
        : null;

      // Read Config Sources
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
            JSON.stringify(finalOpts.extend || {}) +
            JSON.stringify(finalOpts.defaultRules || {}),
        )
        .digest("hex");

      const defaultOutPath = "src/styles/utilities.gen.css";

      const rawOutPath =
        finalOpts.generated !== false
          ? finalOpts.generated?.path || defaultOutPath
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

      const GEN_CSS_PATTERN = "**/*.gen.css";

      if (universeCache?.configHash !== configHash) {
        const gen = new UtilityGenerator(finalOpts, {
          tokens: tokenCss,
          media: mediaCss,
        });
        const { map, raw } = gen.build();
        const rawCss = raw.join("\n");
        universeCache = { configHash, cssMap: map, rawCss };

        // Write to disk (Only on Universe change & if option is there)
        if (finalOpts.generated && outPath) {
          const header = [
            "/* ========================================= */",
            "/* AUTO-GENERATED FILE                       */",
            "/*    - DO NOT EDIT MANUALLY                 */",
            "/* Do not import it directly in app CSS.     */",
            `/* Generated by ${PLUGIN_NAME}               */`,
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
            "/* To refresh IntelliSense after changes:    */",
            "/* - CMD/CTRL + Shift + P                    */",
            "/* - Type: Reload Window                     */",
            "/* - Or restart VS Code                      */",
            "/*                                           */",
            "/* To disable:                               */",
            "/* - Set { generated: false } in plugin opts */",
            "/* ========================================= */",
            "",
          ].join("\n");

          const contentToWrite = header + rawCss;

          const existing = fs.existsSync(outPath)
            ? fs.readFileSync(outPath, "utf-8")
            : "";

          if (existing !== contentToWrite) {
            fs.writeFileSync(outPath, contentToWrite);
            if (enableLogs) {
              console.log(`[${PLUGIN_NAME}] Updated reference: ${outPath}`);
              console.log(
                `[${PLUGIN_NAME}] 💡 Reload VS Code window (Cmd/Ctrl+Shift+P → "Reload Window") to refresh IntelliSense`,
              );
            }
          }
        }
      }

      const extractor = new ClassExtractor(finalOpts?.classMatcher);
      const usedClasses = new Set<string>();

      const files = await glob(finalOpts.content, {
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