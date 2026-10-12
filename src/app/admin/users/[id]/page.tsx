import { AdminUserDetailScreen } from '@/features/admin/AdminUserDetailScreen';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminUserDetailScreen userId={id} />;
}
