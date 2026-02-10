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
      title="Application Received"
      message="Your pilot application is in review. We will email approved applicants with secure next steps within 24 hours."
      nextSteps={[
        "Our team will review your application within 24 hours",
        "Check your inbox and spam folder for the approval email",
        "If approved, follow the secure instructions in that email",
        "Reply to the email if you need help with onboarding",
      ]}
    />
  );
}
