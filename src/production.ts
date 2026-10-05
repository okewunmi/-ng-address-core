import type { NgAddress, ParseOptions, AddressParseResult } from "./types.js";
import { parseAddress } from "./parse.js";
import { addressFingerprint } from "./quality.js";

export interface BatchParseOptions extends ParseOptions { concurrency?: number; }
export interface BatchParseResult { index: number; input: string; result?: AddressParseResult; error?: string; }
export interface AddressValidationResult { valid: boolean; errors: string[]; warnings: string[]; }

export function parseAddresses(inputs:string[], options:BatchParseOptions={}):BatchParseResult[] {
  const concurrency=Math.max(1,Math.floor(options.concurrency??32));
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
  if(address.digitalPostcode && !/^[A-Z]{2}\d{2}[A-Z0-9]{3}[A-Z]{2}\d{2}$/.test(address.digitalPostcode)) errors.push("Digital postcode has an invalid format.");
  if(address.postcode && !/^\d{6}$/.test(address.postcode)) errors.push("Legacy postcode must contain six digits.");
  if(address.coordinates && (address.coordinates.latitude<-90||address.coordinates.latitude>90||address.coordinates.longitude<-180||address.coordinates.longitude>180)) errors.push("Coordinates are outside valid geographic bounds.");
  return {valid:errors.length===0,errors,warnings};
}

export function redactAddress(address:NgAddress):NgAddress {
  const { coordinates: _coordinates, ...safe } = address;
  return {
    ...safe,
    raw:"[REDACTED]",
    normalized:"[REDACTED]",
    ...(address.houseNumber ? {houseNumber:"[REDACTED]"} : {}),
    ...(address.unit ? {unit:"[REDACTED]"} : {}),
  };
}

export function serializeAddress(address:NgAddress):string {
  return JSON.stringify(address,(_key,value)=>value===undefined?undefined:value);
}

export function addressId(address:NgAddress):string {
  return addressFingerprint(address);
}
