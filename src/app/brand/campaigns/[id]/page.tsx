import { CampaignDetailBrandScreen } from '@/features/campaigns/CampaignDetailBrandScreen';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CampaignDetailBrandScreen campaignId={id} />;
}
