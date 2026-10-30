/**
 * Terms & Privacy Policy copy (contract §1.6 — supplied by the client's counsel).
 *
 * Held as structured data rather than UI strings: it is one long document that is
 * reviewed as prose, not assembled from layout keys, and it changes as a whole
 * whenever legal revises a clause. Each language is a full, separately reviewed copy.
 */

export interface LegalSection {
  heading: string;
  body: string;
}

export interface LegalDocument {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
  closing: string;
}

const ENGLISH: LegalDocument = {
  title: 'Terms & Privacy Policy',
  lastUpdated: 'Last updated: October 2026',
  intro:
    'Welcome to Zeyoo. By creating an account you agree to these Terms of Service and our Privacy Policy.',
  sections: [
    {
      heading: '1. Using Zeyoo',
      body: "Zeyoo connects businesses running content-reward campaigns with creators who produce content for those campaigns. You must provide accurate account information and are responsible for the content you post or approve.",
    },
    {
      heading: '2. Payments & Rewards',
      body: "Businesses fund campaigns in advance, plus a platform fee set by their subscription plan. Unspent budget can be refunded; the platform fee cannot. Creators are paid based on the reward terms shown on each campaign at the time of submission. Payouts are processed to the payout method on file.",
    },
    {
      heading: '3. Content Ownership',
      body: "Creators retain ownership of their content, and grant the campaign's business a license to use approved submissions for marketing purposes as described on the campaign.",
    },
    {
      heading: '4. Content Standards',
      body: 'Creators must not create, post, or promote content for any campaign that is contrary to the Islamic faith, or that opposes or disparages the political stance of any country. Zeyoo may remove such content and reject the related submissions.',
    },
    {
      heading: '5. Privacy',
      body: 'We collect the information you provide (profile, campaign, and payment details) to operate Zeyoo. We do not sell your personal data. See our Privacy Policy for full details on what we collect and how it is used.',
    },
    {
      heading: '6. Account Termination',
      body: 'We may suspend accounts that violate these terms, including fraudulent submissions or misuse of campaign funds.',
    },
  ],
  closing:
    'Questions about these terms? Reach out from the Help & Support screen in your Profile.',
};

const ARABIC: LegalDocument = {
  title: 'الشروط وسياسة الخصوصية',
  lastUpdated: 'آخر تحديث: أكتوبر 2026',
  intro:
    'مرحبًا بك في Zeyoo. بإنشائك حسابًا فإنك توافق على شروط الخدمة هذه وعلى سياسة الخصوصية الخاصة بنا.',
  sections: [
    {
      heading: '1. استخدام Zeyoo',
      body: 'تربط Zeyoo الشركات التي تدير حملات مكافآت المحتوى بصنّاع المحتوى الذين ينتجون المحتوى لتلك الحملات. يجب عليك تقديم معلومات صحيحة عن حسابك، وأنت مسؤول عن المحتوى الذي تنشره أو توافق عليه.',
    },
    {
      heading: '2. المدفوعات والمكافآت',
      body: 'تموّل الشركات الحملات مقدمًا، إضافةً إلى رسوم منصة تحددها خطة اشتراكها. يمكن استرداد الميزانية غير المصروفة، أما رسوم المنصة فلا تُسترد. يحصل صنّاع المحتوى على مستحقاتهم وفق شروط المكافأة المعروضة على كل حملة وقت تقديم المحتوى، وتُصرف المدفوعات إلى وسيلة الدفع المسجّلة.',
    },
    {
      heading: '3. ملكية المحتوى',
      body: 'يحتفظ صنّاع المحتوى بملكية محتواهم، ويمنحون الشركة صاحبة الحملة ترخيصًا باستخدام المشاركات المعتمدة لأغراض تسويقية وفق ما هو موضح في الحملة.',
    },
    {
      heading: '4. معايير المحتوى',
      body: 'يلتزم صنّاع المحتوى بعدم إنشاء أو نشر أو ترويج أي محتوى لأي حملة تتعارض مع الدين الإسلامي، أو تعارض الموقف السياسي لأي دولة أو تسيء إليه. ويحق لـ Zeyoo إزالة هذا المحتوى ورفض المشاركات المرتبطة به.',
    },
    {
      heading: '5. الخصوصية',
      body: 'نجمع المعلومات التي تقدّمها (بيانات الملف الشخصي والحملات والدفع) لتشغيل Zeyoo. لا نبيع بياناتك الشخصية. راجع سياسة الخصوصية للاطلاع على التفاصيل الكاملة حول ما نجمعه وكيفية استخدامه.',
    },
    {
      heading: '6. إنهاء الحساب',
      body: 'يجوز لنا تعليق الحسابات التي تخالف هذه الشروط، بما في ذلك المشاركات الاحتيالية أو إساءة استخدام أموال الحملات.',
    },
  ],
  closing: 'لديك أسئلة حول هذه الشروط؟ تواصل معنا من شاشة المساعدة والدعم في ملفك الشخصي.',
};

/** The Terms in the reader's language; English for anything not translated. */
export function legalDocument(language: string): LegalDocument {
  return language.startsWith('ar') ? ARABIC : ENGLISH;
}
