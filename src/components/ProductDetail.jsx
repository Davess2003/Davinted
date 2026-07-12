import React, { useState } from 'react';
import { X, ShieldCheck, Heart, MessageSquare, Tag, Award, User, ShoppingBag } from 'lucide-react';

export default function ProductDetail({ 
  listing, 
  onClose, 
  isLiked, 
  onToggleLike, 
  currentRole, 
  onBuyNow, 
  onStartChat, 
  onAddToCart 
}) {
  const [offerValue, setOfferValue] = useState('');
  const [offerOpen, setOfferOpen] = useState(false);

  const { id, title, price, shipping, brand, size, condition, category, description, image, owner, ownerAvatar, likes, isSold } = listing;

  const handleLike = () => {
    if (currentRole === 'guest') {
      alert("Please login/switch to Buyer mode to like items!");
      return;
    }
    onToggleLike(id);
  };

  const handleOfferSubmit = (e) => {
    e.preventDefault();
    const parsedOffer = parseFloat(offerValue);
    if (isNaN(parsedOffer) || parsedOffer <= 0) {
      alert("Please enter a valid offer amount!");
      return;
    }
    if (parsedOffer >= price) {
      alert(`Your offer ($${parsedOffer}) must be lower than the asking price ($${price})! Just use 'Buy Now'.`);
      return;
    }
    onStartChat(listing, parsedOffer);
    setOfferOpen(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-wrapper">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="modal-close-btn"
          title="Close Modal"
        >
          <X size={18} />
        </button>

        {/* Left Side: Large Product Image */}
        <div className="modal-media-side">
          <img 
            src={image} 
            alt={title} 
            className="modal-media-img"
          />
          {isSold && (
            <div className="product-card-sold-overlay">
              <span className="sold-overlay-tag" style={{ fontSize: '1rem', padding: '10px 20px' }}>
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Information Panel */}
        <div className="modal-info-side">
          
          {/* Header Info */}
          <div className="modal-info-header">
            <span className="brand-label">{brand}</span>
            <h2 className="modal-info-title">{title}</h2>
            
            <div className="modal-price-box">
              <span className="modal-price-bold">${price.toFixed(2)}</span>
              <span className="modal-shipping-text">
                {shipping > 0 ? `+ $${shipping.toFixed(2)} shipping` : 'Free shipping'}
              </span>
            </div>
          </div>

          {/* Item Specs Details */}
          <div className="modal-specs-grid">
            <div className="spec-cell">
              <span className="spec-cell-label">Size</span>
              <span className="spec-cell-value">{size}</span>
            </div>
            <div className="spec-cell">
              <span className="spec-cell-label">Condition</span>
              <span className="spec-cell-value">{condition}</span>
            </div>
            <div className="spec-cell">
              <span className="spec-cell-label">Category</span>
              <span className="spec-cell-value">{category}</span>
            </div>
            <div className="spec-cell">
              <span className="spec-cell-label">Added</span>
              <span className="spec-cell-value">Recently</span>
            </div>
          </div>

          {/* Description */}
          <div className="modal-desc-box">
            <h4 className="modal-desc-title">Description</h4>
            <p className="modal-desc-text">
              {description}
            </p>
          </div>

          {/* Seller Profile Summary */}
          <div className="seller-profile-card">
            <h4 className="seller-card-title">Seller Information</h4>
            <div className="seller-card-body">
              <div className="seller-card-left">
                <img 
                  src={ownerAvatar} 
                  alt={owner} 
                  className="seller-card-avatar"
                />
                <div>
                  <h5 className="seller-card-username">{owner}</h5>
                  <div className="seller-card-stars">
                    <span className="rating-star-color">★ 4.8</span>
                    <span> • (24 reviews)</span>
                  </div>
                </div>
              </div>
              <div className="seller-card-right">
                <span className="seller-card-label">Member Since</span>
                <span className="seller-card-value">2025</span>
              </div>
            </div>
          </div>

          {/* Transaction Controls */}
          {!isSold ? (
            <div className="modal-actions-container">
              
              {/* Buyer Operations */}
              {currentRole !== 'guest' ? (
                <>
                  <div className="action-buttons-row">
                    <button 
                      onClick={() => onBuyNow(listing)}
                      className="btn-primary"
                      style={{ padding: '12px' }}
                    >
                      <ShoppingBag size={16} />
                      <span>Buy Now</span>
                    </button>
                    
                    <button 
                      onClick={() => setOfferOpen(!offerOpen)}
                      className="btn-secondary"
                      style={{ padding: '12px' }}
                    >
                      <Tag size={16} />
                      <span>Make Offer</span>
                    </button>
                  </div>

                  {offerOpen && (
                    <form onSubmit={handleOfferSubmit} className="nego-offer-input-box">
                      <div className="nego-input-wrapper">
                        <span className="nego-dollar-sign">$</span>
                        <input
                          type="number"
                          placeholder="Your offer"
                          value={offerValue}
                          onChange={(e) => setOfferValue(e.target.value)}
                          className="nego-input-field"
                          max={price - 0.01}
                          step="0.01"
                          required
                        />
                      </div>
                      <button 
                        type="submit"
                        className="btn-accent"
                        style={{ padding: '8px 16px', fontSize: '0.75rem' }}
                      >
                        Submit
                      </button>
                    </form>
                  )}

                  <button 
                    onClick={() => onStartChat(listing)}
                    className="btn-secondary"
                    style={{ borderStyle: 'dashed', padding: '10px' }}
                  >
                    <MessageSquare size={16} />
                    <span>Message Seller</span>
                  </button>
                </>
              ) : (
                <div className="guest-notice-banner">
                  Switch to <b>Buyer Mode</b> or <b>Dual Mode</b> using the dropdown in the header to negotiate or purchase this item.
                </div>
              )}

              {/* Protection Guarantee */}
              <div className="buyer-protection-banner">
                <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <p>
                  <b>Buyer Protection:</b> Get a refund if your item doesn't arrive, is damaged, or is significantly not as described.
                </p>
              </div>

            </div>
          ) : (
            <div className="guest-notice-banner" style={{ background: '#FEF2F2', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#EF4444', fontWeight: 'bold' }}>
              This item has been purchased and is no longer available.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
