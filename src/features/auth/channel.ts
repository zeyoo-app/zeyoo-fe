export type AuthChannel = 'email' | 'phone';

export const CHANNEL_NOUN: Record<AuthChannel, { address: string; channel: string }> = {
  email: { address: 'email', channel: 'email' },
  phone: { address: 'phone number', channel: 'text message' },
};
