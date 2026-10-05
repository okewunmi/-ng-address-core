import { STATE_ALIASES, STREET_TYPE_ALIASES } from "./data.js";

export function normalizeWhitespace(value: string): string {
  return value.replace(/[\t\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim();
}
export function normalizeText(value: string): string {
  return normalizeWhitespace(value).normalize("NFKC")
    .replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
    .replace(/\s*,\s*/g, ", ").trim();
}
export function canonicalToken(value: string): string {
  return normalizeWhitespace(value).toLocaleLowerCase("en-NG")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,;:()[\]{}'"/]/g, " ").replace(/\s+/g, " ").trim();
}
export function normalizeState(value: string): string | undefined {
  const key = canonicalToken(value).replace(/\s+state$/, " state");
  return STATE_ALIASES[key] ?? Object.entries(STATE_ALIASES).find(([k]) => k === key)?.[1] ?? value.trim();
}
export function normalizeStreet(value: string): string {
  let text = normalizeText(value).replace(/^[,\s]+|[,\s]+$/g, "");
  text = text.toLowerCase().replace(/(^|[\s\-/])([a-z])/g, (_, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`);
  return text.replace(/\b([A-Za-z]+)\.?$/i, (full, word: string) => STREET_TYPE_ALIASES[word.toLowerCase()] ?? full).replace(/\b(street|road|avenue|close|crescent|drive|way|boulevard|lane|court|place|terrace)$/i, (_, type: string) => type.toLowerCase());
}
export function normalizeComparable(value: string | undefined): string {
  if (!value) return "";
  return canonicalToken(value)
    .replace(/\broad\b/g, "rd").replace(/\bstreet\b/g, "st").replace(/\bclose\b/g, "cl")
    .replace(/\bcrescent\b/g, "cres").replace(/\bavenue\b/g, "ave").replace(/\bdrive\b/g, "dr")
    .replace(/\blane\b/g, "ln").replace(/\bterrace\b/g, "ter" );
}
export function tokenize(value: string): string[] { return canonicalToken(value).split(" ").filter(Boolean); }
