# Adithya Trading — Admin Panel

A production-ready admin panel for a local wholesale e-commerce business targeting Kozhikode district, Kerala. Built with Next.js 15, Supabase, and Tailwind CSS.

---

## Tech Stack

- **Framework** — Next.js 15 (App Router)
- **Language** — TypeScript (strict mode)
- **Database + Auth** — Supabase
- **Styling** — Tailwind CSS
- **State Management** — Zustand (with persistence)
- **Package Manager** — pnpm
- **Icons** — lucide-react
- **Drag and Drop** — @dnd-kit

---

## Features

- **Dashboard** — Orders today, revenue, active products, low stock alerts, order status breakdown, recent orders
- **Products** — Add, edit, delete products with up to 4 images, category assignment, pricing, inventory tracking
- **Categories** — Drag to reorder, inline edit, active/inactive toggle
- **Orders** — View all orders, update status flow (pending → confirmed → out for delivery → delivered), auto payment status update for COD on delivery
- **Coupons** — Percentage and flat discount coupons with usage limits, validity dates, and min order amounts
- **Authentication** — Secure admin login with email and password via Supabase Auth

---

## Project Structure

```
src/
├── app/
│   ├── (admin)/               # Protected admin pages
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── orders/
│   │   └── coupons/
│   └── login/                 # Public auth page
├── components/
│   ├── ui/                    # Button, Input, Modal, Badge, Toggle
│   ├── admin/                 # Sidebar, Header
│   └── layouts/               # AdminLayout
├── hooks/                     # Custom hooks — all data logic lives here
│   ├── useAuth.ts
│   ├── useProducts.ts
│   ├── useCategories.ts
│   ├── useOrders.ts
│   ├── useCoupons.ts
│   └── useDashboard.ts
├── lib/
│   ├── supabase/              # Browser + server Supabase clients
│   ├── utils.ts               # cn(), formatPrice(), slugify()
│   └── constants.ts           # Routes, order statuses, app config
├── store/
│   └── authStore.ts           # Zustand auth store with persistence
├── types/
│   ├── index.ts               # App types
│   └── database.ts            # Auto-generated Supabase types
└── middleware.ts               # Route protection
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase account

### 1. Clone the repository

```bash
git clone https://github.com/your-username/adithya-trading-admin.git
cd adithya-trading-admin
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Find these in your Supabase dashboard → Settings → API.

### 4. Set up Supabase database

Run the following SQL in your Supabase SQL Editor in order:

**Create tables:**

```sql
-- Categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  image_url text,
  is_active bool not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Products
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sku text,
  category_id uuid references categories(id) on delete set null,
  short_description text,
  full_description text,
  unit text not null default 'piece',
  actual_price numeric(10,2) not null default 0,
  selling_price numeric(10,2) not null default 0,
  tax_percent numeric(5,2) not null default 0,
  stock_quantity int not null default 0,
  low_stock_threshold int not null default 5,
  weight_grams int,
  is_active bool not null default true,
  is_featured bool not null default false,
  is_new_arrival bool not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Product images
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  delivery_address text not null,
  delivery_city text not null default 'Kozhikode',
  delivery_pincode text not null,
  status text not null default 'pending'
    check (status in ('pending','confirmed','out_for_delivery','delivered')),
  payment_method text not null
    check (payment_method in ('razorpay','cod')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','failed')),
  subtotal numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  coupon_code text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Order items
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  product_name text not null,
  product_image_url text,
  quantity int not null default 1,
  unit_price numeric(10,2) not null,
  total_price numeric(10,2) not null
);

-- Coupons
create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  type text not null check (type in ('percentage','flat')),
  discount_value numeric(10,2) not null,
  min_order_amount numeric(10,2) not null default 0,
  max_discount_amount numeric(10,2),
  usage_limit int,
  usage_count int not null default 0,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  is_active bool not null default true,
  created_at timestamptz not null default now()
);

-- Payments
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  method text not null check (method in ('razorpay', 'cod')),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  amount numeric(10,2) not null,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  collected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

**Enable RLS and create policies:**

```sql
-- Run this for each table: categories, products, product_images,
-- orders, order_items, coupons, payments
-- Replace 'categories' with each table name

alter table categories enable row level security;

create policy "Admin full access on categories"
on categories for all
using (
  exists (
    select 1 from admin_profiles
    where id = auth.uid() and is_active = true
  )
)
with check (
  exists (
    select 1 from admin_profiles
    where id = auth.uid() and is_active = true
  )
);
```

**Auto-update timestamps:**

```sql
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_updated_at
  before update on products
  for each row execute function update_updated_at();

create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();
```

### 5. Create admin user

Go to **Supabase → Authentication → Users → Add user** and create a user with email and password. Then run:

```sql
insert into admin_profiles (id, name)
values ('your-user-uuid-here', 'Admin');
```

Replace `your-user-uuid-here` with the UUID from the created user.

### 6. Set up Supabase Storage

Go to **Supabase → Storage → New bucket**:
- Name: `product-images`
- Public bucket: **Yes**

Then run these storage policies:

```sql
create policy "Admin can upload product images"
on storage.objects for insert
with check (
  bucket_id = 'product-images'
  and exists (
    select 1 from admin_profiles
    where id = auth.uid() and is_active = true
  )
);

create policy "Admin can delete product images"
on storage.objects for delete
using (
  bucket_id = 'product-images'
  and exists (
    select 1 from admin_profiles
    where id = auth.uid() and is_active = true
  )
);

create policy "Public can view product images"
on storage.objects for select
using (bucket_id = 'product-images');
```

### 7. Generate Supabase types

```bash
pnpm dlx supabase@latest login
pnpm dlx supabase@latest gen types typescript --project-id your-project-id > src/types/database.ts
```

### 8. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your admin credentials.

---

## Deployment on Vercel

1. Push your code to GitHub
2. Import the repository on [vercel.com](https://vercel.com)
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

---

## Order Status Flow

```
pending → confirmed → out_for_delivery → delivered
```

When a COD order is marked as **delivered**, the payment status automatically updates to **paid**.

---

## Key Business Rules

- Delivery only within Kozhikode district
- Maximum 4 images per product, minimum 1 required
- Low stock alert when quantity is 5 or below
- Single admin user — no multi-user support needed
- Payment methods: Razorpay (online) and Cash on Delivery

---

## License

MIT
