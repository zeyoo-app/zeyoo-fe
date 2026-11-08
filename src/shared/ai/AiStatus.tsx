'use client';

import { AlertCircle, Check, Loader2, Sparkles, Wrench, X } from 'lucide-react';

import { Button, cn } from '@/design-system';
import type { AiStage } from '@/shared/api';

import type { AiToolActivity } from './useAiStream';

const STEPS: { stage: AiStage; label: string }[] = [
  { stage: 'thinking', label: 'Reading your request' },
  { stage: 'writing', label: 'Writing' },
  { stage: 'checking', label: 'Checking the result' },
];

const ORDER: Record<AiStage, number> = { thinking: 0, writing: 1, checking: 2, fixing: 2 };

/**
 * Where a running assistant is: each step done, in progress or still to come, plus any
 * tools it called. Announced politely to screen readers.
 */
export function AiProgress({
  stage,
  tools = [],
  onCancel,
}: {
  stage: AiStage | null;
  tools?: AiToolActivity[];
  onCancel?: () => void;
}) {
  const current = stage ? ORDER[stage] : 0;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-4" role="status" aria-live="polite">
      <ol className="flex flex-col gap-2">
        {STEPS.map((step, index) => {
          const state = index < current ? 'done' : index === current ? 'active' : 'todo';
          const label = step.stage === 'checking' && stage === 'fixing' ? 'Fixing the format' : step.label;
          return (
            <li key={step.stage} className="flex items-center gap-2.5 text-sm">
              <StepIcon state={state} />
              <span className={cn(state === 'todo' ? 'text-text-tertiary' : 'text-text', state === 'active' && 'font-medium')}>
                {label}
              </span>
            </li>
          );
        })}
        {tools.map((tool) => (
          <li key={tool.id} className="flex items-center gap-2.5 text-sm text-text-muted">
            {tool.state === 'running' ? (
              <Loader2 className="size-4 animate-spin text-green-text" aria-hidden />
            ) : tool.state === 'done' ? (
              <Wrench className="size-4 text-green-text" aria-hidden />
            ) : (
              <X className="size-4 text-danger" aria-hidden />
            )}
            {tool.label}
          </li>
        ))}
      </ol>
      {onCancel ? (
        <Button variant="secondary" size="sm" fullWidth={false} className="self-start" onClick={onCancel}>
          Stop
        </Button>
      ) : null}
    </div>
  );
}

function StepIcon({ state }: { state: 'done' | 'active' | 'todo' }) {
  if (state === 'done') {
    return (
      <span className="flex size-5 items-center justify-center rounded-full bg-primary/15">
        <Check className="size-3.5 text-green-text" aria-hidden />
      </span>
    );
  }
  if (state === 'active') {
    return <Loader2 className="size-5 animate-spin text-green-text" aria-hidden />;
  }
  return <span className="size-5 rounded-full border border-border" aria-hidden />;
}

/** A failed run: the reason, and a retry when trying again can help. */
export function AiErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-danger/40 bg-danger/10 p-4" role="alert">
      <p className="flex items-start gap-2 text-sm text-text">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
        {message}
      </p>
      {onRetry ? (
        <Button variant="secondary" size="sm" fullWidth={false} className="self-start" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/** States that the text is AI-written, so people review it. */
export function AiDisclosure() {
  return (
    <p className="flex items-center gap-1.5 text-xs text-text-tertiary">
      <Sparkles className="size-3.5" aria-hidden />
      AI-generated. Review before you use it.
    </p>
  );
}
