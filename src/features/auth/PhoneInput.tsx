'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { phoneNumberError } from '@/shared/format/phone';

import { countryForPhone, countryForRegion, PHONE_COUNTRIES, type PhoneCountry } from './countries';

interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}

export function PhoneInput({ label = 'Phone number', value, onChange, error }: PhoneInputProps) {
  const id = useId();
  const defaultCountry = countryForRegion(undefined);
  const initialValue = useRef(value);
  const [country, setCountry] = useState(() => countryForPhone(value, defaultCountry));
  const [localNumber, setLocalNumber] = useState(() => localPart(value, country));
  const message = error ?? phoneNumberError(value);

  // Device locale is only available after hydration. Starting from the same
  // fallback on the server and client keeps the auth page hydration-safe.
  useEffect(() => {
    const localizedCountry = countryForPhone(initialValue.current, countryForRegion(browserRegion()));
    setCountry(localizedCountry);
    setLocalNumber(localPart(initialValue.current, localizedCountry));
  }, []);

  function updateNumber(nextLocal: string, nextCountry = country) {
    setLocalNumber(nextLocal);
    const nationalDigits = nextLocal.replace(/\D/g, '').replace(/^0+/, '');
    onChange(nationalDigits ? `${nextCountry.dialCode}${nationalDigits}` : '');
  }

  function selectCountry(code: string) {
    const nextCountry = PHONE_COUNTRIES.find((option) => option.code === code) ?? country;
    setCountry(nextCountry);
    updateNumber(localNumber, nextCountry);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-text-muted">{label}</label>
      <div className="flex gap-2">
        <select
          aria-label="Country calling code"
          value={country.code}
          onChange={(event) => selectCountry(event.target.value)}
          className="h-12 w-[9.25rem] shrink-0 rounded-xl border border-border bg-surface-raised px-3 text-[15px] text-text focus:border-primary focus:outline-none"
        >
          {PHONE_COUNTRIES.map((option) => (
            <option key={option.code} value={option.code}>
              {option.flag} {option.name} ({option.dialCode})
            </option>
          ))}
        </select>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="801 234 5678"
          value={localNumber}
          onChange={(event) => updateNumber(event.target.value)}
          aria-invalid={message ? true : undefined}
          className={`h-12 min-w-0 flex-1 rounded-xl border bg-surface-raised px-4 text-[15px] text-text placeholder:text-text-tertiary focus:border-primary focus:outline-none ${message ? 'border-danger' : 'border-border'}`}
        />
      </div>
      {message ? <span className="text-xs text-danger">{message}</span> : null}
    </div>
  );
}

function browserRegion(): string | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return navigator.language.split('-')[1]?.toUpperCase();
}

function localPart(value: string, country: PhoneCountry): string {
  return value.startsWith(country.dialCode) ? value.slice(country.dialCode.length) : value;
}
