# Multi-Timeframe Conflict Resolution Flow

## Visual Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│                    INPUT: H4 + D1                           │
│  { h4: {direction, probability}, d1: {direction, probability} }│
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ Compare Directions    │
              └───────────┬───────────┘
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
    ┌──────────────┐          ┌──────────────────┐
    │   OPPOSITE   │          │   SAME DIRECTION │
    │   BULLISH    │          │   (both BULLISH  │
    │      vs      │          │   or both BEARISH│
    │   BEARISH    │          │   or both NEUTRAL)│
    └──────┬───────┘          └────────┬─────────┘
           │                           │
           ▼                           ▼
    ┌──────────────┐          ┌──────────────────┐
    │CONTRADICTORY │          │ Calculate Delta  │
    │              │          │ |H4% - D1%|      │
    │ ACTION:      │          └────────┬─────────┘
    │ SUPPRESS     │                   │
    │              │         ┌─────────┴─────────┐
    │ Display:     │         │                   │
    │ NOTHING      │         ▼                   ▼
    └──────────────┘   ┌──────────┐      ┌──────────────┐
                       │ Delta    │      │ Delta        │
                       │ ≤ 10%    │      │ > 10%        │
                       └────┬─────┘      └──────┬───────┘
                            │                   │
                            ▼                   ▼
                     ┌──────────────┐    ┌──────────────┐
                     │   ALIGNED    │    │  DIVERGENT   │
                     │              │    │              │
                     │ ACTION:      │    │ ACTION:      │
                     │ SHOW_PRIMARY │    │ SHOW_BOTH    │
                     │              │    │              │
                     │ Display:     │    │ Display:     │
                     │ H4 only      │    │ H4 + D1      │
                     └──────────────┘    └──────────────┘
```

---

## State Transition Examples

### Example 1: ALIGNED Path

```
INPUT:
  H4: BULLISH 65%
  D1: BULLISH 70%

FLOW:
  1. Compare directions → SAME (both BULLISH)
  2. Calculate delta → |65 - 70| = 5%
  3. Check threshold → 5% ≤ 10% ✓
  4. State → ALIGNED

OUTPUT:
  {
    state: "ALIGNED",
    action: "SHOW_PRIMARY",
    primary: { H4: BULLISH 65% },
    message: "Multi-timeframe consensus"
  }

UI:
  ┌─────────────────────────────────┐
  │ ● Directional Assessment        │
  │   Multi-timeframe consensus     │
  │                                 │
  │ ┌─────────────────────────────┐ │
  │ │ H4 Assessment               │ │
  │ │ BULLISH    65%              │ │
  │ └─────────────────────────────┘ │
  └─────────────────────────────────┘
```

### Example 2: DIVERGENT Path

```
INPUT:
  H4: BULLISH 60%
  D1: BULLISH 75%

FLOW:
  1. Compare directions → SAME (both BULLISH)
  2. Calculate delta → |60 - 75| = 15%
  3. Check threshold → 15% > 10% ✓
  4. State → DIVERGENT

OUTPUT:
  {
    state: "DIVERGENT",
    action: "SHOW_BOTH",
    primary: { H4: BULLISH 60% },
    secondary: { D1: BULLISH 75% },
    message: "Timeframe-dependent scenarios"
  }

UI:
  ┌─────────────────────────────────┐
  │ ● Timeframe-Dependent Assessment│
  │   Timeframe-dependent scenarios │
  │                                 │
  │ ┌─────────────────────────────┐ │
  │ │ H4 Assessment               │ │
  │ │ BULLISH    60%              │ │
  │ └─────────────────────────────┘ │
  │                                 │
  │ ┌─────────────────────────────┐ │
  │ │ D1 Assessment               │ │
  │ │ BULLISH    75%              │ │
  │ └─────────────────────────────┘ │
  └─────────────────────────────────┘
```

### Example 3: CONTRADICTORY Path

```
INPUT:
  H4: BULLISH 70%
  D1: BEARISH 65%

FLOW:
  1. Compare directions → OPPOSITE
  2. State → CONTRADICTORY (skip delta calculation)

OUTPUT:
  {
    state: "CONTRADICTORY",
    action: "SUPPRESS",
    message: "Conflicting timeframe bias — no assessment issued"
  }

UI:
  ┌─────────────────────────────────┐
  │ ● Assessment Suppressed         │
  │   Conflicting timeframe bias —  │
  │   no assessment issued          │
  │                                 │
  │ [No assessments displayed]      │
  │                                 │
  │ Contradictory timeframe bias    │
  │ detected. No assessment can be  │
  │ issued.                         │
  └─────────────────────────────────┘
