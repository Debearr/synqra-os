export async function fetchExecSummary() {
  const mod = await import("./execSummary.data.synqra");
  // Return curated data as-is (no network fetch).
  return mod.synqraExecSummaryData;
}