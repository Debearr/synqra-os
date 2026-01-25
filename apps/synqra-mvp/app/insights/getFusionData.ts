import { mockFusionData } from "./mockData";
import { adaptFusionList } from "./adapters";
import { AdaptedFusionEntry } from "./types";

export async function getFusionData(): Promise<AdaptedFusionEntry[]> {
    console.log("[SIV] getFusionData mock mode");
    return adaptFusionList(mockFusionData);
}
