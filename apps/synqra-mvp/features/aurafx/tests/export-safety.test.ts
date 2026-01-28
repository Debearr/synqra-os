/**
 * AuraFX Export Safety Guards - Test Suite
 * Phase 2: Export & Share Safety
 * 
 * Tests all export safety validation logic.
 */

import { describe, it, expect } from '@jest/globals';
import {
    validateExportSafety,
    validateImageExportOptions,
    validatePDFExportOptions,
    validateCSVExport,
    validateAPIExport,
    createSafeJSONExport,
    sanitizeSignalForExport,
    createShareLink,
    validateShareLink,
    EXPORT_RATE_LIMITS,
    LEGAL_DISCLAIMER,
} from '../validation/export-guards';
import { AuraSignal, SignalState } from '../types';

// ============================================================================
// TEST FIXTURES
// ============================================================================

const createValidSignal = (overrides?: Partial<AuraSignal>): AuraSignal => ({
    id: 'test-signal-1',
    symbol: 'BTC/USD',
    timestamp: Date.now(),
    type: 'MOMENTUM',
    direction: 'UP',
    confidence: 0.75,
    context: 'Strong upward momentum detected in recent price action',
    riskLevel: 'MEDIUM',
    validityPeriod: {
        start: Date.now(),
        end: Date.now() + 15 * 60 * 1000, // 15 minutes
    },
    _meta: {
        source: 'test',
        rawScore: 0.8,
    },
    ...overrides,
});

const createExpiredSignal = (): AuraSignal => createValidSignal({
    validityPeriod: {
        start: Date.now() - 30 * 60 * 1000,
        end: Date.now() - 15 * 60 * 1000, // Expired 15 minutes ago
    },
});

const createInvalidSignal = (): AuraSignal => createValidSignal({
    context: 'Buy this signal now!', // Contains banned keyword
});

// ============================================================================
// EXPORT VALIDATION TESTS
// ============================================================================

describe('validateExportSafety', () => {
    it('should pass for valid signals with session ID', () => {
        const signals = [createValidSignal()];
        const result = validateExportSafety(signals, 'test-session-123');

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should fail if no session ID provided', () => {
        const signals = [createValidSignal()];
        const result = validateExportSafety(signals);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('No valid session ID for export traceability');
    });

    it('should fail if no signals provided', () => {
        const result = validateExportSafety([], 'test-session-123');

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('No signals to export');
    });

    it('should fail if too many signals (bulk export prevention)', () => {
        const signals = Array.from({ length: 15 }, (_, i) =>
            createValidSignal({ id: `signal-${i}` })
        );
        const result = validateExportSafety(signals, 'test-session-123');

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('Maximum'))).toBe(true);
    });

    it('should fail if any signal is expired', () => {
        const signals = [createValidSignal(), createExpiredSignal()];
        const result = validateExportSafety(signals, 'test-session-123');

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('expired'))).toBe(true);
    });

    it('should fail if any signal contains banned keywords', () => {
        const signals = [createInvalidSignal()];
        const result = validateExportSafety(signals, 'test-session-123');

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('transactional keywords'))).toBe(true);
    });

    it('should respect max signals per export limit', () => {
        const maxSignals = EXPORT_RATE_LIMITS.maxSignalsPerExport;
        const signals = Array.from({ length: maxSignals }, (_, i) =>
            createValidSignal({ id: `signal-${i}` })
        );
        const result = validateExportSafety(signals, 'test-session-123');

        expect(result.isValid).toBe(true);
    });
});

// ============================================================================
// SANITIZATION TESTS
// ============================================================================

describe('sanitizeSignalForExport', () => {
    it('should strip _meta field from signal', () => {
        const signal = createValidSignal();
        const sanitized = sanitizeSignalForExport(signal, SignalState.ACTIVE);

        expect(sanitized).not.toHaveProperty('_meta');
        expect(signal._meta).toBeDefined(); // Original should still have it
    });

    it('should include all public fields', () => {
        const signal = createValidSignal();
        const sanitized = sanitizeSignalForExport(signal, SignalState.ACTIVE);

        expect(sanitized.id).toBe(signal.id);
        expect(sanitized.symbol).toBe(signal.symbol);
        expect(sanitized.timestamp).toBe(signal.timestamp);
        expect(sanitized.type).toBe(signal.type);
        expect(sanitized.direction).toBe(signal.direction);
        expect(sanitized.confidence).toBe(signal.confidence);
        expect(sanitized.context).toBe(signal.context);
        expect(sanitized.riskLevel).toBe(signal.riskLevel);
        expect(sanitized.validityPeriod).toEqual(signal.validityPeriod);
    });

    it('should include current state', () => {
        const signal = createValidSignal();
        const sanitized = sanitizeSignalForExport(signal, SignalState.DECAYING);

        expect(sanitized.state).toBe(SignalState.DECAYING);
    });
});

// ============================================================================
// JSON EXPORT TESTS
// ============================================================================

