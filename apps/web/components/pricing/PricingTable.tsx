import * as React from "react";
import { PRICING, TOP_UP_PACKS, type PricingTier, type TierKey } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type UsageProps = { used?: number; limit?: number };

const UsageMeter: React.FC<UsageProps> = ({ used = 0, limit = 0 }) => {
  if (!limit) return null;
  const percentage = Math.min(100, Math.round((used / limit) * 100));
  const isSoftWarning = percentage >= 83 && percentage < 90;
  const isFreeze = percentage >= 90;
  const exceedsHardCap = limit >= 250 && used > limit;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
        <span>Usage (Hard cap)</span>
        <span>
          {used}/{limit}
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-pink-100">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-pink-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isSoftWarning && (
        <p className="text-xs text-pink-600">You&apos;re approaching your monthly hard cap.</p>
      )}
      {isFreeze && (
        <p className="text-xs font-medium text-pink-700">
          You&apos;ve reached your monthly limit. Upgrade or contact support.
        </p>
      )}
      {exceedsHardCap && (
        <p className="text-xs font-semibold text-pink-700">
          Contact us for custom enterprise volume pricing.
        </p>
      )}
    </div>
  );
};

const tierSequence: TierKey[] = [
  "FREE",
  "EXPLORER_WEEKLY",
  "ATELIER",
  "COUTURE",
  "MAISON",
  "ENTERPRISE",
  "PRIVATE_INFRA",
];

const featuredTiers: PricingTier[] = tierSequence.map((key) => PRICING[key]);

const topUpEligible: Array<TierKey> = ["ATELIER", "COUTURE", "MAISON"];

const luxuryAccent = "bg-gradient-to-br from-pink-50 via-white to-pink-100";

const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("h-4 w-4", className)}
    {...props}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const Ribbon: React.FC<{ label: string }> = ({ label }) => (
  <div className="absolute -top-3 left-1/2 w-max -translate-x-1/2 rounded-full border border-pink-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-pink-600 shadow-sm">
    {label}
  </div>
);

const TierMeta: React.FC<{ tier: PricingTier }> = ({ tier }) => {
  const items: Array<{ label: string; value: string }> = [];

  if (typeof tier.campaigns === "number") {
    items.push({ label: "Campaigns", value: `${tier.campaigns}/mo` });
  }
  if (typeof tier.campaignsPerWeek === "number") {
    items.push({ label: "Campaigns", value: `${tier.campaignsPerWeek}/week` });
  }
  if (typeof tier.seats === "number") {
    items.push({ label: "Seats", value: `${tier.seats}` });
  } else if (tier.seats === "hard_capped") {
    items.push({ label: "Seats", value: "Hard capped for predictable usage and cost control." });
  }
  if (typeof tier.flows === "number" && tier.flows > 0) {
    items.push({ label: "Flows", value: `${tier.flows}` });
  }
  if (tier.resolution) {
    items.push({ label: "Export", value: tier.resolution.toUpperCase() });
  }
  if (tier.api) {
    items.push({ label: "API", value: "Included" });
  }

  if (!items.length) return null;

  return (
    <dl className="grid grid-cols-2 gap-3 text-sm">
      {items.map((item) => (
        <div key={`${item.label}-${item.value}`} className="space-y-1">
          <dt className="font-medium text-foreground">{item.value}</dt>
          <dd className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</dd>
        </div>
      ))}
    </dl>
  );
};

