// StripeService decides once at module load, from config.stripe.secret_key,
// whether to build a real Stripe client or fall back to mock payments — so
// each test needs a fresh module instance (jest.resetModules) to exercise a
// different config, the same pattern emailService.test.ts uses for its own
// lazily-decided configuration.
const mockConfig = {
  stripe: {
    secret_key: undefined as string | undefined,
    public_key: undefined as string | undefined,
    webhook_secret: undefined as string | undefined,
  },
};

const mockStripeInstance = {
  paymentIntents: { create: jest.fn(), retrieve: jest.fn() },
  refunds: { create: jest.fn() },
  webhooks: { constructEvent: jest.fn() },
};

jest.mock('@config/environment', () => ({ config: mockConfig }));
jest.mock('stripe', () => jest.fn().mockImplementation(() => mockStripeInstance));

function resetConfig() {
  mockConfig.stripe.secret_key = undefined;
  mockConfig.stripe.public_key = undefined;
  mockConfig.stripe.webhook_secret = undefined;
}

function freshStripeService() {
  jest.resetModules();
  jest.clearAllMocks();
  return require('../src/services/stripeService').StripeService;
}

beforeEach(() => {
  resetConfig();
});

describe('StripeService configuration', () => {
  it('is not configured when no secret key is set', () => {
    const StripeService = freshStripeService();
    expect(StripeService.isConfigured()).toBe(false);
  });

  it('treats a key that does not match the sk_test_/sk_live_ shape as unconfigured', () => {
    // A copy-pasted placeholder like this technically starts with sk_test_
    // but isn't a working key — looksLikeRealStripeKey must reject it so
    // the app falls back to mock payments instead of hitting Stripe with
    // credentials that will always fail.
    mockConfig.stripe.secret_key = 'sk_test_dev_key_placeholder';
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const StripeService = freshStripeService();

    expect(StripeService.isConfigured()).toBe(false);
    warnSpy.mockRestore();
  });

  it('is configured when a real-looking secret key is set', () => {
    mockConfig.stripe.secret_key = 'sk_test_' + 'a'.repeat(24);
    const StripeService = freshStripeService();

    expect(StripeService.isConfigured()).toBe(true);
  });
});

describe('StripeService.createPaymentIntent', () => {
  it('returns a mock intent (no real charge) when unconfigured', async () => {
    const StripeService = freshStripeService();

    const intent = await StripeService.createPaymentIntent(49.99);

    expect(intent.mock).toBe(true);
    expect(intent.id).toMatch(/^pi_mock_/);
    expect(mockStripeInstance.paymentIntents.create).not.toHaveBeenCalled();
  });

  it('creates a real payment intent in cents when configured', async () => {
    mockConfig.stripe.secret_key = 'sk_live_' + 'b'.repeat(24);
    mockStripeInstance.paymentIntents.create.mockResolvedValue({
      id: 'pi_123',
      client_secret: 'pi_123_secret',
    });

    const StripeService = freshStripeService();
    const intent = await StripeService.createPaymentIntent(49.99, 'usd', { booking_id: 'b1' });

    expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 4999, currency: 'usd', metadata: { booking_id: 'b1' } }),
    );
    expect(intent).toEqual({ id: 'pi_123', client_secret: 'pi_123_secret', mock: false });
  });
});

describe('StripeService.retrievePaymentIntent', () => {
  it('returns null when unconfigured instead of calling Stripe', async () => {
    const StripeService = freshStripeService();

    const result = await StripeService.retrievePaymentIntent('pi_123');

    expect(result).toBeNull();
    expect(mockStripeInstance.paymentIntents.retrieve).not.toHaveBeenCalled();
  });
});

describe('StripeService.createRefund', () => {
  it('returns a mock refund for a mock payment intent even when Stripe is configured', async () => {
    mockConfig.stripe.secret_key = 'sk_test_' + 'c'.repeat(24);
    const StripeService = freshStripeService();

    const refund = await StripeService.createRefund('pi_mock_12345');

    expect(refund.mock).toBe(true);
    expect(mockStripeInstance.refunds.create).not.toHaveBeenCalled();
  });

  it('creates a real refund for a real payment intent when configured', async () => {
    mockConfig.stripe.secret_key = 'sk_test_' + 'd'.repeat(24);
    mockStripeInstance.refunds.create.mockResolvedValue({ id: 're_123' });

    const StripeService = freshStripeService();
    const refund = await StripeService.createRefund('pi_real_123', 10);

    expect(mockStripeInstance.refunds.create).toHaveBeenCalledWith({
      payment_intent: 'pi_real_123',
      amount: 1000,
    });
    expect(refund).toEqual({ id: 're_123', mock: false });
  });
});

describe('StripeService.constructWebhookEvent', () => {
  it('throws when Stripe or the webhook secret is not configured', () => {
    const StripeService = freshStripeService();

    expect(() => StripeService.constructWebhookEvent(Buffer.from('{}'), 'sig')).toThrow(
      'Stripe webhooks are not configured',
    );
  });

  it('verifies the event via the Stripe SDK when configured', () => {
    mockConfig.stripe.secret_key = 'sk_test_' + 'e'.repeat(24);
    mockConfig.stripe.webhook_secret = 'whsec_test';
    mockStripeInstance.webhooks.constructEvent.mockReturnValue({ type: 'payment_intent.succeeded' });

    const StripeService = freshStripeService();
    const body = Buffer.from('{}');
    const event = StripeService.constructWebhookEvent(body, 'sig');

    expect(mockStripeInstance.webhooks.constructEvent).toHaveBeenCalledWith(body, 'sig', 'whsec_test');
    expect(event).toEqual({ type: 'payment_intent.succeeded' });
  });
});
