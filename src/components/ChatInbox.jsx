import React, { useState, useEffect } from 'react';
import { Send, Tag, Check, X, User } from 'lucide-react';

export default function ChatInbox({ 
  chats, 
  onSendMessage, 
  onAcceptOffer, 
  onDeclineOffer, 
  onCounterOffer,
  onBuyListingDirectly
}) {
  const [activeChatId, setActiveChatId] = useState(chats[0]?.id || null);
  const [inputText, setInputText] = useState('');
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');

  const activeChat = chats.find(c => c.id === activeChatId);

  // Auto Scroll to bottom
  useEffect(() => {
    const chatContainer = document.getElementById('chat-scroll-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [activeChatId, activeChat?.messages?.length]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    onSendMessage(activeChatId, inputText.trim(), 'you');
    setInputText('');

    // Simulate response after 1.5s
    setTimeout(() => {
      const responseTemplates = [
        "Thanks for the message! I'm active and can drop it off at the courier tomorrow morning.",
        "Hey! Let me double check the details and I'll get back to you shortly.",
        "That works for me! Let's lock it in.",
        "I'm firm on the price since it's already highly discounted, but thank you for the interest!",
        "Perfect, let me know if you need any other photos."
      ];
      const randomResponse = responseTemplates[Math.floor(Math.random() * responseTemplates.length)];
      onSendMessage(activeChatId, randomResponse, activeChat.partner);
    }, 1500);
  };

  const handleAccept = () => {
    onAcceptOffer(activeChatId);
  };

  const handleDecline = () => {
    onDeclineOffer(activeChatId);
  };

  const handleCounterSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(counterAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid counter-offer amount.");
      return;
    }
    onCounterOffer(activeChatId, amt);
    setCounterAmount('');
    setCounterOpen(false);
  };

  return (
    <div className="max-width-container chat-hub-layout">
      
      {/* LEFT COLUMN: Threads List */}
      <div className="chat-threads-panel">
        <div className="chat-threads-header">
          <h3 className="chat-threads-title">Conversations</h3>
          <p className="chat-threads-subtitle">Direct Negotiations</p>
        </div>

        <div className="chat-threads-list">
          {chats.length === 0 ? (
            <div className="chat-thread-empty">
              No messages yet. Message a seller on their item page to start chatting!
            </div>
          ) : (
            chats.map((c) => {
              const isSelected = c.id === activeChatId;
              const lastMsg = c.messages[c.messages.length - 1];
              return (
                <div 
                  key={c.id}
                  onClick={() => { setActiveChatId(c.id); setCounterOpen(false); }}
                  className={`chat-thread-item ${isSelected ? 'active' : ''}`}
                >
                  <img src={c.partnerAvatar} alt={c.partner} className="thread-avatar" />
                  <div className="thread-mid">
                    <div className="thread-row-top">
                      <h4 className="thread-username">{c.partner}</h4>
                      <span className="thread-time">{lastMsg?.time || 'Recent'}</span>
                    </div>
                    <p className="thread-last-msg">{lastMsg?.text || 'No messages'}</p>
                    <span className="thread-item-ref">Ref: {c.listingTitle}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Thread Pane */}
      <div className="chat-window-panel">
        {activeChat ? (
          <>
            {/* Conversation Header */}
            <div className="chat-window-header">
              <div className="chat-header-userinfo">
                <img src={activeChat.partnerAvatar} alt={activeChat.partner} className="chat-header-avatar" />
                <div>
                  <h4 className="chat-header-name">{activeChat.partner}</h4>
                  <span className="chat-header-status">
                    <span className="chat-header-status-dot"></span>
                    Online
                  </span>
                </div>
              </div>

              {/* Item Card Shortcut */}
              <div className="chat-header-item-card">
                <img src={activeChat.listingImage} alt={activeChat.listingTitle} className="chat-item-card-img" />
                <div style={{ flex: '1', minWidth: '0' }}>
                  <h5 className="chat-item-card-title">{activeChat.listingTitle}</h5>
                  <span className="chat-item-card-price">${activeChat.listingPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Offer Negotiation Board */}
            {activeChat.offer && (
              <div className="negotiation-dashboard">
                <div className="nego-info-row">
                  <div className="nego-info-icon-wrapper">
                    <Tag size={16} />
                  </div>
                  <div>
                    <h5 className="nego-info-title">
                      {activeChat.offer.sender === 'you' ? 'You proposed an offer' : `${activeChat.partner} proposed an offer`}
                    </h5>
                    <p className="nego-info-price-text">
                      Proposed Price: <b>${activeChat.offer.amount.toFixed(2)}</b>
                      <span> (Asking: ${activeChat.listingPrice.toFixed(2)})</span>
                    </p>
                  </div>
                </div>

                {/* Offer Action Buttons / Badges */}
                <div className="nego-actions-row">
                  {activeChat.offer.status === 'pending' ? (
                    activeChat.offer.sender === 'you' ? (
                      <span className="nego-badge-status pending">
                        Awaiting Response
                      </span>
                    ) : (
                      <>
                        <button 
                          onClick={handleAccept}
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.65rem' }}
                        >
                          <Check size={12} />
                          <span>Accept</span>
                        </button>
                        <button 
                          onClick={handleDecline}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.65rem', color: '#EF4444', borderColor: '#EF4444' }}
                        >
                          <X size={12} />
                          <span>Decline</span>
                        </button>
                        <button 
                          onClick={() => setCounterOpen(!counterOpen)}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.65rem' }}
                        >
                          Counter
                        </button>
                      </>
                    )
                  ) : activeChat.offer.status === 'accepted' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="nego-badge-status accepted">
                        Accepted
                      </span>
                      {activeChat.offer.sender === 'you' && (
                        <button 
                          onClick={() => onBuyListingDirectly(activeChat.listingId, activeChat.offer.amount)}
                          className="btn-accent"
                          style={{ padding: '6px 12px', fontSize: '0.65rem' }}
                        >
                          Buy Now
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="nego-badge-status declined">
                      Declined
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Counter Offer Input Sub-drawer */}
            {counterOpen && (
              <form onSubmit={handleCounterSubmit} style={{ margin: '0 20px 12px 20px', padding: '10px', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: '12px', display: 'flex', gap: '8px' }}>
                <div className="wallet-input-container" style={{ flex: '1' }}>
                  <span className="wallet-input-symbol" style={{ left: '10px', fontSize: '0.75rem' }}>$</span>
                  <input
                    type="number"
                    placeholder="Enter Counter Offer"
                    value={counterAmount}
                    onChange={(e) => setCounterAmount(e.target.value)}
                    className="wallet-input-field"
                    style={{ paddingLeft: '22px', fontSize: '0.75rem', height: '32px' }}
                    step="0.01"
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.65rem', height: '32px' }}>
                  Counter
                </button>
              </form>
            )}

            {/* Chats Messages Bubbles Area */}
            <div 
              id="chat-scroll-container"
              className="chat-bubbles-scrollarea"
            >
              {activeChat.messages.map((m, idx) => {
                const isYou = m.sender === 'you';
                return (
                  <div key={idx} className={`bubble-row ${isYou ? 'you' : 'partner'}`}>
                    {!isYou && (
                      <img src={activeChat.partnerAvatar} alt={activeChat.partner} className="bubble-avatar" />
                    )}
                    <div className="bubble-text-box">
                      <div className="bubble-msg-bubble">
                        {m.text}
                      </div>
                      <span className="bubble-msg-time">{m.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Send Input Box */}
            <form onSubmit={handleSend} className="chat-input-bar">
              <input
                type="text"
                placeholder={`Send message to ${activeChat.partner}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="chat-text-input"
              />
              <button 
                type="submit" 
                className="chat-send-btn"
                title="Send Message"
              >
                <Send size={14} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)', gap: '10px' }}>
            <User size={32} style={{ color: 'var(--gray-300)' }} />
            <p style={{ fontSize: '0.85rem' }}>Select a conversation thread to get started.</p>
          </div>
        )}
      </div>

    </div>
  );
}
