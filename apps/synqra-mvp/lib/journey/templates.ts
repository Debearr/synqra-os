export const intents = ["Reservation Lead", "Partner Assurance", "Reveal Close"] as const;
export type IntentType = (typeof intents)[number];

export const formats = ["Instagram story series", "Client Proposal", "Itinerary Reveal"] as const;
export type FormatType = (typeof formats)[number];

export type VariantType = "whisper" | "statement" | "crescendo";

export type TemplateMap = Record<IntentType, Record<FormatType, Record<VariantType, string>>>;

const RESERVATION_INSTAGRAM_WHISPER =
  "{{destination}} {{suite_type}} opens {{timing_window}}.[PANEL]{{partner_status}} confirms {{experience_marker}}.[PANEL]{{access_type}} {{service_tier}} set for {{trip_duration}} {{timing_qualifier}}.[PANEL]Hold by {{cta_deadline}}.";
const RESERVATION_INSTAGRAM_STATEMENT =
  "{{destination}} {{suite_type}} available {{timing_window}}.[PANEL]{{partner_status}} confirms {{experience_marker}}.[PANEL]{{access_type}} {{service_tier}} for {{trip_duration}} {{timing_qualifier}}.[PANEL]Reserve before {{cta_deadline}}.";
const RESERVATION_INSTAGRAM_CRESCENDO =
  "{{destination}} {{suite_type}} now set {{timing_window}}.[PANEL]{{partner_status}} confirms {{experience_marker}}.[PANEL]{{access_type}} {{service_tier}} {{trip_duration}} {{timing_qualifier}}.[PANEL]Lock by {{cta_deadline}}.";

const RESERVATION_PROPOSAL_WHISPER =
  "{{destination}} {{suite_type}} is aligned for {{timing_window}} with {{partner_status}} and {{experience_marker}}. {{access_type}} under {{service_tier}} supports a {{trip_duration}} plan with {{timing_qualifier}} pacing. Confirmation window closes {{cta_deadline}}.";
const RESERVATION_PROPOSAL_STATEMENT =
  "{{destination}} {{suite_type}} is positioned for {{timing_window}}. {{partner_status}} and {{experience_marker}} are confirmed. {{access_type}} with {{service_tier}} secures {{trip_duration}} with {{timing_qualifier}} sequencing. Decision window: {{cta_deadline}}.";
const RESERVATION_PROPOSAL_CRESCENDO =
  "{{destination}} {{suite_type}} is ready in {{timing_window}}. {{partner_status}} confirms {{experience_marker}}. {{access_type}} via {{service_tier}} supports {{trip_duration}} and {{timing_qualifier}} delivery. Confirm by {{cta_deadline}}.";

const RESERVATION_ITINERARY_WHISPER =
  "{{destination}} {{suite_type}} schedule begins {{timing_window}} with {{partner_status}} and {{experience_marker}} verified. {{access_type}} and {{service_tier}} frame {{trip_duration}} with {{timing_qualifier}} transitions. Final hold remains open until {{cta_deadline}}.";
const RESERVATION_ITINERARY_STATEMENT =
  "{{destination}} {{suite_type}} itinerary starts {{timing_window}}. {{partner_status}} confirms {{experience_marker}}. {{access_type}} under {{service_tier}} structures {{trip_duration}} with {{timing_qualifier}} sequencing. Secure before {{cta_deadline}}.";
const RESERVATION_ITINERARY_CRESCENDO =
  "{{destination}} {{suite_type}} itinerary is fixed {{timing_window}}. {{partner_status}} confirms {{experience_marker}}. {{access_type}} plus {{service_tier}} carries {{trip_duration}} with {{timing_qualifier}} pace. Confirm by {{cta_deadline}}.";

const ASSURANCE_INSTAGRAM_WHISPER =
  "{{destination}} {{suite_type}} holds {{timing_window}}.[PANEL]{{partner_status}} reflects {{experience_marker}}.[PANEL]{{access_type}} {{service_tier}} supports {{trip_duration}} {{timing_qualifier}}.[PANEL]Confirm before {{cta_deadline}}.";
