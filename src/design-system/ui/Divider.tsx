/** Hairline separator in the theme border colour (design.md §4 — lines over shadows). */
export function Divider({ className }: { className?: string }) {
  return <div aria-hidden className={`h-px w-full bg-border ${className ?? ''}`} />;
}
