import type { NgAddress } from "./types.js";
import { parseAddress } from "./parse.js";
import { normalizeComparable } from "./normalize.js";
import { fuzzyTextSimilarity } from "./fuzzy.js";
import { getStateV8, getLgasV8, findLgasV8, type LgaRecordV8, type StateRecord } from "./catalog.js";

export type ResolutionInput = string | Pick<NgAddress, "state" | "lga" | "locality" | "district" | "raw">;
export interface ResolutionEvidence { field: "state" | "lga" | "locality" | "district" | "raw"; score: number; weight: number; reason: string; }
export interface AdministrativeCandidate { entity: "state" | "lga"; name: string; state?: string; stateCode?: string; score: number; confidence: number; evidence: readonly ResolutionEvidence[]; }
export interface AdministrativeResolution {
  status: "resolved" | "ambiguous" | "not-found" | "conflict";
  state?: AdministrativeCandidate;
  lga?: AdministrativeCandidate;
  alternatives: readonly AdministrativeCandidate[];
  conflicts: readonly string[];
  normalizedInput: string;
}

const round = (n: number) => Number(n.toFixed(4));

function stateCandidates(value: string): AdministrativeCandidate[] {
  const normalized = normalizeComparable(value);
  return (getStateV8(value) ? [getStateV8(value)!] : []).map((s: StateRecord) => ({
    entity: "state" as const, name: s.name, stateCode: s.code, score: 1, confidence: 1,
    evidence: [{ field: "state" as const, score: 1, weight: 1, reason: normalized === normalizeComparable(s.name) ? "Exact canonical state match." : "Exact state alias match." }]
  }));
}

function bestState(value: string): AdministrativeCandidate | undefined {
  const exact = stateCandidates(value)[0];
  if (exact) return exact;
  const states = getLgasV8() // intentionally use catalog as the single state/LGA universe
    .reduce((map, r) => { if (!map.has(r.state)) map.set(r.state, r.stateCode); return map; }, new Map<string, string>());
  let best: AdministrativeCandidate | undefined;
  for (const [name, code] of states) {
    const score = fuzzyTextSimilarity(value, name);
    if (!best || score > best.score) best = { entity: "state", name, stateCode: code, score, confidence: score, evidence: [{ field: "state", score, weight: 1, reason: "Fuzzy state-name similarity." }] };
  }
  return best && best.score >= 0.78 ? best : undefined;
}

function lgaCandidate(record: LgaRecordV8, values: Array<{field: ResolutionEvidence["field"]; value: string; weight: number}>): AdministrativeCandidate {
  let total = 0, weightTotal = 0;
  const evidence: ResolutionEvidence[] = [];
  for (const item of values) {
    const options = [record.name, ...record.aliases];
    const score = Math.max(...options.map(x => fuzzyTextSimilarity(item.value, x)));
    total += score * item.weight;
    weightTotal += item.weight;
    if (score >= 0.55) evidence.push({ field: item.field, score: round(score), weight: item.weight, reason: score === 1 ? "Exact canonical/alias match." : "Fuzzy canonical/alias similarity." });
  }
  const score = weightTotal ? total / weightTotal : 0;
  return { entity: "lga", name: record.name, state: record.state, stateCode: record.stateCode, score: round(score), confidence: round(score), evidence };
}

function extractInput(input: ResolutionInput): { address?: NgAddress; state?: string; lga?: string; locality?: string; district?: string; raw: string } {
  if (typeof input === "string") {
    const address = parseAddress(input).address;
    return { address, ...(address.state?.name ? { state: address.state.name } : {}), ...(address.lga?.name ? { lga: address.lga.name } : {}), ...(address.locality ? { locality: address.locality } : {}), ...(address.district ? { district: address.district } : {}), raw: address.raw };
  }
  return { ...(input.state?.name ? { state: input.state.name } : {}), ...(input.lga?.name ? { lga: input.lga.name } : {}), ...(input.locality ? { locality: input.locality } : {}), ...(input.district ? { district: input.district } : {}), raw: input.raw };
}

/** Resolve Nigerian administrative entities without claiming address existence. */
export function resolveAdministrative(input: ResolutionInput, options: { limit?: number; minScore?: number } = {}): AdministrativeResolution {
  const source = extractInput(input);
  const limit = Math.max(1, Math.min(20, options.limit ?? 5));
  const minScore = options.minScore ?? 0.68;
  const conflicts: string[] = [];

  const state = source.state ? bestState(source.state) : undefined;
  const exactLga = source.lga ? findLgasV8(source.lga, source.state) : [];
  const pool = state ? getLgasV8(state.name) : getLgasV8();
  const fields: Array<{field: ResolutionEvidence["field"]; value: string; weight: number}> = [];
  if (source.lga) fields.push({ field: "lga", value: source.lga, weight: 0.65 });
  if (source.locality) fields.push({ field: "locality", value: source.locality, weight: 0.25 });
  if (source.district) fields.push({ field: "district", value: source.district, weight: 0.1 });

  const lgaCandidates = fields.length ? pool.map(r => lgaCandidate(r, fields)).sort((a,b) => b.score - a.score) : [];
  const top = lgaCandidates[0];

  if (source.lga && exactLga.length === 0 && state) {
    const globallyExact = findLgasV8(source.lga);
    if (globallyExact.length && globallyExact.every(x => x.state !== state.name)) {
      conflicts.push(`LGA "${source.lga}" is not in ${state.name}; matching catalog record(s) belong to ${[...new Set(globallyExact.map(x => x.state))].join(", ")}.`);
    }
  }
  if (source.lga && top && state && top.state !== state.name) conflicts.push(`Resolved LGA candidate belongs to ${top.state}, not ${state.name}.`);

  const alternatives = lgaCandidates.filter(c => c.score >= minScore).slice(0, limit);
  const ambiguous = alternatives.length > 1 && Math.abs(alternatives[0]!.score - alternatives[1]!.score) < 0.08;
  const lga = exactLga.length === 1 ? {
    entity: "lga" as const, name: exactLga[0]!.name, state: exactLga[0]!.state, stateCode: exactLga[0]!.stateCode,
    score: 1, confidence: 1,
    evidence: [{ field: "lga" as const, score: 1, weight: 1, reason: "Exact canonical/alias match within the supplied state." }]
  } : top && top.score >= minScore ? top : undefined;

  const status: AdministrativeResolution["status"] = conflicts.length ? "conflict" : !state && !lga ? "not-found" : ambiguous ? "ambiguous" : lga || state ? "resolved" : "not-found";
  return { status, ...(state ? { state } : {}), ...(lga ? { lga } : {}), alternatives, conflicts, normalizedInput: normalizeComparable(source.raw) };
}

export function resolveState(value: string): AdministrativeResolution {
  const state = bestState(value);
  return state ? { status: "resolved", state, alternatives: [], conflicts: [], normalizedInput: normalizeComparable(value) } : { status: "not-found", alternatives: [], conflicts: [], normalizedInput: normalizeComparable(value) };
}
