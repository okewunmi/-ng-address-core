import { STATES_V8 } from "./catalog.js";
/** Nigerian legacy postal postcode: six digits. */
export function isLegacyPostcode(value: string): boolean {
  return /^\d{6}$/.test(value.trim());
}

/**
 * NIPOST National Digital Alphanumeric Postcode.
 *
 * Canonical segments: AA-99-AAA-AA-99.
 * Input is intentionally separator-tolerant: spaces, hyphens and compact form
 * are all accepted. Format validation does not assert that a postcode exists.
 */
const DIGITAL_POSTCODE_PATTERN = /^([A-Z]{2})[-\s]?(\d{2})[-\s]?([A-Z0-9]{3})[-\s]?([A-Z]{2})[-\s]?(\d{2})$/i;

/**
 * Two-letter state/FCT prefixes, derived from the bundled catalog (ISO 3166-2:NG codes).
 * NOTE: these have NOT been confirmed against NIPOST's own prefix table. Only `EK` (Ekiti)
 * appears in NIPOST examples. Treat `isKnownDigitalPostcodeState` as a heuristic and rely on the
 * NIPOST API for authority.
 */
export const DIGITAL_STATE_CODES: ReadonlySet<string> = new Set(STATES_V8.map(state => state.code));

export function parseDigitalPostcode(value: string): { state: string; lga: string; district: string; area: string; building: string } | undefined {
  const match = value.trim().toUpperCase().match(DIGITAL_POSTCODE_PATTERN);
  if (!match) return undefined;
  const [, state, lga, district, area, building] = match;
  if (!state || !lga || !district || !area || !building) return undefined;
  if (lga === "00" || building === "00") return undefined;
  return { state, lga, district, area, building };
}

/** Syntactic validation only. It does not prove the code exists. */
export function isDigitalPostcode(value: string): boolean {
  return parseDigitalPostcode(value) !== undefined;
}

/** Optional semantic check for whether the two-letter prefix is a published Nigerian state/FCT code. */
export function isKnownDigitalPostcodeState(value: string): boolean {
  const parsed = parseDigitalPostcode(value);
  return parsed ? DIGITAL_STATE_CODES.has(parsed.state) : false;
}

export function normalizeDigitalPostcode(value: string): string {
  const parsed = parseDigitalPostcode(value);
  if (!parsed) return value.trim().toUpperCase();
  return `${parsed.state} ${parsed.lga} ${parsed.district} ${parsed.area} ${parsed.building}`;
}

export function extractPostcodes(raw: string): { legacy?: string; digital?: string } {
  const candidates = raw.match(/\b[A-Za-z]{2}(?:[-\s]?\d{2})[-\s]?[A-Za-z0-9]{3}[-\s]?[A-Za-z]{2}[-\s]?\d{2}\b/g) ?? [];
  const digital = candidates.find(c => isDigitalPostcode(c));
  const legacy = raw.match(/\b\d{6}\b/);
  return {
    ...(legacy ? { legacy: legacy[0] } : {}),
    ...(digital ? { digital: normalizeDigitalPostcode(digital) } : {})
  };
}
