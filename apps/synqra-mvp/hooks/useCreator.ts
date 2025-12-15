import { useCallback, useMemo } from "react";
import { z } from "zod";
import { useStructuredOutput } from "./useStructuredOutput";

export function useCreator<TModel = unknown, TTemplate = unknown>() {
  const modelOutput = useStructuredOutput<TModel>();
  const templateOutput = useStructuredOutput<TTemplate>();

  const runModel = useCallback(
    async (modelName: string, input: unknown, schema?: z.ZodSchema<TModel>) => {
      return modelOutput.run(
        "/api/intel",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "runModel", model: modelName, input }),
        },
        { schema }
      );
    },
    [modelOutput]
  );

  const runTemplate = useCallback(
    async (templateId: string, vars: Record<string, unknown>, schema?: z.ZodSchema<TTemplate>) => {
      return templateOutput.run(
        "/api/intel",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "runTemplate", templateId, vars }),
        },
        { schema }
      );
    },
    [templateOutput]
  );

  const state = useMemo(
    () => ({
      model: {
        loading: modelOutput.loading,
        error: modelOutput.error,
        result: modelOutput.result,
        partial: modelOutput.partial,
        reset: modelOutput.reset,
      },
      template: {
        loading: templateOutput.loading,
        error: templateOutput.error,
        result: templateOutput.result,
        partial: templateOutput.partial,
        reset: templateOutput.reset,
      },
    }),
    [modelOutput.loading, modelOutput.error, modelOutput.result, modelOutput.partial, modelOutput.reset, templateOutput.loading, templateOutput.error, templateOutput.result, templateOutput.partial, templateOutput.reset]
  );

  return {
    runModel,
    runTemplate,
    state,
  };
}
