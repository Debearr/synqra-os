import OverviewPage from '@/components/dashboard/OverviewPage'
import { getDashboardPreviewMetrics } from '@/lib/supabase'
import {
  getCampaignUsageSnapshot,
  getDemoStripeCustomerId,
  getTierDetails,
} from '@/lib/subscription'

export default async function DashboardPage() {
  // TODO(stripe): Replace demo customer usage with authenticated user's subscription context.
  const demoStripeCustomerId = getDemoStripeCustomerId()

  const [metrics, usage] = await Promise.all([
    getDashboardPreviewMetrics(),
    getCampaignUsageSnapshot(demoStripeCustomerId),
  ])

  const tier = getTierDetails(usage.tier)

  return <OverviewPage metrics={metrics} usage={usage} tier={tier} />
}
