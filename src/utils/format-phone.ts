export function formatPhoneInternational(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("254") && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }

  if (digits.startsWith("7") && digits.length === 9) {
    return `254${digits}`;
  }

  return digits;
}

export function formatPhoneDisplay(phone?: string | null): string {
  if (!phone?.trim()) return "—";

  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("254") && digits.length === 12) {
    return `0${digits.slice(3)}`;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return digits;
  }

  if (digits.length === 9 && digits.startsWith("7")) {
    return `0${digits}`;
  }

  if (digits.length === 10 && digits.startsWith("1")) {
    return `0${digits}`;
  }

  return phone.trim();
}
