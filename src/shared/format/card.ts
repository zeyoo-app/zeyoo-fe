/**
 * Payment-card inputs. The backend (Stripe) is the real authority, so these
 * helpers only do the two things that matter in the browser: mask what people type
 * as they type it, and reject the typos that would otherwise cost a round trip —
 * a Luhn-invalid number, a month that is not a month, an expiry already past.
 * The full card number and CVC are only ever held in the form state; the API
 * receives them once, to be tokenized server-side.
 */

/** Longest PAN in circulation, so the mask never grows past 19 digits. */
const MAX_CARD_DIGITS = 19;
/** Visa and Mastercard use 3; Amex and Diners use 4. */
const CVC_LENGTHS = [3, 4];
const NON_DIGITS = /\D/g;
const CARDHOLDER_ALLOWED = /^[\p{L}][\p{L}\s.'-]*$/u;

const NOT_A_NAME = 'Enter the name printed on the card.';
const BAD_NUMBER = 'Enter the digits on the front of the card.';
const INVALID_NUMBER = 'That card number is not valid.';
const BAD_EXPIRY = 'Use MM/YY, like 09/28.';
const BAD_MONTH = 'Months run from 01 to 12.';
const EXPIRED = 'That card has expired.';
const BAD_CVC = 'Enter the 3 or 4 digit code.';

/** Groups the number into blocks of four as the user types, capped at 19 digits. */
export function formatCardNumber(input: string): string {
  const digits = input.replace(NON_DIGITS, '').slice(0, MAX_CARD_DIGITS);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

/** Inserts the `MM/YY` slash after the second digit; nothing before that. */
export function formatExpiry(input: string): string {
  const digits = input.replace(NON_DIGITS, '').slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/** The digits to send to the API, or `''` when the field holds nothing usable. */
export function cardDigits(input: string): string {
  return input.replace(NON_DIGITS, '').slice(0, MAX_CARD_DIGITS);
}

/** The last four digits, which is all the app is ever allowed to display. */
export function cardLast4(input: string): string {
  return cardDigits(input).slice(-4);
}

/** Why the cardholder name is unusable, or `undefined` when it is fine (blank included). */
export function cardholderNameError(input: string): string | undefined {
  const name = input.trim();
  if (!name) return undefined;
  if (!CARDHOLDER_ALLOWED.test(name)) return NOT_A_NAME;
  return undefined;
}

/** Why the card number is unusable, or `undefined` when it is fine (blank included). */
export function cardNumberError(input: string): string | undefined {
  const digits = cardDigits(input);
  if (!digits) return undefined;
  if (digits.length < 12) return BAD_NUMBER;
  if (!luhnValid(digits)) return INVALID_NUMBER;
  return undefined;
}

/**
 * Why the expiry is unusable, or `undefined` when it is fine (blank included).
 * `now` is injectable so the check is testable without freezing the clock.
 */
export function expiryError(input: string, now: Date = new Date()): string | undefined {
  const digits = input.replace(NON_DIGITS, '');
  if (!digits) return undefined;
  if (digits.length !== 4) return BAD_EXPIRY;

  const month = Number(digits.slice(0, 2));
  if (month < 1 || month > 12) return BAD_MONTH;

  // A card stays usable through the last day of its expiry month.
  const expiresAt = new Date(2000 + Number(digits.slice(2)), month, 1);
  if (expiresAt <= startOfMonth(now)) return EXPIRED;
  return undefined;
}

/** Why the CVC is unusable, or `undefined` when it is fine (blank included). */
export function cvcError(input: string): string | undefined {
  const digits = input.replace(NON_DIGITS, '');
  if (!digits) return undefined;
  return CVC_LENGTHS.includes(digits.length) ? undefined : BAD_CVC;
}

/** Whether the digits satisfy the Luhn checksum every real PAN carries. */
export function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

function startOfMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
