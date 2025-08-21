# Supabase E-commerce Schema Setup

This folder contains the SQL to provision a basic e-commerce database with Row Level Security (RLS) policies suitable for using the anon key in the browser.

What’s included

- Tables: profiles, categories, products, product_images, product_variants, coupons, carts, cart_items, addresses, orders, order_items, payments, reviews
- Enums: order_status, payment_status, cart_status, address_type, product_status, coupon_type
- Triggers: updated_at on mutable tables
- Policies: public read for catalog; per-user access for carts, addresses, orders, payments, reviews; admin override via profiles.is_admin

How to apply

1. Open your Supabase project dashboard.
2. Go to SQL Editor.
3. Paste the contents of schema.sql and run it (or upload and run).

Admin users

- Set a user as admin by updating profiles.is_admin to true (using the service role key in the SQL editor or a secure backend).

Storage (images)

- If you are using Supabase Storage, create a bucket (e.g. "products") and make it public or add signed URL logic.

Local development

- Env vars are configured in .env.local as VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Restart dev server after changing env vars.

Next steps

- Seed with sample data (optional)
- Add auth flows (sign in/out) and profile creation after sign-up
- Implement server-side webhooks for payments if applicable

Using the helpers in React
• Order status subscription:
import { useEffect } from 'react'
import { subscribeOrderStatus } from '@/lib/supabase/realtime'

useEffect(() => {
const unsubscribe = subscribeOrderStatus(orderId, ({ new: row }) => {
// row.status contains the new status
})
return unsubscribe
}, [orderId])

• Product stock subscription:
import { subscribeProductStock } from '@/lib/supabase/realtime'

useEffect(() => {
const unsubscribe = subscribeProductStock(productId, { stockColumn: 'stock' }, ({ new: row }) => {
// row.stock (or stock_quantity) changed
})
return unsubscribe
}, [productId])

Notes
