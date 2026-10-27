import { BackOfficeProviders } from '@/features/admin/BackOfficeProviders';

export default function BackOfficeLayout({ children }: { children: React.ReactNode }) {
  return <BackOfficeProviders>{children}</BackOfficeProviders>;
}
