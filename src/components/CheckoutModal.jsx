import React, { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, CreditCard, ShieldCheck, MapPin, CheckCircle2, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { getStripe, api, isStripeConfigured } from '../lib/stripe';

const stripePromise = getStripe();

// Stripe Elements appearance tuned to the Relove palette.
const appearance = {
  theme: 'flat',
  variables: {
    colorPrimary: '#3D5A50',
    colorText: '#1E2824',
    colorBackground: '#ffffff',
    borderRadius: '10px',
    fontFamily: 'Inter, sans-serif'
  }
};

/**
 * Inner payment form. Rendered inside <Elements> once we have a clientSecret,
 * so it can use the Stripe hooks. Confirms the PaymentIntent inline.
 */
function PaymentStep({ total, onBack, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError('');

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'Please check your payment details.');
      setSubmitting(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required'
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment could not be completed.');
      setSubmitting(false);
      return;
    }

    if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
      onSuccess();
    } else {
      setError('Payment was not completed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="form-fields-stack">
      <h3 className="checkout-step-heading">
        <CreditCard size={16} style={{ color: 'var(--terracotta)' }} />
        <span>Payment</span>
      </h3>

      {error && (
        <div className="account-alert error">
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <PaymentElement options={{ layout: 'tabs' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px' }}>
        <button type="button" onClick={onBack} className="btn-secondary" style={{ padding: '12px 18px' }} disabled={submitting}>
          Back
        </button>
        <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px' }} disabled={!stripe || submitting}>
          {submitting ? (
            <><Loader2 size={14} className="spin" /><span>Processing…</span></>
          ) : (
            <span>Securely Pay ${total.toFixed(2)}</span>
          )}
        </button>
      </div>

      <p className="checkout-stripe-note">
        <ShieldCheck size={14} style={{ flexShrink: 0 }} />
        <span>Payments are processed by Stripe. Your card details never touch Relove's servers.</span>
      </p>
    </form>
  );
}

export default function CheckoutModal({ listing, onClose, onPaymentSuccess, cartItems = [], account = {} }) {
  const [step, setStep] = useState(1);

  // Shipping details prefilled from the saved account.
  const [fullName, setFullName] = useState(account.fullName || 'Alex Mercer');
  const [address, setAddress] = useState(account.street || '42 Vintage Lane');
  const [city, setCity] = useState(account.city || 'Retroville');
  const [zip, setZip] = useState(account.postalCode || '90210');

  // Stripe PaymentIntent state
  const [clientSecret, setClientSecret] = useState('');
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentError, setIntentError] = useState('');

  // Cart summary math
  const itemsList = cartItems.length > 0 ? cartItems : (listing ? [listing] : []);
  const itemsSubtotal = itemsList.reduce((acc, item) => acc + item.price, 0);
  const itemsShipping = itemsList.reduce((acc, item) => acc + item.shipping, 0);
  const itemsTotal = itemsSubtotal + itemsShipping;

  // Create a PaymentIntent when the buyer reaches the payment step.
  useEffect(() => {
    if (step !== 2 || clientSecret || !isStripeConfigured) return;
    let cancelled = false;
    setIntentLoading(true);
    setIntentError('');
    api('/api/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({
        items: itemsList.map((i) => ({ id: i.id, price: i.price, shipping: i.shipping, title: i.title }))
      })
    })
      .then((data) => {
        if (!cancelled) setClientSecret(data.clientSecret);
      })
      .catch((err) => {
        if (!cancelled) {
          setIntentError(
            err.code === 'stripe_not_configured'
              ? 'Stripe keys not added yet — add them to server/.env to take payments.'
              : `Could not start payment: ${err.message}. Is the API server running?`
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIntentLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const goToPayment = (e) => {
    e.preventDefault();
    if (!fullName || !address || !city || !zip) {
      alert('Please complete the shipping address fields!');
      return;
    }
    setStep(2);
  };

  const handleSuccess = () => {
    setStep(3);
    setTimeout(() => onPaymentSuccess(itemsList), 100);
  };

  return (
    <div className="modal-overlay">
      <div className="checkout-modal-wrapper">

        {step < 3 && (
          <button onClick={onClose} className="modal-close-btn" title="Cancel Checkout">
            <X size={18} />
          </button>
        )}

        {/* Left: Checkout form pane */}
        <div className="checkout-left-form">
          <div className="wizard-header" style={{ marginBottom: '15px' }}>
            <div className="wizard-header-icon-box">
              <CreditCard size={18} />
            </div>
            <h2 className="wizard-header-title">Secured Checkout</h2>
          </div>

          {step < 3 && (
            <div className="wizard-steps-timeline" style={{ padding: '8px 16px', background: 'transparent', border: 'none', justifyContent: 'flex-start', gap: '8px', marginBottom: '15px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: step === 1 ? 'var(--sage)' : 'var(--success)' }}>1. Shipping</span>
              <ChevronRight size={10} style={{ color: 'var(--gray-300)' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: step === 2 ? 'var(--sage)' : 'var(--gray-400)' }}>2. Payment</span>
              <ChevronRight size={10} style={{ color: 'var(--gray-300)' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--gray-400)' }}>3. Success</span>
            </div>
          )}

          {/* STEP 1: Shipping */}
          {step === 1 && (
            <form onSubmit={goToPayment} className="form-fields-stack">
              <h3 className="checkout-step-heading">
                <MapPin size={16} style={{ color: 'var(--terracotta)' }} />
                <span>Delivery Address</span>
              </h3>

              <div>
                <label className="form-label-title">Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="form-input" required />
              </div>
              <div>
                <label className="form-label-title">Street Address</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="form-input" required />
              </div>
              <div className="form-grid-2cols">
                <div>
                  <label className="form-label-title">City</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="form-input" required />
                </div>
                <div>
                  <label className="form-label-title">Postal/Zip Code</label>
                  <input type="text" value={zip} onChange={(e) => setZip(e.target.value)} className="form-input" required />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', marginTop: '24px' }}>
                <span>Continue to Payment</span>
                <ChevronRight size={14} />
              </button>
            </form>
          )}

          {/* STEP 2: Payment (Stripe) */}
          {step === 2 && (
            <div className="form-fields-stack">
              {!isStripeConfigured ? (
                <div className="checkout-stripe-blocker">
                  <AlertCircle size={26} style={{ color: 'var(--terracotta)' }} />
                  <h4>Stripe isn't set up yet</h4>
                  <p>Add <code>VITE_STRIPE_PUBLISHABLE_KEY</code> to <code>.env</code> and your secret key to <code>server/.env</code>, then restart.</p>
                  <button onClick={() => setStep(1)} className="btn-secondary" style={{ padding: '10px 18px' }}>Back</button>
                </div>
              ) : intentLoading ? (
                <div className="checkout-stripe-blocker">
                  <Loader2 size={26} className="spin" style={{ color: 'var(--sage)' }} />
                  <p>Starting secure payment…</p>
                </div>
              ) : intentError ? (
                <div className="checkout-stripe-blocker">
                  <AlertCircle size={26} style={{ color: 'var(--terracotta)' }} />
                  <h4>Couldn't start payment</h4>
                  <p>{intentError}</p>
                  <button onClick={() => setStep(1)} className="btn-secondary" style={{ padding: '10px 18px' }}>Back</button>
                </div>
              ) : clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
                  <PaymentStep total={itemsTotal} onBack={() => setStep(1)} onSuccess={handleSuccess} />
                </Elements>
              ) : null}
            </div>
          )}

          {/* STEP 3: Success */}
          {step === 3 && (
            <div className="success-screen-wrapper">
              <div className="success-screen-icon-box">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="success-screen-title">Payment Received!</h3>
                <p className="success-screen-subtitle">Your order is confirmed.</p>
              </div>
              <div className="success-screen-details-card">
                <p><b>Thank you for your purchase!</b></p>
                <p>Your payment is held securely in escrow. We have notified the sellers. They have 5 days to hand the packages to carriers.</p>
                <p style={{ paddingTop: '8px', fontWeight: 'bold', color: 'var(--sage)', cursor: 'pointer', textDecoration: 'underline' }} onClick={onClose}>
                  Check Order status in Buyer Portal →
                </p>
              </div>
              <button type="button" onClick={onClose} className="btn-primary" style={{ borderRadius: '50px', padding: '10px 24px', fontSize: '0.75rem' }}>
                Back to Marketplace
              </button>
            </div>
          )}
        </div>

        {/* Right: Order summary */}
        <div className="checkout-right-summary">
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--charcoal)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Summary</h3>

            <div className="summary-items-list">
              {itemsList.map((item, index) => (
                <div key={index} className="summary-item-card">
                  <img src={item.image} alt={item.title} className="summary-item-img" />
                  <div style={{ flex: '1', minWidth: '0' }}>
                    <h4 className="summary-item-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h4>
                    <p className="summary-item-sub">{item.brand} • Size {item.size}</p>
                  </div>
                  <span className="summary-item-price">${item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="summary-fees-table">
              <div className="fee-row">
                <span>Subtotal</span>
                <span>${itemsSubtotal.toFixed(2)}</span>
              </div>
              <div className="fee-row">
                <span>Shipping</span>
                <span>{itemsShipping > 0 ? `$${itemsShipping.toFixed(2)}` : 'FREE'}</span>
              </div>
              <div className="fee-row">
                <span>Relove Protection Fee</span>
                <span>FREE</span>
              </div>
              <div className="fee-row-total">
                <span>Total Due</span>
                <span className="total-price-color">${itemsTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: '14px', marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.65rem', color: 'var(--gray-400)', lineHeight: '1.4' }}>
              <ShieldCheck size={20} style={{ flexShrink: 0, color: 'var(--gray-400)' }} />
              <span>Payments are processed by Stripe with full buyer protection. Card details are never stored by Relove.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
