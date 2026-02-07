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
      message="We're reviewing your application. If approved, you'll receive a secure payment link within 24 hours."
      nextSteps={[
        "Our team will review your application within 24 hours",
        "Check your email for approval notification and payment link",
        "Once approved, complete payment to secure your founder spot",
        "You'll receive onboarding instructions immediately after payment",
      ]}
    />
  );
}
