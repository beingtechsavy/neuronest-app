'use client';

import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { PageHeader, PageShell } from '@/components/ui';

export default function AnalyticsPage() {
  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Insights"
        title="Your progress"
        description="Built only from tasks you actually completed. Nothing here is simulated."
      />
      <AnalyticsDashboard />
    </PageShell>
  );
}
