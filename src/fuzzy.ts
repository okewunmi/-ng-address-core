import type { NgAddress, FuzzyMatch, AddressComparison } from "./types.js";
import { normalizeComparable, tokenize } from "./normalize.js";
import { compareAddresses } from "./compare.js";
import { parseAddress } from "./parse.js";

function levenshtein(a:string,b:string):number {
  const prev=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
    let left=i, diag=i-1;
    for(let j=1;j<=b.length;j++){
      const up=prev[j]!, old=prev[j-1]!;
      const cost=a[i-1]===b[j-1]?0:1;
      prev[j]=Math.min(prev[j]!+1,left+1,diag+cost);
      diag=up; left=prev[j]!;
    }
  }
  return prev[b.length]!;
}
function stringSimilarity(a:string,b:string):number {
  const x=normalizeComparable(a),y=normalizeComparable(b);
  if(!x||!y)return 0;if(x===y)return 1;
  const distance=levenshtein(x,y); return Number(Math.max(0,1-distance/Math.max(x.length,y.length)).toFixed(4));
}
export function fuzzyTextSimilarity(a:string,b:string):number {
  const A=new Set(tokenize(a)),B=new Set(tokenize(b));
  if(!A.size||!B.size)return stringSimilarity(a,b);
  const overlap=[...A].reduce((s,t)=>s+Math.max(...[...B].map(u=>stringSimilarity(t,u))),0)/Math.max(A.size,B.size);
  return Number(Math.max(overlap,stringSimilarity(a,b)).toFixed(4));
}
export function compareAddressStrings(a:string,b:string):AddressComparison {
  const left=parseAddress(a).address;
  const right=parseAddress(b).address;
  return compareAddresses(left,right);
}
export function rankAddressCandidates(input:string,candidates:string[],limit=5):FuzzyMatch[] {
  return candidates.map(candidate=>({candidate,score:fuzzyTextSimilarity(input,candidate)})).sort((a,b)=>b.score-a.score).slice(0,Math.max(1,limit));
}
