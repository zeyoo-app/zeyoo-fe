/**
 * Reads a `text/event-stream` body and hands each `data:` payload to `onData`, parsed
 * as JSON. Comment lines (heartbeats) and malformed events are skipped.
 */
export async function readServerSentEvents(
  body: ReadableStream<Uint8Array>,
  onData: (data: unknown) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const flush = (block: string) => {
    const data = block
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n');
    if (!data) return;
    try {
      onData(JSON.parse(data));
    } catch {
      // A malformed event is dropped rather than ending the stream.
    }
  };
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      let boundary = buffer.indexOf('\n\n');
      while (boundary >= 0) {
        flush(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf('\n\n');
      }
    }
    flush(buffer + decoder.decode());
  } finally {
    reader.releaseLock();
  }
}
