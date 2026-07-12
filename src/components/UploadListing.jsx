import React, { useState } from 'react';
import { X, Upload, Check, ChevronRight, ChevronLeft, Shirt } from 'lucide-react';

export default function UploadListing({ onClose, onAddListing }) {
  const [step, setStep] = useState(1);
  
  // Form states
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [condition, setCondition] = useState('Excellent');
  const [category, setCategory] = useState('Jackets');
  const [price, setPrice] = useState('');
  const [shipping, setShipping] = useState('4.99');

  // Downscale the selected photo before use so uploads stay small (caps the
  // longest edge at 1200px and re-encodes as JPEG). Falls back to the raw file
  // if anything goes wrong.
  const downscaleImage = (file, maxEdge = 1200, quality = 0.82) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(reader.result);
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const preview = await downscaleImage(file);
      setImagePreview(preview);
    }
  };

  const nextStep = () => {
    if (step === 1 && !imagePreview) {
      alert("Please upload/select an item photo to proceed.");
      return;
    }
    if (step === 2 && (!title || !description || !size || !brand)) {
      alert("Please fill out all item details (Title, Description, Brand, Size) to proceed.");
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedPrice = parseFloat(price);
    const parsedShipping = parseFloat(shipping);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert("Please enter a valid price.");
      return;
    }

    const finalImage = imagePreview || "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=600";

    const newListing = {
      title,
      description,
      brand,
      size,
      condition,
      category,
      price: parsedPrice,
      shipping: isNaN(parsedShipping) ? 0 : parsedShipping,
      image: finalImage,
      owner: "relove_curator",
      ownerAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex",
      likes: 0,
      dateAdded: new Date().toISOString().split('T')[0],
      isSold: false
    };

    onAddListing(newListing);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="wizard-modal-box">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="modal-close-btn"
          title="Cancel Listing"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="wizard-header">
          <div className="wizard-header-icon-box">
            <Shirt size={18} />
          </div>
          <div>
            <h2 className="wizard-header-title">List an Item</h2>
            <p className="wizard-header-subtitle">Clear out closet clutter in 3 quick steps</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="wizard-steps-timeline">
          {[1, 2, 3].map((num) => (
            <React.Fragment key={num}>
              <div className="wizard-step-node-item">
                <span className={`wizard-step-circle ${
                  step === num 
                    ? 'active' 
                    : step > num 
                      ? 'completed' 
                      : ''
                }`}>
                  {step > num ? <Check size={12} /> : num}
                </span>
                <span className={`wizard-step-label ${step === num ? 'active' : ''}`}>
                  {num === 1 ? 'Photos' : num === 2 ? 'Details' : 'Pricing'}
                </span>
              </div>
              {num < 3 && <span className="wizard-step-divider">/</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          
          {/* STEP 1: Image Upload */}
          {step === 1 && (
            <div className="form-fields-stack">
              <label className="form-label-title">Item Snapshot</label>
              
              <div className="upload-dashed-dropzone">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="upload-input-hidden"
                />
                
                {imagePreview ? (
                  <div className="upload-preview-wrapper">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="upload-preview-img"
                    />
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setImage(null); setImagePreview(''); }}
                      className="upload-remove-img-btn"
                      title="Remove image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '16px', background: 'white', borderRadius: '50%', boxShadow: 'var(--shadow-sm)', color: 'var(--gray-400)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Upload size={22} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--sage)', display: 'block', textDecoration: 'underline' }}>Click to upload photo</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>Supports PNG, JPG, or WEBP</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Presets Option */}
              {!imagePreview && (
                <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                  <span className="upload-preset-prompt">— OR SELECT A SIMULATED PRESET IMAGE —</span>
                  <div className="upload-presets-row">
                    <button
                      type="button"
                      onClick={() => setImagePreview("https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=600")}
                      className="preset-chip-btn"
                    >
                      Preset: Denim Jacket
                    </button>
                    <button
                      type="button"
                      onClick={() => setImagePreview("https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&q=80&w=600")}
                      className="preset-chip-btn"
                    >
                      Preset: Knit Scarf
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Description and Details */}
          {step === 2 && (
            <div className="form-fields-stack">
              <div>
                <label className="form-label-title">Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Vintage Nike Windbreaker 90s"
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label-title">Description</label>
                <textarea 
                  placeholder="Describe your item. Note any flaws, sizing details, how it fits, material, etc."
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input"
                  style={{ minHeight: '90px', resize: 'none' }}
                  required
                />
              </div>

              <div className="form-grid-2cols">
                <div>
                  <label className="form-label-title">Brand</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Nike, Levis"
                    value={brand} 
                    onChange={(e) => setBrand(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label-title">Size</label>
                  <input 
                    type="text" 
                    placeholder="e.g. M, L, US 10"
                    value={size} 
                    onChange={(e) => setSize(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2cols">
                <div>
                  <label className="form-label-title">Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-input"
                  >
                    <option value="Jackets">Jackets</option>
                    <option value="Shoes">Shoes</option>
                    <option value="Knitwear">Knitwear</option>
                    <option value="Bags">Bags</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Pants">Pants</option>
                  </select>
                </div>
                <div>
                  <label className="form-label-title">Condition</label>
                  <select 
                    value={condition} 
                    onChange={(e) => setCondition(e.target.value)}
                    className="form-input"
                  >
                    <option value="New with Tags">New with Tags</option>
                    <option value="Excellent">Excellent (Like New)</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good (Minor Wear)</option>
                    <option value="Fair">Fair (Has Flaws)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Pricing */}
          {step === 3 && (
            <div className="form-fields-stack">
              <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-100)', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
                    <img src={imagePreview} alt="Item thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{title || 'Untitled Listing'}</h4>
                    <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>{brand} • Size {size}</p>
                  </div>
                </div>
                <span className="condition-badge">{condition}</span>
              </div>

              <div>
                <label className="form-label-title">Price</label>
                <div className="wallet-input-container">
                  <span className="wallet-input-symbol">$</span>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '26px', fontWeight: 'bold' }}
                    min="1"
                    step="0.01"
                    required
                  />
                </div>
                <p style={{ fontSize: '0.65rem', color: 'var(--gray-400)', marginTop: '4px' }}>Suggested starting price based on category: $40 - $80.</p>
              </div>

              <div>
                <label className="form-label-title">Shipping Cost</label>
                <select 
                  value={shipping} 
                  onChange={(e) => setShipping(e.target.value)}
                  className="form-input"
                  style={{ fontWeight: '600' }}
                >
                  <option value="0.00">Free Shipping ($0.00)</option>
                  <option value="2.99">Small parcel ($2.99)</option>
                  <option value="4.99">Standard shipping ($4.99)</option>
                  <option value="7.50">Large parcel ($7.50)</option>
                </select>
                <p style={{ fontSize: '0.65rem', color: 'var(--gray-400)', marginTop: '4px' }}>Buyers pay shipping fees directly at checkout.</p>
              </div>
            </div>
          )}

          {/* Stepped Controls Footer */}
          <div className="wizard-footer-actions">
            {step > 1 ? (
              <button 
                type="button" 
                onClick={prevStep}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '8px 16px' }}
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button 
                type="button" 
                onClick={nextStep}
                className="btn-primary"
                style={{ fontSize: '0.75rem', padding: '8px 16px' }}
              >
                <span>Continue</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button 
                type="submit"
                className="btn-accent"
                style={{ fontSize: '0.75rem', padding: '8px 20px' }}
              >
                <span>Post Listing</span>
                <Check size={14} />
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}
