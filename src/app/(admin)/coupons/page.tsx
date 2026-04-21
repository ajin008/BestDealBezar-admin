import type { Metadata } from "next";
import { CouponsClient } from "./_components/CouponsClient";

export const metadata: Metadata = { title: "Coupons" };

export default function CouponsPage() {
  return <CouponsClient />;
}
