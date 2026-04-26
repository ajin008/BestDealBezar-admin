/**
 * Application-wide constants.
 * Never hardcode these values anywhere else — always import from here.
 * This makes future changes (like renaming a route) a one-line fix.
 */

// ─── Routes ───────────────────────────────────────────────────────────────────

export const ROUTES = {
  // Auth
  LOGIN: "/login",

  // Admin pages
  DASHBOARD: "/dashboard",
  PRODUCTS: "/products",
  PRODUCT_NEW: "/products/new",

  PRODUCT_EDIT: (id: string) => `/products/${id}`,
  CATEGORIES: "/categories",
  ORDERS: "/orders",
  ORDER_DETAIL: (id: string) => `/orders/${id}`,
  COUPONS: "/coupons",
  SETTINGS: "/settings",
} as const;

// ─── Order Statuses ────────────────────────────────────────────────────────────

export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  out_for_delivery: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700",
};

// ─── Payment Methods ───────────────────────────────────────────────────────────

export const PAYMENT_METHOD = {
  RAZORPAY: "razorpay",
  COD: "cod",
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  razorpay: "Online Payment",
  cod: "Cash on Delivery",
};

// ─── Product Config ────────────────────────────────────────────────────────────

export const PRODUCT_CONFIG = {
  MAX_IMAGES: 4,
  MIN_IMAGES: 1,
  MAX_IMAGE_SIZE_MB: 5,
  DEFAULT_LOW_STOCK_THRESHOLD: 5,
} as const;

// ─── App Config ────────────────────────────────────────────────────────────────

export const APP_CONFIG = {
  NAME: "Adithya Trading",
  DESCRIPTION: "Wholesale trading — Kozhikode district",
  DELIVERY_AREA: "Kozhikode",
} as const;

// ─── Pagination ────────────────────────────────────────────────────────────────

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  ORDERS_PAGE_SIZE: 15,
} as const;
