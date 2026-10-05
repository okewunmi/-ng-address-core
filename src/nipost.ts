import { normalizeDigitalPostcode, isDigitalPostcode } from "./postcode.js";
import type { NgAddress, Coordinates } from "./types.js";

export interface NipostClientOptions {
  /** NIPOST API key (sent as `X-API-Key`). Required unless `allowAnonymous` is true. */
  apiKey?: string;
  /** Send requests without a key (the gateway decides what, if anything, is allowed). */
  allowAnonymous?: boolean;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  /** Extra attempts for network errors, HTTP 429 and 5xx. Default 0 (no retries). */
  retries?: number;
  /** Base delay for exponential backoff in ms. Default 300. */
  retryDelayMs?: number;
}
export interface NipostResolveRequest { address?: string; postcode?: string; latitude?: number; longitude?: number; }
export interface NipostLookupRequest { code: string; level?: 1 | 2 | 3 | 4 | 5; }
export interface NipostResolveResult {
  provider: "nipost";
  status: "resolved" | "not_found" | "ambiguous";
  valid: boolean;
  verified: boolean;
  digitalPostcode?: string;
  /** Present only when the provider returns a plain-string address. */
  address?: string;
  /** `recent_house_address` as returned by NIPOST (L2+), usually an object. */
  houseAddress?: Record<string, unknown>;
  /** `administrative_address` as returned by NIPOST (L2+). */
  administrativeAddress?: Record<string, unknown>;
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
function coordinatesFrom(value: unknown): Coordinates | undefined {
  const g = asRecord(value);
  const lat = g.latitude ?? g.lat, lng = g.longitude ?? g.lng ?? g.lon;
  if (typeof lat === "number" && typeof lng === "number") return { latitude: lat, longitude: lng };
  if (Array.isArray(g.coordinates) && typeof g.coordinates[0] === "number" && typeof g.coordinates[1] === "number") {
    return { latitude: g.coordinates[1] as number, longitude: g.coordinates[0] as number }; // GeoJSON [lng, lat]
  }
  return undefined;
}
const objectOrUndefined = (v: unknown): Record<string, unknown> | undefined => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : undefined;
const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
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
    if(!options.apiKey&&!options.allowAnonymous)throw new TypeError("NIPOST apiKey is required (or pass allowAnonymous: true).");
    this.baseUrl=(options.baseUrl ?? "https://api.postcode.gov.ng").replace(/\/+$/,"");
    this.fetchImpl=options.fetchImpl??fetch;
  }
  async lookup(input:NipostLookupRequest):Promise<NipostResolveResult>{
    if(!isDigitalPostcode(input.code)) throw new TypeError("Invalid NIPOST digital postcode format.");
    const url=new URL(`${this.baseUrl}/v1/lookup`);
    url.searchParams.set("code",normalizeDigitalPostcode(input.code).replaceAll(" ","-"));
    if(input.level!==undefined) url.searchParams.set("level",String(input.level));
    const maxAttempts=1+Math.max(0,Math.floor(this.options.retries??0));
    const headers:Record<string,string>={Accept:"application/json",...(this.options.apiKey?{"X-API-Key":this.options.apiKey}:{})};
    let lastError:unknown;
    for(let attempt=1;attempt<=maxAttempts;attempt++){
      const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),this.options.timeoutMs??10000);
      try {
        const response=await this.fetchImpl(url,{method:"GET",headers,signal:controller.signal});
        const text=await response.text(); let payload:unknown; try{payload=text?JSON.parse(text):{};}catch{payload={raw:text};}
        if(!response.ok){
          const error=new NipostError(messageFrom(payload) ?? `NIPOST request failed with HTTP ${response.status}`,response.status,errorCodeFrom(payload) ?? `NIPOST_HTTP_${response.status}`,payload);
          if((response.status===429||response.status>=500)&&attempt<maxAttempts){
            const retryAfter=Number(response.headers?.get?.("retry-after"));
            lastError=error; await sleep(Number.isFinite(retryAfter)&&retryAfter>0?retryAfter*1000:(this.options.retryDelayMs??300)*2**(attempt-1)); continue;
          }
          throw error;
        }
        const root=asRecord(payload); const data=asRecord(root.data); const valid=data.valid === true;
        const postcode=extractPostcode(data); const statusValue=typeof data.status === "string" ? data.status : undefined;
        const status: NipostResolveResult["status"] = statusValue === "ambiguous" ? "ambiguous" : valid ? "resolved" : "not_found";
        const coordinates=coordinatesFrom(data.point_geometry);
        const houseAddress=objectOrUndefined(data.recent_house_address); const administrativeAddress=objectOrUndefined(data.administrative_address);
        const errorCode=errorCodeFrom(payload); const message=messageFrom(payload);
        return {provider:"nipost",status,valid,verified:false,...(postcode?{digitalPostcode:postcode}:{}),...(typeof data.recent_house_address === "string"?{address:data.recent_house_address}:{}),...(houseAddress?{houseAddress}:{}),...(administrativeAddress?{administrativeAddress}:{}),...(coordinates?{coordinates}:{}),...(errorCode?{errorCode}:{}),...(message?{message}:{}),raw:payload};
      } catch(error){
        if(error instanceof NipostError) throw error;
        const wrapped = (error instanceof Error&&error.name==="AbortError") ? new NipostError("NIPOST request timed out",undefined,"NIPOST_TIMEOUT") : new NipostError(error instanceof Error?error.message:"NIPOST request failed");
        if(attempt<maxAttempts){ lastError=wrapped; await sleep((this.options.retryDelayMs??300)*2**(attempt-1)); continue; }
        throw wrapped;
      } finally { clearTimeout(timeout); }
    }
    throw lastError instanceof Error ? lastError : new NipostError("NIPOST request failed");
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
