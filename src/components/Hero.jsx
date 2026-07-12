import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Heart, Truck } from 'lucide-react';

export default function Hero({ setSearchQuery }) {
  const popularTags = [
    { name: 'Jackets', label: 'Vintage Jackets' },
    { name: 'Shoes', label: 'Retro Sneakers' },
    { name: 'Knitwear', label: 'Cozy Knits' },
    { name: 'Bags', label: 'Leather Bags' },
    { name: 'Accessories', label: 'Classy Watches' }
  ];

  return (
    <section className="hero">
      {/* Decorative Blur Spheres */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'var(--sage)',
        opacity: '0.03',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-5%',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'var(--terracotta)',
        opacity: '0.05',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }}></div>

      <div className="max-width-container hero-inner">
        {/* Left Content */}
        <div className="hero-left">
          <div className="hero-slogan-badge">
            <Sparkles size={12} style={{ color: 'var(--terracotta)' }} />
            <span>Sustainable Fashion Platform</span>
          </div>

          <h1 className="hero-title">
            Ready to declutter <br />
            your wardrobe?
          </h1>
          
          <p className="hero-desc">
            Buy, sell, and negotiate pre-loved designer and vintage clothing. Join millions of fashion enthusiasts trading circular style.
          </p>

          {/* Action Trigger */}
          <div style={{ marginBottom: '30px' }}>
            <button 
              onClick={() => setSearchQuery('')}
              className="btn-primary"
              style={{ padding: '12px 28px', borderRadius: '50px' }}
            >
              <span>Explore Collection</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Popular Categories */}
          <div className="hero-tags-wrapper">
            <span className="hero-tags-label">Popular:</span>
            {popularTags.map((tag, idx) => (
              <button
                key={idx}
                onClick={() => setSearchQuery(tag.name)}
                className="hero-tag-btn"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Content: Premium Grid Feature Banner */}
        <div className="hero-right">
          <div className="hero-glass-card">
            
            {/* Visual Mini Grid */}
            <div className="hero-card-header">
              <div className="hero-card-icon-box">S</div>
              <div>
                <h4 className="hero-card-title">Relove Guarantee</h4>
                <p className="hero-card-subtitle">Shop secure with buyer protection</p>
              </div>
            </div>

            <div className="hero-glass-card-body hero-card-features">
              <div className="hero-card-feature-item">
                <div className="feature-icon-wrapper terracotta">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h5 className="feature-title">Secured Payments</h5>
                  <p className="feature-desc">Funds held in escrow until item is marked delivered.</p>
                </div>
              </div>

              <div className="hero-card-feature-item">
                <div className="feature-icon-wrapper success">
                  <Truck size={16} />
                </div>
                <div>
                  <h5 className="feature-title">Easy Shipping</h5>
                  <p className="feature-desc">Pre-paid labels printed in one click from your portal.</p>
                </div>
              </div>

              <div className="hero-card-feature-item">
                <div className="feature-icon-wrapper sage">
                  <Heart size={16} />
                </div>
                <div>
                  <h5 className="feature-title">Negotiate & Chat</h5>
                  <p className="feature-desc">Don't settle for the tag price. Make counter-offers directly.</p>
                </div>
              </div>
            </div>

            <div className="hero-card-footer">
              <span>Active Relovers: <b>12,482</b></span>
              <span className="live-dot" title="Live System Online"></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
