import React, { useState, useEffect } from 'react';
import {
  X, User, MapPin, CreditCard, Landmark, ShieldCheck,
  Check, ArrowRight, AlertCircle, ExternalLink, Loader2
} from 'lucide-react';
import { api, isStripeConfigured } from '../lib/stripe';

/**
 * Account onboarding / details form.
 *
 * Non-sensitive fields (name, contact, shipping) are edited here and saved to
 * localStorage by the parent. Money-related setup is delegated to Stripe:
 *   - Buyer card payment is collected at checkout via the Payment Element.
 *   - Seller payouts run through Stripe Connect onboarding (button below).
 *
 * Props:
 *   account          current account object
 *   currentRole      guest | buyer | seller | dual
 *   context          'buy' | 'sell' | null  (why the form was opened)
 *   onClose()        dismiss without saving
 *   onSave(account)  persist + continue the pending buy/sell action
 *   onUpdateAccount(patch)  persist a partial update WITHOUT closing (used by Connect)
 */
export default function AccountDetails({
  account,
  currentRole,
  context,
  onClose,
  onSave,
  onUpdateAccount
}) {
  const isSeller = currentRole === 'seller' || currentRole === 'dual';

  const [form, setForm] = useState({
    fullName: account.fullName || '',
    email: account.email || '',
    phone: account.phone || '',
    street: account.street || '',
    city: account.city || '',
    postalCode: account.postalCode || '',
    country: account.country || ''
  });
  const [error, setError] = useState('');

  // Stripe Connect state
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [payoutStatus, setPayoutStatus] = useState({
    payoutsEnabled: account.payoutsEnabled,
    detailsSubmitted: false
  });

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  // If the seller already started onboarding, refresh their live status on open.
  useEffect(() => {
    let cancelled = false;
    if (isSeller && account.stripeAccountId && isStripeConfigured) {
      api(`/api/connect/account-status/${account.stripeAccountId}`)
        .then((s) => {
          if (cancelled) return;
          setPayoutStatus(s);
          if (s.payoutsEnabled !== account.payoutsEnabled) {
            onUpdateAccount({ payoutsEnabled: s.payoutsEnabled });
          }
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contextTitle =
    context === 'buy'
      ? 'Complete your account to check out'
      : context === 'sell'
        ? 'Complete your account to list an item'
        : 'Account Details';

  const contextSubtitle =
    context === 'buy'
      ? 'We need your contact and delivery details before you can buy.'
      : context === 'sell'
        ? 'Add your details (and connect payouts) before you start selling.'
        : 'Manage the details tied to your Relove account.';

  const handleSubmit = (e) => {
    e.preventDefault();
    const required = ['fullName', 'email', 'phone', 'street', 'city', 'postalCode', 'country'];
    const missing = required.filter((f) => !String(form[f]).trim());
    if (missing.length) {
      setError('Please fill out all contact and shipping fields.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    onSave({ ...account, ...form });
  };

  const handleConnectPayouts = async () => {
    setConnectError('');
    setConnecting(true);
    try {
      let accountId = account.stripeAccountId;
      if (!accountId) {
        const created = await api('/api/connect/create-account', {
          method: 'POST',
          body: JSON.stringify({ email: form.email })
        });
        accountId = created.accountId;
      }
      // Persist the form + account id BEFORE we redirect away to Stripe.
      onUpdateAccount({ ...form, stripeAccountId: accountId });
      const { url } = await api('/api/connect/onboarding-link', {
        method: 'POST',
        body: JSON.stringify({ accountId })
      });
      window.location.href = url;
    } catch (err) {
      setConnectError(
        err.code === 'stripe_not_configured'
          ? 'Stripe keys not added yet — see server/.env.'
          : err.message
      );
      setConnecting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="wizard-modal-box account-modal-box">
        <button onClick={onClose} className="modal-close-btn" title="Close">
          <X size={18} />
        </button>

        {/* Header */}
        <div className="wizard-header">
          <div className="wizard-header-icon-box">
            <User size={18} />
          </div>
          <div>
            <h2 className="wizard-header-title">{contextTitle}</h2>
            <p className="wizard-header-subtitle">{contextSubtitle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-fields-stack">
          {error && (
            <div className="account-alert error">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Personal & contact */}
          <div className="account-section">
            <div className="account-section-title">
              <User size={14} />
              <span>Personal &amp; Contact</span>
            </div>
            <div>
              <label className="form-label-title">Full Name</label>
              <input type="text" className="form-input" placeholder="Alex Mercer"
                value={form.fullName} onChange={set('fullName')} required />
            </div>
            <div className="form-grid-2cols">
              <div>
                <label className="form-label-title">Email</label>
                <input type="email" className="form-input" placeholder="you@email.com"
                  value={form.email} onChange={set('email')} required />
              </div>
              <div>
                <label className="form-label-title">Phone</label>
                <input type="tel" className="form-input" placeholder="+1 555 000 1234"
                  value={form.phone} onChange={set('phone')} required />
              </div>
            </div>
          </div>

          {/* Shipping address */}
          <div className="account-section">
            <div className="account-section-title">
              <MapPin size={14} />
              <span>Shipping Address</span>
            </div>
            <div>
              <label className="form-label-title">Street Address</label>
              <input type="text" className="form-input" placeholder="42 Vintage Lane"
                value={form.street} onChange={set('street')} required />
            </div>
            <div className="form-grid-2cols">
              <div>
                <label className="form-label-title">City</label>
                <input type="text" className="form-input" placeholder="Retroville"
                  value={form.city} onChange={set('city')} required />
              </div>
              <div>
                <label className="form-label-title">Postal / Zip Code</label>
                <input type="text" className="form-input" placeholder="90210"
                  value={form.postalCode} onChange={set('postalCode')} required />
              </div>
            </div>
            <div>
              <label className="form-label-title">Country</label>
              <input type="text" className="form-input" placeholder="United States"
                value={form.country} onChange={set('country')} required />
            </div>
          </div>

          {/* Payment method — handled by Stripe at checkout */}
          <div className="account-section">
            <div className="account-section-title">
              <CreditCard size={14} />
              <span>Payment Method</span>
            </div>
            <div className="account-info-card">
              <ShieldCheck size={18} style={{ flexShrink: 0, color: 'var(--success)' }} />
              <p>
                Card payments are collected securely by <b>Stripe</b> when you check out.
                Nothing to enter here — Relove never stores your card details.
              </p>
            </div>
          </div>

          {/* Seller payouts — Stripe Connect */}
          {isSeller && (
            <div className="account-section">
              <div className="account-section-title">
                <Landmark size={14} />
                <span>Seller Payouts</span>
              </div>

              {payoutStatus.payoutsEnabled ? (
                <div className="account-info-card success">
                  <Check size={18} style={{ flexShrink: 0, color: 'var(--success)' }} />
                  <p><b>Payouts active.</b> Stripe will send your sales earnings to your bank.</p>
                </div>
              ) : (
                <>
                  <div className="account-info-card">
                    <Landmark size={18} style={{ flexShrink: 0, color: 'var(--sage)' }} />
                    <p>
                      Get paid for your sales. <b>Stripe</b> securely handles your bank
                      details and identity verification — Relove never sees them.
                    </p>
                  </div>

                  {connectError && (
                    <div className="account-alert error">
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      <span>{connectError}</span>
                    </div>
                  )}

                  {!isStripeConfigured ? (
                    <p className="account-hint">
                      Add your Stripe keys (<code>.env</code> + <code>server/.env</code>) to enable payout onboarding.
                    </p>
                  ) : (
                    <button type="button" onClick={handleConnectPayouts}
                      className="btn-secondary account-connect-btn" disabled={connecting}>
                      {connecting ? (
                        <><Loader2 size={14} className="spin" /><span>Redirecting to Stripe…</span></>
                      ) : (
                        <>
                          <span>{account.stripeAccountId ? 'Continue payout setup' : 'Set up payouts with Stripe'}</span>
                          <ExternalLink size={14} />
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="wizard-footer-actions">
            <button type="button" onClick={onClose} className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '10px 16px' }}>
              Cancel
            </button>
            <button type="submit" className="btn-accent"
              style={{ fontSize: '0.75rem', padding: '10px 20px' }}>
              <span>Save &amp; Continue</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
