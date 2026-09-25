import { CampaignDetailCreatorScreen } from '@/features/campaigns/CampaignDetailCreatorScreen';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CampaignDetailCreatorScreen campaignId={id} />;
}
