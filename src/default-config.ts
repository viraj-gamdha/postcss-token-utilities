import { StaticRule, TokenRule, VariantRule } from ".";

const DEFAULT_CLASS_MATCHER: string[] = [
  "className",
  "class",
  "classList",
  "class:list",
  "clsx",
  "cn",
];

// Default Rules

// Border & Outline common
const lineStyles = ["solid", "dashed", "dotted", "double", "none"];

// Border
const staticBorderStyles = lineStyles.flatMap((style) => [
  { class: `border-${style}`, css: `border-style: ${style}` },
  { class: `border-t-${style}`, css: `border-top-style: ${style}` },
  { class: `border-r-${style}`, css: `border-right-style: ${style}` },
  { class: `border-b-${style}`, css: `border-bottom-style: ${style}` },
  { class: `border-l-${style}`, css: `border-left-style: ${style}` },
]);

// Outline
const staticOutlineStyles = lineStyles.map((style) => ({
  class: style === "none" ? "outline-none" : `outline-${style}`,
  css:
    style === "none"
      ? "outline: 2px solid transparent; outline-offset: 2px"
      : `outline-style: ${style}`,
}));

const outlineOffsets = [0, 1, 2, 4, 8];
const staticOutlineOffsets = outlineOffsets.map((o) => ({
  class: `outline-offset-${o}`,
  css: `outline-offset: ${o}px`,
}));

