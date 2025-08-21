# ShopHub E-Commerce App - Production Deployment Guide

This guide will walk you through deploying the ShopHub e-commerce application to production using Vercel and Supabase.

## Prerequisites

- Node.js 18+ and pnpm installed locally
- A [Vercel account](https://vercel.com/signup) (free tier works)
- A [Supabase account](https://supabase.com) (free tier works)
- Git repository (GitHub, GitLab, or Bitbucket)

## 🚀 Quick Start Deployment

### 1. Supabase Setup

#### Create a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - Project name: `shophub-production`
   - Database Password: (save this securely)
   - Region: Choose closest to your users
   - Pricing Plan: Free tier is fine to start

#### Configure Database Schema

1. In Supabase Dashboard, go to SQL Editor
2. Run the schema from `supabase/schema.sql`
3. Run the additional wishlist schema from `supabase/schema-wishlists.sql`
4. Verify tables are created in the Table Editor

#### Set Up Storage Bucket

1. Go to Storage in Supabase Dashboard
2. Create a new bucket called `products`
3. Set it to public or configure RLS policies as needed

#### Configure Authentication

1. Go to Authentication → Settings
2. Enable Email/Password authentication
3. (Optional) Enable OAuth providers:
   - Google: Add OAuth credentials
   - GitHub: Add OAuth app details
   - Apple: Configure Sign in with Apple

#### Get API Keys

1. Go to Settings → API
2. Copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

### 2. Prepare Your Codebase

#### Update Environment Variables

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Test Locally

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### 3. Deploy to Vercel

#### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - What's your project name? shophub
# - In which directory is your code? ./
# - Want to override settings? No
```

#### Option B: Deploy via GitHub Integration

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure:
   - Framework Preset: Vite
   - Build Command: `pnpm build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

#### Configure Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Settings → Environment Variables
3. Add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
4. Click "Save"

#### Deploy

1. Vercel will automatically deploy on git push
2. Your app will be available at `https://your-app.vercel.app`

## 🔧 Production Configuration

### Database Optimization

#### Add Indexes for Performance

```sql
-- Add these indexes for better query performance
CREATE INDEX idx_products_status_active ON products(status, is_active) WHERE status = 'published' AND is_active = true;
CREATE INDEX idx_cart_items_cart_product ON cart_items(cart_id, product_id);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_reviews_product_rating ON reviews(product_id, rating);
```

#### Enable Realtime for Live Updates

1. In Supabase Dashboard → Database → Replication
2. Enable replication for:
   - `products` (for stock updates)
   - `orders` (for order status)
   - `cart_items` (for cart sync)

### Security Best Practices

#### Row Level Security (RLS)

Ensure all RLS policies are properly configured:

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

#### API Rate Limiting

Configure rate limiting in Supabase Dashboard:

1. Go to Settings → API
2. Set rate limits appropriate for your tier

#### Content Security Policy

Add to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co"
        }
      ]
    }
  ]
}
```

### Performance Optimization

#### Enable Compression

Already configured in `vite.config.ts` for build optimization.

#### Image Optimization

1. Use Vercel's Image Optimization
2. Or integrate with Cloudinary/Imgix for advanced features

#### Monitoring Setup

1. Enable Vercel Analytics (free tier available)
2. Add error tracking with Sentry:

```bash
pnpm add @sentry/react
```

### Custom Domain Setup

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. SSL certificate is automatic

## 📊 Sample Data Setup

### Add Demo Products

```sql
-- Insert sample categories
INSERT INTO categories (name, slug, description, position, is_active) VALUES
('Electronics', 'electronics', 'Latest gadgets and devices', 1, true),
('Clothing', 'clothing', 'Fashion and apparel', 2, true),
('Books', 'books', 'Books and publications', 3, true),
('Home & Garden', 'home-garden', 'Home improvement and gardening', 4, true);

