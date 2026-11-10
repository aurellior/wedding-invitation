import React from "react";
import {
  getGuests,
  getRsvps,
  getWeddingConfig,
} from "@/lib/supabase/repository";
import RsvpMonitoringClient from "@/components/admin/RsvpMonitoringClient";

export const dynamic = "force-dynamic";

export default async function AdminRsvpPage() {
  const [guests, rsvps, config] = await Promise.all([
    getGuests(),
    getRsvps(),
    getWeddingConfig(),
  ]);

  return (
    <RsvpMonitoringClient
      guests={guests}
      rsvps={rsvps}
      weddingConfig={config}
    />
  );
}
