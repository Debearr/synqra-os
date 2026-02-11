# Persistent Disclaimer System - Visual Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Assessment View              Signals Hub                    │
│  ┌────────────────┐           ┌────────────────┐           │
│  │ DisclaimerBanner│           │ CompactBanner  │           │
│  │ - Full display  │           │ - Compact      │           │
│  │ - Expandable    │           │ - Expandable   │           │
│  │ - Ack button    │           │ - Ack modal    │           │
│  └────────┬───────┘           └────────┬───────┘           │
│           │                             │                    │
│           └──────────┬──────────────────┘                    │
│                      │                                       │
│            ┌─────────▼─────────┐                            │
│            │ useDisclaimerState │                            │
│            │ React Hook         │                            │
│            └─────────┬─────────┘                            │
└──────────────────────┼──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                        API LAYER                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  POST /api/aura-fx/disclaimer/check                         │
│  - Check if acknowledgment required                         │
│  - Record view automatically                                │
│  - Return disclaimer state                                  │
│                                                              │
│  POST /api/aura-fx/disclaimer/acknowledge                   │
│  - Record acknowledgment                                    │
│  - Log trigger and timestamp                                │
│                                                              │
│            ┌─────────────────────┐                          │
│            │ DisclaimerService   │                          │
│            │ - Business logic    │                          │
│            │ - Supabase client   │                          │
│            └─────────┬───────────┘                          │
└──────────────────────┼──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      DATABASE LAYER                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Tables:                                                     │
│  ┌────────────────────────────────────────────────┐        │
│  │ disclaimer_versions                            │        │
│  │ - version, content, methodology                │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │ user_disclaimer_acknowledgments                │        │
│  │ - user_id, version, trigger, timestamp         │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │ user_assessment_views                          │        │
│  │ - user_id, assessment_type, viewed_at          │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Functions:                                                  │
│  - check_disclaimer_acknowledgment_required()               │
│  - record_assessment_view()                                 │
│  - record_disclaimer_acknowledgment()                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Trigger Logic Flow

```
User Views Assessment
        ↓
┌───────────────────────────────────────────────────────┐
│ STEP 1: Record View                                   │
│ INSERT INTO user_assessment_views                     │
│ (user_id, assessment_type, viewed_at)                 │
└───────────────────┬───────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────────────┐
│ STEP 2: Check Acknowledgment Required                 │
│ check_disclaimer_acknowledgment_required(user_id)     │
└───────────────────┬───────────────────────────────────┘
                    ↓
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│ Never        │        │ Has          │
│ Acknowledged │        │ Acknowledged │
└──────┬───────┘        └──────┬───────┘
       │                       │
       ▼                       ▼
┌──────────────┐        ┌──────────────────────────┐
│ TRIGGER:     │        │ CHECK 1: Version Changed?│
│ initial      │        │ last_version != current  │
│              │        └──────┬───────────────────┘
│ RESULT:      │               │
│ Required     │        ┌──────┴──────┐
└──────────────┘        │             │
                        YES           NO
                        │             │
                        ▼             ▼
                ┌──────────────┐  ┌──────────────────────┐
                │ TRIGGER:     │  │ CHECK 2: 90 Days?    │
                │ version_     │  │ days_since >= 90     │
                │ update       │  └──────┬───────────────┘
                │              │         │
                │ RESULT:      │  ┌──────┴──────┐
                │ Required     │  │             │
                └──────────────┘  YES           NO
                                  │             │
                                  ▼             ▼
                          ┌──────────────┐  ┌──────────────────────┐
                          │ TRIGGER:     │  │ CHECK 3: 10+ Views?  │
                          │ 90_day_      │  │ views_24h >= 10      │
                          │ expiry       │  └──────┬───────────────┘
                          │              │         │
                          │ RESULT:      │  ┌──────┴──────┐
                          │ Required     │  │             │
                          └──────────────┘  YES           NO
                                            │             │
                                            ▼             ▼
                                    ┌──────────────┐  ┌──────────────┐
                                    │ TRIGGER:     │  │ RESULT:      │
                                    │ 10_view_     │  │ Not Required │
                                    │ threshold    │  │              │
                                    │              │  │ Show         │
                                    │ RESULT:      │  │ Disclaimer   │
                                    │ Required     │  │ (no button)  │
                                    └──────────────┘  └──────────────┘
```

---

## UI State Transitions

### Assessment Detail View

