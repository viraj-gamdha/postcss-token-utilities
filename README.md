# Introduction

A compact, token-driven utility CSS generator for PostCSS that creates utilities directly from CSS custom properties and injects only what you actually use.

It is **not a Tailwind CSS replacement**, but a lightweight alternative for **token-based design systems** that prefer minimal utilities and native CSS. It follows a **modern CSS-first** approach rather than utility-first, where design tokens and real CSS stay at the core and utilities act as a small supporting layer.

## Why postcss-token-utilities?

- Your design tokens define the system, not a framework

- Utilities are generated directly from your tokens

- Only used utilities are injected (JIT-style)

- CSS remains the source of truth

- Flexible and extensible - define or extend your own rules easily

- Works naturally with CSS Modules and traditional CSS

- `No arbitrary values` - only meaningful, predictable token-based utilities

- Extremely compact compared to full utility frameworks

- Familiar feel if you’ve used Tailwind CSS, but without heavy overhead

## Get Started

### Installation

```bash
npm i -D postcss-token-utilities
```

### Recommended CSS Structure

```
src/styles/
├── globals.css       # Main entry point – imports everything in correct layer order
├── app.css           # Design tokens (CSS variables) – @layer base
├── components.css    # Component styles – @layer components
├── utilities.css     # Custom/hand-written utilities – @layer utilities-gen - @layer utilities
└── media.css         # Breakpoints / Media variants (@custom-media definitions)

```

### Token Example: How Variables Become Utilities

`--spacing-1: 0.25rem;`

- Full name: `--spacing-1`
- Token: `spacing`
- Key: `1` (suffix after token)
- Value: `0.25rem` (what it resolves to e.g. `var(--spacing-1)`)
- Prefix from rule: `p-`
- Final class: `p-1`
- Generated CSS: `.p-1 { padding: var(--spacing-1); }`

One change to `--spacing-1` updates every `p-1`, `m-1`, `gap-1` instantly - no rebuild needed.

**app.css** - Define your design tokens

Here is example of 10 tokens supported by default

```css
:root {
  /* 1. font-family */
  --font-family-1: "Geist", sans-serif;
  --font-family-2: "Inter", sans-serif;

  /* 2. font-size */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.125rem;

  /* 3. font-weight */
  --font-weight-light: 300;
  --font-weight-medium: 500;
  --font-weight-bold: 700;
  /* add more spacing vars... */

  /* 4. spacing */
  /* Spacing Tokens also applied for height width sizes (w-1, w-container-max, min-2 etc...*/
  --spacing-0: 0;
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-container-max: 500px;
  /* add more spacing vars... */

  /* 5. radius */
  --radius-none: 0;
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-full: 9999px;

  /* 6. border */
  --border-0: 0px;
  --border-1: 1px;
  --border-2: 2px;
  --border-4: 4px;

  /* 7. outline */
  --outline-0: 0px;
  --outline-1: 1px;
  --outline-2: 2px;
  --outline-4: 4px;

  /* 8. transition */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);

  /* 9. color */
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(14% 0.00002 271.152);
  /* add more colors... */

  /* 10. shadow */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg:
    0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

/* Manual dark mode */
[data-theme="dark"] {
  /* ...dark theme overrides */
}

/* System dark mode */
@media (--dark) {
  :root {
    /* ...dark theme overrides  */
  }
}
```

**components.css** - Global component-specific styles

```css
@layer components {
  .card {
    background: var(--color-background);
    border-radius: var(--radius-lg);
    padding: var(--spacing-4);
  }
}
```

**utilities.css**

```css
/* ⚠️ Important */
@layer utilities-gen {
  /* Generated utility classes will auto injected here */
}

@layer utilities {
  /* Add your other complex static utilities here */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
}
```

**media.css** - Breakpoints & Media Variants

```css
/* Responsive Breakpoints */
@custom-media --sm (width <= 550px);
@custom-media --md (width <= 900px);
@custom-media --lg (width <= 1200px);
@custom-media --xl (width <= 1800px);

/* Theme Preferences */
@custom-media --dark (prefers-color-scheme: dark);
@custom-media --light (prefers-color-scheme: light);

/* Motion Preferences */
@custom-media --motion-safe (prefers-reduced-motion: no-preference);
@custom-media --motion-reduce (prefers-reduced-motion: reduce);

/* Contrast Preferences */
@custom-media --contrast-more (prefers-contrast: more);
@custom-media --contrast-less (prefers-contrast: less);

/* Orientation */
@custom-media --portrait (orientation: portrait);
@custom-media --landscape (orientation: landscape);

/* Print Media */
@custom-media --print (print);
```

