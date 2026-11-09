import React from "react";
import {
  getGuests,
  getRsvps,
  getWeddingConfig,
} from "@/lib/supabase/repository";
import GuestManagementClient from "@/components/admin/GuestManagementClient";

export const dynamic = "force-dynamic";

export default async function AdminGuestsPage() {
  const [guests, rsvps, config] = await Promise.all([
    getGuests(),
    getRsvps(),
    getWeddingConfig(),
  ]);

  return (
    <GuestManagementClient
      initialGuests={guests}
      initialRsvps={rsvps}
      weddingConfig={config}
    />
  );
}
