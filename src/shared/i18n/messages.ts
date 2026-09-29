export type Locale = 'en' | 'ar';

export const LOCALES: Locale[] = ['en', 'ar'];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
};

/**
 * Message catalog for the shell, auth, and landing surfaces — enough to prove
 * full RTL and locale switching (IMPLEMENTATION_PLAN §8). Feature-body strings are
 * added incrementally against the same `t()` seam.
 */
type MessageKey =
  | 'nav.dashboard'
  | 'nav.campaigns'
  | 'nav.creators'
  | 'nav.wallet'
  | 'nav.profile'
  | 'nav.discover'
  | 'nav.submissions'
  | 'nav.disputes'
  | 'nav.notifications'
  | 'nav.settings'
  | 'nav.signOut'
  | 'auth.tagline'
  | 'auth.email'
  | 'auth.continue'
  | 'auth.signIn'
  | 'auth.createAccount'
  | 'auth.or'
  | 'auth.google'
  | 'auth.newHere'
  | 'auth.haveAccount'
  | 'landing.cta'
  | 'landing.signIn'
  | 'common.language';

export const messages: Record<Locale, Record<MessageKey, string>> = {
  en: {
    'nav.dashboard': 'Home',
    'nav.campaigns': 'Campaigns',
    'nav.creators': 'Creators',
    'nav.wallet': 'Wallet',
    'nav.profile': 'Profile',
    'nav.discover': 'Discover',
    'nav.submissions': 'Submissions',
    'nav.disputes': 'Disputes',
    'nav.notifications': 'Notifications',
    'nav.settings': 'Settings',
    'nav.signOut': 'Sign out',
    'auth.tagline': 'Get paid to create. Get campaigns done.',
    'auth.email': 'Email',
    'auth.continue': 'Continue',
    'auth.signIn': 'Sign in',
    'auth.createAccount': 'Create account',
    'auth.or': 'or',
    'auth.google': 'Continue with Google',
    'auth.newHere': 'New here?',
    'auth.haveAccount': 'Already have an account?',
    'landing.cta': 'Get started',
    'landing.signIn': 'Sign in',
    'common.language': 'Language',
  },
  ar: {
    'nav.dashboard': 'الرئيسية',
    'nav.campaigns': 'الحملات',
    'nav.creators': 'المبدعون',
    'nav.wallet': 'المحفظة',
    'nav.profile': 'الملف الشخصي',
    'nav.discover': 'اكتشف',
    'nav.submissions': 'المشاركات',
    'nav.disputes': 'النزاعات',
    'nav.notifications': 'الإشعارات',
    'nav.settings': 'الإعدادات',
    'nav.signOut': 'تسجيل الخروج',
    'auth.tagline': 'اربح من صناعة المحتوى. أنجز حملاتك.',
    'auth.email': 'البريد الإلكتروني',
    'auth.continue': 'متابعة',
    'auth.signIn': 'تسجيل الدخول',
    'auth.createAccount': 'إنشاء حساب',
    'auth.or': 'أو',
    'auth.google': 'المتابعة مع Google',
    'auth.newHere': 'جديد هنا؟',
    'auth.haveAccount': 'لديك حساب بالفعل؟',
    'landing.cta': 'ابدأ الآن',
    'landing.signIn': 'تسجيل الدخول',
    'common.language': 'اللغة',
  },
};

export type { MessageKey };