**globals.css** - Import all

```css
/* Priority / cascade order: low → high */
@layer base, components, utilities-gen, utilities, overrides;

@import "./app.css";
@import "./components.css";
@import "./utilities.css";

/* We will globally import media.css using 'postcss-global-data' */

/* Optional: If you have very specific overrides / resets that should win */
@layer overrides {
}
```

### Plugin Configuration

**Required**

- `designTokenSource: string` - Path to CSS file with design tokens
- `content: string[]` - Glob patterns for files to scan

**Optional**

- `customMediaSource?: string` - Path to @custom-media file
- `extraction?: object` - Class extraction config
  - `attributes: string[]` - Default: `["className", "class", "class:list"]`
  - `functions: string[]` - Default: `["clsx", "cn", "classNames", "classList"]`
- `generated?: object | false` - Dev reference file generation
  - `path: string` - Output path (e.g. ./src/styles/utilities.gen.css)
- `extend?: object` - Extend default rules
  - `staticRules?: StaticRule[]`
  - `tokenRules?: TokenRule[]`
  - `variantRules?: VariantRule[]`
- `defaultRules?: object` - Enable/disable defaults
  - `staticRules?: boolean`
  - `tokenRules?: boolean`
  - `variantRules?: boolean`
- `logs?: boolean` - Enable logs - Default: `false`

## Configuration

**Suggested plugins to install**

```
npm i -D @csstools/postcss-global-data postcss-preset-env cssnano
```

### PostCSS Config (Recommended Example)

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    // global @custom-media / variables support
    "@csstools/postcss-global-data": {
      files: ["./src/styles/media.css"],
    },

    // Modern CSS features + @custom-media polyfill
    "postcss-preset-env": {
      stage: 2,
      features: {
        "nesting-rules": true,
        "custom-media-queries": true,
        "color-mix": true,
      },
    },

    // Actual plugin
    "postcss-token-utilities": {
      designTokenSource: "./src/styles/app.css",
      customMediaSource: "./src/styles/media.css",
      content: ["./src/**/*.{js,jsx,ts,tsx}"],
      // ... more options (generated, extend, etc.) go here, read more for details ...
    },

    // Minify CSS in production
    ...(process.env.NODE_ENV === "production"
      ? {
          cssnano: {
            preset: "default",
          },
        }
      : {}),
  },
};
```

### ESM + Vite + PostCSS (Recommended Example)

```javascript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// postcss plugins
import postcssPresetEnv from "postcss-preset-env";
import tokenUtilities from "postcss-token-utilities";
import cssNano from "cssnano";
import postcssGlobalData from "@csstools/postcss-global-data";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },

  plugins: [react()],

  css: {
    // postcss config
    postcss: {
      plugins: [
        // global @custom-media / variables support
        postcssGlobalData({
          files: ["./src/styles/media.css"],
        }),

        // Modern CSS features + @custom-media polyfill
        postcssPresetEnv({
          stage: 2,
          preserve: true,
          features: {
            "nesting-rules": true,
            "custom-media-queries": true,
            "color-mix": true,
          },
        }),

        // Actual plugin
        tokenUtilities({
          designTokenSource: "./src/styles/app.css",
          customMediaSource: "./src/styles/media.css",
          content: ["./src/**/*.{js,jsx,ts,tsx,astro}"],
          // ... more options (generated, extend, etc.) go here, read more for details ...
        }),

        // Minify CSS only in production
        ...(process.env.NODE_ENV === "production" ? [cssNano()] : []),
      ],
    },
  },
});
```

### Example Usage (React)

```jsx
import { Button } from "./button";

export function Example() {
  return (
    <div className="flex gap-4 mt-4">
      <Button>Primary</Button>
      <Button variant="secondary" className="shadow-md">
        Secondary
      </Button>
      <Button variant="bordered" className="text-primary">
        Bordered
      </Button>
    </div>
  );
}
```

# Rules

The plugin generates utilities from three types of rules:

> View the [source code](https://github.com/viraj-gamdha/postcss-token-utilities/blob/main/src/default-config.ts) for the complete list of default rules.

## 1. Static Rules

Pre-defined utilities that don't depend on CSS variables.

```typescript
interface StaticRule {
  class: string;
  css: string;
}
```

**Default Static Rules (Pre-added)**

```javascript
  // e.g.
  { class: "flex", css: "display: flex" },
  // + all important static rules
  // please refer the source code for more details
