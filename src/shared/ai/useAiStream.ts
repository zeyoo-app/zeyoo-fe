'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { AiPartial, AiResultMeta, AiStage, AiStreamEvent, AiStreamOptions } from '@/shared/api';

export type AiStreamStatus = 'idle' | 'streaming' | 'done' | 'error' | 'cancelled';

export interface AiToolActivity {
  id: string;
  label: string;
  state: 'running' | 'done' | 'failed';
}

export interface AiStreamState<T> {
  status: AiStreamStatus;
  stage: AiStage | null;
  partial: AiPartial<T> | null;
  result: T | null;
  meta: AiResultMeta | null;
  tools: AiToolActivity[];
  error: { message: string; retryable: boolean } | null;
}

function initialState<T>(): AiStreamState<T> {
  return { status: 'idle', stage: null, partial: null, result: null, meta: null, tools: [], error: null };
}

/**
 * Runs a streamed assistant request and keeps its progress in state: the current
 * stage, any tool activity, the partial result as it is written, then the result or
 * an error. `cancel` aborts the request; unmounting cancels it too.
 */
export function useAiStream<TInput, T>(
  run: (input: TInput, options: AiStreamOptions<T>) => Promise<void>,
) {
  const [state, setState] = useState<AiStreamState<T>>(initialState);
  const controller = useRef<AbortController | null>(null);
  const lastInput = useRef<TInput | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const start = useCallback(
    async (input: TInput) => {
      controller.current?.abort();
      const abort = new AbortController();
      controller.current = abort;
      lastInput.current = input;
      setState({ ...initialState<T>(), status: 'streaming', stage: 'thinking' });

      const onEvent = (event: AiStreamEvent<T>) => {
        if (abort.signal.aborted) return;
        setState((current) => reduce(current, event));
      };
      try {
        await run(input, { signal: abort.signal, onEvent });
        // A stream that ended without a result or error was cut off in transit.
        setState((current) =>
          current.status === 'streaming'
            ? { ...current, status: 'error', error: { message: 'The connection dropped. Please try again.', retryable: true } }
            : current,
        );
      } catch (error) {
        if (abort.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'The assistant failed. Please try again.';
        setState((current) => ({ ...current, status: 'error', error: { message, retryable: true } }));
      }
    },
    [run],
  );

  const cancel = useCallback(() => {
    controller.current?.abort();
    setState((current) => (current.status === 'streaming' ? { ...current, status: 'cancelled', stage: null } : current));
  }, []);

  const retry = useCallback(() => {
    if (lastInput.current !== null) void start(lastInput.current);
  }, [start]);

  const reset = useCallback(() => {
    controller.current?.abort();
    setState(initialState<T>());
  }, []);

  return { ...state, start, cancel, retry, reset };
}

function reduce<T>(state: AiStreamState<T>, event: AiStreamEvent<T>): AiStreamState<T> {
  switch (event.type) {
    case 'status':
      return { ...state, stage: event.stage };
    case 'partial':
      return { ...state, partial: event.data };
    case 'tool_call':
      return { ...state, tools: [...state.tools, { id: event.id, label: event.label, state: 'running' }] };
    case 'tool_result':
      return {
        ...state,
        tools: state.tools.map((tool) => (tool.id === event.id ? { ...tool, state: event.ok ? 'done' : 'failed' } : tool)),
      };
    case 'result':
      return { ...state, status: 'done', stage: null, result: event.data, meta: event.meta, partial: null };
    case 'error':
      return { ...state, status: 'error', stage: null, error: { message: event.message, retryable: event.retryable } };
  }
}
