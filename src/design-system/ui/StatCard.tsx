import { Card } from './Card';

interface StatCardProps {
  value: string;
  label: string;
  caption?: string;
}

/** A dashboard KPI tile: mono value (the data-product signature), label, trend caption. */
export function StatCard({ value, label, caption }: StatCardProps) {
  return (
    <Card className="p-4">
      <p className="font-numeric text-2xl text-text">{value}</p>
      <p className="mt-1 text-[13px] text-text-muted">{label}</p>
      {caption ? <p className="mt-0.5 text-xs text-green-text">{caption}</p> : null}
    </Card>
  );
}
