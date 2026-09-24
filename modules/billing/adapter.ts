export type Subscription = {
  id: string;
  accountId: string;
  provider: 'stripe' | 'manual' | 'none';
  providerSubscriptionId: string | null;
  planName: string | null;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  currentPeriodEnd: Date | null;
};

export type CheckoutParams = {
  accountId: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
};

export type BillingEvent = {
  type: 'subscription.created' | 'subscription.updated' | 'subscription.deleted';
  subscriptionId: string;
  accountId: string;
  status: string;
};

/**
 * Universal interface for all billing adapters.
 * Ensures the application is not hard-coupled to Stripe.
 */
export interface BillingAdapter {
  createCheckoutSession(params: CheckoutParams): Promise<{ url: string }>;
  getSubscription(accountId: string): Promise<Subscription | null>;
  cancelSubscription(accountId: string): Promise<void>;
  handleWebhook(payload: Buffer, signature: string): Promise<BillingEvent>;
}
