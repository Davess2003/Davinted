import React, { useState } from 'react';
import {
  User, ShoppingBag, Tag, Heart, Wallet,
  Award, ArrowUpRight, ArrowDownLeft,
  CheckCircle, Play, Settings, AlertCircle
} from 'lucide-react';

export default function Dashboard({
  currentRole,
  listings,
  orders,
  likedListings,
  walletBalance,
  onWithdrawFunds,
  onAddFunds,
  onRemoveListing,
  onStepOrderTracking,
  onViewListingDetail,
  account = {},
  accountComplete = false,
  onOpenAccount
}) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Wallet states
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [depositAmt, setDepositAmt] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletMessage, setWalletMessage] = useState('');

  // Seller metrics
  const myListings = listings.filter(l => l.owner === 'relove_curator');
  const activeListings = myListings.filter(l => !l.isSold);
  const soldListings = myListings.filter(l => l.isSold);
  const totalEarnings = soldListings.reduce((sum, item) => sum + item.price, 0);

  // SVG Chart data
  const chartData = [
    { label: 'Feb', value: 45 },
    { label: 'Mar', value: 80 },
    { label: 'Apr', value: 165 },
    { label: 'May', value: 110 },
    { label: 'Jun', value: 185 },
    { label: 'Jul', value: totalEarnings > 0 ? totalEarnings + 80 : 120 }
  ];

  // SVG parameters
  const svgWidth = 500;
  const svgHeight = 110;
  const maxVal = Math.max(...chartData.map(d => d.value)) * 1.2;
  const points = chartData.map((d, index) => {
    const x = (index / (chartData.length - 1)) * (svgWidth - 40) + 20;
    const y = svgHeight - (d.value / maxVal) * (svgHeight - 30) - 10;
    return { x, y, label: d.label, val: d.value };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`;

  const handleWithdraw = (e) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmt);
    if (isNaN(amt) || amt <= 0) return;
    if (amt > walletBalance) {
      alert("Insufficient funds in your wallet!");
      return;
    }
    setWalletLoading(true);
    setWalletMessage('');
    setTimeout(() => {
      onWithdrawFunds(amt);
      setWalletLoading(false);
      setWalletMessage(`Successfully withdrew $${amt.toFixed(2)} to your bank account.`);
      setWithdrawAmt('');
    }, 1200);
  };

  const handleDeposit = (e) => {
    e.preventDefault();
    const amt = parseFloat(depositAmt);
    if (isNaN(amt) || amt <= 0) return;
    setWalletLoading(true);
    setWalletMessage('');
    setTimeout(() => {
      onAddFunds(amt);
      setWalletLoading(false);
      setWalletMessage(`Successfully added $${amt.toFixed(2)} mock credits.`);
      setDepositAmt('');
    }, 1000);
  };

  return (
    <div className="max-width-container dashboard-layout">
      
      {/* SIDEBAR NAVIGATION */}
      <div className="dashboard-sidebar-side">
        
        {/* User Mini Card */}
        <div className="dashboard-profile-box">
          <img 
            src="https://api.dicebear.com/7.x/adventurer/svg?seed=Alex" 
            alt="Alex" 
            className="profile-box-avatar"
          />
          <div className="profile-box-info">
            <h3 className="profile-box-name">{account.fullName || 'Alex Mercer'}</h3>
            <span className="profile-box-username">@relove_curator</span>
            <div className="profile-box-rating">
              <span className="rating-star-color">★ 4.8</span>
              <span>• (42 reviews)</span>
            </div>
          </div>
        </div>

        {/* Account details entry point */}
        <button onClick={onOpenAccount} className="dashboard-account-btn">
          <Settings size={14} />
          <span>Account Details</span>
          {!accountComplete && (
            <span className="account-incomplete-pill">
              <AlertCircle size={11} />
              Incomplete
            </span>
          )}
        </button>

        {/* Tab Items */}
        <div className="dashboard-nav-panel">
          <button
            onClick={() => setActiveTab('overview')}
            className={`dashboard-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
          >
            <User size={14} />
            <span>Overview Portal</span>
          </button>

          {(currentRole === 'buyer' || currentRole === 'dual') && (
            <button
              onClick={() => setActiveTab('buyer')}
              className={`dashboard-nav-btn ${activeTab === 'buyer' ? 'active' : ''}`}
            >
              <ShoppingBag size={14} />
              <span>Buyer Hub</span>
            </button>
          )}

          {(currentRole === 'seller' || currentRole === 'dual') && (
            <button
              onClick={() => setActiveTab('seller')}
              className={`dashboard-nav-btn ${activeTab === 'seller' ? 'active' : ''}`}
            >
              <Tag size={14} />
              <span>Seller Hub</span>
            </button>
          )}

          {(currentRole !== 'guest') && (
            <button
              onClick={() => setActiveTab('wallet')}
              className={`dashboard-nav-btn ${activeTab === 'wallet' ? 'active' : ''}`}
            >
              <Wallet size={14} />
              <span>Wallet & Earnings</span>
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="dashboard-main-content">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="dashboard-section-header">
              <h2 className="dashboard-section-title">Welcome back, Alex!</h2>
              <p className="dashboard-section-subtitle">Here is your account summary across all portals.</p>
            </div>

            {/* Quick Metrics Grid */}
            <div className="metrics-cards-grid">
              <div className="metric-card">
                <span className="metric-card-label">Wallet Balance</span>
                <span className="metric-card-value">${walletBalance.toFixed(2)}</span>
              </div>
              <div className="metric-card">
                <span className="metric-card-label">Wishlisted</span>
                <span className="metric-card-value" style={{ color: 'var(--terracotta)' }}>{likedListings.length} items</span>
              </div>
              <div className="metric-card">
                <span className="metric-card-label">Active Sales</span>
                <span className="metric-card-value">{activeListings.length} listed</span>
              </div>
              <div className="metric-card">
                <span className="metric-card-label">Orders Bought</span>
                <span className="metric-card-value">{orders.length} orders</span>
              </div>
            </div>

            {/* Dashboard Tips */}
            <div className="dashboard-banner-box">
              <div className="banner-box-header">
                <Award size={16} />
                <span>Circular Fashion Tip</span>
              </div>
              <p className="banner-box-text">
                By purchasing pre-loved garments on Relove, you saved approximately <b>18.4 kg of CO2</b> emissions this month compared to buying new clothing. Share your profile status with friends to promote sustainable lifestyles!
              </p>
            </div>

            {/* Recent Account Log */}
            <div className="activity-log-card">
              <h3 className="activity-log-title">Recent Activity</h3>
              <div className="activity-log-timeline">
                <div className="timeline-item">
                  <div className="timeline-bullet plus">+</div>
                  <div>
                    <p className="timeline-content-title">Listed a new product</p>
                    <p className="timeline-content-time">Recently added to your listings</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-bullet heart">♥</div>
                  <div>
                    <p className="timeline-content-title">Liked retro sneakers</p>
                    <p className="timeline-content-time">Added to your wishlist</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* BUYER PORTAL */}
        {activeTab === 'buyer' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Orders Summary */}
            <div>
              <div className="dashboard-section-header">
                <h2 className="dashboard-section-title">Purchased Orders</h2>
                <p className="dashboard-section-subtitle">Track delivery states and check transaction receipts.</p>
              </div>

              {orders.length === 0 ? (
                <div className="guest-notice-banner">
                  You haven't bought anything yet! Explore items on the main feed to purchase.
                </div>
              ) : (
                <div className="orders-list-wrapper">
                  {orders.map((ord) => {
                    const activeIndex = ord.trackingHistory.findIndex(h => !h.done) === -1 
                      ? ord.trackingHistory.length - 1 
                      : ord.trackingHistory.findIndex(h => !h.done) - 1;
                    const fillPercent = (activeIndex / (ord.trackingHistory.length - 1)) * 100;

                    return (
                      <div key={ord.id} className="order-box">
                        
                        {/* Order info header */}
                        <div className="order-box-header">
                          <div className="order-header-item">
                            <img src={ord.image} alt={ord.title} className="order-item-img" />
                            <div>
                              <h4 className="order-item-title">{ord.title}</h4>
                              <p className="order-item-meta">Seller: {ord.seller} • Price: ${ord.price.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="order-header-codes">
                            <span className="order-code-text">Code: {ord.id}</span>
                            <span className="order-status-pill">
                              {ord.status}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Step Tracker */}
                        <div>
                          <div className="step-tracker">
                            <div 
                              className="step-tracker-line-fill" 
                              style={{ width: `${fillPercent}%` }}
                            ></div>
                            {ord.trackingHistory.map((step, sIdx) => {
                              const isCompleted = sIdx <= activeIndex;
                              const isActive = sIdx === activeIndex + 1;
                              return (
                                <div key={sIdx} className={`step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                                  <div className="step-node">
                                    {isCompleted ? '✓' : sIdx + 1}
                                  </div>
                                  <span className="step-label">{step.title}</span>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Step feedback info details */}
                          <div className="order-status-scan-bar">
                            <div>
                              <span className="scan-bar-label">Latest Scan</span>
                              <span className="scan-bar-value" style={{ display: 'block', marginTop: '2px' }}>
                                {ord.trackingHistory[activeIndex]?.title || 'Order Confirmed'}: 
                                <span className="scan-bar-desc"> {ord.trackingHistory[activeIndex]?.desc || 'Preparing shipping label'}</span>
                              </span>
                            </div>
                            <span className="scan-bar-time">
                              {ord.trackingHistory[activeIndex]?.time || 'Pending Scan'}
                            </span>
                          </div>
                        </div>

                        {/* Simulation trigger */}
                        <div className="simulate-control-row">
                          <button 
                            onClick={() => onStepOrderTracking(ord.id)}
                            className="simulate-step-btn"
                            disabled={ord.status === 'delivered'}
                          >
                            <Play size={10} style={{ fill: 'currentColor' }} />
                            <span>{ord.status === 'delivered' ? 'Delivery Completed' : 'Simulate Next Transit Scan'}</span>
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Saved Wishlist */}
            <div>
              <div className="dashboard-section-header" style={{ marginBottom: '16px' }}>
                <h3 className="dashboard-section-title" style={{ fontSize: '1rem' }}>Wishlisted Items</h3>
                <p className="dashboard-section-subtitle">Items you liked</p>
              </div>

              {likedListings.length === 0 ? (
                <div className="guest-notice-banner">
                  Your wishlist is empty. Tap the heart icon on cards while browsing to save them.
                </div>
              ) : (
                <div className="wishlist-panel-grid">
                  {likedListings.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => onViewListingDetail(item)}
                      className="wishlist-mini-card"
                    >
                      <img src={item.image} alt={item.title} className="wishlist-mini-img" />
                      <div className="wishlist-mini-info">
                        <h4 className="wishlist-mini-title">{item.title}</h4>
                        <span className="wishlist-mini-price">${item.price.toFixed(2)}</span>
                      </div>
                      <span className="wishlist-mini-tag">
                        {item.condition}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* SELLER PORTAL */}
        {activeTab === 'seller' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Earnings Chart SVG */}
            <div className="earnings-chart-card">
              <div className="chart-card-header">
                <div className="chart-card-left">
                  <h3 className="chart-card-title">Earnings Dashboard</h3>
                  <p className="chart-card-subtitle">Performance Over Time</p>
                </div>
                <div className="chart-card-right">
                  <span className="chart-profit-lbl">Total Profit</span>
                  <span className="chart-profit-val">${totalEarnings.toFixed(2)}</span>
                </div>
              </div>

              {/* Custom SVG Bezier Line Chart */}
              <div className="chart-svg-container">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="chart-svg-element">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--sage)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--sage)" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>

                  {/* Area fill */}
                  <path d={areaPath} fill="url(#chartGrad)" />

                  {/* Trend Line */}
                  <path 
                    d={linePath} 
                    fill="none" 
                    stroke="var(--sage)" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />

                  {/* Horizontal Grid lines */}
                  <line x1="20" y1="20" x2="480" y2="20" stroke="var(--gray-200)" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="20" y1="55" x2="480" y2="55" stroke="var(--gray-200)" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="20" y1="90" x2="480" y2="90" stroke="var(--gray-200)" strokeWidth="0.5" strokeDasharray="3,3" />

                  {/* Points circles */}
                  {points.map((p, idx) => (
                    <g key={idx}>
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="3.5" 
                        fill="var(--sage)" 
                        stroke="#FFF" 
                        strokeWidth="1.5" 
                      />
                    </g>
                  ))}
                </svg>
                
                {/* X-axis labels */}
                <div className="chart-axis-labels">
                  {chartData.map((d, i) => (
                    <span key={i}>{d.label}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Listings Manager */}
            <div>
              <div className="dashboard-section-header">
                <h3 className="dashboard-section-title">Your Catalog Listings</h3>
                <p className="dashboard-section-subtitle">Manage item status</p>
              </div>

              {myListings.length === 0 ? (
                <div className="guest-notice-banner">
                  You haven't listed any items. Click "Sell Now" in the header to post.
                </div>
              ) : (
                <div className="seller-listings-list">
                  {myListings.map((item) => (
                    <div 
                      key={item.id}
                      className="seller-listing-item"
                    >
                      <div className="seller-listing-left">
                        <img src={item.image} alt={item.title} className="seller-listing-img" />
                        <div className="seller-listing-info">
                          <h4 className="seller-listing-title">{item.title}</h4>
                          <span className="seller-listing-price">${item.price.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="seller-listing-actions">
                        <span className={`seller-status-badge ${item.isSold ? 'sold' : 'active'}`}>
                          {item.isSold ? 'Sold' : 'Active'}
                        </span>
                        
                        <button 
                          onClick={() => onRemoveListing(item.id)}
                          className="seller-delete-btn"
                          title="Delete Listing"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* WALLET TAB */}
        {activeTab === 'wallet' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Wallet Panel */}
            <div className="wallet-card-panel">
              <div className="wallet-card-left">
                <span className="wallet-card-lbl">Secured Vault Balance</span>
                <h3 className="wallet-card-bal">${walletBalance.toFixed(2)}</h3>
                <span className="wallet-card-subtext">Earnings from sales are automatically credited here.</span>
              </div>
              <div className="wallet-card-icon-box">
                <Wallet size={28} />
              </div>
            </div>

            {/* Notifications */}
            {walletMessage && (
              <div className="wallet-feedback-badge">
                <CheckCircle size={16} style={{ flexShrink: 0 }} />
                <span>{walletMessage}</span>
              </div>
            )}

            {/* Actions Grid */}
            <div className="wallet-actions-grid">
              
              {/* Withdraw Section */}
              <div className="wallet-action-box">
                <h4 className="wallet-action-box-title">
                  <ArrowUpRight size={16} style={{ color: '#EF4444' }} />
                  <span>Withdraw Earnings</span>
                </h4>
                
                <form onSubmit={handleWithdraw} className="wallet-form">
                  <div>
                    <span className="wallet-input-lbl">Amount to Bank</span>
                    <div className="wallet-input-container">
                      <span className="wallet-input-symbol">$</span>
                      <input 
                        type="number"
                        placeholder="0.00"
                        value={withdrawAmt}
                        onChange={(e) => setWithdrawAmt(e.target.value)}
                        className="wallet-input-field"
                        min="0.01"
                        max={walletBalance}
                        step="0.01"
                        required
                        disabled={walletLoading}
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '10px' }}
                    disabled={walletLoading || parseFloat(withdrawAmt) <= 0 || isNaN(parseFloat(withdrawAmt))}
                  >
                    {walletLoading ? 'Processing withdrawal...' : 'Transfer to Account'}
                  </button>
                </form>
              </div>

              {/* Add funds Section */}
              <div className="wallet-action-box">
                <h4 className="wallet-action-box-title">
                  <ArrowDownLeft size={16} style={{ color: 'var(--success)' }} />
                  <span>Add Mock Credits</span>
                </h4>
                
                <form onSubmit={handleDeposit} className="wallet-form">
                  <div>
                    <span className="wallet-input-lbl">Credit Amount</span>
                    <div className="wallet-input-container">
                      <span className="wallet-input-symbol">$</span>
                      <input 
                        type="number"
                        placeholder="e.g. 50.00"
                        value={depositAmt}
                        onChange={(e) => setDepositAmt(e.target.value)}
                        className="wallet-input-field"
                        min="0.01"
                        step="0.01"
                        required
                        disabled={walletLoading}
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn-primary"
                    style={{ fontSize: '0.75rem', padding: '10px' }}
                    disabled={walletLoading || parseFloat(depositAmt) <= 0 || isNaN(parseFloat(depositAmt))}
                  >
                    {walletLoading ? 'Crediting wallet...' : 'Add Mock Funds'}
                  </button>
                </form>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