const ASSURANCE_INSTAGRAM_STATEMENT =
  "{{destination}} {{suite_type}} remains set {{timing_window}}.[PANEL]{{partner_status}} confirms {{experience_marker}}.[PANEL]{{access_type}} {{service_tier}} sustains {{trip_duration}} {{timing_qualifier}}.[PANEL]Respond by {{cta_deadline}}.";
const ASSURANCE_INSTAGRAM_CRESCENDO =
  "{{destination}} {{suite_type}} is secured {{timing_window}}.[PANEL]{{partner_status}} confirms {{experience_marker}}.[PANEL]{{access_type}} {{service_tier}} holds {{trip_duration}} {{timing_qualifier}}.[PANEL]Complete by {{cta_deadline}}.";

const ASSURANCE_PROPOSAL_WHISPER =
  "{{destination}} {{suite_type}} remains protected across {{timing_window}}. {{partner_status}} and {{experience_marker}} verify continuity. {{access_type}} with {{service_tier}} maintains {{trip_duration}} and {{timing_qualifier}} alignment. Final confirmation requested by {{cta_deadline}}.";
const ASSURANCE_PROPOSAL_STATEMENT =
  "{{destination}} {{suite_type}} is stable for {{timing_window}} with {{partner_status}} and {{experience_marker}} verified. {{access_type}} under {{service_tier}} keeps {{trip_duration}} on {{timing_qualifier}} cadence. Confirmation due {{cta_deadline}}.";
const ASSURANCE_PROPOSAL_CRESCENDO =
  "{{destination}} {{suite_type}} is fully secured for {{timing_window}}. {{partner_status}} validates {{experience_marker}}. {{access_type}} plus {{service_tier}} keeps {{trip_duration}} in {{timing_qualifier}} sequence. Approve by {{cta_deadline}}.";

const ASSURANCE_ITINERARY_WHISPER =
  "{{destination}} {{suite_type}} itinerary remains intact for {{timing_window}}. {{partner_status}} confirms {{experience_marker}}. {{access_type}} with {{service_tier}} supports {{trip_duration}} under {{timing_qualifier}} pacing. Close the hold by {{cta_deadline}}.";
const ASSURANCE_ITINERARY_STATEMENT =
  "{{destination}} {{suite_type}} itinerary is protected through {{timing_window}}. {{partner_status}} confirms {{experience_marker}}. {{access_type}} and {{service_tier}} sustain {{trip_duration}} with {{timing_qualifier}} movement. Approval by {{cta_deadline}}.";
const ASSURANCE_ITINERARY_CRESCENDO =
  "{{destination}} {{suite_type}} itinerary is confirmed for {{timing_window}}. {{partner_status}} secures {{experience_marker}}. {{access_type}} via {{service_tier}} drives {{trip_duration}} through {{timing_qualifier}} sequence. Finalize by {{cta_deadline}}.";

const REVEAL_INSTAGRAM_WHISPER =
  "{{destination}} {{suite_type}} reveal lands {{timing_window}}.[PANEL]{{partner_status}} signals {{experience_marker}}.[PANEL]{{access_type}} {{service_tier}} frames {{trip_duration}} {{timing_qualifier}}.[PANEL]Reveal closes {{cta_deadline}}.";
const REVEAL_INSTAGRAM_STATEMENT =
  "{{destination}} {{suite_type}} reveal activates {{timing_window}}.[PANEL]{{partner_status}} confirms {{experience_marker}}.[PANEL]{{access_type}} {{service_tier}} carries {{trip_duration}} {{timing_qualifier}}.[PANEL]Deadline {{cta_deadline}}.";
const REVEAL_INSTAGRAM_CRESCENDO =
  "{{destination}} {{suite_type}} reveal is live {{timing_window}}.[PANEL]{{partner_status}} confirms {{experience_marker}}.[PANEL]{{access_type}} {{service_tier}} drives {{trip_duration}} {{timing_qualifier}}.[PANEL]Lock by {{cta_deadline}}.";

const REVEAL_PROPOSAL_WHISPER =
  "{{destination}} {{suite_type}} reveal is staged for {{timing_window}}. {{partner_status}} supports {{experience_marker}}. {{access_type}} and {{service_tier}} define {{trip_duration}} with {{timing_qualifier}} progression. Acceptance window ends {{cta_deadline}}.";
