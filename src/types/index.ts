import type { OrderStatus, PaymentMethod } from "@/lib/constants";

// ─── Admin ─────────────────────────────────────────────────────────────────────

export interface AdminProfile {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface CategoryJoin {
  id: string;
  name: string;
  slug: string;
}

// ─── Category ──────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface CategoryFormData {
  name: string;
  slug: string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

// ─── Product ───────────────────────────────────────────────────────────────────

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  category_id: string | null;
  short_description: string | null;
  full_description: string | null;
  unit: string;
  actual_price: number;
  selling_price: number;
  tax_percent: number;
  stock_quantity: number;
  low_stock_threshold: number;
  weight_grams: number | null;
  is_active: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: CategoryJoin | null;
  images?: ProductImage[];
}

export interface ProductFormData {
  name: string;
  slug: string;
  sku: string;
  category_id: string;
  short_description: string;
  full_description: string;
  unit: string;
  actual_price: number;
  selling_price: number;
  tax_percent: number;
  stock_quantity: number;
  low_stock_threshold: number;
  weight_grams: number;
  is_active: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
}

// ─── Order ─────────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image_url: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  // Joined fields
  product?: Product | null;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_pincode: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: "pending" | "paid" | "failed";
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total_amount: number;
  coupon_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  items?: OrderItem[];
}

// ─── Coupon ────────────────────────────────────────────────────────────────────

export type CouponType = "percentage" | "flat";

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: CouponType;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  usage_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CouponFormData {
  code: string;
  description: string;
  type: CouponType;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardStats {
  orders_today: number;
  revenue_today: number;
  active_products: number;
  low_stock_count: number;
  recent_orders: Order[];
  order_status_breakdown: {
    status: OrderStatus;
    count: number;
  }[];
}

// ─── API Responses ─────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Table Filters ─────────────────────────────────────────────────────────────

export interface ProductFilters {
  search: string;
  category_id: string;
  is_active: boolean | null;
  page: number;
}

export interface OrderFilters {
  search: string;
  status: OrderStatus | "";
  payment_method: PaymentMethod | "";
  date_from: string;
  date_to: string;
  page: number;
}
