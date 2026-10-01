import type { Role } from '@/shared/api';

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'brand', label: 'Company' },
  { value: 'creator', label: 'Creator' },
];
