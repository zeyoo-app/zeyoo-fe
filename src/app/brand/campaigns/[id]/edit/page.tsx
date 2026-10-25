import { EditCampaignScreen } from '@/features/campaigns/EditCampaignScreen';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditCampaignScreen campaignId={id} />;
}
