export type CardBrand = 'VISA' | 'MASTERCARD' | 'UNKNOWN';

/**
 * Validates a credit card number using the standard Luhn algorithm (Mod 10).
 */
export function validateLuhn(cardNumber: string): boolean {
  const digitsOnly = cardNumber.replace(/\D/g, '');
  if (digitsOnly.length < 13 || digitsOnly.length > 19) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  // Loop through values starting from the rightmost digit
  for (let i = digitsOnly.length - 1; i >= 0; i--) {
    let digit = parseInt(digitsOnly.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Detects card brand: Visa or Mastercard
 */
export function detectCardBrand(cardNumber: string): CardBrand {
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.startsWith('4')) {
    return 'VISA';
  }
  const prefix2 = parseInt(clean.substring(0, 2), 10);
  const prefix4 = parseInt(clean.substring(0, 4), 10);
  if ((prefix2 >= 51 && prefix2 <= 55) || (prefix4 >= 2221 && prefix4 <= 2720)) {
    return 'MASTERCARD';
  }
  return 'UNKNOWN';
}

/**
 * Formats card number with spaces every 4 digits (e.g., 4242 4242 4242 4242)
 */
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * Formats expiration input as MM/YY
 */
export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

/**
 * Validates expiration date MM/YY
 */
export function validateExpiry(expiry: string): boolean {
  const clean = expiry.replace(/\D/g, '');
  if (clean.length !== 4) return false;

  const month = parseInt(clean.slice(0, 2), 10);
  const year = parseInt(`20${clean.slice(2)}`, 10);

  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  if (year > currentYear + 25) return false;

  return true;
}
