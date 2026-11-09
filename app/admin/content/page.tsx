import React from "react";
import { getWeddingConfig } from "@/lib/supabase/repository";
import WeddingContentClient from "@/components/admin/WeddingContentClient";

export const dynamic = "force-dynamic";

export default async function AdminWeddingContentPage() {
  const initialConfig = await getWeddingConfig();

  return <WeddingContentClient initialConfig={initialConfig} />;
}

