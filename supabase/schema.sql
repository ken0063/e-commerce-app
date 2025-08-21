-- E-commerce Schema for Supabase (PostgreSQL)
-- Safe to run multiple times (IF NOT EXISTS used where applicable)

-- Extensions
create extension if not exists pgcrypto;

-- Helper: updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Enums
create type public.order_status as enum ('pending','confirmed','paid','shipped','completed','cancelled','refunded');
create type public.payment_status as enum ('pending','succeeded','failed','refunded');
create type public.cart_status as enum ('active','converted','abandoned');
create type public.address_type as enum ('shipping','billing');
create type public.product_status as enum ('draft','published','archived');
create type public.coupon_type as enum ('percentage','fixed');

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  parent_id uuid references public.categories(id) on delete set null,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists categories_parent_idx on public.categories(parent_id);
create trigger set_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  status public.product_status not null default 'draft',
  base_price numeric(12,2), -- optional when using variants
  currency text default 'USD',
  is_active boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_status_idx on public.products(status);
create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Product Images (store public URL or storage path)
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null, -- e.g., storage path or external URL
  alt text,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images(product_id);

-- Product Variants
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text unique,
  name text, -- e.g., "Red / Large"
  price numeric(12,2) not null,
  currency text default 'USD',
  stock int not null default 0,
  attributes jsonb not null default '{}'::jsonb, -- arbitrary variant attributes
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists product_variants_product_idx on public.product_variants(product_id);
create trigger set_product_variants_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

-- Coupons / Promotions
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type public.coupon_type not null,
  amount numeric(12,2) not null, -- if percentage, use 0-100
  max_uses int,
  per_user_limit int,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists coupons_active_idx on public.coupons(is_active);
create trigger set_coupons_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at();

-- Carts
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.cart_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists carts_user_idx on public.carts(user_id);
create trigger set_carts_updated_at
  before update on public.carts
  for each row execute function public.set_updated_at();

-- Cart Items
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  currency text default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_item_product_or_variant check (
    (product_id is not null) or (variant_id is not null)
  )
);
create index if not exists cart_items_cart_idx on public.cart_items(cart_id);
create trigger set_cart_items_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();

-- Addresses
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.address_type not null,
  name text,
  phone text,
  line1 text not null,
  line2 text,
  city text not null,
  state text,
  postal_code text not null,
  country text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists addresses_user_idx on public.addresses(user_id);
create trigger set_addresses_updated_at
  before update on public.addresses
  for each row execute function public.set_updated_at();

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.order_status not null default 'pending',
  subtotal numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  shipping_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  currency text default 'USD',
  shipping_address_id uuid references public.addresses(id) on delete set null,
  billing_address_id uuid references public.addresses(id) on delete set null,
  coupon_id uuid references public.coupons(id) on delete set null,
  placed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);
create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Order Items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete set null,
  name text, -- snapshot name
  sku text,  -- snapshot sku
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  total numeric(12,2) not null,
  currency text default 'USD',
  created_at timestamptz not null default now()
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- Payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  status public.payment_status not null default 'pending',
  amount numeric(12,2) not null,
  currency text default 'USD',
  payment_intent_id text, -- provider-side id
  created_at timestamptz not null default now()
);
create index if not exists payments_order_idx on public.payments(order_id);

-- Reviews
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  title text,
  content text,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists reviews_product_idx on public.reviews(product_id);
create index if not exists reviews_user_idx on public.reviews(user_id);

-- RLS Policies
-- Enable RLS
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.coupons enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;

-- Helper: check if current user is admin
create or replace function public.is_admin(u uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.profiles p where p.id = u and p.is_admin = true
  );
$$;

-- Profiles: users manage their own profile; admins can read all
create policy profiles_self_select on public.profiles
  for select using (auth.uid() = id or public.is_admin(auth.uid()));
create policy profiles_self_update on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Catalog: public read, only admins/service role write
create policy categories_public_read on public.categories
  for select using (true);
create policy categories_admin_write on public.categories
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy products_public_read on public.products
  for select using (status = 'published' and is_active = true) ;
create policy products_admin_read_all on public.products
  for select using (public.is_admin(auth.uid()));
create policy products_admin_write on public.products
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy product_images_public_read on public.product_images
  for select using (true);
create policy product_images_admin_write on public.product_images
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy product_variants_public_read on public.product_variants
  for select using (true);
create policy product_variants_admin_write on public.product_variants
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Coupons: allow read to all (to validate codes client-side if needed); writes admin only
create policy coupons_public_read on public.coupons
  for select using (true);
create policy coupons_admin_write on public.coupons
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Carts: owner only
create policy carts_owner_all on public.carts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Cart Items: via cart ownership
create policy cart_items_owner_all on public.cart_items
  for all using (
    exists(select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  ) with check (
    exists(select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  );

-- Addresses: owner only
create policy addresses_owner_all on public.addresses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Orders: owner only
create policy orders_owner_all on public.orders
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Order Items: by owning parent order
create policy order_items_owner_all on public.order_items
  for all using (
    exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  ) with check (
    exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

-- Payments: by owning parent order
create policy payments_owner_all on public.payments
  for all using (
    exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  ) with check (
    exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

-- Reviews: users manage their own; public can read only public reviews
create policy reviews_public_read on public.reviews
  for select using (is_public = true);
create policy reviews_owner_all on public.reviews
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Optional: grant usage/select on enums to public (Supabase handles privileges via policies)

