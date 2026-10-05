import { NIGERIAN_STATES, STATE_ALIASES } from "./data.js";
import { normalizeComparable } from "./normalize.js";
import { findLga } from "./lga-data.js";
import type { AdministrativeValidation } from "./types.js";
const stateNames = new Map(NIGERIAN_STATES.map(([name]) => [normalizeComparable(name), name]));
const stateAliases = new Map(Object.entries(STATE_ALIASES).map(([k,v]) => [normalizeComparable(k),v]));
export function canonicalState(value:string|undefined):string|undefined { if(!value)return undefined;const key=normalizeComparable(value);return stateAliases.get(key)??stateNames.get(key); }
export function validateAdministrativeUnits(input:{state?:string;lga?:string}):AdministrativeValidation{
 const warnings:string[]=[]; const state=input.state?canonicalState(input.state):undefined;
 if(input.state&&!state)warnings.push(`Unknown Nigerian state: ${input.state}`);
 let lgaValid:boolean|undefined;let lgaCanonical:string|undefined;
 if(input.lga){const found=findLga(input.lga,state);lgaValid=Boolean(found);lgaCanonical=found?.name;if(!found)warnings.push(`LGA not found in the bundled v0.8 administrative catalog: ${input.lga}`);}
 return {...(input.state?{state:{valid:Boolean(state),...(state?{canonical:state}:{})}}:{}),...(input.lga?{lga:{valid:Boolean(lgaValid),...(lgaCanonical?{canonical:lgaCanonical}:{}),...(state?{state}: {})}}:{}),warnings};
}
