import type { Metadata } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { WEDDING_CONFIG } from "@/lib/config/wedding-config";

export const metadata: Metadata = {
  title: `Back-Office Admin | ${WEDDING_CONFIG.couple.groom.nickname} & ${WEDDING_CONFIG.couple.bride.nickname}`,
  description:
    "Dashboard manajemen tamu undangan, pengiriman WhatsApp, monitoring RSVP, dan moderasi ucapan.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminSidebar>{children}</AdminSidebar>;
}
