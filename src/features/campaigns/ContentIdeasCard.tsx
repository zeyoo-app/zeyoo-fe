'use client';

import { useCallback, useState } from 'react';
import { Check, Copy, RotateCcw, Sparkles } from 'lucide-react';

import { Button, Card, Field, Skeleton } from '@/design-system';
import { AiDisclosure, AiErrorNotice, AiProgress } from '@/shared/ai/AiStatus';
import { useAiStream } from '@/shared/ai/useAiStream';
import { useApi } from '@/shared/api';
import type { AiContentIdea, AiIdeasRequest, AiIdeasResult, AiPartial } from '@/shared/api';
import { useI18n } from '@/shared/i18n';

const IDEA_COUNT = 3;

/** Creator-facing post ideas for one campaign, streamed in as they are written. */
export function ContentIdeasCard({ campaignId }: { campaignId: string }) {
  const api = useApi();
  const { locale } = useI18n();
  const [focus, setFocus] = useState('');
  const run = useCallback(
    (input: AiIdeasRequest, options: Parameters<typeof api.streamContentIdeas>[1]) => api.streamContentIdeas(input, options),
    [api],
  );
  const stream = useAiStream<AiIdeasRequest, AiIdeasResult>(run);
  const generate = () => void stream.start({ campaignId, focus: focus.trim(), language: locale });

  const ideas: AiPartial<AiContentIdea>[] = (stream.result?.ideas ?? stream.partial?.ideas ?? []).filter(
    (idea): idea is AiPartial<AiContentIdea> => Boolean(idea),
  );
  const writing = stream.status === 'streaming';
  const showIdeas = writing || stream.status === 'done';

  return (
    <section className="mt-8" aria-labelledby="content-ideas-heading">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-5 text-green-text" aria-hidden />
        <h2 id="content-ideas-heading" className="font-display text-lg font-semibold text-text">
          Need ideas?
        </h2>
      </div>
      <Card className="flex flex-col gap-4">
        {stream.status === 'idle' || stream.status === 'cancelled' || stream.status === 'error' ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              generate();
            }}
          >
            <p className="text-sm text-text-muted">
              Get {IDEA_COUNT} post ideas written for this campaign&apos;s brief and rules, each with a hook and talking points.
            </p>
            <Field
              label="Your angle (optional)"
              placeholder="e.g. quick comedy skits, morning routines"
              maxLength={300}
              value={focus}
              onChange={(event) => setFocus(event.target.value)}
            />
            {stream.status === 'error' && stream.error ? (
              <AiErrorNotice message={stream.error.message} onRetry={stream.error.retryable ? generate : undefined} />
            ) : null}
            {stream.status === 'cancelled' ? <p className="text-sm text-text-muted">Stopped.</p> : null}
            <Button type="submit" variant="secondary" fullWidth={false} className="self-start">
              <Sparkles className="size-4" aria-hidden /> Get content ideas
            </Button>
          </form>
        ) : null}

        {writing ? <AiProgress stage={stream.stage} tools={stream.tools} onCancel={stream.cancel} /> : null}

        {showIdeas ? (
          <ol className="flex flex-col gap-3" aria-busy={writing}>
            {ideas.map((idea, index) => (
              <IdeaItem key={index} idea={idea} number={index + 1} />
            ))}
            {writing
              ? Array.from({ length: Math.max(0, IDEA_COUNT - ideas.length) }, (_, index) => (
                  <li key={`pending-${index}`} className="flex flex-col gap-2 rounded-xl border border-border p-4">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </li>
                ))
              : null}
          </ol>
        ) : null}

        {stream.status === 'done' ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <AiDisclosure />
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" fullWidth={false} onClick={stream.retry}>
                <RotateCcw className="size-4" aria-hidden /> New ideas
              </Button>
              <Button variant="ghost" size="sm" fullWidth={false} onClick={stream.reset}>
                Change angle
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </section>
  );
}

function IdeaItem({ idea, number }: { idea: AiPartial<AiContentIdea>; number: number }) {
  const [copied, setCopied] = useState(false);
  const points = (idea.talkingPoints ?? []).filter((point): point is string => Boolean(point));
  const copy = async () => {
    const text = [idea.title, idea.hook && `Hook: ${idea.hook}`, ...points.map((point) => `- ${point}`), idea.format && `Format: ${idea.format}`]
      .filter(Boolean)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; the text stays selectable on screen.
    }
  };

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-baseline font-medium text-text">
          <span className="me-1.5 text-text-tertiary">{number}.</span>
          {idea.title ?? <Skeleton className="h-4 w-32" />}
        </div>
        {idea.format ? (
          <span className="shrink-0 rounded-full bg-surface-raised px-2.5 py-1 text-xs text-text-muted">{idea.format}</span>
        ) : null}
      </div>
      {idea.hook ? (
        <p className="text-sm text-text">
          <span className="font-medium text-green-text">Hook: </span>
          {idea.hook}
        </p>
      ) : null}
      {points.length ? (
        <ul className="list-disc space-y-1 ps-5 text-sm text-text-muted">
          {points.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      ) : null}
      {idea.title && idea.hook && points.length ? (
        <button
          type="button"
          onClick={() => void copy()}
          className="flex items-center gap-1.5 self-start rounded-lg px-2 py-1 text-xs text-text-muted hover:bg-surface-hover"
          aria-label={`Copy idea ${number}`}
        >
          {copied ? <Check className="size-3.5 text-green-text" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      ) : null}
    </li>
  );
}
