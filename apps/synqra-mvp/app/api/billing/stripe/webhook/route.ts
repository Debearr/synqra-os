import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  applyStripePaymentFailed,
  applyStripeSubscriptionCancelled,
  applyStripeSubscriptionCreated,
} from "@/app/api/realtor/_billing";
import { logStructuredServerEvent, resolveRequestId } from "@/app/api/realtor/_server";
import { getStripeClient, getStripeProPriceId, getStripeWebhookSecret } from "@/lib/stripe/server";
import { assertVertical, normalizeVertical, resolveTenantForUserId, verticalTag, type TenantVertical } from "@/lib/verticals/tenant";

export const runtime = "nodejs";

const ROUTE_PATH = "/api/billing/stripe/webhook";

function extractMetadataUserId(metadata: Stripe.Metadata | null | undefined): string | null {
  if (!metadata) return null;
  const direct = metadata.supabase_user_id ?? metadata.user_id ?? metadata.userid;
  return typeof direct === "string" && direct.trim() ? direct.trim() : null;
}

function extractMetadataVertical(metadata: Stripe.Metadata | null | undefined): TenantVertical | null {
  if (!metadata) return null;
  return normalizeVertical(metadata.vertical ?? metadata.advisor_type);
}

async function resolveUserIdFromCustomer(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): Promise<string | null> {
  if (!customer) return null;

  if (typeof customer !== "string") {
    if ("deleted" in customer && customer.deleted) {
      return null;
    }
    return extractMetadataUserId(customer.metadata);
  }

  const stripe = getStripeClient();
  const retrieved = await stripe.customers.retrieve(customer);
  if ("deleted" in retrieved && retrieved.deleted) {
    return null;
  }
  return extractMetadataUserId(retrieved.metadata);
}

async function resolveUserIdFromSubscription(subscription: Stripe.Subscription): Promise<string | null> {
  const fromMetadata = extractMetadataUserId(subscription.metadata);
  if (fromMetadata) {
    return fromMetadata;
  }
  return resolveUserIdFromCustomer(subscription.customer);
}

async function resolveUserIdFromInvoice(invoice: Stripe.Invoice): Promise<string | null> {
  const fromMetadata = extractMetadataUserId(invoice.metadata);
  if (fromMetadata) {
    return fromMetadata;
  }
  return resolveUserIdFromCustomer(invoice.customer);
}

function getPrimaryPriceIdFromSubscription(subscription: Stripe.Subscription): string | null {
  const first = subscription.items.data[0];
  const priceId = first?.price?.id;
  return typeof priceId === "string" && priceId.trim() ? priceId : null;
}

async function resolveVerticalForUserId(userId: string) {
  const tenant = await resolveTenantForUserId(userId);
  return tenant.vertical;
}

function isVerticalMismatchError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : "";
  return message.toLowerCase().includes("vertical mismatch");
}

