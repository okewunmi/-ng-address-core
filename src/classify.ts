import type { AddressType, NgAddress } from "./types.js";

const patterns: Array<[AddressType, RegExp]> = [
  ["po-box", /\b(p\.?\s*o\.?\s*box|post\s*office\s*box)\b/i],
  ["landmark", /\b(opposite|behind|beside|near|after|before|along|off|inside|within|close to|by|alongside|junction|bus stop|roundabout|landmark)\b/i],
  ["market", /\b(market|central market|main market)\b/i],
  ["campus", /\b(university|polytechnic|college|campus|school|faculty|teaching hospital)\b/i],
  ["estate", /\b(estate|phase|gated community)\b/i],
  ["compound", /\b(compound|quarters|barracks)\b/i],
  ["business", /\b(ltd|limited|plc|company|shop|store|mall|office|hotel|hospital|bank|filling station)\b/i]
];

export function classifyAddress(address: Pick<NgAddress, "raw" | "landmark" | "landmarks">): AddressType {
  for (const [type, pattern] of patterns) {
    if (pattern.test(address.raw)) return type;
  }
  return "formal";
}
