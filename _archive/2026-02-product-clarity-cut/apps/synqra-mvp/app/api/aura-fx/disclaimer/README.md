# AuraFX Persistent Disclaimer System

## Overview

A comprehensive disclaimer acknowledgment system that ensures users see and acknowledge disclaimers on every AuraFX assessment view and Signals Hub, with automatic re-acknowledgment triggers.

---

## Core Requirements

### ✅ Persistent Display
- Disclaimer visible on **EVERY** assessment view
- Not just at signup - always present
- Cannot be permanently dismissed

### ✅ Disclaimer Language
**Primary Text:**
> "Probabilistic market view — not a trade instruction."

**Expandable:** Full methodology and limitations

### ✅ Forced Re-Acknowledgment Triggers

1. **90-Day Expiry**: Every 90 days from last acknowledgment
2. **10+ Views in 24 Hours**: After viewing 10+ assessments within 24 hours
3. **Version Update**: When disclaimer content is updated

### ✅ Logging
- Acknowledgment timestamp stored
- Disclaimer version tracked
- Trigger reason recorded

### ✅ Non-Blocking
- Does not prevent access to view
- Requires acknowledgment to continue using system
- Graceful degradation if service fails

---

## Architecture

### Database Schema

```sql
-- Disclaimer versions (content management)
disclaimer_versions
  - id: uuid
  - version: text (unique)
  - content: text (short disclaimer)
  - methodology_content: text (full methodology)
  - effective_date: timestamptz
  - is_active: boolean

-- User acknowledgments (tracking)
user_disclaimer_acknowledgments
  - id: uuid
  - user_id: uuid
  - disclaimer_version: text
  - acknowledged_at: timestamptz
  - acknowledgment_trigger: text
    ('initial', '90_day_expiry', '10_view_threshold', 'version_update')

-- Assessment views (10+ views tracking)
user_assessment_views
  - id: uuid
  - user_id: uuid
  - assessment_type: text
  - viewed_at: timestamptz
```

### Database Functions

1. **`check_disclaimer_acknowledgment_required(user_id)`**
   - Returns: `{ required, reason, last_acknowledgment, current_version }`
   - Checks all trigger conditions

2. **`record_assessment_view(user_id, assessment_type)`**
   - Records view for 10+ threshold tracking

3. **`record_disclaimer_acknowledgment(user_id, version, trigger)`**
   - Logs acknowledgment with timestamp and trigger

---

## API Endpoints

### POST `/api/aura-fx/disclaimer/check`

Check if user needs to acknowledge disclaimer.

**Request:**
```json
{
  "userId": "uuid",
  "assessmentType": "aurafx_signal"
}
```

**Response:**
```json
{
  "requiresAcknowledgment": true,
  "trigger": "90_day_expiry",
  "version": "v1.0.0",
  "content": "Probabilistic market view — not a trade instruction.",
  "methodologyContent": "[Full methodology text]",
  "triggerMessage": "It's been 90 days since your last acknowledgment...",
  "lastAcknowledgment": "2025-10-27T10:00:00Z"
}
```

### POST `/api/aura-fx/disclaimer/acknowledge`

Record user acknowledgment.

**Request:**
```json
{
  "userId": "uuid",
  "version": "v1.0.0",
  "trigger": "90_day_expiry"
}
```

**Response:**
```json
{
  "success": true,
  "acknowledgmentId": "uuid",
  "acknowledgedAt": "2026-01-27T10:00:00Z"
}
```

---

## React Components

### `<DisclaimerBanner />`

Full disclaimer for assessment detail views.

**Features:**
- Always visible inline banner
- Expandable methodology section
- Acknowledgment button when required
- Loading and error states

