import SuccessConfirmation from '@/components/ui/SuccessConfirmation';

/**
 * ============================================================
 * PILOT APPLICATION SUCCESS PAGE
 * ============================================================
 * Displayed after successful pilot application submission
 */

export default function PilotApplicationSuccessPage() {
  return (
    <SuccessConfirmation
      title="You're in!"
      message="Welcome to the Synqra Founder Pilot. Check your email for next steps."
      nextSteps={[
        "Check your inbox for a welcome email (arrives within 5 minutes)",
        "Join our private Slack channel for pilot founders",
        "Schedule your 1:1 onboarding call with our team",
        "Get early access to exclusive founder perks and lifetime pricing",
      ]}
    />
  );
}
