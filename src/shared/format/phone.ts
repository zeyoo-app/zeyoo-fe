const E164 = /^\+[1-9]\d{6,14}$/;
const TYPABLE = /^\+?[\d\s().-]+$/;
const NOT_A_NUMBER = 'Enter a valid phone number.';

export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  return digits.length > 0 ? `+${digits}` : '';
}

export function phoneNumberError(input: string): string | undefined {
  if (input.trim().length === 0) return undefined;
  if (!TYPABLE.test(input.trim())) return NOT_A_NUMBER;
  return E164.test(normalizePhone(input)) ? undefined : NOT_A_NUMBER;
}

export function isCompletePhone(input: string): boolean {
  return phoneNumberError(input) === undefined && normalizePhone(input).length > 0;
}
