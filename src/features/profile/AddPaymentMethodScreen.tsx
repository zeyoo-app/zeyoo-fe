'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button, Field } from '@/design-system';
import {
  cardDigits,
  cardholderNameError,
  cardNumberError,
  cvcError,
  expiryError,
  formatCardNumber,
  formatExpiry,
} from '@/shared/format/card';
import { DetailShell } from '@/shared/shell';

import { useAddPaymentMethod } from '../earnings/hooks';

/** Collects a card to be tokenized server-side; only the last four are kept. */
export function AddPaymentMethodScreen() {
  const router = useRouter();
  const addPaymentMethod = useAddPaymentMethod();
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const errors = {
    name: cardholderNameError(name),
    number: cardNumberError(number),
    expiry: expiryError(expiry),
    cvc: cvcError(cvc),
  };
  const complete =
    name.trim().length > 0 && !errors.name && !errors.number && !errors.expiry && !errors.cvc;

  async function save() {
    await addPaymentMethod.mutateAsync({
      cardholderName: name.trim(),
      cardNumber: cardDigits(number),
      expiry,
      cvc,
    });
    router.back();
  }

  return (
    <DetailShell
      role="brand"
      title="Add payment method"
      subtitle="Used to fund your campaigns and pay creators."
    >
      <Field
        label="Cardholder Name"
        placeholder="e.g. Ahmad Al-Farsi"
        autoComplete="cc-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={errors.name}
      />
      <Field
        label="Card Number"
        placeholder="1234 5678 9012 3456"
        inputMode="numeric"
        autoComplete="cc-number"
        maxLength={24}
        value={number}
        onChange={(event) => setNumber(formatCardNumber(event.target.value))}
        error={errors.number}
      />
      <div className="flex gap-3">
        <div className="flex-1">
          <Field
            label="Expiry Date"
            placeholder="MM/YY"
            inputMode="numeric"
            autoComplete="cc-exp"
            maxLength={5}
            value={expiry}
            onChange={(event) => setExpiry(formatExpiry(event.target.value))}
            error={errors.expiry}
          />
        </div>
        <div className="flex-1">
          <Field
            label="CVC"
            placeholder="123"
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            maxLength={4}
            value={cvc}
            onChange={(event) => setCvc(event.target.value.replace(/\D/g, '').slice(0, 4))}
            error={errors.cvc}
          />
        </div>
      </div>

      {addPaymentMethod.error ? (
        <p className="text-xs text-danger">
          {addPaymentMethod.error instanceof Error
            ? addPaymentMethod.error.message
            : 'Could not save that card.'}
        </p>
      ) : null}

      <Button loading={addPaymentMethod.isPending} disabled={!complete} onClick={save}>
        Save Payment Method
      </Button>
    </DetailShell>
  );
}
