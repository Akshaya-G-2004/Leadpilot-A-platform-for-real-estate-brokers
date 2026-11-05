// src/lib/phone.ts
/**
 * Normalizes Indian phone numbers into international format without + for wa.me links.
 * Accepts: "9876543210", "+91 98765 43210", "09876543210", "+91-9876543210"
 * Returns: "919876543210" (country code 91 + 10 digits) or null if invalid.
 */
export function normalizeIndianPhone(rawPhone: string | null | undefined): string | null {
  if (!rawPhone) return null;

  // Remove all non-digit characters
  const digits = rawPhone.replace(/\D/g, "");

  // If 10 digits (e.g. 9876543210), prepend 91
  if (digits.length === 10) {
    return `91${digits}`;
  }

  // If 11 digits starting with 0 (e.g. 09876543210), replace leading 0 with 91
  if (digits.length === 11 && digits.startsWith("0")) {
    return `91${digits.slice(1)}`;
  }

  // If 12 digits starting with 91 (e.g. 919876543210), return as-is
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }

  // Invalid length or country code
  return null;
}

/**
 * Builds a direct WhatsApp click-to-chat URL (wa.me).
 * Encodes the prefilled message properly.
 */
export function buildWhatsAppLink(phone: string | null | undefined, message: string): string | null {
  const normalized = normalizeIndianPhone(phone);
  if (!normalized) return null;

  const encodedMessage = encodeURIComponent(message.trim());
  return `https://wa.me/${normalized}?text=${encodedMessage}`;
}

