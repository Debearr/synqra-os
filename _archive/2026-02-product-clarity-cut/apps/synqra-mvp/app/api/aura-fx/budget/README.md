## Budget Protection & Graduated Throttling System

## Overview

Replaces binary API circuit breaker with graduated throttling system that provides graceful degradation based on budget usage.

---

## Throttling Thresholds

| Usage % | State | Behavior | Cache TTL | User Impact |
|---------|-------|----------|-----------|-------------|
| 0-69% | **NORMAL** | Full operation | H4: 4h, D1: 24h | None |
| 70-79% | **ALERT** | Admin alert only | H4: 4h, D1: 24h | None |
| 80-89% | **CACHE_EXTENDED** | Extended cache TTL | H4: 8h, D1: 48h | May see cached data |
| 90-94% | **D1_DISABLED** | H4 only, D1 disabled | H4: 8h, D1: 48h | D1 unavailable |
| 95-99% | **STALE_ONLY** | Show stale data only | H4: 8h, D1: 48h | Cached data with timestamp |
| 100%+ | **HARD_STOP** | Complete pause | H4: 8h, D1: 48h | Service limited message |

---

## State Machine

```
NORMAL (0-69%)
    ↓ 70%
ALERT (70-79%) → Admin notified
    ↓ 80%
CACHE_EXTENDED (80-89%) → TTL doubled
    ↓ 90%
D1_DISABLED (90-94%) → Only H4 available
    ↓ 95%
STALE_ONLY (95-99%) → Cached data with timestamp
    ↓ 100%
HARD_STOP (100%+) → Service paused
```

---

## Core Principles

### ✅ Never Publish Mixed-Freshness Assessments
- All data in a response has same timestamp
- Either fresh or stale, never mixed
- Stale data always includes last-updated timestamp

### ✅ Always Show Timestamps
- Every cached/stale response includes `lastUpdated`
- UI displays data age prominently
- Users always know data freshness

### ✅ Deterministic & Testable
- Pure functions with no side effects
- Same input always produces same output
- Comprehensive test suite (40+ tests)

---

## Architecture

### Files

```
app/api/aura-fx/budget/
├── types.ts                          # Type definitions
├── throttling-state-machine.ts       # Pure state machine logic
├── budget-service.ts                 # Service layer with DB
├── throttling-state-machine.test.ts  # Test suite
└── README.md                         # This file

supabase/migrations/
└── 20260127_budget_tracking.sql      # Database schema

components/aura-fx/
└── ThrottlingStatusBanner.tsx        # User-facing UI

components/admin/
└── BudgetAlertDashboard.tsx          # Admin dashboard
```

### State Machine Functions

**Pure Functions** (no side effects):
- `determineThrottlingState(percentage)` - Map % to state
- `getTimeframeAvailability(state)` - Get H4/D1 availability
- `getCacheTTL(state)` - Get cache TTL config
- `allowNewAssessments(state)` - Check if new requests allowed
- `shouldShowStaleData(state)` - Check if stale data mode
- `evaluateAssessmentRequest()` - Evaluate request against policy

**Service Layer** (with DB):
- `BudgetService.getCurrentBudgetUsage()` - Get current usage
- `BudgetService.getThrottlingState()` - Get current state
- `BudgetService.evaluateRequest()` - Evaluate request
- `BudgetService.recordUsage()` - Record API cost
- `BudgetService.checkAndTriggerAlert()` - Check for alerts

---

## Usage Examples

### Check Throttling State

```typescript
import { BudgetService } from "@/app/api/aura-fx/budget/budget-service";

const service = new BudgetService();
const state = await service.getThrottlingState();

console.log(state.state); // "CACHE_EXTENDED"
console.log(state.percentage); // 85.3
console.log(state.userMessage); // "Assessments may use cached data..."
```

### Evaluate Assessment Request

```typescript
const result = await service.evaluateRequest(
  "H4",           // timeframe
  true,           // has cached data
  7200            // cache age in seconds (2 hours)
);

if (result.allowed) {
  if (result.useCache) {
    // Serve from cache
    console.log(`Using cache (TTL: ${result.cacheTTL}s)`);
  } else {
    // Make new API request
    console.log("Making new assessment");
  }
} else {
  // Request denied
  console.log(`Denied: ${result.reason}`);
}
```

### Record Budget Usage

```typescript
// After making API request
await service.recordUsage(0.5); // Cost in dollars
```

### Check for Alerts

```typescript
const alert = await service.checkAndTriggerAlert();

if (alert) {
  console.log(`Alert triggered: ${alert.message}`);
  console.log(`Severity: ${alert.severity}`);
  // Send notification to admins
}
```

