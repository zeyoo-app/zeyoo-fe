export interface PhoneCountry {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  ['AU', 'Australia', '+61', '🇦🇺'], ['BR', 'Brazil', '+55', '🇧🇷'],
  ['CM', 'Cameroon', '+237', '🇨🇲'], ['CA', 'Canada', '+1', '🇨🇦'],
  ['CN', 'China', '+86', '🇨🇳'], ['CI', 'Côte d’Ivoire', '+225', '🇨🇮'],
  ['EG', 'Egypt', '+20', '🇪🇬'], ['ET', 'Ethiopia', '+251', '🇪🇹'],
  ['FR', 'France', '+33', '🇫🇷'], ['DE', 'Germany', '+49', '🇩🇪'],
  ['GH', 'Ghana', '+233', '🇬🇭'], ['IN', 'India', '+91', '🇮🇳'],
  ['ID', 'Indonesia', '+62', '🇮🇩'], ['IE', 'Ireland', '+353', '🇮🇪'],
  ['IT', 'Italy', '+39', '🇮🇹'], ['JP', 'Japan', '+81', '🇯🇵'],
  ['KE', 'Kenya', '+254', '🇰🇪'], ['MA', 'Morocco', '+212', '🇲🇦'],
  ['NL', 'Netherlands', '+31', '🇳🇱'], ['NG', 'Nigeria', '+234', '🇳🇬'],
  ['PK', 'Pakistan', '+92', '🇵🇰'], ['PH', 'Philippines', '+63', '🇵🇭'],
  ['PT', 'Portugal', '+351', '🇵🇹'], ['RW', 'Rwanda', '+250', '🇷🇼'],
  ['SA', 'Saudi Arabia', '+966', '🇸🇦'], ['SN', 'Senegal', '+221', '🇸🇳'],
  ['ZA', 'South Africa', '+27', '🇿🇦'], ['KR', 'South Korea', '+82', '🇰🇷'],
  ['ES', 'Spain', '+34', '🇪🇸'], ['TZ', 'Tanzania', '+255', '🇹🇿'],
  ['UG', 'Uganda', '+256', '🇺🇬'], ['AE', 'United Arab Emirates', '+971', '🇦🇪'],
  ['GB', 'United Kingdom', '+44', '🇬🇧'], ['US', 'United States', '+1', '🇺🇸'],
  ['ZM', 'Zambia', '+260', '🇿🇲'], ['ZW', 'Zimbabwe', '+263', '🇿🇼'],
].map(([code, name, dialCode, flag]) => ({ code, name, dialCode, flag }));

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
