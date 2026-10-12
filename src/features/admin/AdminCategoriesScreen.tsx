'use client';

import { useState } from 'react';

import { AsyncContent, Button, Card, EmptyState, Field } from '@/design-system';

import { AdminPageHeader } from './DataTable';
import { useAdminCategories, useCreateCategory } from './hooks';

export function AdminCategoriesScreen() {
  const query = useAdminCategories();
  const create = useCreateCategory();
  const [name, setName] = useState('');

  return (
    <>
      <AdminPageHeader
        title="Categories"
        subtitle="The campaign categories brands choose from when creating a campaign."
      />
      <Card className="mb-5 flex flex-col gap-3 p-4">
        <Field
          label="New category"
          placeholder="e.g. Travel"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        {create.error ? (
          <p className="text-xs text-danger">
            {create.error instanceof Error ? create.error.message : 'Could not add the category.'}
          </p>
        ) : null}
        <Button
          size="sm"
          fullWidth={false}
          disabled={name.trim().length < 2}
          loading={create.isPending}
          onClick={() => create.mutate(name.trim(), { onSuccess: () => setName('') })}
        >
          Add category
        </Button>
      </Card>
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(categories) =>
          categories.length === 0 ? (
            <EmptyState title="No categories" description="Add the first one above." />
          ) : (
            <Card className="divide-y divide-border p-0">
              {categories.map((category) => (
                <p key={category.id} className="px-4 py-3 text-sm text-text">
                  {category.name}
                </p>
              ))}
            </Card>
          )
        }
      </AsyncContent>
    </>
  );
}
