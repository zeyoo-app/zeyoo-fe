import Link from 'next/link';
import { ArrowRight, BarChart3, ShieldCheck, Sparkles, Wallet } from 'lucide-react';

import { Logo } from '@/design-system';

const CREATOR_STEPS = [
  'Discover campaigns that fit your audience',
  'Post your content and submit the link',
  'Earn per 1,000 verified views — paid out to your wallet',
];

const BRAND_STEPS = [
  'Launch a campaign and set your budget and rate',
  'Invite creators or open it to the community',
  'Review submissions and pay only for real views',
];

const FEATURES = [
  { icon: BarChart3, title: 'Pay per performance', body: 'Set a rate per 1,000 views and a per-creator cap. You only pay for views the ledger verifies.' },
  { icon: Wallet, title: 'Instant creator wallet', body: 'Creators watch earnings accrue in real time and withdraw once identity is verified.' },
  { icon: ShieldCheck, title: 'Fraud-aware payouts', body: 'View-authenticity checks hold suspicious payouts before they clear, with a fair appeal path.' },
  { icon: Sparkles, title: 'AI brief & ideas', body: 'Draft a campaign brief or generate content ideas in a click — grounded in your goal and platform.' },
];

function Nav() {
  return (
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <Logo height={26} />
      <div className="flex items-center gap-2">
        <Link
          href="/sign-in"
          className="rounded-xl px-4 py-2 text-sm font-medium text-text hover:bg-surface-hover"
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover"
        >
          Get started
        </Link>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <header className="mx-auto max-w-6xl px-6 pb-16 pt-12 text-center sm:pt-20">
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1 text-xs font-medium text-green-text">
        <span className="size-1.5 rounded-full bg-primary" /> Creator marketing, measured by views
      </span>
      <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight text-text sm:text-6xl">
        Get paid to create.
        <br />
        Get campaigns <span className="text-green-text">done</span>.
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-lg text-text-muted">
        Zeyoo connects brands and creators around one honest metric — verified views. Launch a
        campaign or start earning in minutes.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/sign-up"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 font-medium text-on-primary hover:bg-primary-hover sm:w-auto"
        >
          Get started <ArrowRight className="size-4" />
        </Link>
        <Link
          href="/sign-in"
          className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border px-6 font-medium text-text hover:bg-surface-hover sm:w-auto"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}

function HowItWorks() {
  return (
    <section className="mx-auto grid max-w-6xl gap-4 px-6 py-8 md:grid-cols-2">
      {[
        { label: 'For creators', steps: CREATOR_STEPS },
        { label: 'For brands', steps: BRAND_STEPS },
      ].map((column) => (
        <div key={column.label} className="rounded-2xl border border-border bg-surface p-6">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-text-tertiary">
            {column.label}
          </p>
          <ol className="flex flex-col gap-4">
            {column.steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary font-numeric text-xs text-on-primary">
                  {index + 1}
                </span>
                <span className="text-sm text-text">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </section>
  );
}

function Features() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-2xl border border-border bg-surface p-5">
            <feature.icon className="size-6 text-green-text" />
            <h3 className="mt-4 font-display text-base font-semibold text-text">{feature.title}</h3>
            <p className="mt-1.5 text-sm text-text-muted">{feature.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-col items-center gap-5 rounded-3xl bg-primary px-6 py-14 text-center">
        <h2 className="max-w-xl font-display text-3xl font-semibold text-on-primary">
          Ready to run your first campaign?
        </h2>
        <Link
          href="/sign-up"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-on-primary px-6 font-medium text-primary"
        >
          Create your account <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-10 text-center sm:flex-row sm:justify-between">
      <Logo height={22} />
      <p className="text-xs text-text-tertiary">© {new Date().getFullYear()} Zeyoo. All rights reserved.</p>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <Nav />
      <Hero />
      <HowItWorks />
      <Features />
      <CtaBand />
      <Footer />
    </div>
  );
}
