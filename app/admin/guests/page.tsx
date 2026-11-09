import React from "react";
import { getGuests, getRsvps } from "@/lib/supabase/repository";
import GuestManagementClient from "@/components/admin/GuestManagementClient";

export const dynamic = "force-dynamic";

export default async function AdminGuestsPage() {
  const [guests, rsvps] = await Promise.all([getGuests(), getRsvps()]);

  return (
    <GuestManagementClient initialGuests={guests} initialRsvps={rsvps} />
  );
}
