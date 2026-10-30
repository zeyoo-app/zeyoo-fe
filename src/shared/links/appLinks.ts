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
 * SHA-256 fingerprints of the certificates the Android app is signed with. They are
 * public (every APK carries its certificate), so the known ones live here; more can be
 * added without a code change, comma-separated, in ANDROID_SHA256_CERT_FINGERPRINTS.
 * Each key the app ships under must be listed: the Play app-signing key for store
 * installs and the EAS key for internal builds.
 */
const KNOWN_ANDROID_CERT_FINGERPRINTS = [
  '62:E8:AE:86:D9:68:95:31:86:C5:F9:82:2A:63:21:B1:28:FA:28:93:CF:D1:45:9B:BF:86:D2:92:A1:7E:6E:4F',
];

export function androidCertFingerprints(): string[] {
  const configured = (process.env.ANDROID_SHA256_CERT_FINGERPRINTS ?? '')
    .split(',')
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);
  return [...new Set([...KNOWN_ANDROID_CERT_FINGERPRINTS, ...configured])];
}
