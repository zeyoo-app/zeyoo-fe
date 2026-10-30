import { APP_LINK_PATHS, IOS_APP_ID } from '@/shared/links/appLinks';

/**
 * Apple's universal-link association file. iOS fetches it (through Apple's CDN) when
 * the app is installed and opens matching zeyoo.app links in the app. It must be
 * served as JSON at this exact path with no redirect.
 */
export function GET(): Response {
  return Response.json({
    applinks: {
      details: [
        {
          appIDs: [IOS_APP_ID],
          components: [
            { '/': '/admin/*', exclude: true, comment: 'The admin console is web-only.' },
            ...APP_LINK_PATHS.map((path) => ({ '/': path })),
          ],
        },
      ],
    },
  });
}
