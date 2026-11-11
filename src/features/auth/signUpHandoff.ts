import type { AuthChannel } from './channel';

/** What sign-in had typed when it found no account: the channel and its value. */
export interface SignUpHandoff {
  channel: AuthChannel;
  /** An email address, or a phone number in E.164 form. */
  value: string;
}

/**
 * Carries the email or phone number from sign-in to sign-up when sign-in finds no
 * account for it, so the person does not have to type it again. It is held in memory
 * rather than in the route so the address never ends up in a URL, browser history or
 * server logs. It is only ever written on the client, during an in-app navigation; a
 * fresh load starts sign-up empty, which also keeps server and client renders identical.
 */
let pending: SignUpHandoff | null = null;

export function handOffToSignUp(handoff: SignUpHandoff): void {
  pending = handoff;
}

/** What sign-in handed over, if anything. Safe to read during render. */
export function handedOffToSignUp(): SignUpHandoff | null {
  return pending;
}

/** Forgets the handoff once sign-up has taken it. */
export function clearSignUpHandoff(): void {
  pending = null;
}
