import { NIGERIAN_STATES, STATE_ALIASES, LANDMARK_RELATIONS } from "./data.js";
import { STATES_V8 } from "./catalog.js";
import { classifyAddress } from "./classify.js";
import { extractPostcodes } from "./postcode.js";
import { normalizeComparable, normalizeState, normalizeStreet, normalizeText, tokenize } from "./normalize.js";
import { validateAdministrativeUnits } from "./administrative.js";
import { normalizeLocality, resolveLocality } from "./locality.js";
import { findLga } from "./lga-data.js";
import type { AddressParseResult, Landmark, NgAddress, ParseOptions, LandmarkRelation } from "./types.js";

const stateNames = NIGERIAN_STATES.map(([name]) => name).sort((a,b)=>b.length-a.length);
const relationAlternation = LANDMARK_RELATIONS.map(escapeRegExp).sort((a,b)=>b.length-a.length).join("|");
const relationPattern = new RegExp(`^\\s*(${relationAlternation})\\b`, "i");
const inlineRelationPattern = new RegExp(`\\b(${relationAlternation})\\b\\s+([^,\\n]+)`, "i");
const housePattern = /^(?:house|no|number|plot)\s*[:#-]?\s*([0-9]+[A-Za-z]?(?:\/[0-9]+)?)(?:\s*,?\s*(.*))?$/i;
const leadingHousePattern = /^([0-9]+[A-Za-z]?(?:\/[0-9]+)?)[,\s]+(.+)$/;
const unitPattern = /^(flat|shop|unit|block|building)\s*[:#-]?\s*([0-9A-Za-z]+(?:\/[0-9]+)?)(?:\s*,?\s*(.*))?$/i;
const CAPITAL_TO_STATE = new Map(STATES_V8.map(state => [normalizeComparable(state.capital), state.name]));

function escapeRegExp(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function canonicalPart(value: string): string { return normalizeComparable(value).replace(/\s+state$/, "").trim(); }
function findStateInPart(part: string): string | undefined {
  const normalized = canonicalPart(part);
  for (const name of stateNames) if (normalized === canonicalPart(name)) return name;
  for (const [alias,name] of Object.entries(STATE_ALIASES)) if (normalized === canonicalPart(alias)) return name;
  return undefined;
}
function findState(parts: string[]): { name: string; index: number } | undefined {
  for (let i=parts.length-1;i>=0;i--) { const name=findStateInPart(parts[i]!); if(name) return {name:normalizeState(name)!,index:i}; }
  return undefined;
}
function findStateInFreeText(raw: string): { name: string; textWithoutState: string } | undefined {
  const normalized = raw.normalize("NFKC");
  for (const name of stateNames) {
    const re = new RegExp(`(?:^|[\\s,])(${escapeRegExp(name)})(?:\\s+State)?(?:$|[\\s,])`, "iu");
    const match = normalized.match(re);
    if (match?.index !== undefined) return {name, textWithoutState: `${normalized.slice(0,match.index)} ${normalized.slice(match.index + match[0].length)}`.replace(/\s{2,}/g," ").trim()};
  }
  return undefined;
}
function titleCase(value: string): string {
  return normalizeText(value).toLowerCase().replace(/(^|[\s\-/])([a-z])/g, (_, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`);
}
function normalizeCity(value: string): string { return normalizeLocality(value); }
function extractLandmarks(raw: string): Landmark[] {
  const results: Landmark[]=[];
  const re=new RegExp(`(?:^|[,\\n])\\s*(?:[A-Za-z0-9]+\\s+)?(${relationAlternation})\\b\\s+([^,\\n]+)` ,"gi");
  for(const m of raw.matchAll(re)) {
    const rawRelation=(m[1]??"").toLowerCase();
    const relation=(rawRelation === "close to" ? "close-to" : rawRelation) as LandmarkRelation;
    const value=normalizeText(m[2]??"").replace(/\.$/,"");
    if(value) results.push({relation,value});
  }
  return results;
}
function extractInlineLandmark(segment: string): (Landmark & { index: number }) | undefined {
  const match = segment.match(inlineRelationPattern);
  if (!match || match.index === undefined) return undefined;
  const rawRelation=(match[1]??"").toLowerCase();
  const relation=(rawRelation === "close to" ? "close-to" : rawRelation) as LandmarkRelation;
  const value=normalizeText(match[2]??"").replace(/\.$/,"");
  return value && relation ? {relation,value,index:match.index} : undefined;
}
function extractHouseAndStreet(segment: string): {houseNumber?:string;street?:string;unit?:string;landmark?:Landmark} {
  const value=segment.trim().replace(/^[,\s]+|[,\s]+$/g,"");
  const po=value.match(/^(p\.?\s*o\.?\s*box|post\s*office\s*box)\s*([0-9]+)?/i);
  if(po) return {unit:normalizeText(value)};
  const inlineLandmark=extractInlineLandmark(value);
  const normalizedInlineLandmark: Landmark | undefined = inlineLandmark && inlineLandmark.relation ? { relation: inlineLandmark.relation, value: inlineLandmark.value } : undefined;
  const valueWithoutLandmark=inlineLandmark ? value.slice(0, inlineLandmark.index).trim().replace(/\s+(behind|opposite|beside|near|after|before|along|off|inside|within|alongside|by|close to)\s*$/i,"").trim() : value;
  const named=valueWithoutLandmark.match(housePattern);
  if(named?.[1]) return {houseNumber:named[1],...(named[2]?.trim()?{street:normalizeStreet(named[2])}:{}),...(normalizedInlineLandmark?{landmark:normalizedInlineLandmark}:{} )};
  const unit=valueWithoutLandmark.match(unitPattern);
  if(unit?.[1]) {
    const prefix = valueWithoutLandmark.match(/^(?:(?:flat|shop|unit|block|building)\s*[:#-]?\s*[0-9A-Za-z]+(?:\/\d+)?(?:\s+|$))+/i)?.[0]?.trim();
    const unitValue = prefix ?? `${unit[1]} ${unit[2]}`;
    const trailing = valueWithoutLandmark.slice(unitValue.length).trim();
    return {unit:normalizeText(unitValue),...(trailing?{street:normalizeStreet(trailing)}:{}),...(normalizedInlineLandmark?{landmark:normalizedInlineLandmark}:{} )};
  }
  const leading=valueWithoutLandmark.match(leadingHousePattern);
  if(leading?.[1]&&leading[2]) return {houseNumber:leading[1],street:normalizeStreet(leading[2]),...(normalizedInlineLandmark?{landmark:normalizedInlineLandmark}:{} )};
  if(/^\d+[A-Za-z]?(?:\/\d+)?$/.test(valueWithoutLandmark)) return {houseNumber:valueWithoutLandmark,...(normalizedInlineLandmark?{landmark:normalizedInlineLandmark}:{} )};
  if(relationPattern.test(valueWithoutLandmark)) return normalizedInlineLandmark ? {landmark:normalizedInlineLandmark} : {};
  return {street:normalizeStreet(valueWithoutLandmark),...(normalizedInlineLandmark?{landmark:normalizedInlineLandmark}:{} )};
}
function stripPostcodes(raw:string):string {
  return raw.replace(/\b\d{6}\b/g,"").replace(/\b[A-Za-z]{2}(?:[-\s]?\d{2})[-\s]?[A-Za-z0-9]{3}[-\s]?[A-Za-z]{2}[-\s]?\d{2}\b/g,"").replace(/\bNigeria\b/gi,"").replace(/\s{2,}/g," ").trim();
}
function inferCapital(parts: string[]): { locality?: string; state?: string; index?: number; source?: string } {
  for (let i = parts.length - 1; i >= 0; i--) {
    const value = parts[i]!;
    const resolved = resolveLocality(value);
    const capital = resolved.candidates.find((candidate) => candidate.kind === "capital");
    if (capital) return { locality: capital.name, state: capital.state, index: i, source: capital.matchedBy };
    const comparable = normalizeComparable(value);
    for (const state of STATES_V8) {
      const capitalKey = normalizeComparable(state.capital);
      if (comparable.includes(capitalKey) && capitalKey.length >= 4) {
        return { locality: state.capital, state: state.name, index: i, source: "embedded" };
      }
    }
  }
  return {};
}
function cleanPart(value: string): string { return normalizeText(value).replace(/^[-–—\s]+|[-–—\s]+$/g,"").trim(); }

export function parseAddress(raw:string, options:ParseOptions={}):AddressParseResult {
  if(typeof raw!=="string"||!raw.trim()) throw new TypeError("Address must be a non-empty string.");
  const original=raw.trim(); const {legacy,digital}=extractPostcodes(original); const stripped=stripPostcodes(original);
  let parts=stripped.split(/\s*[,\n]\s*/).map(cleanPart).filter(Boolean);
  let stateMatch=findState(parts);
  let freeTextState=findStateInFreeText(stripped);
  if(!stateMatch && freeTextState) {
    const rebuilt=freeTextState.textWithoutState.split(/\s*[,\n]\s*/).map(cleanPart).filter(Boolean);
    parts=rebuilt;
  }
  const capitalHint=inferCapital(parts);
  const state=stateMatch?{name:stateMatch.name}:freeTextState?{name:freeTextState.name}:capitalHint.state?{name:capitalHint.state}:undefined;
  const effectiveStateIndex=stateMatch?.index;
  const contentParts=effectiveStateIndex!==undefined ? parts.filter((_,i)=>i!==effectiveStateIndex) : parts;
  const landmarks=[...extractLandmarks(original)];
  let houseNumber:string|undefined,street:string|undefined,unit:string|undefined,locality:string|undefined,district:string|undefined,area:string|undefined,lga:{name:string}|undefined;
  if(contentParts.length){
    const first=extractHouseAndStreet(contentParts[0]!); houseNumber=first.houseNumber;street=first.street;unit=first.unit;if(first.landmark&&!landmarks.some(x=>x.relation===first.landmark!.relation&&x.value===first.landmark!.value)) landmarks.unshift(first.landmark);
    let remaining=contentParts.slice(1);
    if (unit && /^(flat|block|shop|unit|building)\b/i.test(contentParts[0]!)) {
      const units=[contentParts[0]!];
      while (remaining.length && /^(flat|block|shop|unit|building)\b/i.test(remaining[0]!)) units.push(remaining.shift()!);
      unit=normalizeText(units.join(", "));
    }
    if(!houseNumber&&!street&&!unit&&capitalHint.index===0) remaining=contentParts.slice(1);
    const labeledLga=contentParts.find(x=>/\bLGA\b/i.test(x));
    if(labeledLga){const candidate=labeledLga.replace(/\s*\bLGA\b[:\s-]*$/i,"").trim();if(candidate)lga={name:candidate};}
    const explicitArea=contentParts.find(x=>/\b(district|sector|area)\b/i.test(x));
    if(explicitArea) area=explicitArea.replace(/^.*?\b(district|sector|area)\b[:\s-]*/i," ").trim();
    const localityCandidates=remaining.filter(x=>x !== labeledLga && !/\bLGA\b/i.test(x)&&!/^\s*(district|sector|area)\b/i.test(x)&&!relationPattern.test(x));
    if(capitalHint.locality && contentParts.some(x=>normalizeComparable(normalizeCity(x))===normalizeComparable(capitalHint.locality))) {
      locality=capitalHint.locality;
      const cityIndex=contentParts.findIndex(x=>normalizeComparable(normalizeCity(x))===normalizeComparable(capitalHint.locality));
      const beforeCity=contentParts.slice(Math.max(0,cityIndex-(street?1:0)),cityIndex);
      const candidate=beforeCity.at(-1);
      const candidateStreet = candidate ? extractHouseAndStreet(candidate).street : undefined;
      if(candidate&&normalizeComparable(candidateStreet)!==normalizeComparable(street)&&!/\bLGA\b/i.test(candidate)&&!explicitArea) district=cleanPart(candidate);
    } else if(localityCandidates.length) {
      locality=normalizeCity(localityCandidates.at(-1)!);
      if(localityCandidates.length>1 && !street && !unit) district=normalizeText(localityCandidates.at(-2)!);
    }
    if(!locality && remaining.length) {
      const fallback=remaining.find(x=>x !== labeledLga && !/\bLGA\b/i.test(x));
      if(fallback) locality=normalizeCity(fallback);
    }
    if(!street && remaining.length) {
      const streetCandidate=remaining.find(x=>!relationPattern.test(x)&&!x.includes("LGA")&&!/^(district|sector|area)\b/i.test(x));
      if(streetCandidate && normalizeComparable(streetCandidate)!==normalizeComparable(locality)) street=normalizeStreet(streetCandidate);
    }
  }
  // Handle unpunctuated addresses such as "14 Bodija Road Ibadan Oyo State".
  if(contentParts.length===1 && capitalHint.locality) {
    const city=capitalHint.locality;
    if(city) {
      locality=city;
      const source=contentParts[0]!;
      const cityRe=new RegExp(`\\b${escapeRegExp(city)}\\b`,"i");
      const match=source.match(cityRe);
      const beforeCity=match?.index !== undefined ? source.slice(0,match.index).trim() : source;
      const first=extractHouseAndStreet(beforeCity);
      houseNumber=first.houseNumber??houseNumber; street=first.street??street; unit=first.unit??unit;
      if (first.unit && first.street && /\b(estate|compound|phase|oluyole)\b/i.test(first.street)) { district=normalizeText(first.street); street=undefined; }
      if(first.landmark && !landmarks.some(x=>x.relation===first.landmark!.relation&&x.value===first.landmark!.value)) landmarks.unshift(first.landmark);
    }
  }
  // A comma-separated city-only input such as "Ìbàdàn, Ọyọ" is not a street address.
  if(!houseNumber && !unit && contentParts.length > 0) {
    const firstCanonical=normalizeComparable(normalizeCity(contentParts[0]!));
    if(capitalHint.locality && firstCanonical === normalizeComparable(capitalHint.locality)) street=undefined;
  }
  if(!state && capitalHint.state) { /* already represented by capital hint */ }
  if (locality) locality = normalizeLocality(locality);
  if(!lga && state && locality) { const inferred=findLga(locality,state.name); if(inferred) lga={name:inferred.name}; }
  const address:NgAddress={country:"NG",...(state?{state}:{}),...(lga?{lga}:{}),...(locality?{locality:normalizeText(locality)}:{}),...(district?{district:normalizeText(district)}:{}),...(area?{area:normalizeText(area)}:{}),...(street?{street:normalizeStreet(street)}:{}),...(houseNumber?{houseNumber}:{}),...(unit?{unit}:{}),...(landmarks[0]?{landmark:landmarks[0]}:{}),...(landmarks.length?{landmarks}:{}),...(legacy?{postcode:legacy}:{}),...(digital?{digitalPostcode:digital}:{}),raw:original,normalized:normalizeText([houseNumber,street,district,locality,state?.name].filter(Boolean).join(", ")),confidence:0,type:"unknown",warnings:[]};
  if(options.strict&&!address.houseNumber&&!address.state&&!address.locality&&!address.landmark&&!address.postcode&&!address.digitalPostcode) throw new Error("Address does not contain enough recognizable Nigerian address structure.");
  if(options.validateAdministrativeUnits){const validation=validateAdministrativeUnits({...address.state?.name ? {state: address.state.name} : {}, ...address.lga?.name ? {lga: address.lga.name} : {}});address.warnings.push(...validation.warnings);if(validation.lga?.valid===false&&address.lga) address.warnings.push("LGA was not found in the bundled administrative registry.");}
  address.type=classifyAddress(address);
  let confidence = 0.25;
  if (address.houseNumber && address.street && address.locality && address.state) confidence = 0.94;
  else if (address.street && address.locality && address.state) confidence = 0.86;
  else if (address.houseNumber && address.street && address.state) confidence = 0.80;
  else if (address.landmark && address.locality && address.state) confidence = 0.80;
  else if (address.locality && address.state) confidence = 0.72;
  else if (address.houseNumber && address.street) confidence = 0.62;
  else if (address.state) confidence = 0.48;
  if (address.lga) confidence += 0.03;
  if (address.postcode || address.digitalPostcode) confidence += 0.02;
  if (address.warnings.length) confidence -= Math.min(0.16, address.warnings.length * 0.05);
  address.confidence = Math.min(0.99, Math.max(0.1, Number(confidence.toFixed(2))));
  if(!state) address.warnings.push("State was not confidently detected."); if(!address.locality) address.warnings.push("Locality/city was not confidently detected.");
  if(address.digitalPostcode&&!state) address.warnings.push("Digital postcode format is valid, but existence and location were not verified.");
  return {address,tokens:tokenize(original)};
}
