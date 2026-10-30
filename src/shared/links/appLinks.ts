/**
 * The paths the mobile app claims as universal links (iOS) and App Links (Android).
 * A link to any of these opens the app when it is installed and this website when not;
 * the app maps each onto its own screen. Web-only flows stay out: the admin console,
 * sign-in callbacks, and the funding return page (the app has its own return path).
 */
export const APP_LINK_PATHS = [
  '/brand/*',
  '/creator/*',
  '/disputes',
  '/disputes/*',
  '/notifications',
  '/settings',
  '/settings/*',
  '/campaign-rules',
  '/terms-of-service',
  '/privacy',
  '/app-return',
] as const;

export const IOS_APP_ID = `${process.env.APPLE_TEAM_ID ?? '452DA33M5F'}.app.zeyoo.mobile`;
export const ANDROID_PACKAGE = 'app.zeyoo.mobile';

/**
 * SHA-256 fingerprints of the Android signing certificates, comma-separated in
 * ANDROID_SHA256_CERT_FINGERPRINTS: the Play app-signing key (Play Console → App
 * integrity) and the EAS upload key, so store and internal builds both verify.
 */
export function androidCertFingerprints(): string[] {
  return (process.env.ANDROID_SHA256_CERT_FINGERPRINTS ?? '')
    .split(',')
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);
}
