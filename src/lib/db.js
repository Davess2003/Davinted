import { API_BASE } from './stripe';
import { getAccessToken } from './supabase';

// Thin wrapper over the Express data API. Every call attaches the current
// Supabase JWT so the backend knows who you are.
async function request(path, { method = 'GET', body } = {}) {
  const token = await getAccessToken();
  // Data routes are mounted under /api on the Express server.
  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty / non-JSON */
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.code = data && data.code;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const db = {
  // auth: clear a stuck UNCONFIRMED account so signup can resend confirmation
  resetUnconfirmed: (email) => request('/auth/reset-unconfirmed', { method: 'POST', body: { email } }),

  // uploads (base64 data URL -> Supabase Storage; returns { url })
  uploadImage: (dataUrl) => request('/upload', { method: 'POST', body: { image: dataUrl } }),

  // profile
  getMe: () => request('/me'),
  updateMe: (patch) => request('/me', { method: 'PATCH', body: patch }),

  // listings
  getListings: () => request('/listings'),
  createListing: (listing) => request('/listings', { method: 'POST', body: listing }),
  deleteListing: (id) => request(`/listings/${id}`, { method: 'DELETE' }),

  // likes
  getLikes: () => request('/likes'),
  addLike: (listingId) => request(`/likes/${listingId}`, { method: 'POST' }),
  removeLike: (listingId) => request(`/likes/${listingId}`, { method: 'DELETE' }),

  // orders
  getOrders: () => request('/orders'),
  createOrders: (items) => request('/orders', { method: 'POST', body: { items } }),
  advanceTracking: (orderId) => request(`/orders/${orderId}/track`, { method: 'PATCH' }),

  // chats
  getChats: () => request('/chats'),
  createChat: (chat) => request('/chats', { method: 'POST', body: chat }),
  sendMessage: (chatId, message) => request(`/chats/${chatId}/messages`, { method: 'POST', body: message }),
  updateOffer: (chatId, payload) => request(`/chats/${chatId}/offer`, { method: 'PATCH', body: payload })
};
