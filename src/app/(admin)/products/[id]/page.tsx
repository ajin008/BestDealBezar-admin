import type { Metadata } from "next";
import { ProductFormClient } from "../_components/ProductFormClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: id === "new" ? "Add Product" : "Edit Product",
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  return <ProductFormClient id={id} />;
}
