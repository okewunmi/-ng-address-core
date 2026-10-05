import { normalizeDigitalPostcode, isDigitalPostcode } from "./postcode.js";
import type { NgAddress, Coordinates } from "./types.js";

export interface NipostClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}
export interface NipostResolveRequest { address?: string; postcode?: string; latitude?: number; longitude?: number; }
export interface NipostLookupRequest { code: string; level?: 1 | 2 | 3 | 4 | 5; }
export interface NipostResolveResult {
  provider: "nipost";
  status: "resolved" | "not_found" | "ambiguous";
  valid: boolean;
  verified: boolean;
  digitalPostcode?: string;
  address?: string;
  coordinates?: Coordinates;
  errorCode?: string;
  message?: string;
  raw: unknown;
}
export class NipostError extends Error {
  constructor(message: string, public readonly status?: number, public readonly code="NIPOST_REQUEST_FAILED", public readonly details?: unknown) { super(message); this.name="NipostError"; }
}
function asRecord(value:unknown):Record<string,unknown>{return value&&typeof value==="object"?value as Record<string,unknown>:{};}
function extractPostcode(data:Record<string,unknown>):string|undefined{
  const candidates=[data.postcode,data.digitalPostcode,data.digital_postcode,data.digital_postcode_code];
  for(const c of candidates)if(typeof c==="string"&&isDigitalPostcode(c))return normalizeDigitalPostcode(c);
  return undefined;
}
function errorCodeFrom(payload: unknown): string | undefined {
  const root=asRecord(payload); const error=asRecord(root.error);
  return typeof error.code === "string" ? error.code : typeof root.code === "string" ? root.code : undefined;
}
function messageFrom(payload: unknown): string | undefined {
  const root=asRecord(payload); const error=asRecord(root.error);
  return typeof error.message === "string" ? error.message : typeof root.message === "string" ? root.message : undefined;
}
export class NipostClient {
  private readonly fetchImpl: typeof fetch;
  private readonly baseUrl: string;
  constructor(private readonly options:NipostClientOptions){
    if(!options.apiKey)throw new TypeError("NIPOST apiKey is required.");
    this.baseUrl=options.baseUrl ?? "https://api.postcode.gov.ng";
    this.fetchImpl=options.fetchImpl??fetch;
  }
  async lookup(input:NipostLookupRequest):Promise<NipostResolveResult>{
    if(!isDigitalPostcode(input.code)) throw new TypeError("Invalid NIPOST digital postcode format.");
    const url=new URL("/v1/lookup",this.baseUrl);
    url.searchParams.set("code",normalizeDigitalPostcode(input.code).replaceAll(" ","-"));
    if(input.level!==undefined) url.searchParams.set("level",String(input.level));
    const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),this.options.timeoutMs??10000);
    try {
      const response=await this.fetchImpl(url,{method:"GET",headers:{Accept:"application/json","X-API-Key":this.options.apiKey},signal:controller.signal});
      const text=await response.text(); let payload:unknown; try{payload=text?JSON.parse(text):{};}catch{payload={raw:text};}
      if(!response.ok) throw new NipostError(messageFrom(payload) ?? `NIPOST request failed with HTTP ${response.status}`,response.status,errorCodeFrom(payload) ?? `NIPOST_HTTP_${response.status}`,payload);
      const root=asRecord(payload); const data=asRecord(root.data); const valid=data.valid === true;
      const postcode=extractPostcode(data); const statusValue=typeof data.status === "string" ? data.status : undefined;
      const status: NipostResolveResult["status"] = statusValue === "ambiguous" ? "ambiguous" : valid ? "resolved" : "not_found";
      const coords=asRecord(data.point_geometry); const coordinates=typeof coords.latitude === "number"&&typeof coords.longitude === "number" ? {latitude:coords.latitude,longitude:coords.longitude} : undefined;
      const errorCode=errorCodeFrom(payload); const message=messageFrom(payload);
      return {provider:"nipost",status,valid,verified:false,...(postcode?{digitalPostcode:postcode}:{}),...(typeof data.recent_house_address === "string"?{address:data.recent_house_address}:{}),...(coordinates?{coordinates}:{}),...(errorCode?{errorCode}:{}),...(message?{message}:{}),raw:payload};
    } catch(error){
      if(error instanceof NipostError) throw error;
      if(error instanceof DOMException&&error.name==="AbortError") throw new NipostError("NIPOST request timed out",undefined,"NIPOST_TIMEOUT");
      throw new NipostError(error instanceof Error?error.message:"NIPOST request failed");
    } finally { clearTimeout(timeout); }
  }
  /** Compatibility helper. v0.10 maps legacy resolve calls to the official lookup endpoint when a postcode is available. */
  async resolve(input:NipostResolveRequest):Promise<NipostResolveResult>{
    if(!input.postcode) throw new TypeError("NIPOST lookup requires a digital postcode. Use lookup({ code, level }) for the official API.");
    return this.lookup({code:input.postcode});
  }
}

/** Merge only provider facts actually returned as valid; never manufacture verification. */
export function mergeNipostResult(address: NgAddress, result: NipostResolveResult): NgAddress {
  const warnings=[...address.warnings];
  if(result.valid) {
    if(!warnings.some(w=>/nipost.*valid/i.test(w))) warnings.push("NIPOST confirmed digital postcode validity; address existence/details beyond the returned fields were not independently verified.");
  } else if(!warnings.some(w=>/nipost.*not valid/i.test(w))) warnings.push("NIPOST did not confirm the digital postcode as valid.");
  return {...address,...(result.digitalPostcode?{digitalPostcode:result.digitalPostcode}:{}),...(result.coordinates?{coordinates:result.coordinates}:{}),warnings};
}
