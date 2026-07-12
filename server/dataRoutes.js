import { Router } from 'express';
import { supabaseAdmin, requireAuth, requireSupabase } from './supabase.js';

const router = Router();

// ---- snake_case (DB) -> camelCase (frontend) mappers ----------------------

function mapListing(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    shipping: Number(row.shipping),
    brand: row.brand,
    size: row.size,
    condition: row.condition,
    category: row.category,
    image: row.image_url,
    owner: row.owner_username,
    ownerAvatar: row.owner_avatar,
    sellerId: row.seller_id,
    likes: row.likes,
    dateAdded: row.date_added,
    isSold: row.is_sold
  };
}

function mapProfile(row) {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    walletBalance: Number(row.wallet_balance),
    account: {
      fullName: row.full_name || '',
      email: row.email || '',
      phone: row.phone || '',
      street: row.street || '',
      city: row.city || '',
      postalCode: row.postal_code || '',
      country: row.country || '',
      stripeAccountId: row.stripe_account_id || '',
      payoutsEnabled: row.payouts_enabled || false
    },
    avatar: row.avatar_url,
    rating: Number(row.rating),
    reviews: row.reviews,
    joinedYear: row.joined_year
  };
}

function mapOrder(row) {
  return {
    id: row.id,
    listingId: row.listing_id,
    title: row.title,
    brand: row.brand,
    image: row.image_url,
    price: Number(row.price),
    shipping: Number(row.shipping),
    seller: row.seller_username,
    orderDate: row.order_date,
    status: row.status,
    trackingHistory: (row.order_tracking || [])
      .sort((a, b) => a.step_index - b.step_index)
      .map((t) => ({ title: t.title, desc: t.description, time: t.time || '', done: t.done }))
  };
}

function mapChat(row) {
  return {
    id: row.id,
    partner: row.partner_username,
    partnerAvatar: row.partner_avatar,
    listingId: row.listing_id,
    listingTitle: row.listing_title,
    listingPrice: row.listing_price != null ? Number(row.listing_price) : null,
    listingImage: row.listing_image,
    messages: (row.messages || [])
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((m) => ({
        sender: m.sender,
        text: m.text,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })),
    offer: row.offer_active
      ? { active: true, amount: Number(row.offer_amount), sender: row.offer_sender, status: row.offer_status }
      : null
  };
}

const fail = (res, err) => res.status(500).json({ error: err.message || String(err) });

// ===========================================================================
// IMAGE UPLOAD  ->  Supabase Storage (public bucket "listings")
// Frontend sends a base64 data URL; we store the file and return its public
// URL, so listing rows only ever hold a short URL (never megabytes of base64).
// ===========================================================================
const BUCKET = 'listings';
let bucketReady = false;

async function ensureBucket() {
  if (bucketReady) return;
  // Idempotent: ignore "already exists".
  await supabaseAdmin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: '12MB'
  }).catch(() => {});
  bucketReady = true;
}

