"use server";

import { executePipeline } from "../../engine/pipeline";
import { emulateModelRun } from "../../engine/model-runner";
import { IntelligenceRequest } from "../../engine/types";

export interface CreatorEngineResult {
  content: string;
  summary?: string;
  actions?: string[];
  traceId: string;
  model: string;
}

export const runCreatorEngine = async (
  request: IntelligenceRequest,
): Promise<CreatorEngineResult> => {
  const { output, routingModel } = await executePipeline(request, emulateModelRun);

  return {
    content: output.data.content,
    summary: output.data.summary,
    actions: output.data.actions,
    traceId: output.traceId,
    model: routingModel,
  };
};
