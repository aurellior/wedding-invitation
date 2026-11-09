import type { Metadata } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { getWeddingConfig } from "@/lib/supabase/repository";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getWeddingConfig();
  return {
    title: `Back-Office Admin | ${config.couple.groom.nickname} & ${config.couple.bride.nickname}`,
    description:
      "Dashboard manajemen konten undangan, daftar tamu, pengiriman WhatsApp, monitoring RSVP, dan moderasi ucapan.",
  };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getWeddingConfig();
  return <AdminSidebar config={config}>{children}</AdminSidebar>;
}
