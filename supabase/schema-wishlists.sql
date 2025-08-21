-- Wishlists table (to be added to existing schema)
create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);

create index if not exists wishlists_user_idx on public.wishlists(user_id);
create index if not exists wishlists_product_idx on public.wishlists(product_id);

-- Enable RLS
alter table public.wishlists enable row level security;

-- Wishlist policies: users manage their own
create policy wishlists_owner_all on public.wishlists
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