describe('createSafeJSONExport', () => {
    it('should create valid JSON export structure', () => {
        const signals = [createValidSignal()];
        const states = [SignalState.ACTIVE];
        const jsonExport = createSafeJSONExport(signals, states, 'test-session-123');

        expect(jsonExport.version).toBe('1.0.0');
        expect(jsonExport.sessionId).toBe('test-session-123');
        expect(jsonExport.license).toBe('ANALYTICAL_USE_ONLY');
        expect(jsonExport.disclaimer).toBe(LEGAL_DISCLAIMER);
        expect(jsonExport.signals).toHaveLength(1);
    });

    it('should set expiresAt to max signal expiry', () => {
        const signal1 = createValidSignal({
            validityPeriod: {
                start: Date.now(),
                end: Date.now() + 10 * 60 * 1000, // 10 minutes
            },
        });
        const signal2 = createValidSignal({
            validityPeriod: {
                start: Date.now(),
                end: Date.now() + 20 * 60 * 1000, // 20 minutes (max)
            },
        });

        const signals = [signal1, signal2];
        const states = [SignalState.ACTIVE, SignalState.ACTIVE];
        const jsonExport = createSafeJSONExport(signals, states, 'test-session-123');

        expect(jsonExport.expiresAt).toBe(signal2.validityPeriod.end);
    });

    it('should sanitize all signals (strip _meta)', () => {
        const signals = [createValidSignal(), createValidSignal({ id: 'signal-2' })];
        const states = [SignalState.ACTIVE, SignalState.ACTIVE];
        const jsonExport = createSafeJSONExport(signals, states, 'test-session-123');

        jsonExport.signals.forEach(signal => {
            expect(signal).not.toHaveProperty('_meta');
        });
    });
});

// ============================================================================
// IMAGE EXPORT VALIDATION TESTS
// ============================================================================

describe('validateImageExportOptions', () => {
    it('should pass for valid image export options', () => {
        const options = {
            format: 'png' as const,
            quality: 0.8,
            includeWatermark: true as const,
            includeDisclaimer: true as const,
            maxWidth: 1920,
            maxHeight: 1080,
        };
        const result = validateImageExportOptions(options);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should fail if watermark is not included', () => {
        const options = {
            format: 'png' as const,
            includeWatermark: false as any,
            includeDisclaimer: true as const,
        };
        const result = validateImageExportOptions(options);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Watermark is mandatory for image exports');
    });

    it('should fail if disclaimer is not included', () => {
        const options = {
            format: 'png' as const,
            includeWatermark: true as const,
            includeDisclaimer: false as any,
        };
        const result = validateImageExportOptions(options);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Disclaimer is mandatory for image exports');
    });

    it('should fail if quality exceeds 0.85 (OCR prevention)', () => {
        const options = {
            format: 'png' as const,
            quality: 0.95,
            includeWatermark: true as const,
            includeDisclaimer: true as const,
        };
        const result = validateImageExportOptions(options);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('0.85'))).toBe(true);
    });

    it('should fail for invalid format', () => {
        const options = {
            format: 'jpg' as any,
            includeWatermark: true as const,
            includeDisclaimer: true as const,
        };
        const result = validateImageExportOptions(options);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('PNG and WebP'))).toBe(true);
    });
});

// ============================================================================
// PDF EXPORT VALIDATION TESTS
// ============================================================================

describe('validatePDFExportOptions', () => {
    it('should pass for valid PDF export options', () => {
        const options = {
            includeWatermark: true as const,
            includeDisclaimer: true as const,
            readOnly: true as const,
            metadata: {
                sessionId: 'test-session-123',
                generatedAt: Date.now(),
                expiresAt: Date.now() + 15 * 60 * 1000,
                license: 'ANALYTICAL_USE_ONLY' as const,
            },
        };
        const result = validatePDFExportOptions(options);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should fail if watermark is not included', () => {
        const options = {
            includeWatermark: false as any,
            includeDisclaimer: true as const,
            readOnly: true as const,
            metadata: {
                sessionId: 'test-session-123',
                generatedAt: Date.now(),
                expiresAt: Date.now() + 15 * 60 * 1000,
                license: 'ANALYTICAL_USE_ONLY' as const,
            },
        };
        const result = validatePDFExportOptions(options);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Watermark is mandatory for PDF exports');
    });

    it('should fail if not read-only', () => {
        const options = {
            includeWatermark: true as const,
            includeDisclaimer: true as const,
            readOnly: false as any,
            metadata: {
                sessionId: 'test-session-123',
                generatedAt: Date.now(),
                expiresAt: Date.now() + 15 * 60 * 1000,
                license: 'ANALYTICAL_USE_ONLY' as const,
            },
        };
        const result = validatePDFExportOptions(options);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('read-only'))).toBe(true);
    });

    it('should fail if metadata is missing', () => {
        const options = {
            includeWatermark: true as const,
            includeDisclaimer: true as const,
            readOnly: true as const,
        };
        const result = validatePDFExportOptions(options);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('PDF metadata is required for traceability');
    });

    it('should fail if metadata fields are incomplete', () => {
        const options = {
            includeWatermark: true as const,
            includeDisclaimer: true as const,
            readOnly: true as const,
            metadata: {
                sessionId: 'test-session-123',
                // Missing other required fields
            } as any,
        };
        const result = validatePDFExportOptions(options);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });
});