const TopUpModal: React.FC<{
  tier: PricingTier | null;
  open: boolean;
  onClose: () => void;
}> = ({ tier, open, onClose }) => {
  const handleSelectPack = (sku: string) => {
    console.info(`Top-Up placeholder selected`, { tier: tier?.key, sku });
  };

  if (!open || !tier) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-pink-100 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Close
        </button>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Top-Up Packs for {tier.label}
            </h3>
            <p className="text-sm text-muted-foreground">
              Select a pack to extend your campaign allocation. Checkout flow coming soon.
            </p>
          </div>
          <div className="space-y-3">
            {TOP_UP_PACKS.map((pack) => (
              <div
                key={pack.sku}
                className="flex items-center justify-between rounded-2xl border border-pink-100 bg-pink-50/60 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-foreground">{pack.name}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Adds {pack.campaigns} campaign{pack.campaigns > 1 ? "s" : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleSelectPack(pack.sku)}
                  className="whitespace-nowrap"
                >
                  {pack.price}
                </Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Need a bespoke volume or corporate invoicing?{" "}
            <a href="/contact" className="font-medium text-pink-600 underline">
              Talk to sales
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

const cardBaseClasses =
  "relative flex h-full flex-col justify-between overflow-hidden border-transparent bg-white/90 p-7 shadow-sm ring-1 ring-pink-100 transition-all hover:-translate-y-1 hover:shadow-lg";

export const PricingTable: React.FC = () => {
  const [topUpTier, setTopUpTier] = React.useState<PricingTier | null>(null);
  const [topUpOpen, setTopUpOpen] = React.useState(false);

  const handleTopUp = (tier: PricingTier) => {
    setTopUpTier(tier);
    setTopUpOpen(true);
  };

  const handleCloseTopUp = () => {
    setTopUpOpen(false);
    setTopUpTier(null);
  };

  const tierCards = React.useMemo(() => featuredTiers, []);

  return (
    <section className="relative w-full bg-[radial-gradient(circle_at_top,_rgba(255,228,235,0.65),_transparent_70%)] py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 lg:px-8">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-pink-500">Pricing</p>
          <h2 className="mt-3 font-serif text-4xl text-foreground sm:text-5xl">
            Pink &amp; White, tailored for every atelier.
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Choose the tier that matches your brand cadence. Upgrade or add top-ups whenever you
            need an extra burst of campaigns.
          </p>
        </header>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
          {tierCards.map((tier) => {
            if (tier.key === "ENTERPRISE" || tier.key === "PRIVATE_INFRA") return null;

            const hasRibbon = tier.highlight || tier.key === "MAISON";
            const ribbonLabel =
              tier.key === "MAISON" ? "Studio Favourite" : tier.badge ?? "Featured";

            const limit = tier.campaigns ?? tier.campaignsPerWeek ?? 0;
            const used = limit ? Math.max(1, Math.round(limit * 0.65)) : 0;

            return (
              <Card
                key={tier.key}
                className={cn(
                  cardBaseClasses,
                  luxuryAccent,
                  tier.highlight && "ring-2 ring-pink-400 shadow-xl",
                  tier.key === "MAISON" && "lg:col-span-2"
                )}
              >
                {hasRibbon && <Ribbon label={ribbonLabel} />}

                <CardHeader className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-3xl text-foreground">{tier.label}</CardTitle>
                    </div>
                    <p className="text-3xl font-semibold text-pink-600">{tier.price}</p>
                    <p className="text-sm text-muted-foreground">
                      {tier.billing === "weekly"
                        ? "Billed weekly"
                        : tier.billing === "monthly"
                          ? "Billed monthly"
                          : "Flexible billing"}
                    </p>
                  </div>

                  <TierMeta tier={tier} />
                </CardHeader>

                <CardContent className="space-y-5">
                  <ul className="space-y-3 text-sm text-foreground">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-3">
                        <span className="mt-1 rounded-full bg-pink-100 p-1 text-pink-600">
                          <CheckIcon />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <UsageMeter used={used} limit={limit} />

                  <div className="space-y-3">
                    <Button href={tier.cta.href}>{tier.cta.label}</Button>
                    {topUpEligible.includes(tier.key) && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleTopUp(tier)}
                        className="w-full"
                      >
                        Explore Top-Up Packs
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {[PRICING.ENTERPRISE, PRICING.PRIVATE_INFRA].map((tier) => (
            <Card key={tier.key} className={cn(cardBaseClasses, "bg-white text-foreground")}>
              <CardHeader className="space-y-3">
                <div>
                  <CardTitle className="text-3xl">{tier.label}</CardTitle>
                  <p className="text-2xl font-semibold text-pink-600">{tier.price}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-sm text-foreground">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-3">
                      <span className="mt-1 rounded-full bg-pink-100 p-1 text-pink-600">
                        <CheckIcon />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button href={tier.cta.href} variant="default">
                  {tier.cta.label}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <TopUpModal tier={topUpTier} open={topUpOpen} onClose={handleCloseTopUp} />
    </section>
  );
};

export default PricingTable;
