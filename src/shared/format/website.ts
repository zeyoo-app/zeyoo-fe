/**
 * Brand website inputs. The API validates these as a URL — `organizations.website`
 * is `z.string().url().max(2048)` (iam/organization.dto.ts) — but what people
 * actually type is `acme.com` or `www.acme.com`. Requiring the scheme up front
 * only left the primary action permanently disabled with nothing on screen saying
 * why, so a bare host is accepted here and given an `https://` scheme before it
 * is sent. Only input that can never be a website is reported as an error.
 */

/** Matches the backend's `z.string().url().max(2048)`. */
const MAX_LENGTH = 2048;
const HTTP_SCHEME = /^https?:\/\//i;
const SCHEME_NAME = /^[a-z][a-z0-9+.-]*$/i;
const HOST_LABEL = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i;
const PORT = /^\d{1,5}$/;
const NOT_A_WEBSITE = 'Enter a website like acme.com.';
const TOO_LONG = 'That link is too long.';

interface ParsedWebsite {
  /** What the API should store; `''` when the optional field is blank or unusable. */
  value: string;
  /** Why the input is unusable, or `undefined` when it is fine. */
  error: string | undefined;
}

/** The website to send to the API, or `''` when the field is blank or unusable. */
export function normalizeWebsite(input: string): string {
  return parseWebsite(input).value;
}

/** Why the input cannot be a website, or `undefined` when it can (blank included). */
export function websiteError(input: string): string | undefined {
  return parseWebsite(input).error;
}

function parseWebsite(input: string): ParsedWebsite {
  const typed = input.trim();
  if (!typed) return { value: '', error: undefined };
  if (typed.length > MAX_LENGTH) return unusable(TOO_LONG);
  // mailto:, tel: — anything that opens another app. `https://` is a scheme but a
  // usable one, and an `ftp://` host falls out on the host check below.
  if (hasForeignScheme(typed)) return unusable(NOT_A_WEBSITE);

  const candidate = HTTP_SCHEME.test(typed) ? typed : `https://${typed}`;
  const authority = candidate.slice(candidate.indexOf('://') + 3).split(/[/?#]/)[0] ?? '';
  const colon = authority.lastIndexOf(':');
  const host = colon === -1 ? authority : authority.slice(0, colon);
  const port = colon === -1 ? '' : authority.slice(colon + 1);
  if (port && !PORT.test(port)) return unusable(NOT_A_WEBSITE);
  if (host.length > 253) return unusable(TOO_LONG);

  // A dot is required so a stray word typed into the field is not stored as a
  // "website", while multi-level suffixes and subdomains stay valid.
  const labels = host.split('.');
  if (labels.length < 2 || !labels.every((label) => HOST_LABEL.test(label))) {
    return unusable(NOT_A_WEBSITE);
  }

  return { value: candidate, error: undefined };
}

/**
 * A leading `scheme:` the field should not accept. `acme.com:8443` is a host and a
 * port, not a scheme, so a colon followed only by digits does not count.
 */
function hasForeignScheme(typed: string): boolean {
  if (HTTP_SCHEME.test(typed)) return false;
  const colon = typed.indexOf(':');
  if (colon === -1) return false;
  const path = typed.search(/[/?#]/);
  if (path !== -1 && path < colon) return false;
  if (!SCHEME_NAME.test(typed.slice(0, colon))) return false;
  return !/^\d+$/.test(typed.slice(colon + 1).split(/[/?#]/)[0] ?? '');
}

function unusable(error: string): ParsedWebsite {
  return { value: '', error };
}
