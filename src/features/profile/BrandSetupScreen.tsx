'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button, Field, ImageUpload, type PickedImage } from '@/design-system';
import { useApi } from '@/shared/api';
import { useAuthStore } from '@/shared/auth';
import { normalizeWebsite, websiteError } from '@/shared/format/website';
import { DetailShell } from '@/shared/shell';

import { IndustrySelect } from './IndustrySelect';

/** First-run Company setup shown after email verification and before the dashboard. */
export function BrandSetupScreen() {
  const api = useApi();
  const router = useRouter();
  const params = useSearchParams();
  const session = useAuthStore((state) => state.session);
  const persistSession = useAuthStore((state) => state.signIn);
  const [logo, setLogo] = useState<PickedImage | null>(null);
  // The name typed during sign-up travels in the query string; the session is the
  // fallback for anyone who lands here directly.
  const [name, setName] = useState(() => params.get('name') ?? session?.displayName ?? '');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A bare host like "acme.com" is what people type, so the website is normalized
  // rather than demanded with a scheme (shared/format/website).
  const websiteInvalid = websiteError(website);
  const blocking = blockingField(name, industry);
  const valid = !blocking && !websiteInvalid;

  async function continueToDashboard() {
    setPending(true);
    setError(null);
    try {
      const session = await api.setupBrand({
        name: name.trim(),
        industry: industry.trim(),
        website: normalizeWebsite(website) || undefined,
        logoUrl: logo?.url,
      });
      persistSession(session);
      router.replace('/brand/dashboard');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not set up your brand.');
    } finally {
      setPending(false);
    }
  }

  return (
    <DetailShell
      role="brand"
      eyebrow="Step 3 of 3"
      title="Set up your brand"
      subtitle="Tell creators who you are before you launch a campaign."
    >
      <ImageUpload
        value={logo}
        onChange={setLogo}
        onError={setError}
        label="Add your logo"
        height={105}
        dashed
        radius={14}
      />
      <Field
        label="Brand name"
        placeholder="e.g. Glow Beauty Co."
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <Field
        label="Website"
        type="url"
        inputMode="url"
        autoCapitalize="none"
        placeholder="yourbrand.com"
        value={website}
        onChange={(event) => setWebsite(event.target.value)}
        error={websiteInvalid}
      />
      <IndustrySelect value={industry} onChange={setIndustry} />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      {blocking ? <p className="text-xs text-text-muted">{blocking}</p> : null}
      <Button loading={pending} disabled={!valid || pending} onClick={continueToDashboard}>
        Continue
      </Button>
    </DetailShell>
  );
}

/** Names the one thing still standing between the user and Continue, so a disabled
 *  button is never a dead end. */
function blockingField(name: string, industry: string): string | null {
  if (name.trim().length < 2) return 'Add a brand name of at least 2 characters to continue.';
  if (industry.trim().length < 2) return 'Add your industry to continue.';
  return null;
}