// ============================================================================
// FORBIDDEN FORMAT TESTS
// ============================================================================

describe('validateCSVExport', () => {
    it('should always fail (CSV is forbidden)', () => {
        const result = validateCSVExport();

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('CSV export is forbidden. Use JSON export with strict validation instead.');
    });
});

describe('validateAPIExport', () => {
    it('should always fail (API export is forbidden)', () => {
        const result = validateAPIExport();

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('API/webhook export is forbidden. Users must manually export through the UI.');
    });
});

// ============================================================================
// SHARE LINK TESTS
// ============================================================================

describe('createShareLink', () => {
    it('should create valid share link', () => {
        const signalIds = ['signal-1', 'signal-2'];
        const result = createShareLink(signalIds, 'test-session-123');

        expect('isValid' in result).toBe(false); // Should return ShareLink, not validation result
        if ('id' in result) {
            expect(result.id).toBeDefined();
            expect(result.sessionId).toBe('test-session-123');
            expect(result.signalIds).toEqual(signalIds);
            expect(result.viewCount).toBe(0);
            expect(result.maxViews).toBe(10);
            expect(result.expiresAt).toBeGreaterThan(result.createdAt);
        }
    });

    it('should fail if no signals provided', () => {
        const result = createShareLink([], 'test-session-123');

        expect('isValid' in result).toBe(true);
        if ('isValid' in result) {
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('No signals to share');
        }
    });

    it('should fail if too many signals (max 5)', () => {
        const signalIds = ['s1', 's2', 's3', 's4', 's5', 's6'];
        const result = createShareLink(signalIds, 'test-session-123');

        expect('isValid' in result).toBe(true);
        if ('isValid' in result) {
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Maximum 5 signals per share link');
        }
    });

    it('should set expiration to 24 hours', () => {
        const signalIds = ['signal-1'];
        const result = createShareLink(signalIds, 'test-session-123');

        if ('expiresAt' in result) {
            const expectedExpiry = result.createdAt + (24 * 60 * 60 * 1000);
            expect(result.expiresAt).toBe(expectedExpiry);
        }
    });
});

describe('validateShareLink', () => {
    it('should pass for valid, non-expired link', () => {
        const link = {
            id: 'share-123',
            sessionId: 'session-123',
            createdAt: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000),
            signalIds: ['signal-1'],
            viewCount: 5,
            maxViews: 10,
        };
        const result = validateShareLink(link);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should fail if link is expired', () => {
        const link = {
            id: 'share-123',
            sessionId: 'session-123',
            createdAt: Date.now() - (48 * 60 * 60 * 1000),
            expiresAt: Date.now() - (24 * 60 * 60 * 1000), // Expired
            signalIds: ['signal-1'],
            viewCount: 5,
            maxViews: 10,
        };
        const result = validateShareLink(link);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('expired'))).toBe(true);
    });

    it('should fail if max views reached', () => {
        const link = {
            id: 'share-123',
            sessionId: 'session-123',
            createdAt: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000),
            signalIds: ['signal-1'],
            viewCount: 10,
            maxViews: 10,
        };
        const result = validateShareLink(link);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('maximum view count'))).toBe(true);
    });
});

// ============================================================================
// RATE LIMIT CONSTANTS TESTS
// ============================================================================

describe('EXPORT_RATE_LIMITS', () => {
    it('should have reasonable rate limits', () => {
        expect(EXPORT_RATE_LIMITS.maxExportsPerHour).toBe(5);
        expect(EXPORT_RATE_LIMITS.maxExportsPerDay).toBe(20);
        expect(EXPORT_RATE_LIMITS.maxSignalsPerExport).toBe(10);
        expect(EXPORT_RATE_LIMITS.cooldownBetweenExports).toBe(60000); // 1 minute
    });
});

// ============================================================================
// LEGAL DISCLAIMER TESTS
// ============================================================================

describe('LEGAL_DISCLAIMER', () => {
    it('should contain required legal language', () => {
        expect(LEGAL_DISCLAIMER).toContain('NOT financial advice');
        expect(LEGAL_DISCLAIMER).toContain('ANALYTICAL USE ONLY');
        expect(LEGAL_DISCLAIMER).toContain('probabilistic');
        expect(LEGAL_DISCLAIMER).toContain('solely responsible');
        expect(LEGAL_DISCLAIMER).toContain('no liability');
    });

    it('should mention key risk factors', () => {
        expect(LEGAL_DISCLAIMER).toContain('time-sensitive');
        expect(LEGAL_DISCLAIMER).toContain('decay');
        expect(LEGAL_DISCLAIMER).toContain('never 100%');
        expect(LEGAL_DISCLAIMER).toContain('Past performance');
    });
});
