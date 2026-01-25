import { RawData } from './types';

export class SynqraRawCollector {
    async collect(input: any, source: string, category: RawData['category']): Promise<RawData> {
        const entry: RawData = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            source,
            category,
            content: this.scrubData(input),
            metadata: {
                collectedBy: 'Synqra-Raw-Collector',
                version: '1.0.0'
            }
        };

        console.log(`[Collector] Collected entry ${entry.id} from ${source}`);
        return entry;
    }

    private scrubData(data: any): any {
        // Basic PII scrubbing logic placeholder
        // In a real scenario, this would recursively remove emails, phones, names, etc.
        const str = JSON.stringify(data);
        // Simple regex to mask potential emails (very basic)
        const scrubbed = str.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
        return JSON.parse(scrubbed);
    }
}