const DEFAULT_STATIC_RULES: StaticRule[] = [
  // Display
  { class: "block", css: "display: block" },
  { class: "inline-block", css: "display: inline-block" },
  { class: "inline", css: "display: inline" },
  { class: "flex", css: "display: flex" },
  { class: "inline-flex", css: "display: inline-flex" },
  { class: "grid", css: "display: grid" },
  { class: "inline-grid", css: "display: inline-grid" },
  { class: "hidden", css: "display: none" },

  // Position
  { class: "static", css: "position: static" },
  { class: "fixed", css: "position: fixed" },
  { class: "absolute", css: "position: absolute" },
  { class: "relative", css: "position: relative" },
  { class: "sticky", css: "position: sticky" },

  // Overflow
  { class: "overflow-auto", css: "overflow: auto" },
  { class: "overflow-hidden", css: "overflow: hidden" },
  { class: "overflow-visible", css: "overflow: visible" },
  { class: "overflow-scroll", css: "overflow: scroll" },
  { class: "overflow-x-auto", css: "overflow-x: auto" },
  { class: "overflow-y-auto", css: "overflow-y: auto" },
  { class: "overflow-x-hidden", css: "overflow-x: hidden" },
  { class: "overflow-y-hidden", css: "overflow-y: hidden" },

  // Flexbox
  { class: "flex-row", css: "flex-direction: row" },
  { class: "flex-row-reverse", css: "flex-direction: row-reverse" },
  { class: "flex-col", css: "flex-direction: column" },
  { class: "flex-col-reverse", css: "flex-direction: column-reverse" },
  { class: "flex-wrap", css: "flex-wrap: wrap" },
  { class: "flex-wrap-reverse", css: "flex-wrap: wrap-reverse" },
  { class: "flex-nowrap", css: "flex-wrap: nowrap" },
  { class: "flex-1", css: "flex: 1 1 0%" },
  { class: "flex-auto", css: "flex: 1 1 auto" },
  { class: "flex-initial", css: "flex: 0 1 auto" },
  { class: "flex-none", css: "flex: none" },
  { class: "flex-grow", css: "flex-grow: 1" },
  { class: "flex-grow-0", css: "flex-grow: 0" },
  { class: "flex-shrink", css: "flex-shrink: 1" },
  { class: "flex-shrink-0", css: "flex-shrink: 0" },

  // Align & Justify
  { class: "items-start", css: "align-items: flex-start" },
  { class: "items-end", css: "align-items: flex-end" },
  { class: "items-center", css: "align-items: center" },
  { class: "items-baseline", css: "align-items: baseline" },
  { class: "items-stretch", css: "align-items: stretch" },
  { class: "justify-start", css: "justify-content: flex-start" },
  { class: "justify-end", css: "justify-content: flex-end" },
  { class: "justify-center", css: "justify-content: center" },
  { class: "justify-between", css: "justify-content: space-between" },
  { class: "justify-around", css: "justify-content: space-around" },
  { class: "justify-evenly", css: "justify-content: space-evenly" },
  { class: "self-auto", css: "align-self: auto" },
  { class: "self-start", css: "align-self: flex-start" },
  { class: "self-end", css: "align-self: flex-end" },
  { class: "self-center", css: "align-self: center" },
  { class: "self-stretch", css: "align-self: stretch" },

  // Text alignment & transform
  { class: "text-left", css: "text-align: left" },
  { class: "text-center", css: "text-align: center" },
  { class: "text-right", css: "text-align: right" },
  { class: "text-justify", css: "text-align: justify" },
  { class: "uppercase", css: "text-transform: uppercase" },
  { class: "lowercase", css: "text-transform: lowercase" },
  { class: "capitalize", css: "text-transform: capitalize" },
  { class: "normal-case", css: "text-transform: none" },

  // Text decoration
  { class: "underline", css: "text-decoration: underline" },
  { class: "line-through", css: "text-decoration: line-through" },
  { class: "no-underline", css: "text-decoration: none" },

  // Whitespace & word break
  { class: "whitespace-normal", css: "white-space: normal" },
  { class: "whitespace-nowrap", css: "white-space: nowrap" },
  { class: "whitespace-pre", css: "white-space: pre" },
  { class: "whitespace-pre-line", css: "white-space: pre-line" },
  { class: "whitespace-pre-wrap", css: "white-space: pre-wrap" },
  { class: "break-normal", css: "word-break: normal; overflow-wrap: normal" },
  { class: "break-words", css: "overflow-wrap: break-word" },
  { class: "break-all", css: "word-break: break-all" },

  // Cursor
  { class: "cursor-auto", css: "cursor: auto" },
  { class: "cursor-default", css: "cursor: default" },
  { class: "cursor-pointer", css: "cursor: pointer" },
  { class: "cursor-wait", css: "cursor: wait" },
  { class: "cursor-text", css: "cursor: text" },
  { class: "cursor-move", css: "cursor: move" },
  { class: "cursor-not-allowed", css: "cursor: not-allowed" },

  // User select
  { class: "select-none", css: "user-select: none" },
  { class: "select-text", css: "user-select: text" },
  { class: "select-all", css: "user-select: all" },
  { class: "select-auto", css: "user-select: auto" },

  // Pointer events
  { class: "pointer-events-none", css: "pointer-events: none" },
  { class: "pointer-events-auto", css: "pointer-events: auto" },

  // Opacity
  { class: "opacity-0", css: "opacity: 0" },
  { class: "opacity-25", css: "opacity: 0.25" },
  { class: "opacity-50", css: "opacity: 0.5" },
  { class: "opacity-75", css: "opacity: 0.75" },
  { class: "opacity-100", css: "opacity: 1" },

  // Z-Index
  { class: "z-0", css: "z-index: 0" },
  { class: "z-10", css: "z-index: 10" },
  { class: "z-20", css: "z-index: 20" },
  { class: "z-30", css: "z-index: 30" },
  { class: "z-40", css: "z-index: 40" },
  { class: "z-50", css: "z-index: 50" },
  { class: "z-auto", css: "z-index: auto" },

  // Object fit
  { class: "object-contain", css: "object-fit: contain" },
  { class: "object-cover", css: "object-fit: cover" },
  { class: "object-fill", css: "object-fit: fill" },
  { class: "object-none", css: "object-fit: none" },
  { class: "object-scale-down", css: "object-fit: scale-down" },

  // Visibility
  { class: "visible", css: "visibility: visible" },
  { class: "invisible", css: "visibility: hidden" },

  // Grid static
  { class: "col-auto", css: "grid-column: auto" },
  { class: "row-auto", css: "grid-row: auto" },
  { class: "col-span-full", css: "grid-column: 1 / -1" },
  { class: "row-span-full", css: "grid-row: 1 / -1" },

  // Outline / Border
  ...staticOutlineOffsets,
  ...staticOutlineStyles,
  ...staticBorderStyles,

  // Auto margins & sizing
  { class: "m-auto", css: "margin: auto" },
  { class: "mx-auto", css: "margin-left: auto; margin-right: auto" },
  { class: "my-auto", css: "margin-top: auto; margin-bottom: auto" },
  { class: "mt-auto", css: "margin-top: auto" },
  { class: "mr-auto", css: "margin-right: auto" },
  { class: "mb-auto", css: "margin-bottom: auto" },
  { class: "ml-auto", css: "margin-left: auto" },

  // Width & Height
  { class: "w-auto", css: "width: auto" },
  { class: "w-full", css: "width: 100%" },
  { class: "w-screen", css: "width: 100vw" },
  { class: "w-min", css: "width: min-content" },
  { class: "w-max", css: "width: max-content" },
  { class: "w-fit", css: "width: fit-content" },
  { class: "h-auto", css: "height: auto" },
  { class: "h-full", css: "height: 100%" },
  { class: "h-screen", css: "height: 100vh" },
  { class: "h-min", css: "height: min-content" },
  { class: "h-max", css: "height: max-content" },
  { class: "h-fit", css: "height: fit-content" },
  { class: "max-w-none", css: "max-width: none" },
  { class: "max-w-full", css: "max-width: 100%" },
  { class: "max-w-screen", css: "max-width: 100vw" },
  { class: "max-w-min", css: "max-width: min-content" },
  { class: "max-w-max", css: "max-width: max-content" },
  { class: "max-w-fit", css: "max-width: fit-content" },
  { class: "min-w-full", css: "min-width: 100%" },
  { class: "min-w-screen", css: "min-width: 100vw" },
  { class: "min-w-min", css: "min-width: min-content" },
  { class: "min-w-max", css: "min-width: max-content" },
  { class: "min-w-fit", css: "min-width: fit-content" },
  { class: "max-h-none", css: "max-height: none" },
  { class: "max-h-full", css: "max-height: 100%" },
  { class: "max-h-screen", css: "max-height: 100vh" },
  { class: "max-h-min", css: "max-height: min-content" },
  { class: "max-h-max", css: "max-height: max-content" },
  { class: "max-h-fit", css: "max-height: fit-content" },
  { class: "min-h-0", css: "min-height: 0px" },
  { class: "min-h-full", css: "min-height: 100%" },
  { class: "min-h-screen", css: "min-height: 100vh" },
  { class: "min-h-min", css: "min-height: min-content" },
  { class: "min-h-max", css: "min-height: max-content" },
  { class: "min-h-fit", css: "min-height: fit-content" },
];

