import vintageJacket from '../assets/vintage_jacket.jpg';
import retroSneakers from '../assets/retro_sneakers.jpg';
import knitSweater from '../assets/knit_sweater.jpg';
import canvasBag from '../assets/canvas_bag.jpg';

export const currentUser = {
  username: 'relove_curator',
  name: 'Alex Mercer',
  avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex',
  walletBalance: 120.00,
  joinedYear: '2025',
  reviews: 42,
  rating: 4.8
};

// Blank account profile. Users must complete the relevant sections before they
// can buy (checkout) or sell (list an item). Only non-sensitive fields live
// here — card payments and seller payouts are handled entirely by Stripe.
export const initialAccount = {
  // Personal & contact
  fullName: '',
  email: '',
  phone: '',
  // Shipping address
  street: '',
  city: '',
  postalCode: '',
  country: '',
  // Stripe Connect (sellers). Set after onboarding; never holds bank details.
  stripeAccountId: '',
  payoutsEnabled: false
};

// Field groups required per action. `buy` = required to check out,
// `sell` = required to list an item. Payments/payouts are Stripe's job, so
// they're intentionally not gated here as local fields.
export const ACCOUNT_REQUIREMENTS = {
  personal: { label: 'Personal & contact', fields: ['fullName', 'email', 'phone'], for: ['buy', 'sell'] },
  shipping: { label: 'Shipping address', fields: ['street', 'city', 'postalCode', 'country'], for: ['buy', 'sell'] }
};

// Returns true if every field required for `context` ('buy' | 'sell') is filled.
export function isAccountComplete(account, context) {
  if (!account) return false;
  return Object.values(ACCOUNT_REQUIREMENTS)
    .filter((group) => group.for.includes(context))
    .every((group) => group.fields.every((f) => String(account[f] || '').trim() !== ''));
}

export const initialListings = [
  {
    id: 1,
    title: "Vintage Brown Moto Leather Jacket",
    price: 120.00,
    shipping: 7.50,
    brand: "Harley Davidson",
    size: "L",
    condition: "Very Good",
    category: "Jackets",
    description: "Authentic Harley Davidson leather moto jacket. Distressed brown leather with a gorgeous natural patina, heavy-duty metal zippers, and thick quilted lining. Perfectly broken in, fits slightly oversized.",
    image: vintageJacket,
    owner: "vintage_vibes",
    ownerAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=vibes",
    likes: 24,
    dateAdded: "2026-07-01",
    isSold: false
  },
  {
    id: 2,
    title: "Classic Cream Retro Sneakers",
    price: 85.00,
    shipping: 5.99,
    brand: "New Balance",
    size: "US 9 / EU 42",
    condition: "Excellent",
    category: "Shoes",
    description: "Only worn twice! Cream leather body with forest green accents and gum sole. Super comfortable design, perfect for retro styling. Comes with the original box and extra beige laces.",
    image: retroSneakers,
    owner: "soles_by_sarah",
    ownerAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=sarah",
    likes: 48,
    dateAdded: "2026-07-05",
    isSold: false
  },
  {
    id: 3,
    title: "Chunky Oatmeal Knit Wool Sweater",
    price: 65.00,
    shipping: 4.50,
    brand: "Toast",
    size: "M (Oversized)",
    condition: "Excellent",
    category: "Knitwear",
    description: "Heavyweight chunky ribbed knit sweater. Premium blend of organic merino wool and alpaca, very soft and warm. Elegant oatmeal/beige tone. Drop shoulders, ribbed cuffs and collar.",
    image: knitSweater,
    owner: "minimal_wardrobe",
    ownerAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=minimal",
    likes: 15,
    dateAdded: "2026-07-08",
    isSold: false
  },
  {
    id: 4,
    title: "Canvas Forest Field Backpack",
    price: 95.00,
    shipping: 6.00,
    brand: "Sandqvist",
    size: "One Size",
    condition: "Good",
    category: "Bags",
    description: "Rugged and durable forest green canvas backpack with genuine brown leather straps, solid brass buckles, and multiple compartments. Showing minor, beautiful fading on canvas, which only enhances its rugged character.",
    image: canvasBag,
    owner: "wanderer_store",
    ownerAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=wanderer",
    likes: 31,
    dateAdded: "2026-07-09",
    isSold: false
  },
  {
    id: 5,
    title: "90s Carhartt Denim Chore Jacket",
    price: 75.00,
    shipping: 6.50,
    brand: "Carhartt",
    size: "XL",
    condition: "Good",
    category: "Jackets",
    description: "Vintage 1990s light wash Carhartt denim chore coat. Beautiful wear marks, collar in contrasting brown corduroy. Nicely broken-in fabric, perfect vintage layering item.",
    image: "https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?auto=format&fit=crop&q=80&w=600",
    owner: "denim_dude",
    ownerAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=denim",
    likes: 56,
    dateAdded: "2026-07-02",
    isSold: false
  },
  {
    id: 6,
    title: "Vintage Gold Retro Wristwatch",
    price: 140.00,
    shipping: 0.00,
    brand: "Seiko",
    size: "One Size",
    condition: "Very Good",
    category: "Accessories",
    description: "Classic retro wristwatch with a polished gold-tone case and a rich brown mock-croc leather strap. Very sleek and thin profile. Keeps perfect time, fresh battery installed.",
    image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=600",
    owner: "vintage_time",
    ownerAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=time",
    likes: 19,
    dateAdded: "2026-07-04",
    isSold: false
  }
];

