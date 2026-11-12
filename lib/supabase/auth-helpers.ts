/**
 * Checks whether an authenticated Supabase user email is authorized as an admin.
 * Reads optional comma-separated `ADMIN_EMAILS` env var.
 */
export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const rawAllowlist = process.env.ADMIN_EMAILS?.trim();
  if (!rawAllowlist) {
    return true;
  }

  const allowed = rawAllowlist
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (allowed.length === 0) {
    return true;
  }

  return allowed.includes(email.trim().toLowerCase());
}