**Usage:**
```tsx
import { DisclaimerBanner } from "@/components/aura-fx/DisclaimerBanner";
import { useDisclaimerState } from "@/hooks/useDisclaimerState";

const disclaimer = useDisclaimerState({
  assessmentType: "aurafx_signal",
  userId: user?.id,
});

<DisclaimerBanner
  content={disclaimer.content}
  methodologyContent={disclaimer.methodologyContent}
  requiresAcknowledgment={disclaimer.requiresAcknowledgment}
  triggerMessage={disclaimer.triggerMessage}
  onAcknowledge={disclaimer.acknowledge}
  isAcknowledging={disclaimer.isAcknowledging}
/>
```

### `<CompactDisclaimerBanner />`

Compact version for list views (Signals Hub).

**Features:**
- Less prominent but always visible
- Expandable on click
- No acknowledgment button (shown separately)

**Usage:**
```tsx
import { CompactDisclaimerBanner } from "@/components/aura-fx/DisclaimerBanner";

<CompactDisclaimerBanner
  content={disclaimer.content}
  methodologyContent={disclaimer.methodologyContent}
/>
```

---

## React Hook

### `useDisclaimerState()`

Manages disclaimer state and acknowledgment flow.

**Parameters:**
```typescript
{
  assessmentType: "aurafx_signal" | "multi_timeframe" | "signals_hub",
  userId?: string,
  autoCheck?: boolean  // Default: true
}
```

**Returns:**
```typescript
{
  isLoading: boolean,
  requiresAcknowledgment: boolean,
  trigger: AcknowledgmentTrigger | null,
  version: string,
  content: string,
  methodologyContent: string,
  triggerMessage: string,
  error: string | null,
  isAcknowledging: boolean,
  acknowledge: () => Promise<void>,
  recheckState: () => Promise<void>
}
```

---

## UI Placement Locations

### 1. Assessment Detail View
**Location:** Top of page, below header, above assessment content

**Component:** `<DisclaimerBanner />`

**Behavior:**
- Full-width banner
- Always visible
- Expandable methodology
- Acknowledgment button when required

**Example:**
```
┌─────────────────────────────────────────────┐
│ Header / Navigation                         │
├─────────────────────────────────────────────┤
│ ⚠️ Probabilistic market view — not a trade │
│    instruction.                             │
│    [▼ View full methodology and limitations]│
│                                             │
│ [Acknowledgment Required section if needed] │
├─────────────────────────────────────────────┤
│ Assessment Content                          │
│ - Multi-timeframe analysis                  │
│ - Directional bias                          │
│ - Probability estimates                     │
└─────────────────────────────────────────────┘
```

### 2. Signals Hub (List View)
**Location:** Top of signals list, below header

**Component:** `<CompactDisclaimerBanner />`

**Behavior:**
- Compact inline banner
- Expandable on demand
- Separate acknowledgment modal if required

**Example:**
```
┌─────────────────────────────────────────────┐
│ Signals Hub Header                          │
├─────────────────────────────────────────────┤
│ ⚠️ Probabilistic market view — not a trade │
│    instruction. [Details ▼]                 │
├─────────────────────────────────────────────┤
│ [Acknowledgment Modal if required]          │
├─────────────────────────────────────────────┤
│ Signal 1: EURUSD H4 BULLISH 65%            │
│ Signal 2: GBPUSD D1 BEARISH 70%            │
│ Signal 3: USDJPY H4 DIVERGENT              │
└─────────────────────────────────────────────┘
```

### 3. Multi-Timeframe Assessment
**Location:** Top of conflict resolution display

**Component:** `<DisclaimerBanner />`

**Behavior:** Same as Assessment Detail View

### 4. Assessment Calibration View
**Location:** Above calibration calculator

**Component:** `<DisclaimerBanner />`

**Behavior:** Same as Assessment Detail View

---

## Re-Acknowledgment Logic

### Trigger 1: 90-Day Expiry

```typescript
// Checked on every view
const daysSinceAck = now - lastAcknowledgment;
if (daysSinceAck >= 90) {
  requireAcknowledgment = true;
  trigger = "90_day_expiry";
}
```

**Message:**
> "It's been 90 days since your last acknowledgment. Please review and acknowledge again."