router.post('/upload', requireAuth, async (req, res) => {
  try {
    const dataUrl = req.body?.image || '';
    const match = /^data:(.+?);base64,(.*)$/s.exec(dataUrl);
    if (!match) return res.status(400).json({ error: 'Expected a base64 data URL.' });

    const contentType = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    const ext = (contentType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    const path = `${req.userId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;

    await ensureBucket();
    const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, buffer, {
      contentType,
      upsert: false
    });
    if (error) return fail(res, error);

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    res.json({ url: data.publicUrl });
  } catch (err) {
    fail(res, err);
  }
});

// ===========================================================================
// PROFILE  (the signed-in user)
// ===========================================================================
router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', req.userId).single();
  if (error) return fail(res, error);
  res.json(mapProfile(data));
});

router.patch('/me', requireAuth, async (req, res) => {
  const b = req.body || {};
  const patch = {};
  // account details
  if (b.account) {
    const a = b.account;
    Object.assign(patch, {
      full_name: a.fullName, email: a.email, phone: a.phone,
      street: a.street, city: a.city, postal_code: a.postalCode, country: a.country,
      stripe_account_id: a.stripeAccountId, payouts_enabled: a.payoutsEnabled
    });
  }
  if (b.role !== undefined) patch.role = b.role;
  if (b.walletBalance !== undefined) patch.wallet_balance = b.walletBalance;
  // strip undefined so we don't null out untouched columns
  Object.keys(patch).forEach((k) => patch[k] === undefined && delete patch[k]);

  const { data, error } = await supabaseAdmin.from('profiles').update(patch).eq('id', req.userId).select('*').single();
  if (error) return fail(res, error);
  res.json(mapProfile(data));
});

// ===========================================================================
// LISTINGS
// ===========================================================================
// Public catalog — no auth required, but still needs Supabase configured.
router.get('/listings', requireSupabase, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return fail(res, error);
  res.json(data.map(mapListing));
});

router.post('/listings', requireAuth, async (req, res) => {
  const b = req.body || {};
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('username, avatar_url').eq('id', req.userId).single();

  const insert = {
    seller_id: req.userId,
    owner_username: profile?.username || 'seller',
    owner_avatar: profile?.avatar_url,
    title: b.title,
    description: b.description,
    price: b.price,
    shipping: b.shipping,
    brand: b.brand,
    size: b.size,
    condition: b.condition,
    category: b.category,
    image_url: b.image,
    date_added: b.dateAdded || undefined
  };
  const { data, error } = await supabaseAdmin.from('listings').insert(insert).select('*').single();
  if (error) return fail(res, error);
  res.json(mapListing(data));
});

router.delete('/listings/:id', requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('listings').delete().eq('id', req.params.id).eq('seller_id', req.userId);
  if (error) return fail(res, error);
  res.json({ ok: true });
});

// ===========================================================================
// LIKES
// ===========================================================================
router.get('/likes', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('likes').select('listing_id').eq('user_id', req.userId);
  if (error) return fail(res, error);
  res.json(data.map((r) => r.listing_id));
});

router.post('/likes/:listingId', requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('likes')
    .upsert({ user_id: req.userId, listing_id: req.params.listingId }, { onConflict: 'user_id,listing_id' });
  if (error) return fail(res, error);
  res.json({ ok: true });
});

router.delete('/likes/:listingId', requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('likes').delete().eq('user_id', req.userId).eq('listing_id', req.params.listingId);
  if (error) return fail(res, error);
  res.json({ ok: true });
});

// ===========================================================================
// ORDERS
// ===========================================================================
router.get('/orders', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, order_tracking(*)')
    .eq('buyer_id', req.userId)
    .order('created_at', { ascending: false });
  if (error) return fail(res, error);
  res.json(data.map(mapOrder));
});

// Create orders for a set of purchased items; marks the listings sold.
router.post('/orders', requireAuth, async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ error: 'No items provided.' });

  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const created = [];

  for (const item of items) {
    const { data: order, error: oErr } = await supabaseAdmin
      .from('orders')
      .insert({
        buyer_id: req.userId,
        listing_id: item.id,
        title: item.title,
        brand: item.brand,
        image_url: item.image,
        price: item.price,
        shipping: item.shipping,
        seller_username: item.owner,
        status: 'confirmed'
      })
      .select('*')
      .single();
    if (oErr) return fail(res, oErr);

    const steps = [
      { order_id: order.id, step_index: 0, title: 'Order Confirmed', description: 'Payment received & confirmed', time: nowTime, done: true },
      { order_id: order.id, step_index: 1, title: 'Shipped', description: 'Preparing label', time: '', done: false },
      { order_id: order.id, step_index: 2, title: 'In Transit', description: 'Awaiting courier pickup', time: '', done: false },
      { order_id: order.id, step_index: 3, title: 'Delivered', description: 'Arrival scan', time: '', done: false }
    ];
    const { data: tracking, error: tErr } = await supabaseAdmin.from('order_tracking').insert(steps).select('*');
    if (tErr) return fail(res, tErr);

    // Mark the listing sold (service role bypasses RLS on other users' listings).
    if (item.id != null) {
      await supabaseAdmin.from('listings').update({ is_sold: true }).eq('id', item.id);
    }

    created.push(mapOrder({ ...order, order_tracking: tracking }));
  }

  res.json(created);
});

// Advance an order's tracking to the next pending step.
router.patch('/orders/:id/track', requireAuth, async (req, res) => {
  const { data: order, error } = await supabaseAdmin
    .from('orders').select('*, order_tracking(*)').eq('id', req.params.id).eq('buyer_id', req.userId).single();
  if (error) return fail(res, error);

  const steps = (order.order_tracking || []).sort((a, b) => a.step_index - b.step_index);
  const next = steps.find((s) => !s.done);
  if (!next) return res.json(mapOrder(order));

  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  await supabaseAdmin.from('order_tracking').update({ done: true, time: nowTime }).eq('id', next.id);

  const statusByStep = { 1: 'shipped', 2: 'in_transit', 3: 'delivered' };
  const newStatus = statusByStep[next.step_index];
  if (newStatus) await supabaseAdmin.from('orders').update({ status: newStatus }).eq('id', order.id);

  const { data: fresh } = await supabaseAdmin
    .from('orders').select('*, order_tracking(*)').eq('id', order.id).single();
  res.json(mapOrder(fresh));
});

// ===========================================================================
// CHATS + MESSAGES + OFFERS
// ===========================================================================
router.get('/chats', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('chats')
    .select('*, messages(*)')
    .eq('buyer_id', req.userId)
    .order('created_at', { ascending: false });
  if (error) return fail(res, error);
  res.json(data.map(mapChat));
});

router.post('/chats', requireAuth, async (req, res) => {
  const b = req.body || {};
  const insert = {
    buyer_id: req.userId,
    partner_username: b.partner,
    partner_avatar: b.partnerAvatar,
    listing_id: b.listingId,
    listing_title: b.listingTitle,
    listing_price: b.listingPrice,
    listing_image: b.listingImage,
    offer_active: b.offer ? b.offer.active : false,
    offer_amount: b.offer ? b.offer.amount : null,
    offer_sender: b.offer ? b.offer.sender : null,
    offer_status: b.offer ? b.offer.status : null
  };
  const { data: chat, error } = await supabaseAdmin.from('chats').insert(insert).select('*').single();
  if (error) return fail(res, error);

  if (b.firstMessage) {
    await supabaseAdmin.from('messages').insert({
      chat_id: chat.id, sender: b.firstMessage.sender || 'you', text: b.firstMessage.text
    });
  }
  const { data: fresh } = await supabaseAdmin.from('chats').select('*, messages(*)').eq('id', chat.id).single();
  res.json(mapChat(fresh));
});

router.post('/chats/:id/messages', requireAuth, async (req, res) => {
  const { id } = req.params;
  const b = req.body || {};
  // ownership check
  const { data: chat, error: cErr } = await supabaseAdmin
    .from('chats').select('id').eq('id', id).eq('buyer_id', req.userId).single();
  if (cErr || !chat) return res.status(404).json({ error: 'Chat not found.' });

  const { error } = await supabaseAdmin.from('messages').insert({
    chat_id: id, sender: b.sender || 'you', text: b.text
  });
  if (error) return fail(res, error);
  res.json({ ok: true });
});

// Update the offer on a chat (new / counter / accept / decline), optionally
// appending a system message.
router.patch('/chats/:id/offer', requireAuth, async (req, res) => {
  const { id } = req.params;
  const b = req.body || {};
  const { data: chat, error: cErr } = await supabaseAdmin
    .from('chats').select('id').eq('id', id).eq('buyer_id', req.userId).single();
  if (cErr || !chat) return res.status(404).json({ error: 'Chat not found.' });

  const patch = {};
  if (b.offer !== undefined) {
    patch.offer_active = b.offer ? b.offer.active : false;
    patch.offer_amount = b.offer ? b.offer.amount : null;
    patch.offer_sender = b.offer ? b.offer.sender : null;
    patch.offer_status = b.offer ? b.offer.status : null;
  }
  const { error } = await supabaseAdmin.from('chats').update(patch).eq('id', id);
  if (error) return fail(res, error);

  if (b.message) {
    await supabaseAdmin.from('messages').insert({
      chat_id: id, sender: b.message.sender || 'you', text: b.message.text
    });
  }
  const { data: fresh } = await supabaseAdmin.from('chats').select('*, messages(*)').eq('id', id).single();
  res.json(mapChat(fresh));
});

export default router;
