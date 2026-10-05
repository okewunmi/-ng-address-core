import type { AddressComparison, AddressComparisonEvidence, NgAddress } from "./types.js";
import { normalizeComparable, tokenize } from "./normalize.js";
function similarity(a?:string,b?:string):number{const x=normalizeComparable(a),y=normalizeComparable(b);if(!x||!y)return 0;if(x===y)return 1;const A=new Set(tokenize(x)),B=new Set(tokenize(y));const i=[...A].filter(v=>B.has(v)).length;const u=new Set([...A,...B]).size;return u?i/u:0;}
export function compareAddresses(a:NgAddress,b:NgAddress):AddressComparison{
  const evidence:AddressComparisonEvidence[]=[];const contradictions:string[]=[];
  const fields:Array<[string,string|undefined,string|undefined,number]>=[
    ["houseNumber",a.houseNumber,b.houseNumber,.25],["street",a.street,b.street,.25],["locality",a.locality,b.locality,.15],
    ["lga",a.lga?.name,b.lga?.name,.1],["state",a.state?.name,b.state?.name,.15],["postcode",a.postcode??a.digitalPostcode,b.postcode??b.digitalPostcode,.1]
  ];
  let total=0,score=0;
  for(const [field,av,bv,weight] of fields){if(!av||!bv)continue;total+=weight;const s=similarity(av,bv);score+=s*weight;const reason=s===1?"Exact normalized match.":s>0?"Partial token similarity.":"No normalized similarity.";evidence.push({field,score:s,weight,reason});if(s===0)contradictions.push(`${field} differs.`);}
  const confidence=total?Math.min(.999,score/total):0;
  const hardHouse=a.houseNumber&&b.houseNumber&&normalizeComparable(a.houseNumber)!==normalizeComparable(b.houseNumber);
  const hardState=a.state?.name&&b.state?.name&&normalizeComparable(a.state.name)!==normalizeComparable(b.state.name);
  const sameEntity=!hardHouse&&!hardState&&confidence>=.78;
  return {sameEntity,confidence:Number(confidence.toFixed(4)),evidence,contradictions};
}
