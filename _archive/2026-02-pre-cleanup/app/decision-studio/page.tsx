import { StudioLayout } from "@/components/studio/StudioLayout";
import { StudioNavigator } from "@/components/studio/StudioNavigator";
import { StudioSection } from "@/components/studio/StudioSection";
import { OptionSetViewer } from "@/components/studio/OptionSetViewer";
import { DecisionNodeViewer } from "@/components/studio/DecisionNodeViewer";
import { TradeOffViewer } from "@/components/studio/TradeOffViewer";
import { ConstraintViewer } from "@/components/studio/ConstraintViewer";
import { SummaryViewer } from "@/components/studio/SummaryViewer";
import {
  previewOptionSets,
  previewDecisionSteps,
  previewTradeOffs,
  previewConstraints,
  previewSummary,
} from "./preview-data";

export default function DecisionStudioPage() {
  return (
    <StudioLayout>
      <StudioNavigator />

      <StudioSection title="Options">
        <OptionSetViewer options={previewOptionSets} />
      </StudioSection>

      <StudioSection title="Decision Path">
        <DecisionNodeViewer steps={previewDecisionSteps} />
      </StudioSection>

      <StudioSection title="Trade-offs">
        <TradeOffViewer tradeoffs={previewTradeOffs} />
      </StudioSection>

      <StudioSection title="Constraints">
        <ConstraintViewer constraints={previewConstraints} />
      </StudioSection>

      <StudioSection title="Summary">
        <SummaryViewer {...previewSummary} />
      </StudioSection>
    </StudioLayout>
  );
}