// Must add tokens in css root: {} to see it work
const DEFAULT_TOKEN_RULES: TokenRule[] = [
  // Spacing (all directions + shorthands)
  {
    token: "spacing",
    prefix: "gap-",
    css: (_k, v) => `gap: ${v};`,
  },
  {
    token: "spacing",
    prefix: "gap-x-",
    css: (_k, v) => `column-gap: ${v};`,
  },
  {
    token: "spacing",
    prefix: "gap-y-",
    css: (_k, v) => `row-gap: ${v};`,
  },

  // Padding
  {
    token: "spacing",
    prefix: "p-",
    css: (_k, v) => `padding: ${v};`,
  },
  {
    token: "spacing",
    prefix: "pt-",
    css: (_k, v) => `padding-top: ${v};`,
  },
  {
    token: "spacing",
    prefix: "pr-",
    css: (_k, v) => `padding-right: ${v};`,
  },
  {
    token: "spacing",
    prefix: "pb-",
    css: (_k, v) => `padding-bottom: ${v};`,
  },
  {
    token: "spacing",
    prefix: "pl-",
    css: (_k, v) => `padding-left: ${v};`,
  },
  {
    token: "spacing",
    prefix: "px-",
    css: (_k, v) => `padding-left: ${v}; padding-right: ${v};`,
  },
  {
    token: "spacing",
    prefix: "py-",
    css: (_k, v) => `padding-top: ${v}; padding-bottom: ${v};`,
  },

  // Margin
  {
    token: "spacing",
    prefix: "m-",
    css: (_k, v) => `margin: ${v};`,
  },
  {
    token: "spacing",
    prefix: "mt-",
    css: (_k, v) => `margin-top: ${v};`,
  },
  {
    token: "spacing",
    prefix: "mr-",
    css: (_k, v) => `margin-right: ${v};`,
  },
  {
    token: "spacing",
    prefix: "mb-",
    css: (_k, v) => `margin-bottom: ${v};`,
  },
  {
    token: "spacing",
    prefix: "ml-",
    css: (_k, v) => `margin-left: ${v};`,
  },
  {
    token: "spacing",
    prefix: "mx-",
    css: (_k, v) => `margin-left: ${v}; margin-right: ${v};`,
  },
  {
    token: "spacing",
    prefix: "my-",
    css: (_k, v) => `margin-top: ${v}; margin-bottom: ${v};`,
  },

  // Size (width, height, min/max)
  {
    token: "spacing",
    prefix: "w-",
    css: (_k, v) => `width: ${v};`,
  },
  {
    token: "spacing",
    prefix: "h-",
    css: (_k, v) => `height: ${v};`,
  },
  {
    token: "spacing",
    prefix: "min-w-",
    css: (_k, v) => `min-width: ${v};`,
  },
  {
    token: "spacing",
    prefix: "min-h-",
    css: (_k, v) => `min-height: ${v};`,
  },
  {
    token: "spacing",
    prefix: "max-w-",
    css: (_k, v) => `max-width: ${v};`,
  },
  {
    token: "spacing",
    prefix: "max-h-",
    css: (_k, v) => `max-height: ${v};`,
  },

  // Inset / positioning
  {
    token: "spacing",
    prefix: "inset-",
    css: (_k, v) => `inset: ${v};`,
  },
  {
    token: "spacing",
    prefix: "inset-x-",
    css: (_k, v) => `left: ${v}; right: ${v};`,
  },
  {
    token: "spacing",
    prefix: "inset-y-",
    css: (_k, v) => `top: ${v}; bottom: ${v};`,
  },
  {
    token: "spacing",
    prefix: "top-",
    css: (_k, v) => `top: ${v};`,
  },
  {
    token: "spacing",
    prefix: "right-",
    css: (_k, v) => `right: ${v};`,
  },
  {
    token: "spacing",
    prefix: "bottom-",
    css: (_k, v) => `bottom: ${v};`,
  },
  {
    token: "spacing",
    prefix: "left-",
    css: (_k, v) => `left: ${v};`,
  },

  // Colors
  {
    token: "color",
    prefix: "bg-",
    css: (k, v) => {
      if (k.startsWith("gradient-")) {
        return `background: linear-gradient(to right, ${v}, transparent);`;
      }
      return `background-color: ${v};`;
    },
  },
  {
    token: "color",
    prefix: "text-",
    css: (_k, v) => `color: ${v};`,
  },
  {
    token: "color",
    prefix: "border-",
    css: (_k, v) => `border-color: ${v};`,
  },
  {
    token: "color",
    prefix: "outline-",
    css: (_k, v) => `outline-color: ${v};`,
  },
  {
    token: "color",
    prefix: "fill-",
    css: (_k, v) => `fill: ${v};`,
  },
  {
    token: "color",
    prefix: "stroke-",
    css: (_k, v) => `stroke: ${v};`,
  },

  // Border, Outline & Radius
  {
    token: "radius",
    prefix: "rounded-",
    css: (k, v) => {
      if (k === "none") return "border-radius: 0;";
      if (k === "full") return "border-radius: 9999px;";
      return `border-radius: ${v};`;
    },
  },
  {
    token: "border",
    prefix: "border-",
    css: (_k, v) => `border-width: ${v};`,
  },
  {
    token: "outline",
    prefix: "outline-",
    css: (_k, v) => `outline-width: ${v};`,
  },
  // Typography
  {
    token: "font-size",
    prefix: "text-",
    css: (_k, v) => `font-size: ${v};`,
  },
  {
    token: "font-weight",
    prefix: "font-",
    css: (_k, v) => `font-weight: ${v};`,
  },
  {
    token: "font-family",
    prefix: "font-",
    css: (_k, v) => `font-family: ${v};`,
  },

  // Effects
  {
    token: "shadow",
    prefix: "shadow-",
    css: (_k, v) => `box-shadow: ${v};`,
  },
  {
    token: "transition",
    prefix: "transition-",
    css: (_k, v) => `transition: ${v};`,
  },

  // Others
  {
    token: "line-height",
    prefix: "leading-",
    css: (_k, v) => `line-height: ${v};`,
  },
];

