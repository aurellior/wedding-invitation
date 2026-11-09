import React from "react";
import { getWishes } from "@/lib/supabase/repository";
import WishesModerationClient from "@/components/admin/WishesModerationClient";

export const dynamic = "force-dynamic";

export default async function AdminWishesPage() {
  const wishes = await getWishes();

  return <WishesModerationClient initialWishes={wishes} />;
}
