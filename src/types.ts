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