export async function POST(request: NextRequest) {
  const requestId = resolveRequestId(request);
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    logStructuredServerEvent({
      level: "warn",
      requestId,
      userId: null,
      route: ROUTE_PATH,
      errorCode: "STRIPE_SIGNATURE_MISSING",
      message: "stripe signature header missing",
      status: 400,
    });
    return NextResponse.json(
      {
        error: "Missing Stripe signature.",
        error_code: "STRIPE_SIGNATURE_MISSING",
        request_id: requestId,
      },
      { status: 400, headers: { "X-Request-Id": requestId } }
    );
  }

  try {
    const payload = await request.text();
    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(payload, signature, getStripeWebhookSecret());
    const occurredAtIso = new Date(event.created * 1000).toISOString();

    switch (event.type) {
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await resolveUserIdFromSubscription(subscription);
        if (!userId) {
          logStructuredServerEvent({
            level: "warn",
            requestId,
            userId: null,
            route: ROUTE_PATH,
            errorCode: "STRIPE_USER_MAPPING_MISSING",
            message: "subscription_created missing supabase user mapping",
            status: 202,
            details: { subscription_id: subscription.id },
          });
          break;
        }

        const priceId = getPrimaryPriceIdFromSubscription(subscription);
        const proPriceId = getStripeProPriceId();
        if (priceId !== proPriceId) {
          const vertical = await resolveVerticalForUserId(userId);
          logStructuredServerEvent({
            level: "warn",
            vertical,
            requestId,
            userId,
            route: ROUTE_PATH,
            errorCode: "STRIPE_PRICE_ID_MISMATCH",
            message: `${verticalTag(vertical)} subscription_created ignored due to non-pro price`,
            status: 202,
            details: { subscription_id: subscription.id, price_id: priceId },
          });
          break;
        }
        const vertical = await resolveVerticalForUserId(userId);
        const requestedVertical = extractMetadataVertical(subscription.metadata);
        try {
          assertVertical(
            {
              tenantId: userId,
              vertical,
              source: "user_metadata",
            },
            requestedVertical ?? vertical
          );
        } catch (error) {
          if (isVerticalMismatchError(error)) {
            logStructuredServerEvent({
              level: "warn",
              vertical,
              requestId,
              userId,
              route: ROUTE_PATH,
              errorCode: "STRIPE_VERTICAL_MISMATCH",
              message: `${verticalTag(vertical)} subscription_created ignored due to vertical mismatch`,
              status: 202,
              details: {
                subscription_id: subscription.id,
                requested_vertical: requestedVertical,
                resolved_vertical: vertical,
              },
            });
            break;
          }
          throw error;
        }

        await applyStripeSubscriptionCreated(userId, {
          stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          stripeSubscriptionStatus: subscription.status,
          occurredAtIso,
        }, vertical);
        logStructuredServerEvent({
          level: "info",
          vertical,
          requestId,
          userId,
          route: ROUTE_PATH,
          errorCode: "SUBSCRIPTION_CREATED",
          message: `${verticalTag(vertical)} stripe subscription created processed`,
          status: 200,
          details: { subscription_id: subscription.id },
        });
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await resolveUserIdFromSubscription(subscription);
        if (!userId) {
          logStructuredServerEvent({
            level: "warn",
            requestId,
            userId: null,
            route: ROUTE_PATH,
            errorCode: "STRIPE_USER_MAPPING_MISSING",
            message: "subscription_cancelled missing supabase user mapping",
            status: 202,
            details: { subscription_id: subscription.id },
          });
          break;
        }

        const vertical = await resolveVerticalForUserId(userId);
        const requestedVertical = extractMetadataVertical(subscription.metadata);
        try {
          assertVertical(
            {
              tenantId: userId,
              vertical,
              source: "user_metadata",
            },
            requestedVertical ?? vertical
          );
        } catch (error) {
          if (isVerticalMismatchError(error)) {
            logStructuredServerEvent({
              level: "warn",
              vertical,
              requestId,
              userId,
              route: ROUTE_PATH,
              errorCode: "STRIPE_VERTICAL_MISMATCH",
              message: `${verticalTag(vertical)} subscription_cancelled ignored due to vertical mismatch`,
              status: 202,
              details: {
                subscription_id: subscription.id,
                requested_vertical: requestedVertical,
                resolved_vertical: vertical,
              },
            });
            break;
          }
          throw error;
        }
        await applyStripeSubscriptionCancelled(userId, {
          stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null,
          stripeSubscriptionId: subscription.id,
          stripePriceId: getPrimaryPriceIdFromSubscription(subscription),
          stripeSubscriptionStatus: subscription.status,
          occurredAtIso,
        }, vertical);
        logStructuredServerEvent({
          level: "info",
          vertical,
          requestId,
          userId,
          route: ROUTE_PATH,
          errorCode: "SUBSCRIPTION_CANCELLED",
          message: `${verticalTag(vertical)} stripe subscription cancelled processed`,
          status: 200,
          details: { subscription_id: subscription.id },
        });
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.status !== "canceled") {
          break;
        }
        const userId = await resolveUserIdFromSubscription(subscription);
        if (!userId) {
          logStructuredServerEvent({
            level: "warn",
            requestId,
            userId: null,
            route: ROUTE_PATH,
            errorCode: "STRIPE_USER_MAPPING_MISSING",
            message: "subscription_updated(canceled) missing supabase user mapping",
            status: 202,
            details: { subscription_id: subscription.id },
          });
          break;
        }
        const vertical = await resolveVerticalForUserId(userId);
        const requestedVertical = extractMetadataVertical(subscription.metadata);
        try {
          assertVertical(
            {
              tenantId: userId,
              vertical,
              source: "user_metadata",
            },
            requestedVertical ?? vertical
          );
        } catch (error) {
          if (isVerticalMismatchError(error)) {
            logStructuredServerEvent({
              level: "warn",
              vertical,
              requestId,
              userId,
              route: ROUTE_PATH,
              errorCode: "STRIPE_VERTICAL_MISMATCH",
              message: `${verticalTag(vertical)} subscription_updated(canceled) ignored due to vertical mismatch`,
              status: 202,
              details: {
                subscription_id: subscription.id,
                requested_vertical: requestedVertical,
                resolved_vertical: vertical,
              },
            });
            break;
          }
          throw error;
        }
        await applyStripeSubscriptionCancelled(userId, {
          stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null,
          stripeSubscriptionId: subscription.id,
          stripePriceId: getPrimaryPriceIdFromSubscription(subscription),
          stripeSubscriptionStatus: subscription.status,
          occurredAtIso,
        }, vertical);
        logStructuredServerEvent({
          level: "info",
          vertical,
          requestId,
          userId,
          route: ROUTE_PATH,
          errorCode: "SUBSCRIPTION_CANCELLED",
          message: `${verticalTag(vertical)} stripe subscription updated(canceled) processed`,
          status: 200,
          details: { subscription_id: subscription.id },
        });
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const userId = await resolveUserIdFromInvoice(invoice);
        if (!userId) {
          logStructuredServerEvent({
            level: "warn",
            requestId,
            userId: null,
            route: ROUTE_PATH,
            errorCode: "STRIPE_USER_MAPPING_MISSING",
            message: "payment_failed missing supabase user mapping",
            status: 202,
            details: { invoice_id: invoice.id },
          });
          break;
        }

        const invoiceSubscription = (invoice as unknown as { subscription?: string | Stripe.Subscription | null })
          .subscription;
        const stripeSubscriptionId =
          typeof invoiceSubscription === "string"
            ? invoiceSubscription
            : invoiceSubscription && typeof invoiceSubscription === "object"
            ? invoiceSubscription.id
            : null;
        const vertical = await resolveVerticalForUserId(userId);
        const requestedVertical = extractMetadataVertical(invoice.metadata);
        try {
          assertVertical(
            {
              tenantId: userId,
              vertical,
              source: "user_metadata",
            },
            requestedVertical ?? vertical
          );
        } catch (error) {
          if (isVerticalMismatchError(error)) {
            logStructuredServerEvent({
              level: "warn",
              vertical,
              requestId,
              userId,
              route: ROUTE_PATH,
              errorCode: "STRIPE_VERTICAL_MISMATCH",
              message: `${verticalTag(vertical)} payment_failed ignored due to vertical mismatch`,
              status: 202,
              details: {
                invoice_id: invoice.id,
                requested_vertical: requestedVertical,
                resolved_vertical: vertical,
              },
            });
            break;
          }
          throw error;
        }

        await applyStripePaymentFailed(userId, {
          stripeCustomerId: typeof invoice.customer === "string" ? invoice.customer : null,
          stripeSubscriptionId,
          occurredAtIso,
        }, vertical);
        logStructuredServerEvent({
          level: "info",
          vertical,
          requestId,
          userId,
          route: ROUTE_PATH,
          errorCode: "PAYMENT_FAILED",
          message: `${verticalTag(vertical)} stripe payment failed processed`,
          status: 200,
          details: { invoice_id: invoice.id },
        });
        break;
      }
      default: {
        logStructuredServerEvent({
          level: "info",
          requestId,
          userId: null,
          route: ROUTE_PATH,
          errorCode: null,
          message: `stripe event ignored: ${event.type}`,
          status: 200,
        });
      }
    }

    return NextResponse.json({ received: true }, { status: 200, headers: { "X-Request-Id": requestId } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe webhook handling failed.";
    logStructuredServerEvent({
      level: "error",
      requestId,
      userId: null,
      route: ROUTE_PATH,
      errorCode: "STRIPE_WEBHOOK_FAILED",
      message,
      status: 400,
      details: { raw_error: message },
    });
    return NextResponse.json(
      {
        error: "Stripe webhook verification failed.",
        error_code: "STRIPE_WEBHOOK_FAILED",
        request_id: requestId,
      },
      { status: 400, headers: { "X-Request-Id": requestId } }
    );
  }
}