// Variant rules hover:, focus:, dark:, md:, lg: etc.
const DEFAULT_VARIANT_RULES: VariantRule[] = [
  // i. Pseudo-class variants (Interactive states)
  { name: "hover", type: "pseudo" },
  { name: "focus", type: "pseudo" },
  { name: "focus-within", type: "pseudo" },
  { name: "focus-visible", type: "pseudo" },
  { name: "active", type: "pseudo" },
  { name: "disabled", type: "pseudo" },
  { name: "checked", type: "pseudo" },

  // Structural pseudo-classes
  { name: "first", type: "pseudo" },
  { name: "last", type: "pseudo" },
  { name: "only", type: "pseudo" },
  { name: "odd", type: "pseudo" },
  { name: "even", type: "pseudo" },
  { name: "first-of-type", type: "pseudo" },
  { name: "last-of-type", type: "pseudo" },
  { name: "only-of-type", type: "pseudo" },

  // ii. Media query variants (Responsive & Preferences)
  // Most of the media variants can be easily added via @custom-media from media.css ...
  // And those can be used as utilities in classes also in css files

  // iii. Ancestor variants (Group & Peer patterns)
  // Group - for parent hover/focus states (any descendant)
  { name: "group-hover", type: "ancestor", selector: ".group:hover" },
  { name: "group-focus", type: "ancestor", selector: ".group:focus" },
  { name: "group-active", type: "ancestor", selector: ".group:active" },

  // Group Direct - for immediate children only
  { name: "group-hover-direct", type: "ancestor", selector: ".group:hover >" },
  { name: "group-focus-direct", type: "ancestor", selector: ".group:focus >" },
  { name: "group-active", type: "ancestor", selector: ".group:active >" },
];

export {
  DEFAULT_CLASS_MATCHER,
  DEFAULT_STATIC_RULES,
  DEFAULT_TOKEN_RULES,
  DEFAULT_VARIANT_RULES,
};
