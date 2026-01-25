# postcss-token-utilities

A token-driven utility CSS generator for PostCSS. It generates utility classes from modern CSS custom properties and injects only the utilities you actually use, while preserving a CSS-first workflow.

This is not a `Tailwind CSS` replacement.

It is designed for projects that want:

- Token-driven utilities instead of predefined design systems
- A `modern CSS-first` workflow (@layer, custom properties, @custom-media)
- Minimal, predictable utility generation
- The ability to mix utilities with CSS Modules and traditional CSS


Use utilities where they make sense, use modern CSS everywhere else.

---

## Why postcss-token-utilities?

Most utility frameworks ship large predefined design systems.

postcss-token-utilities takes a different approach:

- Your design tokens define the system
- Utilities are generated from your tokens
- Only used utilities are injected
- CSS remains the source of truth

This makes it ideal for teams that want:
- full control over design tokens
- minimal utility CSS
- no imposed design constraints


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
└── media.css         # Breakpoints (@custom-media definitions)

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

Here is example of tokens supported by default

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

[data-theme="dark"] {
  // add dark mode overrides here...
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
/* Required */
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

**media.css** - Breakpoints

```css
@custom-media --sm (width <= 640px);
@custom-media --md (width <= 768px);
@custom-media --lg (width <= 1024px);
```

**globals.css** - Import all

```css
/* Priority / cascade order: low → high */
@layer base, components, utilities-gen, utilities, overrides;

@import "./app.css";
@import "./components.css";
@import "./utilities.css";

/* Optional: If you have very specific overrides / resets that should win */
@layer overrides {
}
```

### PostCSS Plugin Configuration

_Configuration Options_

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

### PostCSS Config (Recommended Example)

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    // Recommended: global @custom-media / variables support
    "@csstools/postcss-global-data": {
      files: ["./src/styles/media.css"],
    },

    // Recommended: Modern CSS features + @custom-media polyfill
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
      content: ["./src/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
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
import { resolve, basename } from "path";
import crypto from "crypto";

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
    // modify css modules class names
    modules: {
      generateScopedName: (className, filePath) => {
        const rawFileName = basename(filePath); // App.module.css
        const cleaned = rawFileName
          .replace(/\b.module\b/, "")
          .replace(/\.[^/.]+$/, "")
          .toLowerCase();

        const hash = crypto
          .createHash("sha256")
          .update(`${cleaned}_${className}`)
          .digest("hex")
          .slice(0, 5);

        return `${cleaned}_${className}_${hash}`;
      },
    },

    // postcss config
    postcss: {
      plugins: [
        // Recommended: global @custom-media / variables support
        postcssGlobalData({
          files: ["./src/styles/media.css"],
        }),

        // Recommended: Modern CSS features + @custom-media polyfill
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
          content: ["./src/**/*.[jt]s", "./src/**/*.[jt]sx"],
          // ... more options (generated, extend, etc.) go here, read more for details ...
        }),

        // Minify CSS only in production
        ...(process.env.NODE_ENV === "production" ? [cssNano()] : []),
      ],
    },
  },
});
```

### Example Component

```jsx
// button.tsx
import styles from "./button.module.css";
import clsx from "clsx";

export function Button({ variant, children }) {
  return (
    <button
      className={clsx(styles.base, "px-4 py-2 rounded-lg transition-base")}
    >
      {children}
    </button>
  );
}

// Mix utilities with CSS modules as needed
```

```css
/* button.module.css */
.base {
  background: linear-gradient(
    to right,
    var(--color-secondary),
    var(--color-muted)
  );
  color: var(--color-foreground);
}
```

## Rules

The plugin generates utilities from three types of rules:

### 1. Static Rules

Pre-defined utilities that don't depend on CSS variables.

```typescript
interface StaticRule {
  class: string;
  css: string;
}
```

**Default Static Rules (Included by Default)**

```javascript
  // e.g.
  { class: "flex", css: "display: flex" },
  // + all important static rules
  // please refer the source code for more details
  // or can refer generated css file for more details
