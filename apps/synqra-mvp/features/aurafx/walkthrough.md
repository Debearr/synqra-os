# AuraFX Implementation Plan

## 1. Component Tree

The AuraFX module (`apps/synqra-mvp/features/aurafx`) is structured to enforce strictly layered visualization without transactional semantics.

```text
features/aurafx/
├── components/
│   ├── AuraFXContainer.tsx       # Composition Root (Z-Index Orchestrator)
│   ├── ProbabilityCloud.tsx      # SVG-based, Opacity-driven visualization
│   ├── NowAnchor.tsx             # Temporal boundary (Hard separation)
│   ├── LogicTraceRibbon.tsx      # Data provenance & reasoning lineage
│   └── ShareSafeWatermark.tsx    # Attribution & Time-bound safety
├── hooks/
│   └── useAuraSignal.ts          # Consumes simulation/real data
├── utils/
│   └── visual-mappings.ts        # Strictly non-financial scaler logic
└── index.ts                      # Public API
```

### Layering Architecture (Z-Index)

- **Level 0 (Base)**: `ShareSafeWatermark` (Immutable context)
- **Level 10**: `LogicTraceRibbon` (Reasoning foundation)
- **Level 20**: `ProbabilityCloud` (Data visualization)
- **Level 30 (Top)**: `NowAnchor` (Temporal reference, overlay)

---

## 2. Data → Visual Mapping Logic

### ProbabilityCloud

*Strictly avoiding candlestick/price-action metaphors.*

- **Input**: `signalStrength` (0.0 - 1.0), `distributionSkew` (-1.0 to 1.0), `volatility` (0.0 - 1.0).
- **Visual Output**:
  - **Shape**: SVG Ellipses/Paths (Never boolean bars).
  - **Opacity**: Directly mapped to `signalStrength` (0.1 = ghost, 0.9 = solid).
  - **Asymmetry**: `distributionSkew` warps the shape metrics, not color.
  - **Color Palette**:
    - **Neutral**: Synqra Slate/Glass.
    - **Active**: Brand Gold/Teal (No Red/Green).

### NowAnchor

*Hard boundary between fixed history and fluid future.*

- **Visuals**: Vertical, glowing hairline.
- **Behavior**:
  - **Left of Anchor**: 100% Solid, High Contrast (Crystallized).
  - **Right of Anchor**: 50-80% Opacity, Gaussian Blur (Uncertain/Fluid).
- **Hard Constraint**: Future visuals MUST visibly degrade in fidelity compared to past visuals.

### LogicTraceRibbon

*Visualizing the "Why", not the "What".*

- **Purpose**: Connects the `ProbabilityCloud` to its data sources.
- **Visuals**: Bezier curves linking data nodes to the cloud.
- **Interaction**: Hovering a ribbon segment reveals the *type* of logic used (e.g., "Macro Correlation"), never a "Buy" signal.

---

## 3. Failure States & Edge Cases

The system defaults to "Silence" rather than "Error".

| State | Visual Behavior |
| :--- | :--- |
| **NO_DATA** | `ProbabilityCloud` opacity = 0. `NowAnchor` pulses slowly in "Seeking" mode. |
| **STALE_DATA** | `ShareSafeWatermark` flashes "STALE" warning. Entire container desaturates by 50%. |
| **DISCONNECTED** | Watermark expands to fill view with "OFFLINE" glyph pattern. |

---

## 4. Accessibility Considerations

- **Semantic Role**: `role="figure"` with `aria-label="Market Intelligence Visualization"`.
- **Screen Readers**:
  - "Probability Cloud indicating high confidence skew."
  - "Time anchor at [Current Time]."
- **Reduced Motion**: All pulsing/flowing animations respect `prefers-reduced-motion`.
- **Contrast**: Text elements in `ShareSafeWatermark` meet WCAG AA standards against typical dark backgrounds.

---

## 5. Export / Share Safety Guarantees

*Prevention of misuse as trading advice.*

### ShareSafeWatermark + ExpiryStamp

1. **Attribution**: Every render includes the user's non-identifiable handle/hash.
2. **Time-Bound**:
   - Renders include `ExpiryStamp` (Timestamp + fixed validity window).
   - "Generated at [Time] — Valid for reasoning until [Time + 15m]".
3. **Capture Prevention**:
   - CSS `print` media queries force a full-screen "NON-TRANSACTIONAL" overlay.
   - Background repeat pattern ensures no crop can exclude the disclaimer.

---

**Locked Constraints Checklist:**

- [x] No Candlesticks
- [x] No Price Targets
- [x] No Buy/Sell Semantics
- [x] No Red/Green Indicators
- [x] Future Visually Degrades
