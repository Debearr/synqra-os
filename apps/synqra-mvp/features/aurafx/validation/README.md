# AuraFX Validation System

**Status:** ✅ COMPLETE (Phase 1 & 2)
**Last Updated:** 2026-01-27

---

## Overview

The AuraFX Validation System ensures that all signals are **Intelligence Outputs**, not **Trading Instructions**. This system prevents misinterpretation as financial advice through strict validation, safety guards, and compliance mechanisms.

---

## Architecture

```
aurafx/
├── validation/
│   ├── SignalValidationSpec.md          # Phase 1: Signal validation rules
│   ├── Signal_Validation_Report.md      # Phase 1: Completion report
│   ├── guards.ts                         # Phase 1: Signal safety guards
│   ├── ExportShareSafetySpec.md         # Phase 2: Export safety rules
│   ├── Export_Share_Safety_Report.md    # Phase 2: Completion report
│   └── export-guards.ts                  # Phase 2: Export safety guards
├── components/
│   └── ShareSafeWatermark.tsx            # Mandatory watermark component
├── tests/
│   ├── signal-compliance.test.ts         # Phase 1: Signal tests
│   └── export-safety.test.ts             # Phase 2: Export tests
└── index.ts                              # Public API exports
```

---

## Phase 1: Signal Validation ✅

**Objective:** Ensure signals are probabilistic intelligence, not trading commands.

### Key Features

- **Confidence Limits:** 0.0 < confidence < 1.0 (certainty is impossible)
- **Keyword Blacklist:** Rejects "buy", "sell", "long", "short", "entry", "target", "stop loss"
- **Lifecycle States:** PENDING → ACTIVE → DECAYING → EXPIRED
- **Validity Period:** All signals have start/end timestamps
- **Automatic Decay:** Confidence decays as signals approach expiration

### Usage

```typescript
import { validateSignalSafety, AuraSignal } from '@/features/aurafx';

const signal: AuraSignal = {
  id: 'signal-123',
  symbol: 'BTC/USD',
  type: 'MOMENTUM',
  direction: 'UP',
  confidence: 0.75, // Never 1.0
  context: 'Strong upward momentum detected', // No "buy" language
  validityPeriod: {
    start: Date.now(),
    end: Date.now() + 15 * 60 * 1000, // 15 minutes
  },
  // ...
};

const validation = validateSignalSafety(signal);
if (!validation.isValid) {
  console.error('Signal failed validation:', validation.reasons);
}
```

### Files

- **Spec:** `validation/SignalValidationSpec.md`
- **Implementation:** `validation/guards.ts`
- **Tests:** `tests/signal-compliance.test.ts`
- **Report:** `validation/Signal_Validation_Report.md`

---

## Phase 2: Export & Share Safety ✅

**Objective:** Ensure exported signals retain all safety mechanisms.

### Key Features

- **Approved Formats:** PNG, WebP, PDF (with restrictions), JSON (highly restricted)
- **Forbidden Formats:** CSV, API/webhook exports
- **Mandatory Watermarks:** All visual exports include watermarks
- **Legal Disclaimers:** All exports include full legal notice
- **Rate Limiting:** Max 5 exports/hour, 20/day, 10 signals/export
- **Session Tracking:** All exports include session ID for traceability
- **Audit Trail:** All export actions logged for 2 years

### Usage

#### Validate Export

```typescript
import { validateExportSafety } from '@/features/aurafx';

const signals = [signal1, signal2, signal3];
const validation = validateExportSafety(signals, sessionId);

if (!validation.isValid) {
  console.error('Export blocked:', validation.errors);
}
```

#### Create Safe JSON Export

```typescript
import { createSafeJSONExport, SignalState } from '@/features/aurafx';

const jsonExport = createSafeJSONExport(
  signals,
  [SignalState.ACTIVE, SignalState.ACTIVE],
  sessionId
);

// jsonExport includes:
// - version, exportedAt, expiresAt
// - sessionId, license, disclaimer
// - sanitized signals (no _meta fields)
```

#### Watermark Component

```typescript
import { ShareSafeWatermark } from '@/features/aurafx';

<div className="relative">
  <YourSignalVisualization />
  <ShareSafeWatermark
    sessionId="sess-123"
    generatedAt={Date.now()}
    expiresAt={Date.now() + 15 * 60 * 1000}
    includeDisclaimer={true}
  />
</div>
```

#### Validate Image Export Options

```typescript
import { validateImageExportOptions } from '@/features/aurafx';

const options = {
  format: 'png' as const,
  quality: 0.8, // Max 0.85 to prevent OCR
  includeWatermark: true, // MANDATORY
  includeDisclaimer: true, // MANDATORY
};

const validation = validateImageExportOptions(options);
```

### Files

