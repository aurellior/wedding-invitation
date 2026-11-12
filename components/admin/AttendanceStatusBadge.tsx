import React from "react";
import { CheckCircle2, Clock, HelpCircle, XCircle } from "lucide-react";
import type { AttendanceStatus } from "@/types/wedding";

export function AttendanceStatusBadge({
  status,
  pax,
  pendingLabel = "Menunggu",
  showPax = false,
}: {
  status?: AttendanceStatus | "belum" | null;
  pax?: number;
  pendingLabel?: string;
  showPax?: boolean;
}) {
  if (status === "hadir") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        {showPax ? `Hadir (${pax ?? 1} Pax)` : "Hadir"}
      </span>
    );
  }

  if (status === "tidak_hadir") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
        <XCircle className="w-3 h-3 shrink-0" />
        Tidak Hadir
      </span>
    );
  }

  if (status === "ragu") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
        <HelpCircle className="w-3 h-3 shrink-0" />
        {showPax ? `Masih Ragu (${pax ?? 1} Pax)` : "Masih Ragu"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
      <Clock className="w-3 h-3 shrink-0" />
      {pendingLabel}
    </span>
  );
}

