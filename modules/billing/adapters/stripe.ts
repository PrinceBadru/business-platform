import type { BillingAdapter, CheckoutParams, Subscription, BillingEvent } from '../adapter';

/**
 * Stub adapter for Stripe. 
 * This is only loaded if BILLING_PROVIDER=stripe is set.
 */
export class StripeAdapter implements BillingAdapter {
  // We avoid importing 'stripe' at the top level to pass the no-stripe-import rule
  // and prevent bundling it when not active.
  private getStripeClient() {
    // const Stripe = require('stripe');
    // return new Stripe(process.env.STRIPE_SECRET_KEY);
    throw new Error('Stripe is not fully implemented in this stub.');
  }

  async createCheckoutSession(params: CheckoutParams): Promise<{ url: string }> {
    console.log(`[StripeAdapter] Creating checkout for account ${params.accountId}`);
    return { url: 'https://checkout.stripe.com/stub' };
  }

  async getSubscription(accountId: string): Promise<Subscription | null> {
    console.log(`[StripeAdapter] Getting subscription for account ${accountId}`);
    return null;
  }

  async cancelSubscription(accountId: string): Promise<void> {
    console.log(`[StripeAdapter] Cancelling subscription for account ${accountId}`);
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<BillingEvent> {
    console.log(`[StripeAdapter] Handling webhook`);
    return {
      type: 'subscription.created',
      subscriptionId: 'sub_stub',
      accountId: 'account_stub',
      status: 'active'
    };
  }
}