---

## UI Components

### User-Facing Status Banner

```tsx
import { ThrottlingStatusBanner } from "@/components/aura-fx/ThrottlingStatusBanner";

<ThrottlingStatusBanner
  state={throttlingState.state}
  message={throttlingState.userMessage}
  lastUpdated={throttlingState.lastUpdated}
  showTimestamp={true}
/>
```

### Stale Data Indicator

```tsx
import { StaleDataIndicator } from "@/components/aura-fx/ThrottlingStatusBanner";

<StaleDataIndicator
  lastUpdated="2026-01-27T10:00:00Z"
  ageInHours={6.5}
/>
```

### Hard Stop Message

```tsx
import { HardStopMessage } from "@/components/aura-fx/ThrottlingStatusBanner";

{throttlingState.state === "HARD_STOP" && <HardStopMessage />}
```

### Admin Dashboard

```tsx
import { BudgetAlertDashboard } from "@/components/admin/BudgetAlertDashboard";

<BudgetAlertDashboard
  autoRefresh={true}
  refreshInterval={60000} // 1 minute
/>
```

---

## Admin Alerts

### Alert Triggers

Alerts are triggered when moving to a **more restrictive** state:

```
NORMAL → ALERT           ✅ Alert
ALERT → CACHE_EXTENDED   ✅ Alert
CACHE_EXTENDED → D1_DISABLED ✅ Alert
D1_DISABLED → STALE_ONLY ✅ Alert
STALE_ONLY → HARD_STOP   ✅ Alert

HARD_STOP → STALE_ONLY   ❌ No alert (less restrictive)
```

### Alert Severity

- **info**: NORMAL state
- **warning**: ALERT, CACHE_EXTENDED
- **critical**: D1_DISABLED, STALE_ONLY, HARD_STOP

### Alert Management

```typescript
// Get unacknowledged alerts
const alerts = await service.getUnacknowledgedAlerts();

// Acknowledge alert
await service.acknowledgeAlert(alertId);
```

---

## Database Schema

### Tables

**`budget_usage`** - Current period tracking
```sql
- used: numeric
- limit: numeric
- period_start: timestamptz
- period_end: timestamptz
- last_updated: timestamptz
```

**`budget_tracking`** - Historical snapshots
```sql
- timestamp: timestamptz
- usage_percentage: numeric
- throttling_state: throttling_state enum
- requests_allowed: integer
- requests_throttled: integer
- cache_hits: integer
- cache_misses: integer
```

**`admin_alerts`** - Alert history
```sql
- threshold: numeric
- state: throttling_state enum
- message: text
- severity: text ('info', 'warning', 'critical')
- triggered_at: timestamptz
- acknowledged: boolean
```

**`assessment_cache`** - Cached assessments
```sql
- cache_key: text (unique)
- timeframe: text ('H4', 'D1')
- symbol: text
- data: jsonb
- created_at: timestamptz
- expires_at: timestamptz
```

### Functions

- `increment_budget_usage(cost)` - Add to usage
- `get_current_throttling_state()` - Get state from DB
- `get_cached_assessment(key, max_age)` - Retrieve cache
- `store_cached_assessment(...)` - Store cache
- `cleanup_expired_cache()` - Remove old entries

---

## Testing

### Run Tests

```bash
npm test throttling-state-machine.test.ts
```

### Test Coverage

- ✅ Threshold boundaries (70%, 80%, 90%, 95%, 100%)
- ✅ Timeframe availability per state
- ✅ Cache TTL extension (4h→8h, 24h→48h)
- ✅ New assessment allowance
- ✅ Stale data serving
- ✅ Request evaluation logic
- ✅ Alert triggering
- ✅ Deterministic behavior
- ✅ End-to-end scenarios

### Example Tests

```typescript
test("80%: Cache TTL extended", () => {
  const state = determineThrottlingState(80);
  expect(state).toBe("CACHE_EXTENDED");
  
  const ttl = getCacheTTL(state);
  expect(ttl.h4).toBe(8 * 60 * 60); // 8 hours
  expect(ttl.d1).toBe(48 * 60 * 60); // 48 hours
});

test("90%: D1 disabled, H4 available", () => {
  const state = determineThrottlingState(90);
  const availability = getTimeframeAvailability(state);
  
  expect(availability.h4).toBe(true);
  expect(availability.d1).toBe(false);
});

test("Never mixed-freshness", () => {
  const result = evaluateAssessmentRequest("H4", "STALE_ONLY", true);
  
  expect(result.useCache).toBe(true);
  expect(result.staleDataTimestamp).toBeDefined();
});
```

