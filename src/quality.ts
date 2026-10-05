import type { NgAddress, AddressQuality } from "./types.js";
import { normalizeComparable } from "./normalize.js";

export function addressFingerprint(address: NgAddress): string {
  const parts = [
    address.houseNumber,
    address.street,
    address.area,
    address.district,
    address.locality,
    address.lga?.name,
    address.state?.name,
    address.digitalPostcode ?? address.postcode,
  ].map(normalizeComparable).filter(Boolean);
  return parts.join("|");
}

export function qualityAddress(address: NgAddress): AddressQuality {
  const signals: Record<string, number> = {
    country: address.country === "NG" ? 1 : 0,
    state: address.state ? 1 : 0,
    lga: address.lga ? 1 : 0,
    locality: address.locality ? 1 : 0,
    street: address.street ? 1 : 0,
    houseNumber: address.houseNumber ? 1 : 0,
    unit: address.unit ? 1 : 0,
    districtOrArea: address.district || address.area ? 1 : 0,
    postcode: address.postcode || address.digitalPostcode ? 1 : 0,
    landmark: address.landmark ? 1 : 0,
  };
  const signal = (key: string): number => signals[key] ?? 0;
  const weighted = signal("state") * .15 + signal("locality") * .15 + signal("street") * .2 + signal("houseNumber") * .15 + signal("lga") * .1 + signal("postcode") * .1 + signal("districtOrArea") * .05 + signal("unit") * .03 + signal("landmark") * .05 + signal("country") * .02;
  const score = Number(Math.min(1, weighted).toFixed(4));
  const grade = score >= .9 ? "A" : score >= .75 ? "B" : score >= .55 ? "C" : score >= .35 ? "D" : "E";
  const warnings = [...address.warnings];
  if (!address.street) warnings.push("Street is missing.");
  if (!address.locality) warnings.push("Locality/city is missing.");
  if (!address.state) warnings.push("State is missing.");
  return { score, grade, signals, warnings };
}