```

---

## Probability Delta Thresholds

```
Delta Range          State           Action
───────────────────────────────────────────────
0% - 10%          → ALIGNED       → SHOW_PRIMARY
11% - 19%         → DIVERGENT     → SHOW_BOTH
20%+              → DIVERGENT     → SHOW_BOTH
Opposite bias     → CONTRADICTORY → SUPPRESS
```

---

## No-Synthesis Guarantee

### What NEVER Happens:

```
❌ WRONG - Averaging:
   H4: 60%  D1: 80%  → Display: 70% (NEVER!)

❌ WRONG - Weighting:
   H4: 60%  D1: 80%  → Display: 68% (60*0.4 + 80*0.6) (NEVER!)

❌ WRONG - Synthesis:
   H4: BULLISH  D1: BEARISH  → Display: NEUTRAL (NEVER!)
```

### What ALWAYS Happens:

```
✅ RIGHT - Preserve:
   H4: 60%  D1: 80%  → Display: 60% AND 80% separately

✅ RIGHT - Suppress:
   H4: BULLISH  D1: BEARISH  → Display: NOTHING

✅ RIGHT - Explicit:
   H4: 65%  D1: 70%  → Display: 65% (primary only)
```

---

## Validation Checkpoints

```
┌─────────────────────────────────────────────────────┐
│ 1. Input Validation                                 │
│    ✓ Only H4 and D1 timeframes                      │
│    ✓ Direction is BULLISH, BEARISH, or NEUTRAL     │
│    ✓ Probability is 0-100                           │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ 2. Conflict Resolution                              │
│    ✓ State determined by rules                      │
│    ✓ Action matches state                           │
│    ✓ Original values preserved                      │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ 3. UI State Mapping                                 │
│    ✓ Assessment count matches action                │
│    ✓ Probabilities are original                     │
│    ✓ CONTRADICTORY never displays                   │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ 4. Synthesis Validation                             │
│    ✓ validateNoSynthesis() returns true             │
│    ✓ No averaged values detected                    │
│    ✓ No conflated data                              │
└─────────────────────────────────────────────────────┘
```

---

## Edge Cases Handled

| Case | H4 | D1 | Result | Reason |
|------|----|----|--------|--------|
| Exact match | BULLISH 75% | BULLISH 75% | ALIGNED | Delta = 0% |
| Boundary | BULLISH 60% | BULLISH 70% | ALIGNED | Delta = 10% (inclusive) |
| Just over | BULLISH 60% | BULLISH 71% | DIVERGENT | Delta = 11% |
| Large delta | BULLISH 50% | BULLISH 90% | DIVERGENT | Delta = 40% (still show both) |
| Both neutral | NEUTRAL 50% | NEUTRAL 55% | ALIGNED | Same direction |
| One neutral | BULLISH 70% | NEUTRAL 50% | CONTRADICTORY | Different bias |

---

## Code Path Mapping

```typescript
resolveMultiTimeframeConflict(input)
  │
  ├─→ determineConflictState(input)
  │     │
  │     ├─→ areOpposite(h4.dir, d1.dir)
  │     │     └─→ true  → return "CONTRADICTORY"
  │     │     └─→ false → continue
  │     │
  │     ├─→ calculate delta = |h4.prob - d1.prob|
  │     │
  │     ├─→ delta ≤ 10  → return "ALIGNED"
  │     └─→ delta > 10  → return "DIVERGENT"
  │
  └─→ switch(state)
        ├─→ ALIGNED       → { action: "SHOW_PRIMARY", primary: h4 }
        ├─→ DIVERGENT     → { action: "SHOW_BOTH", primary: h4, secondary: d1 }
        └─→ CONTRADICTORY → { action: "SUPPRESS" }
```

---

## Integration Flow

```
Client Request
     │
     ▼
API Endpoint (/api/aura-fx/signal)
     │
     ├─→ Process H4 candles → H4 assessment
     │
     ├─→ Process D1 candles → D1 assessment
     │
     ▼
resolveMultiTimeframeConflict({ h4, d1 })
     │
     ▼
ConflictResolution
     │
     ├─→ if SUPPRESS → return { data: null, message }
     │
     └─→ else → return { resolution }
              │
              ▼
         Client receives
              │
              ▼
    mapConflictToUIState(resolution)
              │
              ▼
         UIState
              │
              ▼
    <MultiTimeframeConflictDisplay />
```

---

**This flow ensures zero synthesis at every step.**
