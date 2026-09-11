export function isValidPhone(phone: string) {
  return /^[+()0-9\s-]{7,20}$/.test(phone.trim());
}

export function isValidEmail(email?: string | null) {
  if (!email) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function normalizeOptional(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