### Trigger 2: 10+ Views in 24 Hours

```typescript
// Counted since last acknowledgment
const viewsLast24h = countViewsSince(lastAcknowledgment, 24_hours);
if (viewsLast24h >= 10) {
  requireAcknowledgment = true;
  trigger = "10_view_threshold";
}
```

**Message:**
> "You've viewed 10+ assessments in the last 24 hours. Please re-acknowledge the disclaimer."

### Trigger 3: Version Update

```typescript
// Checked on every view
if (lastAcknowledgedVersion !== currentVersion) {
  requireAcknowledgment = true;
  trigger = "version_update";
}
```

**Message:**
> "The disclaimer has been updated. Please review and acknowledge the new version."

---

## Acknowledgment Flow

```
User Views Assessment
        ↓
Record View (for 10+ tracking)
        ↓
Check Acknowledgment Required
        ↓
    ┌───┴───┐
    NO      YES
    ↓       ↓
Show       Show Disclaimer
Disclaimer  + Acknowledgment Button
(collapsed)     ↓
            User Clicks "I Acknowledge"
                ↓
            Record Acknowledgment
                ↓
            Update UI State
                ↓
            Hide Acknowledgment Button
```

---

## Data Schema for Logging

### Acknowledgment Record

```typescript
{
  id: "uuid",
  user_id: "uuid",
  disclaimer_version: "v1.0.0",
  acknowledged_at: "2026-01-27T10:00:00Z",
  acknowledgment_trigger: "90_day_expiry",
  created_at: "2026-01-27T10:00:00Z"
}
```

### Assessment View Record

```typescript
{
  id: "uuid",
  user_id: "uuid",
  assessment_type: "aurafx_signal",
  viewed_at: "2026-01-27T10:00:00Z",
  created_at: "2026-01-27T10:00:00Z"
}
```

### Disclaimer Version Record

```typescript
{
  id: "uuid",
  version: "v1.0.0",
  content: "Probabilistic market view — not a trade instruction.",
  methodology_content: "[Full methodology text]",
  effective_date: "2026-01-01T00:00:00Z",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z"
}
```

---

## Signals Hub Behavior Mirror

The Signals Hub **exactly mirrors** the assessment view behavior:

### ✅ Same Triggers
- 90-day expiry
- 10+ views in 24 hours
- Version updates

### ✅ Same Logging
- Views recorded with `assessment_type: "signals_hub"`
- Acknowledgments tracked identically

### ✅ Same Disclaimer Content
- Uses same version from database
- Same methodology content

### ✅ Different UI Presentation
- Compact banner in list view
- Separate acknowledgment modal
- Less visual prominence (but still always visible)

---

## Legal Copy Guidelines

### ⚠️ DO NOT IMPROVISE

All disclaimer text must be approved by legal team.

### Placeholder Markers

Use these markers in code:

```typescript
// ✅ CORRECT
const content = "[PLACEHOLDER: Legal disclaimer text]";

// ❌ WRONG
const content = "This is not financial advice..."; // Don't make up legal copy
```

### Current Placeholders

1. **Short Disclaimer**: 
   - Current: "Probabilistic market view — not a trade instruction."
   - Status: ✅ Approved

2. **Full Methodology**:
   - Current: `[PLACEHOLDER: Full methodology and limitations content...]`
   - Status: ⚠️ Awaiting legal review

---

## Testing Scenarios

### Test 1: Initial Acknowledgment
1. New user views assessment
2. Disclaimer shown with "initial" trigger
3. User acknowledges
4. Disclaimer remains visible but no acknowledgment button

### Test 2: 90-Day Expiry
1. Set last acknowledgment to 91 days ago
2. User views assessment
3. Disclaimer shown with "90_day_expiry" trigger
4. User acknowledges
5. Timer resets

### Test 3: 10+ Views Threshold
1. User acknowledges disclaimer
2. User views 10 assessments within 24 hours
3. On 11th view, acknowledgment required
4. User acknowledges
5. Counter resets

