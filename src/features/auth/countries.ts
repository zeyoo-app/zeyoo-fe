export interface PhoneCountry {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  /**
   * A sample mobile number in the country's own grouping, without the calling code
   * (Jordan: `7 9012 3456`). Generated from libphonenumber's example numbers, the
   * library the backend validates with.
   */
  placeholder: string;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  ['AU', 'Australia', '+61', '🇦🇺', '412 345 678'],
  ['BR', 'Brazil', '+55', '🇧🇷', '11 96123 4567'],
  ['CM', 'Cameroon', '+237', '🇨🇲', '6 71 23 45 67'],
  ['CA', 'Canada', '+1', '🇨🇦', '506 234 5678'],
  ['CN', 'China', '+86', '🇨🇳', '131 2345 6789'],
  ['CI', 'Côte d’Ivoire', '+225', '🇨🇮', '01 23 45 6789'],
  ['EG', 'Egypt', '+20', '🇪🇬', '10 01234567'],
  ['ET', 'Ethiopia', '+251', '🇪🇹', '91 123 4567'],
  ['FR', 'France', '+33', '🇫🇷', '6 12 34 56 78'],
  ['DE', 'Germany', '+49', '🇩🇪', '1512 3456789'],
  ['GH', 'Ghana', '+233', '🇬🇭', '23 123 4567'],
  ['IN', 'India', '+91', '🇮🇳', '81234 56789'],
  ['ID', 'Indonesia', '+62', '🇮🇩', '812 345 678'],
  ['IE', 'Ireland', '+353', '🇮🇪', '85 012 3456'],
  ['IT', 'Italy', '+39', '🇮🇹', '312 345 6789'],
  ['JP', 'Japan', '+81', '🇯🇵', '90 1234 5678'],
  ['JO', 'Jordan', '+962', '🇯🇴', '7 9012 3456'],
  ['KE', 'Kenya', '+254', '🇰🇪', '712 123456'],
  ['MA', 'Morocco', '+212', '🇲🇦', '6 50 12 34 56'],
  ['NL', 'Netherlands', '+31', '🇳🇱', '6 12345678'],
  ['NG', 'Nigeria', '+234', '🇳🇬', '802 123 4567'],
  ['PK', 'Pakistan', '+92', '🇵🇰', '301 2345678'],
  ['PH', 'Philippines', '+63', '🇵🇭', '905 123 4567'],
  ['PT', 'Portugal', '+351', '🇵🇹', '912 345 678'],
  ['RW', 'Rwanda', '+250', '🇷🇼', '720 123 456'],
  ['SA', 'Saudi Arabia', '+966', '🇸🇦', '51 234 5678'],
  ['SN', 'Senegal', '+221', '🇸🇳', '70 123 45 67'],
  ['ZA', 'South Africa', '+27', '🇿🇦', '71 123 4567'],
  ['KR', 'South Korea', '+82', '🇰🇷', '10 2000 0000'],
  ['ES', 'Spain', '+34', '🇪🇸', '612 34 56 78'],
  ['TZ', 'Tanzania', '+255', '🇹🇿', '621 234 567'],
  ['UG', 'Uganda', '+256', '🇺🇬', '712 345678'],
  ['AE', 'United Arab Emirates', '+971', '🇦🇪', '50 123 4567'],
  ['GB', 'United Kingdom', '+44', '🇬🇧', '7400 123456'],
  ['US', 'United States', '+1', '🇺🇸', '201 555 0123'],
  ['ZM', 'Zambia', '+260', '🇿🇲', '95 5123456'],
  ['ZW', 'Zimbabwe', '+263', '🇿🇼', '71 234 5678'],
].map(([code, name, dialCode, flag, placeholder]) => ({ code, name, dialCode, flag, placeholder }));

export function countryForRegion(regionCode?: string | null): PhoneCountry {
  return PHONE_COUNTRIES.find((country) => country.code === regionCode) ??
    PHONE_COUNTRIES.find((country) => country.code === 'NG')!;
}

export function countryForPhone(value: string, fallback: PhoneCountry): PhoneCountry {
  if (!value.startsWith('+') || value.startsWith(fallback.dialCode)) return fallback;
  return [...PHONE_COUNTRIES]
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((country) => value.startsWith(country.dialCode)) ?? fallback;
}
