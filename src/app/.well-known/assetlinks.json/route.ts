import { ANDROID_PACKAGE, androidCertFingerprints } from '@/shared/links/appLinks';

/**
 * Android's Digital Asset Links file. With it, App Links to zeyoo.app open the app
 * without a chooser. Each signing certificate the app ships under must be listed.
 */
export function GET(): Response {
  return Response.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: ANDROID_PACKAGE,
        sha256_cert_fingerprints: androidCertFingerprints(),
      },
    },
  ]);
}
