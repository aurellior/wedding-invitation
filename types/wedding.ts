export type GuestCategory =
  | "Keluarga"
  | "Sahabat"
  | "Rekan Kerja"
  | "Umum";

export type AttendanceStatus = "hadir" | "tidak_hadir" | "ragu";

export interface Guest {
  id: string;
  name: string;
  slug: string;
  category: GuestCategory;
  phone: string;
  max_pax: number;
  invitation_sent: boolean;
  created_at: string;
}

export interface RsvpRecord {
  id: string;
  guest_id: string;
  guest_name: string;
  attendance_status: AttendanceStatus;
  pax: number;
  notes?: string | null;
  updated_at: string;
  created_at: string;
}

export interface WishRecord {
  id: string;
  guest_id?: string | null;
  sender_name: string;
  message: string;
  attendance_badge?: AttendanceStatus | null;
  created_at: string;
}

export interface DashboardMetrics {
  totalGuests: number;
  totalAttendingRsvps: number;
  totalDeclinedRsvps: number;
  totalPendingGuests: number;
  estimatedPax: number;
  totalWishes: number;
}

