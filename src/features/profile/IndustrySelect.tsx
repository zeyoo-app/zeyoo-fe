'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { Button, Modal, SelectField } from '@/design-system';
import { useCampaignCategories } from '@/features/campaigns/hooks';

interface IndustrySelectProps {
  /** The industry name, as stored on the brand. */
  value: string;
  onChange: (industry: string) => void;
  label?: string;
  error?: string;
}

/**
 * Industry picker, shaped like the campaign category select: a `SelectField` that
 * opens a sheet of options. The taxonomy is shared with campaign categories so a
 * brand's industry and the campaigns it runs stay in the same vocabulary.
 */
export function IndustrySelect({ value, onChange, label = 'Industry', error }: IndustrySelectProps) {
  const { data, isLoading } = useCampaignCategories();
  const [open, setOpen] = useState(false);

  return (
    <>
      <SelectField
        label={label}
        value={value}
        placeholder="Select industry"
        onPress={() => setOpen(true)}
        accessibilityLabel="Select industry"
        error={error}
        trailing={<ChevronDown className="size-4 shrink-0 text-text-muted" aria-hidden />}
      />
      <Modal open={open} onClose={() => setOpen(false)} title="Industry">
        {data?.map((category) => (
          <Button
            key={category.id}
            variant={category.name === value ? 'primary' : 'secondary'}
            onClick={() => {
              onChange(category.name);
              setOpen(false);
            }}
          >
            {category.name}
          </Button>
        ))}
        {!isLoading && data?.length === 0 ? (
          <p className="text-sm text-text-muted">No industries are available yet.</p>
        ) : null}
      </Modal>
    </>
  );
}
