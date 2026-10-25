/**
 * Helper utility to determine whether an email belongs to an administrator.
 * Reads comma-separated email list from process.env.ADMIN_EMAILS.
 */
export function isUserAdmin(email?: string | null, role?: string | null): boolean {
  if (role === 'ADMIN') return true;
  if (!email) return false;
  const adminEmailsStr = process.env.ADMIN_EMAILS || '';
  if (!adminEmailsStr.trim()) return false;
  const adminEmails = adminEmailsStr
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.trim().toLowerCase());
}
