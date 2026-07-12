import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dataRoutes from './dataRoutes.js';
import { isSupabaseConfigured } from './supabase.js';

const app = express();
const PORT = process.env.PORT || 4242;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const CURRENCY = (process.env.CURRENCY || 'usd').toLowerCase();

// Stripe is only initialised when a secret key is present. This lets the whole
// app boot and render before you've added your keys — the API routes below
// return a clear 503 until STRIPE_SECRET_KEY is set in server/.env.
const secretKey = process.env.STRIPE_SECRET_KEY;
const stripe = secretKey ? new Stripe(secretKey) : null;

app.use(cors({ origin: CLIENT_URL }));
// Raised limit so base64 image uploads (POST /api/upload) fit; the default is 100kb.
app.use(express.json({ limit: '12mb' }));

// --- Health check (works with or without keys) ---
app.get('/api/health', (req, res) => {
  res.json({ ok: true, stripeConfigured: Boolean(stripe), supabaseConfigured: isSupabaseConfigured });
});

// --- Supabase-backed data API (profiles, listings, likes, orders, chats) ---
app.use('/api', dataRoutes);

// Guard: every route below needs a configured Stripe client.
function requireStripe(req, res, next) {
  if (!stripe) {
    return res.status(503).json({
      error:
        'Stripe is not configured. Add STRIPE_SECRET_KEY to server/.env and restart the server.',
      code: 'stripe_not_configured'
    });
  }
  next();
}

// --- Buyer checkout: create a PaymentIntent for the given items ---
// Amount is recomputed on the server from the item prices the client sends.
// (In a real app you'd look prices up from your DB rather than trusting the
// client — the listings here are mock/client-side, so we recompute from them.)
app.post('/api/create-payment-intent', requireStripe, async (req, res) => {
  try {
    const { items = [], destinationAccountId } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided.' });
    }

    const amountCents = items.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const shipping = Number(item.shipping) || 0;
      return sum + Math.round((price + shipping) * 100);
    }, 0);

    if (amountCents <= 0) {
      return res.status(400).json({ error: 'Order total must be greater than zero.' });
    }

    const params = {
      amount: amountCents,
      currency: CURRENCY,
      automatic_payment_methods: { enabled: true },
      metadata: {
        item_ids: items.map((i) => i.id).join(','),
        item_count: String(items.length)
      }
    };

    // Optional: route the funds to a connected seller account (destination
    // charge) when the whole order belongs to one onboarded seller. Real
    // multi-seller carts would need separate transfers per seller.
    if (destinationAccountId) {
      params.transfer_data = { destination: destinationAccountId };
    }

    const intent = await stripe.paymentIntents.create(params);
    res.json({ clientSecret: intent.client_secret, amount: amountCents, currency: CURRENCY });
  } catch (err) {
    console.error('create-payment-intent failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Seller payouts (Stripe Connect, Express accounts) ---

// Create a connected account for a seller (call once, then reuse the id).
app.post('/api/connect/create-account', requireStripe, async (req, res) => {
  try {
    const { email } = req.body || {};
    const account = await stripe.accounts.create({
      type: 'express',
      email: email || undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      }
    });
    res.json({ accountId: account.id });
  } catch (err) {
    console.error('connect/create-account failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Create a one-time onboarding link the seller is redirected to.
app.post('/api/connect/onboarding-link', requireStripe, async (req, res) => {
  try {
    const { accountId } = req.body || {};
    if (!accountId) return res.status(400).json({ error: 'accountId is required.' });

    const link = await stripe.accountLinks.create({
      account: accountId,
      // Stripe sends the seller back to the app after onboarding.
      refresh_url: `${CLIENT_URL}/?connect=refresh`,
      return_url: `${CLIENT_URL}/?connect=return`,
      type: 'account_onboarding'
    });
    res.json({ url: link.url });
  } catch (err) {
    console.error('connect/onboarding-link failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Poll a connected account's onboarding / payout status.
app.get('/api/connect/account-status/:accountId', requireStripe, async (req, res) => {
  try {
    const account = await stripe.accounts.retrieve(req.params.accountId);
    res.json({
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    });
  } catch (err) {
    console.error('connect/account-status failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[relove-api] listening on http://localhost:${PORT}`);
  console.log(`[relove-api] Stripe ${stripe ? 'configured ✓' : 'NOT configured — add STRIPE_SECRET_KEY to server/.env'}`);
});