```
┌─────────────────────────────────────────────────────────────┐
│ STATE 1: Loading                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Loading spinner]                                           │
│  Loading assessment...                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STATE 2: Loaded - No Acknowledgment Required                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ⚠️ Probabilistic market view — not a trade        │    │
│  │    instruction.                                     │    │
│  │    [▼ View full methodology and limitations]       │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  [Assessment Content]                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          ↓ (trigger condition met)
┌─────────────────────────────────────────────────────────────┐
│ STATE 3: Loaded - Acknowledgment Required                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ⚠️ Probabilistic market view — not a trade        │    │
│  │    instruction.                                     │    │
│  │    [▼ View full methodology and limitations]       │    │
│  │                                                     │    │
│  │ ┌─────────────────────────────────────────────┐   │    │
│  │ │ Acknowledgment Required                     │   │    │
│  │ │ It's been 90 days since your last...        │   │    │
│  │ │                     [I Acknowledge Button]  │   │    │
│  │ └─────────────────────────────────────────────┘   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  [Assessment Content]                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          ↓ (user clicks button)
┌─────────────────────────────────────────────────────────────┐
│ STATE 4: Acknowledging                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ⚠️ Probabilistic market view — not a trade        │    │
│  │    instruction.                                     │    │
│  │    [▼ View full methodology and limitations]       │    │
│  │                                                     │    │
│  │ ┌─────────────────────────────────────────────┐   │    │
│  │ │ Acknowledgment Required                     │   │    │
│  │ │ It's been 90 days since your last...        │   │    │
│  │ │                  [Acknowledging... (disabled)]   │    │
│  │ └─────────────────────────────────────────────┘   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  [Assessment Content]                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          ↓ (acknowledgment recorded)
┌─────────────────────────────────────────────────────────────┐
│ STATE 5: Acknowledged - Back to State 2                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ⚠️ Probabilistic market view — not a trade        │    │
│  │    instruction.                                     │    │
│  │    [▼ View full methodology and limitations]       │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  [Assessment Content]                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Signals Hub UI Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Signals Hub - Compact Disclaimer                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ⚠️ Probabilistic market view — not a trade        │    │
│  │    instruction. [Details ▼]                        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  [If acknowledgment required, show modal:]                  │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Acknowledgment Required                            │    │
│  │                                                     │    │
│  │ It's been 90 days since your last acknowledgment.  │    │
│  │ Please review and acknowledge again.               │    │
│  │                                                     │    │
│  │                           [I Acknowledge Button]   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Signal 1: EURUSD H4 BULLISH 65%                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Signal 2: GBPUSD D1 BEARISH 70%                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. User opens assessment
       ↓
┌──────────────────────────────────────────────┐
│ useDisclaimerState() Hook                    │
│ - Auto-check on mount                        │
│ - assessmentType: "aurafx_signal"           │
│ - userId: "user-123"                         │
└──────┬───────────────────────────────────────┘
       │
       │ 2. POST /api/aura-fx/disclaimer/check
       ↓
┌──────────────────────────────────────────────┐
│ API: Check Disclaimer                        │
│ - DisclaimerService.getDisclaimerState()    │
└──────┬───────────────────────────────────────┘
       │
       │ 3. Execute database functions
       ↓
┌──────────────────────────────────────────────┐
│ Database Operations                          │
│                                              │
│ A. record_assessment_view()                  │
│    INSERT INTO user_assessment_views         │
│                                              │
│ B. check_disclaimer_acknowledgment_required()│
│    - Get last acknowledgment                 │
│    - Check version                           │
│    - Check 90 days                           │
│    - Count views in 24h                      │
│    - Return result                           │
│                                              │
│ C. Get active disclaimer version             │
│    SELECT FROM disclaimer_versions           │
└──────┬───────────────────────────────────────┘
       │
       │ 4. Return disclaimer state
       ↓
┌──────────────────────────────────────────────┐
│ Response to Hook                             │
│ {                                            │
│   requiresAcknowledgment: true,              │
│   trigger: "90_day_expiry",                  │
│   version: "v1.0.0",                         │
│   content: "Probabilistic market view...",   │
│   methodologyContent: "[Full text]"          │
│ }                                            │
└──────┬───────────────────────────────────────┘
       │
       │ 5. Update component state
       ↓
┌──────────────────────────────────────────────┐
│ DisclaimerBanner Component                   │
│ - Show disclaimer                            │
│ - Show acknowledgment button                 │
└──────┬───────────────────────────────────────┘
       │
       │ 6. User clicks "I Acknowledge"
       ↓
┌──────────────────────────────────────────────┐
│ Hook: acknowledge()                          │
│ - POST /api/aura-fx/disclaimer/acknowledge   │
└──────┬───────────────────────────────────────┘
       │
       │ 7. Record acknowledgment
       ↓
┌──────────────────────────────────────────────┐
│ Database: record_disclaimer_acknowledgment() │
│ INSERT INTO user_disclaimer_acknowledgments  │
│ {                                            │
│   user_id: "user-123",                       │
│   disclaimer_version: "v1.0.0",              │
│   acknowledgment_trigger: "90_day_expiry",   │
│   acknowledged_at: NOW()                     │
│ }                                            │
└──────┬───────────────────────────────────────┘
       │
       │ 8. Return success
       ↓
┌──────────────────────────────────────────────┐
│ Update UI State                              │
│ - requiresAcknowledgment: false              │
│ - Hide acknowledgment button                 │
│ - Disclaimer remains visible                 │
└──────────────────────────────────────────────┘
```

