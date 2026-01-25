import { SynqraRawCollector } from './collector';
import { SynqraInsightEngine } from './insight-engine';
import { SynqraPipeline } from './pipeline';
import { composeFusion } from './fusion-composer';
import { validateFusionEntry } from './validators/fusion-validator';

async function runManualTest() {
    console.log('🧪 Starting Manual Pipeline Test...');

    const collector = new SynqraRawCollector();
    const engine = new SynqraInsightEngine();
    const pipeline = new SynqraPipeline();

    // 1. Synthetic Data
    const syntheticInput = {
        event: 'Manual_Test_Event',
        user: 'test_user_anon',
        value: 123.45,
        location: 'Virtual_Lab'
    };
    const source = 'Manual-Test-Script';
    const category = 'log';

    try {
        // 2. Collect
        console.log('\n[1/5] Collecting...');
        const raw = await collector.collect(syntheticInput, source, category);
        console.log(`✅ Raw Entry Created: ${raw.id}`);

        // 3. Insight
        console.log('\n[2/5] Generating Insight...');
        const insight = await engine.process(raw);
        console.log(`✅ Insight Generated: ${insight.severity} severity`);

        // 4. Fusion
        console.log('\n[3/5] Composing Fusion...');
        const fusion = composeFusion(raw, insight);
        console.log(`✅ Fusion Entry Composed: ${fusion.id}`);

        // 5. Validate
        console.log('\n[4/5] Validating...');
        const validation = validateFusionEntry(fusion);
        if (!validation.ok) {
            throw new Error(`Validation failed: ${validation.error}`);
        }
        console.log('✅ Validation Passed');

        // 6. Distribute
        console.log('\n[5/5] Distributing to Targets...');
        await pipeline.distribute(fusion);
        console.log('✅ Distribution process initiated (check logs for individual target success)');

    } catch (error) {
        console.error('❌ Test Failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    runManualTest().catch(console.error);
}
