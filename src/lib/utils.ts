import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes safely.
 * Resolves conflicts — e.g. cn("p-4", "p-2") → "p-2"
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-blue-500", "text-sm")
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as Indian Rupee currency.
 *
 * @example
 * formatPrice(1500) → "₹1,500.00"
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

/**
 * Formats a date string or Date object to readable format.
 *
 * @example
 * formatDate("2026-04-21") → "21 Apr 2026"
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Formats a date with time.
 *
 * @example
 * formatDateTime("2026-04-21T10:30:00") → "21 Apr 2026, 10:30 AM"
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/**
 * Truncates a string to a given length and adds ellipsis.
 *
 * @example
 * truncate("Hello World", 5) → "Hello..."
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

/**
 * Converts a string to a URL-friendly slug.
 *
 * @example
 * slugify("Basmati Rice 5kg") → "basmati-rice-5kg"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── GST Utilities (Inclusive pricing) ────────────────────────────────────────

export function getGSTSplit(sellingPrice: number, taxPercent: number) {
  if (taxPercent <= 0) {
    return {
      basePrice: sellingPrice,
      totalGST: 0,
      cgst: 0,
      sgst: 0,
      halfPercent: 0,
    };
  }
  const basePrice = sellingPrice / (1 + taxPercent / 100);
  const totalGST = sellingPrice - basePrice;
  return {
    basePrice: Math.round(basePrice * 100) / 100,
    totalGST: Math.round(totalGST * 100) / 100,
    cgst: Math.round((totalGST / 2) * 100) / 100,
    sgst: Math.round((totalGST / 2) * 100) / 100,
    halfPercent: taxPercent / 2,
  };
}