---

## Integration Guide

### Step 1: Wrap Assessment Endpoint

```typescript
// app/api/aura-fx/signal/route.ts
import { BudgetService } from "../budget/budget-service";

export async function POST(req: NextRequest) {
  const service = new BudgetService();
  
  // Check throttling state
  const result = await service.evaluateRequest(
    "H4",
    hasCachedData,
    cacheAge
  );
  
  if (!result.allowed) {
    return NextResponse.json({
      error: result.reason,
      throttlingState: result.throttlingState,
    }, { status: 503 });
  }
  
  if (result.useCache) {
    // Serve from cache
    return NextResponse.json({
      data: cachedData,
      stale: true,
      lastUpdated: result.staleDataTimestamp,
    });
  }
  
  // Make new assessment
  const assessment = await makeAssessment();
  
  // Record usage
  await service.recordUsage(apiCost);
  
  // Check for alerts
  await service.checkAndTriggerAlert();
  
  return NextResponse.json(assessment);
}
```

### Step 2: Add UI Components

```tsx
// Assessment page
const service = new BudgetService();
const state = await service.getThrottlingState();

<ThrottlingStatusBanner
  state={state.state}
  message={state.userMessage}
  lastUpdated={state.lastUpdated}
/>
```

### Step 3: Add Admin Dashboard

```tsx
// Admin page
<BudgetAlertDashboard autoRefresh={true} />
```

---

## Monitoring

### Key Metrics

```sql
-- Current state
SELECT * FROM get_current_throttling_state();

-- Recent tracking
SELECT * FROM budget_tracking
ORDER BY timestamp DESC
LIMIT 100;

-- Unacknowledged alerts
SELECT * FROM admin_alerts
WHERE acknowledged = false
ORDER BY triggered_at DESC;

-- Cache hit rate
SELECT 
  SUM(cache_hits) as hits,
  SUM(cache_misses) as misses,
  ROUND(SUM(cache_hits)::numeric / NULLIF(SUM(cache_hits + cache_misses), 0) * 100, 2) as hit_rate
FROM budget_tracking
WHERE timestamp > NOW() - INTERVAL '24 hours';
```

### Alerts

Set up monitoring for:
- Budget usage > 70% (warning)
- Budget usage > 90% (critical)
- State changes (any)
- Alert acknowledgment delays > 1 hour

---

## Maintenance

### Reset Budget Period

```sql
-- Create new period (monthly)
INSERT INTO budget_usage (used, limit, period_start, period_end)
VALUES (
  0,
  100,
  date_trunc('month', now()),
  date_trunc('month', now()) + interval '1 month'
);
```

### Cleanup Old Data

```sql
-- Remove old tracking records (keep 90 days)
DELETE FROM budget_tracking
WHERE timestamp < NOW() - INTERVAL '90 days';

-- Remove old alerts (keep 30 days)
DELETE FROM admin_alerts
WHERE triggered_at < NOW() - INTERVAL '30 days'
  AND acknowledged = true;

-- Cleanup expired cache
SELECT cleanup_expired_cache();
```

### Update Budget Limit

```sql
UPDATE budget_usage
SET limit = 200
WHERE period_start <= NOW()
  AND period_end > NOW();
```

---

## Troubleshooting

### Issue: Stuck in HARD_STOP

**Check**: Current usage percentage
```sql
SELECT * FROM budget_usage ORDER BY period_start DESC LIMIT 1;
```

**Solution**: If period ended, create new period or increase limit

### Issue: Cache not being used

**Check**: Cache entries and TTL
```sql
SELECT cache_key, timeframe, created_at, expires_at
FROM assessment_cache
ORDER BY created_at DESC;
```

**Solution**: Verify cache storage and TTL logic

### Issue: Alerts not triggering

**Check**: State transitions
```sql
SELECT throttling_state, timestamp
FROM budget_tracking
ORDER BY timestamp DESC
LIMIT 10;
```

**Solution**: Verify `shouldTriggerAlert()` logic

---

## Migration from Binary Circuit Breaker

### Before (Binary)
```typescript
if (budgetExceeded) {
  return { error: "Service unavailable" };
}
return makeRequest();
```

### After (Graduated)
```typescript
const result = await service.evaluateRequest("H4", hasCached, cacheAge);

if (!result.allowed) {
  return { error: result.reason, state: result.throttlingState };
}

if (result.useCache) {
  return { data: cached, stale: true, lastUpdated: timestamp };
}

return makeRequest();
```

### Benefits
- Graceful degradation
- Better user experience
- Admin visibility
- Deterministic behavior
- Testable logic

---

**Implementation Complete** ✅
