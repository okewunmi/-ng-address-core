/** Backward-compatible LGA helpers. The national registry is now supplied by the v0.8 catalog. */
import { LGAS_V8, findLgasV8, getLgasV8 } from "./catalog.js";
export interface LgaRecord { name: string; state: string; code?: string; aliases?: string[]; }
export const LGA_COUNTS: Readonly<Record<string, number>> = Object.fromEntries(
  getLgasV8().reduce((acc, item) => { acc.set(item.state, (acc.get(item.state) ?? 0) + 1); return acc; }, new Map<string, number>())
);
export const CANONICAL_LGA_FIXTURES: readonly LgaRecord[] = LGAS_V8.map(x => ({ name: x.name, state: x.state, aliases: [...x.aliases] }));
export function getLgas(state: string): LgaRecord[] { return getLgasV8(state).map(x => ({ name:x.name, state:x.state, aliases:[...x.aliases] })); }
export function findLga(name: string, state?: string): LgaRecord | undefined {
  const matches = findLgasV8(name, state);
  return matches.length === 1 ? { name: matches[0]!.name, state: matches[0]!.state, aliases:[...matches[0]!.aliases] } : undefined;
}
