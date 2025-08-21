# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development

```bash
# Install dependencies
pnpm install

# Start development server (runs on http://localhost:5173)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Code Quality & Formatting

```bash
# Run ESLint
pnpm lint

# Auto-fix ESLint issues
pnpm lint:fix

# Format code with Prettier
pnpm format

# Check formatting without changes
pnpm format:check
```

### Git Hooks

```bash
# Setup pre-commit hooks (already done after install via "prepare" script)
pnpm prepare
```

Note: Pre-commit hooks automatically run `prettier --write` and `eslint --fix` on staged files.

## Architecture Overview

### Tech Stack

- **Frontend**: React 19.1.1 + TypeScript + Vite
- **UI Framework**: Chakra UI v3 with custom theming
- **Routing**: React Router DOM v7
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Package Manager**: pnpm

### Project Structure

```
src/
├── components/ui/           # Reusable UI components (Chakra UI themed)
├── lib/
│   ├── supabase/           # Supabase client and utilities
│   │   ├── client.ts       # Main Supabase client configuration
│   │   ├── auth.ts         # Authentication helpers
│   │   ├── realtime.ts     # Real-time subscriptions (orders, stock)
│   │   └── storage.ts      # File upload utilities (product images)
│   └── theme.ts            # Custom Chakra UI theme configuration
├── routes/                 # React Router pages
├── utils/                  # General utility functions
└── App.tsx                 # Main app with routing setup
```

### Database Schema

The app uses a comprehensive e-commerce schema with:

- **User Management**: `profiles` (extends Supabase Auth users)
- **Catalog**: `categories`, `products`, `product_variants`, `product_images`
- **Shopping**: `carts`, `cart_items`
- **Orders**: `orders`, `order_items`, `payments`
- **Promotions**: `coupons`
- **Customer Data**: `addresses`, `reviews`

All tables have Row Level Security (RLS) policies:

- Public read access for catalog data (categories, products, etc.)
- User-specific access for personal data (carts, orders, addresses, reviews)
- Admin override capabilities via `profiles.is_admin` flag

### Authentication Flow

- Sign up/in with email/password or OAuth (Google, GitHub, Apple)
- Automatic profile creation on sign up via `ensureProfileForUser()`
- OAuth callback handled at `/auth/callback` route
- Auth state management through Supabase client

### Real-time Features

The app includes real-time subscriptions for:

- Order status changes (`subscribeOrderStatus`)
- Product stock updates (`subscribeProductStock`)
- Broadcast capabilities via Supabase channels

### File Storage

Product images handled through Supabase Storage:

- Upload via `uploadProductImage()` with automatic content type detection
- Support for both public URLs and signed URLs
- Bucket: "products" (needs to be created in Supabase dashboard)

### Environment Configuration

Required environment variables (`.env.local`):

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development Patterns

- TypeScript path aliases: `@/*` maps to `src/*`
- Strict TypeScript configuration with unused variable warnings
- ESLint + Prettier integration with automatic formatting
- Husky pre-commit hooks for code quality
- Chakra UI's semantic tokens for consistent theming across light/dark modes

### Database Setup

1. Run the SQL schema from `supabase/schema.sql` in Supabase SQL Editor
2. Create a "products" storage bucket (public or with signed URL policies)
3. Set admin users by updating `profiles.is_admin = true` using service role key

### Key Integrations

- **Chakra UI v3**: Component library with custom theme (brand, accent, neutral color palettes)
- **React Router DOM v7**: Client-side routing
- **Supabase**: Full backend-as-a-service (database, auth, storage, realtime)
- **Vite**: Build tool and dev server with SWC for fast compilation
- **TypeScript**: Strict type checking with path aliases
