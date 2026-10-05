import type { LgaRecord } from "./lga-data.js";
export interface AdministrativeDataProvider {
  getLgas(state: string): readonly LgaRecord[] | Promise<readonly LgaRecord[]>;
  findLga(name: string, state?: string): LgaRecord | undefined | Promise<LgaRecord | undefined>;
}
