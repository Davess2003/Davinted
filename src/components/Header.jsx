import React, { useState } from 'react';
import { Search, MessageSquare, ShoppingBag, LayoutDashboard, RefreshCw, Sparkles, Plus, LogIn, LogOut } from 'lucide-react';

export default function Header({
  currentRole,
  setCurrentRole,
  setView,
  searchQuery,
  setSearchQuery,
  cartCount,
  openCart,
  unreadCount,
  onOpenUpload,
  walletBalance,
  authEnabled = false,
  isSignedIn = false,
  username,
  onSignIn,
  onSignOut
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const roles = [
    { id: 'guest', label: 'Guest Mode', desc: 'Browse and view items' },
    { id: 'buyer', label: 'Buyer Mode', desc: 'Likes, shopping cart & orders' },
    { id: 'seller', label: 'Seller Mode', desc: 'Earnings & listing management' },
    { id: 'dual', label: 'Dual Mode (Vinted Pro)', desc: 'Full Buyer + Seller capabilities' }
  ];

  return (
    <header className="header">
      <div className="max-width-container header-inner">
        
        {/* Logo */}
        <div className="logo" onClick={() => { setView('feed'); setSearchQuery(''); }}>
          <div className="logo-badge">R</div>
          <span className="logo-text">
            Relove<span style={{ color: 'var(--terracotta)' }}>.</span>
          </span>
        </div>

        {/* Global Search Bar */}
        <div className="search-bar-wrapper">
          <input
            type="text"
            placeholder="Search retro sneakers, vintage coats, accessories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-bar-input"
          />
          <Search className="search-icon-pos" size={16} />
        </div>

        {/* Action Controls */}
        <div className="header-actions">
          
          {/* Quick Role Switcher (hidden for signed-out cloud users) */}
          {(!authEnabled || isSignedIn) && (
          <div className="role-switcher-container">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="role-switcher-btn"
            >
              <RefreshCw size={12} style={{ color: 'var(--sage)' }} />
              <span>Role: <span style={{ textTransform: 'capitalize' }}>{currentRole}</span></span>
            </button>
            
            {profileDropdownOpen && (
              <div className="role-dropdown">
                <div className="role-dropdown-header">Switch Persona</div>
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setCurrentRole(r.id);
                      setProfileDropdownOpen(false);
                    }}
                    className={`role-option-btn ${currentRole === r.id ? 'active' : ''}`}
                  >
                    <span className="role-option-title">
                      {r.id === 'dual' && <Sparkles size={12} style={{ color: 'var(--warning)' }} />}
                      {r.label}
                    </span>
                    <span className="role-option-desc">{r.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Navigation links based on role */}
          {currentRole !== 'guest' && (
            <>
              {/* Inbox */}
              <button 
                onClick={() => setView('chat')} 
                className="nav-icon-btn"
                title="Messages"
              >
                <MessageSquare size={18} />
                {unreadCount > 0 && (
                  <span className="badge-count">{unreadCount}</span>
                )}
              </button>

              {/* Portal/Dashboard */}
              <button 
                onClick={() => setView('dashboard')} 
                className="nav-icon-btn"
                title="Dashboard Portal"
              >
                <LayoutDashboard size={18} />
              </button>

              {/* Wallet indicator if seller or dual */}
              {(currentRole === 'seller' || currentRole === 'dual') && (
                <div 
                  onClick={() => setView('dashboard')} 
                  className="wallet-quick-badge"
                  title="Your Earnings Wallet"
                >
                  <span className="wallet-quick-dot"></span>
                  <span>${walletBalance.toFixed(2)}</span>
                </div>
              )}
            </>
          )}

          {/* Cart Icon (Buyer & Dual Roles) */}
          {(currentRole === 'buyer' || currentRole === 'dual') && (
            <button 
              onClick={openCart} 
              className="nav-icon-btn"
              title="Shopping Cart"
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="badge-count primary">{cartCount}</span>
              )}
            </button>
          )}

          {/* Sell Button / Login Button */}
          {(currentRole === 'seller' || currentRole === 'dual') ? (
            <button
              onClick={onOpenUpload}
              className="btn-accent"
              style={{ fontSize: '0.75rem', padding: '8px 16px' }}
            >
              <Plus size={14} />
              <span>Sell Now</span>
            </button>
          ) : (
            currentRole === 'guest' && !authEnabled && (
              <button
                onClick={() => setCurrentRole('buyer')}
                className="btn-primary"
                style={{ fontSize: '0.75rem', padding: '8px 16px' }}
              >
                <span>Join / Login</span>
              </button>
            )
          )}

          {/* Auth controls (cloud mode) */}
          {authEnabled && !isSignedIn && (
            <button onClick={onSignIn} className="header-auth-btn">
              <LogIn size={14} />
              <span>Sign In</span>
            </button>
          )}
          {authEnabled && isSignedIn && (
            <button onClick={onSignOut} className="header-user-chip" title="Sign out">
              <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {username || 'Account'}
              </span>
              <LogOut size={14} />
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
