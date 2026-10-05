import { NIGERIAN_STATES, STATE_ALIASES, STREET_TYPE_ALIASES } from "./data.js";

export function normalizeWhitespace(value: string): string {
  return value.replace(/[\t\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim();
}
export function normalizeText(value: string): string {
  return normalizeWhitespace(value).normalize("NFKC")
    .replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
    .replace(/\s*,\s*/g, ", ").trim();
}
/** Small bounded memo for pure string functions (the same few hundred tokens recur constantly). */
function memo(fn: (v: string) => string, max = 5000): (v: string) => string {
  const cache = new Map<string, string>();
  return (v: string) => {
    const hit = cache.get(v); if (hit !== undefined) return hit;
    const out = fn(v); if (cache.size >= max) cache.clear(); cache.set(v, out); return out;
  };
}
export const canonicalToken = memo(function canonicalTokenImpl(value: string): string {
  return normalizeWhitespace(value).toLocaleLowerCase("en-NG")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,;:()[\]{}'"/]/g, " ").replace(/\s+/g, " ").trim();
});
const ROMAN_NUMERAL = /^(ii|iii|iv|vi|vii|viii|ix|xi|xii)$/i;
const KNOWN_ACRONYMS = new Set(["UI","GRA","NNPC","UCH","FHA","CBD","NEPA","PHCN","NTA","FCT","LGA","INEC","NIPOST","GPO","UNN","UNILAG","UNIBEN","FUTA","LASU","OAU","FUTO"]);
/** Title-case that keeps acronyms (UI, GRA, NNPC) and Roman numerals (Wuse II) intact. */
export function smartTitleCase(value: string): string {
  const text = normalizeText(value);
  const allUpper = text === text.toUpperCase() && /[A-Z]/.test(text);
  let wordIndex = -1;
  return text.split(/(\s+|-|\/)/).map(tok => {
    if (!tok || /^(\s+|-|\/)$/.test(tok)) return tok;
    wordIndex++;
    if (wordIndex > 0 && /^(of|and|the)$/i.test(tok)) return tok.toLowerCase();
    const bare = tok.replace(/\./g, "").toUpperCase();
    if (KNOWN_ACRONYMS.has(bare) || ROMAN_NUMERAL.test(tok)) return tok.toUpperCase();
    if (!allUpper && /^[A-Z][A-Z.]+$/.test(tok) && tok.length <= 6) return tok;
    return tok.charAt(0).toUpperCase() + tok.slice(1).toLowerCase();
  }).join("");
}
const STATE_LOOKUP: ReadonlyMap<string, string> = (() => {
  const key = (v: string) => canonicalToken(v).replace(/-/g, " ").replace(/\s+state$/, "").replace(/\s+/g, " ").trim();
  const map = new Map<string, string>();
  for (const [name] of NIGERIAN_STATES) map.set(key(name), name);
  for (const [alias, name] of Object.entries(STATE_ALIASES)) map.set(key(alias), name);
  return map;
})();
/** Canonical state name, or undefined when the input is not a Nigerian state/FCT name or alias. */
export function normalizeState(value: string): string | undefined {
  const key = canonicalToken(value).replace(/-/g, " ").replace(/\s+state$/, "").replace(/\s+/g, " ").trim();
  return STATE_LOOKUP.get(key);
}
export function normalizeStreet(value: string): string {
  const text = smartTitleCase(normalizeText(value).replace(/^[,\s]+|[,\s]+$/g, ""));
  return text.replace(/\b([A-Za-z]+)\.?$/, (full, word: string) => {
    const type = STREET_TYPE_ALIASES[word.toLowerCase()];
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : full;
  });
}
const comparableMemo = memo(function comparableImpl(value: string): string {
  return canonicalToken(value)
    .replace(/\broad\b/g, "rd").replace(/\bstreet\b/g, "st").replace(/\bclose\b/g, "cl")
    .replace(/\bcrescent\b/g, "cres").replace(/\bavenue\b/g, "ave").replace(/\bdrive\b/g, "dr")
    .replace(/\blane\b/g, "ln").replace(/\bterrace\b/g, "ter" );
});
export function normalizeComparable(value: string | undefined): string {
  return value ? comparableMemo(value) : "";
}
export function tokenize(value: string): string[] { return canonicalToken(value).split(" ").filter(Boolean); }
