# Adithya Trading — Admin Panel

## Project Overview

Admin panel for Adithya Trading, a local wholesale e-commerce business
targeting Kozhikode district, Kerala. This is the ADMIN ONLY project.
Customer store is a separate project connecting to the same Supabase instance.

## Tech Stack

- Framework: Next.js 15 (App Router)
- Language: TypeScript (strict, no any)
- Database + Auth: Supabase
- Styling: Tailwind CSS
- State Management: Zustand
- Package Manager: pnpm
- Icons: lucide-react
- Utilities: clsx, tailwind-merge

## Project Type

ADMIN PANEL ONLY — no customer-facing pages.
Customer store is a separate Next.js project.
Both projects share the same Supabase project and database.

## Folder Structure

src/
├── app/
│ ├── page.tsx → redirect to /dashboard or /login
│ ├── login/page.tsx → admin login (email + password)
│ ├── dashboard/page.tsx → stats overview
│ ├── products/
│ │ ├── page.tsx → product list
│ │ └── [id]/page.tsx → add / edit product
│ ├── categories/page.tsx → category management
│ ├── orders/
│ │ ├── page.tsx → all orders
│ │ └── [id]/page.tsx → order detail + status update
│ ├── coupons/page.tsx → coupon management
│ └── api/ → API route handlers
├── components/
│ ├── ui/ → Button, Input, Modal, Badge, Toast, Spinner
│ ├── admin/ → Sidebar, Header, ProductForm, OrderTable
│ └── layouts/ → AdminLayout
├── hooks/
│ ├── useAuth.ts → admin auth state + login/logout
│ ├── useProducts.ts → product CRUD operations
│ ├── useOrders.ts → order fetching + status updates
│ ├── useCategories.ts → category CRUD
│ ├── useCoupons.ts → coupon CRUD
│ └── useDashboard.ts → dashboard stats
├── lib/
│ ├── supabase/
│ │ ├── client.ts → browser Supabase client
│ │ └── server.ts → server Supabase client
│ ├── utils.ts → cn(), formatPrice(), formatDate()
│ └── constants.ts → ROUTES, ORDER_STATUSES, APP_CONFIG
├── store/
│ └── authStore.ts → Zustand admin auth store
├── types/
│ ├── index.ts → Product, Order, Category, Coupon types
│ └── database.ts → Supabase generated DB types
└── middleware.ts → protect all routes except /login

## Routing Rules

- / → redirect to /dashboard (if logged in) or /login (if not)
- /login → public, admin email + password login
- /dashboard → protected
- /products → protected
- /categories → protected
- /orders → protected
- /coupons → protected
- All /api/\* → protected except public webhooks

## Authentication

- Single admin user — email + password via Supabase Auth
- NO Google OAuth, NO Magic Link for admin
- JWT session managed by Supabase SSR
- middleware.ts protects all routes except /login
- On logout → redirect to /login

## Coding Rules

- No any in TypeScript — always define proper types
- Server Components by default
- Add "use client" only when using useState, useEffect, event handlers
- Always use @/ import alias — never relative paths like ../../
- Use cn() from @/lib/utils for conditional Tailwind classes
- Components only handle UI — no direct Supabase calls in components
- All Supabase calls go inside hooks/ or api/ routes
- Keep components small — one responsibility per file
- Custom hooks abstract ALL data logic from components
- Use useCallback and useMemo where re-renders matter
- Optimistic UI updates in hooks before API response

## Database Tables (Supabase)

- profiles → admin user profile
- categories → product categories
- products → product catalog
- product_images → multiple images per product (max 4)
- orders → customer orders
- order_items → line items per order
- coupons → discount coupons

## Order Statuses

pending → confirmed → out_for_delivery → delivered

## Payment Methods

- Razorpay (online)
- COD (cash on delivery)

## Key Business Rules

- Delivery only within Kozhikode district
- Max 4 images per product, min 1 required
- Low stock alert threshold configurable per product
- Single admin user — no multi-user admin support needed
