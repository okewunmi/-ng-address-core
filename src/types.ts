export type AddressType =
  | "formal" | "landmark" | "compound" | "estate" | "market"
  | "campus" | "rural" | "business" | "po-box" | "unknown";
export type LandmarkRelation =
  | "opposite" | "behind" | "beside" | "near" | "after" | "before"
  | "along" | "off" | "inside" | "within" | "by" | "alongside" | "close-to";
export interface AdministrativeUnit { name: string; code?: string; }
export interface Landmark { value: string; relation?: LandmarkRelation; type?: string; }
export interface Coordinates { latitude: number; longitude: number; }
export interface NgAddress {
  country: "NG"; state?: AdministrativeUnit; lga?: AdministrativeUnit; locality?: string;
  district?: string; area?: string; street?: string; houseNumber?: string; unit?: string;
  landmark?: Landmark; landmarks?: Landmark[]; postcode?: string; digitalPostcode?: string;
  coordinates?: Coordinates; raw: string; normalized: string; confidence: number; type: AddressType; warnings: string[];
}
export interface ParseOptions { strict?: boolean; validateAdministrativeUnits?: boolean; }
export interface AddressParseResult { address: NgAddress; tokens: string[]; }
export interface AddressComparisonEvidence { field: string; score: number; weight: number; reason: string; }
export interface AddressComparison { sameEntity: boolean; confidence: number; evidence: AddressComparisonEvidence[]; contradictions: string[]; }
export interface AddressScore { score: number; confidence: number; completeness: number; signals: Record<string, number>; warnings: string[]; }
export interface AdministrativeValidation { state?: { valid: boolean; canonical?: string }; lga?: { valid: boolean; canonical?: string; state?: string }; warnings: string[]; }
export interface AddressQuality { score: number; grade: "A"|"B"|"C"|"D"|"E"; signals: Record<string, number>; warnings: string[]; }

export interface FuzzyMatch { candidate: string; score: number; }
