export * from "./types.js";
export * from "./data.js";
export * from "./normalize.js";
export * from "./postcode.js";
export * from "./parse.js";
export * from "./classify.js";
export * from "./score.js";
export * from "./compare.js";
export * from "./quality.js";
export * from "./administrative.js";
export * from "./lga-data.js";
export * from "./data-provider.js";
export * from "./nipost.js";
import { parseAddress } from "./parse.js";
import { normalizeText } from "./normalize.js";
import { compareAddresses } from "./compare.js";
import { scoreAddress } from "./score.js";
export function normalizeAddress(raw:string){return parseAddress(raw).address;}
export function parseAndScoreAddress(raw:string){const address=parseAddress(raw).address;return {address,score:scoreAddress(address)};}
export {normalizeText,compareAddresses};
export * from "./fuzzy.js";
export * from "./production.js";
export * from "./catalog.js";
export * from "./resolution.js";

export * from "./address-resolution.js";
export * from "./locality.js";
