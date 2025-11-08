import { getStripeConfig } from "../config";
import { logSalesEvent } from "../db/client";

type StripeLinkOptions = {
  customerEmail?: string;
  mode?: "subscription" | "payment";
  metadata?: Record<string, string>;
  successUrl?: string;
  cancelUrl?: string;
};

export async function generateStripeCheckoutLink(options: StripeLinkOptions = {}) {
  const config = getStripeConfig();
  if (!config.apiKey) {
    console.warn("[sales-engine] Stripe API key missing; checkout link skipped.");
    return undefined;
  }

  const payload = {
    mode: options.mode ?? "subscription",
    customer_email: options.customerEmail,
    success_url: options.successUrl ?? "https://synqra.com/onboarding/success",
    cancel_url: options.cancelUrl ?? "https://synqra.com/onboarding/cancelled",
    metadata: options.metadata ?? {},
    ...(config.pricingTableId ? { line_items: [{ price: config.pricingTableId, quantity: 1 }] } : {}),
  };

  try {
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: new URLSearchParams({
        mode: payload.mode,
        success_url: payload.success_url,
        cancel_url: payload.cancel_url,
        ...(payload.customer_email ? { customer_email: payload.customer_email } : {}),
        ...(config.pricingTableId
          ? { "line_items[0][price]": config.pricingTableId, "line_items[0][quantity]": "1" }
          : {}),
        ...Object.entries(payload.metadata).reduce<Record<string, string>>((acc, [key, value]) => {
          acc[`metadata[${key}]`] = value;
          return acc;
        }, {}),
      }).toString(),
    });

    if (!response.ok) {
      console.warn("[sales-engine] Stripe checkout creation failed", await response.text());
      return undefined;
    }

    const data = await response.json();
    await logSalesEvent({
      type: "system_notification",
      payload: { stripe_checkout: data },
    });

    return data.url as string | undefined;
  } catch (error) {
    console.warn("[sales-engine] Stripe checkout error", error);
    return undefined;
  }
}

export async function handleStripeWebhook(payload: unknown) {
  await logSalesEvent({
    type: "system_notification",
    payload: { stripe_webhook: payload },
  });
}

export async function updateSubscriptionTier(params: {
  customerId: string;
  priceId: string;
}) {
  const config = getStripeConfig();
  if (!config.apiKey) {
    console.warn("[sales-engine] Stripe API key missing; subscription update skipped.");
    return false;
  }

  try {
    const response = await fetch("https://api.stripe.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: new URLSearchParams({
        customer: params.customerId,
        items: JSON.stringify([{ price: params.priceId }]),
        proration_behavior: "create_prorations",
      }).toString(),
    });

    if (!response.ok) {
      console.warn("[sales-engine] Stripe subscription update failed", await response.text());
      return false;
    }

    await logSalesEvent({
      type: "system_notification",
      payload: { stripe_subscription: await response.json() },
    });

    return true;
  } catch (error) {
    console.warn("[sales-engine] Stripe subscription update error", error);
    return false;
  }
}