const REVEAL_PROPOSAL_STATEMENT =
  "{{destination}} {{suite_type}} reveal is positioned at {{timing_window}} with {{partner_status}} and {{experience_marker}} aligned. {{access_type}} under {{service_tier}} frames {{trip_duration}} with {{timing_qualifier}} order. Confirm by {{cta_deadline}}.";
const REVEAL_PROPOSAL_CRESCENDO =
  "{{destination}} {{suite_type}} reveal is set for {{timing_window}}. {{partner_status}} confirms {{experience_marker}}. {{access_type}} plus {{service_tier}} presents {{trip_duration}} in {{timing_qualifier}} order. Approve before {{cta_deadline}}.";

const REVEAL_ITINERARY_WHISPER =
  "{{destination}} {{suite_type}} reveal itinerary opens {{timing_window}}. {{partner_status}} confirms {{experience_marker}}. {{access_type}} with {{service_tier}} supports {{trip_duration}} using {{timing_qualifier}} timing. Final hold remains until {{cta_deadline}}.";
const REVEAL_ITINERARY_STATEMENT =
  "{{destination}} {{suite_type}} reveal itinerary begins {{timing_window}} with {{partner_status}} and {{experience_marker}} confirmed. {{access_type}} under {{service_tier}} structures {{trip_duration}} with {{timing_qualifier}} pacing. Confirm by {{cta_deadline}}.";
const REVEAL_ITINERARY_CRESCENDO =
  "{{destination}} {{suite_type}} reveal itinerary is active {{timing_window}}. {{partner_status}} confirms {{experience_marker}}. {{access_type}} and {{service_tier}} execute {{trip_duration}} through {{timing_qualifier}} cadence. Finalize by {{cta_deadline}}.";

export const templates: TemplateMap = {
  "Reservation Lead": {
    "Instagram story series": {
      whisper: RESERVATION_INSTAGRAM_WHISPER,
      statement: RESERVATION_INSTAGRAM_STATEMENT,
      crescendo: RESERVATION_INSTAGRAM_CRESCENDO,
    },
    "Client Proposal": {
      whisper: RESERVATION_PROPOSAL_WHISPER,
      statement: RESERVATION_PROPOSAL_STATEMENT,
      crescendo: RESERVATION_PROPOSAL_CRESCENDO,
    },
    "Itinerary Reveal": {
      whisper: RESERVATION_ITINERARY_WHISPER,
      statement: RESERVATION_ITINERARY_STATEMENT,
      crescendo: RESERVATION_ITINERARY_CRESCENDO,
    },
  },
  "Partner Assurance": {
    "Instagram story series": {
      whisper: ASSURANCE_INSTAGRAM_WHISPER,
      statement: ASSURANCE_INSTAGRAM_STATEMENT,
      crescendo: ASSURANCE_INSTAGRAM_CRESCENDO,
    },
    "Client Proposal": {
      whisper: ASSURANCE_PROPOSAL_WHISPER,
      statement: ASSURANCE_PROPOSAL_STATEMENT,
      crescendo: ASSURANCE_PROPOSAL_CRESCENDO,
    },
    "Itinerary Reveal": {
      whisper: ASSURANCE_ITINERARY_WHISPER,
      statement: ASSURANCE_ITINERARY_STATEMENT,
      crescendo: ASSURANCE_ITINERARY_CRESCENDO,
    },
  },
  "Reveal Close": {
    "Instagram story series": {
      whisper: REVEAL_INSTAGRAM_WHISPER,
      statement: REVEAL_INSTAGRAM_STATEMENT,
      crescendo: REVEAL_INSTAGRAM_CRESCENDO,
    },
    "Client Proposal": {
      whisper: REVEAL_PROPOSAL_WHISPER,
      statement: REVEAL_PROPOSAL_STATEMENT,
      crescendo: REVEAL_PROPOSAL_CRESCENDO,
    },
    "Itinerary Reveal": {
      whisper: REVEAL_ITINERARY_WHISPER,
      statement: REVEAL_ITINERARY_STATEMENT,
      crescendo: REVEAL_ITINERARY_CRESCENDO,
    },
  },
};
