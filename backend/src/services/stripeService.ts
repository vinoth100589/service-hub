import Stripe from 'stripe';
import { config } from '@config/environment';

// Real Stripe secret keys are `sk_test_`/`sk_live_` followed by a long
// opaque token — a copy-pasted placeholder like "sk_test_dev_key_placeholder"
// technically matches the sk_test_ prefix but isn't a working key, so it's
// rejected explicitly rather than passed to the SDK (confirmed: without this
// check, such a value silently disables the mock fallback and every payment
// call fails with "Invalid API Key provided").
function looksLikeRealStripeKey(key: string): boolean {
  return /^sk_(test|live)_[A-Za-z0-9]{20,}$/.test(key);
}

let stripe: Stripe | null = null;
if (config.stripe.secret_key && looksLikeRealStripeKey(config.stripe.secret_key)) {
  stripe = new Stripe(config.stripe.secret_key, { apiVersion: '2022-11-15' });
} else if (config.stripe.secret_key) {
  console.warn('[stripe] STRIPE_SECRET_KEY is set but does not look like a real key — using mock payments.');
}

// Everything here degrades to a mock (uuid-based fake ids, no real charge)
// when STRIPE_SECRET_KEY isn't set, so the app runs fully offline in dev/demo.
// The instant real keys are supplied via env vars, these same call sites
// start hitting the real Stripe API with no code changes required.
export const StripeService = {
  isConfigured(): boolean {
    return stripe !== null;
  },

  async createPaymentIntent(amountDollars: number, currency = 'usd', metadata: Record<string, string> = {}) {
    if (!stripe) {
      return {
        id: `pi_mock_${Date.now()}`,
        client_secret: `pi_mock_${Date.now()}_secret`,
        mock: true,
      };
    }
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amountDollars * 100),
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    });
    return { id: intent.id, client_secret: intent.client_secret, mock: false };
  },

  async retrievePaymentIntent(paymentIntentId: string) {
    if (!stripe) return null;
    return stripe.paymentIntents.retrieve(paymentIntentId);
  },

  async createRefund(paymentIntentId: string, amountDollars?: number) {
    if (!stripe || paymentIntentId.startsWith('pi_mock_')) {
      return { id: `re_mock_${Date.now()}`, mock: true };
    }
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...(amountDollars !== undefined ? { amount: Math.round(amountDollars * 100) } : {}),
    });
    return { id: refund.id, mock: false };
  },

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    if (!stripe || !config.stripe.webhook_secret) {
      throw new Error('Stripe webhooks are not configured');
    }
    return stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhook_secret);
  },
};
