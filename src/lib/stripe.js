import { loadStripe } from '@stripe/stripe-js';

// Base URL of the local Express API (server/index.js).
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4242';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// True once you've added VITE_STRIPE_PUBLISHABLE_KEY to .env. Until then the UI
// shows a friendly "add your keys" state instead of trying to talk to Stripe.
export const isStripeConfigured = Boolean(publishableKey);

// Memoised Stripe.js loader. Returns null until a publishable key is provided.
let stripePromise = null;
export function getStripe() {
  if (!isStripeConfigured) return null;
  if (!stripePromise) stripePromise = loadStripe(publishableKey);
  return stripePromise;
}

// Small fetch helper that always talks JSON and surfaces API errors nicely.
export async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response (e.g. server down)
  }
  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    const err = new Error(message);
    err.code = data && data.code;
    err.status = res.status;
    throw err;
  }
  return data;
}
