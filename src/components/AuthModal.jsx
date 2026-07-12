import React, { useState } from 'react';
import { X, Mail, Lock, User, AtSign, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { db } from '../lib/db';

/**
 * Sign-in / sign-up modal backed by Supabase Auth.
 * onAuthed() fires once a session is established (App reacts to the auth state
 * change too, but this lets us close the modal / continue a pending action).
 */
export default function AuthModal({ onClose, onAuthed }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        // If a previous signup for this email was never confirmed, Supabase
        // won't resend the confirmation. Clear that stuck account first so the
        // signUp below creates a fresh user and sends a new confirmation email.
        try {
          await db.resetUnconfirmed(email);
        } catch {
          /* backend not configured / not reachable — proceed with normal signup */
        }

        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username || email.split('@')[0],
              full_name: fullName
            }
          }
        });
        if (err) throw err;
        if (data.session) {
          onAuthed?.();
        } else {
          // Email confirmation is enabled on the project.
          setNotice('Account created! Check your email to confirm, then sign in.');
          setMode('login');
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        onAuthed?.();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="wizard-modal-box account-modal-box" style={{ maxWidth: '440px' }}>
        <button onClick={onClose} className="modal-close-btn" title="Close">
          <X size={18} />
        </button>

        <div className="wizard-header">
          <div className="wizard-header-icon-box">
            <User size={18} />
          </div>
          <div>
            <h2 className="wizard-header-title">{mode === 'login' ? 'Welcome back' : 'Join Relove'}</h2>
            <p className="wizard-header-subtitle">
              {mode === 'login' ? 'Sign in to buy, sell and chat.' : 'Create an account to start trading.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-fields-stack">
          {error && (
            <div className="account-alert error">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}
          {notice && (
            <div className="account-alert success">
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{notice}</span>
            </div>
          )}

          {mode === 'signup' && (
            <div className="form-grid-2cols">
              <div>
                <label className="form-label-title"><User size={12} /> Full Name</label>
                <input type="text" className="form-input" placeholder="Alex Mercer"
                  value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <label className="form-label-title"><AtSign size={12} /> Username</label>
                <input type="text" className="form-input" placeholder="relove_curator"
                  value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
            </div>
          )}

          <div>
            <label className="form-label-title"><Mail size={12} /> Email</label>
            <input type="email" className="form-input" placeholder="you@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="form-label-title"><Lock size={12} /> Password</label>
            <input type="password" className="form-input" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>

          <button type="submit" className="btn-accent" style={{ width: '100%', padding: '12px', marginTop: '8px' }} disabled={loading}>
            {loading ? (
              <><Loader2 size={14} className="spin" /><span>Please wait…</span></>
            ) : (
              <><span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span><ArrowRight size={14} /></>
            )}
          </button>

          <p className="auth-switch">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button type="button" className="auth-switch-btn"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setNotice(''); }}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
