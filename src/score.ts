import type { NgAddress, AddressScore } from "./types.js";

export function scoreAddress(address: NgAddress): AddressScore {
  const signals: Record<string, number> = {
    houseNumber: address.houseNumber ? 0.15 : 0,
    street: address.street ? 0.2 : 0,
    locality: address.locality ? 0.15 : 0,
    state: address.state ? 0.15 : 0,
    postcode: address.postcode || address.digitalPostcode ? 0.1 : 0,
    landmark: address.landmark || address.landmarks?.length ? 0.1 : 0,
    lga: address.lga ? 0.1 : 0,
    districtOrArea: address.district || address.area ? 0.05 : 0
  };
  const completeness = Object.values(signals).reduce((a, b) => a + b, 0);
  const warnings = [...address.warnings];
  if (!address.street && !address.landmark) warnings.push("No street or landmark was confidently detected.");
  if (!address.locality && !address.lga) warnings.push("No locality or LGA was confidently detected.");
  return {
    score: Math.round(completeness * 100),
    confidence: Math.min(0.99, Math.max(0.05, completeness)),
    completeness,
    signals,
    warnings: [...new Set(warnings)]
  };
}
