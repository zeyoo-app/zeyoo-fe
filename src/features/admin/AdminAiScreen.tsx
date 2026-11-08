'use client';

import { useId, useState } from 'react';
import { CheckCircle2, Plug, XCircle } from 'lucide-react';

import { AsyncContent, Badge, Button, Card, SegmentedToggle, Skeleton } from '@/design-system';
import type { AiProviderId, AiSettings } from '@/shared/api';

import { AdminPageHeader } from './DataTable';
import { useAiModels, useAiSettings, useResetAiSettings, useTestAiConnection, useUpdateAiSettings } from './hooks';

const PROVIDER_LABELS: Record<AiProviderId, string> = { ollama: 'Ollama', anthropic: 'Anthropic (Claude)' };
const PROVIDER_SETUP: Record<AiProviderId, string> = {
  ollama: 'Set OLLAMA_BASE_URL (and OLLAMA_API_KEY for Ollama Cloud) on the API server.',
  anthropic: 'Set ANTHROPIC_API_KEY on the API server.',
};

/** Which provider and model the brief and content-idea assistants use, and a live check. */
export function AdminAiScreen() {
  const settings = useAiSettings();
  return (
    <>
      <AdminPageHeader
        title="AI assistants"
        subtitle="Choose the provider and model behind the campaign brief and content idea assistants. Changes apply within seconds."
      />
      <AsyncContent isLoading={settings.isLoading} isError={settings.isError} data={settings.data}>
        {(data) => (
          <div className="flex flex-col gap-5">
            {/* Keyed by the active model so a test result never outlives the model it tested. */}
            <ActiveCard key={`${data.active.provider}/${data.active.model}`} settings={data} />
            <ChooserCard settings={data} />
          </div>
        )}
      </AsyncContent>
    </>
  );
}

function ActiveCard({ settings }: { settings: AiSettings }) {
  const test = useTestAiConnection();
  const reset = useResetAiSettings();
  const outcome = test.data;

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-text-muted">In use now</p>
          <p className="mt-1 font-display text-xl font-semibold text-text">
            {PROVIDER_LABELS[settings.active.provider]} · <span className="font-mono text-lg">{settings.active.model}</span>
          </p>
        </div>
        <Badge tone={settings.source === 'admin' ? 'accent' : 'neutral'}>
          {settings.source === 'admin' ? 'Chosen by staff' : 'Server default'}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" fullWidth={false} variant="secondary" loading={test.isPending} onClick={() => test.mutate()}>
          <Plug className="size-4" aria-hidden /> Test connection
        </Button>
        {settings.source === 'admin' ? (
          <Button size="sm" fullWidth={false} variant="ghost" loading={reset.isPending} onClick={() => reset.mutate()}>
            Use server default
          </Button>
        ) : null}
      </div>
      <div aria-live="polite">
        {outcome ? (
          outcome.ok ? (
            <p className="flex items-start gap-2 text-sm text-text">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-text" aria-hidden />
              Connected to {outcome.model} in {(outcome.latencyMs / 1000).toFixed(1)}s.
              {outcome.reply ? <span className="text-text-muted"> Reply: “{outcome.reply}”</span> : null}
            </p>
          ) : (
            <p className="flex items-start gap-2 text-sm text-text">
              <XCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
              <span>
                <span className="font-medium">{outcome.error?.code ?? 'Failed'}:</span> {outcome.error?.message}
              </span>
            </p>
          )
        ) : test.error ? (
          <p className="text-sm text-danger">{test.error instanceof Error ? test.error.message : 'The test failed.'}</p>
        ) : null}
      </div>
    </Card>
  );
}

function ChooserCard({ settings }: { settings: AiSettings }) {
  const [provider, setProvider] = useState<AiProviderId>(settings.active.provider);
  const [model, setModel] = useState(settings.active.model);
  const models = useAiModels(provider);
  const update = useUpdateAiSettings();
  const selectId = useId();
  const status = settings.providers.find((entry) => entry.id === provider);

  // Switching provider starts from that provider's current (or default) model.
  const chooseProvider = (next: AiProviderId) => {
    setProvider(next);
    const nextDefault = settings.providers.find((entry) => entry.id === next)?.defaultModel ?? '';
    setModel(next === settings.active.provider ? settings.active.model : nextDefault);
  };

  const options = models.data ?? [];
  const listed = options.some((entry) => entry.name === model);
  const unchanged = provider === settings.active.provider && model === settings.active.model;

  return (
    <Card className="flex flex-col gap-4 p-5">
      <p className="font-medium text-text">Change provider or model</p>
      <SegmentedToggle
        options={settings.providers.map((entry) => ({ value: entry.id, label: PROVIDER_LABELS[entry.id] }))}
        value={provider}
        onChange={chooseProvider}
      />
      {status && !status.configured ? (
        <p className="text-sm text-text-muted">Not set up yet. {PROVIDER_SETUP[provider]}</p>
      ) : (
        <div className="flex flex-col gap-2">
          <label htmlFor={selectId} className="text-[13px] font-medium text-text-muted">
            Model
          </label>
          {models.isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : models.isError ? (
            <p className="text-sm text-danger" role="alert">
              Could not list models: {models.error instanceof Error ? models.error.message : 'the provider did not answer.'}
            </p>
          ) : (
            <select
              id={selectId}
              value={listed ? model : ''}
              onChange={(event) => setModel(event.target.value)}
              className="h-12 rounded-xl border border-border bg-surface px-4 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {!listed ? <option value="">Choose a model…</option> : null}
              {options.map((entry) => (
                <option key={entry.name} value={entry.name}>
                  {entry.name}
                  {entry.details ? ` — ${entry.details}` : ''}
                </option>
              ))}
            </select>
          )}
          <p className="text-xs text-text-muted">
            Server default for {PROVIDER_LABELS[provider]}: <span className="font-mono">{status?.defaultModel}</span>
          </p>
        </div>
      )}
      {update.error ? (
        <p className="text-sm text-danger" role="alert">
          {update.error instanceof Error ? update.error.message : 'Could not save.'}
        </p>
      ) : null}
      <Button
        size="sm"
        fullWidth={false}
        className="self-start"
        disabled={!status?.configured || !model || !listed || unchanged}
        loading={update.isPending}
        onClick={() => update.mutate({ provider, model })}
      >
        Save
      </Button>
    </Card>
  );
}