---

## Trigger Timeline Examples

### Example 1: 90-Day Trigger

```
Day 0:  User acknowledges disclaimer
        ├─ acknowledged_at: 2026-01-27
        └─ Next trigger: 2026-04-27 (90 days)

Day 1-89: User views assessments
          ├─ Views recorded
          ├─ No acknowledgment required
          └─ Disclaimer visible (no button)

Day 90: User views assessment
        ├─ 90 days elapsed
        ├─ Acknowledgment required
        ├─ trigger: "90_day_expiry"
        └─ Disclaimer visible (with button)

Day 90: User acknowledges
        ├─ acknowledged_at: 2026-04-27
        ├─ Timer resets
        └─ Next trigger: 2026-07-26 (90 days)
```

### Example 2: 10+ Views Trigger

```
Hour 0:  User acknowledges disclaimer
         └─ acknowledged_at: 2026-01-27 10:00

Hour 1:  User views 5 assessments
         ├─ Views: 5
         └─ No trigger

Hour 2:  User views 5 more assessments
         ├─ Views: 10
         └─ No trigger (exactly 10)

Hour 3:  User views 1 more assessment
         ├─ Views: 11 in last 24h
         ├─ Acknowledgment required
         ├─ trigger: "10_view_threshold"
         └─ Disclaimer visible (with button)

Hour 3:  User acknowledges
         ├─ acknowledged_at: 2026-01-27 13:00
         ├─ Counter resets
         └─ Can view 10 more before next trigger
```

### Example 3: Version Update Trigger

```
2026-01-27: User acknowledges v1.0.0
            └─ acknowledged_at: 2026-01-27

2026-02-15: Admin activates v1.1.0
            ├─ New version becomes active
            └─ All users need to re-acknowledge

2026-02-15: User views assessment
            ├─ last_version: v1.0.0
            ├─ current_version: v1.1.0
            ├─ Versions don't match
            ├─ Acknowledgment required
            ├─ trigger: "version_update"
            └─ Disclaimer visible (with button)

2026-02-15: User acknowledges v1.1.0
            ├─ acknowledged_at: 2026-02-15
            ├─ disclaimer_version: v1.1.0
            └─ Next trigger: 90 days or 10+ views
```

---

## Integration Points Map

```
┌─────────────────────────────────────────────────────────────┐
│                    AURAFX ECOSYSTEM                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ Assessment Detail    │  │ Signals Hub          │        │
│  │ /studio/aurafx-      │  │ /studio/signals-hub  │        │
│  │  assessment          │  │                      │        │
│  │                      │  │                      │        │
│  │ [DisclaimerBanner]   │  │ [CompactDisclaimer]  │        │
│  └──────────┬───────────┘  └──────────┬───────────┘        │
│             │                          │                     │
│             └──────────┬───────────────┘                     │
│                        │                                     │
│  ┌─────────────────────▼────────────────────┐              │
│  │ Multi-Timeframe Assessment               │              │
│  │ /studio/multi-timeframe                  │              │
│  │                                           │              │
│  │ [DisclaimerBanner]                        │              │
│  └─────────────────────┬────────────────────┘              │
│                        │                                     │
│  ┌─────────────────────▼────────────────────┐              │
│  │ Assessment Calibration                   │              │
│  │ /studio/calibration                      │              │
│  │                                           │              │
│  │ [DisclaimerBanner]                        │              │
│  └──────────────────────────────────────────┘              │
│                                                              │
│  All views share:                                           │
│  - Same disclaimer service                                  │
│  - Same acknowledgment tracking                             │
│  - Same trigger logic                                       │
│  - Same database tables                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

**This visual documentation provides a complete understanding of the persistent disclaimer system architecture, data flow, and integration points.**
