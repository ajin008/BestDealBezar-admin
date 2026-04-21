import type { Metadata } from "next";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { APP_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    template: `%s — ${APP_CONFIG.NAME} Admin`,
    default: `${APP_CONFIG.NAME} Admin`,
  },
};

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
