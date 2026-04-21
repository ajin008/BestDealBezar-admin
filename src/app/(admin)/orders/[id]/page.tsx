import type { Metadata } from "next";
import { OrderDetailClient } from "../_components/OrderDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Order Detail" };

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  return <OrderDetailClient id={id} />;
}
