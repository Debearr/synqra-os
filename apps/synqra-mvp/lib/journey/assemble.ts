import type { EnergyType } from "./energyRules";
import type { FormatType, IntentType, VariantType } from "./templates";
import { templates } from "./templates";
import { validateOutput } from "./validator";

type JourneyFields = {
  destination: string;
  suite_type: string;
  timing_window: string;
  partner_status: string;
  experience_marker: string;
  cta_deadline: string;
  access_type: string;
  service_tier: string;
  timing_qualifier: string;
  trip_duration: string;
};

type AssembleJourneyInput = {
  intent: IntentType;
  format: FormatType;
  energy: EnergyType;
  fields: JourneyFields;
};

export type JourneyAssemblyErrorCode = "TEMPLATE_NOT_FOUND" | "MISSING_SLOTS" | "VALIDATION_FAILED";

export class JourneyAssemblyError extends Error {
  public readonly code: JourneyAssemblyErrorCode;
  public readonly details: Record<string, unknown>;

  constructor(code: JourneyAssemblyErrorCode, message: string, details: Record<string, unknown>) {
    super(message);
    this.name = "JourneyAssemblyError";
    this.code = code;
    this.details = details;
  }
}

const variantByEnergy: Record<EnergyType, VariantType> = {
  Whisper: "whisper",
  Statement: "statement",
  Crescendo: "crescendo",
};

function injectSlots(template: string, fields: JourneyFields): string {
  let output = template;
  (Object.entries(fields) as Array<[keyof JourneyFields, string]>).forEach(([key, value]) => {
    output = output.split(`{{${key}}}`).join(value.trim());
  });
  return output;
}

export function assembleJourney({ intent, format, energy, fields }: AssembleJourneyInput): string {
  const variant = variantByEnergy[energy];
  const template = templates[intent]?.[format]?.[variant];

  if (!template) {
    throw new JourneyAssemblyError("TEMPLATE_NOT_FOUND", "Template mapping does not exist for the selected inputs.", {
      intent,
      format,
      variant,
    });
  }

  const output = injectSlots(template, fields);
  const unresolvedSlots = output.match(/{{[^}]+}}/g) ?? [];
  if (unresolvedSlots.length > 0) {
    throw new JourneyAssemblyError("MISSING_SLOTS", "Template assembly left unresolved slots.", {
      unresolvedSlots,
      intent,
      format,
      variant,
    });
  }

  const validation = validateOutput(output, energy, format);
  if (!validation.valid) {
    throw new JourneyAssemblyError("VALIDATION_FAILED", "Output failed deterministic validation.", {
      intent,
      format,
      energy,
      errors: validation.errors,
    });
  }

  return output;
}

export type { AssembleJourneyInput, JourneyFields };
