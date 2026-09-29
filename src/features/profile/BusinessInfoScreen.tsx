'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { AsyncContent, Button, Field, ImageUpload, type PickedImage } from '@/design-system';
import type { BrandProfile } from '@/shared/api';
import { normalizeWebsite, websiteError } from '@/shared/format/website';
import { DetailShell } from '@/shared/shell';

import { IndustrySelect } from './IndustrySelect';
import { useBrandProfile, useUpdateBrandProfile } from './hooks';

/** Company business details, matching the Figma Business Info screen. */
export function BusinessInfoScreen() {
  const profile = useBrandProfile();

  return (
    <DetailShell role="brand" title="Business Info" subtitle="Update your business details.">
      <AsyncContent
        isLoading={profile.isLoading}
        isError={profile.isError}
        data={profile.data}
      >
        {(data) => (
          // The form owns the fields, so it is mounted per profile rather than
          // copying the profile into state after the fact.
          <BusinessInfoForm key={data.organizationName} profile={data} />
        )}
      </AsyncContent>
    </DetailShell>
  );
}

function BusinessInfoForm({ profile }: { profile: BrandProfile }) {
  const router = useRouter();
  const update = useUpdateBrandProfile();
  const [logo, setLogo] = useState<PickedImage | null>(() =>
    profile.logoUrl ? { previewUrl: profile.logoUrl, url: profile.logoUrl } : null,
  );
  const [name, setName] = useState(profile.organizationName);
  const [website, setWebsite] = useState(profile.website ?? '');
  const [industry, setIndustry] = useState(profile.industry ?? '');
  const [imageError, setImageError] = useState<string | undefined>();

  async function save() {
    await update.mutateAsync({
      name: name.trim(),
      website: normalizeWebsite(website) || undefined,
      industry: industry.trim() || undefined,
      logoUrl: logo?.url,
    });
    router.back();
  }

  const websiteInvalid = websiteError(website);
  const valid = name.trim().length >= 2 && industry.trim().length >= 2 && !websiteInvalid;

  return (
    <>
      <ImageUpload
        value={logo}
        onChange={setLogo}
        onError={setImageError}
        label="Change logo"
        height={105}
        dashed
        radius={14}
      />
      {imageError ? <p className="text-xs text-danger">{imageError}</p> : null}
      <Field label="Brand name" value={name} onChange={(event) => setName(event.target.value)} />
      <Field
        label="Website"
        type="url"
        inputMode="url"
        autoCapitalize="none"
        value={website}
        onChange={(event) => setWebsite(event.target.value)}
        error={websiteInvalid}
      />
      <IndustrySelect value={industry} onChange={setIndustry} />
      {update.error ? (
        <p className="text-xs text-danger">
          {update.error instanceof Error ? update.error.message : 'Could not save your business.'}
        </p>
      ) : null}
      <Button loading={update.isPending} disabled={!valid} onClick={save}>
        Save Changes
      </Button>
    </>
  );
}
