import React from 'react';
import { Heart, ZoomIn, ShoppingCart } from 'lucide-react';

export default function ProductCard({ 
  listing, 
  onViewDetails, 
  onToggleLike, 
  isLiked, 
  currentRole,
  onAddToCart
}) {
  const { title, price, shipping, brand, size, condition, image, owner, ownerAvatar, likes, isSold } = listing;

  const handleLikeClick = (e) => {
    e.stopPropagation();
    if (currentRole === 'guest') {
      alert("Please login/switch to Buyer mode to like items!");
      return;
    }
    onToggleLike(listing.id);
  };

  const handleCartClick = (e) => {
    e.stopPropagation();
    if (isSold) return;
    if (currentRole !== 'buyer' && currentRole !== 'dual') {
      alert("Please switch to Buyer or Dual mode to add items to your cart!");
      return;
    }
    onAddToCart(listing);
  };

  return (
    <div 
      onClick={() => onViewDetails(listing)}
      className="product-card"
    >
      {/* Sold Overlay */}
      {isSold && (
        <div className="product-card-sold-overlay">
          <span className="sold-overlay-tag">
            Sold Out
          </span>
        </div>
      )}

      {/* Card Header: Seller Details */}
      <div className="product-card-header">
        <div className="seller-info">
          <img 
            src={ownerAvatar} 
            alt={owner} 
            className="seller-avatar"
          />
          <span className="seller-name">{owner}</span>
        </div>
        <span className="condition-badge">
          {condition}
        </span>
      </div>

      {/* Product Image Section */}
      <div className="product-image-container">
        <img 
          src={image} 
          alt={title} 
          className="product-image-main"
          loading="lazy"
        />

        {/* Hover Actions Overlay */}
        <div className="product-hover-actions">
          <button className="card-action-btn" title="Quick View">
            <ZoomIn size={14} />
          </button>
          {!isSold && (currentRole === 'buyer' || currentRole === 'dual') && (
            <button 
              onClick={handleCartClick}
              className="card-action-btn accent"
              title="Add to Cart"
            >
              <ShoppingCart size={14} />
            </button>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleLikeClick}
          className={`wishlist-btn-pos ${isLiked ? 'active' : ''}`}
          title={isLiked ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={14} style={isLiked ? { fill: 'var(--terracotta)' } : {}} />
        </button>
      </div>

      {/* Card Info */}
      <div className="product-card-details">
        <div>
          <span className="brand-label">{brand}</span>
          <h3 className="item-title">{title}</h3>
        </div>

        <div className="item-pricing-row">
          <div>
            <span className="price-bold">${price.toFixed(2)}</span>
            <span className="shipping-sub">
              {shipping > 0 ? `+ $${shipping.toFixed(2)} shipping` : 'Free shipping'}
            </span>
          </div>
          <span className="size-pill">
            Size: {size}
          </span>
        </div>
      </div>
    </div>
  );
}