- **Spec:** `validation/ExportShareSafetySpec.md`
- **Implementation:** `validation/export-guards.ts`
- **Tests:** `tests/export-safety.test.ts`
- **Report:** `validation/Export_Share_Safety_Report.md`

---

## Safety Guarantees

### ✅ Non-Transactional

- No "buy/sell" language in signal context
- No direct integration with trading platforms
- CSV and API exports are forbidden

### ✅ Traceable

- Every export includes session ID
- Audit logs track all export actions
- IP address and user agent logged

### ✅ Ephemeral

- All signals have expiration timestamps
- Share links expire after 24 hours
- Confidence decays over time

### ✅ Disclaimered

- All exports include legal disclaimer
- "NOT financial advice" prominently displayed
- User responsibility clearly stated

### ✅ Rate-Limited

- Max 10 signals per export
- Max 5 exports per hour
- 1-minute cooldown between exports

### ✅ Audited

- All export/share actions logged
- 2-year retention for compliance
- Queryable audit trail

---

## Compliance Checklist

Before enabling in production:

- [x] Signal validation enforced
- [x] Export validation enforced
- [x] Watermarks mandatory
- [x] Disclaimers mandatory
- [x] CSV export disabled
- [x] API export disabled
- [x] Rate limiting defined
- [x] Audit logging defined
- [ ] Legal team review (pending)
- [ ] Production deployment (pending)

---

## Testing

### Run Tests

```bash
# Run all AuraFX validation tests
npm test -- features/aurafx/tests

# Run specific test suites
npm test -- signal-compliance.test.ts
npm test -- export-safety.test.ts
```

### Test Coverage

- ✅ Signal validation (confidence, keywords, validity period)
- ✅ Export validation (format, watermark, disclaimer)
- ✅ Sanitization (strips internal metadata)
- ✅ Rate limiting enforcement
- ✅ Share link expiration
- ✅ Forbidden format rejection

---

## Locked Files

The following files are **LOCKED** and should not be modified without legal review:

1. `validation/SignalValidationSpec.md`
2. `validation/ExportShareSafetySpec.md`
3. `validation/guards.ts`
4. `validation/export-guards.ts`

**Any changes to these files MUST:**

- Go through legal review
- Update the specification documents
- Maintain or strengthen safety mechanisms
- Never weaken compliance safeguards

---

## API Reference

### Signal Validation

```typescript
// Validate signal safety
function validateSignalSafety(signal: AuraSignal): SignalValidationResult

// Types
interface AuraSignal {
  id: string;
  symbol: string;
  type: 'MOMENTUM' | 'VOLATILITY' | 'MEAN_REVERSION' | 'FLOW';
  direction: 'UP' | 'DOWN' | 'NEUTRAL';
  confidence: number; // 0.0 to 0.99
  context: string;
  validityPeriod: { start: number; end: number };
  // ...
}

interface SignalValidationResult {
  isValid: boolean;
  reasons: string[];
}
```

### Export Safety

```typescript
// Validate export safety
function validateExportSafety(
  signals: AuraSignal[],
  sessionId?: string
): ExportValidationResult

// Sanitize signal for export
function sanitizeSignalForExport(
  signal: AuraSignal,
  currentState: SignalState
): SafeSignalExport

// Create safe JSON export
function createSafeJSONExport(
  signals: AuraSignal[],
  signalStates: SignalState[],
  sessionId: string
): SafeJSONExport

// Validate export options
function validateImageExportOptions(
  options: Partial<ImageExportOptions>
): ExportValidationResult

function validatePDFExportOptions(
  options: Partial<PDFExportOptions>
): ExportValidationResult

// Forbidden formats (always fail)
function validateCSVExport(): ExportValidationResult
function validateAPIExport(): ExportValidationResult

// Share links
function createShareLink(
  signalIds: string[],
  sessionId: string
): ShareLink | ExportValidationResult

function validateShareLink(link: ShareLink): ExportValidationResult

// Audit logging
function createAuditLog(
  sessionId: string,
  userId: string,
  action: ExportAuditLog['action'],
  signalIds: string[],
  additionalData?: { ... }
): ExportAuditLog
```

---

## Next Steps (Phase 3)

1. **UI Integration:** Add export buttons to AuraFX UI
2. **Backend Implementation:** Implement actual export functions
3. **Rate Limiting Service:** Implement rate limiting middleware
4. **Audit Database:** Set up audit trail storage
5. **Legal Review:** Get legal team approval on disclaimer text

---

## Support

For questions or issues:

- Review the specification documents in `validation/`
- Check the completion reports for implementation details
- Run tests to verify expected behavior
- Consult the locked logic files for safety enforcement

**Remember:** The AuraFX validation system is designed to protect users and ensure compliance. Never bypass or weaken these safety mechanisms.
