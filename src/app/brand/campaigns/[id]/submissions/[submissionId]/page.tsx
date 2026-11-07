import { SubmissionDetailScreen } from '@/features/campaigns/SubmissionDetailScreen';

export default async function Page({ params }: { params: Promise<{ id: string; submissionId: string }> }) {
  const { id, submissionId } = await params;
  return <SubmissionDetailScreen campaignId={id} submissionId={submissionId} />;
}
