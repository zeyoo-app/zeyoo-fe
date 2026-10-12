import { DisputeDetailScreen } from '@/features/disputes/DisputeDetailScreen';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DisputeDetailScreen disputeId={id} />;
}