```

## 2. Token Rules

Utilities generated from CSS variables in your design tokens.

```typescript
interface TokenRule {
  token: string; // CSS variable prefix (e.g., "spacing")
  prefix: string; // Class prefix (e.g., "p-")
  css: (key: string, value: string) => string;
}
```

**Default Token Rules (Pre-added)**

```javascript
 // e.g. token: spacing
  {
    token: "spacing",
    prefix: "gap-",
    css: (_k, v) => `gap: ${v};`,
    // => spacing-2
    // k -> 2
    // v -> var(--spacing-2)
    // final css => .gap-2 {gap: var(--spacing-2)}
  },
  // + all other token rules
  // please refer the source code for more details
```

## 3. Variant Rules

Variants allow you to apply utilities conditionally based on state, media queries, or ancestor elements. The plugin supports three types: **pseudo**, **media**, and **ancestor**.

```typescript
interface BaseVariantRule {
  name: string;
}
interface PseudoVariantRule extends BaseVariantRule {
  type: "pseudo";
}
interface MediaVariantRule extends BaseVariantRule {
  type: "media";
  condition: string; // Required for media
}
interface AncestorVariantRule extends BaseVariantRule {
  type: "ancestor";
  selector: string; // Required for ancestor
}
type VariantRule = PseudoVariantRule | MediaVariantRule | AncestorVariantRule;
```

### i. Pseudo Variants (Pre-added)

Apply common interactive and structural states using pseudo-classes.

```javascript
// Interactive states
{ name: "hover", type: "pseudo" },
{ name: "focus", type: "pseudo" },
{ name: "active", type: "pseudo" },
{ name: "disabled", type: "pseudo" },
{ name: "checked", type: "pseudo" },

// Structural states
{ name: "first", type: "pseudo" },
{ name: "last", type: "pseudo" },
{ name: "odd", type: "pseudo" },
{ name: "even", type: "pseudo" },
// ... and more (see source for complete list)
```

**Usage examples:**  
`hover:bg-primary`, `focus:ring-2`, `active:scale-95`, `disabled:opacity-50`, `first:mt-0`, `odd:bg-gray-100`

### ii. Media Variants (Pre-added)

Media variants are automatically generated from your `@custom-media` definitions in `media.css`. This approach keeps your breakpoints centralized and reusable in both utility classes and raw CSS.

These are automatically converted to variants like `sm:, md:, dark:, motion-safe:, etc.`

**In your `media.css`:**

```css
/* Responsive Breakpoints */
@custom-media --sm (width <= 550px);
@custom-media --md (width <= 900px);
@custom-media --lg (width <= 1200px);
/* add more as required...  */
/* (take reference from media.css file from above) */
```

These are automatically converted to variants like `sm:`, `md:`, `dark:`, `motion-safe:`, etc.

**Usage in utility classes:**  
`dark:bg-gray-900`, `light:bg-white`, `print:hidden`, `motion-safe:transition-all`, `portrait:flex-col`, `sm:px-4`, `md:flex-row`, `lg:grid-cols-3`

**Usage in raw CSS:**

```css
.my-component {
  padding: 1rem;

  @media (--md) {
    padding: 2rem;
  }

  @media (--dark) {
    background: var(--color-dark);
  }
}
```

### iii. Ancestor Variants (Pre-added)

Apply utilities based on parent or sibling element states. Perfect for hover effects on children or sibling-based interactions.

```javascript
// Group variants (any descendant)
{ name: "group-hover", type: "ancestor", selector: ".group:hover" },
{ name: "group-focus", type: "ancestor", selector: ".group:focus" },
{ name: "group-active", type: "ancestor", selector: ".group:active" },

// Group Direct variants (immediate children only)
{ name: "group-hover-direct", type: "ancestor", selector: ".group:hover >" },
{ name: "group-focus-direct", type: "ancestor", selector: ".group:focus >" },
// ... and more (see source for complete list)
```

**Usage examples:**

```html
<!-- Group: Works on any nested descendant -->
<div class="group">
  <div>
    <button class="group-hover:bg-primary">Hover parent to change me</button>
  </div>
</div>

<!-- Group Direct: Only immediate children -->
<div class="group">
  <button class="group-hover-direct:bg-primary">Works (direct child)</button>
  <div>
    <button class="group-hover-direct:bg-primary">Won't work (nested)</button>
  </div>