-- Insert sample products
INSERT INTO products (name, slug, description, category_id, status, base_price, is_active) VALUES
('Wireless Headphones', 'wireless-headphones', 'Premium noise-canceling wireless headphones',
 (SELECT id FROM categories WHERE slug = 'electronics'), 'published', 199.99, true),
('Cotton T-Shirt', 'cotton-tshirt', 'Comfortable 100% cotton t-shirt',
 (SELECT id FROM categories WHERE slug = 'clothing'), 'published', 29.99, true);

-- Add sample coupons
INSERT INTO coupons (code, type, amount, is_active) VALUES
('WELCOME10', 'percentage', 10, true),
('SAVE20', 'fixed', 20, true);
```

### Create Admin User

1. Sign up a new user through your app
2. Update their profile to admin:

```sql
UPDATE profiles
SET is_admin = true
WHERE email = 'admin@example.com';
```

## 🚨 Troubleshooting

### Common Issues

#### Build Fails on Vercel

- Check Node version: Specify in `package.json`:

```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### Supabase Connection Issues

- Verify environment variables are set correctly
- Check Supabase project is not paused (free tier pauses after inactivity)
- Ensure RLS policies allow the operations

#### 404 Errors on Routes

- Verify `vercel.json` has the rewrite rule for SPA routing
- Check that the build output is in the `dist` folder

### Performance Issues

- Enable Vercel Edge Functions for API routes
- Use Supabase connection pooling for high traffic
- Implement caching strategies with Vercel Edge Config

## 📈 Scaling Considerations

### When to Upgrade

#### Supabase

- Free tier: 500MB database, 1GB storage, 2GB bandwidth
- Upgrade when approaching limits or need:
  - Point-in-time recovery
  - Read replicas
  - Higher rate limits

#### Vercel

- Hobby tier: 100GB bandwidth, 1000 image optimizations
- Upgrade for:
  - Custom build minutes
  - Team collaboration
  - Advanced analytics

### Database Scaling

1. Implement database connection pooling
2. Add read replicas for heavy read operations
3. Consider caching with Redis/Upstash

### CDN & Edge Functions

1. Use Vercel Edge Functions for API routes
2. Implement ISR (Incremental Static Regeneration) for product pages
3. Cache static assets with long TTLs

## 🔐 Security Checklist

- [ ] Environment variables are not committed to git
- [ ] RLS policies are properly configured
- [ ] API keys are restricted to specific domains
- [ ] HTTPS is enforced
- [ ] Rate limiting is enabled
- [ ] SQL injection prevention (Supabase handles this)
- [ ] XSS protection headers are set
- [ ] CORS is properly configured
- [ ] Regular security updates for dependencies

## 📱 Post-Deployment

### Monitor Your App

1. Set up Vercel Analytics
2. Configure uptime monitoring (e.g., UptimeRobot)
3. Set up error tracking (Sentry)
4. Monitor Supabase metrics

### Backup Strategy

1. Enable daily backups in Supabase (Pro plan)
2. Regular exports of critical data
3. Test restore procedures

### Maintenance Mode

Create a maintenance page and update `vercel.json`:

```json
{
  "redirects": [
    {
      "source": "/(.*)",
      "destination": "/maintenance.html",
      "permanent": false
    }
  ]
}
```

## 🎉 Launch Checklist

- [ ] All environment variables configured
- [ ] Database schema deployed and verified
- [ ] Sample data loaded (or real data migrated)
- [ ] Authentication providers configured
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Monitoring and analytics set up
- [ ] Backup strategy in place
- [ ] Admin user created
- [ ] Payment processing configured (if using)
- [ ] Email templates configured in Supabase
- [ ] RLS policies tested
- [ ] Performance testing completed
- [ ] Security headers configured
- [ ] SEO meta tags updated

## 📞 Support

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Supabase Support**: [supabase.com/support](https://supabase.com/support)
- **Community**: Join Discord/Slack communities for both platforms

---

Happy deploying! 🚀 Your e-commerce app is ready for production!
