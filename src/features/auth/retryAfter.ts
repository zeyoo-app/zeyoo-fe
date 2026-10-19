const WAIT_PATTERN = /wait (\d+) seconds?/i;

/** Seconds a "please wait N seconds" rate-limit message asks for, or null for any other message. */
export function retryAfterSeconds(message: string | null | undefined): number | null {
  const match = message ? WAIT_PATTERN.exec(message) : null;
  return match ? Number(match[1]) : null;
}

/** 75 -> "1:15", 9 -> "0:09". */
export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
