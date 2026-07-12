-- ============================================================================
-- Relove — Supabase schema
-- Run this in your Supabase project: SQL Editor → paste → Run.
-- Safe to re-run: uses IF NOT EXISTS / idempotent guards throughout.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user (mirrors auth.users).
-- Auto-created on signup by the handle_new_user trigger below.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  full_name     text,
  email         text,
  phone         text,
  avatar_url    text,
  street        text,
  city          text,
  postal_code   text,
  country       text,
  role          text not null default 'dual',
  wallet_balance    numeric(10,2) not null default 0,
  stripe_account_id text,
  payouts_enabled   boolean not null default false,
  rating        numeric(3,2) not null default 5.0,
  reviews       integer not null default 0,
  joined_year   text,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- listings: the marketplace catalog.
-- seller_id is null for the seed/demo sellers (who aren't real auth users);
-- real posts carry the poster's profile id. owner_username/owner_avatar are
-- denormalized so the catalog always renders without a profiles join.
-- ---------------------------------------------------------------------------
create table if not exists public.listings (
  id            bigint generated always as identity primary key,
  seller_id     uuid references public.profiles(id) on delete set null,
  owner_username text not null,
  owner_avatar  text,
  title         text not null,
  description   text,
  price         numeric(10,2) not null default 0,
  shipping      numeric(10,2) not null default 0,
  brand         text,
  size          text,
  condition     text,
  category      text,
  image_url     text,
  likes         integer not null default 0,
  is_sold       boolean not null default false,
  date_added    date not null default current_date,
  created_at    timestamptz not null default now()
);
create index if not exists listings_seller_id_idx on public.listings(seller_id);
create index if not exists listings_category_idx on public.listings(category);

-- ---------------------------------------------------------------------------
-- likes: which user liked which listing (many-to-many).
-- ---------------------------------------------------------------------------
create table if not exists public.likes (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  listing_id  bigint not null references public.listings(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- ---------------------------------------------------------------------------
-- orders: completed purchases (one row per bought item).
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  buyer_id      uuid not null references public.profiles(id) on delete cascade,
  listing_id    bigint references public.listings(id) on delete set null,
  title         text,
  brand         text,
  image_url     text,
  price         numeric(10,2) not null default 0,
  shipping      numeric(10,2) not null default 0,
  seller_username text,
  order_date    date not null default current_date,
  status        text not null default 'confirmed',
  created_at    timestamptz not null default now()
);
create index if not exists orders_buyer_id_idx on public.orders(buyer_id);

-- ---------------------------------------------------------------------------
-- order_tracking: shipment timeline steps for an order.
-- ---------------------------------------------------------------------------
create table if not exists public.order_tracking (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders(id) on delete cascade,
  step_index  integer not null,
  title       text not null,
  description text,
  time        text,
  done        boolean not null default false
);
create index if not exists order_tracking_order_id_idx on public.order_tracking(order_id);

-- ---------------------------------------------------------------------------
-- chats: a negotiation/message thread between a buyer and a listing's seller.
-- The current user is always the buyer_id; the counterpart is stored by name.
-- Offer state lives inline (matches the app's chat.offer object).
-- ---------------------------------------------------------------------------
create table if not exists public.chats (
  id              uuid primary key default gen_random_uuid(),
  buyer_id        uuid not null references public.profiles(id) on delete cascade,
  partner_username text not null,
  partner_avatar  text,
  listing_id      bigint references public.listings(id) on delete set null,
  listing_title   text,
  listing_price   numeric(10,2),
  listing_image   text,
  offer_active    boolean not null default false,
  offer_amount    numeric(10,2),
  offer_sender    text,
  offer_status    text,
  created_at      timestamptz not null default now()
);
create index if not exists chats_buyer_id_idx on public.chats(buyer_id);

-- ---------------------------------------------------------------------------
-- messages: individual messages within a chat.
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id          bigint generated always as identity primary key,
  chat_id     uuid not null references public.chats(id) on delete cascade,
  sender      text not null,
  text        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists messages_chat_id_idx on public.messages(chat_id);

-- ============================================================================
-- Auto-create a profile row when a new auth user signs up.
-- username/full_name come from the signup metadata; falls back to the email.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, email, avatar_url, joined_year)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      'https://api.dicebear.com/7.x/adventurer/svg?seed=' || split_part(new.email, '@', 1)
    ),
    to_char(now(), 'YYYY')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row Level Security.
-- The app talks to the DB through the Express backend using the service-role
-- key (which BYPASSES RLS) and enforces ownership in code. These policies are
-- defence-in-depth so the tables are still safe if ever queried with the anon
-- key directly (e.g. future realtime subscriptions).
-- ============================================================================
alter table public.profiles       enable row level security;
alter table public.listings       enable row level security;
alter table public.likes          enable row level security;
alter table public.orders         enable row level security;
alter table public.order_tracking enable row level security;
alter table public.chats          enable row level security;
alter table public.messages       enable row level security;

-- profiles: anyone can read (public seller info); you manage only your own row.
drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select using (true);
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);

