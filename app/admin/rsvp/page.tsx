import React from "react";
import { getGuests, getRsvps } from "@/lib/supabase/repository";
import RsvpMonitoringClient from "@/components/admin/RsvpMonitoringClient";

export const dynamic = "force-dynamic";

export default async function AdminRsvpPage() {
  const [guests, rsvps] = await Promise.all([getGuests(), getRsvps()]);

  return <RsvpMonitoringClient guests={guests} rsvps={rsvps} />;
}
