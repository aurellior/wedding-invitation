/**
 * Formats an ISO timestamp string into Indonesian short date/time display.
 */
export function formatDateId(iso: string | null | undefined, fallback = "—"): string {
  if (!iso) return fallback;
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/**
 * Normalizes an Indonesian phone number into international WhatsApp format (628...).
 */
export function normalizeIndonesianPhone(rawPhone: string): string {
  const digits = rawPhone.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith("8")) {
    return `62${digits}`;
  }
  return digits;
}

/**
 * Truncates text to a maximum number of characters and appends "..." if exceeded.
 */
export function truncateText(
  text: string | null | undefined,
  maxChars = 20
): string {
  if (!text) return "";
  const clean = text.trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, maxChars).trimEnd()}...`;
}

