import { STATES_V8, type StateRecord } from "./catalog.js";
import { normalizeComparable } from "./normalize.js";

export type LocalityKind = "capital" | "lga";
export type LocalityStatus = "unique" | "ambiguous" | "not-found";

export interface LocalityCandidate {
  name: string;
  state: string;
  kind: LocalityKind;
  score: number;
  matchedBy: "exact" | "alias" | "normalized";
}

export interface LocalityResolution {
  status: LocalityStatus;
  input: string;
  candidates: readonly LocalityCandidate[];
}

const CITY_ALIASES: Record<string, string> = {
  "vi": "Victoria Island",
  "v i": "Victoria Island",
  "v.i": "Victoria Island",
  "victoria island": "Victoria Island",
  "ibadan": "Ibadan",
  "abuja": "Abuja",
  "kaduna": "Kaduna",
  "lagos": "Lagos",
  "benin city": "Benin City",
  "benin": "Benin City",
  "port harcourt": "Port Harcourt",
  "port-harcourt": "Port Harcourt",
  "ph": "Port Harcourt",
  "jimeta yola": "Jimeta-Yola",
  "jimeta-yola": "Jimeta-Yola",
  "ado ekiti": "Ado-Ekiti",
  "ado-ekiti": "Ado-Ekiti",
};

const stateByName = new Map<string, StateRecord>(
  STATES_V8.map((state) => [normalizeComparable(state.name), state]),
);

function candidateForState(value: string, state: StateRecord): LocalityCandidate[] {
  const key = normalizeComparable(value);
  const candidates: LocalityCandidate[] = [];
  if (key === normalizeComparable(state.capital)) {
    candidates.push({ name: state.capital, state: state.name, kind: "capital", score: 1, matchedBy: "exact" });
  }
  const alias = CITY_ALIASES[key];
  if (alias && normalizeComparable(alias) === normalizeComparable(state.capital)) {
    candidates.push({ name: state.capital, state: state.name, kind: "capital", score: 0.98, matchedBy: "alias" });
  }
  for (const lga of state.lgas) {
    if (key === normalizeComparable(lga)) {
      candidates.push({ name: lga, state: state.name, kind: "lga", score: 0.99, matchedBy: "exact" });
    }
  }
  return candidates;
}

export function resolveLocality(value: string, stateName?: string): LocalityResolution {
  const input = value.trim();
  if (!input) return { status: "not-found", input, candidates: [] };
  const states = stateName
    ? [stateByName.get(normalizeComparable(stateName))].filter((state): state is StateRecord => Boolean(state))
    : [...STATES_V8];
  const candidates = states.flatMap((state) => candidateForState(input, state));
  const deduped = [...new Map(candidates.map((candidate) => [`${candidate.state}|${candidate.kind}|${candidate.name}`, candidate])).values()]
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  if (deduped.length === 0) return { status: "not-found", input, candidates: [] };
  if (deduped.length > 1) return { status: "ambiguous", input, candidates: deduped };
  return { status: "unique", input, candidates: deduped };
}

function titleCaseLocality(value: string): string {
  return value.trim().toLowerCase().replace(/(^|[\s\-/])([a-z])/g, (_, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`);
}

export function normalizeLocality(value: string): string {
  const key = normalizeComparable(value);
  const alias = CITY_ALIASES[key];
  if (alias) return alias;
  const direct = STATES_V8.flatMap((state) => [state.capital, ...state.lgas]).find((name) => normalizeComparable(name) === key);
  return direct ?? titleCaseLocality(value);
}
