import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET;
if (!stripeSecret) {
  console.error("Missing STRIPE_SECRET env var");
  process.exit(1);
}

const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });

const plans = [
  { name: "Atelier", id: "plan_atelier_sbx", amount: 1900 },
  { name: "Maison", id: "plan_maison_sbx", amount: 4900 },
  { name: "Couture", id: "plan_couture_sbx", amount: 0 }
];

for (const p of plans) {
  // Create product (idempotency by name+metadata is not guaranteed; acceptable for sandbox)
  const product = await stripe.products.create({ name: `Synqra ${p.name} (SBX)` });
  await stripe.prices.create({
    currency: "usd",
    unit_amount: p.amount,
    recurring: { interval: "month" },
    product: product.id,
    nickname: p.id,
    metadata: { plan_id: p.id, trial_period_days: "7" }
  });
}

console.log("✅ Stripe sandbox plans seeded with 7-day trial");
