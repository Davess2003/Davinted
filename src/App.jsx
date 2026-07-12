import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import ProductDetail from './components/ProductDetail';
import UploadListing from './components/UploadListing';
import CheckoutModal from './components/CheckoutModal';
import ChatInbox from './components/ChatInbox';
import Dashboard from './components/Dashboard';
import AccountDetails from './components/AccountDetails';
import AuthModal from './components/AuthModal';
import {
  initialListings,
  initialChats,
  initialOrders,
  currentUser,
  initialAccount,
  isAccountComplete
} from './data/mockData';
import { isStripeConfigured, api } from './lib/stripe';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { db } from './lib/db';
import { X, Trash2, Shield, ShoppingBag, ArrowRight } from 'lucide-react';

// When Supabase keys are present, the app runs in "cloud" mode: real accounts
// (login required for actions) and all data persisted via the API. Otherwise it
// falls back to the original local/demo mode (localStorage + mock data).
const CLOUD = isSupabaseConfigured;

export default function App() {
  // --- Persistent States ---
  // In cloud mode these start empty/default and are hydrated from the API;
  // in local mode they seed from localStorage / mock data as before.
  const [currentRole, setCurrentRole] = useState(() => {
    if (CLOUD) return 'guest';
    return localStorage.getItem('relove_role') || 'dual';
  });

  const [listings, setListings] = useState(() => {
    if (CLOUD) return [];
    const saved = localStorage.getItem('relove_listings');
    return saved ? JSON.parse(saved) : initialListings;
  });

  const [chats, setChats] = useState(() => {
    if (CLOUD) return [];
    const saved = localStorage.getItem('relove_chats');
    return saved ? JSON.parse(saved) : initialChats;
  });

  const [orders, setOrders] = useState(() => {
    if (CLOUD) return [];
    const saved = localStorage.getItem('relove_orders');
    return saved ? JSON.parse(saved) : initialOrders;
  });

  const [walletBalance, setWalletBalance] = useState(() => {
    if (CLOUD) return 0;
    const saved = localStorage.getItem('relove_wallet');
    return saved ? parseFloat(saved) : currentUser.walletBalance;
  });

  const [likedIds, setLikedIds] = useState(() => {
    if (CLOUD) return [];
    const saved = localStorage.getItem('relove_likes');
    return saved ? JSON.parse(saved) : [2, 5];
  });

  const [account, setAccount] = useState(() => {
    if (CLOUD) return initialAccount;
    const saved = localStorage.getItem('relove_account');
    return saved ? { ...initialAccount, ...JSON.parse(saved) } : initialAccount;
  });

  // --- Auth (cloud mode only) ---
  const [session, setSession] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // --- UI Layout Navigation States ---
  const [view, setView] = useState('feed');
  const [searchQuery, setSearchQuery] = useState('');

  // --- Modals and Overlays ---
  const [activeDetailItem, setActiveDetailItem] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]);

  const [checkoutItemOverride, setCheckoutItemOverride] = useState(null);

  // --- Account gating ---
  // The account form pops up when a buyer/seller tries an action they haven't
  // completed their details for. `pendingAction` runs once they finish.
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountContext, setAccountContext] = useState(null); // 'buy' | 'sell' | null
  const [pendingAction, setPendingAction] = useState(null);

  // --- LocalStorage Sync Effects (local/demo mode only) ---
  useEffect(() => {
    if (!CLOUD) localStorage.setItem('relove_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    if (!CLOUD) localStorage.setItem('relove_listings', JSON.stringify(listings));
  }, [listings]);

  useEffect(() => {
    if (!CLOUD) localStorage.setItem('relove_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    if (!CLOUD) localStorage.setItem('relove_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    if (!CLOUD) localStorage.setItem('relove_wallet', walletBalance.toString());
  }, [walletBalance]);

  useEffect(() => {
    if (!CLOUD) localStorage.setItem('relove_likes', JSON.stringify(likedIds));
  }, [likedIds]);

  // --- Cloud mode: auth session + data hydration ---
  // Track the Supabase auth session.
  useEffect(() => {
    if (!CLOUD) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load the public catalog once on mount.
  useEffect(() => {
    if (!CLOUD) return;
    db.getListings().then(setListings).catch((e) => console.error('load listings:', e.message));
  }, []);

  // Load (or clear) the signed-in user's data whenever the session changes.
  useEffect(() => {
    if (!CLOUD) return;
    if (!session) {
      setCurrentRole('guest');
      setAccount(initialAccount);
      setWalletBalance(0);
      setLikedIds([]);
      setOrders([]);
      setChats([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await db.getMe();
        if (cancelled) return;
        setCurrentRole(me.role || 'dual');
        setAccount({ ...initialAccount, ...me.account });
        setWalletBalance(me.walletBalance || 0);
        const [likes, ords, chts] = await Promise.all([db.getLikes(), db.getOrders(), db.getChats()]);
        if (cancelled) return;
        setLikedIds(likes);
        setOrders(ords);
        setChats(chts);
      } catch (e) {
        console.error('load user data:', e.message);
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

  useEffect(() => {
    if (!CLOUD) localStorage.setItem('relove_account', JSON.stringify(account));
  }, [account]);

  // When the seller returns from Stripe Connect onboarding, reopen the account
  // form and refresh their live payout status.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connect = params.get('connect');
    if (!connect) return;

    // Clean the URL so a refresh doesn't re-trigger this.
    window.history.replaceState({}, '', window.location.pathname);

    if (connect === 'return' && account.stripeAccountId && isStripeConfigured) {
      api(`/api/connect/account-status/${account.stripeAccountId}`)
        .then((s) => setAccount(prev => ({ ...prev, payoutsEnabled: s.payoutsEnabled })))
        .catch(() => {});
    }
    setAccountContext(null);
    setAccountModalOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist account/role/wallet changes to the profile when in cloud mode.
  const persistProfile = (patch) => {
    if (CLOUD && session) db.updateMe(patch).catch((e) => console.error('save profile:', e.message));
  };

  // --- Auth + account gating helpers ---
  // In cloud mode an action first requires being signed in, then a complete
  // account for `context`. In local mode only the account check applies.
  const requireAccount = (context, action) => {
    if (CLOUD && !session) {
      setAuthModalOpen(true);
      return;
    }
    if (isAccountComplete(account, context)) {
      action();
    } else {
      setAccountContext(context);
      setPendingAction(() => action);
      setAccountModalOpen(true);
    }
  };

  const handleSaveAccount = (updated) => {
    setAccount(updated);
    persistProfile({ account: updated });
    setAccountModalOpen(false);
    setAccountContext(null);
    const action = pendingAction;
    setPendingAction(null);
    if (action) action();
  };

  const handleCloseAccount = () => {
    setAccountModalOpen(false);
    setAccountContext(null);
    setPendingAction(null);
  };

  // Partial update that persists without closing (used by Stripe Connect flow).
  const handleUpdateAccount = (patch) => {
    setAccount(prev => {
      const next = { ...prev, ...patch };
      persistProfile({ account: next });
      return next;
    });
  };

  // Role switch — persists to the profile in cloud mode.
  const handleSetRole = (role) => {
    setCurrentRole(role);
    persistProfile({ role });
  };

  // Wallet change — persists to the profile in cloud mode.
  const changeWallet = (delta) => {
    setWalletBalance(prev => {
      const next = Math.max(0, prev + delta);
      persistProfile({ walletBalance: next });
      return next;
    });
  };

  const handleSignOut = async () => {
    if (CLOUD) await supabase.auth.signOut();
    setView('feed');
  };

  // --- Helper Getters ---
  const unreadCount = chats.filter(c => {
    const lastMsg = c.messages[c.messages.length - 1];
    return lastMsg && lastMsg.sender !== 'you';
  }).length;

  const likedListings = listings.filter(l => likedIds.includes(l.id));

  // --- Handlers ---
  const handleToggleLike = (id) => {
    if (CLOUD && !session) {
      setAuthModalOpen(true);
      return;
    }
    const liked = likedIds.includes(id);
    setLikedIds(prev => liked ? prev.filter(item => item !== id) : [...prev, id]);
    if (CLOUD) {
      (liked ? db.removeLike(id) : db.addLike(id)).catch((e) => console.error('like:', e.message));
    }
  };

  const handleAddToCart = (item) => {
    if (cart.some(c => c.id === item.id)) {
      alert("Item is already in your cart!");
      return;
    }
    setCart(prev => [...prev, item]);
    setCartOpen(true);
  };

  const handleRemoveFromCart = (id) => {
    setCart(prev => prev.filter(c => c.id !== id));
  };

  const handleSendMessage = (chatId, text, sender = 'you') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChats(prev => prev.map(c => {
      if (c.id === chatId) {
        return {
          ...c,
          messages: [...c.messages, { sender, text, time }]
        };
      }
      return c;
    }));
    if (CLOUD) db.sendMessage(chatId, { sender, text }).catch((e) => console.error('message:', e.message));
  };

  const handleStartChat = async (listing, offerAmount = null) => {
    const existing = chats.find(c => c.listingId === listing.id && c.partner === listing.owner);

    if (existing) {
      if (offerAmount) {
        const offer = { active: true, amount: offerAmount, sender: 'you', status: 'pending' };
        applyOfferChange(existing.id, offer, `I would like to make an offer of $${offerAmount.toFixed(2)}.`);
      }
      setView('chat');
      return;
    }

    const initialMsg = offerAmount
      ? `Hi! I'm interested in this item. I would like to make an offer of $${offerAmount.toFixed(2)}.`
      : "Hi! Is this item still available? I have a few questions.";
    const offer = offerAmount ? { active: true, amount: offerAmount, sender: 'you', status: 'pending' } : null;

    if (CLOUD) {
      try {
        const created = await db.createChat({
          partner: listing.owner,
          partnerAvatar: listing.ownerAvatar,
          listingId: listing.id,
          listingTitle: listing.title,
          listingPrice: listing.price,
          listingImage: listing.image,
          firstMessage: { sender: 'you', text: initialMsg },
          offer
        });
        setChats(prev => [created, ...prev]);
      } catch (e) {
        console.error('create chat:', e.message);
      }
    } else {
      const newChat = {
        id: `chat_${Date.now()}`,
        partner: listing.owner,
        partnerAvatar: listing.ownerAvatar,
        listingId: listing.id,
        listingTitle: listing.title,
        listingPrice: listing.price,
        listingImage: listing.image,
        messages: [
          { sender: "you", text: initialMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ],
        offer
      };
      setChats(prev => [newChat, ...prev]);
    }
    setView('chat');
  };

  // Update a chat's offer + append a system message (optimistic + persisted).
  const applyOfferChange = (chatId, offer, text) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChats(prev => prev.map(c => c.id === chatId
      ? { ...c, offer, messages: [...c.messages, { sender: 'you', text, time }] }
      : c));
    if (CLOUD) db.updateOffer(chatId, { offer, message: { sender: 'you', text } }).catch((e) => console.error('offer:', e.message));
  };

  const handleAcceptOffer = (chatId) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat || !chat.offer) return;
    applyOfferChange(chatId, { ...chat.offer, status: 'accepted' }, `I accept your offer of $${chat.offer.amount.toFixed(2)}!`);
  };

  const handleDeclineOffer = (chatId) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat || !chat.offer) return;
    applyOfferChange(chatId, { ...chat.offer, status: 'rejected' }, "Sorry, I cannot accept this offer.");
  };

  const handleCounterOffer = (chatId, amount) => {
    applyOfferChange(chatId, { active: true, amount, sender: 'you', status: 'pending' }, `How about a counter-offer of $${amount.toFixed(2)}?`);
  };

  const handleBuyListingDirectly = (listingId, priceOverride = null) => {
    const targetListing = listings.find(l => l.id === listingId);
    if (!targetListing) return;

    requireAccount('buy', () => {
      if (priceOverride !== null) {
        setCheckoutItemOverride({
          ...targetListing,
          price: priceOverride
        });
      } else {
        setCheckoutItemOverride(null);
      }
      setActiveDetailItem(targetListing);
      setCheckoutOpen(true);
    });
  };

  const handleAddListing = async (newListing) => {
    if (CLOUD) {
      try {
        // If the photo is a base64 data URL, upload it to Storage first so the
        // listing row only stores a short public URL (not megabytes of base64).
        let payload = newListing;
        if (typeof newListing.image === 'string' && newListing.image.startsWith('data:')) {
          const { url } = await db.uploadImage(newListing.image);
          payload = { ...newListing, image: url };
        }
        const created = await db.createListing(payload);
        setListings(prev => [created, ...prev]);
      } catch (e) {
        alert('Could not save your listing: ' + e.message);
        return;
      }
    } else {
      const freshListing = { ...newListing, id: listings.length + 1 };
      setListings(prev => [freshListing, ...prev]);
    }
    setView('feed');
  };

  const handleRemoveListing = (id) => {
    setListings(prev => prev.filter(l => l.id !== id));
    if (CLOUD) db.deleteListing(id).catch((e) => console.error('delete listing:', e.message));
  };

  const handleStepOrderTracking = (orderId) => {
    if (CLOUD) {
      db.advanceTracking(orderId)
        .then(updated => setOrders(prev => prev.map(o => o.id === orderId ? updated : o)))
        .catch((e) => console.error('tracking:', e.message));
      return;
    }
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const nextHist = [...o.trackingHistory];
        const nextPendingIdx = nextHist.findIndex(h => !h.done);

        if (nextPendingIdx !== -1) {
          nextHist[nextPendingIdx] = {
            ...nextHist[nextPendingIdx],
            done: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          let nextStatus = o.status;
          if (nextPendingIdx === 1) nextStatus = 'shipped';
          if (nextPendingIdx === 2) nextStatus = 'in_transit';
          if (nextPendingIdx === 3) nextStatus = 'delivered';

          return {
            ...o,
            status: nextStatus,
            trackingHistory: nextHist
          };
        }
      }
      return o;
    }));
  };

  const handlePaymentSuccess = async (purchasedItems) => {
    const boughtIds = purchasedItems.map(item => item.id);
    setListings(prev => prev.map(l => boughtIds.includes(l.id) ? { ...l, isSold: true } : l));
    const itemsTotal = purchasedItems.reduce((acc, item) => acc + item.price + item.shipping, 0);
    setCart(prev => prev.filter(c => !boughtIds.includes(c.id)));

    if (CLOUD) {
      try {
        const newOrders = await db.createOrders(purchasedItems);
        setOrders(prev => [...newOrders, ...prev]);
        const nextBal = Math.max(0, walletBalance - itemsTotal);
        setWalletBalance(nextBal);
        persistProfile({ walletBalance: nextBal });
      } catch (e) {
        console.error('create orders:', e.message);
      }
      return;
    }

    setWalletBalance(prev => Math.max(0, prev - itemsTotal));
    const newOrders = purchasedItems.map(item => ({
      id: `ord_${Math.floor(10000 + Math.random() * 90000)}`,
      listingId: item.id,
      title: item.title,
      price: item.price,
      shipping: item.shipping,
      brand: item.brand,
      image: item.image,
      seller: item.owner,
      orderDate: new Date().toISOString().split('T')[0],
      status: 'confirmed',
      trackingHistory: [
        { title: "Order Confirmed", desc: "Payment received & confirmed", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), done: true },
        { title: "Shipped", desc: "Preparing label", time: "", done: false },
        { title: "In Transit", desc: "Awaiting courier pickup", time: "", done: false },
        { title: "Delivered", desc: "Arrival scan", time: "", done: false }
      ]
    }));
    setOrders(prev => [...newOrders, ...prev]);
  };

  const filteredListings = listings.filter(l => {
    const q = searchQuery.toLowerCase();
    return (
      l.title.toLowerCase().includes(q) ||
      l.brand.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER */}
      <Header
        currentRole={currentRole}
        setCurrentRole={handleSetRole}
        setView={setView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cartCount={cart.length}
        openCart={() => setCartOpen(true)}
        unreadCount={unreadCount}
        onOpenUpload={() => requireAccount('sell', () => setUploadOpen(true))}
        walletBalance={walletBalance}
        authEnabled={CLOUD}
        isSignedIn={!!session}
        username={account.fullName || session?.user?.email}
        onSignIn={() => setAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* CORE SCREENS */}
      <main style={{ flexGrow: '1' }}>
        {view === 'feed' && (
          <>
            {/* HERO SECTION */}
            <Hero setSearchQuery={setSearchQuery} />

            {/* PRODUCT CATALOG FEED */}
            <div className="max-width-container catalog-section">
              <div className="catalog-header-bar">
                <div className="text-left">
                  <h2 className="catalog-title">Feed & Discover</h2>
                  <p className="catalog-subtitle">Vibrant listings curated from sellers worldwide</p>
                </div>
                {searchQuery && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: '500' }}>Filtering by "{searchQuery}"</span>
                    <button 
                      onClick={() => setSearchQuery('')}
                      style={{ fontSize: '0.75rem', color: 'var(--terracotta)', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Clear Filter
                    </button>
                  </div>
                )}
              </div>

              {filteredListings.length === 0 ? (
                <div style={{ padding: '60px 0', color: 'var(--gray-400)', fontSize: '0.85rem', fontWeight: '300', textAlign: 'center' }}>
                  No matching vintage threads found. Try searching for other tags!
                </div>
              ) : (
                <div className="product-grid">
                  {filteredListings.map((item) => (
                    <ProductCard 
                      key={item.id}
                      listing={item}
                      onViewDetails={(itm) => { setCheckoutItemOverride(null); setActiveDetailItem(itm); }}
                      onToggleLike={handleToggleLike}
                      isLiked={likedIds.includes(item.id)}
                      currentRole={currentRole}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {view === 'chat' && (
          <ChatInbox 
            chats={chats}
            onSendMessage={handleSendMessage}
            onAcceptOffer={handleAcceptOffer}
            onDeclineOffer={handleDeclineOffer}
            onCounterOffer={handleCounterOffer}
            onBuyListingDirectly={handleBuyListingDirectly}
          />
        )}

        {view === 'dashboard' && (
          <Dashboard 
            currentRole={currentRole}
            listings={listings}
            orders={orders}
            likedListings={likedListings}
            walletBalance={walletBalance}
            onWithdrawFunds={(amt) => changeWallet(-amt)}
            onAddFunds={(amt) => changeWallet(amt)}
            onRemoveListing={handleRemoveListing}
            onStepOrderTracking={handleStepOrderTracking}
            onViewListingDetail={(itm) => { setCheckoutItemOverride(null); setActiveDetailItem(itm); }}
            account={account}
            accountComplete={isAccountComplete(account, currentRole === 'buyer' ? 'buy' : 'sell')}
            onOpenAccount={() => { setAccountContext(null); setPendingAction(null); setAccountModalOpen(true); }}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ background: '#1E2824', color: '#FFF', padding: '48px 0 24px 0', marginTop: '60px', fontSize: '0.75rem', borderTop: '1px solid #2A3E37' }}>
        <div className="max-width-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '40px', textAlign: 'left' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>Relove.</h4>
            <p style={{ color: 'var(--gray-400)', lineHeight: '1.6', fontWeight: '300' }}>
              Sustainable wardrobe curation platform. Join the circular fashion loop.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ color: 'var(--gray-300)', fontWeight: 'bold' }}>Marketplace</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', padding: '0', color: 'var(--gray-400)', fontWeight: '300' }}>
              <li style={{ cursor: 'pointer' }} onClick={() => setView('feed')}>Browse Catalog</li>
              <li style={{ cursor: 'pointer' }} onClick={() => { setView('feed'); setSearchQuery('Jackets'); }}>Jackets</li>
              <li style={{ cursor: 'pointer' }} onClick={() => { setView('feed'); setSearchQuery('Shoes'); }}>Sneakers</li>
            </ul>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ color: 'var(--gray-300)', fontWeight: 'bold' }}>Your Portal</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', padding: '0', color: 'var(--gray-400)', fontWeight: '300' }}>
              <li style={{ cursor: 'pointer' }} onClick={() => setView('dashboard')}>Dashboard</li>
              <li style={{ cursor: 'pointer' }} onClick={() => setView('chat')}>Inbox Threads</li>
            </ul>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ color: 'var(--gray-300)', fontWeight: 'bold' }}>Guarantees</h4>
            <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Shield size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
              <p style={{ fontSize: '0.65rem', color: 'var(--gray-400)', lineHeight: '1.4', fontWeight: '300' }}>
                Secure buyer escrow protection applies to every transaction.
              </p>
            </div>
          </div>
        </div>
        
        <div className="max-width-container" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', color: 'var(--gray-500)', fontWeight: '300' }}>
          <p>© 2026 Relove Inc. All vintage references mockups preserved.</p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ cursor: 'pointer' }}>Privacy</span>
            <span>•</span>
            <span style={{ cursor: 'pointer' }}>Terms</span>
          </div>
        </div>
      </footer>

      {/* --- OVERLAYS & MODALS --- */}

      {/* PRODUCT DETAILS MODAL */}
      {activeDetailItem && (
        <ProductDetail 
          listing={checkoutItemOverride || activeDetailItem}
          isLiked={likedIds.includes(activeDetailItem.id)}
          onToggleLike={handleToggleLike}
          currentRole={currentRole}
          onClose={() => { setActiveDetailItem(null); setCheckoutItemOverride(null); }}
          onBuyNow={(itm) => requireAccount('buy', () => setCheckoutOpen(true))}
          onStartChat={handleStartChat}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* UPLOAD LISTING WIZARD */}
      {uploadOpen && (
        <UploadListing 
          onClose={() => setUploadOpen(false)}
          onAddListing={handleAddListing}
        />
      )}

      {/* CHECKOUT FLOW MODAL */}
      {checkoutOpen && (
        <CheckoutModal
          listing={checkoutItemOverride || activeDetailItem}
          cartItems={checkoutItemOverride ? [] : cart}
          account={account}
          onClose={() => { setCheckoutOpen(false); setCheckoutItemOverride(null); }}
          onPaymentSuccess={(boughtItems) => {
            handlePaymentSuccess(boughtItems);
            setCheckoutOpen(false);
            setCheckoutItemOverride(null);
            setActiveDetailItem(null);
            setView('dashboard');
          }}
        />
      )}

      {/* SLIDE-OUT CART PANEL */}
      {cartOpen && (
        <div className="cart-drawer-overlay">
          <div style={{ position: 'absolute', inset: 0 }} onClick={() => setCartOpen(false)} />
          
          <div className="cart-drawer-container">
            {/* Cart Header */}
            <div className="cart-drawer-header">
              <div className="cart-drawer-title-box">
                <ShoppingBag size={18} style={{ color: 'var(--sage)' }} />
                <h3 className="cart-drawer-title">Shopping Cart</h3>
              </div>
              <button 
                onClick={() => setCartOpen(false)}
                className="cart-drawer-close-btn"
              >
                <X size={16} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="cart-drawer-items-list">
              {cart.length === 0 ? (
                <div className="cart-drawer-empty">
                  <ShoppingBag size={28} style={{ color: 'var(--gray-300)' }} />
                  <p style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Your shopping cart is empty.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="cart-drawer-item-card">
                    <img src={item.image} alt={item.title} className="cart-item-drawer-img" />
                    
                    <div className="cart-item-drawer-mid">
                      <span className="cart-item-drawer-brand">{item.brand}</span>
                      <h4 className="cart-item-drawer-title">{item.title}</h4>
                      <p className="cart-item-drawer-meta">Size {item.size} • {item.condition}</p>
                      <span className="cart-item-drawer-price">${item.price.toFixed(2)}</span>
                    </div>

                    <button 
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="cart-item-drawer-trash-btn"
                      title="Remove from Cart"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="cart-drawer-footer">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
                  <div className="fee-row">
                    <span>Items Subtotal</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--gray-700)' }}>${cart.reduce((a, c) => a + c.price, 0).toFixed(2)}</span>
                  </div>
                  <div className="fee-row">
                    <span>Est. Shipping</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--gray-700)' }}>${cart.reduce((a, c) => a + c.shipping, 0).toFixed(2)}</span>
                  </div>
                  <div className="fee-row-total" style={{ borderTop: '1px dashed var(--gray-200)', paddingTop: '10px' }}>
                    <span>Estimated Total</span>
                    <span className="total-price-color">
                      ${(cart.reduce((a, c) => a + c.price, 0) + cart.reduce((a, c) => a + c.shipping, 0)).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="buyer-protection-banner" style={{ margin: '0 0 10px 0' }}>
                  <Shield size={16} style={{ flexShrink: 0 }} />
                  <span>Buyer Protection Guarantee is included.</span>
                </div>

                <button
                  onClick={() => requireAccount('buy', () => { setCartOpen(false); setCheckoutItemOverride(null); setCheckoutOpen(true); })}
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                >
                  <span>Checkout All Items</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACCOUNT DETAILS / ONBOARDING */}
      {accountModalOpen && (
        <AccountDetails
          account={account}
          currentRole={currentRole}
          context={accountContext}
          onClose={handleCloseAccount}
          onSave={handleSaveAccount}
          onUpdateAccount={handleUpdateAccount}
        />
      )}

      {/* AUTH (cloud mode) */}
      {authModalOpen && (
        <AuthModal
          onClose={() => setAuthModalOpen(false)}
          onAuthed={() => setAuthModalOpen(false)}
        />
      )}
    </div>
  );
}
