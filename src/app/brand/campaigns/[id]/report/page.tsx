import { CampaignReportScreen } from '@/features/campaigns/CampaignReportScreen';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CampaignReportScreen campaignId={id} />;
}