</div>
```

# Extending Rules

Extend default rules in two ways:

### Option 1: Inline Extension (Quick)

Add rules directly in `postcss.config.js` or `vite.config.ts`:

```javascript
postcssTokenUtilities({
  ...otherOptions
  extend: {
    staticRules: [
      { class: "aspect-video", css: "aspect-ratio: 16/9" },
    ],

     // First, add token (line-height) vars to your app.css (in root:{...}):
     // --line-height-tight: 1.2;
     // --line-height-loose: 2;
    tokenRules: [
      {
        token: "line-height",
        prefix: "leading-",
        css: (_k, v) => `line-height: ${v};`,
      },
      // Generates: leading-tight, leading-loose automatically
    ],

    variantRules: [
      { name: "visited", type: "pseudo" },
    ],
  },
})
```

### Option 2: Rules File (Recommended)

Create `token-utilities.rules.ts` or `.js / .mjs` in your project root for better organization:

```typescript
import type { Rules } from "postcss-token-utilities";

const rules: Rules = {
  staticRules: [
    { class: "aspect-video", css: "aspect-ratio: 16/9" },
    { class: "aspect-square", css: "aspect-ratio: 1/1" },
  ],

  // First, add token (line-height) vars to your app.css (in root:{...}):
  // --line-height-tight: 1.2;
  // --line-height-loose: 2;
  tokenRules: [
    {
      token: "line-height",
      prefix: "leading-",
      css: (_k, v) => `line-height: ${v};`,
      // Generates: leading-tight, leading-loose automatically
    },
  ],

  variantRules: [
    { name: "peer-checked", type: "ancestor", selector: ".peer:checked ~" },
  ],
};

export default rules;
```

Then use the plugin normally in `postcss.config.js` - rules auto-load:

```javascript
postcssTokenUtilities({
  designTokenSource: "src/styles/app.css",
  ...
  // Rules from token-utilities.rules.ts automatically included!
});
```

**Note:** For media variants, prefer adding to `media.css` with `@custom-media` instead of variant rules.

## Disable Default Rules

```javascript
// postcss.config or vite.config
...
{
  defaultRules: {
    staticRules: false,   // Disable all defaults
    tokenRules: false,
    variantRules: false,
  },
  extend: {
    // Add only your rules here
    // Or in a token-utilities.rules.ts
  }
}
```

# Generated Dev File for IntelliSense

The plugin can generate a reference file for autocomplete Intellisence in your IDE (using extensions like `CSS Navigation`).

**Configuration:**

```javascript
generated: {
  path: "./src/styles/utilities.gen.css", // *.gen.css will be auto added even if you dont add it. It's mandatory
}

  // To disable generation:
  // generated: false,
```

**Output:** `src/styles/utilities.gen.css`

## ⚠️ Important:

- Only the CSS you actually use will be included in your final build (JIT + Auto purging).

This file acts as:

- a compiled utility index
- an IntelliSense source for editors
- a cache to improve PostCSS performance

### Recommended VS Code Extension

The generated file enables extensions like `CSS Navigation - by pucelle` to provide autocomplete for utility classes.

Required Settings (CSS Navigation):

Include glob patterns for generated css file: `**/*.gen.css`

## Best Practices

### Use native utilities.css file for Complex Utilities

```css
/* src/styles/utilities.css */
@layer utilities-gen {
}

/* app level static utilities */
@layer utilities {
  .container {
    width: 100%;
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
    padding-left: var(--spacing-4);
    padding-right: var(--spacing-4);
  }

  .prose > * + * {
    margin-top: 1em;
  }
}
```

### Add generated css file to `.gitignore`

e.g.
`**/*.gen.css`

### Usage with preprocessors

Preprocessors like `Sass/SCSS/Less` can be used, but not tested yet and may require additional configuration to avoid conflicts with @layer and PostCSS processing.

## NOTES

- Successfully tested with projects using **Vite + React**, **Next.js**, and **Astro**

## License

MIT

## Links

- [npm](https://www.npmjs.com/package/postcss-token-utilities)
- [GitHub](https://github.com/viraj-gamdha/postcss-token-utilities)

## Support

If you find this plugin helpful, consider buying me a coffee! ☕

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-black?style=for-the-badge&logo=buy-me-a-coffee)](https://buymeacoffee.com/virajpatel)
