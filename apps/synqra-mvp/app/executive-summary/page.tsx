import { ExecutiveSummaryPage } from '@/features/executive-summary/ExecutiveSummaryPage';
import { synqraExecSummaryData } from '@/features/executive-summary/execSummary.data.synqra';

export default function Page() {
    return <ExecutiveSummaryPage data={synqraExecSummaryData} />;
}
