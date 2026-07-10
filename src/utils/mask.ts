export function maskEmail(email?: string | null): string {
  if (!email) return "Anonymous";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return email;
  }

  const [localPart, domain] = email.split("@");

  if (localPart.length <= 2) {
    return `****@${domain}`;
  }

  const start = localPart.slice(0, 2);
  const end = localPart.slice(-2);

  return `${start}****${end}@${domain}`;
}

export function maskPhone(phone?: string | null): string {
  if (!phone) return "";

  const normalized = String(phone);

  if (normalized.length <= 6) {
    return "*".repeat(normalized.length);
  }

  return (
    normalized.slice(0, 4) +
    "*".repeat(normalized.length - 6) +
    normalized.slice(-2)
  );
}

export function maskString(value?: string | null): string {
  if (!value) return "";

  return "*".repeat(value.length);
}

export function maskPartial(
  value?: string | null,
  visibleStart = 2,
  visibleEnd = 2,
): string {
  if (!value) return "";

  if (value.length <= visibleStart + visibleEnd) {
    return "*".repeat(value.length);
  }

  return (
    value.slice(0, visibleStart) +
    "*".repeat(value.length - visibleStart - visibleEnd) +
    value.slice(-visibleEnd)
  );
}
