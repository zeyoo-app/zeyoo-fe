'use client';

import type { ReactNode } from 'react';

import { Button, Card, EmptyState, cn } from '@/design-system';

export interface Column<Row> {
  header: string;
  cell: (row: Row) => ReactNode;
  className?: string;
}

interface DataTableProps<Row> {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  emptyTitle: string;
  emptyDescription?: string;
}

/** A plain responsive table: scrolls sideways on narrow screens instead of squashing. */
export function DataTable<Row>({ columns, rows, rowKey, emptyTitle, emptyDescription }: DataTableProps<Row>) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription ?? ''} />;
  }
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-start text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-text-tertiary">
              {columns.map((column) => (
                <th key={column.header} className={cn('px-4 py-3 text-start font-medium', column.className)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-border last:border-0">
                {columns.map((column) => (
                  <td key={column.header} className={cn('px-4 py-3 align-top text-text', column.className)}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function AdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-text-muted">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

/** Previous / next controls for a paged list; renders nothing when everything fits on one page. */
export function Pager({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-text-muted">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          fullWidth={false}
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="secondary"
          fullWidth={false}
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
