type Tier = {
  id: "core" | "pro" | "studio";
  name: string;
  priceCad: string;
  checkoutUrl: string;
  popular?: boolean;
};

function getCheckoutUrl(name: "core" | "pro" | "studio"): string {
  if (name === "core") {
    return (
      process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_CORE_URL?.trim() ||
      process.env.STRIPE_CHECKOUT_CORE_URL?.trim() ||
      ""
    );
  }
  if (name === "pro") {
    return (
      process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_PRO_URL?.trim() ||
      process.env.STRIPE_CHECKOUT_PRO_URL?.trim() ||
      ""
    );
  }
  return (
    process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_STUDIO_URL?.trim() ||
    process.env.STRIPE_CHECKOUT_STUDIO_URL?.trim() ||
    ""
  );
}

function isFunctionalStripeCheckoutLink(value: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return false;
    return parsed.hostname === "buy.stripe.com" || parsed.hostname.endsWith(".stripe.com");
  } catch {
    return false;
  }
}

export default function PricingPage() {
  const tiers: Tier[] = [
    { id: "core", name: "Core", priceCad: "$69 CAD", checkoutUrl: getCheckoutUrl("core") },
    { id: "pro", name: "Pro", priceCad: "$149 CAD", checkoutUrl: getCheckoutUrl("pro"), popular: true },
    { id: "studio", name: "Studio", priceCad: "$349 CAD", checkoutUrl: getCheckoutUrl("studio") },
  ];

  return (
    <main className="min-h-screen bg-ds-bg text-ds-text-primary">
      <div className="mx-auto w-full max-w-journey px-4 py-12 md:px-6">
        <header className="mb-8 space-y-3">
          <p className="text-xs uppercase tracking-[0.14em] text-ds-text-secondary">Pricing</p>
          <h1 className="text-3xl font-medium leading-compact">Choose your plan</h1>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {tiers.map((tier) => {
            const hasFunctionalLink = isFunctionalStripeCheckoutLink(tier.checkoutUrl);
            return (
              <article
                key={tier.id}
                className={`flex h-full flex-col justify-between border bg-ds-surface p-6 ${
                  tier.popular ? "border-ds-gold" : "border-ds-text-secondary/30"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-medium leading-compact">{tier.name}</h2>
                    {tier.popular ? (
                      <span className="inline-flex h-7 items-center border border-ds-gold/60 px-2 text-[10px] uppercase tracking-[0.14em] text-ds-gold">
                        Most Popular
                      </span>
                    ) : null}
                  </div>
                  <p className="text-2xl font-medium leading-compact">{tier.priceCad}</p>
                </div>

                <div className="mt-8 space-y-3">
                  {hasFunctionalLink ? (
                    <a
                      href={tier.checkoutUrl}
                      className="inline-flex min-h-11 w-full items-center justify-center bg-ds-gold px-4 py-2 text-sm font-medium text-ds-bg"
                    >
                      Start {tier.name}
                    </a>
                  ) : (
                    <span className="inline-flex min-h-11 w-full items-center justify-center border border-ds-text-secondary/30 px-4 py-2 text-sm text-ds-text-secondary">
                      Checkout unavailable
                    </span>
                  )}
                  <p className="text-xs uppercase tracking-[0.12em] text-ds-text-secondary">
                    Stripe checkout link {hasFunctionalLink ? "verified" : "not configured"}
                  </p>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
