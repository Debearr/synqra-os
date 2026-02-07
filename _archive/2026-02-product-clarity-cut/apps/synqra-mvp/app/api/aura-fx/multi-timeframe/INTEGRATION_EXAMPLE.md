# Integration Example: Multi-Timeframe Conflict Protocol

## API Integration

### Step 1: Import the conflict resolver

```typescript
import { resolveMultiTimeframeConflict } from "./multi-timeframe";
import type { MultiTimeframeInput } from "./multi-timeframe";
```

### Step 2: Modify signal route to accept multiple timeframes

```typescript
// app/api/aura-fx/signal/route.ts

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { symbol, h4Candles, d1Candles, tzOffsetMinutes } = body;

  // Validate both timeframes provided
  if (!h4Candles || !d1Candles) {
    return NextResponse.json(
      { error: "Both H4 and D1 candles required for multi-timeframe analysis" },
      { status: 400 }
    );
  }

  // Process H4 timeframe
  const h4Result = buildAuraFxContext({
    candles: h4Candles,
    tzOffsetMinutes: tzOffsetMinutes ?? 0,
  });

  const h4Signal = buildSignalPayload(h4Result, {
    symbol,
    timeframe: "H4",
  });

  // Process D1 timeframe
  const d1Result = buildAuraFxContext({
    candles: d1Candles,
    tzOffsetMinutes: tzOffsetMinutes ?? 0,
  });

  const d1Signal = buildSignalPayload(d1Result, {
    symbol,
    timeframe: "D1",
  });

  // Create multi-timeframe input
  const multiTimeframeInput: MultiTimeframeInput = {
    h4: {
      timeframe: "H4",
      direction: mapToDirectionalBias(h4Signal.direction),
      probability: h4Signal.confluenceScore, // Assuming this exists
    },
    d1: {
      timeframe: "D1",
      direction: mapToDirectionalBias(d1Signal.direction),
      probability: d1Signal.confluenceScore,
    },
  };

  // Resolve conflicts
  const resolution = resolveMultiTimeframeConflict(multiTimeframeInput);

  // Handle CONTRADICTORY state - suppress assessment
  if (resolution.action === "SUPPRESS") {
    return NextResponse.json({
      success: true,
      data: null,
      message: resolution.displayMessage,
      meta: {
        conflictState: resolution.state,
        h4Direction: multiTimeframeInput.h4.direction,
        d1Direction: multiTimeframeInput.d1.direction,
      },
    });
  }

  // Handle ALIGNED or DIVERGENT - return resolution
  return NextResponse.json({
    success: true,
    resolution,
    meta: {
      conflictState: resolution.state,
    },
  });
}

// Helper function to map signal direction to directional bias
function mapToDirectionalBias(direction: string): DirectionalBias {
  if (direction === "LONG" || direction === "BULLISH") return "BULLISH";
  if (direction === "SHORT" || direction === "BEARISH") return "BEARISH";
  return "NEUTRAL";
}
```

## Frontend Integration

### Step 3: Create a page component

```typescript
// app/studio/multi-timeframe/page.tsx

"use client";

import { useState } from "react";
import { MultiTimeframeConflictDisplay } from "@/components/studio/MultiTimeframeConflictDisplay";
import { mapConflictToUIState } from "@/app/api/aura-fx/multi-timeframe";
import type { ConflictResolution } from "@/app/api/aura-fx/multi-timeframe";

export default function MultiTimeframeAnalysisPage() {
  const [resolution, setResolution] = useState<ConflictResolution | null>(null);

  async function analyzeMultiTimeframe() {
    const response = await fetch("/api/aura-fx/signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: "EURUSD",
        h4Candles: [...], // H4 candle data
        d1Candles: [...], // D1 candle data
      }),
    });

    const data = await response.json();
    
    if (data.resolution) {
      setResolution(data.resolution);
    }
  }

  if (!resolution) {
    return (
      <div>
        <button onClick={analyzeMultiTimeframe}>
          Analyze Multi-Timeframe
        </button>
      </div>
    );
  }

  const uiState = mapConflictToUIState(resolution);

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">
        Multi-Timeframe Conflict Analysis
      </h1>
      <MultiTimeframeConflictDisplay uiState={uiState} />
    </div>
  );
}
```

## Request/Response Examples

### Example 1: ALIGNED State

**Request:**
```json
{
  "symbol": "EURUSD",
  "h4Candles": [...],
  "d1Candles": [...]
}
```

**Response:**
```json
{
  "success": true,
  "resolution": {
    "state": "ALIGNED",
    "action": "SHOW_PRIMARY",
    "primary": {
      "timeframe": "H4",
      "direction": "BULLISH",
      "probability": 65
    },
    "displayMessage": "Multi-timeframe consensus"
  },
  "meta": {
    "conflictState": "ALIGNED"
  }
}
```

### Example 2: DIVERGENT State

**Request:**
```json
{
  "symbol": "GBPUSD",
  "h4Candles": [...],
  "d1Candles": [...]
}
```

**Response:**
```json
{
  "success": true,
  "resolution": {
    "state": "DIVERGENT",
    "action": "SHOW_BOTH",
    "primary": {
      "timeframe": "H4",
      "direction": "BULLISH",
      "probability": 60
    },
    "secondary": {
      "timeframe": "D1",
      "direction": "BULLISH",
      "probability": 75
    },
    "displayMessage": "Timeframe-dependent scenarios"
  },
  "meta": {
    "conflictState": "DIVERGENT"
  }
}
```

### Example 3: CONTRADICTORY State

**Request:**
```json
{
  "symbol": "USDJPY",
  "h4Candles": [...],
  "d1Candles": [...]
}
```

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Conflicting timeframe bias — no assessment issued",
  "meta": {
    "conflictState": "CONTRADICTORY",
    "h4Direction": "BULLISH",
    "d1Direction": "BEARISH"
  }
}
```

## Validation Middleware

Add validation to ensure no synthesis occurs:

```typescript
import { validateNoSynthesis } from "@/app/api/aura-fx/multi-timeframe";

// After creating UI state
const uiState = mapConflictToUIState(resolution);

if (!validateNoSynthesis(resolution, uiState)) {
  throw new Error("CRITICAL: Synthesis detected in multi-timeframe resolution");
}
```

## Testing Integration

```typescript
import { runAllTests } from "@/app/api/aura-fx/multi-timeframe/conflict-resolver.test";

// In development/test environment
const testResults = runAllTests();

if (!testResults.allPassed) {
  console.error("Multi-timeframe tests failed:", testResults.results);
}
```

## Key Integration Points

1. **API Layer**: Modify signal route to accept both H4 and D1 candles
2. **Conflict Resolution**: Call `resolveMultiTimeframeConflict()` after processing both timeframes
3. **Response Handling**: Return appropriate response based on conflict state
4. **UI Display**: Use `MultiTimeframeConflictDisplay` component with mapped UI state
5. **Validation**: Always validate no synthesis occurred before sending to client

## Migration Path

If you have existing single-timeframe code:

1. Keep existing single-timeframe endpoint at `/api/aura-fx/signal`
2. Create new multi-timeframe endpoint at `/api/aura-fx/multi-timeframe-signal`
3. Gradually migrate clients to new endpoint
4. Deprecate old endpoint after full migration

This ensures backward compatibility during transition.
