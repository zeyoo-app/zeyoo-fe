'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { useApi } from '@/shared/api';

const POLL_INTERVAL_MS = 2_000;
const MAX_ATTEMPTS = 30;

type Outcome = 'waiting' | 'live' | 'failed' | 'slow' | 'cancelled' | 'app';

/**
 * Where Stripe sends a brand after the payment page. For the web app it waits for the
 * payment to clear, publishes the campaign, and opens it. For the mobile app, which
 * is the one waiting, it only tells the person to switch back.
 */
export function FundingReturnScreen() {
  const api = useApi();
  const router = useRouter();
  const params = useSearchParams();
  const campaignId = params.get('campaignId') ?? '';
  const client = params.get('client');
  const [outcome, setOutcome] = useState<Outcome>(() =>
    client === 'app' ? 'app' : params.get('outcome') === 'cancelled' ? 'cancelled' : 'waiting',
  );
  const started = useRef(false);

  useEffect(() => {
    if (started.current || outcome !== 'waiting' || !campaignId) return;
    started.current = true;

    (async () => {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const funding = await api.getCampaignFunding(campaignId).catch(() => null);
        if (funding?.status === 'succeeded') {
          try {
            await api.setCampaignStatus({ campaignId, status: 'live' });
          } catch {
            // Already published (for example by a refresh): the campaign page shows the truth.
          }
          setOutcome('live');
          router.replace(`/brand/campaigns/${campaignId}`);
          return;
        }
        if (funding?.status === 'failed') {
          setOutcome('failed');
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
      setOutcome('slow');
    })();
  }, [api, campaignId, outcome, router]);

  const campaignLink = campaignId ? `/brand/campaigns/${campaignId}` : '/brand/campaigns';

  return (
    <main className="flex min-h-dvh items-center justify-center p-6 text-center text-sm text-text">
      <div className="flex max-w-sm flex-col items-center gap-3">
        {outcome === 'waiting' || outcome === 'live' ? (
          <p>Confirming your payment…</p>
        ) : null}
        {outcome === 'app' ? (
          <>
            <p className="font-medium">Payment received.</p>
            <p className="text-text-muted">
              Switch back to the Zeyoo app. Your campaign goes live as soon as the app sees the payment.
            </p>
          </>
        ) : null}
        {outcome === 'cancelled' ? (
          <>
            <p className="font-medium">Payment cancelled.</p>
            <p className="text-text-muted">Nothing was charged. Your campaign is still a draft.</p>
            <Link href={campaignLink} className="underline">Back to the campaign</Link>
          </>
        ) : null}
        {outcome === 'failed' ? (
          <>
            <p className="font-medium">The payment did not go through.</p>
            <p className="text-text-muted">Nothing was charged. You can try again from the campaign.</p>
            <Link href={campaignLink} className="underline">Back to the campaign</Link>
          </>
        ) : null}
        {outcome === 'slow' ? (
          <>
            <p className="font-medium">Still waiting on Stripe.</p>
            <p className="text-text-muted">
              The payment can take a moment to clear. Check the campaign shortly. If it has been
              charged it will go live on its own once confirmed, and you can publish it from there.
            </p>
            <Link href={campaignLink} className="underline">Back to the campaign</Link>
          </>
        ) : null}
      </div>
    </main>
  );
}
