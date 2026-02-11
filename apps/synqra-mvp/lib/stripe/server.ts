/**
 * Stripe Server Module
 * Production-safe placeholder for Stripe server-side utilities
 * 
 * @module lib/stripe/server
 */

import Stripe from "stripe";

// Environment variable validation
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID;

if (!STRIPE_SECRET_KEY) {
  console.warn("[stripe/server] STRIPE_SECRET_KEY not configured");
}

if (!STRIPE_WEBHOOK_SECRET) {
  console.warn("[stripe/server] STRIPE_WEBHOOK_SECRET not configured");
}

if (!STRIPE_PRO_PRICE_ID) {
  console.warn("[stripe/server] STRIPE_PRO_PRICE_ID not configured");
}

let stripeClient: Stripe | null = null;

/**
 * Get initialized Stripe client
 * @returns Stripe client instance
 */
export function getStripeClient(): Stripe {
  if (!stripeClient && STRIPE_SECRET_KEY) {
    stripeClient = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
      typescript: true,
    });
  }
  
  if (!stripeClient) {
    throw new Error("Stripe client not configured - STRIPE_SECRET_KEY missing");
  }
  
  return stripeClient;
}

/**
 * Get Stripe Pro price ID from environment
 * @returns Stripe Pro price ID
 */
export function getStripeProPriceId(): string {
  if (!STRIPE_PRO_PRICE_ID) {
    throw new Error("STRIPE_PRO_PRICE_ID not configured");
  }
  return STRIPE_PRO_PRICE_ID;
}

/**
 * Get Stripe webhook secret from environment
 * @returns Stripe webhook secret
 */
export function getStripeWebhookSecret(): string {
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  }
  return STRIPE_WEBHOOK_SECRET;
}
