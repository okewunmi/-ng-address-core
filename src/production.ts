import type { NgAddress, ParseOptions, AddressParseResult } from "./types.js";
import { parseAddress } from "./parse.js";
import { addressFingerprint } from "./quality.js";
import { isDigitalPostcode } from "./postcode.js";

export interface BatchParseOptions extends ParseOptions {
  /** @deprecated Parsing is synchronous; this option has no effect and will be removed. */
  concurrency?: number;
}
export interface BatchParseResult { index: number; input: string; result?: AddressParseResult; error?: string; }
export interface AddressValidationResult { valid: boolean; errors: string[]; warnings: string[]; }

export function parseAddresses(inputs:string[], options:BatchParseOptions={}):BatchParseResult[] {
  const concurrency=Math.max(1,Math.floor(options.concurrency??32)); // chunking only; no parallelism
  const results:BatchParseResult[]=new Array(inputs.length);
  for(let start=0;start<inputs.length;start+=concurrency){
    const end=Math.min(inputs.length,start+concurrency);
    for(let i=start;i<end;i++){
      const input=inputs[i]!;
      try { results[i]={index:i,input,result:parseAddress(input,options)}; }
      catch(error){ results[i]={index:i,input,error:error instanceof Error?error.message:String(error)}; }
    }
  }
  return results;
}

export function validateAddress(address:NgAddress):AddressValidationResult {
  const errors:string[]=[]; const warnings=[...address.warnings];
  if(address.country!=="NG") errors.push("Country must be NG.");
  if(address.houseNumber && !/^\d+[A-Za-z]?(?:\/\d+)?$/.test(address.houseNumber)) warnings.push("House number has an unusual format.");
  if(address.digitalPostcode && !isDigitalPostcode(address.digitalPostcode)) errors.push("Digital postcode has an invalid format.");
  if(address.postcode && !/^\d{6}$/.test(address.postcode)) errors.push("Legacy postcode must contain six digits.");
  if(address.coordinates && (address.coordinates.latitude<-90||address.coordinates.latitude>90||address.coordinates.longitude<-180||address.coordinates.longitude>180)) errors.push("Coordinates are outside valid geographic bounds.");
  return {valid:errors.length===0,errors,warnings};
}

export interface RedactOptions { /** Also remove street and locality, keeping only state/LGA. */ coarse?: boolean; }

/**
 * Remove fields that identify a building or household: house number, unit, P.O. Box, premises,
 * landmarks, coordinates, the Digital Postcode (building-level) and the raw/normalized strings.
 * Street/locality/state are kept unless `coarse` is set.
 */
export function redactAddress(address:NgAddress, options:RedactOptions={}):NgAddress {
  const { coordinates:_c, digitalPostcode:_d, landmark:_l, landmarks:_ls, poBox:_p, premises:_pr, houseNumber:_h, unit:_u, ...safe } = address;
  const { street:_s, locality:_loc, district:_di, area:_a, ...coarseSafe } = safe;
  return { ...(options.coarse ? coarseSafe : safe), raw:"[REDACTED]", normalized:"[REDACTED]" };
}

function sortKeys(value:unknown):unknown{
  if(Array.isArray(value)) return value.map(sortKeys);
  if(value&&typeof value==="object") return Object.fromEntries(Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>[k,sortKeys(v)]));
  return value;
}
/** Deterministic JSON (sorted keys). */
export function serializeAddress(address:NgAddress):string { return JSON.stringify(sortKeys(address)); }

export function addressId(address:NgAddress):string {
  return addressFingerprint(address);
}
