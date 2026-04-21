import type { Metadata } from "next";
import DashboardClient from "./_components/DashboardClient";

export const metadata: Metadata = { title: "Coupons" };

export default function DashboardPage() {
  return <DashboardClient />;
}
