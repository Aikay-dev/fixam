/**
 * Nigerian phone number handling.
 *
 * Artisans type their number every way imaginable: 08031234567,
 * 234 803 123 4567, +2348031234567, 0803-123-4567. Everything is normalised
 * to E.164 on write so the reveal endpoint, WhatsApp deep links and the
 * scrape test all deal with exactly one format.
 */

const NG_COUNTRY_CODE = "234";

/**
 * Valid Nigerian mobile prefixes (the digits after the leading 0), covering
 * MTN, Glo, Airtel and 9mobile. Landlines are excluded — an artisan reachable
 * only on a landline cannot be reached on WhatsApp, which is the point.
 */
const NG_MOBILE_PREFIXES = [
  // MTN
  "703", "704", "706", "803", "806", "810", "813", "814", "816", "903", "906",
  "913", "916",
  // Glo
  "705", "805", "807", "811", "815", "905", "915",
  // Airtel
  "701", "708", "802", "808", "812", "901", "902", "904", "907", "912",
  // 9mobile
  "809", "817", "818", "908", "909",
];

export type NormalisedPhone = { ok: true; e164: string } | { ok: false; reason: string };

/** Strip everything that isn't a digit or a leading plus. */
function digitsOnly(input: string): string {
  return input.replace(/[^\d]/g, "");
}

/**
 * Normalise any of the common local formats to E.164 (`+234XXXXXXXXXX`).
 */
export function normalisePhone(input: string): NormalisedPhone {
  const raw = (input ?? "").trim();
  if (!raw) return { ok: false, reason: "Enter a phone number." };

  let digits = digitsOnly(raw);

  // 00234... international prefix
  if (digits.startsWith("00")) digits = digits.slice(2);

  // 234XXXXXXXXXX -> drop country code, keep the national number
  if (digits.startsWith(NG_COUNTRY_CODE) && digits.length >= 13) {
    digits = digits.slice(NG_COUNTRY_CODE.length);
  } else if (digits.startsWith("0")) {
    // 0803... -> 803...
    digits = digits.slice(1);
  }

  if (digits.length !== 10) {
    return {
      ok: false,
      reason: "That doesn't look like a Nigerian mobile number.",
    };
  }

  const prefix = digits.slice(0, 3);
  if (!NG_MOBILE_PREFIXES.includes(prefix)) {
    return {
      ok: false,
      reason: `${prefix} isn't a Nigerian mobile prefix. Check the number.`,
    };
  }

  return { ok: true, e164: `+${NG_COUNTRY_CODE}${digits}` };
}

export function isValidNigerianPhone(input: string): boolean {
  return normalisePhone(input).ok;
}

/** `+2348031234567` -> `0803 123 4567`, for display after a reveal. */
export function formatPhoneForDisplay(e164: string): string {
  const digits = digitsOnly(e164);
  const national = digits.startsWith(NG_COUNTRY_CODE)
    ? digits.slice(NG_COUNTRY_CODE.length)
    : digits;

  if (national.length !== 10) return e164;

  return `0${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
}

/** wa.me wants the number with no plus and no spaces. */
export function toWhatsAppLink(e164: string, message?: string): string {
  const digits = digitsOnly(e164);
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function toTelLink(e164: string): string {
  return `tel:${e164}`;
}

/**
 * Regex used by the scrape test to assert no phone number ever appears in a
 * public payload. Matches both the stored E.164 form and the common local
 * form, since a serialiser bug could leak either.
 */
export const PHONE_LEAK_PATTERN =
  /(\+?234[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{4})|(\b0[789]\d{9}\b)/;