```

### 2. Token Rules

Utilities generated from CSS variables in your design tokens.

```typescript
interface TokenRule {
  token: string; // CSS variable prefix (e.g., "spacing")
  prefix: string; // Class prefix (e.g., "p-")
  css: (key: string, value: string) => string;
}
```

**Default Token Rules (Included by Default)**

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

### More examples

| Token        | Prefix        | Example           | Generated CSS                                                     |
| ------------ | ------------- | ----------------- | ----------------------------------------------------------------- |
| `spacing`    | `p-`          | `p-4`             | `padding: var(--spacing-4)`                                       |
| `spacing`    | `px-`         | `px-4`            | `padding-left: var(--spacing-4); padding-right: var(--spacing-4)` |
| `color`      | `bg-`         | `bg-primary`      | `background-color: var(--color-primary)`                          |
| `color`      | `text-`       | `text-primary`    | `color: var(--color-primary)`                                     |
| `border`     | `border-`     | `border-1`        | `border-width: var(--border-1)`                                   |
| `shadow`     | `shadow-`     | `shadow-md`       | `box-shadow: var(--shadow-md)`                                    |
| `transition` | `transition-` | `transition-base` | `transition: var(--transition-base)`                              |

### 3. Variant Rules

Modifiers for utilities (pseudo-classes and media queries). Variants allow you to apply utilities conditionally, such as on hover, focus, dark mode, or specific screen sizes.

```typescript
interface VariantRule {
  name: string;
  type: "pseudo" | "media";
  condition?: string; // Required for media variants
}
```

**Pseudo Variants (Pre-added):**

These are automatically included and apply common interactive states.

```javascript
{ name: "hover",    type: "pseudo" },
{ name: "focus",    type: "pseudo" },
{ name: "active",   type: "pseudo" },
{ name: "disabled", type: "pseudo" },
```

**Usage examples:**  
`hover:bg-primary`, `focus:ring-2`, `active:scale-95`, `disabled:opacity-50`

**Media Variants (Pre-added):**

These include common accessibility and theme preferences, plus responsive breakpoints auto-generated from your `@custom-media` definitions in `media.css`.

```javascript
{ name: "dark",       type: "media", condition: "prefers-color-scheme: dark" }
{ name: "print",      type: "media", condition: "print" }
{ name: "motion-safe", type: "media", condition: "prefers-reduced-motion: no-preference" }

// Auto-generated from @custom-media in media.css (examples):
{ name: "sm", type: "media", condition: "width <= 640px" }
{ name: "md", type: "media", condition: "width <= 768px" }
{ name: "lg", type: "media", condition: "width <= 1024px" }
```

**Usage examples:**  
`dark:bg-gray-900`, `print:hidden`, `motion-safe:transition-all`, `md:flex-row`, `lg:grid-cols-3`

### Summary of variant rules

| Variant       | Type   | Condition / Trigger                     | Typical Usage Example        | Description                                |
| ------------- | ------ | --------------------------------------- | ---------------------------- | ------------------------------------------ |
| `hover`       | pseudo | `:hover`                                | `hover:bg-blue-500`          | Mouse hover state                          |
| `focus`       | pseudo | `:focus`                                | `focus:outline-none`         | Keyboard focus / form focus                |
| `active`      | pseudo | `:active`                               | `active:scale-95`            | Click/tap active state                     |
| `disabled`    | pseudo | `:disabled`                             | `disabled:opacity-60`        | Disabled form elements                     |
| `dark`        | media  | `prefers-color-scheme: dark`            | `dark:text-white`            | System dark mode preference                |
| `print`       | media  | `@media print`                          | `print:hidden`               | When printing the page                     |
| `motion-safe` | media  | `prefers-reduced-motion: no-preference` | `motion-safe:transition-all` | Users who haven't requested reduced motion |
| `sm`          | media  | `@custom-media --sm (width <= 640px)`   | `sm:flex-col`                | Small screens / mobile                     |
| `md`          | media  | `@custom-media --md (width <= 768px)`   | `md:grid-cols-2`             | Medium screens / tablet                    |
| `lg`          | media  | `@custom-media --lg (width <= 1024px)`  | `lg:text-xl`                 | Large screens / desktop                    |

## Extending Rules

### Extend Token Rules

Add new CSS variables, register them as token rules.

**Add token to CSS:**

```css
:root {
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --line-height-loose: 2;
}
```

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    "postcss-token-utilities": {
      designTokenSource: "./src/styles/app.css",
      customMediaSource: "./src/styles/media.css",
      content: ["./src/**/*.{js,jsx,ts,tsx}"],

      // register the new token
      extend: {
        tokenRules: [
          {
            token: "line-height",
            prefix: "leading-",
            css: (_k, v) => `line-height: ${v};`,
            // This will generate all specific classes
            // leading-tight -> line-height: var(--line-height-1.2)
            // leading-normal -> line-height: var(--line-height-1.5)
            // leadding-loose -> line-height: var(--line-height-2)
          },
        ],
      },
    },
  },
};
```

### Extend Static Rules

```javascript
extend: {
  staticRules: [
    { class: "aspect-video", css: "aspect-ratio: 16/9" },
    { class: "aspect-square", css: "aspect-ratio: 1/1" },
  ],
}
```

### Extend Variant Rules

```javascript
extend: {
  variantRules: [
    { name: "group-hover", type: "pseudo" },
    { name: "first", type: "pseudo" },
    { name: "landscape", type: "media", condition: "orientation: landscape" },
  ],
}
```

### Disable Default Rules

```javascript
{
  defaultRules: {
    staticRules: false,   // Disable all defaults
    tokenRules: false,
    variantRules: false,
  },
  extend: {
    // Add only your rules
  }
}
```

## Generated Dev File for IntelliSense

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

## NOTE
**⚠️ Experimental project**
- postcss-token-utilities is currently in early development.
The source code and API may change as the project evolves.

## License

MIT

## Links

- [npm](https://www.npmjs.com/package/postcss-token-utilities)
- [GitHub](https://github.com/viraj-gamdha/postcss-token-utilities)