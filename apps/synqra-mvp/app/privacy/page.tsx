export const metadata = {
  title: "Privacy - Synqra",
  description: "Synqra privacy notice.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12 text-white">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
      <p className="mt-3 text-sm text-white/70">Last updated: February 10, 2026</p>

      <section className="mt-8 space-y-4 text-sm leading-7 text-white/85">
        <p>
          Synqra collects only the information needed to operate onboarding, account access, and service delivery.
        </p>
        <p>
          We use submitted form information to review pilot and waitlist requests, respond to inquiries, and provide
          product updates.
        </p>
        <p>
          We do not sell personal information. We may use service providers for hosting, analytics, payments, and email
          delivery as needed to run the product.
        </p>
        <p>
          To request access, correction, or deletion of your information, contact{" "}
          <a className="text-[#D4AF37] underline" href="mailto:support@synqra.co">
            support@synqra.co
          </a>
          .
        </p>
      </section>
    </main>
  );
}