-- listings: public catalog is readable by everyone; you manage your own posts.
drop policy if exists "listings readable" on public.listings;
create policy "listings readable" on public.listings for select using (true);
drop policy if exists "listings insert own" on public.listings;
create policy "listings insert own" on public.listings for insert with check (auth.uid() = seller_id);
drop policy if exists "listings update own" on public.listings;
create policy "listings update own" on public.listings for update using (auth.uid() = seller_id);
drop policy if exists "listings delete own" on public.listings;
create policy "listings delete own" on public.listings for delete using (auth.uid() = seller_id);

-- likes: you manage only your own likes.
drop policy if exists "likes own" on public.likes;
create policy "likes own" on public.likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- orders: you see and create only your own orders.
drop policy if exists "orders own" on public.orders;
create policy "orders own" on public.orders for all using (auth.uid() = buyer_id) with check (auth.uid() = buyer_id);

-- order_tracking: accessible only via an order you own.
drop policy if exists "order_tracking via order" on public.order_tracking;
create policy "order_tracking via order" on public.order_tracking for all
  using (exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid()))
  with check (exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid()));

-- chats: you see and manage only chats where you're the buyer.
drop policy if exists "chats own" on public.chats;
create policy "chats own" on public.chats for all using (auth.uid() = buyer_id) with check (auth.uid() = buyer_id);

-- messages: accessible only via a chat you own.
drop policy if exists "messages via chat" on public.messages;
create policy "messages via chat" on public.messages for all
  using (exists (select 1 from public.chats c where c.id = chat_id and c.buyer_id = auth.uid()))
  with check (exists (select 1 from public.chats c where c.id = chat_id and c.buyer_id = auth.uid()));

-- ============================================================================
-- Seed the catalog with the original demo listings (only if empty).
-- These use owner_username with a null seller_id so the marketplace is
-- populated out of the box; real users' posts sit alongside them.
-- ============================================================================
do $$
begin
  if not exists (select 1 from public.listings) then
    insert into public.listings
      (owner_username, owner_avatar, title, description, price, shipping, brand, size, condition, category, image_url, likes, date_added)
    values
      ('vintage_vibes',   'https://api.dicebear.com/7.x/adventurer/svg?seed=vibes',
       'Vintage Brown Moto Leather Jacket',
       'Authentic Harley Davidson leather moto jacket. Distressed brown leather with a gorgeous natural patina, heavy-duty metal zippers, and thick quilted lining. Perfectly broken in, fits slightly oversized.',
       120.00, 7.50, 'Harley Davidson', 'L', 'Very Good', 'Jackets',
       'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=600', 24, '2026-07-01'),
      ('soles_by_sarah',  'https://api.dicebear.com/7.x/adventurer/svg?seed=sarah',
       'Classic Cream Retro Sneakers',
       'Only worn twice! Cream leather body with forest green accents and gum sole. Super comfortable design, perfect for retro styling. Comes with the original box and extra beige laces.',
       85.00, 5.99, 'New Balance', 'US 9 / EU 42', 'Excellent', 'Shoes',
       'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=600', 48, '2026-07-05'),
      ('knit_wit',        'https://api.dicebear.com/7.x/adventurer/svg?seed=knit',
       'Chunky Oatmeal Knit Wool Sweater',
       'Heavyweight chunky ribbed knit sweater. Premium blend of organic merino wool and alpaca, very soft and warm. Elegant oatmeal/beige tone. Drop shoulders, ribbed cuffs and collar.',
       65.00, 4.50, 'Toast', 'M (Oversized)', 'Excellent', 'Knitwear',
       'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&q=80&w=600', 31, '2026-07-06'),
      ('bag_lady_bex',    'https://api.dicebear.com/7.x/adventurer/svg?seed=bex',
       'Structured Tan Canvas Tote Bag',
       'Durable waxed canvas tote with tan leather straps and brass hardware. Roomy interior with a zip pocket. Barely used, holds its structure beautifully.',
       45.00, 6.00, 'Everlane', 'One Size', 'Excellent', 'Bags',
       'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600', 19, '2026-07-08');
  end if;
end $$;
