import { CommunitySubmissionsScreen } from '@/features/campaigns/CommunitySubmissionsScreen';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CommunitySubmissionsScreen campaignId={id} />;
}
