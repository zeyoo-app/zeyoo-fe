'use client';

import { useRef, useState } from 'react';

import { cn } from '@/design-system';

const CODE_LENGTH = 6;

interface CodeInputProps {
  value: string;
  onChange: (next: string) => void;
  onComplete?: (code: string) => void;
  error?: boolean;
  autoFocus?: boolean;
}

/**
 * Six-cell one-time-code field. A single hidden input captures the digits; the
 * cells are presentational, with the active cell ringed in brand green.
 */
export function CodeInput({ value, onChange, onComplete, error, autoFocus }: CodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, CODE_LENGTH);
    onChange(digits);
    if (digits.length === CODE_LENGTH) onComplete?.(digits);
  };

  const activeIndex = Math.min(value.length, CODE_LENGTH - 1);

  return (
    <div
      className="relative flex gap-2.5"
      onClick={() => inputRef.current?.focus()}
      role="presentation"
    >
      {Array.from({ length: CODE_LENGTH }, (_, index) => {
        const char = value[index] ?? '';
        const isActive = focused && index === activeIndex && value.length < CODE_LENGTH;
        return (
          <div
            key={index}
            className={cn(
              'flex h-14 flex-1 items-center justify-center rounded-xl border bg-surface-raised font-numeric text-2xl text-text',
              error ? 'border-danger' : isActive || char ? 'border-2 border-primary' : 'border-border',
            )}
          >
            {char}
          </div>
        );
      })}
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        autoFocus={autoFocus}
        aria-label="Enter the 6-digit verification code"
        className="absolute inset-0 size-full cursor-default opacity-0"
      />
    </div>
  );
}
