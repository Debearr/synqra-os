# Multi-Timeframe Conflict Protocol

## Overview
Strict multi-timeframe conflict resolution for AuraFX with **zero synthesis**.

## Allowed Timeframes
- **H4** (4-hour)
- **D1** (daily)

No other timeframes permitted.

## Conflict States

### 1. ALIGNED
**Conditions:**
- Direction matches between H4 and D1
- Probability delta ≤ 10%

**Display Rule:**
- Show primary timeframe (H4) only
- Message: "Multi-timeframe consensus"

**Example:**
```typescript
H4: BULLISH 65%
D1: BULLISH 70%
→ ALIGNED (delta = 5%)
→ Display: H4 only
```

### 2. DIVERGENT
**Conditions:**
- Direction matches between H4 and D1
- Probability delta > 10% and < 20%

**Display Rule:**
- Show both timeframes explicitly
- Message: "Timeframe-dependent scenarios"

**Example:**
```typescript
H4: BULLISH 60%
D1: BULLISH 75%
→ DIVERGENT (delta = 15%)
→ Display: Both H4 and D1 separately
```

### 3. CONTRADICTORY
**Conditions:**
- Opposite directional bias (BULLISH vs BEARISH)

**Display Rule:**
- **DO NOT** issue an assessment
- Message: "Conflicting timeframe bias — no assessment issued"

**Example:**
```typescript
H4: BULLISH 70%
D1: BEARISH 65%
→ CONTRADICTORY
→ Display: Nothing (suppressed)
```

## Code Structure

### Core Files
1. **types.ts** - Type definitions (27 lines)
2. **conflict-resolver.ts** - Conflict logic (86 lines total, **~40 code lines**)
3. **ui-state-mapper.ts** - UI state mapping (135 lines)
4. **conflict-resolver.test.ts** - Test suite (9 test cases)

### Line Count Verification
**conflict-resolver.ts** (core logic):
- Total lines: 86
- Comment/blank lines: ~33
- Import statements: 5
- **Actual code lines: ~48** ✅ (within <50 constraint)

## Strict Constraints

### ❌ NEVER DO THIS:
```typescript
// ❌ WRONG: Averaging probabilities
const avgProbability = (h4.probability + d1.probability) / 2;

// ❌ WRONG: Synthesizing conflicting signals
if (h4.direction !== d1.direction) {
  return "NEUTRAL"; // This is synthesis!
}

// ❌ WRONG: Weighted combination
const combined = (h4.probability * 0.6) + (d1.probability * 0.4);
```

### ✅ CORRECT APPROACH:
```typescript
// ✅ RIGHT: Preserve original values
if (state === "DIVERGENT") {
  return {
    primary: input.h4,    // Original H4 value
    secondary: input.d1,  // Original D1 value
  };
}

// ✅ RIGHT: Suppress contradictions
if (areOpposite(h4.direction, d1.direction)) {
  return { action: "SUPPRESS" }; // No assessment issued
}
```

## Usage Example

```typescript
import { resolveMultiTimeframeConflict } from "./conflict-resolver";
import { mapConflictToUIState } from "./ui-state-mapper";

const input = {
  h4: { timeframe: "H4", direction: "BULLISH", probability: 65 },
  d1: { timeframe: "D1", direction: "BULLISH", probability: 70 },
};

const resolution = resolveMultiTimeframeConflict(input);
// → { state: "ALIGNED", action: "SHOW_PRIMARY", ... }

const uiState = mapConflictToUIState(resolution);
// → { shouldDisplay: true, assessments: [H4 only], ... }
```

## Validation

The `validateNoSynthesis()` function ensures:
1. CONTRADICTORY states never display
2. Assessment counts match actions (1 for PRIMARY, 2 for BOTH, 0 for SUPPRESS)
3. Probabilities are never averaged or modified
4. No conflation of timeframe data occurs

## Test Coverage

All 9 test cases pass:
- ✅ ALIGNED with 5% delta
- ✅ ALIGNED with exact match
- ✅ DIVERGENT with 15% delta
- ✅ DIVERGENT edge case (11% delta)
- ✅ CONTRADICTORY (BULLISH vs BEARISH)
- ✅ CONTRADICTORY (BEARISH vs BULLISH)
- ✅ NEUTRAL handling
- ✅ Boundary test (exactly 10% delta)
- ✅ Synthesis prevention validation

## Integration

To integrate with existing AuraFX signal route:

```typescript
import { resolveMultiTimeframeConflict } from "./multi-timeframe/conflict-resolver";

// After getting H4 and D1 assessments
const resolution = resolveMultiTimeframeConflict({ h4, d1 });

if (resolution.action === "SUPPRESS") {
  return NextResponse.json({
    success: true,
    data: null,
    message: resolution.displayMessage,
  });
}

// Otherwise proceed with display logic
```