export const initialChats = [
  {
    id: "chat_1",
    partner: "soles_by_sarah",
    partnerAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=sarah",
    listingId: 2,
    listingTitle: "Classic Cream Retro Sneakers",
    listingPrice: 85.00,
    listingImage: retroSneakers,
    messages: [
      { sender: "soles_by_sarah", text: "Hi! Are you still interested in the sneakers? I can ship them out tomorrow morning.", time: "10:15 AM" },
      { sender: "you", text: "Hey! Yes, I am. Would you take $75 for them?", time: "10:18 AM" },
      { sender: "soles_by_sarah", text: "Hmm, how about $80? They are practically brand new and cost $140 retail.", time: "10:22 AM" }
    ],
    offer: {
      active: true,
      amount: 80.00,
      sender: "soles_by_sarah",
      status: "pending"
    }
  },
  {
    id: "chat_2",
    partner: "denim_dude",
    partnerAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=denim",
    listingId: 5,
    listingTitle: "90s Carhartt Denim Chore Jacket",
    listingPrice: 75.00,
    listingImage: "https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?auto=format&fit=crop&q=80&w=600",
    messages: [
      { sender: "you", text: "Hey! What are the chest measurements pit-to-pit?", time: "Yesterday" },
      { sender: "denim_dude", text: "Hey bro, it's 25 inches flat across. Fits like a true relaxed XL.", time: "Yesterday" }
    ],
    offer: null
  }
];

export const initialOrders = [
  {
    id: "ord_92817",
    listingId: 6,
    title: "Vintage Gold Retro Wristwatch",
    price: 140.00,
    shipping: 0.00,
    brand: "Seiko",
    image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=600",
    seller: "vintage_time",
    orderDate: "2026-07-06",
    status: "shipped",
    trackingHistory: [
      { title: "Order Confirmed", desc: "Payment received & confirmed", time: "July 6, 2:10 PM", done: true },
      { title: "Shipped", desc: "Handed over to carrier (FedEx #9812739)", time: "July 7, 9:30 AM", done: true },
      { title: "In Transit", desc: "Departed local sort facility", time: "July 8, 4:15 PM", done: false },
      { title: "Out for Delivery", desc: "Estimated delivery in 1-2 days", time: "", done: false }
    ]
  }
];
