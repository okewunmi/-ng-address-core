import type { AddressQuality, AddressScore, NgAddress } from "./types.js";
import { parseAddress } from "./parse.js";
import { qualityAddress } from "./quality.js";
import { scoreAddress } from "./score.js";
import { validateAddress, addressId } from "./production.js";
import { resolveAdministrative, type AdministrativeResolution } from "./resolution.js";
import { normalizeComparable } from "./normalize.js";

export const NG_ADDRESS_CORE_VERSION = "0.11.0" as const;

export type AddressResolutionStatus = "resolved" | "partial" | "ambiguous" | "conflict" | "not-found";

export interface AddressResolutionEvidence {
  source: "parser" | "administrative" | "quality" | "structure";
  field: string;
  confidence: number;
  reason: string;
}

export interface AddressResolution {
  status: AddressResolutionStatus;
  address: NgAddress;
  administrative: AdministrativeResolution;
  quality: AddressQuality;
  score: AddressScore;
  structuralValidation: ReturnType<typeof validateAddress>;
  fingerprint: string;
  confidence: number;
  verified: false;
  evidence: readonly AddressResolutionEvidence[];
  warnings: readonly string[];
}

export interface ResolveAddressOptions {
  strict?: boolean;
  minAdministrativeScore?: number;
  limit?: number;
}

export interface BatchAddressResolution {
  index: number;
  input: string;
  result?: AddressResolution;
  error?: string;
}

export type ResolveAddressesOptions = ResolveAddressOptions;

function round(value: number): number {
  return Number(value.toFixed(4));
}

function mergeAdministrative(address: NgAddress, administrative: AdministrativeResolution): NgAddress {
  if (administrative.status === "conflict" || administrative.status === "ambiguous") return address;
  return {
    ...address,
    ...(administrative.state ? { state: { name: administrative.state.name, ...(administrative.state.stateCode ? { code: administrative.state.stateCode } : {}) } } : {}),
    ...(administrative.lga ? { lga: { name: administrative.lga.name } } : {}),
  };
}

/**
 * Resolve a Nigerian address through the complete deterministic core pipeline.
 * This function never claims that an address exists or is NIPOST-verified.
 */
export function resolveAddress(input: string, options: ResolveAddressOptions = {}): AddressResolution {
  const parsed = parseAddress(input, options.strict === undefined ? {} : { strict: options.strict });
  const administrative = resolveAdministrative(input, {
    ...(options.limit === undefined ? {} : { limit: options.limit }),
    ...(options.minAdministrativeScore === undefined ? {} : { minScore: options.minAdministrativeScore }),
  });
  const address = mergeAdministrative(parsed.address, administrative);
  const quality = qualityAddress(address);
  const score = scoreAddress(address);
  const structuralValidation = validateAddress(address);

  const evidence: AddressResolutionEvidence[] = [
    { source: "parser", field: "address", confidence: round(parsed.address.confidence), reason: "Deterministic Nigerian address parser extracted the available fields." },
  ];
  if (administrative.state) evidence.push({ source: "administrative", field: "state", confidence: administrative.state.confidence, reason: administrative.state.evidence.map(x => x.reason).join(" ") });
  if (administrative.lga) evidence.push({ source: "administrative", field: "lga", confidence: administrative.lga.confidence, reason: administrative.lga.evidence.map(x => x.reason).join(" ") });
  evidence.push({ source: "quality", field: "quality", confidence: quality.score, reason: `Address completeness/quality grade ${quality.grade}.` });
  evidence.push({ source: "structure", field: "validation", confidence: structuralValidation.valid ? 1 : 0, reason: structuralValidation.valid ? "Structural checks passed." : structuralValidation.errors.join(" ") });

  const warnings = [...new Set([
    ...address.warnings,
    ...quality.warnings,
    ...structuralValidation.errors,
    ...administrative.conflicts,
    ...(administrative.status === "ambiguous" ? ["Administrative resolution is ambiguous; no competing entity was selected as authoritative."] : []),
    "Resolution is deterministic and non-authoritative; address existence and occupancy were not verified.",
  ])];

  let status: AddressResolutionStatus;
  if (administrative.status === "conflict") status = "conflict";
  else if (administrative.status === "ambiguous") status = "ambiguous";
  else if (administrative.status === "not-found") status = address.state || address.locality ? "partial" : "not-found";
  else if (administrative.state || administrative.lga) status = "resolved";
  else status = "partial";

  const adminConfidence = administrative.status === "resolved"
    ? Math.max(administrative.state?.confidence ?? 0, administrative.lga?.confidence ?? 0)
    : 0;
  const confidence = round(Math.min(1, parsed.address.confidence * 0.3 + adminConfidence * 0.4 + quality.score * 0.3));

  return {
    status,
    address,
    administrative,
    quality,
    score,
    structuralValidation,
    fingerprint: addressId(address),
    confidence,
    verified: false,
    evidence,
    warnings,
  };
}

/** Resolve many addresses while preserving input order and isolating individual failures. */
export function resolveAddresses(inputs: readonly string[], options: ResolveAddressesOptions = {}): BatchAddressResolution[] {
  const results: BatchAddressResolution[] = new Array(inputs.length);
  for (let index = 0; index < inputs.length; index++) {
    const input = inputs[index]!;
    try {
      results[index] = { index, input, result: resolveAddress(input, options) };
    } catch (error) {
      results[index] = { index, input, error: error instanceof Error ? error.message : String(error) };
    }
  }
  return results;
}

/** Stable comparable representation useful for cache keys without implying verification. */
export function resolutionKey(result: AddressResolution): string {
  return normalizeComparable([
    result.address.houseNumber,
    result.address.street,
    result.address.unit,
    result.address.locality,
    result.address.district,
    result.address.lga?.name,
    result.address.state?.name,
    result.address.digitalPostcode ?? result.address.postcode,
  ].filter(Boolean).join("|"));
}
