import { requestHomepageCouncilDraft } from "./homepage/council-request";

export async function generatePerfectDraft(prompt: string): Promise<string> {
  return requestHomepageCouncilDraft(prompt);
}
