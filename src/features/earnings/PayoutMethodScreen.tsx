'use client';

import { AsyncContent, Badge, Button, Card } from '@/design-system';
import { DetailShell } from '@/shared/shell';

import { useConnectPayout, useWallet } from './hooks';

/**
 * Where a creator's earnings go. The brand side of the app has a card on file;
 * here it is a bank account, connected once and then used by every withdrawal.
 * Bank details are held by the payout provider, so this screen only reports the
 * connection state and starts the flow — it never edits account numbers.
 */
export function PayoutMethodScreen() {
  const wallet = useWallet();
  const connect = useConnectPayout();

  return (
    <DetailShell
      role="creator"
      title="Payout Method"
      subtitle="Where your earnings are sent when you withdraw."
    >
      <AsyncContent isLoading={wallet.isLoading} isError={wallet.isError} data={wallet.data}>
        {(data) => (
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[15px] font-medium text-text">Bank account</p>
                <p className="text-sm text-text-muted">
                  {data.payoutConnected
                    ? 'Connected — withdrawals go straight to this account.'
                    : 'Connect an account to start withdrawing.'}
                </p>
              </div>
              {data.payoutConnected ? <Badge tone="success">Connected</Badge> : null}
            </div>

            <Button
              fullWidth={false}
              loading={connect.isPending}
              disabled={data.payoutConnected}
              onClick={() => connect.mutate()}
            >
              {data.payoutConnected ? 'Connected' : 'Connect payouts'}
            </Button>

            <p className="text-xs text-text-muted">
              Account details are held and processed by our payout provider. Zeyoo never stores your full
              account number.
            </p>
          </Card>
        )}
      </AsyncContent>
    </DetailShell>
  );
}
