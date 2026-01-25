import assert from 'node:assert';
import { composeFusion } from './fusion-composer';
import { RawData, Insight } from './types';

// Mock Data
const mockRaw: RawData = {
    id: 'test-id-123',
    timestamp: '2025-01-01T00:00:00Z',
    source: 'test-source',
    category: 'log',
    content: { message: 'test log' },
    metadata: { version: '1' }
};

const mockInsight: Insight = {
    rawId: 'test-id-123',
    insight: 'Test insight',
    recommendedAction: 'Ignore',
    severity: 'low',
    tags: ['test']
};

// Test 1: Basic Composition
console.log('Test 1: Basic Composition');
const fusion1 = composeFusion(mockRaw, mockInsight);

assert.strictEqual(fusion1.id, mockRaw.id);
assert.strictEqual(fusion1.timestamp, mockRaw.timestamp);
assert.strictEqual(fusion1.source, 'fusion');
assert.strictEqual(fusion1.severity, mockInsight.severity);
assert.strictEqual(fusion1.actionRecommendation, mockInsight.recommendedAction);
assert.deepStrictEqual(fusion1.raw, mockRaw);
assert.deepStrictEqual(fusion1.insights, mockInsight);
console.log('✅ Passed');

// Test 2: ID Mismatch Handling (Should still compose, but we might want to verify behavior)
// The function assumes the caller matches them, but let's ensure it uses the raw ID for the fusion ID
console.log('Test 2: Structure Integrity');
const fusion2 = composeFusion(mockRaw, { ...mockInsight, rawId: 'mismatch-id' });
assert.strictEqual(fusion2.id, mockRaw.id); // Should follow raw ID
assert.strictEqual(fusion2.insights.rawId, 'test-id-123'); // Should be corrected/overwritten by spread if we did that, OR kept if we didn't.
// Wait, looking at implementation:
// insights: { ...insightEntry, rawId: rawEntry.id }
// So it SHOULD overwrite the mismatch.
assert.strictEqual(fusion2.insights.rawId, mockRaw.id);
console.log('✅ Passed');

console.log('All tests passed successfully.');
