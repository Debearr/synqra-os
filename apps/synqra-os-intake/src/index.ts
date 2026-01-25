import { SynqraRawCollector } from './collector';
import { SynqraInsightEngine } from './insight-engine';
import { SynqraPipeline } from './pipeline';
import { composeFusion } from './fusion-composer';
import { validateFusionEntry } from './validators/fusion-validator';
import { IntakeEntry, FusionEntry } from './types';

class SynqraOSIntake {
    private collector: SynqraRawCollector;
    private engine: SynqraInsightEngine;
    private pipeline: SynqraPipeline;

    constructor() {
        this.collector = new SynqraRawCollector();
        this.engine = new SynqraInsightEngine();
        this.pipeline = new SynqraPipeline();
    }

    async processInput(input: any, source: string, category: any) {
        try {
            // 1. Collect
            const raw = await this.collector.collect(input, source, category);

            // 2. Insight
            const insight = await this.engine.process(raw);

            // 3. Fusion
            const fusion = composeFusion(raw, insight);
            console.log("[Fusion] Entry composed:", fusion.id);

            // 4. Validate
            const validation = validateFusionEntry(fusion);
            if (!validation.ok) {
                console.warn(`[Fusion] Invalid entry skipped: ${validation.error}`);
                return null; // Skip pipeline
            }

            // 5. Distribute
            await this.pipeline.distribute(fusion);

            return fusion;
        } catch (error) {
            console.error('[SynqraOSIntake] Error processing input:', error);
            throw error;
        }
    }

    async runDailyDigest() {
        console.log('[SynqraOSIntake] Running daily digest...');
        // Implement digest logic: query storage, summarize, send report
        // For now, we'll just log a summary to the memory bus
        const summary = {
            timestamp: new Date().toISOString(),
            type: 'DAILY_DIGEST',
            totalProcessed: 0, // Would query actual stats
            status: 'healthy'
        };
        console.log('Daily Digest:', summary);
    }
}

// --- Autonomous Execution Loop ---

async function main() {
    const system = new SynqraOSIntake();
    console.log('🚀 Synqra-OS-Intake System Initialized');
    console.log('🔄 Starting autonomous loop (5m poll interval)...');

    // Initial run
    await runCycle(system);

    // Schedule polling (5 minutes)
    setInterval(async () => {
        await runCycle(system);
    }, 5 * 60 * 1000);

    // Schedule daily digest (24 hours)
    setInterval(async () => {
        await system.runDailyDigest();
    }, 24 * 60 * 60 * 1000);
}

async function runCycle(system: SynqraOSIntake) {
    console.log(`\n[${new Date().toISOString()}] ⚡ Starting intake cycle...`);

    // Mock inputs for demonstration/testing
    // In production, this would poll an actual source queue or API
    const mockInputs = [
        { source: 'Property-Log-1', category: 'log', data: { event: 'Access', user: 'admin', ip: '192.168.1.1' } },
        { source: 'Listing-Scraper', category: 'listing', data: { id: 'L123', price: 500000, address: '123 Main St' } },
        { source: 'Compliance-Bot', category: 'compliance', data: { check: 'AML', status: 'flagged', risk: 'high' } }
    ];

    for (const input of mockInputs) {
        await system.processInput(input.data, input.source, input.category);
    }

    console.log(`[${new Date().toISOString()}] ✅ Cycle complete.`);
}

if (require.main === module) {
    main().catch(console.error);
}
