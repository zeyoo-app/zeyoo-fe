'use client';

import { useCallback, useState } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';

import { Button, Field, Modal, Skeleton, Textarea, cn } from '@/design-system';
import { AiDisclosure, AiErrorNotice, AiProgress } from '@/shared/ai/AiStatus';
import { useAiStream } from '@/shared/ai/useAiStream';
import { useApi } from '@/shared/api';
import type { AiBriefDraft, AiBriefRequest, AiPartial, CampaignContentType, SocialPlatform } from '@/shared/api';
import { platformsLabel } from '@/shared/format/platform';
import { useI18n } from '@/shared/i18n';

interface AiBriefDialogProps {
  open: boolean;
  onClose: () => void;
  /** What the brand already entered in earlier steps; sent as context. */
  title: string;
  platforms: SocialPlatform[];
  contentType: CampaignContentType;
  onApply: (draft: AiBriefDraft) => void;
}

/**
 * Drafts the campaign requirements from a short idea. The draft streams in as it is
 * written; the brand can stop, retry or regenerate, then copy it into the form.
 */
export function AiBriefDialog({ open, onClose, title, platforms, contentType, onApply }: AiBriefDialogProps) {
  const api = useApi();
  const { locale } = useI18n();
  const [idea, setIdea] = useState('');
  const [goal, setGoal] = useState('');
  const run = useCallback(
    (input: AiBriefRequest, options: Parameters<typeof api.streamCampaignBrief>[1]) => api.streamCampaignBrief(input, options),
    [api],
  );
  const stream = useAiStream(run);

  const canGenerate = idea.trim().length >= 3;
  const generate = () =>
    void stream.start({ idea: idea.trim(), goal: goal.trim(), title: title.trim(), platforms, contentType, language: locale });

  const close = () => {
    stream.cancel();
    onClose();
  };

  const showForm = stream.status === 'idle' || stream.status === 'cancelled' || stream.status === 'error';
  const draft: AiPartial<AiBriefDraft> | null = stream.result ?? stream.partial;

  return (
    <Modal open={open} onClose={close} title="Draft requirements with AI" wide>
      {showForm ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canGenerate) generate();
          }}
        >
          <Textarea
            label="What are you promoting?"
            placeholder="e.g. Nimbus glow serum, a lightweight vitamin C serum for dull skin"
            maxLength={1000}
            rows={3}
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            autoFocus
          />
          <Field
            label="Main goal (optional)"
            placeholder="e.g. Get first-time buyers to try it"
            maxLength={300}
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
          />
          <p className="text-xs text-text-muted">
            Uses your campaign details too: {platformsLabel(platforms) || 'any platform'} ·{' '}
            {contentType === 'clipping' ? 'Clipping' : 'UGC'} · {locale === 'ar' ? 'Arabic' : 'English'}
          </p>
          {stream.status === 'error' && stream.error ? (
            <AiErrorNotice message={stream.error.message} onRetry={stream.error.retryable ? generate : undefined} />
          ) : null}
          {stream.status === 'cancelled' ? <p className="text-sm text-text-muted">Stopped. Edit your request or generate again.</p> : null}
          <Button type="submit" disabled={!canGenerate}>
            <Sparkles className="size-4" aria-hidden /> Generate draft
          </Button>
        </form>
      ) : null}

      {stream.status === 'streaming' ? <AiProgress stage={stream.stage} tools={stream.tools} onCancel={stream.cancel} /> : null}

      {(stream.status === 'streaming' || stream.status === 'done') && (
        <DraftPreview draft={draft} writing={stream.status === 'streaming'} />
      )}

      {stream.status === 'done' && stream.result ? (
        <>
          <AiDisclosure />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={() => {
                if (stream.result) onApply(stream.result);
                stream.reset();
                onClose();
              }}
            >
              Use this draft
            </Button>
            <Button variant="secondary" onClick={stream.retry}>
              <RotateCcw className="size-4" aria-hidden /> Regenerate
            </Button>
            <Button variant="ghost" onClick={stream.reset}>
              Edit request
            </Button>
          </div>
        </>
      ) : null}
    </Modal>
  );
}

/** The draft laid out like the form it will fill; missing parts show as placeholders while writing. */
function DraftPreview({ draft, writing }: { draft: AiPartial<AiBriefDraft> | null; writing: boolean }) {
  const rules = (draft?.contentRules ?? []).filter((rule): rule is string => Boolean(rule));
  const hashtags = (draft?.hashtags ?? []).filter((tag): tag is string => Boolean(tag));
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-4" aria-busy={writing}>
      <PreviewText label="Campaign brief" text={draft?.brief} writing={writing} lines={3} />
      <PreviewText label="Goals" text={draft?.goals} writing={writing} />
      <PreviewText label="Target audience" text={draft?.audience} writing={writing} />
      <div className="flex flex-col gap-1.5">
        <p className="text-[13px] font-medium text-text-muted">Content rules</p>
        {rules.length ? (
          <ul className="flex flex-col gap-1.5">
            {rules.map((rule, index) => (
              <li key={index} className="rounded-lg bg-surface-raised px-3 py-2 text-sm text-text">
                {rule}
              </li>
            ))}
          </ul>
        ) : writing ? (
          <Skeleton className="h-9 w-full" />
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-[13px] font-medium text-text-muted">Hashtags</p>
        {hashtags.length ? (
          <div className="flex flex-wrap gap-1.5">
            {hashtags.map((tag, index) => (
              <span key={index} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-green-text">
                {tag.startsWith('#') ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        ) : writing ? (
          <Skeleton className="h-6 w-40" />
        ) : null}
      </div>
    </div>
  );
}

function PreviewText({ label, text, writing, lines = 1 }: { label: string; text?: string; writing: boolean; lines?: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[13px] font-medium text-text-muted">{label}</p>
      {text ? (
        <p className={cn('whitespace-pre-wrap text-sm leading-relaxed text-text')}>{text}</p>
      ) : writing ? (
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: lines }, (_, index) => (
            <Skeleton key={index} className={cn('h-4', index === lines - 1 ? 'w-2/3' : 'w-full')} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