### Test 4: Version Update
1. User has acknowledged v1.0.0
2. Admin activates v1.1.0
3. User views assessment
4. Disclaimer shown with "version_update" trigger
5. User acknowledges new version

### Test 5: Signals Hub Mirror
1. Repeat all above tests in Signals Hub
2. Verify same triggers fire
3. Verify compact UI displays correctly
4. Verify acknowledgments are shared across views

---

## Migration Path

### Step 1: Deploy Database Migration
```bash
# Run migration
supabase migration up 20260127_disclaimer_acknowledgment.sql
```

### Step 2: Seed Initial Version
```sql
-- Already included in migration
-- Version v1.0.0 with placeholder content
```

### Step 3: Deploy API Routes
- `/api/aura-fx/disclaimer/check`
- `/api/aura-fx/disclaimer/acknowledge`

### Step 4: Deploy Components
- `<DisclaimerBanner />`
- `<CompactDisclaimerBanner />`
- `useDisclaimerState()` hook

### Step 5: Update Assessment Views
- Add disclaimer to existing assessment pages
- Add disclaimer to Signals Hub

### Step 6: Replace Placeholder Content
- Work with legal team to finalize methodology text
- Update `disclaimer_versions` table
- Increment version number

---

## Monitoring & Analytics

### Key Metrics to Track

1. **Acknowledgment Rate**
   - % of users who acknowledge on first view
   - Time to acknowledgment

2. **Trigger Distribution**
   - How many acknowledgments per trigger type
   - Most common re-acknowledgment reason

3. **View Patterns**
   - Average views per user per day
   - Users hitting 10+ threshold

4. **Version Adoption**
   - Time to 100% acknowledgment after version update

### Queries

```sql
-- Acknowledgment rate by trigger
SELECT 
  acknowledgment_trigger,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at))) as avg_time_to_ack
FROM user_disclaimer_acknowledgments
GROUP BY acknowledgment_trigger;

-- Users hitting 10+ view threshold
SELECT 
  user_id,
  COUNT(*) as views_24h
FROM user_assessment_views
WHERE viewed_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id
HAVING COUNT(*) >= 10;

-- Version adoption rate
SELECT 
  disclaimer_version,
  COUNT(DISTINCT user_id) as unique_users,
  MAX(acknowledged_at) as last_acknowledgment
FROM user_disclaimer_acknowledgments
GROUP BY disclaimer_version
ORDER BY last_acknowledgment DESC;
```

---

## Maintenance

### Updating Disclaimer Content

```sql
-- 1. Deactivate old version
UPDATE disclaimer_versions
SET is_active = false
WHERE version = 'v1.0.0';

-- 2. Insert new version
INSERT INTO disclaimer_versions (
  version,
  content,
  methodology_content,
  effective_date,
  is_active
) VALUES (
  'v1.1.0',
  'Updated disclaimer text...',
  'Updated methodology...',
  NOW(),
  true
);

-- 3. All users will be prompted to re-acknowledge on next view
```

### Cleanup Old Data

```sql
-- Run periodically (e.g., monthly)
-- Keeps last 30 days of view records
DELETE FROM user_assessment_views
WHERE viewed_at < NOW() - INTERVAL '30 days';

-- Keep all acknowledgment records (audit trail)
```

---

## Confirmation: Signals Hub Mirrors Behavior

✅ **Same Triggers**: 90-day, 10+ views, version updates  
✅ **Same Logging**: Views and acknowledgments tracked identically  
✅ **Same Content**: Uses same disclaimer version  
✅ **Same API**: Uses same endpoints  
✅ **Same Hook**: Uses same `useDisclaimerState()` hook  
✅ **Different UI**: Compact banner + separate modal  
✅ **Always Visible**: Disclaimer never hidden in either view  

**Result**: Complete behavioral parity with appropriate UI adaptation for list vs detail views.
