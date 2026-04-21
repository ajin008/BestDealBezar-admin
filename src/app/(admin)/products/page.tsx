import type { Metadata } from "next";
import { ProductsClient } from "./_components/ProductsClient";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage() {
  return <ProductsClient />;
}
